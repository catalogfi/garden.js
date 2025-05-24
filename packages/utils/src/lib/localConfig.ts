import * as config from '../../../../config.json';

const defaultConfig = {
  mainnet: {
    orderbook: "",
    auth: "",
    quote: "",
    info: "",
    evmRelay: "",
    starknetRelay: "",
  },
  testnet: {
    orderbook: "",
    auth: "",
    quote: "",
    info: "",
    evmRelay: "",
    starknetRelay: "",
  },
  localnet: {
    orderbook: "",
    auth: "",
    quote: "",
    info: "",
    bitcoin: "",
    ethereum: "",
    arbitrum: "",
    btcnode: "",
    starknet: "",
    evmRelay: "",
    starknetRelay: ""
  },
  PK: ""
};

const API = {
  mainnet: config.MAINNET || defaultConfig.mainnet,
  testnet: config.TESTNET || defaultConfig.testnet,
  localnet: config.LOCALNET || defaultConfig.localnet,
  pk: config.PK || defaultConfig.PK
};

console.log(config.LOCALNET);
console.log(API);
export { API };
