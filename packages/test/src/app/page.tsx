"use client";

import React from "react";
import dynamic from "next/dynamic";
const TokenSwap = dynamic(() => import("@/components/swap/TokenSwap"), {
  ssr: false,
});
const Transactions = dynamic(
  () => import("@/components/transactions/Transactions"),
  {
    ssr: false,
  }
);

const Home = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-600 p-4">
      <div className="min-w-[70vw] grid grid-cols-1 md:grid-cols-[3fr_2fr] gap-6 items-stretch">
        <div className="h-full min-h-inherit">
          <TokenSwap />
        </div>
        <div className="h-full min-h-inherit">
          <Transactions />
        </div>
      </div>
    </div>
  );
};

export default Home;
