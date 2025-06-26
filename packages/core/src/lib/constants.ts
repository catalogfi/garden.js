import { SupportedAssets } from '@gardenfi/orderbook';
import { Environment, Network, API as config } from '@gardenfi/utils';
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
    orderbook: "https://api.garden.finance",
    auth: "https://api.garden.finance/auth",
    quote: "https://api.garden.finance/quote",
    info: "https://api.garden.finance/info",
    evmRelay: "https://api.garden.finance/relayer",
    starknetRelay: "https://api.garden.finance/starknet",
  },
  testnet: {
    orderbook: "https://testnet.api.garden.finance",
    auth: "https://testnet.api.garden.finance/auth",
    quote: "https://testnet.api.garden.finance/quote",
    info: "https://testnet.api.garden.finance/info",
    evmRelay: "https://testnet.api.garden.finance/relayer",
    starknetRelay: "https://testnet.api.garden.finance/starknet",
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
    nodeUrl: 'http://starknet-devnet:5050/rpc',
  },
};

export const DEFAULT_AFFILIATE_ASSET = {
  chain: SupportedAssets.mainnet.base_cbBTC.chain,
  asset: SupportedAssets.mainnet.base_cbBTC.atomicSwapAddress,
};
