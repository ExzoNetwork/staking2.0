import { ManyKeysMap } from './many-keys-map.js';

const cacheMap = new ManyKeysMap();

export async function invalidateCache() {
  cacheMap.clear();
}

export function deleteCacheByKey(keys) {
  return cacheMap.delete(keys);
}

export async function cachedCallWithRetries(network, params, call, maxTries) {
  var params$ = params;
  if (network && params$ && params$.unshift) {
    params$.unshift(network);
  }
  if (!cacheMap.has(params$)) {
    const res = callWithRetries(call, params, maxTries);
    cacheMap.set(params, res);
    return res;
  } else {
    return cacheMap.get(params$);
  }
}

export async function callWithRetries(call, params, maxTries = 5) {
  let tries = 0;
  let timeout = null;
  while (true) {
    try {
      return await call();
    } catch (e) {
      console.error(e, params && params.map((o) => o.toString()).join());
      tries++;
      if (tries >= maxTries) {
        console.log("MAX tries!");
        return Promise.reject({error: '[callWithRetries] MAX_TRIES_ERROR # ' + ((params || []).map((o) => o.toString()).join())} );
      };
      console.log('[callWithRetries] try # ', tries, ' of ', maxTries);
      await new Promise(
        (resolve) => (timeout = setTimeout(resolve, 1000 * tries))
      );
    }
  }
}

export const transformNodeRpcGetParsedProgramAccountsToBackendFormat = (
  nodeRpcStakingAccount
) => {
  const { account, pubkey } = nodeRpcStakingAccount;

  return {
    voter: account?.data?.parsed?.info?.stake?.delegation?.voter || null,
    activationEpoch:
      account?.data?.parsed?.info?.stake?.delegation?.activationEpoch || null,
    deactivationEpoch:
      account?.data?.parsed?.info?.stake?.delegation?.deactivationEpoch || null,
    rentExemptReserve:
      account?.data?.parsed?.info?.meta?.rentExemptReserve || null,
    pubkey: pubkey?.toBase58() || null,
    lamports: account?.lamportsStr || account?.lamports,
    staker: account?.data?.parsed?.info?.meta?.authorized?.staker || null,
    withdrawer:
      account?.data?.parsed?.info?.meta?.authorized?.withdrawer || null,
    custodian: account?.data?.parsed?.info?.meta?.lockup?.custodian || null,
    epoch: account?.data?.parsed?.info?.meta?.lockup?.epoch,
    lockupUnixTimestamp:
      account?.data?.parsed?.info?.meta?.lockup?.unixTimestamp,
    creditsObserved: account?.data?.parsed?.info?.stake?.creditsObserved,
  };
};

export const promisify = (f, that = this) => {
  return function (...args) {
    return new Promise((resolve, reject) => {
      function callback(err, ...results) {
        if (err) {
          return reject(err);
        } else {
          resolve(results.length === 1 ? results[0] : results);
        }
      }

      args.push(callback);

      f.call(that, ...args);
    });
  };
};