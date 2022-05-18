import fetch from 'cross-fetch';
import {cachedCallWithRetries} from './utils';

export const getStakingAccountsFromBackend = async ({
  validatorsBackend,
  params = null,
}) => {
  const nativeAccountsFromBackendResult = await fetch(
    params
      ? `${validatorsBackend}/v1/staking-accounts?` +
          new URLSearchParams({
            staker: params?.staker,
          })
      : `${validatorsBackend}/v1/staking-accounts`
  );
  const nativeAccounts = await nativeAccountsFromBackendResult.json();
  const stakingAccounts = nativeAccounts ? nativeAccounts.stakingAccounts : [];

  return stakingAccounts;
};

export const getRewardsFromBackend = async ({validatorsBackend, params}) => {
  const rewardsResult = await fetch(
    `${validatorsBackend}/v1/rewards?` +
      new URLSearchParams({
        staker: params?.staker,
        voter: params?.voter,
      })
  );
  const {rewards} = await rewardsResult.json();
  return rewards;
};

export const getStakingAccountsFromBackendCachedWithRetries = async ({
  network,
  validatorsBackend,
  params,
}) =>
  await cachedCallWithRetries(
    network,
    ['getStakingAccountsFromBackend', validatorsBackend, params?.staker],
    async () =>
      await getStakingAccountsFromBackend({validatorsBackend, params}),
    5
  );

export const getRewardsFromBackendCachedWithRetries = async ({
  network,
  validatorsBackend,
  params,
}) =>
  await cachedCallWithRetries(
    network,
    ['getRewardsFromBackend', validatorsBackend, params?.staker, params?.voter],
    async () => await getRewardsFromBackend({validatorsBackend, params}),
    3
  );
