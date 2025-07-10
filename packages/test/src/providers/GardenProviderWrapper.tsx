"use client";

import { GardenProvider } from "@gardenfi/react-hooks";
import { Environment } from "@gardenfi/utils";
import { useWalletClient } from "wagmi";

const getStorage = (): Storage => {
  if (typeof window !== "undefined") {
    return localStorage;
  }
  return {
    getItem: () => null,
    setItem: () => {},
    removeItem: () => {},
    clear: () => {},
    length: 0,
    key: () => null,
  };
};

function GardenProviderWrapper({ children }: { children: React.ReactNode }) {
  const { data: walletClient } = useWalletClient();
  
  return (
    <GardenProvider
      config={{
        store: getStorage(),
        environment: Environment.TESTNET,
        walletClient: walletClient,
      }}
    >
      {children}
    </GardenProvider>
  );
}

export default GardenProviderWrapper;
