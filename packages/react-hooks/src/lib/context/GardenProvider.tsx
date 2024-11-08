import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { useWalletClient } from 'wagmi';
import { useSecretManager } from '../hooks/useSecretManager';
import { useOrderbook } from '../hooks/useOrderbook';
import {
  BlockNumberFetcher,
  EvmRelay,
  Garden,
  IGardenJS,
  ISecretManager,
  OrderWithStatus,
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
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';
import { IAuth, Siwe, Url } from '@gardenfi/utils';
import { constructOrderpair } from '../utils';

export const GardenContext = createContext<GardenContextType>({
  isExecuting: false,
});

export const GardenProvider: FC<GardenProviderProps> = ({
  children,
  config,
}) => {
  const [secretManager, setSecretManager] = useState<ISecretManager>();
  const [garden, setGarden] = useState<IGardenJS>();
  const [auth, setAuth] = useState<IAuth>();
  const [pendingOrders, setPendingOrders] = useState<OrderWithStatus[]>();
  const isExecuting = useMemo(
    () => !!(secretManager && garden && auth && pendingOrders),
    [secretManager, garden, auth, pendingOrders],
  );

  const quote = useMemo(() => new Quote(config.quoteUrl), [config.quoteUrl]);
  const blockNumberFetcher = useMemo(() => {
    const blockNumberFetcherNetwork =
      config.network === BitcoinNetwork.Mainnet
        ? 'mainnet'
        : config.network === BitcoinNetwork.Testnet
        ? 'testnet'
        : undefined;

    return config.blockNumberFetcherUrl && blockNumberFetcherNetwork
      ? new BlockNumberFetcher(
          config.blockNumberFetcherUrl,
          blockNumberFetcherNetwork,
        )
      : undefined;
  }, [config.blockNumberFetcherUrl, config.network]);
  const bitcoinProvider = useMemo(
    () => new BitcoinProvider(config.network, config.bitcoinRPCUrl),
    [config.network, config.bitcoinRPCUrl],
  );

  const { data: walletClient } = useWalletClient();
  const { initializeSecretManager } = useSecretManager(setSecretManager);
  const { orderbook } = useOrderbook(
    config.orderBookUrl,
    auth,
    setPendingOrders,
    blockNumberFetcher,
  );

  const initializeSMandGarden = async () => {
    if (!walletClient || !auth)
      return Err('WalletClient or auth not initialized');

    const smRes = await initializeSecretManager();
    if (smRes.error) return Err(smRes.error);

    const wallet = BitcoinWallet.fromPrivateKey(
      smRes.val.getMasterPrivKey(),
      bitcoinProvider,
    );

    const garden = new Garden({
      orderbookURl: config.orderBookUrl,
      secretManager: smRes.val,
      quote,
      auth,
      wallets: {
        evmWallet: walletClient,
        btcWallet: wallet,
      },
      blockNumberFetcher,
    });
    setGarden(garden);
    return Ok(garden);
  };

  const swapAndInitiate = async (params: SwapParams) => {
    if (!orderbook || !walletClient || !auth)
      return Err('Orderbook or walletClient or auth not initialized');

    // Get current garden instance or create a new one
    let currentGarden = garden;
    if (!secretManager || !currentGarden) {
      const gardenRes = await initializeSMandGarden();
      if (gardenRes.error) return Err(gardenRes.error);
      currentGarden = gardenRes.val;
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

  const evmInitiate = async (order: MatchedOrder) => {
    if (!walletClient || !auth)
      return Err('Orderbook or walletClient or auth not initialized');

    if (isBitcoin(order.source_swap.chain))
      return Err('Not an EVM order: sourceSwap.chain is Bitcoin');

    // Get current garden instance or create a new one
    let currentGarden = garden;
    if (!secretManager || !currentGarden) {
      const gardenRes = await initializeSMandGarden();
      if (gardenRes.error) return Err(gardenRes.error);
      currentGarden = gardenRes.val;
    }

    // switch network if needed
    const switchRes = await switchOrAddNetwork(
      order.source_swap.chain,
      walletClient,
    );
    if (switchRes.error)
      return Err('Failed to switch network: ' + switchRes.error);
    const newWalletClient = switchRes.val.walletClient;

    //only initiate if EVM
    const evmRelay = new EvmRelay(order, config.orderBookUrl, auth);
    const initRes = await evmRelay.init(newWalletClient);
    if (initRes.error) return Err(initRes.error);

    const updatedOrder: MatchedOrder = {
      ...order,
      source_swap: {
        ...order.source_swap,
        initiate_tx_hash: initRes.val,
      },
    };

    return Ok(updatedOrder);
  };

  const getQuote = useMemo(
    () =>
      async ({ fromAsset, toAsset, amount, isExactOut = false }: QuoteParams) =>
        await quote.getQuote(
          constructOrderpair(fromAsset, toAsset),
          amount,
          isExactOut,
        ),
    [quote],
  );

  // initialize auth
  useEffect(() => {
    if (!walletClient || !window) return;
    const auth = new Siwe(new Url(config.orderBookUrl), walletClient, {
      store: config.store,
      domain: window.location.hostname,
    });
    setAuth(auth);
  }, [walletClient]);

  //initialize gardenInstance and bitcoin wallet
  useEffect(() => {
    if (!secretManager || !walletClient || !orderbook || !auth) return;
    const wallet = BitcoinWallet.fromPrivateKey(
      secretManager.getMasterPrivKey(),
      bitcoinProvider,
    );

    const garden = new Garden({
      orderbookURl: config.orderBookUrl,
      secretManager,
      quote,
      auth,
      wallets: {
        evmWallet: walletClient,
        btcWallet: wallet,
      },
      blockNumberFetcher,
    });
    setGarden(garden);
  }, [secretManager, walletClient, orderbook, auth]);

  // Execute orders (redeem or refund)
  useEffect(() => {
    if (!garden) return;
    const unsubscribe = garden.execute();

    const handlePendingOrdersChange = (orders: OrderWithStatus[]) =>
      setPendingOrders(orders);
    garden.on('onPendingOrdersChanged', handlePendingOrdersChange);

    return () => {
      (async () => {
        const unsubscribeFn = await unsubscribe;
        unsubscribeFn();
      })();
      garden.off('onPendingOrdersChanged', handlePendingOrdersChange);
    };
  }, [garden]);

  return (
    <GardenContext.Provider
      value={{
        orderBookUrl: config.orderBookUrl,
        initializeSecretManager,
        orderBook: orderbook,
        swapAndInitiate,
        pendingOrders,
        getQuote,
        secretManager,
        garden,
        isExecuting,
        evmInitiate,
        quote,
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
