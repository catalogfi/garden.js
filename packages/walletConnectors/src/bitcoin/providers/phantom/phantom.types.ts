import { Network } from "src/bitcoin/bitcoin.types";

export interface PhantomBitcoinProvider {
  connect: (network: Network) => Promise<{ address: string; publicKey: string}>;
  requestAccounts: () => Promise<{ 
    address: string; 
    addressType: string; 
    publicKey: string;
    purpose: string; 
  }[]>;
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