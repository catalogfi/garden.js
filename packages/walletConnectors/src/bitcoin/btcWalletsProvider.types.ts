import { AsyncResult, Result } from '@catalogfi/utils';
import { IInjectedBitcoinProvider } from './bitcoin.types';
import { IStore, Network } from '@gardenfi/utils';

export type AvailableWallets = {
  [key: string]: IInjectedBitcoinProvider;
};

export type BTCWalletProviderContextType = {
  availableWallets: AvailableWallets;
  connect: (
    BitcoinWallet: IInjectedBitcoinProvider,
    network?: Network,
  ) => AsyncResult<void, string>;
  updateAccount: () => Promise<void>;
  provider: IInjectedBitcoinProvider | undefined;
  account: string | undefined;
  network: Network | undefined;
  disconnect: () => Result<void, string>;
  isConnecting: boolean;
  isConnected: boolean;
};

export type BTCWalletProviderProps = {
  network: Network;
  children: React.ReactNode;
  store: IStore;
};
