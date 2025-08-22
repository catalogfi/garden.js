import { isBitcoin, MatchedOrder } from '@gardenfi/orderbook';

export const Status = {
  Created: 'Created',
  InitiateDetected: 'Initiate Detected',
  Initiated: 'Initiated',
  AwaitingRedeem: 'Awaiting Redeem',
  RedeemDetected: 'Redeem Detected',
  Redeemed: 'Redeemed',
  AwaitingRefund: 'Awaiting Refund',
  RefundDetected: 'Refund Detected',
  Refunded: 'Refunded',
  Expired: 'Expired',
};

export const newOrderStatusParser = (order: MatchedOrder) => {
  const { create_order, source_swap, destination_swap } = order;

  // ---------------------- REDEEM CASE ----------------------
  if (destination_swap.redeem_tx_hash) {
    if (Number(destination_swap.redeem_block_number)) return Status.Redeemed;
    // We don't wait bitcoin redeem txs to be confirmed.
    return isBitcoin(destination_swap.chain)
      ? Status.Redeemed
      : Status.RedeemDetected;
  }
  // if BTC in output asset, then there is a chance that the redeem tx gets dropped and the BE does a RBF.
  if (
    isBitcoin(destination_swap.chain) &&
    source_swap.redeem_tx_hash &&
    !destination_swap.redeem_tx_hash
  )
    return Status.Redeemed;

  // ---------------------- REFUND CASE ----------------------
  if (source_swap.refund_tx_hash) {
    if (Number(source_swap.refund_block_number)) return Status.Refunded;
    return Status.RefundDetected;
  }
  if (destination_swap.refund_tx_hash) return Status.AwaitingRefund;

  const { deadline } = create_order.additional_data;
  const isExpired = isDeadlinePassed(deadline);

  // ---------------------- INITIATE CASE ----------------------
  if (destination_swap.initiate_tx_hash) return Status.AwaitingRedeem;
  if (source_swap.initiate_tx_hash) {
    // Initiate should be confirmed before the deadline, if not, then it will be refunded.
    if (isExpired) return Status.AwaitingRefund;
    if (Number(source_swap.initiate_block_number)) return Status.Initiated;
    return Status.InitiateDetected;
  }

  // ---------------------- EXPIRY CASE ----------------------
  if (isExpired) return Status.Expired;

  return Status.Created;
};

export const isDeadlinePassed = (deadline: number): boolean =>
  Date.now() >= deadline * 1000;
