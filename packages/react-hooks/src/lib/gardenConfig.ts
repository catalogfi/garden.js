export type GardenConfigType = {
  orderBookUrl: string;
  quoteUrl: string;
  bitcoinRPCUrl: string;
  blockNumberFetcherUrl: string;
};

export enum environment {
  mainnet = 'mainnet',
  testnet = 'testnet',
  localnet = 'localnet',
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
  [environment.localnet]: {
    orderBookUrl: 'https://orderbook.merry.dev',
    quoteUrl: 'https://quote.merry.dev',
    bitcoinRPCUrl: 'https://indexer.merry.dev',
    blockNumberFetcherUrl: 'https://info.merry.dev',
  }
} as const;

export const getConfigForNetwork = (network: environment): GardenConfigType => {
  const config = GARDEN_CONFIG[network];
  if (!config) {
    throw new Error(`Configuration for network ${network} not found`);
  }
  return config;
};
