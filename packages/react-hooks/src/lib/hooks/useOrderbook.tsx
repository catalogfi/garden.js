import { IOrderbook, Orderbook } from '@gardenfi/orderbook';
import { IStore } from '@gardenfi/utils';
import { useEffect, useState } from 'react';
import { useWalletClient } from 'wagmi';

export const useOrderbook = (orderBookUrl: string, store: IStore) => {
  const { data: walletClient } = useWalletClient();
  const [orderbook, setOrderbook] = useState<IOrderbook>();

  useEffect(() => {
    if (!walletClient || !orderBookUrl) return;

    const orderbook = new Orderbook({
      url: orderBookUrl,
      walletClient: walletClient,
      opts: {
        store: store,
      },
    });
    setOrderbook(orderbook);
  }, [walletClient, orderBookUrl]);

  return { orderbook };
};
