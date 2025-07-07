const API = {
  localnet: {
    orderbook: process.env.ORDERBOOK_URL ?? "",
    auth: process.env.AUTH_URL ?? "",
    quote: process.env.QUOTE_URL ?? "",
    info: process.env.INFO_URL ?? "",
    bitcoin: process.env.BITCOIN_URL ?? "",
    ethereum: process.env.ETHEREUM_URL ?? "",
    arbitrum: process.env.ARBITRUM_URL ?? "",
    btcnode: process.env.BTCNODE_URL ?? "",
    starknet: process.env.STARKNET_URL ?? "",
    evmRelay: process.env.EVM_RELAY_URL ?? "",
    starknetRelay: process.env.STARKNET_RELAY_URL ?? ""
  },
  pk: process.env.PK ?? ""
};

export { API };
