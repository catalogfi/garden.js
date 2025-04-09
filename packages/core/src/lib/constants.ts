export const API = {
  mainnet: {
    orderbook: 'https://orderbookv2.garden.finance',
    quote: 'https://pricev2.garden.finance',
    info: 'https://infov2.garden.finance',
    evmRelay: 'https://orderbookv2.garden.finance',
    starknetRelay: '',
  },
  testnet: {
    orderbook: 'https://orderbook.garden.finance',
    quote: 'https://price.garden.finance',
    info: 'https://info.garden.finance',
    evmRelay: 'https://orderbook.garden.finance',
    starknetRelay: 'https://starknet-relay.garden.finance',
  },
  localnet: {
    orderbook: '',
    quote: '',
    info: '',
    evmRelay: '',
    strkRelay: '',
  },
} as const;
