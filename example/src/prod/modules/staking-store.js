import { decorate, observable, action, when } from 'mobx';
import BN from 'bn.js';
import bs58 from 'bs58';
import { ValidatorModel } from './validator-model.js';
import { ValidatorModelBacked } from './validator-model-backed.js';
import { StakingAccountModel } from './staking-account-model.js';
import fetch from 'cross-fetch';
import {Buffer} from 'buffer';
import _ from 'lodash';
//const solanaWeb3 = require('./index.cjs.js');
//import * as solanaWeb3 from './index.cjs.js';
//import * as solanaWeb3 from '@velas/web3';
import { StakeProgram, Account, PublicKey, Connection, Transaction, Lockup, Authorized } from '@velas/web3';

import crypto from 'isomorphic-webcrypto';
import Web3 from 'web3';
import * as api from './api';
import { rewardsStore } from './rewards-store';
import { cachedCallWithRetries, callWithRetries, invalidateCache, transformNodeRpcGetParsedProgramAccountsToBackendFormat } from './utils';

import EvmToNativeBridgeAbi from './EvmToNativeBridge.js';
import * as ethereum from 'ethereumjs-tx';
import Common from 'ethereumjs-common';
// import Store from "../wallet/data-scheme.js";

const PRESERVE_BALANCE = new BN('1000000000', 10);
const MAX_INSTRUCTIONS_PER_WITHDRAW = 18;
const WITHDRAW_TX_SIZE_MORE_THAN_EXPECTED_CODE = 102;

// const  = mobx;
async function tryFixCrypto() {
  try {
    if (global.globalThis && global.globalThis.crypto === crypto) return;
    await crypto.ensureSecure();
    if (global.globalThis && global.globalThis.crypto === crypto) return;
    const originalDigest = crypto.subtle.digest.bind(crypto.subtle);
    crypto.subtle.digest = (algorithm, buffer) => {
      if (typeof algorithm === 'string') {
        algorithm = { name: algorithm };
      }
      return originalDigest(algorithm, buffer);
    };
    if (!global.globalThis) {
      global.globalThis = {};
    }
    global.globalThis.crypto = crypto;
  } catch (e) {
    console.log('Cannot fix crypto', e.message);
  }
}

tryFixCrypto();

const MIN_VALIDATOR_STAKE = new BN('1000000000000000', 10);

class StakingStore {
  validators = null;
  accounts = null;
  vlxEvmBalance = null;
  vlxNativeBalance = null;
  validatorDetailsLoading = false;
  isRefreshing = false;
  rent = null;
  seedUsed = Object.create(null);
  connection = null;
  openedValidatorAddress = null;
  evmAddress = null;
  epochInfo = null;
  network = null;
  evmAPI = '';
  publicKey = null;
  _currentSort = null;
  getValidatorsError = null;
  isLoading = false;
  txsArr = new Array(20).fill({state:""});

  constructor(config) {

    const {
      API_HOST,
      evmAPI,
      validatorsBackend,
      publicKey,
      evmAddress,
      evmPrivateKey,
      network,
      nativePrivateKey,
      nativeApi,
    } = config;
    this.refresh = config.refresh;
    this.secretKey = bs58.decode(nativePrivateKey);
    //const publicKeyBuffer = {"data": [175, 102, 145, 237, 171, 197, 51, 43, 232, 19, 173, 90, 60, 193, 229, 148, 133, 170, 191, 102, 23, 245, 139, 32, 56, 241, 184, 208, 245, 20, 86, 221], "type": "Buffer"}
    this.publicKey58 = publicKey;
    this.publicKey = new PublicKey(publicKey);
    this.connection = new Connection(nativeApi, 'confirmed');
    this.evmAddress = evmAddress;
    this.evmPrivateKey = evmPrivateKey;
    this.network = network;
    this.evmAPI = evmAPI;
    this.validatorsBackend = validatorsBackend;
    this.validatorDetailsLoading = false;
    this.getValidatorsError = null;
    this.isLoading = false;
    this.txsProgress = this.txsArr;
    this.actionLabel = null;
//    this.setTxsProgress()
    this.web3 = new Web3(new Web3.providers.HttpProvider(evmAPI));
    invalidateCache();
    decorate(this, {
      connection: observable,
      validators: observable,
      vlxEvmBalance: observable,
      vlxNativeBalance: observable,
      isRefreshing: observable,
      validatorDetailsLoading: observable,
      accounts: observable,
      openedValidatorAddress: observable,
      epochInfo: observable,
      _currentSort: observable,
      getValidatorsError: observable,
      isLoading: observable,
      txsProgress: observable,
      actionLabel: observable,
      refresh: observable,
    });
    this.startRefresh = action(this.startRefresh);
    this.endRefresh = action(this.endRefresh);
    this.init();
  }

