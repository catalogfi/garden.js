import { SwapTokenMetadata } from './debridge.types';

export const CHAINS_MAP = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  polygon: 137,
  binance: 56,
  avalanche: 43114,
} as const;

type Chain = keyof typeof CHAINS_MAP;
type Tokens<K extends Chain = Chain> = Record<
  string,
  Partial<{ [k in K]: SwapTokenMetadata & { chainId: (typeof CHAINS_MAP)[k] } }>
>;

export const tokens = {
  WBTC: {
    ethereum: {
      chainId: 1,
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      decimals: 8,
    },
    arbitrum: {
      chainId: 42161,
      address: '0x2f2a2543b76a4166549f7aab2e75bef0aefc5b0f',
      decimals: 8,
    },
  },
} as const;
