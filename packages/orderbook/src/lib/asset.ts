export const Chains = {
  ethereum_sepolia: "ethereum_sepolia",
  ethereum: "ethereum",
  bitcoin: "bitcoin",
  bitcoin_testnet: "bitcoin_testnet",
  bitcoin_regtest: "bitcoin_regtest",
  ethereum_arbitrum: "ethereum_arbitrum",
  ethereum_arbitrumlocalnet: "ethereum_arbitrumlocalnet",
  ethereum_localnet: "ethereum_localnet",
} as const;

export type Chain = keyof typeof Chains;
export type EvmChain = keyof Omit<
  typeof Chains,
  "bitcoin" | "bitcoin_testnet" | "bitcoin_regtest"
>;

export type AssetCommon = {
  name: string;
  symbol: string;
  decimals: number;
  chain: Chain;
  isToken: boolean;
  thumbnail: string;
};

export type AssetNative = AssetCommon;

export type AssetToken = AssetCommon & {
  address: string;
  isToken: true;
};

export type Asset = AssetToken | AssetNative;

export const Assets = {
  ethereum: {
    WBTC: {
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      chain: Chains.ethereum,
      isToken: true,
      thumbnail:
        "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg?v=029",
      address: "0x2260fac5e5542a773aa44fbcfedf7c193bc2c599",
    },
  },
  ethereum_sepolia: {
    WBTC: {
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      chain: Chains.ethereum_sepolia,
      isToken: true,
      thumbnail: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg",
      address: "0x3D1e56247033FE191DC789b5838E366dC04b1b73",
    },
  },
  ethereum_arb_localnet: {
    WBTC: {
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      chain: Chains.ethereum_arbitrum,
      isToken: true,
      thumbnail: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg",
      address: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
    },
  },
  ethereum_localnet: {
    WBTC: {
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      chain: Chains.ethereum_localnet,
      isToken: true,
      thumbnail: "https://cryptologos.cc/logos/wrapped-bitcoin-wbtc-logo.svg",
      address: "0x5FbDB2315678afecb367f032d93F642f64180aa3",
    },
  },
  bitcoin: {
    BTC: {
      name: "Bitcoin",
      symbol: "BTC",
      decimals: 8,
      thumbnail: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
      chain: Chains.bitcoin,
      isToken: false,
    },
  },
  bitcoin_testnet: {
    BTC: {
      name: "Bitcoin Testnet",
      symbol: "BTC",
      decimals: 8,
      thumbnail: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
      chain: Chains.bitcoin_testnet,
      isToken: false,
    },
  },
  bitcoin_regtest: {
    BTC: {
      name: "Bitcoin Regtest",
      symbol: "BTC",
      decimals: 8,
      thumbnail: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
      chain: Chains.bitcoin_regtest,
      isToken: false,
    },
  },
  ethereum_arbitrum: {
    WBTC: {
      name: "Wrapped Bitcoin",
      symbol: "WBTC",
      decimals: 8,
      chain: Chains.ethereum_arbitrum,
      isToken: true,
      thumbnail: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
      address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f",
    },
  },
};

export type ChainData = {
  nativeAsset: Asset;
};

export const ChainsData: Record<Chain, ChainData> = {
  bitcoin: {
    nativeAsset: Assets.bitcoin.BTC,
  },
  bitcoin_testnet: {
    nativeAsset: Assets.bitcoin_testnet.BTC,
  },
  bitcoin_regtest: {
    nativeAsset: {
      name: "Bitcoin Regtest",
      symbol: "rBTC",
      decimals: 8,
      chain: Chains.bitcoin_regtest,
      isToken: false,
      thumbnail: "https://cryptologos.cc/logos/bitcoin-btc-logo.svg",
    },
  },
  ethereum: {
    nativeAsset: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      chain: Chains.ethereum,
      isToken: false,
      thumbnail: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
    },
  },
  ethereum_sepolia: {
    nativeAsset: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      chain: Chains.ethereum_sepolia,
      isToken: false,
      thumbnail: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
    },
  },
  ethereum_arbitrum: {
    nativeAsset: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      chain: Chains.ethereum_arbitrum,
      isToken: false,
      thumbnail: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg",
    },
  },
  ethereum_arbitrumlocalnet: {
    nativeAsset: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      chain: Chains.ethereum_arbitrumlocalnet,
      isToken: false,
      thumbnail: "https://cryptologos.cc/logos/arbitrum-arb-logo.svg",
    },
  },
  ethereum_localnet: {
    nativeAsset: {
      name: "Ethereum",
      symbol: "ETH",
      decimals: 18,
      chain: Chains.ethereum_localnet,
      isToken: false,
      thumbnail: "https://cryptologos.cc/logos/ethereum-eth-logo.svg",
    },
  },
};

export const isMainnet = (chain: Chain) => {
  return !(
    chain === Chains.ethereum_sepolia ||
    chain === Chains.bitcoin_testnet ||
    chain === Chains.bitcoin_regtest ||
    chain === Chains.ethereum_arbitrumlocalnet ||
    chain === Chains.ethereum_localnet
  );
};