  async reloadWithRetryAndCleanCache() {
    invalidateCache();
    await this.reloadWithRetry();
  }

  async init() {
    await tryFixCrypto();
    await this.reloadWithRetry();
  }

  async reloadWithRetry() {
    if (this.isRefreshing) {
      return await when(() => !this.isRefreshing);
    }
    this.isLoading = true;
    this.isRefreshing = true;
    try {
      await callWithRetries(
        async () => {
          await this.reloadFromBackend();
        },
        ['reloadFromBackend'],
        3,
      );
    } catch (e) {
      console.warn('[reloadFromBackend] error, will load from node rpc: ', e);

      // Cannot load from backend. Use slower method.
      await rewardsStore.setConnection({
        connection: this.connection,
        network: this.network,
        validatorsBackend: this.validatorsBackend,
      });
      await this.reloadFromNodeRpc();
    }
    await when(() => this.validators && this.validators.length > 0);

    const validators = this.validators || [];
    if (validators.replace)
      this.sort === 'total_staked'
        ? validators.replace(
            validators
              .slice()
              .sort((v1, v2) => v2.activeStake - v1.activeStake)
          )
        : validators.replace(
          validators
            .slice()
            .sort(
              (v1, v2) =>
                v2.apr -
                v1.apr -
                (v1.activeStake && v1.activeStake.gte(MIN_VALIDATOR_STAKE)
                  ? 1000
                  : 0) +
                (v2.activeStake && v2.activeStake.gte(MIN_VALIDATOR_STAKE)
                  ? 1000
                  : 0) -
                (v1.status === 'active' ? 2000 : 0) +
                (v2.status === 'active' ? 2000 : 0)
            )
        );
    //}
    this.isRefreshing = false;
    this.isLoading = false;
  }

  setTxsProgress(value) {
    this.txsProgress = value;
  }

  async sortActiveStake() {
    if (this.validators.length > 0) {
      await when(
        () =>
          this.validators &&
          this.validators.length &&
          this.validators[0].activeStake !== null
      );
      this.validators.replace(
        this.validators
          .slice()
          .sort((v1, v2) => v2.activeStake - v1.activeStake)
      );
    }
  }

  async sortApr() {
    if (this.validators.length > 0) {
      await when(
        () =>
          this.validators &&
          this.validators.length &&
          this.validators[0].apr !== null
      );
      this.validators.replace(
        this.validators.slice().sort((v1, v2) => v2.apr - v1.apr)
      );
    }
  }

  async getEpochInfo() {
    return await cachedCallWithRetries(
      this.network,
      ['getEpochInfo', this.connection],
      () => this.connection.getEpochInfo()
    );
  }


  loadEpochInfo = async () => {
    const info = await this.getEpochInfo();
    return info;
  };

  async reloadFromBackend() {
    this.startRefresh();

    const _result = await Promise.allSettled([
      this.loadEpochInfo(),
      this.connection.getBalance(this.publicKey),
      fetch(this.evmAPI, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: `{"jsonrpc":"2.0","id":${Date.now()},"method":"eth_getBalance","params":["${
          this.evmAddress
        }","latest"]}`,
      }),
      fetch(`${this.validatorsBackend}/v1/validators`),
    ]);
    const epochInfo = _result[0].status === 'fulfilled' ? _result[0].value : null;
    const balanceRes = _result[1].status === 'fulfilled' ? _result[1].value : [];
    const balanceEvmRes = _result[2].status === 'fulfilled' ? _result[2].value : [];
    const validatorsFromBackendResult = _result[3].status === 'fulfilled' ? _result[3].value : _result[3].reason;

