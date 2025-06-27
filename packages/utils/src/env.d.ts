declare namespace NodeJS {
  interface ProcessEnv {
    ORDERBOOK_URL?: string;
    AUTH_URL?: string;
    QUOTE_URL?: string;
    INFO_URL?: string;
    BITCOIN_URL?: string;
    ETHEREUM_URL?: string;
    ARBITRUM_URL?: string;
    BTCNODE_URL?: string;
    STARKNET_URL?: string;
    EVM_RELAY_URL?: string;
    STARKNET_RELAY_URL?: string;
    PK?: string;
  }
}
