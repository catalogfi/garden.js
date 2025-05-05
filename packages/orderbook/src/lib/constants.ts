import { Chain } from 'viem';
import { Asset, Chains } from './asset';

export const StarknetLocalnet: Chain = {
  id: 1001,
  name: 'Starknet Localnet',
  nativeCurrency: {
    name: 'Stark Token',
    symbol: 'STRK',
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: ['http://127.0.0.1:8547/'],
    },
  },
  testnet: true,
};

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

export const SOLSolanaLocalnetAsset: Asset = {
  name: 'SOL Solana Localnet',
  decimals: 9,
  symbol: 'SOL',
  chain: Chains.solana_localnet,
  atomicSwapAddress: 'primary',
  tokenAddress: 'primary',
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
  // atomicSwapAddress: '0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9',
  atomicSwapAddress: '0x0165878A594ca255338adfa4d48449f69242Eb8F', //present on localnet
  tokenAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
};
export const WBTCEthereumLocalnetAsset: Asset = {
  name: 'WBTC Ethereum Localnet',
  decimals: 8,
  symbol: 'WBTC',
  chain: Chains.ethereum_localnet,
  // atomicSwapAddress: '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512',
  atomicSwapAddress: '0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0', //present on localnet
  tokenAddress: '0x5FbDB2315678afecb367f032d93F642f64180aa3',
};
export const STRKStarknetLocalnetAsset: Asset = {
  name: 'STRK Starknet Localnet',
  decimals: 18,
  symbol: 'STRK',
  chain: Chains.starknet_devnet,
  atomicSwapAddress:
    '0x15cf8b127aa850c97ed10de6f8b300cabc4f09232a57e63667af02fdef8a55a',
  tokenAddress:
    '0x51aa025f1c9948790113e4ebea826dee24542bc50902076c05892774210e8d2',
};
export const ETHStarknetLocalnetAsset: Asset = {
  name: 'ETH Starknet Localnet',
  decimals: 18,
  symbol: 'ETH',
  chain: Chains.starknet_devnet,
  atomicSwapAddress:
    '0x1890470168440bbb9df50988748924a74ea22de10d22a081e458737b9574e75',
  tokenAddress:
    '0x51aa025f1c9948790113e4ebea826dee24542bc50902076c05892774210e8d2',
};

