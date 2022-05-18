import mobx from 'mobx';
import BN from 'bn.js';
import process from 'process';
import { StakingStore } from './staking-store.js';
import crypto from 'isomorphic-webcrypto';
global.crypto = crypto;
const { when } = mobx;

async function main() {
  try {
    const store = new StakingStore(
      'https://api.velas.com',
      Buffer.from([
        65, 87, 4, 128, 34, 253, 218, 182, 113, 17, 153, 217, 86, 212, 89, 235,
        181, 151, 54, 250, 195, 146, 157, 104, 100, 227, 247, 119, 126, 192,
        200, 28, 140, 76, 72, 237, 33, 55, 72, 35, 172, 244, 48, 2, 220, 38,
        158, 160, 220, 241, 240, 66, 94, 36, 92, 241, 249, 241, 43, 62, 140,
        117, 12, 228,
      ]),
      'ASfYaQ5xGT6oXaDdoBJGBkERAH4LsP9jjrokcnT9tRzb'
    );
    await when(() => !store.isRefreshing);
    console.log(store.getStakedValidators().length);
    console.log(store.getNotStakedValidators().length);
    console.log(
      await store.stake(
        'HJTuBeLvvcnC9aNLwcWDq5k83wmPEHo5z4xDHK1pid6f',
        '1000000000'
      )
    );
    console.log('Stake done');
    await when(() => !store.isRefreshing);
    console.log('Refresh done');
    const searchStake = new BN('1000000000', 10).add(store.rent);
    const acc = store.accounts.find((account) =>
      account.myStake.eq(searchStake)
    );
    if (!acc) {
      console.error('Account not found');
      return;
    }
    console.log('Found acc');
    console.log('Split done', await store.splitStakeAccount(acc, '500000001'));
  } catch (e) {
    console.error(e);
  }
}
// process.on('unhandledRejection', (reason, promise) => {
//     console.log(reason)
// })
// process.on('uncaughtException', (reason) => {
//     console.log(reason)
// })
// process.on('beforeExit', (code) => {
//   console.log('Process beforeExit event with code: ', code);
// });
//
// process.on('exit', (code) => {
//   console.log('Process exit event with code: ', code);
// });

main();
