import { AsyncResult } from '@catalogfi/utils';
import { Network } from '@gardenfi/utils';
import { WALLET_CONFIG } from './constants';

export type Balance = {
  confirmed: number;
  unconfirmed: number;
  total: number;
};

export type Connect = {
  address: string;
  provider: IInjectedBitcoinProvider;
  network: Network;
  id: WalletId;
};

export type WalletId = (typeof WALLET_CONFIG)[keyof typeof WALLET_CONFIG]['id'];

export type ProviderEvents = {
  accountsChanged: (accounts: string[]) => void;
};

export interface IInjectedBitcoinProvider {
  id: WalletId;
  address: string;
  name: string;
  icon: string;

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
    satoshis: number,
  ) => AsyncResult<string, string>;
  getNetwork: () => AsyncResult<Network, string>;
  switchNetwork: () => AsyncResult<Network, string>;
  connect: (network?: Network) => AsyncResult<Connect, string>;
  disconnect: () => AsyncResult<string, string>;
  on<E extends keyof ProviderEvents>(event: E, cb: ProviderEvents[E]): void;
  off<E extends keyof ProviderEvents>(event: E, cb: ProviderEvents[E]): void;
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
