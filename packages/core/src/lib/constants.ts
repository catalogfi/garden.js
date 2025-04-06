export const API = {
  mainnet: {
    orderbook: 'https://orderbookv2.garden.finance',
    quote: 'https://pricev2.garden.finance',
    info: 'https://infov2.garden.finance',
    evmRelay: '',
    starknetRelay: '',
    solanaRelay: '',
  },
  testnet: {
    orderbook: 'https://orderbook-stage.hashira.io',
    quote: 'https://price.garden.finance',
    info: 'https://info.garden.finance',
    evmRelay: 'https://orderbook-stage.hashira.io',
    starknetRelay: 'https://starknet-relay.garden.finance',
    solanaRelay: 'https://solana-relayer-staging.hashira.io/relay',
  },
  localnet: {
    orderbook: 'http://localhost:4422',
    quote: 'http://localhost:6969',
    info: 'https://info.garden.finance',
    SolanaRelay: 'http://localhost:5014/relay',
    evmRelay: 'http://localhost:4422',
    strkRelay: '',
  },
} as const;
