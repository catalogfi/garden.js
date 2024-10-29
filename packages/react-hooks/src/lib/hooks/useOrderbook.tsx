import { filterDeadlineExpiredOrders } from '@gardenfi/core';
import { IOrderbook, MatchedOrder, Orderbook } from '@gardenfi/orderbook';
import { IAuth } from '@gardenfi/utils';
import { useEffect, useState } from 'react';
import { useWalletClient } from 'wagmi';

export const useOrderbook = (
  orderBookUrl: string,
  auth: IAuth | undefined,
  setPendingOrders: React.Dispatch<
    React.SetStateAction<MatchedOrder[] | undefined>
  >,
) => {
  const { data: walletClient } = useWalletClient();
  const [orderbook, setOrderbook] = useState<IOrderbook>();

  //Initialize orderbook
  useEffect(() => {
    if (!walletClient || !orderBookUrl || !auth) return;

    const orderbook = new Orderbook({
      url: orderBookUrl,
      walletClient: walletClient,
      auth,
    });
    setOrderbook(orderbook);
    orderbook
      .fetchOrders(true, true, {
        per_page: 500,
      })
      .then((orders) => {
        if (!orders.error && orders.val) {
          //only set deadline unexpired orders
          setPendingOrders(filterDeadlineExpiredOrders(orders.val.data));
        }
      });
  }, [walletClient, orderBookUrl, auth]);

  return { orderbook };
};
