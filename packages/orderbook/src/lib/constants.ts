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
  isToken: true,
};
export const WBTCArbitrumLocalnetAsset: Asset = {
  name: 'WBTC Arbitrum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.arbitrum_localnet,
  atomicSwapAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  isToken: true,
};
export const WBTCEthereumLocalnetAsset: Asset = {
  name: 'WBTC Ethereum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.ethereum_localnet,
  atomicSwapAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  tokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
  isToken: true,
};
