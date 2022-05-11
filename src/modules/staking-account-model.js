import BN from 'bn.js';
import { when, decorate, observable } from 'mobx';
import { RewardModel } from './reward-model';
import { RewardModelBackend } from './reward-model-backend';
import { cachedCallWithRetries } from './utils';
import * as api from './api';
//const solanaWeb3 = require('./index.cjs.js');
const solanaWeb3 = require('@velas/web3');

class StakingAccountModel {
  account = null;
  myStake = null;
  network = null;
  validatorsBackend = null;
  isActivated = null;
  connection = null;
  rewards = null;
  rewardsStatus = 'NotLoaded';
  isActivationRequested = false;
  _activeStake = null;
  _inactiveStake = null;
  _state = null;

  get address() {
    return this.account.pubkey;
  }

  get publicKey() {
    return this.account.pubkey;
  }

  get validatorAddress() {
    return this.account.voter;
  }

  get activeStake() {
    if (!this._activeStake)
      this.requestActivation();
    return this._activeStake;
  }

  get inactiveStake() {
    if (!this._inactiveStake)
      this.requestActivation();
    return this._inactiveStake;
  }

  get state() {
    if (!this._state)
      this.requestActivation();
    return this._state;
  }

  get isRewardsLoading() {
    switch (this.rewardsStatus) {
      case 'NotLoaded':
        return true;
      case '1Loaded':
        return false;
      case 'LoadingMore':
        return true;
      case 'LoadedAll':
        return false;
    }
    console.error('Invalid rewardsStatus', this.rewardsStatus);
    return false;
  }

  get activeStakeIsLoading() {
    return this.isActivationRequested;
  }

  async requestActivation() {

      if (this.isActivationRequested) {
        return;
      }
      //console.log("[requestActivation] start");
      const start = Date.now();
      this.isActivationRequested = true;

      const activationRes = await cachedCallWithRetries(
        this.network,
        [
          'getStakeActivation',
          this.connection,
          new solanaWeb3.PublicKey(this.account.pubkey),
        ],
        async () => {
          try {
            return await this.connection.getStakeActivation(
              new solanaWeb3.PublicKey(this.account.pubkey)
            );
          } catch (e) {
            if (
              !e.message ||
              !e.message.includes('failed to get Stake Activation')
            ) {
              // this is quite unsafe to throw errors in getters
              //throw e;
            }
            console.warn(e);
            return null;
          }
        }
      );
      if (!activationRes) {
        console.warn('Invalid activation response');
        this._activeStake = new BN(0);
        this._inactiveStake = new BN(0);
        this._state = 'inactive';
        return;
      }
      const { active, inactive, state } = activationRes;
      this._activeStake = new BN(active + '', 10);
      this._inactiveStake = new BN(inactive + '', 10);
      this._state = state;
      const end = Date.now();
      //console.log("[requestActivation] end", (end - start)/1000 , ' seconds');
  }

  async loadMoreRewardsFromNodeRpc() {
    switch (this.rewardsStatus) {
      case 'NotLoaded':
        break;
      case '1Loaded':
        break;
      case 'LoadingMore':
        return;
      case 'LoadedAll':
        return;
    }
    this.rewards = [];
    this.rewardsStatus = 'LoadingMore';
    for (let i = 0; i < 10; i++) {
      const {
        firstNormalEpoch,
        firstNormalSlot,
        leaderScheduleSlotOffset,
        slotsPerEpoch,
        warmup,
      } = await this.getEpochSchedule();
      const epoch = await this.getLastEpoch();
      const firstSlotInEpoch =
        (epoch - i - firstNormalEpoch) * slotsPerEpoch + firstNormalSlot;
      const blockNumberResult = await this.getConfirmedBlocksWithLimit(
        firstSlotInEpoch
      );
      const blockResult = await this.getConfirmedBlock(
        blockNumberResult.result[0]
      );
      const address = this.address;
      const rewards = blockResult.rewards
        .filter((r) => r.pubkey === address)
        .map(
          (reward) =>
            new RewardModel(
              reward,
              epoch - i - 1,
              this.connection,
              this.network
            )
        );
      this.rewards = this.rewards.concat(rewards);
    }
    this.rewardsStatus = 'LoadedAll';
  }

  async loadRewardsFromBackend() {
    switch (this.rewardsStatus) {
      case 'NotLoaded':
        break;
      case '1Loaded':
        break;
      case 'LoadingMore':
        return;
      case 'LoadedAll':
        return;
    }
    if (!this.validatorsBackend) {
      throw new Error('No validatorsBackend url!');
    }
    this.rewards = [];
    this.rewardsStatus = 'LoadingMore';
    const { staker, voter } = this.account;

    const rewards = await api.getRewardsFromBackendCachedWithRetries({
      network: this.network,
      validatorsBackend: this.validatorsBackend,
      params: { staker, voter },
    });
    this.rewards = rewards.map(
      (reward) =>
        new RewardModelBackend(
          reward.lamports,
          reward.postBalance,
          reward.epoch,
          reward.apr
        )
    );
    this.rewardsStatus = 'LoadedAll';
  }

  async loadMoreRewards() {
    try {
      await this.loadRewardsFromBackend();
    } catch (error) {
      console.log('loadRewardsFromBackend error: ', error);
      // Use slower nethod
      await this.loadMoreRewardsFromNodeRpc();
    }
  }

  constructor(account, connection, network, validatorsBackend = null) {
    this.connection = connection;
    this.network = network;
    this.account = account;
    this.validatorsBackend = validatorsBackend;
    const {
      lamports,
      activationEpoch,
      deactivationEpoch,
      rentExemptReserve,
      withdrawer,
      stake,
      pubkey,
      staker,
      voter,
    } = account;
    if (stake) {
      this.isActivated = deactivationEpoch === '18446744073709551615';
    } else {
      this.isActivated = false;
    }
    this.myStake = new BN(lamports + '', 10);

    decorate(this, {
      rewardsStatus: observable,
      rewards: observable,
      _activeStake: observable,
      _inactiveStake: observable,
      _state: observable,
      activeStakeIsLoading: observable,
    });
  }
  // fetchEpochRewards = (address, activationEpoch, cb)->
  //     return cb null, [] if (not store.staking.chosenAccount.validator? or store.staking.chosenAccount.validator.toString!.length is 0)
  //     err, epochSchedule <- as-callback(web3t.velas.NativeStaking.getEpochSchedule!)
  //     console.error err if err?
  //     {firstNormalEpoch, firstNormalSlot, leaderScheduleSlotOffset, slotsPerEpoch, warmup} = epochSchedule
  //     err, slot <- as-callback(web3t.velas.NativeStaking.getSlot!)
  //     console.error err if err?
  //     err, firstAvailableBlock <- as-callback(web3t.velas.NativeStaking.getFirstAvailableBlock!)
  //     console.error err if err?
  //     err, epochInfo <- as-callback web3t.velas.NativeStaking.getCurrentEpochInfo()
  //     console.error err if err?
  //     return cb null if err?
  //     { epoch } = epochInfo
  //     # make loop here!
  //     err, rewards <- query-rewards-loop(address, activationEpoch, firstNormalSlot, slotsPerEpoch, firstAvailableBlock, firstNormalEpoch, epoch)
  //     cb null, rewards

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

  async getLastEpoch() {
    const info = await this.getEpochInfo();
    const { epoch } = info;
    if (this.isActivated || !this.account || !this.account.stake) {
      return epoch;
    }
    const { deactivationEpoch } = this.account;
    return Math.min(parseInt(deactivationEpoch) + 1, epoch);
  }
}
export { StakingAccountModel };
