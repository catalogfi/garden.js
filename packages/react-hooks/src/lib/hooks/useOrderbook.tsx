import { IOrderbook, Orderbook } from '@gardenfi/orderbook';
import { IAuth } from '@gardenfi/utils';
import { useEffect, useState } from 'react';
import { useWalletClient } from 'wagmi';

export const useOrderbook = (orderBookUrl: string, auth: IAuth | undefined) => {
  const { data: walletClient } = useWalletClient();
  const [orderbook, setOrderbook] = useState<IOrderbook>();

  useEffect(() => {
    if (!walletClient || !orderBookUrl || !auth) return;

    const orderbook = new Orderbook({
      url: orderBookUrl,
      walletClient: walletClient,
      auth,
    });
    setOrderbook(orderbook);
  }, [walletClient, orderBookUrl]);

  return { orderbook };
};
