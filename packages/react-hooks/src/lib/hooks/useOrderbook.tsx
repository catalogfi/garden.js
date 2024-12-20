import {
  filterDeadlineExpiredOrders,
  IBlockNumberFetcher,
  OrderWithStatus,
  ParseOrderStatus,
} from '@gardenfi/core';
import { IOrderbook } from '@gardenfi/orderbook';
import { useEffect } from 'react';

export const useOrderbook = (
  orderbook: IOrderbook,
  blockNumberFetcher: IBlockNumberFetcher,
  setPendingOrders: (orders: OrderWithStatus[]) => void,
) => {
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
