import { BitcoinNetwork } from '@catalogfi/wallets';

export type GardenConfigType = {
  orderBookUrl: string;
  quoteUrl: string;
  bitcoinRPCUrl: string;
  blockNumberFetcherUrl: string;
};

export enum environment {
  mainnet = 'mainnet',
  testnet = 'testnet',
}

export const GARDEN_CONFIG: Partial<Record<environment, GardenConfigType>> = {
  [environment.testnet]: {
    orderBookUrl: 'https://evm-swapper-relay.onrender.com',
    quoteUrl: 'https://quote-knrp.onrender.com',
    bitcoinRPCUrl: 'https://mempool.space/testnet4/api',
    blockNumberFetcherUrl:
      'https://prod-mainnet-virtual-balance-pr-5.onrender.com',
  },
} as const;

export const getConfigForNetwork = (network: environment): GardenConfigType => {
  const config = GARDEN_CONFIG[network];
  if (!config) {
    throw new Error(`Configuration for network ${network} not found`);
  }
  return config;
};

export const getBitcoinNetwork = (network: environment): BitcoinNetwork => {
  switch (network) {
    case environment.mainnet:
      return BitcoinNetwork.Mainnet;
    case environment.testnet:
      return BitcoinNetwork.Testnet;
    default:
      throw new Error(`Invalid bitcoin network ${network}`);
  }
};
