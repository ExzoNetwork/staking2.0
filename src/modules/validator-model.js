import { decorate, observable, action, when } from 'mobx';
import BN from 'bn.js';
import { StakingAccountModel } from './staking-account-model.js';
import { cachedCallWithRetries } from './utils';
import { rewardsStore } from './rewards-store';
//const solanaWeb3 = require('./index.cjs.js');
//const solanaWeb3 = require('@velas/web3');
import * as solanaWeb3 from '@velas/web3';

class ValidatorModel {
  status = 'active';
  solanaValidator = null;
  stakingAccounts = [];
  network = null;
  apr$ = null;
  name = null;

  get address() {
    return this.solanaValidator.votePubkey;
  }

  get identity() {
    return this.solanaValidator.nodePubkey;
  }

  get lastBlock() {
    return this.solanaValidator.lastVote;
  }

  get totalStakers() {
    return this.solanaValidator.totalStakers;
  }

  get activeStake() {
    return new BN(this.solanaValidator.activatedStake + '', 10);
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
    return this.apr$;
  }

  loadApr() {
    console.log('[loadApr]')
    rewardsStore.getLatestRewardsOfVaildator(this.address, (rewards) => {
      if (!rewards) {
        this.apr$ = null;
      }
      if (rewards.length === 0) {
        this.apr$ = 0;
      } else {
        this.apr$ = rewards[0].apr;
      }
    });
  }

  get commission() {
    return this.solanaValidator.commission;
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

  get activeStakeIsLoading() {
    for (let acc of this.stakingAccounts) {
      console.log({acc})
      if (acc.activeStakeIsLoading) {
        return true;
      }
    }
    return false;
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
      if (acc.lockupUnixTimestamp) {
        const unixTimestamp = acc.lockupUnixTimestamp;
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
      if (acc.lockupUnixTimestamp) {
        const unixTimestamp = acc.lockupUnixTimestamp;
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
      if (acc.lockupUnixTimestamp) {
        const unixTimestamp = acc.lockupUnixTimestamp;
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

  constructor(solanaValidator, isDelinquent, connection, network, config) {
    if (!solanaValidator || !solanaValidator.votePubkey) {
      throw new Error('solanaValidator invalid');
    }
    if (typeof isDelinquent !== 'boolean') {
      throw new Error('isDelinquent bool required');
    }
    if (isDelinquent) {
      this.status = 'inactive';
    }
    this.connection = connection;
    this.solanaValidator = solanaValidator;
    this.name = config?.account?.data?.parsed?.info?.configData?.name || null;
    this.network = network;
    decorate(this, {
      solanaValidator: observable,
      status: observable,
      totalStakers: observable,
      apr$: observable,
    });
    this.loadApr();
    this.loadAccountStats();
  }

  async loadAccountStats() {
    const nativeAccounts = await cachedCallWithRetries(
      this.network,
      [
        'getParsedProgramAccounts',
        this.connection,
        solanaWeb3.StakeProgram.programId.toString(),
      ],
      () =>
        this.connection.getParsedProgramAccounts(
          solanaWeb3.StakeProgram.programId
        )
    );
    this.totalStakers = nativeAccounts.filter(({ account }) => {
      if (
        !account ||
        !account.data.parsed.info ||
        !account.data.parsed.info.stake
      ) {
        return false;
      }
      const { voter } = account.data.parsed.info.stake.delegation;
      return voter === this.address;
    }).length;
    console.log("[loadAccountStats] end");
  }

  updateValidator(solanaValidator, isDelinquent) {
    if (!solanaValidator || !solanaValidator.votePubkey) {
      throw new Error('solanaValidator invalid');
    }
    if (typeof isDelinquent !== 'boolean') {
      throw new Error('isDelinquent bool required');
    }
    this.solanaValidator = solanaValidator;
    if (isDelinquent) {
      this.status = 'inactive';
    } else {
      this.status = 'active';
    }
  }

  addStakingAccount(stakingAccount) {
    if (!stakingAccount || !(stakingAccount instanceof StakingAccountModel)) {
      throw new Error('stakingAccount invalid');
    }
    this.stakingAccounts.push(stakingAccount);
  }
}

export { ValidatorModel };
