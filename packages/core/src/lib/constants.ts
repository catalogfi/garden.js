import { SupportedAssets } from '@gardenfi/orderbook';
import { Environment, Network } from '@gardenfi/utils';
import { API as config } from '@gardenfi/utils';

export type Api = {
  orderbook: string;
  auth: string;
  quote: string;
  info: string;
  evmRelay: string;
  starknetRelay: string;
};
export const API: Record<Environment, Api> = {
  mainnet: {
    orderbook: config.mainnet.orderbook,
    auth: config.mainnet.auth,
    quote: config.mainnet.quote,
    info: config.mainnet.info,
    evmRelay: config.mainnet.evmRelay,
    starknetRelay: config.mainnet.starknetRelay,
  },
  testnet: {
    orderbook: config.testnet.orderbook,
    auth: config.testnet.auth,
    quote: config.testnet.quote,
    info: config.testnet.info,
    evmRelay: config.testnet.evmRelay,
    starknetRelay: config.testnet.starknetRelay,
  },
  localnet: {
    orderbook: config.localnet.orderbook,
    auth: config.localnet.auth,
    quote: config.localnet.quote,
    info: config.localnet.info,
    evmRelay: config.localnet.evmRelay,
    starknetRelay: config.localnet.starknetRelay,
  },
} as const;

export const STARKNET_CONFIG: Record<
  Network,
  {
    chainId: string;
    nodeUrl: string;
  }
> = {
  [Network.MAINNET]: {
    chainId: '0x534e5f4d41494e',
    nodeUrl: 'https://starknet-mainnet.public.blastapi.io/rpc/v0_8',
  },
  [Network.TESTNET]: {
    chainId: '0x534e5f5345504f4c4941',
    nodeUrl: 'https://starknet-sepolia.public.blastapi.io/rpc/v0_8',
  },
  [Network.LOCALNET]: {
    chainId: '0x534e5f4c4f43414c',
    nodeUrl: 'http://localhost:5050/rpc',
  },
};

export const DEFAULT_AFFILIATE_ASSET = {
  chain: SupportedAssets.mainnet.base_cbBTC.chain,
  asset: SupportedAssets.mainnet.base_cbBTC.atomicSwapAddress,
};