export const SupportedAssets = {
  localnet: {
    solana_localnet_SOL: SOLSolanaLocalnetAsset,
    arbitrum_localnet_WBTC: WBTCArbitrumLocalnetAsset,
    ethereum_localnet_WBTC: WBTCEthereumLocalnetAsset,
    bitcoin_regtest_BTC: bitcoinRegtestAsset,
    starknet_localnet_STRK: STRKStarknetLocalnetAsset,
    starknet_localnet_ETH: ETHStarknetLocalnetAsset,
  },
  testnet: {
    solana_testnet_SOL: {
      name: 'SOL Solana Testnet',
      decimals: 9,
      symbol: 'SOL',
      chain: Chains.solana_testnet,
      atomicSwapAddress: 'primary',
      tokenAddress: 'primary',
    },
    bitcoin_testnet_BTC: {
      name: 'BTC',
      decimals: 8,
      symbol: 'BTC',
      chain: Chains.bitcoin_testnet,
      tokenAddress: 'primary',
      atomicSwapAddress: 'primary',
    },
    ethereum_sepolia_WBTC: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.ethereum_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x4D68da063577F98C55166c7AF6955cF58a97b20A',
      atomicSwapAddress: '0x3C6a17b8cD92976D1D91E491c93c98cd81998265',
    },
    arbitrum_sepolia_WBTC: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      chain: Chains.arbitrum_sepolia,
      tokenAddress: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
      atomicSwapAddress: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
    },
    arbitrum_sepolia_SEED: {
      name: 'Seed',
      decimals: 18,
      symbol: 'SEED',
      chain: Chains.arbitrum_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/seed.svg',
      tokenAddress: '0x13DCec0762EcC5E666c207ab44Dc768e5e33070F',
      atomicSwapAddress: '0xD5FeDb4ceCB0F1D32788a190d9EB47D94D23eE4e',
    },
    arbitrum_sepolia_iBTC: {
      name: 'iBTC',
      decimals: 8,
      symbol: 'iBTC',
      chain: Chains.arbitrum_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/dlcBTCIcon.svg',
      tokenAddress: '0x685437f025c5f33a94818408c286bc1f023201fc',
      atomicSwapAddress: '0xdfe6d9363ee96152d39391009a6723819d9e25eb',
    },
    base_sepolia_WBTC: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.base_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x13DCec0762EcC5E666c207ab44Dc768e5e33070F',
      atomicSwapAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
    },
    base_sepolia_USDT: {
      name: 'Tether USD',
      decimals: 6,
      symbol: 'USDT',
      chain: Chains.base_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/usdt.svg',
      tokenAddress: '0xD72Fc3e7D52301b3e5f7d4E3366F88d5C8747520',
      atomicSwapAddress: '0xB391CA6D0A76CD2A927bC314856E8a374a225CFc',
    },
    base_sepolia_iBTC: {
      name: 'iBTC',
      decimals: 8,
      symbol: 'iBTC',
      chain: Chains.base_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/dlcBTCIcon.svg',
      tokenAddress: '0x0b0D554D9573bAe1a7556d220847f45182918B28',
      atomicSwapAddress: '0xbcdad29ac77e5bb27fd528ab0045af630259fe4f',
    },
    bera_testnet_WBTC: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.bera_testnet,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x00ab86f54F436CfE15253845F139955ae0C00bAf',
      atomicSwapAddress: '0x1dC94FdcAd8Aee13cfd34Db8a26d26E31572805c',
    },
    citrea_testnet_WCBTC: {
      name: 'Wrapped Citrea Bitcoin',
      decimals: 18,
      symbol: 'WCBTC',
      chain: Chains.citrea_testnet,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x8d0c9d1c17aE5e40ffF9bE350f57840E9E66Cd93',
      atomicSwapAddress: '0xaD9d14CA82d9BF97fFf745fFC7d48172A1c0969E',
    },
    starknet_testnet_ETH: {
      name: 'Starknet ETH',
      decimals: 18,
      symbol: 'ETH',
      chain: Chains.starknet_sepolia,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress:
        '0x49d36570d4e46f48e99674bd3fcc84644ddd6b96f7c741b1562b82f9e004dc7',
      atomicSwapAddress:
        '0x13e7510b665d01c03f250e648c5be6f4a57b6cf56b3079293362ed2e4713c95',
    },
    hyperliquid_testnet_WBTC: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.hyperliquid_testnet,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0xD8a6E3FCA403d79b6AD6216b60527F51cc967D39',
      atomicSwapAddress: '0x795Dcb58d1cd4789169D5F938Ea05E17ecEB68cA',
    },
  },
  mainnet: {
    bitcoin_BTC: {
      name: 'BTC',
      decimals: 8,
      symbol: 'BTC',
      chain: Chains.bitcoin,
      tokenAddress: 'primary',
      atomicSwapAddress: 'primary',
    },
    base_cbBTC: {
      name: 'Coinbase Bitcoin',
      decimals: 8,
      symbol: 'cbBTC',
      chain: Chains.base,
      logo: 'https://garden-finance.imgix.net/token-images/cbBTC.svg',
      tokenAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      atomicSwapAddress: '0xeae7721d779276eb0f5837e2fe260118724a2ba4',
    },
    base_USDC: {
      name: 'USD Coin',
      decimals: 6,
      symbol: 'USDC',
      chain: Chains.base,
      logo: 'https://garden-finance.imgix.net/token-images/usdc.svg',
      tokenAddress: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      atomicSwapAddress: '0xd8a6e3fca403d79b6ad6216b60527f51cc967d39',
    },
    ethereum_WBTC: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.ethereum,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
      atomicSwapAddress: '0x795dcb58d1cd4789169d5f938ea05e17eceb68ca',
    },
    ethereum_USDC: {
      name: 'USD Coin',
      decimals: 6,
      symbol: 'USDC',
      chain: Chains.ethereum,
      logo: 'https://garden-finance.imgix.net/token-images/usdc.svg',
      tokenAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
      atomicSwapAddress: '0xd8a6e3fca403d79b6ad6216b60527f51cc967d39',
    },
    ethereum_cbBTC: {
      name: 'Coinbase Bitcoin',
      decimals: 8,
      symbol: 'cbBTC',
      chain: Chains.ethereum,
      logo: 'https://garden-finance.imgix.net/token-images/cbBTC.svg',
      tokenAddress: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf',
      atomicSwapAddress: '0xeae7721d779276eb0f5837e2fe260118724a2ba4',
    },
    arbitrum_WBTC: {
      name: 'Wrapped Bitcoin',
      decimals: 8,
      symbol: 'WBTC',
      chain: Chains.arbitrum,
      logo: 'https://garden-finance.imgix.net/token-images/wbtc.svg',
      tokenAddress: '0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f',
      atomicSwapAddress: '0x6b6303fab8ec7232b4f2a7b9fa58e5216f608fcb',
    },
    arbitrum_USDC: {
      name: 'USD Coin',
      decimals: 6,
      symbol: 'USDC',
      chain: Chains.arbitrum,
      logo: 'https://garden-finance.imgix.net/token-images/usdc.svg',
      tokenAddress: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
      atomicSwapAddress: '0xeae7721d779276eb0f5837e2fe260118724a2ba4',
    },
    arbitrum_iBTC: {
      name: 'iBTC',
      decimals: 8,
      symbol: 'iBTC',
      chain: Chains.arbitrum,
      logo: 'https://garden-finance.imgix.net/token-images/iBTC.svg',
      tokenAddress: '0x050C24dBf1eEc17babE5fc585F06116A259CC77A',
      atomicSwapAddress: '0xdc74a45e86dedf1ff7c6dac77e0c2f082f9e4f72',
    },
    bera_LBTC: {
      name: 'Lombard Bitcoin',
      decimals: 8,
      symbol: 'LBTC',
      chain: Chains.bera,
      logo: 'https://garden-finance.imgix.net/token-images/LBTC.svg',
      tokenAddress: '0xecAc9C5F704e954931349Da37F60E39f515c11c1',
      atomicSwapAddress: '0x39f3294352208905fc6ebf033954E6c6455CdB4C',
    },
    hyperliquid_UBTC: {
      name: 'Unit Bitcoin',
      decimals: 8,
      symbol: 'UBTC',
      chain: Chains.hyperliquid,
      tokenAddress: '0x9FDBdA0A5e284c32744D2f17Ee5c74B284993463',
      atomicSwapAddress: '0x39f3294352208905fc6ebf033954E6c6455CdB4C',
    },
  },
} as const;
