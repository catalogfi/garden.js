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
    orderbook: 'https://testnet.api.hashira.io',
    auth: 'https://testnet.api.hashira.io/auth',
    quote: 'https://testnet.api.hashira.io/quote',
    info: 'https://info.garden.finance',
    evmRelay: 'https://testnet.api.hashira.io/relayer',
    starknetRelay: '',
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
