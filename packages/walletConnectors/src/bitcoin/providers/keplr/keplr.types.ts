export interface KeplrBitcoinProvider {
  connectWallet: () => Promise<{ address: string; publicKey: string }>;
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<KeplrBitcoinNetworkType>;
  switchNetwork: (
    network: KeplrBitcoinNetworkType,
  ) => Promise<KeplrBitcoinNetworkType>;
  getChain: () => Promise<{
    enum: KeplrBitcoinChainType;
    name: string;
    network: KeplrBitcoinNetworkType;
  }>;
  switchChain: (chain: KeplrBitcoinChainType) => Promise<KeplrBitcoinChainType>;
  getPublicKey: () => Promise<string>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  sendBitcoin: (to: string, amount: number) => Promise<string>;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
}

export enum KeplrBitcoinNetworkType {
  //Both 'mainnet' and 'livenet' refer to the same network, but the docs use them inconsistently.
  MAINNET = 'mainnet',
  LIVENET = 'livenet',
  TESTNET = 'testnet',
}

export enum KeplrBitcoinChainType {
  MAINNET = 'BITCOIN_MAINNET',
  TESTNET = 'BITCOIN_TESTNET',
}
