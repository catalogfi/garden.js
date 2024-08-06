import { AsyncResult } from '@catalogfi/utils';

export type Balance = {
  confirmed: number;
  unconfirmed: number;
  total: number;
};

export type Connect = {
  address: string;
  provider: IInjectedBitcoinProvider;
  network: Network;
};

export interface IInjectedBitcoinProvider {
  address: string;
  getBalance: () => AsyncResult<Balance, string>;
  // selectedAccount: SelectedAccount;
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
  connect: () => AsyncResult<Connect, string>;
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

export interface BitcoinWallet {
  name: string;
  symbol: string;
  connect: () => AsyncResult<IInjectedBitcoinProvider, string>;
}
