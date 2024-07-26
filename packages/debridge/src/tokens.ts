export const CHAINS_MAP = {
  ethereum: 1,
  optimism: 10,
  arbitrum: 42161,
  polygon: 137,
  binance: 56,
  avalanche: 43114,
} as const;

export const tokens = {
  ethereum: {
    WBTC: {
      decimals: 8,
      address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      chainId: 1,
    },
  },
  arbitrum: {
    WBTC: {
      decimals: 8,
      address: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      chainId: 42161,
    },
  },
  optimism: {
    WBTC: {
      decimals: 8,
      address: '0x68f180fcCe6836688e9084f035309E29Bf0A2095',
      chainId: 10,
    },
  },
  polygon: {
    WBTC: {
      decimals: 8,
      address: '0x078f358208685046a11C85e8ad32895DED33A249',
      chainId: 137,
    },
  },

  binance: {
    btcb: {
      decimals: 8,
      address: '0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c',
      chainId: 56,
    },
  },

  avalanche: {
    'btc.b': {
      decimals: 8,
      address: '0x152b9d0FdC40C096757F570A51E494bd4b943E50',
      chainId: 43114,
    },
  },
} as const;