    let nativeAccountsFromBackendResult = null;

    try {
      nativeAccountsFromBackendResult = await api.getStakingAccountsFromBackendCachedWithRetries({
        network: this.network,
        validatorsBackend: this.validatorsBackend,
        params: {staker: this.publicKey58},
      });

    } catch (error) {
      throw new Error(error);
    }

    let validatorsFromBackend = [];
    this.getValidatorsError = null;
    if (validatorsFromBackendResult && validatorsFromBackendResult.error){
       this.getValidatorsError = validatorsFromBackendResult.error;
       this.isRefreshing = false;
    } else if (validatorsFromBackendResult && validatorsFromBackendResult.message && validatorsFromBackendResult.message === 'Network request failed'){
      this.getValidatorsError = validatorsFromBackendResult.message;
      this.isRefreshing = false;
    } else {
       validatorsFromBackend = validatorsFromBackendResult && validatorsFromBackendResult.json ? await validatorsFromBackendResult.json() : null;
    }

    const result =
      await Promise.allSettled([
        balanceEvmRes.json ? await balanceEvmRes.json() : null,
      ]);

    const balanceEvmJson = result[0] && result[0].status === 'fulfilled' ? result[0].value : null;
    const stakingAccounts = (nativeAccountsFromBackendResult || []).map(
      (account) =>
        new StakingAccountModel(account, this.connection, this.network, this.validatorsBackend)
    );

    const tmp = validatorsFromBackend && validatorsFromBackend.validators ? validatorsFromBackend.validators : (validatorsFromBackend || []);
    const validators = (tmp || []).map(
      (validator) =>
        new ValidatorModelBacked(validator, this.connection, this.network)
    );

