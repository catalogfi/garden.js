import { Network } from '@gardenfi/utils';

export interface LeapBitcoinProvider {
  
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
}
