import React, {
  useState,
  createContext,
  useContext,
  useEffect,
  useCallback,
} from 'react';
import {
  BitcoinWallets,
  Connect,
  IInjectedBitcoinProvider,
  WalletId,
} from './bitcoin.types';
import { OKXProvider } from './providers/okx/provider';
import { OKXBitcoinProvider } from './providers/okx/okx.types';
import { Err, Ok, Void } from '@catalogfi/utils';
import { UnisatBitcoinProvider } from './providers/unisat/unisat.types';
import { XVerseBitcoinProvider } from './providers/xverse/xverse.types';
import { XdefiBitcoinProvider } from './providers/xdefi/xdefi.types';
import { PhantomBitcoinProvider } from './providers/phantom/phantom.types';
import { UnisatProvider } from './providers/unisat/provider';
// import { XverseProvider } from './providers/xverse/provider';
// import { XdefiProvider } from './providers/xdefi/provider';
// import { PhantomProvider } from './providers/phantom/provider';
import {
  AvailableWallets,
  BTCWalletProviderContextType,
  BTCWalletProviderProps,
} from './btcWalletsProvider.types';
import { Network } from '@gardenfi/utils';
import { walletIDs } from './constants';

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
    };
  }
}

const BTCWalletProviderContext = createContext<
  BTCWalletProviderContextType | undefined
>(undefined);

export const BTCWalletProvider = ({
  children,
  network,
  store,
}: BTCWalletProviderProps) => {
  const [provider, setProvider] = useState<IInjectedBitcoinProvider>();
  const [account, setAccount] = useState<string>();
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [availableWallets, setAvailableWallets] = useState<AvailableWallets>(
    {},
  );

  //connect to the specified wallet and set the provider and account
  const connect = async (bitcoinWallet: IInjectedBitcoinProvider) => {
    setIsConnecting(true);
    const res = await bitcoinWallet.connect(network);
    if (res.error) {
      setIsConnecting(false);
      return Err(res.error);
    }

    if (res.val.network !== network) {
      setIsConnecting(false);
      return Err('Network mismatch');
    }

    setProvider(res.val.provider);
    setAccount(res.val.address);

    store.setItem('bitcoinWallet', JSON.stringify(res.val));

    setIsConnecting(false);
    return Ok(Void);
  };

  const disconnect = () => {
    if (!provider) return Err('No provider to disconnect');
    provider.disconnect();
    setProvider(undefined);
    setAccount(undefined);

    store.removeItem('bitcoinWallet');

    return Ok(Void);
  };

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
  }, [provider]);

  //adds wallet to the available wallet list
  const addToWalletList = (name: string, wallet: IInjectedBitcoinProvider) => {
    setAvailableWallets((p) => ({
      ...p,
      [name]: wallet,
    }));
  };

  const isAlreadyConnected = (id: WalletId, network: Network) => {
    const previousConnectedData = store.getItem('bitcoinWallet');
    if (previousConnectedData) {
      const isAlreadyConnected: Connect = JSON.parse(previousConnectedData);
      if (
        isAlreadyConnected.id === id &&
        isAlreadyConnected.network === network
      )
        return true;
    }
    return false;
  };

  const updateWalletList = async () => {
    //TODO: only get accounts if the wallet is stored in localstorage which means already connected else don't fetch addresses
    if (window.okxwallet) {
      if (network === Network.TESTNET && window.okxwallet.bitcoinTestnet) {
        const okxProvider = new OKXProvider(
          window.okxwallet.bitcoinTestnet,
          network,
        );
        addToWalletList(BitcoinWallets.OKX_WALLET, okxProvider);

        if (isAlreadyConnected(walletIDs.OKX, Network.TESTNET)) {
          const res = await okxProvider.getAccounts();
          setAccount(res.val[0]);
          setProvider(okxProvider);
        }
      } else if (network === Network.MAINNET && window.okxwallet.bitcoin) {
        const okxProvider = new OKXProvider(window.okxwallet.bitcoin, network);
        addToWalletList(BitcoinWallets.OKX_WALLET, okxProvider);

        if (isAlreadyConnected(walletIDs.OKX, Network.MAINNET)) {
          const res = await okxProvider.getAccounts();
          setAccount(res.val[0]);
          setProvider(okxProvider);
        }
      }
    }
    if (window.unisat) {
      const uniProvider = new UnisatProvider(window.unisat);
      addToWalletList(BitcoinWallets.UNISAT, uniProvider);

      if (provider || account) return;
      if (!isAlreadyConnected(walletIDs.Unisat, network)) return;

      const res = await uniProvider.getAccounts();
      setAccount(res.val[0]);
      setProvider(uniProvider);
    }
    // if (window.XverseProviders && window.XverseProviders.BitcoinProvider) {
    //   const xverseProvider = new XverseProvider(
    //     window.XverseProviders.BitcoinProvider,
    //   );
    //   addToWalletList(BitcoinWallets.XVERSE, xverseProvider);
    //   const res = await xverseProvider.getAccounts();
    //   setAccount(res.val[0]);
    // }
    // if (window.xfi && window.xfi.bitcoin) {
    //   const xdefiProvider = new XdefiProvider(window.xfi.bitcoin);
    //   addToWalletList(BitcoinWallets.XDEFI, xdefiProvider);
    //   const res = await xdefiProvider.getAccounts();
    //   setAccount(res.val[0]);
    // }
    // if (window.phantom && window.phantom.bitcoin) {
    //   const phantomProvider = new PhantomProvider(window.phantom.bitcoin);
    //   addToWalletList(BitcoinWallets.PHANTOM, phantomProvider);
    //   const res = await phantomProvider.getAccounts();
    //   setAccount(res.val[0]);
    // }
  };

  //updates the available wallets list
  useEffect(() => {
    updateWalletList();
  }, []);

  useEffect(() => {
    if (!provider) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) return;

      setAccount(accounts[0]);
    };

    provider.on('accountsChanged', handleAccountsChanged);

    return () => {
      provider.off('accountsChanged', handleAccountsChanged);
    };
  }, [provider]);

  return (
    <BTCWalletProviderContext.Provider
      value={{
        availableWallets,
        connect,
        provider,
        account,
        network,
        isConnecting,
        updateAccount,
        disconnect,
      }}
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

//I will give network I want all the wallets to connect the given network
