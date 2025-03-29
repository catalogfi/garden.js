import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { useOrderbook } from '../hooks/useOrderbook';
import { API, Garden, IGardenJS, Quote } from '@gardenfi/core';
import { SwapParams } from '@gardenfi/core';
import type {
  GardenContextType,
  GardenProviderProps,
  QuoteParams,
} from './gardenProvider.types';
import { Err, Ok } from '@catalogfi/utils';
import {
  BlockchainType,
  getBlockchainType,
  isBitcoin,
  MatchedOrder,
} from '@gardenfi/orderbook';
import { constructOrderpair } from '../utils';
import { useDigestKey } from '../hooks/useDigestKey';

export const GardenContext = createContext<GardenContextType>({});

export const GardenProvider: FC<GardenProviderProps> = ({
  children,
  config,
}) => {
  const [garden, setGarden] = useState<IGardenJS>();

  const { digestKey } = useDigestKey();
  const { pendingOrders } = useOrderbook(garden, digestKey);

  const quote = useMemo(() => {
    return config.quote ?? new Quote(API[config.environment].quote);
  }, [config.quote, config.environment]);

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
    if (!garden) return Err('Garden not initialized');

    const order = await garden.swap(params);
    if (order.error) return Err(order.error);

    if (isBitcoin(order.val.source_swap.chain)) return Ok(order.val);

    let init_tx_hash: string;
    switch (getBlockchainType(order.val.source_swap.chain)) {
      case BlockchainType.EVM: {
        if (!garden.evmHTLC)
          return Err('EVM HTLC not initialized: Please provide evmHTLC');

        const initRes = await garden.evmHTLC.initiate(order.val);
        if (initRes.error) return Err(initRes.error);
        init_tx_hash = initRes.val;
        break;
      }
      case BlockchainType.Starknet: {
        if (!garden.starknetHTLC)
          return Err(
            'Starknet HTLC not initialized: Please provide starknetHTLC',
          );

        const starknetInitRes = await garden.starknetHTLC.initiate(order.val);
        if (starknetInitRes.error) return Err(starknetInitRes.error);
        init_tx_hash = starknetInitRes.val;
        break;
      }
      default:
        return Err('Unsupported chain');
    }

    const updatedOrder: MatchedOrder = {
      ...order.val,
      source_swap: {
        ...order.val.source_swap,
        initiate_tx_hash: init_tx_hash,
      },
    };

    return Ok(updatedOrder);
  };

  // Initialize Garden
  useEffect(() => {
    if (!window || !config.wallets || !config.htlc || !digestKey) return;

    let garden: Garden;
    if (config.wallets) {
      garden = Garden.from({
        environment: config.environment,
        digestKey: digestKey,
        wallets: config.wallets,
        siweOpts: {
          store: localStorage,
        },
      });
    } else if (config.htlc) {
      garden = new Garden({
        environment: config.environment,
        digestKey: digestKey,
        htlc: config.htlc,
        siweOpts: {
          store: localStorage,
        },
      });
    } else {
      // Handle case where neither wallets nor htlc is provided
      return;
    }

    setGarden(garden);
  }, [config.wallets, config.htlc, config.environment, digestKey]);

  return (
    <GardenContext.Provider
      value={{
        orderBook: garden?.orderbook,
        quote: quote,
        swapAndInitiate,
        pendingOrders,
        getQuote,
        garden: garden,
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