    const validatorsMap = Object.create(null);
    for (var i = 0; i < validators.length; i++) {
      validatorsMap[validators[i].address] = validators[i];
    }
    for (var i = 0; i < stakingAccounts.length; i++) {
      const account = stakingAccounts[i];
      const validator = validatorsMap[account.validatorAddress];
      if (!validator) {
        if (account.isActivated) {
          console.warn(
            'Validator for account not found',
            account.validatorAddress
          );
        }
        continue;
      }
      validator.addStakingAccount(account);
    }
    const rent = await this.connection.getMinimumBalanceForRentExemption(200);
    this.endRefresh(
      balanceRes,
      balanceEvmJson,
      rent,
      validators,
      stakingAccounts,
      epochInfo
    );
  }

  async reloadFromNodeRpc() {
    this.startRefresh();
    const epochInfo = await this.loadEpochInfo();
    const balanceRes = await this.connection.getBalance(this.publicKey);
    const balanceEvmRes = await fetch(this.evmAPI, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: `{"jsonrpc":"2.0","id":${Date.now()},"method":"eth_getBalance","params":["${
        this.evmAddress
      }","latest"]}`,
    });
    const balanceEvmJson = await balanceEvmRes.json();
    const {current, delinquent} = await this.connection.getVoteAccounts();

    const filter = {
      memcmp: {
        offset: 0xc,
        bytes: this.publicKey58,
      },
    };
    const nativeAccounts = await this.connection.getParsedProgramAccounts(
      StakeProgram.programId,
      {
        filters: [filter],
        commitment: 'confirmed',
      }
    );

    const filteredAccounts = nativeAccounts.filter((account) => {
      return (
        account?.account?.data?.parsed?.info?.meta?.authorized?.staker ===
        this.publicKey58
      );
    });
    const stakingAccounts = (filteredAccounts || []).map(
      (account) =>
        new StakingAccountModel(
          transformNodeRpcGetParsedProgramAccountsToBackendFormat(account),
          this.connection,
          this.network,
          null
        )
    );
    const validators = (current || [])
      .map(
        (validator) =>
          new ValidatorModel(validator, false, this.connection, this.network)
      )
      .concat(
        (delinquent || []).map(
          (validator) =>
            new ValidatorModel(validator, true, this.connection, this.network)
        )
      );
    const validatorsMap = Object.create(null);
    for (var i = 0; i < validators.length; i++) {
      validatorsMap[validators[i].address] = validators[i];
    }
    for (var i = 0; i < stakingAccounts.length; i++) {
      const account = stakingAccounts[i];
      const validator = validatorsMap[account.validatorAddress];
      if (!validator) {
        if (account.isActivated) {
          console.warn(
            'Validator for account not found',
            account.validatorAddress
          );
        }
        continue;
      }
      validator.addStakingAccount(account);
    }
    const rent = await this.connection.getMinimumBalanceForRentExemption(200);
    this.endRefresh(
      balanceRes,
      balanceEvmJson,
      rent,
      validators,
      stakingAccounts,
      epochInfo
    );
  }

  startRefresh = () => {
    this.validators = null;
    this.accounts = null;
    this.rent = null;
    this.vlxNativeBalance = null;
    this.vlxEvmBalance = null;
    this.epochInfo = null;
  };

  endRefresh = (
    balanceRes,
    balanceEvmJson,
    rent,
    validators,
    stakingAccounts,
    epochInfo
  ) => {
    this.vlxNativeBalance = balanceRes ? new BN(balanceRes + '', 10) : new BN('0');
    this.vlxEvmBalance = balanceEvmJson ? new BN(balanceEvmJson.result.substr(2), 16).div(
      new BN(1e9)
    ) : new BN('0');
    this.rent = rent ? new BN(rent) : new BN('0');
    this.validators = validators || [] ;
    this.accounts = stakingAccounts || [];
    this.epochInfo = epochInfo;
  };

  getStakedValidators = () => {
    if (!this.validators) {
      return [];
    }
    return this.validators.filter((validator) => !validator.myStake.isZero());
  }

  getNotStakedValidators = () => {
    if (!this.validators) {
      return [];
    }
    return this.validators.filter((v) => {
      const { myStake } = v;
      return myStake.isZero()
      }
    );
  }
  getAllValidators = () => {
    if (!this.validators) {
      return null;
    }
    return this.validators.filter((validator) => validator.myStake);
  }
  getValidatorDetails = () => {
    const validatorAddress = this.openedValidatorAddress;
    if (typeof validatorAddress !== 'string') {
//      throw new Error('openedValidatorAddress need to be set');
        return null;
    }
    if (!this.validators) return null;
    const validator = this.validators.find(
      ({ address }) => address === validatorAddress
    );
    if (!validator) {
      return null;
      //throw new Error('Validator not found');
    }

    return {
      address: validatorAddress,
      identity: validator.identity,
      dominance: this.getDominance(validator),
      quality: this.getQuality(validator),
      annualPercentageRate: this.getAnnualRate(validator),
      apr: validator.apr,
      commission: validator.commission,
      status: validator.status,
      myStake: validator.myStake,
      activeStake: validator.activeStake,
      stakeDataIsLoaded: (!validator.myStake) || validator.myStake.isZero() ||
        (validator.totalActiveStake !== null && validator.totalInactiveStake !== null),
      name: validator.name,
      available_balance: this.getBalance(),
      myActiveStake:
        validator.totalActiveStake &&
        validator.totalInactiveStake &&
        (!validator.totalActiveStake.isZero() ||
          !validator.totalInactiveStake.isZero() ||
          null) &&
        validator.totalActiveStake
          .mul(new BN(100))
          .div(validator.totalActiveStake.add(validator.totalInactiveStake))
          .toString(10),
      totalWithdrawRequested: validator.totalWithdrawRequested,
      availableWithdrawRequested: validator.availableWithdrawRequested,
      totalActiveStake: validator.totalActiveStake,
      totalActivatingStake: validator.totalActivatingStake,
      totalDeactivatingStake: validator.totalDeactivatingStake,
      totalInactiveStake: validator.totalInactiveStake,
      totalAvailableForWithdrawRequestStake:
        validator.totalAvailableForWithdrawRequestStake,
    };
  }
  getRewards = () => {
    const validatorAddress = this.openedValidatorAddress;
    if (typeof validatorAddress !== 'string') {
      throw new Error('openedValidatorAddress need to be set');
    }
    const validator = this.validators.find(
      ({ address }) => address === validatorAddress
    );
    if (!validator) {
      throw new Error('Validator not found');
    }
    return {
      rewards: validator.rewards || [],
      isLoading: validator.isRewardsLoading,
    };
  }

  loadMoreRewards = async () => {
    const validatorAddress = this.openedValidatorAddress;
    if (typeof validatorAddress !== 'string' || !this.validators) {
      return;
    }
    const validator = this.validators.find(
      ({ address }) => address === validatorAddress
    );
    if (!validator) {
      return;
    }
    await validator.loadMoreRewards();
  };

  getDominance(validator) {
    if (!this.validators) {
      return null;
    }
    const activeValidators = this.validators.filter(
      (v) => v.status === 'active'
    );
    let totalStake = new BN(0);
    for (let i = 0; i < activeValidators.length; i++) {
      totalStake = totalStake.add(activeValidators[i].activeStake);
    }
    let part =
      validator.activeStake.mul(new BN(1000)).div(totalStake).toNumber() / 1000;

    return part - 1 / activeValidators.length;
  }

  getQuality(validator) {
    if (!this.validators) {
      return null;
    }
    const activeValidators = this.validators.filter(
      (v) => v.status === 'active'
    );
    let sumBlocks = 0;
    for (let i = 0; i < activeValidators.length; i++) {
      sumBlocks = +activeValidators[i].lastBlock;
    }
    return validator.lastBlock - sumBlocks;
  }

  getBalance() {
    if (!this.vlxEvmBalance || !this.vlxNativeBalance) {
      return null;
    }
    return this.vlxEvmBalance.add(this.vlxNativeBalance);
  }

  getAnnualRate(validator) {
    return validator.apr ? (validator.apr * 100).toFixed(2) : 0;
  }

  async getNextSeed() {
    const fromPubkey = this.publicKey;
    const addressesHs = Object.create(null);
    await when(() => !!this.accounts);
    for (let i = 0; i < this.accounts.length; i++) {
      addressesHs[this.accounts[i].address] = true;
    }

    let i = 0;
    while (true) {
      const stakePublilcKey = await PublicKey.createWithSeed(
        fromPubkey,
        i.toString(),
        StakeProgram.programId
      );
      const toBase58 = stakePublilcKey.toBase58();
      if (!addressesHs[toBase58] && !this.seedUsed[i]) {
        break;
      }
      i++;
    }
    this.seedUsed[i] = true;
    return i.toString();
  }

  async sendTransaction(transaction) {
    try {
      const feePayer = this.publicKey;
      const { blockhash } = await this.connection.getRecentBlockhash();

      transaction.recentBlockhash = blockhash;
      transaction.feePayer = feePayer;
    } catch (e) {
      return {
        error: 'cunstruct_transaction_error',
        description: e.message,
      };
    }

    const payAccount = new Account(this.secretKey);
    let result = await this.connection.sendTransaction(transaction, [
      payAccount,
    ]);

    return result;
  }

  waitTransactionMined(txHash, interval, resolve, reject) {
    const self = this;
    const transactionReceiptAsync = () => {
      this.web3.eth.getTransactionReceipt(txHash, (error, receipt) => {
        if (error) {
          reject(error);
        } else if (receipt == null) {
          setTimeout(
            () => transactionReceiptAsync(),
            interval ? interval : 500
          );
        } else {
          resolve(receipt);
        }
      });
    };
    transactionReceiptAsync();
  }

  async swapEvmToNative(swapAmount) {
    const evmToNativeBridgeContract = this.web3.eth
      .contract(EvmToNativeBridgeAbi.abi)
      .at('0x56454c41532d434841494e000000000053574150');
    const nativeHexAddress = "0x" + bs58.decode(this.publicKey.toString()).toString('hex');
    const data = evmToNativeBridgeContract.transferToNative.getData(
      nativeHexAddress
    );

    const privateKey = Buffer.from(this.evmPrivateKey.substr(2), 'hex');
    const nonce = await new Promise((resolve, reject) => {
      this.web3.eth.getTransactionCount(
        this.evmAddress,
        'pending',
        (err, value) => {
          if (err) return reject(err);
          resolve(value);
        }
      );
    });
    let chainId = this.network === 'mainnet' ? 106 : 111;
    const customCommon = Common.forCustomChain(
      'mainnet',
      {
        name: 'velas',
        networkId: chainId,
        chainId: chainId,
      },
      'istanbul'
    );

    var rawTx = {
      nonce,
      gasPrice: '0x' + (3000000000).toString(16),
      gasLimit: '0x' + (210000).toString(16),
      to: '0x56454c41532d434841494e000000000053574150',
      value: '0x' + swapAmount.mul(new BN(1e9)).toString(16),
      data,
    };

    var tx = new ethereum.Transaction(rawTx, { common: customCommon });
    try {
      tx.sign(privateKey);
    } catch(err) {
      return Promise.reject(err);
    }

    var serializedTx = tx.serialize();
    return await new Promise((resolve, reject) => {
      this.web3.eth.sendRawTransaction(
        '0x' + serializedTx.toString('hex'),
        (err, transactionHash) => {
          if (err) {
            return reject(err);
          }
          this.waitTransactionMined(transactionHash, 1000, resolve, reject);
        }
      );
    });
  }

  async stake(address, amount_sol) {
    const transaction = new Transaction();
    const swapAmount = this.getSwapAmountByStakeAmount(amount_sol);
    const rent = this.rent;
    const fromPubkey = this.publicKey;
    const authorized = new Authorized(fromPubkey, fromPubkey);
    const lamportsBN = new BN(amount_sol).add(rent);
    let seed = await this.getNextSeed();
    const votePubkey = new PublicKey(address);

    const stakePubkey = await PublicKey.createWithSeed(
      fromPubkey,
      seed,
      StakeProgram.programId
    );
    const lockup = new Lockup(0, 0, fromPubkey);

    const config = {
      authorized,
      basePubkey: fromPubkey,
      fromPubkey,
      lamports: lamportsBN.toString(),
      lockup,
      seed,
      stakePubkey,
    };
    if (!swapAmount.isZero()) {
      await this.swapEvmToNative(swapAmount);
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    transaction.add(StakeProgram.createAccountWithSeed(config));
    transaction.add(
      StakeProgram.delegate({
        authorizedPubkey: fromPubkey,
        stakePubkey,
        votePubkey,
      })
    );
    try{
      const result = await this.sendTransaction(transaction);
      if (result.error){
        return result;
      }
      await this.reloadWithRetryAndCleanCache();
      return result;
    } catch (err) {
      return {error: err};
    }
  }

  getSwapAmountByStakeAmount(amountStr) {
    const amount =
      typeof amountStr === 'string'
        ? new BN((amountStr * 1e9))
        : amountStr;
    if (!this.vlxNativeBalance) {
      return null;
    }
    if (this.vlxNativeBalance.gte(amount.add(PRESERVE_BALANCE))) {
      return new BN(0);
    }
    if (!this.vlxEvmBalance) {
      return null;
    }
    if (this.vlxNativeBalance.add(this.vlxEvmBalance).lt(amount)) {
      return null;
    }

    if (
      this.vlxNativeBalance
        .add(this.vlxEvmBalance)
        .lte(amount.add(PRESERVE_BALANCE))
    ) {
      return this.vlxEvmBalance;
    }

    return amount.add(PRESERVE_BALANCE).sub(this.vlxNativeBalance);
  }

  async splitStakeAccountTransaction(stakeAccount, lamports) {
    if (typeof lamports === 'string') {
      lamports = new BN(lamports, 10);
    }
    let transaction = null;
    const authorizedPubkey = this.publicKey;
    const stakePubkey = new PublicKey(stakeAccount.address);
    const rent = this.rent;
    const seed = await this.getNextSeed();
    const splitStakePubkey = await PublicKey.createWithSeed(
      authorizedPubkey,
      seed,
      StakeProgram.programId
    );

    const params = {
      stakePubkey,
      authorizedPubkey,
      splitStakePubkey,
      lamports: lamports.add(rent),
      seed,
      basePubkey: authorizedPubkey,
    };

    return StakeProgram.splitWithSeed(params);
    // return await this.sendTransaction(transaction);
  }

  async undelegateTransaction(stakePubkey) {
    const transaction = new Transaction();
    const authorizedPubkey = this.publicKey;

    transaction.add(
      StakeProgram.deactivate({
        authorizedPubkey,
        stakePubkey,
      })
    );
    return transaction;
    // return await this.sendTransaction(transaction);
  }

  updateTx(tx, arrIndex) {
    this.txsProgress[arrIndex].transaction = tx.transaction;
    this.txsProgress[arrIndex].sendAmount = tx.sendAmount;
    this.txsProgress[arrIndex].state = tx.state;
  }

  // JUST Request
  async requestWithdraw(address, amount) {
    if (!this.validators) {
      throw new Error('Not loaded');
    }
    this.actionLabel = 'request_withdraw';
    let transaction = null;
    this.txsProgress = this.txsArr;
    let sendAmount = new BN('0');
    const authorizedPubkey = this.publicKey;
    const { blockhash } = await this.connection.getRecentBlockhash();
    let txs = [];
    let arrIndex = 0;
    //const transaction = new Transaction();
    const validator = this.validators.find((v) => v.address === address);
    if (!validator) {
      throw new Error('Not found');
    }
    const sortedAccounts = validator.stakingAccounts
      .filter((a) => a.state === 'active' || a.state === 'activating')
      .filter((a) => {
        var unixTimestamp = a.unixTimestamp || a.account.lockupUnixTimestamp;
        return (
          !unixTimestamp ||
          new BN(unixTimestamp).lt(new BN(Date.now() / 1000))
        );
      })
      .sort((a, b) => b.myStake.cmp(a.myStake));
    let totalStake = new BN(0);
    if (typeof amount === 'string') {
      amount = new BN((parseFloat(amount) * Math.pow(10,9)));
    }
    for (let i = 0; i < sortedAccounts.length; i++) {
      totalStake = totalStake.add(sortedAccounts[i].myStake);
    }
    if (totalStake.sub(new BN(10000000)).lt(amount)) {
      amount = totalStake;
    }
    let i = 0;
    while (!amount.isZero() && !amount.isNeg()) {
      const account = sortedAccounts.pop();
      if (!transaction) {
        transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = authorizedPubkey;
      }
      if ((i !== 0) && (i % MAX_INSTRUCTIONS_PER_WITHDRAW === 0)) {
        this.updateTx({transaction, sendAmount, state: ""}, arrIndex);
        arrIndex++;
        sendAmount = new BN('0');
        transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = authorizedPubkey;
      }
      i++;
      sendAmount = sendAmount.add(account.myStake)

      if (amount.gte(account.myStake)) {
        transaction.add(await this.undelegateTransaction(account.publicKey));
        amount = amount.sub(account.myStake);
      } else {
        transaction.add(
          await this.splitStakeAccountTransaction(
            account,
            account.myStake.sub(amount)
          )
        );
        transaction.add(await this.undelegateTransaction(account.publicKey));
        break;
      }
    }

    this.updateTx({transaction,sendAmount, state: ""}, arrIndex);
    arrIndex++;

    if (this.txsProgress.filter(it => it.transaction).length > 1)
      return {error: true, code: WITHDRAW_TX_SIZE_MORE_THAN_EXPECTED_CODE};

    const res = await this.sendTransaction(transaction);
    if (res.error){
      return res;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await this.reloadWithRetryAndCleanCache();
    return res;
  }

  getTransactionByteSize(transaction) {
    if (!transaction || typeof transaction.serializeMessage !== 'function'){
      throw new Error('Cannot get transaction byte size');
    }
    const clone = _.cloneDeep(transaction);
    return clone.serializeMessage().length + 65;
  }

  async withdrawRequested(address) {
    let transaction = null;
    let sendAmount = new BN('0');
    const authorizedPubkey = this.publicKey;
    const { blockhash } = await this.connection.getRecentBlockhash();

    this.txsProgress = this.txsArr;
    let txs = [];
    let arrIndex = 0;
    this.actionLabel = 'withdraw';

    await when(() => !!this.accounts);
    var filteredAccounts = [];
    for (let i = 0; i < this.accounts.length; i++) {
      var account = this.accounts[i];
      var unixTimestamp = account.unixTimestamp || account.account.lockupUnixTimestamp;

      if (account.validatorAddress !== address) continue;
      if (unixTimestamp > Date.now() / 1000) continue;
      const { inactive, state } = await this.connection.getStakeActivation(
        new PublicKey(account.publicKey)
      );
      if (!inactive || (state !== 'inactive' && state !== 'deactivating')) {
        continue;
      }
      filteredAccounts.push(account);
    }

    const txsCount = Math.ceil(filteredAccounts.length / MAX_INSTRUCTIONS_PER_WITHDRAW);

    for (let i = 0; i < filteredAccounts.length; i++) {
      const account = filteredAccounts[i];
      if (!transaction) {
        transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = authorizedPubkey;
      }

      if ((i !== 0) && (i % MAX_INSTRUCTIONS_PER_WITHDRAW === 0)) {
        this.updateTx({transaction,sendAmount, state: ""}, arrIndex);
        arrIndex++;

        sendAmount = new BN('0');
        transaction = new Transaction();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = authorizedPubkey;
      }

      sendAmount = sendAmount.add(account.myStake)

      try {
        transaction.add(
          StakeProgram.withdraw({
            authorizedPubkey,
            stakePubkey: account.publicKey,
            lamports:
              account.state === 'inactive'
                ? parseFloat(account.myStake.toString(10))
                : parseFloat(account._inactiveStake.add(this.rent).toString(10)),
            toPubkey: authorizedPubkey,
          })
        );
      } catch (e) {
        console.warn(e);
      }
    }
    this.updateTx({transaction,sendAmount, state: ""}, arrIndex);
    arrIndex++;

    if (this.txsProgress.filter(it => it.transaction).length > 1)
      return {error: true, code: WITHDRAW_TX_SIZE_MORE_THAN_EXPECTED_CODE};

    const res = await this.sendTransaction(transaction);
    if (res.error){
      return res;
    }
    await new Promise((resolve) => setTimeout(resolve, 2000));
    await this.reloadWithRetryAndCleanCache();
    return res;
  }

  checkTxConfirmation(arg$, cb) {
    const start = arg$.start;
    const tx = arg$.tx;
    const conn = this.connection;
    return async function(){
      if (Date.now() > start + 60000) {
        return cb("Transaction approve timeout has expired. Try to repeat later.");
      }
      if (!conn) return cb('this.connection is not defined')
      const info = await conn.getTransaction(tx, 'confirmed');

      if(info.meta && info.meta.err){
        return cb(info.meta.err);
      }
      if(info.meta && info.meta.status && (info.meta.status.Ok !== undefined)) {
        return cb(null, info);
      }

    };
  };

  checkTx (arg$, cb) {
    const start = arg$.start;
    const tx = arg$.tx;
    const $this = this;
    const timerCb = function(err, res){
      clearInterval($this.checkTx["timer_"+tx]);
      return cb(err, res);
    };
    return $this.checkTx["timer_"+tx] = setInterval(this.checkTxConfirmation({
      start: start,
      tx: tx
    }, timerCb), 1000);
  }

  get sort() {
    return this._currentSort || localStorage.sort;
  }

  set sort(value) {
    localStorage.sort = value;
    this._currentSort = value;
  }
}

export { StakingStore };