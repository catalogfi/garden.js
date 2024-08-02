import { AsyncResult } from '@catalogfi/utils';

export interface IInjectedBitcoinProvider {
  getBalance: () => AsyncResult<number, string>;
  selectedAccount: SelectedAccount;
  /**
   * requests accounts from the wallet, if not connected, it will connect first
   * @returns {AsyncResult<string[], string>}
   */
  requestAccounts: () => AsyncResult<string[], string>;
  /**
   * silently gets accounts if already connected
   * @returns {AsyncResult<string[], string>}
   */
  getAccounts: () => AsyncResult<string[], string>;
  //no need to take fee rates as user can set it in the wallet while signing the transaction
  sendBitcoin: (
    toAddress: string,
    satoshis: number
  ) => AsyncResult<string, string>;
  getNetwork: () => AsyncResult<Network, string>;
  connect: () => AsyncResult<void, string>;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
}

export enum Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export type SelectedAccount = {
  address: string;
  publicKey: string;
};

export interface UnisatBitcoinProvider {
  initialize: () => Promise<{ address: string; publicKey: string }>;
  getAccounts: () => Promise<string[]>;
  requestAccounts: () => Promise<string[]>;
  sendBitcoin: (toAddress: string, satoshis: number) => Promise<string>;
  getBalance: () => Promise<{
    confirmed: number;
    unconfirmed: number;
    total: number;
  }>;
  _selectedAddress: string;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
}

export interface XVerseBitcoinProvider {
  request: (method: string, params: any) => Promise<any>;
  sendBtcTransaction: (params: any) => Promise<any>;
  signMessage: (params: any) => Promise<any>;
}

export interface BitcoinWallet {
  name: string;
  symbol: string;
  connect: () => AsyncResult<IInjectedBitcoinProvider, string>;
}
