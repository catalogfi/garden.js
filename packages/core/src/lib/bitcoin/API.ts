import { BitcoinNetwork } from './provider/provider.interface';

//TODO: do we need to verify the APIs?
export const verifyAPIs = (APIs: string[]): string[] => {
  return APIs.map((API) => API);
};

export const getAPIs = (network: string): string[] => {
  if (network === BitcoinNetwork.Testnet) {
    return RPC_URLS_TESTNET;
  } else if (network === BitcoinNetwork.Mainnet) {
    return RPC_URLS_MAINNET;
  }

  throw new Error('Invalid network');
};

export const RPC_URLS_TESTNET = ['https://mempool.space/testnet4/api'];

export const RPC_URLS_MAINNET = [
  'https://mempool.space/api',
  'https://blockstream.info/api',
];
