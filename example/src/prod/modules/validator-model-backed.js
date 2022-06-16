import { decorate, observable, toJS, isObservableArray  } from 'mobx';
import BN from 'bn.js';
import { findIndex } from 'prelude-ls';
import { StakingAccountModel } from './staking-account-model.js';
import { cachedCallWithRetries } from './utils';
import { rewardsStore } from './rewards-store';
import { subscribeToStakeAccount, parseStakeAccount } from './functions';
import { PublicKey } from '@velas/web3';
//const solanaWeb3 = require('./index.cjs.js');
//const solanaWeb3 = require('@velas/web3');

//import * as solanaWeb3 from '@velas/web3';
const solanaWeb3 = {}

class ValidatorModelBacked {
  network = null;
  backendData = null;
  connection = null;
  _myStake = new BN(0);
  totalInactive = new BN(0);
  stakingAccountsKV = {};
  subscriptionIDs = {};

  get status() {
    return this.backendData.status;
  }

  get address() {
    return this.backendData.address;
  }

  get name() {
    return this.backendData.name;
  }

  get lastBlock() {
    return this.backendData.lastVote;
  }

  get activeStake() {
    return new BN(this.backendData.activeStake, 10);
  }

  get identity() {
    return this.backendData.nodePubKey;
  }

  get totalStakers() {
    return this.backendData.totalStakers;
  }

  get myStake() {
    this._myStake = new BN(0);
    for (let i = 0; i < this.backendData.stakingAccounts.length; i++) {
      const account = this.backendData.stakingAccounts[i];
      this._myStake = this._myStake.add(account.myStake);
    }
    return this._myStake;
  }

  set myStake(amount) {
    this._myStake = amount;
  }

  get apr() {
    return this.backendData.apr;
  }

  get commission() {
    return this.backendData.commission;
  }

  get stakingAccounts(){
    return this.backendData.stakingAccounts;
  }

  set stakingAccounts(accs){
    this.backendData.stakingAccounts = accs;
  }

  get rewards() {
    if (this.backendData.stakingAccounts.length === 0) {
      return null;
    }
    // when loading from be we get aggregated rewards for staking-accounts, so we can use 1 staking account in app to store them
    const acc = this.backendData.stakingAccounts[0];
    if (acc.rewards === null) {
      return null;
    }

    // with mobx acc.rewards became ObservableArray and breaks display logic
    if(isObservableArray(acc.rewards)) {
      return toJS(acc.rewards);
    }
    return acc.rewards;
  }

  get isRewardsLoading() {
    for (let acc of this.backendData.stakingAccounts) {
      if (acc.isRewardsLoading) {
        return true;
      }
    }
    return false;
  }

  get totalActiveStake() {
    let total = new BN(0);

    for (let acc of this.backendData.stakingAccounts) {
      if (!acc.state) {
        return null;
      }
      if (acc.state !== 'activating' && acc.state !== 'active') {
        continue;
      }
      total = total.add(acc.activeStake);
    }
    return total;
  }

  get totalAvailableForWithdrawRequestStake() {
    let total = new BN(0);

    for (let acc of this.backendData.stakingAccounts) {
      if (!acc.state) {
        return null;
      }
      if (acc.state !== 'activating' && acc.state !== 'active') {
        continue;
      }
      const unixTimestamp = acc.unixTimestamp;
      if (unixTimestamp) {
        const now = Date.now() / 1000;
        if (unixTimestamp > now) continue;
      }

      total = total.add(acc.activeStake).add(acc.inactiveStake);
    }
    return total;
  }

  get totalInactiveStake() {
    let total = new BN(0);

    for (let acc of this.backendData.stakingAccounts) {
      if (!acc.state) {
        return null;
      }
      total = total.add(acc.inactiveStake);
    }
    return total;
  }

  get totalActivatingStake() {
    let total = new BN(0);

    for (let acc of this.backendData.stakingAccounts) {
      if (!acc.state) {
        return null;
      }
      if (acc.state !== 'activating') {
        continue;
      }
      if (!acc.activeStake) {
        return null;
      }
      total = total.add(acc.activeStake);
    }
    return total;
  }

  get totalDeactivatingStake() {
    let total = new BN(0);

    for (let acc of this.backendData.stakingAccounts) {
      if (!acc.state) {
        return null;
      }
      if (acc.state !== 'deactivating') {
        continue;
      }
      if (acc.activeStake === null) {
        return null;
      }
      total = total.add(acc.activeStake);
    }
    return total;
  }

  get totalWithdrawRequested() {
    let total = new BN(0);

    for (let acc of this.backendData.stakingAccounts) {
      if (!acc.state) {
        return null;
      }
      if (acc.state !== 'deactivating') {
        continue;
      }
      if (!acc.activeStake) {
        return null;
      }
      const unixTimestamp = acc.unixTimestamp;
      if (unixTimestamp) {
        const now = Date.now() / 1000;
        if (unixTimestamp > now) continue;
      }
      total = total.add(acc.activeStake);
    }
    return total;
  }

