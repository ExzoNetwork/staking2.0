import { PublicKey } from '@velas/web3';
import { findIndex } from 'prelude-ls';
import { StakingAccountModel } from './staking-account-model.js';

const getParsedAccountInfo = async (pubkey, config) => {
  const { connection, start } = config;
  const now = Date.now();
  const ONE_MINUTE = 60 * 1000;
  if ((now - start) > ONE_MINUTE) {
    console.error(`getParsedAccountInfo ${ONE_MINUTE} timeout expired. Failed getting ${pubkey} account info.`);
    return null;
  }
  const accountInfo = await connection.getParsedAccountInfo(pubkey, 'confirmed');
  if (!accountInfo?.value) {
    const res = getParsedAccountInfo(pubkey, config);
    return res;
  }
  return accountInfo;
}

export const formNewStakeAccount = async (params) => {
  const {
    connection,
    network,
    validatorsBackend,
    newStakePubkey,
  } = params;
  const commitment = 'confirmed';
  if (!connection) throw new Error('[creationAccountSubscribe] connection is required!');

  const accountInfo = await getParsedAccountInfo(newStakePubkey, { connection, start: Date.now() });

  let stakeAccountModel = null;
  try {
    const account = parseStakeAccount({accountInfo: accountInfo?.value, newStakePubkey});
    stakeAccountModel = new StakingAccountModel(account, connection, network, validatorsBackend);
  } catch (err) {
    console.error(err);
  }
  return stakeAccountModel;
}



export const parseStakeAccount = function({accountInfo, newStakePubkey}) {

  if (!accountInfo || !accountInfo.data)
    throw new Error('[addStakeAccount] data prop was not defined in stake account object');

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
    pubkey: newStakePubkey.toString(),
    rentExemptReserve,
    staker,
    validator: voter,
    voter,
    withdrawer,
  };
  return account;
};
