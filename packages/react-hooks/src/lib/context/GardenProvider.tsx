import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { useWalletClient } from 'wagmi';
import { useSecretManager } from '../hooks/useSecretManager';
import { useOrderbook } from '../hooks/useOrderbook';
import {
  EvmRelay,
  Garden,
  IGardenJS,
  ISecretManager,
  Quote,
  switchOrAddNetwork,
} from '@gardenfi/core';
import { SwapParams } from '@gardenfi/core';
import type {
  GardenContextType,
  GardenProviderProps,
  QuoteParams,
} from './gardenProvider.types';
import { Err, Ok } from '@catalogfi/utils';
import { isBitcoin, MatchedOrder } from '@gardenfi/orderbook';
import {
  BitcoinProvider,
  BitcoinWallet,
  IBitcoinWallet,
} from '@catalogfi/wallets';
import { IAuth, Siwe, Url } from '@gardenfi/utils';
import { constructOrderpair } from '../utils';

export const GardenContext = createContext<GardenContextType>({});

export const GardenProvider: FC<GardenProviderProps> = ({
  children,
  config,
}) => {
  const [secretManager, setSecretManager] = useState<ISecretManager>();
  const [garden, setGarden] = useState<IGardenJS>();
  const [auth, setAuth] = useState<IAuth>();
  const [bitcoinWallet, setBitcoinWallet] = useState<IBitcoinWallet>();
  const [pendingOrders, setPendingOrders] = useState<MatchedOrder[]>();

  const quote = new Quote(config.quoteUrl);

  const { data: walletClient } = useWalletClient();
  const { initializeSecretManager } = useSecretManager(setSecretManager);
  const { orderbook } = useOrderbook(config.orderBookUrl, auth);

  const bitcoinProvider = useMemo(
    () => new BitcoinProvider(config.bitcoinNetwork, config.bitcoinRPCUrl),
    [config.bitcoinNetwork, config.bitcoinRPCUrl],
  );

  const swap = async (params: SwapParams) => {
    if (!orderbook || !walletClient || !auth)
      return Err('Orderbook or walletClient or auth not initialized');

    // Get current garden instance or create a new one
    let currentGarden = garden;
    if (!secretManager || !currentGarden) {
      const smRes = await initializeSecretManager();
      if (smRes.error) return Err(smRes.error);

      const btcWallet = BitcoinWallet.fromPrivateKey(
        smRes.val.getMasterPrivKey(),
        bitcoinProvider,
      );

      currentGarden = new Garden({
        orderbookURl: config.orderBookUrl,
        secretManager: smRes.val,
        quote,
        auth,
        wallets: {
          evmWallet: walletClient,
          btcWallet: btcWallet,
        },
      });
      setGarden(currentGarden);
      setBitcoinWallet(btcWallet);
    }

    const order = await currentGarden.swap(params);
    if (order.error) return Err(order.error);

    if (isBitcoin(order.val.source_swap.chain)) return Ok(order.val);

    // switch network if needed
    const switchRes = await switchOrAddNetwork(
      params.fromAsset.chain,
      walletClient,
    );
    if (switchRes.error)
      return Err('Failed to switch network: ' + switchRes.error);
    const newWalletClient = switchRes.val.walletClient;

    //only initiate if EVM
    const evmRelay = new EvmRelay(order.val, config.orderBookUrl, auth);
    const initRes = await evmRelay.init(newWalletClient);
    if (initRes.error) return Err(initRes.error);

    const updatedOrder: MatchedOrder = {
      ...order.val,
      source_swap: {
        ...order.val.source_swap,
        initiate_tx_hash: initRes.val,
      },
    };

    return Ok(updatedOrder);
  };

  const getQuote = async ({
    fromAsset,
    toAsset,
    amount,
    isExactOut = false,
  }: QuoteParams) =>
    await quote.getQuote(
      constructOrderpair(fromAsset, toAsset),
      amount,
      isExactOut,
    );

  // initialize auth
  useEffect(() => {
    if (!walletClient) return;
    const auth = new Siwe(new Url(config.orderBookUrl), walletClient, {
      store: config.store,
    });
    setAuth(auth);
  }, [walletClient]);

  //initialize bitcoin wallet
  useEffect(() => {
    if (!secretManager) return;
    const wallet = BitcoinWallet.fromPrivateKey(
      secretManager.getMasterPrivKey(),
      bitcoinProvider,
    );
    setBitcoinWallet(wallet);
  }, [secretManager, bitcoinProvider]);

  //initialize gardenInstance
  useEffect(() => {
    if (!secretManager || !walletClient || !orderbook || !auth) return;
    const garden = new Garden({
      orderbookURl: config.orderBookUrl,
      secretManager,
      quote,
      auth,
      wallets: {
        evmWallet: walletClient,
        btcWallet: bitcoinWallet,
      },
    });
    setGarden(garden);
  }, [secretManager, walletClient, orderbook, auth, bitcoinWallet]);

  // Execute orders (redeem or refund)
  useEffect(() => {
    if (!garden) return;
    garden.execute();
    garden.on('onPendingOrdersChanged', (pendingOrders) => {
      setPendingOrders(pendingOrders);
    });
  }, [garden]);

  return (
    <GardenContext.Provider
      value={{
        orderBookUrl: config.orderBookUrl,
        initializeSecretManager,
        orderBook: orderbook,
        swap,
        pendingOrders,
        getQuote,
        secretManager,
        garden,
      }}
    >
      {children}
    </GardenContext.Provider>
  );
};

export const useGarden = () => {
  const garden = React.useContext(GardenContext);
  if (!garden)
    throw new Error('useGarden must be used within a GardenProvider');
  return garden;
};
