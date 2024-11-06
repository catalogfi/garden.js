import {
  filterDeadlineExpiredOrders,
  IBlockNumberFetcher,
  OrderWithStatus,
  ParseOrderStatus,
} from '@gardenfi/core';
import { IOrderbook, Orderbook } from '@gardenfi/orderbook';
import { IAuth } from '@gardenfi/utils';
import { useEffect, useState } from 'react';
import { useWalletClient } from 'wagmi';

export const useOrderbook = (
  orderBookUrl: string,
  auth: IAuth | undefined,
  setPendingOrders: React.Dispatch<
    React.SetStateAction<OrderWithStatus[] | undefined>
  >,
  blockNumberFetcher?: IBlockNumberFetcher,
) => {
  const [orderbook, setOrderbook] = useState<IOrderbook>();
  const { data: walletClient } = useWalletClient();

  //Initialize orderbook
  useEffect(() => {
    if (!walletClient || !orderBookUrl || !auth) return;

    const orderbook = new Orderbook({
      url: orderBookUrl,
      walletClient: walletClient,
      auth,
    });
    setOrderbook(orderbook);
  }, [walletClient, orderBookUrl, auth]);

  useEffect(() => {
    if (!orderbook || !blockNumberFetcher) return;

    blockNumberFetcher.fetchBlockNumbers().then((res) => {
      if (res.error) return;
      const { val: blockNumbers } = res;
      orderbook
        .fetchOrders(true, true, {
          per_page: 500,
        })
        .then((orders) => {
          if (orders.error) return;
          const orderWithStatus = filterDeadlineExpiredOrders(orders.val.data)
            .map((order) => {
              const sourceBlockNumber = blockNumbers[order.source_swap.chain];
              const destinationBlockNumber =
                blockNumbers[order.destination_swap.chain];
              if (!sourceBlockNumber || !destinationBlockNumber) return;
              const status = ParseOrderStatus(
                order,
                sourceBlockNumber,
                destinationBlockNumber,
              );
              return {
                ...order,
                status,
              };
            })
            .filter((order) => order !== undefined);

          setPendingOrders(orderWithStatus);
        });
    });
  }, [orderbook, blockNumberFetcher]);
  return { orderbook };
};
