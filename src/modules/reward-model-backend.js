import BN from 'bn.js';

class RewardModelBackend {
  epoch = null;
  apr = null;
  solanaReward = null;

  get amount() {
    return new BN(this.solanaReward ? this.solanaReward.lamports + '' : 0, 10);
  }

  constructor(lamports, postBalance, epoch, apr) {
    this.solanaReward = { lamports, postBalance };
    this.epoch = epoch;
    this.apr = apr;
  }
}
export { RewardModelBackend };