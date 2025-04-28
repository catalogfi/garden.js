import { Environment, Network } from '@gardenfi/utils';

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
    orderbook: 'https://api.garden.finance',
    auth: 'https://api.garden.finance/auth',
    quote: 'https://api.garden.finance/quote',
    info: 'https://api.garden.finance/info',
    evmRelay: 'https://api.garden.finance/relayer',
    starknetRelay: 'https://api.garden.finance/starknet',
  },
  testnet: {
    orderbook: 'https://testnet.api.garden.finance',
    auth: 'https://testnet.api.garden.finance/auth',
    quote: 'https://testnet.api.garden.finance/quote',
    info: 'https://testnet.api.garden.finance/info',
    evmRelay: 'https://testnet.api.garden.finance/relayer',
    starknetRelay: 'https://testnet.api.garden.finance/starknet',
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

export const DEFAULT_NODE_URL: Record<Network, string> = {
  [Network.MAINNET]: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_8',
  [Network.TESTNET]: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8',
};
