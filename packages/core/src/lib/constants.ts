import { API as localnetAPI } from '@gardenfi/utils';

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
    orderbook: localnetAPI.localnet.orderbook,
    quote: localnetAPI.localnet.quote,
    info: localnetAPI.localnet.info,
  },
} as const;
