export const CHAINS_MAP = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  polygon: 137,
  binance: 56,
  avalanche: 43114,
} as const;

type TokensSupportedByChain = {
  WBTC: 'ethereum' | 'arbitrum' | 'optimism' | 'polygon';
  btcb: 'binance';
  'btc.b': 'avalanche';
};

type TokenMetadata = {
  name: string;
  symbol: keyof TokensSupportedByChain;
  chainId: (typeof CHAINS_MAP)[keyof typeof CHAINS_MAP];
  decimals: number;
  address: string;
};

type NullableTokens = {
  [c in keyof typeof CHAINS_MAP]: {
    [t in keyof TokensSupportedByChain]: c extends TokensSupportedByChain[t]
      ? TokenMetadata
      : never;
  };
};

export type Tokens = {
  [c in keyof NullableTokens]: {
    [t in keyof NullableTokens[c] as NullableTokens[c][t] extends never
      ? never
      : t]: NullableTokens[c][t];
  };
};

export const tokens: Tokens = {
  ethereum: {
    WBTC: {
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      decimals: 8,
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      chainId: 1,
    },
  },
  arbitrum: {
    WBTC: {
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      decimals: 8,
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      chainId: 42161,
    },
  },
  optimism: {
    WBTC: {
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      decimals: 8,
      address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      chainId: 10,
    },
  },
  polygon: {
    WBTC: {
      name: 'Wrapped Bitcoin',
      symbol: 'WBTC',
      decimals: 8,
      address: '0x078f358208685046a11C85e8ad32895DED33A249',
      chainId: 137,
    },
  },

  binance: {
    btcb: {
      name: 'Bitcoin',
      symbol: 'btcb',
      decimals: 8,
      address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      chainId: 56,
    },
  },

  avalanche: {
    'btc.b': {
      name: 'Bitcoin',
      symbol: 'btc.b',
      decimals: 8,
      address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
      chainId: 43114,
    },
  },
};
