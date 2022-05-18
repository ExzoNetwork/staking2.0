import BN from 'bn.js';
import { decorate, observable, action } from 'mobx';
import { cachedCallWithRetries } from './utils';

class RewardModel {
  solanaReward = null;
  epoch = null;
  apr = null;
  network = null;
  epochDuration = 0;

  get amount() {
    return new BN(this.solanaReward ? this.solanaReward.lamports + '' : 0, 10);
  }

  async getEpochSchedule() {
    return await cachedCallWithRetries(
      this.network,
      ['getEpochSchedule', this.connection],
      () => this.connection.getEpochSchedule()
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

  constructor(solanaReward, epoch, connection, network, epochDuration = null) {
    this.solanaReward = solanaReward;
    this.connection = connection;
    this.epoch = epoch;
    this.network = network;
    this.epochDuration = epochDuration;
    decorate(this, {
      apr: observable,
    });

    if (this.epochDuration)
      // If list of accounts/validators
      this.calcApr(this.epochDuration);
    // If stake account rewards list
    else this.loadApr();
  }

  async getEpochTimeTs(epoch) {
    const {
      firstNormalEpoch,
      firstNormalSlot,
      leaderScheduleSlotOffset,
      slotsPerEpoch,
      warmup,
    } = await this.getEpochSchedule();
    const firstSlotInEpoch =
      (epoch - firstNormalEpoch) * slotsPerEpoch + firstNormalSlot;
    const blockNumberResult = await this.getConfirmedBlocksWithLimit(
      firstSlotInEpoch
    );
    const blockResult = await this.getConfirmedBlock(
      blockNumberResult.result[0], 'confirmed'
    );
    if (!blockResult.blockTime)
      throw new Error('[getConfirmedBlock] blocktime is not defined');
    return blockResult.blockTime;
  }

  calcApr(epochDuration) {
    const epochsPerYear =
      epochDuration > 0 ? (365.25 * 24 * 3600) / epochDuration : 0;
    const amountPerPerEpoch = this.solanaReward
      ? this.solanaReward.lamports /
        (this.solanaReward.postBalance - this.solanaReward.lamports)
      : 0;

    this.apr = amountPerPerEpoch * epochsPerYear;
  }

  async loadApr() {
    let epochDuration =
      (await this.getEpochTimeTs(this.epoch + 1)) -
      (await this.getEpochTimeTs(this.epoch));
    const epochsPerYear =
      epochDuration > 0 ? (365.25 * 24 * 3600) / epochDuration : 0;
    const amountPerPerEpoch = this.solanaReward
      ? this.solanaReward.lamports /
        (this.solanaReward.postBalance - this.solanaReward.lamports)
      : 0;

    this.apr = amountPerPerEpoch * epochsPerYear;
  }
}
export { RewardModel };
