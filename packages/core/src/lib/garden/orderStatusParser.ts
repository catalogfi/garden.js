import { MatchedOrder } from '@gardenfi/orderbook';
import { Swap } from '@gardenfi/orderbook';
import { OrderActions } from './garden.types';
import { OrderStatus, SwapStatus } from '../status';

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
  if (sourceSwapStatus === SwapStatus.Redeemed)
    return OrderStatus.CounterPartyRedeemed;
  if (sourceSwapStatus === SwapStatus.RedeemDetected)
    return OrderStatus.CounterPartyRedeemDetected;
  if (destSwapStatus === SwapStatus.Redeemed) return OrderStatus.Redeemed;
  if (destSwapStatus === SwapStatus.RedeemDetected)
    return OrderStatus.RedeemDetected;

  //refund check
  if (sourceSwapStatus === SwapStatus.Refunded) return OrderStatus.Refunded;
  if (sourceSwapStatus === SwapStatus.RefundDetected)
    return OrderStatus.RefundDetected;
  if (destSwapStatus === SwapStatus.Refunded)
    return OrderStatus.CounterPartyRefunded;
  if (destSwapStatus === SwapStatus.RefundDetected)
    return OrderStatus.CounterPartyRefundDetected;

  //expiry check
  if (destSwapStatus === SwapStatus.Expired)
    return OrderStatus.CounterPartySwapExpired;
  if (sourceSwapStatus === SwapStatus.Expired) return OrderStatus.Expired;

  const attestedDeadlineUnixTime = Number(
    order.create_order.additional_data.deadline,
  );

  //initiate check
  if (destSwapStatus === SwapStatus.Initiated)
    return OrderStatus.CounterPartyInitiated;
  if (destSwapStatus === SwapStatus.InitiateDetected)
    return OrderStatus.CounterPartyInitiateDetected;

  // Should be confirmed 12 hours before the deadline
  if (isExpired(attestedDeadlineUnixTime, 12))
    return OrderStatus.DeadLineExceeded;
  if (sourceSwapStatus === SwapStatus.Initiated) return OrderStatus.Initiated;

  //should initiate before 1 hour of deadline in attested quote
  if (isExpired(attestedDeadlineUnixTime, 1))
    return OrderStatus.DeadLineExceeded;
  if (sourceSwapStatus === SwapStatus.InitiateDetected)
    return OrderStatus.InitiateDetected;

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
    if (swap.redeem_block_number) return SwapStatus.Redeemed;
    return SwapStatus.RedeemDetected;
  }

  //refund check
  if (swap.refund_tx_hash) {
    if (swap.refund_block_number) return SwapStatus.Refunded;
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
    if (swap.initiate_block_number) return SwapStatus.Initiated;
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

  switch (orderStatus) {
    case OrderStatus.Matched:
      return OrderActions.Initiate;
    case OrderStatus.CounterPartyInitiated:
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
