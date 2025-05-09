import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { useOrderbook } from '../hooks/useOrderbook';
import { Garden, IGardenJS } from '@gardenfi/core';
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
import { hasAnyValidValue } from '../utils';

export const GardenContext = createContext<GardenContextType>({
  pendingOrders: [],
});

export const GardenProvider: FC<GardenProviderProps> = ({
  children,
  config,
}) => {
  const [garden, setGarden] = useState<IGardenJS>();

  const { digestKey } = useDigestKey();
  const { pendingOrders } = useOrderbook(garden);

  const getQuote = useMemo(
    () =>
      async ({
        fromAsset,
        toAsset,
        amount,
        isExactOut = false,
        options,
      }: QuoteParams) => {
        return (
          garden &&
          (await garden.quote.getQuote(
            constructOrderpair(fromAsset, toAsset),
            amount,
            isExactOut,
            options,
          ))
        );
      },
    [garden],
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
        if (!initRes.ok) return Err(initRes.error);
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
      case BlockchainType.Bitcoin:
        init_tx_hash = order.val.source_swap.initiate_tx_hash;
        break;
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
    if (!window || !digestKey) return;
    if (!('wallets' in config) && !('htlc' in config)) return;

    let garden: Garden;
    if (
      'wallets' in config &&
      Object.keys(config.wallets).length > 0 &&
      hasAnyValidValue(config.wallets)
    ) {
      garden = Garden.fromWallets({
        ...config,
        digestKey: digestKey,
      });
    } else if (
      'htlc' in config &&
      Object.keys(config.htlc).length > 0 &&
      hasAnyValidValue(config.htlc)
    ) {
      garden = new Garden({
        ...config,
        digestKey: digestKey,
      });
    } else {
      // Handle case where neither wallets nor htlc is provided
      return;
    }

    setGarden(garden);
  }, [config, digestKey]);

  return (
    <GardenContext.Provider
      value={{
        swapAndInitiate,
        pendingOrders,
        getQuote,
        garden,
        orderBook: garden?.orderbook,
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
