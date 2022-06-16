import logo from './logo.svg';
import './App.css';
import StakingPage from './prod/index.js';
import { StakingStore } from './prod/modules/staking-store.js';
import React, {useState, useRef, useEffect} from 'react';
import { decorate, observable, action, when } from 'mobx';


/*
  * Initialize and render staking 2.0 module.
  * @param { Object> } config - staking configuration
  * config = {
  *   API_HOST: 'https://api.testnet.velas.com',
  *   evmAPI: 'https://explorer.testnet.velas.com/rpc',
  *   nativeApi: 'https://api.testnet.velas.com/rpc',
  *   validatorsBackend: 'https://validators.testnet.velas.com',
  *   publicKey: 'native_public_key',
  *   evmAddress: '0x...',
  *   evmPrivateKey: '0x...',
  *   network: 'testnet', // testnet | mainnet
  *   nativePrivateKey: '...'
  **/
const config = {
  API_HOST: 'https://api.testnet.velas.com',
  evmAPI: 'https://explorer.testnet.velas.com/rpc',
  nativeApi: 'https://api.testnet.velas.com/rpc',
  validatorsBackend: 'https://validators.testnet.velas.com',
  // publicKey: 'Coh4WjzyrH6r1DUPT8C5FFx9g7FZqFNmzsE8fQECAvBn',
  // evmAddress: '0x2d0a96f10db08babce6c266d02518051cdc20b5d',
  // evmPrivateKey: '0xe87d22fd129e2d1e908386345949ee827072d24a6263a473cf73b76245825a88',
  // network: 'mainnet',
  // nativePrivateKey: '4463ibVte5g6mNgdQQv9m9qCNbhVBP7Le8k4dNBxvnWoqBFtcuhRpENb3JakoX6ojWN1tJchQaWKHoU3yBbd94UL'

  // publicKey: '9fjYnPBCRVdTPTfxznWvLjmqNiQtDLwJd6kXg2JQZZAU',
  // evmAddress: '0x4ccdc962846984d33c91b16f693e9ddec24cf8cd',
  // evmPrivateKey: '0x7cfdd8e83c49e90344e3e3c0b4650ec1eecf5e6cf52919ac0df05e21ddd80499',
  // network: 'testnet',
  // nativePrivateKey: '5CEa4PEag8wBXDpNAwbLmgvxUz4q1xTjx1QMhfQLgLyuUEUCuXZRvtvurcUQjZPuiMjvUv6tBjMHQsuEBfz7EmWk',

  // publicKey: '9pc4RR8Haia1MTApcLiBFHR21dwDVcLjoS5xAvrS7SQx',
  // evmAddress: '0xc39535928f993587b6561ce38ad3303ed491bebc',
  // evmPrivateKey: '0xe6ed8eb255c8d45b06f6ced6bf377644008fdde77a180af2eabac1c6b96b8d61',
  // network: 'testnet',
  // nativePrivateKey: 'pqXBcxBvbDr9PtYUdbb9tTaEkz2yMmupXm9B6qNDJgq1yuzKQSPKCxQNcgsW88RPqQmVyTJePaZmLNhfhGnmWWU'

  publicKey: "6LUYnT7dAFXm8YGh2Vq23wztB6EY9kXTLqHapz6P35Be",
  evmAddress: "0x52591a5ee5ffa3ac4fc0642abb98a8aca728d683",
  evmPrivateKey: "0x8a66ec2c899071c122cc2f0ec154b3a5a5870aa349baf2629d6cf20d81c45298",
  network: "testnet",
  nativePrivateKey: "526txvKzD42vhsiN45FwAykXPsHT9LnpnXM4A6Mmf1rzUnCDjrwywPucLx81959ip9hzb7pAp2ZZpKXwKqWXBKig",
}
const stakingStore = new StakingStore(config);

function App() {
//  if (!config)
//    throw new Error('[Staking 2.0] config is not defined');

//  const { API_HOST, evmAPI, nativeApi, validatorsBackend, publicKey, evmAddress, evmPrivateKey, network, nativePrivateKey } = config;

//  if (!API_HOST) throw new Error('[Staking 2.0] Velas Native API_HOST is not defined in config');
//  if (!evmAPI) throw new Error('[Staking 2.0] evmAPI is not defined in config');
//  if (!nativeApi) throw new Error('[Staking 2.0] nativeApi is not defined in config');
//  if (!validatorsBackend) throw new Error('[Staking 2.0] validatorsBackend is not defined in config');
//  if (!publicKey) throw new Error('[Staking 2.0] Velas Native publicKey is not defined in config');
//  if (!evmAddress) throw new Error('[Staking 2.0] evmAddress is not defined in config');
//  if (!evmPrivateKey) throw new Error('[Staking 2.0] evmPrivateKey is not defined in config');
//  if (!network) throw new Error('[Staking 2.0] network is not defined in config');
//  if (!nativePrivateKey) throw new Error('[Staking 2.0] nativePrivateKey is not defined in config');



  return (
    <div className="App">
      <div
        style={{
          background: '#141637',
          position: 'sticky',
          boxSizing: 'border-box',
          top: 0,
          width: '100%',
          padding: 10,
          height: 60,
        }}></div>
      <div
        style={{
          position: 'relative',
          display: 'block',
          width: 'auto',
          minHeight: '100vh',
          boxSizing: 'border-box',
          padding: 0,
          background: 'transparent',
          marginTop: -60
        }}>
        <StakingPage stakingStore={stakingStore} />
      </div>
      <div
        style={{
          background: '#080e3d',
          position: 'fixed',
          width: 250,
          top: 0,
          left: 0,
          height: '100vh',
          padding: 0,
          paddingTop: 0,
          zIndex: 11,
          transition: 'all .5s',
        }}></div>
    </div>
  );
}

export default App;
