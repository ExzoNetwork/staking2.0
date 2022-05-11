import { decorate, observable, action, when } from 'mobx';
import BN from 'bn.js';
import { StakingAccountModel } from './staking-account-model.js';
import { cachedCallWithRetries } from './utils';
import { rewardsStore } from './rewards-store';
//const solanaWeb3 = require('./index.cjs.js');
//const solanaWeb3 = require('@velas/web3');

//import * as solanaWeb3 from '@velas/web3';
const solanaWeb3 = {}

class ValidatorModelBacked {
  network = null;
  backendData = null;
  connection = null;
  stakingAccounts = [];

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
    let myStake = new BN(0);
    for (let i = 0; i < this.stakingAccounts.length; i++) {
      const account = this.stakingAccounts[i];
      myStake = myStake.add(account.myStake);
    }
    return myStake;
  }

  get apr() {
    return this.backendData.apr;
  }

  get commission() {
    return this.backendData.commission;
  }

  get rewards() {
    let rewards = new Map();
    for (let acc of this.stakingAccounts) {
      if (acc.rewards === null) {
        return null;
      }
      for (const reward of acc.rewards) {
        if (!reward.amount) continue;
        if (!rewards.has(reward.epoch)) {
          rewards.set(reward.epoch, {
            epoch: reward.epoch,
            amount: reward.amount,
            apr: reward.apr || 0,
            postBalance: reward.solanaReward
              ? reward.solanaReward.postBalance
              : 0,
          });
          continue;
        }
        const prev = rewards.get(reward.epoch);
        if (reward.apr && reward.solanaReward) {
          const postBalance =
            reward.solanaReward.postBalance + prev.postBalance;
          rewards.set(reward.epoch, {
            epoch: reward.epoch,
            amount: prev.amount.add(reward.amount),
            apr:
              (prev.apr * prev.postBalance +
                reward.apr * reward.solanaReward.postBalance) /
              postBalance,
            postBalance,
          });
          continue;
        }
        if (prev) {
          rewards.set(reward.epoch, {
            epoch: reward.epoch,
            amount: prev.amount.add(reward.amount),
            apr: prev.apr,
            postBalance: prev.postBalance,
          });
        }
      }
    }
    return Array.from(rewards.values()).sort((a, b) => b.epoch - a.epoch);
  }

  get isRewardsLoading() {
    for (let acc of this.stakingAccounts) {
      if (acc.isRewardsLoading) {
        return true;
      }
    }
    return false;
  }

  get totalActiveStake() {
    let total = new BN(0);

    for (let acc of this.stakingAccounts) {
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

    for (let acc of this.stakingAccounts) {
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

    for (let acc of this.stakingAccounts) {
      if (!acc.state) {
        return null;
      }
      total = total.add(acc.inactiveStake);
    }
    return total;
  }

  get totalActivatingStake() {
    let total = new BN(0);

    for (let acc of this.stakingAccounts) {
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

    for (let acc of this.stakingAccounts) {
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

    for (let acc of this.stakingAccounts) {
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
    let totalInactive = new BN(0);
    for (let acc of this.stakingAccounts) {
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
      totalInactive = totalInactive.add(acc.inactiveStake);
    }

    return totalInactive;
  }

  async loadMoreRewards() {
    return await Promise.all(
      this.stakingAccounts.map(async (acc) => await acc.loadMoreRewards())
    );
  }

  constructor(backendData, connection, network) {
    if (!backendData || !backendData.address) {
      throw new Error('backendData invalid');
    }
    this.backendData = backendData;
    this.connection = connection;
    this.network = network;
    decorate(this, {
      backendData: observable,
    });
  }

  addStakingAccount(stakingAccount) {
    if (!stakingAccount || !(stakingAccount instanceof StakingAccountModel)) {
      throw new Error('stakingAccount invalid');
    }
    this.stakingAccounts.push(stakingAccount);
  }
}

export { ValidatorModelBacked };
