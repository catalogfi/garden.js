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
  [chain: string]: {
    [asset: string]: Asset;
  };
};

export const SupportedAssets: SupportedAssets = {
  localnet: {
    [`${Chains.arbitrum_localnet}_0xdc64a140aa3e981100a9beca4e685f962f0cf6c9`]:
      WBTCArbitrumLocalnetAsset,
    [`${Chains.ethereum_localnet}_0xe7f1725e7734ce288f8367e1bb143e90bb3f0512`]:
      WBTCEthereumLocalnetAsset,
  },
  testnet: {
    [`${Chains.bitcoin_testnet}_primary`]: {
      name: 'BTC',
      decimals: 8,
      symbol: 'BTC',
      chain: Chains.bitcoin_testnet,
      tokenAddress: 'primary',
      atomicSwapAddress: 'primary',
    },
    [`${Chains.ethereum_sepolia}_0x3c6a17b8cd92976d1d91e491c93c98cd81998265`]: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.ethereum_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x4D68da063577F98C55166c7AF6955cF58a97b20A',
      atomicSwapAddress: '0x3C6a17b8cD92976D1D91E491c93c98cd81998265',
    },
    [`${Chains.arbitrum_sepolia}_0x1cd0bbd55fd66b4c5f7dfe434efd009c09e628d1`]: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      chain: Chains.arbitrum_sepolia,
      tokenAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
      atomicSwapAddress: '0x1cd0bBd55fD66B4C5F7dfE434eFD009C09e628d1',
    },
    [`${Chains.arbitrum_sepolia}_0xd5fedb4cecb0f1d32788a190d9eb47d94d23ee4e`]: {
      name: 'Seed',
      decimals: 18,
      symbol: 'SEED',
      chain: Chains.arbitrum_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/seed.svg',
      tokenAddress: '0x13DCec0762EcC5E666c207ab44Dc768e5e33070F',
      atomicSwapAddress: '0xD5FeDb4ceCB0F1D32788a190d9EB47D94D23eE4e',
    },
    [`${Chains.base_sepolia}_0x00ab86f54f436cfe15253845f139955ae0c00baf`]: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.base_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x13DCec0762EcC5E666c207ab44Dc768e5e33070F',
      atomicSwapAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
    },
  },
  mainnet: {},
} as const;
