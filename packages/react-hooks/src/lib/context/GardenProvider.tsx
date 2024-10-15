import React, { createContext, FC, useEffect, useMemo, useState } from 'react';
import { useWalletClient } from 'wagmi';
import { useSecretManager } from '../hooks/useSecretManager';
import { useOrderbook } from '../hooks/useOrderbook';
import {
  Garden,
  IGardenJS,
  IOrderExecutor,
  ISecretManager,
  OrderExecutor,
} from '@gardenfi/core';
import { SwapParams } from '@gardenfi/core';
import type {
  GardenContextType,
  GardenProviderProps,
} from './gardenProvider.types';
import { Err, Ok } from '@catalogfi/utils';
import { isBitcoin } from '@gardenfi/orderbook';
import {
  BitcoinProvider,
  BitcoinWallet,
  IBitcoinWallet,
} from '@catalogfi/wallets';

export const GardenContext = createContext<GardenContextType>({});

export const GardenProvider: FC<GardenProviderProps> = ({
  children,
  config,
}) => {
  const [secretManager, setSecretManager] = useState<ISecretManager>();
  const [garden, setGarden] = useState<IGardenJS>();
  const [bitcoinWallet, setBitcoinWallet] = useState<IBitcoinWallet>();
  const { data: walletClient } = useWalletClient();
  const { initializeSecretManager } = useSecretManager(setSecretManager);
  const { orderbook } = useOrderbook(config.orderBookUrl, config.store);

  const bitcoinProvider = useMemo(
    () => new BitcoinProvider(config.bitcoinNetwork, config.bitcoinRPCUrl),
    [config.bitcoinNetwork, config.bitcoinRPCUrl],
  );

  const swap = async (params: SwapParams) => {
    if (!garden || !orderbook || !secretManager || !walletClient)
      return Err('Garden not initialized');

    const order = await garden.swap(params);
    if (order.error) return Err(order.error);

    if (isBitcoin(order.val.source_swap.chain)) return Ok(order.val);

    //only initiate if EVM
    const executor = new OrderExecutor(
      order.val,
      config.orderBookUrl,
      secretManager,
      { store: config.store },
    );

    const initResult = await executor.init(walletClient, 0);
    if (initResult.error) return Err(initResult.error);

    return Ok(order.val);
  };

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
    if (!secretManager || !walletClient || !orderbook) return;
    const garden = new Garden(
      orderbook,
      secretManager,
      config.orderBookUrl,
      config.quoteUrl,
      {
        store: config.store,
      },
    );
    setGarden(garden);
  }, [secretManager, walletClient, orderbook]);

  //subscribe to orders using gardenInstance
  useEffect(() => {
    if (!garden) return;
    let unsubscribe: () => void;

    const setupSubscription = async () => {
      const handleOrderExecution = async (orderExecutor: IOrderExecutor) => {
        const order = orderExecutor.getOrder();
        const sourceWallet = isBitcoin(order.source_swap.chain)
          ? bitcoinWallet
          : walletClient;
        const destWallet = isBitcoin(order.destination_swap.chain)
          ? bitcoinWallet
          : walletClient;
        if (!sourceWallet || !destWallet) return;

        console.log('executing order:', order.create_order.create_id);
        const res = await orderExecutor.execute({
          wallets: {
            source: sourceWallet,
            destination: destWallet,
          },
        });
        console.log('execute result :', res.val);
        console.log('execute error: ', res.error);
      };
      unsubscribe = await garden.subscribeOrders(handleOrderExecution);
    };

    setupSubscription();

    return () => {
      unsubscribe();
    };
  }, [garden]);

  return (
    <GardenContext.Provider
      value={{
        orderBookUrl: config.orderBookUrl,
        initializeSecretManager,
        orderBook: orderbook,
        swap,
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
