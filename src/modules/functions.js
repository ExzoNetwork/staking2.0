import { PublicKey } from '@velas/web3';
import { findIndex } from 'prelude-ls';
import { StakingAccountModel } from './staking-account-model.js';


export const formNewStakeAccount = async function(params) {
  const {
    connection,
    network,
    validatorsBackend,
    newStakePubkey,
  } = params;
  const commitment = 'confirmed';
  if (!connection) throw new Error('[creationAccountSubscribe] connection is required!');

  const accountInfo = await connection.getParsedAccountInfo(newStakePubkey, 'confirmed');
  const account = parseStakeAccount({accountInfo: accountInfo.value, newStakePubkey});
  const stakeAccountModel = new StakingAccountModel(account, connection, network, validatorsBackend);
  return stakeAccountModel;
}



export const parseStakeAccount = function({accountInfo, newStakePubkey}) {

  if (!accountInfo || !accountInfo.data)
    throw new Error('[addStakeAccount] data prop was now defined in stake account object');

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
