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
}

export enum NetworkType {
  mainnet = 'mainnet',
  testnet = 'testnet',
  localnet = 'localnet',
}

export type Network = {
  [networkName: string]: {
    chainId: number;
    fillerAddresses: string[];
    networkLogo: string;
    explorer: string;
    networkType: NetworkType;
    assets?: Asset[];
  };
};

export const Chains = {
  bitcoin: 'bitcoin',
  bitcoin_testnet: 'bitcoin_testnet',
  bitcoin_regtest: 'bitcoin_regtest',
  ethereum: 'ethereum',
  base: 'base',
  arbitrum: 'arbitrum',
  ethereum_sepolia: 'ethereum_sepolia',
  arbitrum_localnet: 'arbitrum_localnet',
  arbitrum_sepolia: 'arbitrum_sepolia',
  ethereum_localnet: 'ethereum_localnet',
  base_sepolia: 'base_sepolia',
  solana: 'solana',
  solana_testnet: 'solana_testnet',
  solana_localnet: 'solana_localnet',
  bera_testnet: 'bera_testnet',
  citrea_testnet: 'citrea_testnet',
  bera: 'bera',
  monad_testnet: 'monad_testnet',
  starknet: 'starknet',
  starknet_sepolia: 'starknet_sepolia',
  starknet_devnet: 'starknet_devnet',
  hyperliquid_testnet: 'hyperliquid_testnet',
  hyperliquid: 'hyperliquid',
  unichain: 'unichain',
  corn: 'corn',
  botanix: 'botanix',
} as const;

export type Chain = keyof typeof Chains;

export type EvmChain = keyof Omit<
  typeof Chains,
  | 'bitcoin'
  | 'bitcoin_testnet'
  | 'bitcoin_regtest'
  | 'solana'
  | 'solana_testnet'
  | 'solana_localnet'
  | 'starknet'
  | 'starknet_devnet'
  | 'starknet_sepolia'
>;

export const isMainnet = (chain: Chain) => {
  return !(
    chain === Chains.ethereum_sepolia ||
    chain === Chains.bitcoin_testnet ||
    chain === Chains.bitcoin_regtest ||
    chain === Chains.arbitrum_localnet ||
    chain === Chains.ethereum_localnet ||
    chain === Chains.arbitrum_sepolia ||
    chain === Chains.base_sepolia ||
    chain === Chains.solana_testnet ||
    chain === Chains.solana_localnet ||
    chain === Chains.bera_testnet ||
    chain === Chains.citrea_testnet ||
    chain === Chains.monad_testnet ||
    chain === Chains.starknet_devnet ||
    chain === Chains.starknet_sepolia ||
    chain === Chains.hyperliquid_testnet
  );
};

export const isBitcoin = (chain: Chain) => {
  return (
    chain === Chains.bitcoin ||
    chain === Chains.bitcoin_testnet ||
    chain === Chains.bitcoin_regtest
  );
};

export const isEVM = (chain: Chain) => {
  return (
    chain === Chains.ethereum ||
    chain === Chains.arbitrum ||
    chain === Chains.ethereum_sepolia ||
    chain === Chains.ethereum_localnet ||
    chain === Chains.arbitrum_localnet ||
    chain === Chains.arbitrum_sepolia ||
    chain === Chains.base_sepolia ||
    chain === Chains.base ||
    chain === Chains.bera_testnet ||
    chain === Chains.citrea_testnet ||
    chain === Chains.bera ||
    chain === Chains.monad_testnet ||
    chain === Chains.hyperliquid_testnet ||
    chain === Chains.hyperliquid ||
    chain === Chains.unichain ||
    chain === Chains.corn ||
    chain === Chains.botanix
  );
};

export const isSolana = (chain: Chain) => {
  return (
    chain === Chains.solana ||
    chain === Chains.solana_testnet ||
    chain === Chains.solana_localnet
  );
};

export const isStarknet = (chain: Chain) => {
  return (
    chain === Chains.starknet ||
    chain === Chains.starknet_devnet ||
    chain === Chains.starknet_sepolia
  );
};

export const TimeLocks: Record<Chain, number> = {
  [Chains.bitcoin]: 144,
  [Chains.bitcoin_testnet]: 144,
  [Chains.bitcoin_regtest]: 200,
  [Chains.ethereum]: 7200,
  [Chains.arbitrum]: 7200,
  [Chains.ethereum_sepolia]: 7200,
  [Chains.arbitrum_localnet]: 7200,
  [Chains.arbitrum_sepolia]: 7200,
  [Chains.ethereum_localnet]: 7200,
  [Chains.base_sepolia]: 43200,
  [Chains.base]: 43200,
  [Chains.bera_testnet]: 43200,
  [Chains.citrea_testnet]: 43200,
  [Chains.bera]: 43200,
  [Chains.monad_testnet]: 172800,
  [Chains.solana]: 432000, //In solana timeslots exist in chunks of 0.4s so, 48 hrs in terms of that would be 48hrs => sec / 0.4
  [Chains.solana_localnet]: 432000,
  [Chains.solana_testnet]: 432000,
  [Chains.starknet]: 2880,
  [Chains.starknet_devnet]: 2880,
  [Chains.starknet_sepolia]: 2880,
  [Chains.hyperliquid_testnet]: 43200,
  [Chains.hyperliquid]: 43200,
  [Chains.unichain]: 86400,
  [Chains.corn]: 17136,
  [Chains.botanix]: 34560,
};

export const getBlockchainType = (chain: Chain) => {
  if (isBitcoin(chain)) return BlockchainType.Bitcoin;
  if (isEVM(chain)) return BlockchainType.EVM;
  if (isSolana(chain)) return BlockchainType.Solana;
  if (isStarknet(chain)) return BlockchainType.Starknet;
  throw new Error('Invalid or unsupported chain');
};

export const getTimeLock = (chain: Chain) => {
  if (!TimeLocks[chain]) throw new Error('Invalid or unsupported chain');
  return TimeLocks[chain];
};

export const NativeTokenAddress = '0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE';

export const isEvmNativeToken = (chain: Chain, tokenAddress: string) => {
  return (
    isEVM(chain) &&
    tokenAddress.toLowerCase() === NativeTokenAddress.toLowerCase()
  );
};

export const isSolanaNativeToken = (chain: Chain, tokenAddress: string) => {
  return isSolana(chain) && tokenAddress.toLowerCase() === 'primary';
};
