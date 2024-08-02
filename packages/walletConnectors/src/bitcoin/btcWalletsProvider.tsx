import React, {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
} from 'react';
import {
  BitcoinWallet,
  IInjectedBitcoinProvider,
  UnisatBitcoinProvider,
  XVerseBitcoinProvider,
} from './bitcoin.types';
import { OKXProvider } from './providers/okx/provider';
import { OKXBitcoinProvider } from './providers/okx/okx.types';
import { OKX_WALLET } from './providers/okx/okxWallet';
import { AsyncResult, Err, Ok, Void } from '@catalogfi/utils';

declare global {
  interface Window {
    okxwallet?: {
      bitcoin?: OKXBitcoinProvider;
    };
    XverseProviders?: {
      BitcoinProvider: XVerseBitcoinProvider;
    };
    unisat?: UnisatBitcoinProvider;
  }
}

const BTCWalletProviderContext = createContext(
  {} as {
    walletList: { [key: string]: BitcoinWallet };
    connect: (BitcoinWallet: BitcoinWallet) => AsyncResult<void, string>;
    provider: IInjectedBitcoinProvider | undefined;
    account: string;
  }
);

export const BTCWalletProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<IInjectedBitcoinProvider>();
  const [account, setAccount] = useState<string>('');
  const [walletList, setWalletList] = useState<{
    [key: string]: BitcoinWallet;
  }>({});

  //connect to the specified wallet and set the provider and account
  const connect = async (BitcoinWallet: BitcoinWallet) => {
    const res = await BitcoinWallet.connect();
    if (res.error) {
      return Err(res.error);
    }
    const provider = res.val;
    const accounts = await provider.getAccounts();
    if (accounts.error) return Err(accounts.error);
    if (accounts.val.length > 0) {
      setAccount(accounts.val[0]);
      setProvider(provider);
      return Ok(Void);
    }
    return Err('No accounts found');
  };

  //adds wallet to the wallet list
  const addToWalletList = (wallet: BitcoinWallet) => {
    setWalletList((p) => ({
      ...p,
      [wallet.symbol]: wallet,
    }));
  };

  //updates the available wallets list
  useEffect(() => {
    if (window.okxwallet && window.okxwallet.bitcoin) {
      const okxProvider = new OKXProvider(window.okxwallet.bitcoin);
      okxProvider.getAccounts().then((accounts) => {
        if (accounts.error) return;
        if (accounts.val.length > 0) {
          setAccount(accounts.val[0]);
          setProvider(okxProvider);
        }
      });
      addToWalletList(OKX_WALLET);
    }
  }, []);

  //handles account change
  useEffect(() => {
    if (!provider) return;
    provider.on('accountsChanged', () => {
      console.log('accounts changed');
    });

    return () => {
      provider.off('accountsChanged', () => {
        console.log('accounts changed');
      });
    };
  }, [provider]);

  return (
    <BTCWalletProviderContext.Provider
      value={{ walletList, connect, provider, account }}
    >
      {children}
    </BTCWalletProviderContext.Provider>
  );
};

export const useBitcoinWallet = () => {
  const context = useContext(BTCWalletProviderContext);
  if (!context) {
    throw new Error('useBitcoinWallet must be used within a BTCWalletProvider');
  }
  return context;
};
