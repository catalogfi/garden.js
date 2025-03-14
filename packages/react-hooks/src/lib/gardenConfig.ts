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
  regtest = 'regtest',
  localnet = 'localnet'
}

export const GARDEN_CONFIG: Partial<Record<environment, GardenConfigType>> = {
  [environment.testnet]: {
    orderBookUrl: 'https://evm-swapper-relay.onrender.com',
    quoteUrl: 'https://quote-knrp.onrender.com',
    bitcoinRPCUrl: 'https://mempool.space/testnet4/api',
    blockNumberFetcherUrl:
      'https://prod-mainnet-virtual-balance-pr-5.onrender.com',
  },
  [environment.mainnet]: {
    orderBookUrl: 'https://orderbookv2.garden.finance/',
    quoteUrl: 'https://quotev2.garden.finance',
    bitcoinRPCUrl: 'https://mempool.space/api',
    blockNumberFetcherUrl: 'https://info-8ocl.onrender.com',
  },
  [environment.regtest]: {
    orderBookUrl: "http://localhost:4426",
    quoteUrl: 'http://localhost:6969',
    bitcoinRPCUrl: 'http://localhost:30000',
    blockNumberFetcherUrl: 'http://localhost:3008',
  },
  [environment.localnet]: {
    orderBookUrl: "http://localhost:4426",
    quoteUrl: 'http://localhost:6969',
    bitcoinRPCUrl: 'http://localhost:30000',
    blockNumberFetcherUrl: 'http://localhost:3008',
  }
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
    case environment.regtest:
      return BitcoinNetwork.Regtest;
    default:
      throw new Error(`Invalid bitcoin network ${network}`);
  }
};
