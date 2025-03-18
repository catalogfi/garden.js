export const API = {
  mainnet: {
    orderbook: 'https://orderbookv2.garden.finance',
    quote: 'https://pricev2.garden.finance',
    info: 'https://infov2.garden.finance',
  },
  testnet: {
    orderbook: 'https://orderbook.garden.finance',
    quote: 'https://price.garden.finance',
    info: 'https://info.garden.finance',
  },
  localnet: {
    orderbook: 'http://localhost:442',
    quote: 'http://localhost:6969',
    info: 'https://info.garden.finance',
  },
} as const;
