import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { useOrderbook } from '../hooks/useOrderbook';
import {
  API,
  Garden,
  IGardenJS,
  OrderStatus,
  Quote,
  SecretManager,
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
import { constructOrderpair } from '../utils';

export const GardenContext = createContext<GardenContextType>({
  isExecuting: false,
  isExecutorRequired: false,
});

export const GardenProvider: FC<GardenProviderProps> = ({
  children,
  config,
}) => {
  const [garden, setGarden] = useState<IGardenJS>();

  const { pendingOrders, isExecuting, digestKey } = useOrderbook(
    garden,
    config.walletClient?.account?.address,
  );

  const isExecutorRequired = useMemo(() => {
    return !!pendingOrders.find((order) => {
      const status = order.status;
      return (
        status === OrderStatus.InitiateDetected ||
        status === OrderStatus.Initiated ||
        status === OrderStatus.CounterPartyInitiateDetected ||
        status === OrderStatus.CounterPartyInitiated ||
        status === OrderStatus.RedeemDetected ||
        status === OrderStatus.Expired
      );
    });
  }, [pendingOrders]);

  const quote = useMemo(() => {
    return new Quote(config.quoteUrl || API[config.environment].quote);
  }, [config.quoteUrl, config.environment]);

  const getQuote = useMemo(
    () =>
      async ({
        fromAsset,
        toAsset,
        amount,
        isExactOut = false,
        request,
      }: QuoteParams) => {
        return await quote.getQuote(
          constructOrderpair(fromAsset, toAsset),
          amount,
          isExactOut,
          request,
        );
      },
    [quote],
  );

  const swapAndInitiate = async (params: SwapParams) => {
    if (!garden || !config.walletClient) return Err('Garden not initialized');

    const order = await garden.swap(params);
    if (order.error) return Err(order.error);

    if (isBitcoin(order.val.source_swap.chain)) return Ok(order.val);

    // switch network if needed
    const switchRes = await switchOrAddNetwork(
      params.fromAsset.chain,
      config.walletClient,
    );
    if (switchRes.error)
      return Err('Failed to switch network: ' + switchRes.error);
    const newWalletClient = switchRes.val.walletClient;

    //only initiate if EVM
    const initRes = await garden.evmRelay.init(newWalletClient, order.val);
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
    if (!garden || !config.walletClient) return Err('garden not initialized');

    if (isBitcoin(order.source_swap.chain))
      return Err('Not an EVM order: sourceSwap.chain is Bitcoin');

    // switch network if needed
    const switchRes = await switchOrAddNetwork(
      order.source_swap.chain,
      config.walletClient,
    );
    if (switchRes.error)
      return Err('Failed to switch network: ' + switchRes.error);
    const newWalletClient = switchRes.val.walletClient;

    //only initiate if EVM
    const initRes = await garden.evmRelay.init(newWalletClient, order);
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

  // Initialize Garden
  useEffect(() => {
    if (!config.walletClient) return;
    if (!config.walletClient.account?.address)
      throw new Error("WalletClient doesn't have an account");
    const secretManager = digestKey
      ? SecretManager.fromDigestKey(digestKey)
      : undefined;
    setGarden(
      new Garden({
        environment: config.environment,
        evmWallet: config.walletClient,
        siweOpts: config.siweOpts ?? {
          domain: window.location.hostname,
          store: config.store,
        },
        apiKey: config.apiKey,
        secretManager,
      }),
    );
  }, [config.walletClient, digestKey]);

  return (
    <GardenContext.Provider
      value={{
        orderBook: garden?.orderbook,
        quote: quote,
        swapAndInitiate,
        pendingOrders,
        getQuote,
        garden: garden,
        isExecuting,
        isExecutorRequired,
        evmInitiate,
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
