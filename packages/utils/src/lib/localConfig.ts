import * as config from '../../../../config.json';

const defaultConfig = {
  LOCALNET: {
    orderbook: "",
    quote: "",
    info: "",
    bitcoin: "",
    ethereum: "",
    arbitrum: "",
    btcnode: ""
  },
  PK: ""
};

const API = {
  localnet: config.LOCALNET || defaultConfig.LOCALNET,
  pk: config.PK || defaultConfig.PK
};

export { API };
