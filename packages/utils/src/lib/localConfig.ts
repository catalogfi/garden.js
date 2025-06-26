import * as config from '../../../../config.json';

const defaultConfig = {
  localnet: {
    orderbook: "",
    auth: "",
    quote: "",
    info: "",
    bitcoin: "",
    ethereum: "",
    arbitrum: "",
    starknet: "",
    evmRelay: "",
    starknetRelay: ""
  },
  PK: ""
};

const API = {
  localnet: config.LOCALNET || defaultConfig.localnet,
  pk: config.PK || defaultConfig.PK
};

export { API };
