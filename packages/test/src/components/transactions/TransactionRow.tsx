import { FC, useMemo } from "react";
import { SwapInfo } from "../../common/SwapInfo";
import { MatchedOrder } from "@gardenfi/orderbook";
import {
  formatAmount,
  getAssetFromSwap,
  getDayDifference,
} from "../../utils/utils";
import { OrderStatus } from "@gardenfi/core";
import { assetInfoStore } from "../../store/assetInfoStore";

type TransactionProps = {
  order: MatchedOrder;
  status?: OrderStatus;
  isLast: boolean;
  isFirst: boolean;
};

enum StatusLabel {
  Completed = "Completed",
  Pending = "In progress...",
  Expired = "Expired",
  ShouldInitiate = "Awaiting deposit",
  InitiateDetected = "Deposit detected (0/1)",
  Initiated = "Deposit detected",
  Redeeming = "Redeeming",
}

const getOrderStatusLabel = (status: OrderStatus) => {
  switch (status) {
    case OrderStatus.Matched:
      return StatusLabel.ShouldInitiate;
    case OrderStatus.DeadLineExceeded:
      return StatusLabel.Expired;
    case OrderStatus.InitiateDetected:
      return StatusLabel.InitiateDetected;
    case OrderStatus.Initiated:
      return StatusLabel.Initiated;
    case OrderStatus.CounterPartyInitiateDetected:
    case OrderStatus.CounterPartyInitiated:
      return StatusLabel.Redeeming;
    case OrderStatus.Redeemed:
    case OrderStatus.RedeemDetected:
    case OrderStatus.Refunded:
    case OrderStatus.RefundDetected:
    case OrderStatus.CounterPartyRedeemed:
    case OrderStatus.CounterPartyRedeemDetected:
      return StatusLabel.Completed;
    default:
      return StatusLabel.Pending;
  }
};

export const TransactionRow: FC<TransactionProps> = ({
  order,
  status,
  isLast,
  isFirst,
}) => {
  const { create_order, source_swap, destination_swap } = order;
  const { assets } = assetInfoStore();

  const sendAsset = useMemo(
    () => getAssetFromSwap(source_swap, assets),
    [source_swap, assets]
  );
  const receiveAsset = useMemo(
    () => getAssetFromSwap(destination_swap, assets),
    [destination_swap, assets]
  );
  const statusLabel = useMemo(
    () => status && getOrderStatusLabel(status),
    [status]
  );
  const sendAmount = useMemo(
    () => formatAmount(create_order.source_amount, sendAsset?.decimals ?? 0),
    [create_order.source_amount, sendAsset?.decimals]
  );
  const receiveAmount = useMemo(
    () =>
      formatAmount(
        create_order.destination_amount,
        receiveAsset?.decimals ?? 0
      ),
    [create_order.destination_amount, receiveAsset?.decimals]
  );
  const dayDifference = useMemo(
    () => getDayDifference(create_order.updated_at),
    [create_order.updated_at]
  );

  const handleTransactionClick = () => {
    if (order?.create_order?.create_id) {
      window.open(
        `https://gardenexplorer.hashira.io/order/${create_order.create_id}`,
        "_blank"
      );
    }
  };

  if (!sendAsset || !receiveAsset) return null;

  return (
    <div
      className={`flex flex-col gap-1 p-4 ${isFirst ? "rounded-t-2xl" : ""} ${isLast ? "rounded-b-2xl" : ""} ${"cursor-pointer hover:bg-gray-900" }`}
      onClick={handleTransactionClick}
    >
      <div className={`flex flex-col gap-1 `}>
        <SwapInfo
          sendAsset={sendAsset}
          receiveAsset={receiveAsset}
          sendAmount={sendAmount}
          receiveAmount={receiveAmount}
        />
        <div className="flex justify-between">
          <p>
            {statusLabel}
          </p>
          <p>
            {dayDifference}
          </p>
        </div>
      </div>
    </div>
  );
};
