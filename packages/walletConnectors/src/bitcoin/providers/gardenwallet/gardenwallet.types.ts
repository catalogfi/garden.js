export interface GardenWalletBitcoinProvider {
  _selectedAddress: string;
  getAccounts: () => Promise<string[]>;
  requestAccounts: () => Promise<string[]>;
  sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  getNetwork: () => Promise<string>;
  switchNetwork: (toNetwork: string) => Promise<string>;
  getPublicKey: () => Promise<string>;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
}

// _selectedAddress: string;
//   getPublicKey(): Promise<string>;
//   on: (event: string, callback: (data: any) => void) => void;
//   removeListener: (event: string, callback: (data: any) => void) => void;
//   disconnect: () => void;
