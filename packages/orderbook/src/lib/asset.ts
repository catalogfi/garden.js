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
  bera_testnet: 'bera_testnet',
  citrea_testnet: 'citrea_testnet',
  monad_testnet: 'monad_testnet',
} as const;

export type Chain = keyof typeof Chains;

export type EvmChain = keyof Omit<
  typeof Chains,
  'bitcoin' | 'bitcoin_testnet' | 'bitcoin_regtest'
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
    chain === Chains.bera_testnet ||
    chain === Chains.citrea_testnet ||
    chain === Chains.monad_testnet
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
    chain === Chains.monad_testnet
  );
};

export const TimeLocks: Record<Chain, number> = {
  [Chains.bitcoin]: 144,
  [Chains.bitcoin_testnet]: 144,
  [Chains.bitcoin_regtest]: 144,
  [Chains.ethereum]: 7200,
  [Chains.arbitrum]: 7200,
  [Chains.ethereum_sepolia]: 7200,
  [Chains.arbitrum_localnet]: 7200,
  [Chains.arbitrum_sepolia]: 7200,
  [Chains.ethereum_localnet]: 7200,
  [Chains.base_sepolia]: 7200,
  [Chains.base]: 43200,
  [Chains.bera_testnet]: 28800,
  [Chains.citrea_testnet]: 28800,
  [Chains.monad_testnet]: 172800,
};

export const getBlockchainType = (chain: Chain) => {
  if (isBitcoin(chain)) return BlockchainType.Bitcoin;
  if (isEVM(chain)) return BlockchainType.EVM;
  throw new Error('Invalid or unsupported chain');
};

export const getTimeLock = (chain: Chain) => {
  if (!TimeLocks[chain]) throw new Error('Invalid or unsupported chain');
  return TimeLocks[chain];
};