  get availableWithdrawRequested() {
    this.totalInactive = new BN(0);
    for (let acc of this.backendData.stakingAccounts) {
      if (!acc.state) {
        return null;
      }
      if (acc.state !== 'inactive' && acc.state !== 'deactivating') {
        continue;
      }
      if (!acc.inactiveStake) {
        return null;
      }
      const unixTimestamp = acc.unixTimestamp;
      if (unixTimestamp) {
        const now = Date.now() / 1000;
        if (unixTimestamp > now) continue;
      }
      this.totalInactive = this.totalInactive.add(acc.inactiveStake);
    }
    return this.totalInactive;
  }

  set availableWithdrawRequested(amount) {
    this.totalInactive = amount;
  }

  async loadMoreRewards() {
    // when loading from be we get aggregated rewards for staking-accounts, so we can make request only for one staking account to get all rewards
    if (this.backendData.stakingAccounts.length === 0) {
      return [];
    }
    return await this.backendData.stakingAccounts[0].loadMoreRewards();
  }

  constructor(backendData, connection, network) {
    if (!backendData || !backendData.address) {
      throw new Error('backendData invalid');
    }
    this.backendData = backendData;
    this.connection = connection;
    this.network = network;
    backendData.stakingAccounts = [];
    decorate(this, {
      backendData: observable,
    });
  }

  onAccountChangeCallback = (accountModel) => async (updatedAccount) => {
    const account = accountModel;
    this.updateStakeAccount(
      {
        account,
        updatedAccount,
        validator: this,
      }
    );
    this.requestStakeAccountsActivation(true);
  }


  updateStakeAccount(params) {
    const { account, updatedAccount, validator, cb } = params;

    if (!account) {
      console.log("No account was found");
      return;
    }

    const importAll = (obj, src) => {
      for (var key in src) obj[key] = src[key];
      return obj;
    }
    this.updateStakeAccount[account.pubkey] = account.pubkey;

    const { lamports, lamportsStr, data } = updatedAccount;
    if (!data || !data.parsed || !data.parsed.info) {
      //this.removeStakingAccount(account);
      const index = findIndex( (it) => {
        return it.pubkey === account.pubkey;
      })(this.backendData.stakingAccounts);

      //Remove from staking accounts list
      if (index > -1) {
        if (account.subscriptionID) {
          delete this.subscriptionIDs[`${account.pubkey}`];
          //Deregister an account notification callback
          console.log("Deregister an account notification callback", account.subscriptionID);
          this.connection.removeAccountChangeListener(account.subscriptionID);
        }
      }
      if (validator) {
        validator.removeStakingAccount(params.account);
      }
    } else {
      const { meta, stake } = data.parsed.info;
      const { lockup, rentExemptReserve, authorized } = meta;
      const creditsObserved = stake.creditsObserved || 0;
      const delegation = stake.delegation;
      const activationEpoch = delegation.activationEpoch || 0;
      const deactivationEpoch = delegation.deactivationEpoch || 0;
      const _stake = delegation.stake || 0;
      const voter = delegation.voter;

      const parsedAccount = parseStakeAccount({accountInfo: updatedAccount, newStakePubkey: account.pubkey});

      const updates = {
        lamports: updatedAccount.lamports,
        stake: _stake,
        validator: voter,
        voter,
        rentExemptReserve,
        creditsObserved,
        activationEpoch,
        deactivationEpoch }
      importAll(account, updates);
    }
  }


  removeStakingAccount(stakingAccount) {
//    if (!stakingAccount || !(stakingAccount instanceof StakingAccountModel)) {
//      throw new Error('stakingAccount invalid');
//    }
    const index = this.backendData.stakingAccounts.findIndex((it) => {return it.address === stakingAccount.address});
    if (index > -1) {
      this.backendData.stakingAccounts = this.backendData.stakingAccounts.splice(index, 1);
      delete this.stakingAccountsKV[stakingAccount.address]
    }
  }

  addStakingAccount(stakingAccount, requestActivation=false) {
    if (!stakingAccount || !(stakingAccount instanceof StakingAccountModel)) {
      throw new Error('stakingAccount invalid');
    }
    if (this.stakingAccountsKV[stakingAccount.address])
      return;

    subscribeToStakeAccount(
      {
        account: stakingAccount.account,
        accounts: this.backendData.stakingAccounts,
        connection: this.connection,
        publicKey: new PublicKey(stakingAccount.publicKey),
        onAccountChangeCallback: this.onAccountChangeCallback,
      }
    );

    this.backendData.stakingAccounts.push(stakingAccount);
    this.stakingAccountsKV[stakingAccount.address] = true;
    if (requestActivation)
      this.requestStakeAccountsActivation(true);
  }

  async requestStakeAccountsActivation(force=false) {
    let accounts = this.backendData.stakingAccounts;
    let i = 0;
    for (let account of accounts) {
      if (force) {
        account.isActivationRequested = false;
      }
      try{
        const res = await account.requestActivation();
        //Suppose this stake account was already withdrawed.
        const IS_ACCOUNT_NOT_FOUND_ERROR =
          (res?.error?.message || "").indexOf("account not found") > -1;
        if (res && res.error && IS_ACCOUNT_NOT_FOUND_ERROR) {
          const accountAddress = res.address;
          const index = findIndex( (it) => {
            return it.account.pubkey === accountAddress;
          })(this.backendData.stakingAccounts);
          this.backendData.stakingAccounts.splice(index, 1);
        }
      } catch (err){
        console.warn("requestStakeAccountsActivation caught", err);
      }
      i++;
    }
  }
}

export { ValidatorModelBacked };
