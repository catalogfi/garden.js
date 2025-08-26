import { Network } from '@gardenfi/utils';
import { ChainAsset, CreateOrderRequest } from './orderbook/orderbook.types';

export type AssetCommon = {
  name: string;
  decimals: number;
  symbol: string;
  chain: Chain;
  logo?: string;
  atomicSwapAddress: string;
};

export type AssetToken = AssetCommon & {
  tokenAddress: string;
};

export type Asset = AssetToken;

export enum BlockchainType {
  Bitcoin = 'Bitcoin',
  EVM = 'EVM',
  Solana = 'Solana',
  Starknet = 'Starknet',
  Sui = 'Sui',
}

export enum NetworkType {
  mainnet = 'mainnet',
  testnet = 'testnet',
  localnet = 'localnet',
}

export const ChainsConfig = {
  bitcoin: {
    type: BlockchainType.Bitcoin,
    network: Network.MAINNET,
  },
  bitcoin_testnet: {
    type: BlockchainType.Bitcoin,
    network: Network.TESTNET,
  },
  bitcoin_regtest: {
    type: BlockchainType.Bitcoin,
    network: Network.LOCALNET,
  },
  ethereum: {
    type: BlockchainType.EVM,
    network: Network.MAINNET,
  },
  base: {
    type: BlockchainType.EVM,
    network: Network.MAINNET,
  },
  arbitrum: {
    type: BlockchainType.EVM,
    network: Network.MAINNET,
  },
  ethereum_sepolia: {
    type: BlockchainType.EVM,
    network: Network.TESTNET,
  },
  arbitrum_localnet: {
    type: BlockchainType.EVM,
    network: Network.LOCALNET,
  },
  arbitrum_sepolia: {
    type: BlockchainType.EVM,
    network: Network.TESTNET,
  },
  ethereum_localnet: {
    type: BlockchainType.EVM,
    network: Network.LOCALNET,
  },
  base_sepolia: {
    type: BlockchainType.EVM,
    network: Network.TESTNET,
  },
  solana: {
    type: BlockchainType.Solana,
    network: Network.MAINNET,
  },
  solana_testnet: {
    type: BlockchainType.Solana,
    network: Network.TESTNET,
  },
  solana_localnet: {
    type: BlockchainType.Solana,
    network: Network.LOCALNET,
  },
  bera_testnet: {
    type: BlockchainType.EVM,
    network: Network.TESTNET,
  },
  citrea_testnet: {
    type: BlockchainType.EVM,
    network: Network.TESTNET,
  },
  bera: {
    type: BlockchainType.EVM,
    network: Network.MAINNET,
  },
  monad_testnet: {
    type: BlockchainType.EVM,
    network: Network.TESTNET,
  },
  starknet: {
    type: BlockchainType.Starknet,
    network: Network.MAINNET,
  },
  starknet_sepolia: {
    type: BlockchainType.Starknet,
    network: Network.TESTNET,
  },
  starknet_devnet: {
    type: BlockchainType.Starknet,
    network: Network.LOCALNET,
  },
  hyperliquid_testnet: {
    type: BlockchainType.EVM,
    network: Network.TESTNET,
  },
  hyperliquid: {
    type: BlockchainType.EVM,
    network: Network.MAINNET,
  },
  unichain: {
    type: BlockchainType.EVM,
    network: Network.MAINNET,
  },
  corn: {
    type: BlockchainType.EVM,
    network: Network.MAINNET,
  },
  botanix: {
    type: BlockchainType.EVM,
    network: Network.MAINNET,
  },
  bnbchain: { type: BlockchainType.EVM, network: Network.MAINNET },
  bnbchain_testnet: {
    type: BlockchainType.EVM,
    network: Network.TESTNET,
  },
  sui: {
    type: BlockchainType.Sui,
    network: Network.MAINNET,
  },
  sui_testnet: {
    type: BlockchainType.Sui,
    network: Network.TESTNET,
  },
} as const;

export const Chains = Object.keys(ChainsConfig).reduce((acc, key) => {
  acc[key as Chain] = key as Chain;
  return acc;
}, {} as Record<Chain, Chain>);

export type Chain = keyof typeof ChainsConfig;

export type EvmChain = {
  [K in Chain]: (typeof ChainsConfig)[K] extends {
    type: BlockchainType.EVM;
  }
    ? K
    : never;
}[Chain];

