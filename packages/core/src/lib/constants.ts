import { Environment } from '@gardenfi/utils';

export type Api = {
  orderbook: string;
  auth: string;
  quote: string;
  info: string;
  evmRelay: string;
  starknetRelay: string;
};
export const API: Record<Environment, Api> = {
  mainnet: {
    orderbook: 'https://orderbookv2.garden.finance',
    auth: '',
    quote: 'https://pricev2.garden.finance',
    info: 'https://infov2.garden.finance',
    evmRelay: 'https://orderbookv2.garden.finance',
    starknetRelay: '',
  },
  testnet: {
    orderbook: 'https://orderbook.garden.finance',
    auth: '',
    quote: 'https://price.garden.finance',
    info: 'https://info.garden.finance',
    evmRelay: 'https://orderbook.garden.finance',
    starknetRelay: 'https://starknet-relay.garden.finance',
  },
  localnet: {
    orderbook: '',
    auth: '',
    quote: '',
    info: '',
    evmRelay: '',
    starknetRelay: '',
  },
} as const;
