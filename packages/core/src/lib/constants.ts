import { Environment } from '@gardenfi/utils';

export type Api = {
  orderbook: string;
  auth: string;
  quote: string;
  info: string;
  evmRelay: string;
  starknetRelay: string;
  solanaRelay: string;
};
export const API: Record<Environment, Api> = {
  mainnet: {
    orderbook: 'https://api.garden.finance',
    auth: 'https://api.garden.finance/auth',
    quote: 'https://api.garden.finance/quote',
    info: 'https://api.garden.finance/info',
    evmRelay: 'https://api.garden.finance/relayer',
    starknetRelay: '',
    solanaRelay: 'https://solana-relayer-staging.hashira.io/relay',
  },
  testnet: {
    orderbook: 'https://testnet.api.garden.finance',
    auth: 'https://testnet.api.garden.finance/auth',
    quote: 'https://testnet.api.garden.finance/quote',
    info: 'https://testnet.api.garden.finance/info',
    evmRelay: 'https://testnet.api.garden.finance/relayer',
    starknetRelay: '',
    solanaRelay: 'https://solana-relayer-staging.hashira.io/relay',
  },
  localnet: {
    orderbook: '',
    auth: '',
    quote: '',
    info: '',
    evmRelay: '',
    starknetRelay: '',
    solanaRelay: '',
  },
} as const;
