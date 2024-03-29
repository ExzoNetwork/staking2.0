import BN from 'bn.js';
import { Fraction } from 'fractional';


const formatBalance = (n) => {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e9)
    return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (n >= 1e9 && n < 1e12) return '≈' + (n / 1e9).toFixed(1) + 'B';
};
const formatValue = (n) => {
  if (n < 1e3) return n;
  if (n >= 1e3 && n < 1e9) return n.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  if (n >= 1e9 && n < 1e12) return '≈' + (n / 1e9).toFixed(1) + 'B';
};
const wrapNumber = (n) => {
  return n.replace(',', '.').replace(/[^0-9\.]/g, '');
};

const formatStakeAmount = (n, config = null) => {
  if (!n) {
    return '...';
  }
  try {
  	if (n instanceof Fraction) {
  		return (n.toString() / 1e9).toString();
		}
    if (Number.isInteger(n) || n.isZero()) {
      return '0';
    }
  } catch(err) {
    console.log("formatStakeAmount err:",err, n);
    return '0';
  }
  if (n.lt(new BN('10000000', 10))) {
    if (config && config.decimals) {
      return (n.toString() / 1e9).toString();
    }
    return '< 0.01';
  }
  n = n.div(new BN('10000000', 10)).toString() / 100;
  return n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};
const formatAmount = (n, config = null) => {
  if (config && config.decimals) {
    return (n.toString() / 1e9).toString();
  }
  n = n.div(new BN('10000000', 10)).toString() / 100;
  return n.toFixed(2);
};
// TO DO for large numbers
const formatReward = (n) => {
  n = n.div(new BN('100000', 10)).toNumber() / 10000;
  return n.toFixed(4);
};

const amountToBN = (amount) => {
  if (!parseFloat(amount)) {
    return new BN(0);
  }
  const parts = amount.split('.');
  if (!parts[1]) {
    return new BN(parts[0] + '000000000', 10);
  }
  return new BN(parts[0] + parts[1] + '000000000'.slice(parts[1].length), 10);
};

const formatToFixed = (num) => {
  const numStr = num.toString();
  return Number(numStr.slice(0, numStr.indexOf('.') + 3));
};

export {
  formatBalance,
  formatValue,
  wrapNumber,
  formatStakeAmount,
  formatReward,
  formatAmount,
  amountToBN,
  formatToFixed,
};
