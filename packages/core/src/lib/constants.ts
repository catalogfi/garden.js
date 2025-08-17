import { SupportedAssets, toFormattedAssetString } from '@gardenfi/orderbook';
import { Environment, Network } from '@gardenfi/utils';

export const API: Record<Environment, string> = {
  mainnet: 'https://api.garden.finance',
  testnet: 'https://testnet.api.garden.finance',
  localnet: '',
};

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
    chainId: '',
    nodeUrl: '',
  },
};

export const SolanaRelayerAddress: Record<Network, string> = {
  [Network.MAINNET]: '9cBuPNiHXiMNg3Fin8xLCGJQBTXjYQTFtyaFQv2uiM1H',
  [Network.TESTNET]: 'ANUVKxeqaec3bf4DVPqLTnG1PT3Fng56wPcE7LXAb46Q',
  [Network.LOCALNET]: 'AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9',
} as const;

export const solanaProgramAddress = {
  mainnet: {
    native: '2bag6xpshpvPe7SJ9nSDLHpxqhEAoHPGpEkjNSv7gxoF',
    spl: 'gdnvdMCHJgnidtU7SL8RkRshHPvDJU1pdfZEpoLvqdU',
  },
  staging: {
    native: '6eksgdCnSjUaGQWZ6iYvauv1qzvYPF33RTGTM1ZuyENx',
    spl: '2WXpY8havGjfRxme9LUxtjFHTh1EfU3ur4v6wiK4KdNC',
  },
};

export const DEFAULT_AFFILIATE_ASSET = {
  asset: toFormattedAssetString(SupportedAssets.mainnet.base_cbBTC),
};
