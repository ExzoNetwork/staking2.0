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
    if (this.stakingAccounts.length === 0) {
      return null;
    }
    // when loading from be we get aggregated rewards for staking-accounts, so we can use 1 staking account in app to store them
    const acc = this.stakingAccounts[0];
    if (acc.rewards === null) {
      return null;
    }

    return acc.rewards;
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
    // when loading from be we get aggregated rewards for staking-accounts, so we can make request only for one staking account to get all rewards
    if (this.stakingAccounts.length === 0) {
      return [];
    }
    return await this.stakingAccounts[0].loadMoreRewards();
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