import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { useOrderbook } from '../hooks/useOrderbook';
import {
  Garden,
  IGardenJS,
  OrderStatus,
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

  const { pendingOrders } = useOrderbook(garden);

  const isExecuting = useMemo(() => {
    return !!garden?.secretManager.isInitialized;
  }, [garden]);

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

  const getQuote = useMemo(
    () =>
      async ({
        fromAsset,
        toAsset,
        amount,
        isExactOut = false,
      }: QuoteParams) => {
        if (!garden) return;

        return await garden.quote.getQuote(
          constructOrderpair(fromAsset, toAsset),
          amount,
          isExactOut,
        );
      },
    [garden],
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

  // Initialize Garden
  useEffect(() => {
    if (!config.walletClient) return;
    if (!config.walletClient.account?.address)
      throw new Error("WalletClient doesn't have an account");

    setGarden(
      new Garden({
        environment: config.environment,
        evmWallet: config.walletClient,
      }),
    );
  }, [config.walletClient]);

  return (
    <GardenContext.Provider
      value={{
        orderBook: garden?.orderbook,
        quote: garden?.quote,
        swapAndInitiate,
        pendingOrders,
        getQuote,
        garden: garden,
        isExecuting,
        isExecutorRequired,
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