export const isMainnet = (chain: Chain) =>
  ChainsConfig[chain].network === Network.MAINNET;

export const isBitcoin = (chain: Chain) =>
  ChainsConfig[chain].type === BlockchainType.Bitcoin;

export const isEVM = (chain: Chain) =>
  ChainsConfig[chain].type === BlockchainType.EVM;

export const isSolana = (chain: Chain) =>
  ChainsConfig[chain].type === BlockchainType.Solana;

export const isStarknet = (chain: Chain) =>
  ChainsConfig[chain].type === BlockchainType.Starknet;

export const isSui = (chain: Chain) =>
  ChainsConfig[chain].type === BlockchainType.Sui;

export const getBlockchainType = (chain: Chain) => ChainsConfig[chain].type;

export const NativeTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const NATIVE_TOKENS = {
  [BlockchainType.EVM]: 'eth',
  [BlockchainType.Solana]: 'sol',
  [BlockchainType.Sui]: 'sui',
};

export const isEvmNativeToken = (chain: Chain, tokenAddress: string) => {
  return (
    isEVM(chain) &&
    tokenAddress.toLowerCase() === NATIVE_TOKENS[BlockchainType.EVM]
  );
};

export const isSolanaNativeToken = (chain: Chain, tokenAddress: string) => {
  return (
    isSolana(chain) &&
    tokenAddress.toLowerCase() === NATIVE_TOKENS[BlockchainType.Solana]
  );
};

export const isSuiNativeToken = (chain: Chain, tokenAddress: string) => {
  return (
    isSui(chain) &&
    tokenAddress.toLowerCase() === NATIVE_TOKENS[BlockchainType.Sui]
  );
};

export const isNativeToken = (asset: ChainAsset) => {
  const chain = asset.split(':')[0] as Chain;
  const tokenAddress = asset.split(':')[1];
  return (
    isEvmNativeToken(chain, tokenAddress) ||
    isSolanaNativeToken(chain, tokenAddress) ||
    isBitcoin(chain) ||
    isSuiNativeToken(chain, tokenAddress) ||
    // Starknet doesn't have a native token
    !isStarknet(chain)
  );
};

export const toFormattedAssetString = (
  asset: Asset | ChainAsset,
): ChainAsset => {
  if (typeof asset === 'string') {
    return asset as ChainAsset;
  }
  return `${asset.chain}:${asset.symbol.toLowerCase()}` as ChainAsset;
};

export const fromFormattedAssetString = (
  formatted: ChainAsset,
): { chain: Chain; symbol: string } => {
  const [chain, symbol] = formatted.split(':');
  if (!(chain in ChainsConfig)) {
    throw new Error(`Invalid chain in asset string: ${chain}`);
  }
  return {
    chain: chain as Chain,
    symbol,
  };
};

export const getChainsFromOrder = (
  order: CreateOrderRequest,
): { sourceChain: Chain; destinationChain: Chain } => {
  const [sourceChain] = order.source.asset.split(':');
  const [destinationChain] = order.destination.asset.split(':');

  if (!(sourceChain in ChainsConfig)) {
    throw new Error(`Invalid source chain: ${sourceChain}`);
  }
  if (!(destinationChain in ChainsConfig)) {
    throw new Error(`Invalid destination chain: ${destinationChain}`);
  }

  return {
    sourceChain: sourceChain as Chain,
    destinationChain: destinationChain as Chain,
  };
};

export const getChain = (asset: Asset | ChainAsset): Chain => {
  if (typeof asset === 'string') {
    return asset.split(':')[0] as Chain;
  }
  return asset.chain;
};

/**
 * Determines the blockchain type from a formatted asset string.
 * @param assetChain - The formatted asset string (e.g., "bitcoin:btc", "ethereum:eth")
 * @returns The chain type as a string: "bitcoin", "evm", "solana", or "starknet"
 */
export const getChainTypeFromAssetChain = (
  assetChain: string,
): BlockchainType => {
  const [chain] = assetChain.split(':');
  if (isBitcoin(chain as Chain)) return BlockchainType.Bitcoin;
  if (isEVM(chain as Chain)) return BlockchainType.EVM;
  if (isSolana(chain as Chain)) return BlockchainType.Solana;
  if (isStarknet(chain as Chain)) return BlockchainType.Starknet;
  if (isSui(chain as Chain)) return BlockchainType.Sui;
  throw new Error('Invalid or unsupported chain');
};
