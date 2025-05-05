import {
  filterDeadlineExpiredOrders,
  IGardenJS,
  OrderWithStatus,
  ParseOrderStatus,
} from '@gardenfi/core';
import { useEffect, useState } from 'react';
import { DigestKey } from '@gardenfi/utils';

export const useOrderbook = (
  garden: IGardenJS | undefined,
  digestKey: DigestKey | undefined,
) => {
  const [pendingOrders, setPendingOrders] = useState<OrderWithStatus[]>([]);

  useEffect(() => {
    if (!garden) return;

    const unsubscribe = garden.execute();

    const handlePendingOrdersChange = (orders: OrderWithStatus[]) =>
      setPendingOrders(orders);

    garden.on('onPendingOrdersChanged', handlePendingOrdersChange);

    return () => {
      (async () => {
        const unsubscribeFn = await unsubscribe;
        unsubscribeFn();
      })();
      garden.off('onPendingOrdersChanged', handlePendingOrdersChange);
    };
  }, [garden]);

  // Fetch orders for the first time
  useEffect(() => {
    if (!garden || !digestKey) return;
    garden.blockNumberFetcher.fetchBlockNumbers().then((res) => {
      if (res.error) return;
      const { val: blockNumbers } = res;
      garden.orderbook
        .getMatchedOrders(digestKey.userId, 'pending', {
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
  }, [garden, digestKey]);

  return { pendingOrders };
};
