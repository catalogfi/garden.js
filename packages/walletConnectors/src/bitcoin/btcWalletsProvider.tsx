import React, {
  useState,
  createContext,
  useContext,
  ReactNode,
  useEffect,
  useCallback,
} from 'react';
import { BitcoinWallets, IInjectedBitcoinProvider, Network } from './bitcoin.types';
import { OKXProvider } from './providers/okx/provider';
import { OKXBitcoinProvider } from './providers/okx/okx.types';
import { AsyncResult, Err, Ok, Void } from '@catalogfi/utils';
import { UnisatBitcoinProvider } from './providers/unisat/unisat.types';
import { UnisatProvider } from './providers/unisat/provider';
import { XverseProvider } from './providers/xverse/provider';
import { XVerseBitcoinProvider } from './providers/xverse/xverse.types';
import { XdefiBitcoinProvider } from './providers/xdefi/xdefi.types';
import { XdefiProvider } from './providers/xdefi/provider';
import { PhantomBitcoinProvider } from './providers/phantom/phantom.types';
import { PhantomProvider } from './providers/phantom/provider';

declare global {
  interface Window {
    okxwallet?: {
      bitcoin?: OKXBitcoinProvider;
      bitcoinTestnet?: OKXBitcoinProvider;
    };
    XverseProviders?: {
      BitcoinProvider: XVerseBitcoinProvider;
    };
    unisat?: UnisatBitcoinProvider;
    xfi?: {
      bitcoin: XdefiBitcoinProvider;
    };
    phantom?: {
      bitcoin: PhantomBitcoinProvider;
    }
  }
}

const BTCWalletProviderContext = createContext(
  {} as {
    walletList: { [key: string]: IInjectedBitcoinProvider };
    connect: (
      BitcoinWallet: IInjectedBitcoinProvider,
      network: Network
    ) => AsyncResult<void, string>;
    updateAccount: () => Promise<void>;
    provider: IInjectedBitcoinProvider | undefined;
    account: string | undefined;
    network: Network | undefined;
  }
);

export const BTCWalletProvider = ({ children }: { children: ReactNode }) => {
  const [provider, setProvider] = useState<IInjectedBitcoinProvider>();
  const [account, setAccount] = useState<string>();
  const [network, setNetwork] = useState<Network>();
  const [walletList, setWalletList] = useState<{
    [key: string]: IInjectedBitcoinProvider;
  }>({});

  //connect to the specified wallet and set the provider and account
  const connect = async (BitcoinWallet: IInjectedBitcoinProvider, network: Network) => {
    const res = await BitcoinWallet.connect(network);
    if (res.error) {
      return Err(res.error);
    }
    setProvider(res.val.provider);
    setAccount(res.val.address);
    setNetwork(res.val.network);

    return Ok(Void);
  };

  const disconnect = () => {
    if (!provider) return;
    provider.disconnect();
    return Ok(Void);
  }

  const updateAccount = useCallback(async () => {
    if (!provider) return;
    
    const accounts = await provider.getAccounts();
    if (accounts.error) {
      console.error('Error getting accounts:', accounts.error);
      return;
    }

    setAccount(accounts.val[0]);

    const network = await provider.getNetwork();
    if (network.error) {
      console.error('Error getting network:', network.error);
      return;
    }

    setNetwork(network.val);
  }, [provider])

  //adds wallet to the wallet list
  const addToWalletList = (name: string, wallet: IInjectedBitcoinProvider) => {
    setWalletList((p) => ({
      ...p,
      [name]: wallet,
    }));
  };

  //updates the available wallets list
  useEffect(() => {
    if (window.okxwallet && window.okxwallet.bitcoin && window.okxwallet.bitcoinTestnet) {
      const okxProvider = new OKXProvider(window.okxwallet.bitcoin, window.okxwallet.bitcoinTestnet);
      addToWalletList(BitcoinWallets.OKX_WALLET, okxProvider);
      okxProvider.getAccounts();
    }
    if (window.unisat) {
      const uniProvider = new UnisatProvider(window.unisat);
      addToWalletList(BitcoinWallets.UNISAT, uniProvider);
      uniProvider.getAccounts();
    }
    if (window.XverseProviders && window.XverseProviders.BitcoinProvider) {
      const xverseProvider = new XverseProvider(
        window.XverseProviders.BitcoinProvider
      );
      addToWalletList(BitcoinWallets.XVERSE, xverseProvider);
      xverseProvider.getAccounts();
    }
    if (window.xfi && window.xfi.bitcoin) {
      const xdefiProvider = new XdefiProvider(window.xfi.bitcoin);
      addToWalletList(BitcoinWallets.XDEFI, xdefiProvider);
      xdefiProvider.getAccounts();
    }
    if (window.phantom && window.phantom.bitcoin) {
      const phantomProvider = new PhantomProvider(window.phantom.bitcoin);
      addToWalletList(BitcoinWallets.PHANTOM, phantomProvider);
      phantomProvider.getAccounts();
    }
  }, []);

  useEffect(() => {
    if (!provider) return;
    provider.on('accountsChanged', (obj) => {
      setAccount(obj.val);
    });

    return () => {
      provider.off('accountsChanged', (obj) => {
        setAccount(obj.val);
      });
    };
  }, [provider]);

  return (
    <BTCWalletProviderContext.Provider
      value={{ walletList, connect, provider, account, network, updateAccount }}
    >
      {children}
    </BTCWalletProviderContext.Provider>
  );
};

export const useBitcoinWallet = () => {
  const context = useContext(BTCWalletProviderContext);
  if (!context) {
    throw new Error('useBitcoinWallet must be used within BTCWalletProvider');
  }
  return context;
};
