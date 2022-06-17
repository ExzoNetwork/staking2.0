import { PublicKey } from '@velas/web3';
import { findIndex } from 'prelude-ls';
import { StakingAccountModel } from './staking-account-model.js';

let subscriptionIDs = {};


export const subscribeToStakeAccount =  ({ account, publicKey, connection, cb, onAccountChangeCallback }) => {
  if (!account) {
    console.error("cannot subscribe to account", publicKey.toString())
    return;
  };
  const { pubkey } = account;
  if (account.subscriptionID || subscriptionIDs[`${pubkey}`]){
    console.error("ignore subscribtion to account (subscriptionIDs has row)", publicKey.toString())
    if (cb) return cb(null);
    return;
  }
  const commitment = 'confirmed';
  const callback = onAccountChangeCallback(account);

  const subscriptionID = connection.onAccountChange(publicKey, callback, commitment);
  subscriptionIDs[`${pubkey}`] = subscriptionID;
  account.subscriptionID = subscriptionID;
}

export const updateStakeAccount =  (params) => {
  const { connection, accounts, account, updatedAccount, validator, cb } = params;
  if (!accounts) throw new Error("[updateStakeAccount] accounts must be defined");

  if (!account) {
    //updateStakeAccount[account.pubkey] = null;
    console.log("No account was found", {updatedAccount});
    return;
  }

  const importAll = (obj, src) => {
    for (var key in src) obj[key] = src[key];
    return obj;
  }
  //updateStakeAccount[account.pubkey] = account.pubkey;

  const { lamports, lamportsStr, data } = updatedAccount;
  if (!data || !data.parsed || !data.parsed.info) {
    const index = findIndex( (it) => {
      return it.pubkey === account.pubkey;
    })(accounts);
    console.log("index of updated account is: ", index)
    //Remove from staking accounts list
    if (index > -1) {
      accounts.splice(index, 1);
      if (account.subscriptionID) {
        delete subscriptionIDs[`${account.pubkey}`];
        //Deregister an account notification callback
        console.log("Deregister an account notification callback", account.subscriptionID);
        connection.removeAccountChangeListener(account.subscriptionID);
      }
    }
    if (validator) {
      console.log("=== remove === (functions.js)")
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

export const formNewStakeAccount = async function(params) {
  const {
    connection,
    network,
    validatorsBackend,
    newStakePubkey,
    isWebSocketAvailable,
  } = params;
  const commitment = 'confirmed';
  if (!isWebSocketAvailable) return;
  if (!connection) throw new Error('[creationAccountSubscribe] connection is required!');

  const accountInfo = await connection.getParsedAccountInfo(newStakePubkey, 'confirmed');
  const account = parseStakeAccount({accountInfo: accountInfo.value, newStakePubkey});
  const stakeAccountModel = new StakingAccountModel(account, connection, network, validatorsBackend);
  return stakeAccountModel;
}

export const creationAccountSubscribe = async function(params){
  const {
    accounts,
    connection,
    validatorsBackend,
    network,
    newStakePubkey,
    isWebSocketAvailable,
    onAccountChangeCallback,
    currentValidator,
  } = params;
  const commitment = 'confirmed';

  if (!isWebSocketAvailable) return;
  if (!connection) throw new Error('[creationAccountSubscribe] connection is required!');

  const accountInfo = await connection.getParsedAccountInfo(newStakePubkey, 'confirmed');
  const account = parseStakeAccount({accountInfo: accountInfo.value, newStakePubkey});
  subscribeToStakeAccount(
    {
      account,
      publicKey: new PublicKey(account.pubkey),
      accounts,
      connection,
      onAccountChangeCallback,
    }
  );
  // Add new stake account into this.accounts from staking-store.js
  const stakeAccountModel = new StakingAccountModel(account, connection, network, validatorsBackend);
  accounts.push(stakeAccountModel);
  if (currentValidator) {
    currentValidator.addStakingAccount(stakeAccountModel);
  }
};

export const parseStakeAccount = function({accountInfo, newStakePubkey}) {

  if (!accountInfo || !accountInfo.data){
    console.log("[parseStakeAccount] data", {accountInfo, newStakePubkey})
    throw new Error('[parseStakeAccount] data prop was now defined in stake account object');
  }

  const { data, lamports, lamportsStr, rentEpoch } = accountInfo;
  const { info, type } = data.parsed;
  const { meta, stake } = info;
  const { creditsObserved, delegation } = stake;
  const { authorized, lockup, rentExemptReserve } = meta;
  const { epoch, unixTimestamp } = lockup;
  const { activationEpoch, deactivationEpoch, voter, warmupCooldownRate } = delegation;
  const _stake = delegation.stake;
  const { staker, withdrawer } = authorized;

  const account = {
    activationEpoch,
    creditsObserved,
    custodian: staker,
    deactivationEpoch,
    epoch,
    lamports,
    lockupUnixTimestamp: unixTimestamp,
    pubkey: newStakePubkey,
    rentExemptReserve,
    staker,
    voter,
    withdrawer,
  };
  return account;
};
