import { MatchedOrder } from '@gardenfi/orderbook';
import { Swap } from '@gardenfi/orderbook';
import { OrderActions } from '../garden/garden.types';
import { OrderStatus, SwapStatus } from './status';

/**
 * Parse the order status based on the current block number and checks if its expired or initiated or redeemed or refunded
 * @param order Order object
 * @param sourceChainCurrentBlockNumber source chain current block number
 * @param destChainCurrentBlockNumber destination chain current block number
 * @note send the current block number of the L1 chain even if the order is on L2 chain.
 * @returns {OrderStatus} The status of the order
 */
export const ParseOrderStatus = (
  order: MatchedOrder,
  sourceChainCurrentBlockNumber: number,
  destChainCurrentBlockNumber: number,
): OrderStatus => {
  const sourceSwapStatus = ParseSwapStatus(
    order.source_swap,
    sourceChainCurrentBlockNumber,
  );
  const destSwapStatus = ParseSwapStatus(
    order.destination_swap,
    destChainCurrentBlockNumber,
  );

  //redeem check
  if (destSwapStatus === SwapStatus.RedeemDetected)
    return OrderStatus.RedeemDetected;
  if (destSwapStatus === SwapStatus.Redeemed) return OrderStatus.Redeemed;

  //source refund check
  if (sourceSwapStatus === SwapStatus.Refunded) return OrderStatus.Refunded;
  if (sourceSwapStatus === SwapStatus.RefundDetected)
    return OrderStatus.RefundDetected;

  //expiry check
  if (destSwapStatus === SwapStatus.Expired)
    return OrderStatus.CounterPartySwapExpired;
  if (sourceSwapStatus === SwapStatus.Expired) return OrderStatus.Expired;

  //dest refund check
  if (destSwapStatus === SwapStatus.Refunded)
    return OrderStatus.CounterPartyRefunded;
  if (destSwapStatus === SwapStatus.RefundDetected)
    return OrderStatus.CounterPartyRefundDetected;

  const attestedDeadlineUnixTime = Number(
    order.create_order.additional_data.deadline,
  );

  // this is an edge case where the BE drops all the redeem transactions of users and does a RBF.
  if (
    (sourceSwapStatus === SwapStatus.Redeemed ||
      sourceSwapStatus === SwapStatus.RedeemDetected) &&
    destSwapStatus === SwapStatus.Initiated
  )
    return OrderStatus.Redeemed;

  if (destSwapStatus === SwapStatus.Initiated)
    //initiate check
    return OrderStatus.CounterPartyInitiated;
  if (destSwapStatus === SwapStatus.InitiateDetected)
    return OrderStatus.CounterPartyInitiateDetected;

  // Initiate should be confirmed before the deadline
  if (isExpired(attestedDeadlineUnixTime, 0))
    return OrderStatus.DeadLineExceeded;
  if (sourceSwapStatus === SwapStatus.Initiated) return OrderStatus.Initiated;

  //Initiate detection should be before the deadline in attested quote. Deadline is one hour after the order is created.
  if (isExpired(attestedDeadlineUnixTime, 0))
    return OrderStatus.DeadLineExceeded;
  if (sourceSwapStatus === SwapStatus.InitiateDetected)
    return OrderStatus.InitiateDetected;

  if (sourceSwapStatus === SwapStatus.Redeemed)
    return OrderStatus.CounterPartyRedeemed;
  if (sourceSwapStatus === SwapStatus.RedeemDetected)
    return OrderStatus.CounterPartyRedeemDetected;

  return OrderStatus.Matched;
};

/**
 * Parse the swap status based on the current block number and checks if its expired or initiated or redeemed or refunded
 * @param swap The swap object
 * @param currentBlockNumber
 */
export const ParseSwapStatus = (swap: Swap, currentBlockNumber: number) => {
  //redeem check
  if (swap.redeem_tx_hash) {
    if (Number(swap.redeem_block_number)) return SwapStatus.Redeemed;
    return SwapStatus.RedeemDetected;
  }

  //refund check
  if (swap.refund_tx_hash) {
    if (Number(swap.refund_block_number)) return SwapStatus.Refunded;
    return SwapStatus.RefundDetected;
  }

  //expiry check
  if (Number(swap.initiate_block_number)) {
    const swapExpiryBlockNumber =
      Number(swap.initiate_block_number) + swap.timelock;
    if (currentBlockNumber > swapExpiryBlockNumber) return SwapStatus.Expired;
  }

  //initiate check
  if (swap.initiate_tx_hash) {
    if (Number(swap.initiate_block_number)) return SwapStatus.Initiated;
    return SwapStatus.InitiateDetected;
  }

  return SwapStatus.Idle;
};

/**
 * Parse the action to be performed on the.
 * @param order Order object
 * @param sourceChainCurrentBlockNumber source chain current block number
 * @param destChainCurrentBlockNumber destination chain current block number
 * @note send the current block number of the L1 chain even if the order is on L2 chain.
 * @returns {OrderActions} The action to be performed on the order
 */
export const parseAction = (
  order: MatchedOrder,
  sourceChainCurrentBlockNumber: number,
  destChainCurrentBlockNumber: number,
): OrderActions => {
  const orderStatus = ParseOrderStatus(
    order,
    sourceChainCurrentBlockNumber,
    destChainCurrentBlockNumber,
  );

  return parseActionFromStatus(orderStatus);
};

/**
 * Parse the action to be performed on the order based on the order status.
 * @param status Order status
 * @returns {OrderActions} The action to be performed on the order
 */
export const parseActionFromStatus = (status: OrderStatus): OrderActions => {
  switch (status) {
    case OrderStatus.Matched:
      return OrderActions.Initiate;
    case OrderStatus.CounterPartyInitiated:
    case OrderStatus.CounterPartyInitiateDetected:
    case OrderStatus.RedeemDetected:
      return OrderActions.Redeem;
    case OrderStatus.Expired:
      return OrderActions.Refund;
    default:
      return OrderActions.Idle;
  }
};

export const isExpired = (unixTime: number, tillHours = 0): boolean => {
  const currentTime = Date.now();
  const expiryTime = unixTime * 1000 + tillHours * 3600000;
  return currentTime >= expiryTime;
};

export const filterDeadlineExpiredOrders = (
  orders: MatchedOrder[],
): MatchedOrder[] => {
  return orders.filter((order) => {
    return !isOrderExpired(order);
  });
};

export const isOrderExpired = (order: MatchedOrder): boolean => {
  const { source_swap, create_order } = order;
  const { initiate_tx_hash, initiate_block_number } = source_swap;
  const { deadline } = create_order.additional_data;

  // Initiated and confirmed
  if (initiate_tx_hash && Number(initiate_block_number)) return false;

  // Initiated but not confirmed yet, check for 12-hour deadline
  if (initiate_tx_hash && !Number(initiate_block_number))
    return isExpired(Number(deadline), 12);

  // Not initiated yet, check for 1-hour deadline
  if (!initiate_tx_hash) return isExpired(Number(deadline), 1);

  return false;
};
