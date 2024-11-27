import { Chain } from 'viem';
import { Asset, Chains } from './asset';

export const ArbitrumLocalnet: Chain = {
  id: 31338,
  name: 'Arbitrum Localnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8546/'],
    },
  },
  testnet: true,
};
export const EthereumLocalnet: Chain = {
  id: 31337,
  name: 'Ethereum Localnet',
  nativeCurrency: {
    name: 'Ethereum',
    symbol: 'ETH',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://localhost:8545/'],
    },
  },
  testnet: true,
};

export const bitcoinRegtestAsset: Asset = {
  name: 'Bitcoin Regtest',
  decimals: 8,
  symbol: 'BTC',
  chain: Chains.bitcoin_regtest,
  atomicSwapAddress: 'primary',
  tokenAddress: 'primary',
};
export const WBTCArbitrumLocalnetAsset: Asset = {
  name: 'WBTC Arbitrum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.arbitrum_localnet,
  atomicSwapAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
};
export const WBTCEthereumLocalnetAsset: Asset = {
  name: 'WBTC Ethereum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.ethereum_localnet,
  atomicSwapAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  tokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};

type SupportedAssets = {
  localnet: {
    arbitrum_localnet_0xdc64a140aa3e981100a9beca4e685f962f0cf6c9: Asset;
    ethereum_localnet_0xe7f1725e7734ce288f8367e1bb143e90bb3f0512: Asset;
  };
  testnet: {
    bitcoin_testnet_primary: Asset;
    ethereum_sepolia_0x3c6a17b8cd92976d1d91e491c93c98cd81998265: Asset;
    arbitrum_sepolia_0x1cd0bbd55fd66b4c5f7dfe434efd009c09e628d1: Asset;
    arbitrum_sepolia_0xd5fedb4cecb0f1d32788a190d9eb47d94d23ee4e: Asset;
    base_sepolia_0x00ab86f54f436cfe15253845f139955ae0c00baf: Asset;
    base_sepolia_0xb391ca6d0a76cd2a927bc314856e8a374a225cfc: Asset;
    bera_testnet_0x1dc94fdcad8aee13cfd34db8a26d26e31572805c: Asset;
  };
  mainnet: {
    bitcoin_primary: Asset;
    base_0x13dcec0762ecc5e666c207ab44dc768e5e33070f: Asset;
    base_0x00ab86f54f436cfe15253845f139955ae0c00baf: Asset;
  };
};

export const SupportedAssets: SupportedAssets = {
  localnet: {
    arbitrum_localnet_0xdc64a140aa3e981100a9beca4e685f962f0cf6c9:
      WBTCArbitrumLocalnetAsset,
    ethereum_localnet_0xe7f1725e7734ce288f8367e1bb143e90bb3f0512:
      WBTCEthereumLocalnetAsset,
  },
  testnet: {
    bitcoin_testnet_primary: {
      name: 'BTC',
      decimals: 8,
      symbol: 'BTC',
      chain: Chains.bitcoin_testnet,
      tokenAddress: 'primary',
      atomicSwapAddress: 'primary',
    },
    ethereum_sepolia_0x3c6a17b8cd92976d1d91e491c93c98cd81998265: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.ethereum_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x4D68da063577F98C55166c7AF6955cF58a97b20A',
      atomicSwapAddress: '0x3C6a17b8cD92976D1D91E491c93c98cd81998265',
    },
    arbitrum_sepolia_0x1cd0bbd55fd66b4c5f7dfe434efd009c09e628d1: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      chain: Chains.arbitrum_sepolia,
      tokenAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
      atomicSwapAddress: '0x1cd0bBd55fD66B4C5F7dfE434eFD009C09e628d1',
    },
    arbitrum_sepolia_0xd5fedb4cecb0f1d32788a190d9eb47d94d23ee4e: {
      name: 'Seed',
      decimals: 18,
      symbol: 'SEED',
      chain: Chains.arbitrum_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/seed.svg',
      tokenAddress: '0x13DCec0762EcC5E666c207ab44Dc768e5e33070F',
      atomicSwapAddress: '0xD5FeDb4ceCB0F1D32788a190d9EB47D94D23eE4e',
    },
    base_sepolia_0x00ab86f54f436cfe15253845f139955ae0c00baf: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.base_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x13DCec0762EcC5E666c207ab44Dc768e5e33070F',
      atomicSwapAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
    },
    base_sepolia_0xb391ca6d0a76cd2a927bc314856e8a374a225cfc: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.base_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0xD72Fc3e7D52301b3e5f7d4E3366F88d5C8747520',
      atomicSwapAddress: '0xB391CA6D0A76CD2A927bC314856E8a374a225CFc',
    },
    bera_testnet_0x1dc94fdcad8aee13cfd34db8a26d26e31572805c: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.bera_testnet,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
      atomicSwapAddress: '0x1dC94FdcAd8Aee13cfd34Db8a26d26E31572805c',
    },
  },
  mainnet: {
    bitcoin_primary: {
      name: 'BTC',
      decimals: 8,
      symbol: 'BTC',
      chain: Chains.bitcoin,
      tokenAddress: 'primary',
      atomicSwapAddress: 'primary',
    },
    base_0x13dcec0762ecc5e666c207ab44dc768e5e33070f: {
      name: 'Coinbase Bitcoin',
      decimals: 8,
      symbol: 'cbBTC',
      chain: Chains.base,
      logo: 'https://coin-images.coingecko.com/coins/images/51336/large/cbbtc.png?1730814747',
      tokenAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      atomicSwapAddress: '0x13DCec0762EcC5E666c207ab44Dc768e5e33070F',
    },
    base_0x00ab86f54f436cfe15253845f139955ae0c00baf: {
      name: 'USD Coin',
      decimals: 6,
      symbol: 'USDC',
      chain: Chains.base,
      logo: 'https://garden-finance.imgix.net/token-images/usdc.svg',
      tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      atomicSwapAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
    },
  },
} as const;
