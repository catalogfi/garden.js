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
  Solana = 'Solana'
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
  ethereum_arbitrum: 'ethereum_arbitrum',
  ethereum_sepolia: 'ethereum_sepolia',
  arbitrum_localnet: 'arbitrum_localnet',
  arbitrum_sepolia: 'arbitrum_sepolia',
  ethereum_localnet: 'ethereum_localnet',
  base_sepolia: 'base_sepolia',
  solana: 'solana',
  solana_devnet: 'solana_devnet',
  solana_localnet: 'solana_localnet',
} as const;

export type Chain = keyof typeof Chains;

export type EvmChain = keyof Omit<
  typeof Chains,
  'bitcoin' | 'bitcoin_testnet' | 'bitcoin_regtest' | 'solana' | 'solana_devnet' | 'solana_localnet'
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
    chain === Chains.solana
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
    chain === Chains.ethereum_arbitrum ||
    chain === Chains.ethereum_sepolia ||
    chain === Chains.ethereum_localnet ||
    chain === Chains.arbitrum_localnet ||
    chain === Chains.arbitrum_sepolia ||
    chain === Chains.base_sepolia
  );
};

export const getBlockchainType = (chain: Chain) => {
  if (isBitcoin(chain)) return BlockchainType.Bitcoin;
  if (isEVM(chain)) return BlockchainType.EVM;
  if (chain.includes("solana")) return BlockchainType.Solana;
  throw new Error('Invalid or unsupported chain');
};
