import { IGardenJS, OrderWithStatus } from '@gardenfi/core';
import { useEffect, useState } from 'react';

export const useOrderbook = (garden: IGardenJS | undefined) => {
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

  return { pendingOrders };
};
