import { Swap } from '@gardenfi/orderbook';
import { MatchedOrder } from '@gardenfi/orderbook';
import { OrderStatus, SwapStatus } from './order.types';

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
  if (sourceSwapStatus === SwapStatus.RedeemDetected)
    return OrderStatus.CounterPartyRedeemDetected;
  if (sourceSwapStatus === SwapStatus.Redeemed)
    return OrderStatus.CounterPartyRedeemed;

  //refund check
  if (sourceSwapStatus === SwapStatus.RefundDetected)
    return OrderStatus.RefundDetected;
  if (sourceSwapStatus === SwapStatus.Refunded) return OrderStatus.Refunded;
  if (destSwapStatus === SwapStatus.RefundDetected)
    return OrderStatus.CounterPartyRefundDetected;
  if (destSwapStatus === SwapStatus.Refunded)
    return OrderStatus.CounterPartyRefunded;

  //expiry check
  if (destSwapStatus === SwapStatus.Expired)
    return OrderStatus.CounterPartySwapExpired;
  if (sourceSwapStatus === SwapStatus.Expired) return OrderStatus.Expired;

  //initiate check
  if (sourceSwapStatus === SwapStatus.InitiateDetected)
    return OrderStatus.InitiateDetected;
  if (sourceSwapStatus === SwapStatus.Initiated) return OrderStatus.Initiated;
  if (destSwapStatus === SwapStatus.InitiateDetected)
    return OrderStatus.CounterPartyInitiateDetected;
  if (destSwapStatus === SwapStatus.Initiated)
    return OrderStatus.CounterPartyInitiated;

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
  const swapExpiryBlockNumber =
    Number(swap.initiate_block_number) + swap.timelock;
  if (currentBlockNumber > swapExpiryBlockNumber) return SwapStatus.Expired;

  //initiate check
  if (swap.initiate_tx_hash) {
    if (swap.initiate_block_number) return SwapStatus.Initiated;
    return SwapStatus.InitiateDetected;
  }
  return SwapStatus.Idle;
};
