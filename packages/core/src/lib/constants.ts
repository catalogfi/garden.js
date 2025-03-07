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
    orderbook: 'http://20.127.146.112:4426',
    quote: 'http://20.127.146.112:6969',
    info: 'http://20.127.146.112:9898',
  },
} as const;
