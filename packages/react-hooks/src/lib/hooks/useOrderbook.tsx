import {
  filterDeadlineExpiredOrders,
  IGardenJS,
  OrderWithStatus,
  ParseOrderStatus,
} from '@gardenfi/core';
import { useEffect, useState } from 'react';

export const useOrderbook = (garden: IGardenJS | undefined) => {
  const [pendingOrders, setPendingOrders] = useState<OrderWithStatus[]>([]);

  // Execute orders (redeem or refund)
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!garden) return;

    const checkInitialization = () => {
      if (garden.secretManager.isInitialized) {
        setIsInitialized(true);
      }
    };

    checkInitialization();
    garden.secretManager.on('initialized', checkInitialization);

    return () => {
      garden.secretManager.off('initialized', checkInitialization);
    };
  }, [garden]);

  useEffect(() => {
    if (!garden || !isInitialized) return;

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
  }, [garden, isInitialized]);

  // Fetch orders for the first time
  useEffect(() => {
    if (!garden) return;
    garden.blockNumberFetcher.fetchBlockNumbers().then((res) => {
      if (res.error) return;
      const { val: blockNumbers } = res;
      garden.orderbook
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
  }, [garden]);

  return { pendingOrders };
};
