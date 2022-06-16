import { decorate, observable, runInAction } from 'mobx';
import * as api from './api';
import { cachedCallWithRetries, promisify, transformNodeRpcGetParsedProgramAccountsToBackendFormat } from './utils';
import { RewardModel } from './reward-model';
//const solanaWeb3 = require('./index.cjs.js');
const solanaWeb3 = require('@velas/web3');

//import * as solanaWeb3 from '@velas/web3';

class RewardsStore {
  connection = null;
  network = null;
  isLatestRewardsLoading = null;
  validatorsBackend = null;

  constructor() {
    decorate(this, {
      isLatestRewardsLoading: observable,
      latestRewardsPerValidator: observable,
    });
  }

  async setConnection({connection, network, validatorsBackend}) {
    this.network = network;
    this.connection = connection;
    this.validatorsBackend = validatorsBackend;
    await promisify(this.loadLatestRewards, this)();
  }

  setlatestRewardsPerValidator = (tmpMap, epoch, cb) => {
    runInAction(() => {
      this.getEpochDuration(epoch - 1, (epochDuration) => {
        tmpMap.forEach((value, key) => {
          let maxAmount = -1;
          let biggestReward = null;
          for (let reward of value)
            if (reward.lamports > maxAmount) {
              maxAmount = reward.lamports;
              biggestReward = reward;
            }
            
          // Here we load calc apr for each RewardModel
          let rm = new RewardModel(
            biggestReward,
            epoch - 1,
            this.connection,
            this.network,
            epochDuration
          );
          this.latestRewardsPerValidator.set(key, [rm]);
        });
        cb();
      });
    });
  };

  getLatestRewardsOfVaildator(address, cb) {
    if (!this.latestRewardsPerValidator) {
      return cb([]);
    }
    return cb(this.latestRewardsPerValidator.get(address) || []);
  }

  loadLatestRewards(cb) {
    runInAction(() => {
      if (this.isLatestRewardsLoading) {
        return;
      }
      this.isLatestRewardsLoading = true;
    });
    this.getAccounts()
      .then((accounts) => {
        const accountMap = new Map();
        for (let account of accounts) {
          accountMap.set(account.pubkey, account);
        }
        this.getEpochSchedule()
          .then((res) => {
            let firstNormalEpoch = res.firstNormalEpoch;
            let firstNormalSlot = res.firstNormalSlot;
            let leaderScheduleSlotOffset = res.leaderScheduleSlotOffset;
            let slotsPerEpoch = res.slotsPerEpoch;
            let warmup = res.warmup;

            this.getEpochInfo()
              .then((resp) => {
                const epoch = resp.epoch;

                const firstSlotInEpoch =
                  (epoch - firstNormalEpoch) * slotsPerEpoch + firstNormalSlot;
                this.getConfirmedBlocksWithLimit(firstSlotInEpoch)
                  .then((blockNumberResult) => {
                    this.getConfirmedBlock(blockNumberResult.result[0])
                      .then((blockResult) => {
                        this.latestRewardsPerValidator = new observable.map();
                        const tmpMap = new Map();
                        for (let reward of blockResult.rewards) {
                          let account = accountMap.get(reward.pubkey);
                          if (!account || !account.voter) {
                            continue;
                          }
                          const {voter} = account;
                          if (!tmpMap.has(voter)) {
                            tmpMap.set(voter, []);
                            continue;
                          }
                          tmpMap.get(voter).push(reward);
                        }
                        this.setlatestRewardsPerValidator(tmpMap, epoch, () => {
                          runInAction(() => {
                            this.isLatestRewardsLoading = false;
                          });
                          cb();
                        });
                      })
                      .catch((err) => {
                        console.warn('[getConfirmedBlock] error', err);
                      });
                  })
                  .catch((err) => {
                    console.warn('[getConfirmedBlocksWithLimit] error', err);
                  });
              })
              .catch((err) => {
                console.warn('[getEpochInfo] error', err);
              });
          })
          .catch((err) => {
            console.warn('[getEpochSchedule] error', err);
          });
      })
      .catch((err) => {
        console.warn('[getAccounts] error', err);
      });
  }

  async getEpochSchedule() {
    return await cachedCallWithRetries(
      this.network,
      ['getEpochSchedule', this.connection],
      () => this.connection.getEpochSchedule()
    );
  }

  async getEpochInfo() {
    return await cachedCallWithRetries(
      this.network,
      ['getEpochInfo', this.connection],
      () => this.connection.getEpochInfo()
    );
  }

  async getConfirmedBlocksWithLimit(firstSlotInEpoch) {
    return await cachedCallWithRetries(
      this.network,
      ['getConfirmedBlocksWithLimit', this.connection, firstSlotInEpoch, 1],
      () => this.connection.getConfirmedBlocksWithLimit(firstSlotInEpoch, 1)
    );
  }

  async getConfirmedBlock(blockNumber) {
    return await cachedCallWithRetries(
      this.network,
      ['getConfirmedBlock', this.connection, blockNumber],
      () => this.connection.getConfirmedBlock(blockNumber, 'confirmed')
    );
  }

  async getAccountsFromBackend() {
    const stakingAccounts =
      await api.getStakingAccountsFromBackendCachedWithRetries({
        network: this.network,
        validatorsBackend: this.validatorsBackend,
      });
    return stakingAccounts;
  }

  async getAccountsFromNodeRpc() {
    const parsedProgramAccounts = await cachedCallWithRetries(
      this.network,
      [
        'getParsedProgramAccounts',
        this.connection,
        solanaWeb3.StakeProgram.programId.toString(),
      ],
      () =>
        this.connection.getParsedProgramAccounts(
          solanaWeb3.StakeProgram.programId
        ),
      5
    );
    const parsedProgramAccountsInBackendFormat = parsedProgramAccounts.map(
      transformNodeRpcGetParsedProgramAccountsToBackendFormat
    );

    return parsedProgramAccountsInBackendFormat;
  }

  async getAccounts() {
    try {
      return await this.getAccountsFromBackend();
    } catch (error) {
      console.warn(
        '[getAccountsFromBackend] error, will load from node rpc: ',
        error
      );
      // Cannot load from backend. Use slower method.
      return await this.getAccountsFromNodeRpc();
    }
  }

  getEpochTimeTs(epoch, cb) {
    this.getEpochSchedule()
      .then((result) => {
        const firstSlotInEpoch =
          (epoch - result.firstNormalEpoch) * result.slotsPerEpoch +
          result.firstNormalSlot;
        this.getConfirmedBlocksWithLimit(firstSlotInEpoch)
          .then((blockNumberResult) => {
            if (
              !blockNumberResult.result ||
              blockNumberResult.result.length === 0
            ) {
              return cb(0);
            }
            this.getConfirmedBlock(blockNumberResult.result[0])
              .then((blockResult) => {
                if (!blockResult) return cb(0);
                if (!blockResult.blockTime) {
                  console.error('[getConfirmedBlock] blocktime is not defined');
                  return cb(0);
                }

                return cb(blockResult.blockTime);
              })
              .catch((err) => console.error('[getConfirmedBlock Error]', err));
          })
          .catch((err) =>
            console.error('[getConfirmedBlocksWithLimit Error]', err)
          );
      })
      .catch((err) => console.error('[getEpochSchedule Error]', err));
  }

  getEpochDuration(epoch, cb) {
    this.getEpochTimeTs(epoch + 1, (epochEndTime) => {
      this.getEpochTimeTs(epoch, (epochStartTime) => {
        const epochDuration = epochEndTime - epochStartTime;
        cb(epochDuration);
      });
    });
  }
}

export const rewardsStore = new RewardsStore();
