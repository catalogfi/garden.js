import { OrderStatus, OrderWithStatus } from "@gardenfi/core";

export const priorityList: Partial<Record<OrderStatus, number>> = {
  [OrderStatus.Matched]: 1,
  [OrderStatus.InitiateDetected]: 2,
  [OrderStatus.Initiated]: 3,
  [OrderStatus.CounterPartyInitiateDetected]: 4,
  [OrderStatus.CounterPartyInitiated]: 5,
  [OrderStatus.RedeemDetected]: 6,
  [OrderStatus.Redeemed]: 7,
  [OrderStatus.CounterPartyRedeemDetected]: 8,
  [OrderStatus.CounterPartyRedeemed]: 9,
};

export const getLatestUpdatedOrder = (
  newOrder: OrderWithStatus,
  oldOrder: OrderWithStatus
) => {
  const newOrderPriority = priorityList[newOrder.status];
  const oldOrderPriority = priorityList[oldOrder.status];

  if (!newOrderPriority || !oldOrderPriority) {
    return newOrder;
  }

  return newOrderPriority >= oldOrderPriority ? newOrder : oldOrder;
};

export const getLatestUpdatedOrders = (
  newOrders: OrderWithStatus[],
  oldOrders: OrderWithStatus[]
) => {
  return newOrders.map((newOrder) =>
    getLatestUpdatedOrder(
      newOrder,
      oldOrders.find(
        (o) => o.create_order.create_id === newOrder.create_order.create_id
      ) ?? newOrder
    )
  );
};
