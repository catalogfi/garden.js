import { SelectedAccount } from '../../bitcoin.types';
import { Network } from '@gardenfi/utils';

export interface OKXBitcoinProvider {
  selectedAccount: SelectedAccount;
  connect: () => Promise<{ address: string; publicKey: string }>;
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  getNetwork: () => Promise<string>;
  switchNetwork: (network: Network) => Promise<string>;
  getPublicKey: () => Promise<string>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>;
  send: (params: {
    from: string;
    to: string;
    value: string;
    satBytes?: string;
    memo?: string;
    memoPos?: number;
  }) => Promise<{ txhash: string }>;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
  disconnect: () => void;
}
