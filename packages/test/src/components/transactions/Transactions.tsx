"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useGarden } from "@gardenfi/react-hooks";
import { ordersStore } from "@/store/ordersStore";
import { blockNumberStore } from "@/store/blockNumberStore";
import { MatchedOrder } from "@gardenfi/orderbook";
import { ParseOrderStatus } from "@gardenfi/core";
import { TransactionRow } from "./TransactionRow";
import { assetInfoStore } from "@/store/assetInfoStore";

const Transaction: React.FC = () => {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const { orderBook } = useGarden();
  const { orders, fetchAndSetOrders, totalItems, loadMore } = ordersStore().ordersHistory;
  const { fetchAndSetBlockNumbers, blockNumbers } = blockNumberStore();
  const { fetchAndSetAssetsAndChains } = assetInfoStore();

  const showLoadMore = useMemo(
    () => orders.length < totalItems,
    [orders.length, totalItems]
  );

  const handleLoadMore = async () => {
    if (!orderBook) return;
    setIsLoadingMore(true);
    await loadMore(orderBook);
    setIsLoadingMore(false);
  };

  const parseStatus = (order: MatchedOrder) => {
    if (!blockNumbers) return;
    const { source_swap, destination_swap } = order;
    const sourceBlockNumber = blockNumbers[source_swap.chain];
    const destinationBlockNumber = blockNumbers[destination_swap.chain];
    if (!sourceBlockNumber || !destinationBlockNumber) return;

    return ParseOrderStatus(order, sourceBlockNumber, destinationBlockNumber);
  };

  useEffect(() => {
    fetchAndSetAssetsAndChains();
  }, [fetchAndSetAssetsAndChains]);

  useEffect(() => {
    if (!orderBook) return;

    let isFetching = false;

    const fetchOrdersAndBlockNumbers = async () => {
      if (isFetching) return;

      try {
        isFetching = true;
        await fetchAndSetBlockNumbers();
        await fetchAndSetOrders(orderBook);
      } finally {
        isFetching = false;
      }
    };

    setIsLoadingOrders(true);
    fetchOrdersAndBlockNumbers().then(() => setIsLoadingOrders(false));
    const intervalId = setInterval(fetchOrdersAndBlockNumbers, 10000);

    return () => clearInterval(intervalId);
  }, [orderBook, fetchAndSetOrders, fetchAndSetBlockNumbers]);

  return (
    <div className="flex flex-col justify-center gap-5 overflow-hidden h-full min-h-[inherit] max-h-[75vh] p-8 bg-gray-800 rounded-2xl text-white">
        <h1 className="text-xl font-bold">Transaction History</h1>
        <div className="flex flex-col overflow-y-auto h-full max-h-[inherit] scrollbar-hide bg-gray-700 rounded-2xl">
          {isLoadingOrders ? (
            <div className="p-6 text-center">Loading...</div>
          ) : orders.length === 0 ? (
            <div className="p-6 text-center">No transactions found.</div>
          ) : (
            orders.map((order, index) => (
              <div key={index} className="w-full">
                <TransactionRow
                  order={order}
                  status={parseStatus(order)}
                  isLast={index === orders.length - 1}
                  isFirst={index === 0}
                />
                {index !== orders.length - 1 ? (
                  <div className="bg-gray-900 w-full h-px"></div>
                ) : null}
              </div>
            ))
          )}
        </div>
        {showLoadMore && (
          <button
            onClick={handleLoadMore}
            className={`w-full p-2 cursor-pointer text-white rounded-lg ${
              isLoadingMore
                ? "bg-gray-700 cursor-not-allowed"
                : "bg-gray-900 hover:bg-gray-700"
            }`}
          >
            {isLoadingMore ? "Loading..." : "Load More"}
          </button>
        )}
      </div>
  );
};

export default Transaction;
