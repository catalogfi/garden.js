/**
 * @reference https://docs.unisat.io/dev/unisat-developer-center/unisat-wallet
 */
export interface UnisatBitcoinProvider {
  _selectedAddress: string;
  getAccounts: () => Promise<string[]>;
  requestAccounts: () => Promise<string[]>;
  sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  getChain: () => Promise<UnisatChain>;
  getNetwork: () => Promise<UnisatNetworkEnum>;
  switchChain: (chain: UnisatChainEnum) => Promise<UnisatChain>;
  getPublicKey(): Promise<string>;
  on: (event: string, callback: (data: any) => void) => void;
  removeListener: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
}

export type UnisatChain = {
  enum: UnisatChainEnum;
  name: string;
  network: UnisatNetwork;
};

export enum UnisatChainEnum {
  BITCOIN_MAINNET = 'BITCOIN_MAINNET',
  BITCOIN_TESTNET = 'BITCOIN_TESTNET',
  BITCOIN_TESTNET4 = 'BITCOIN_TESTNET4',
}

export type UnisatNetwork = 'livenet' | 'testnet';

export enum UnisatNetworkEnum {
  LIVENET = 'livenet',
  TESTNET = 'testnet',
}
