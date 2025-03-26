import { create } from "zustand";
import { connect, disconnect } from "starknetkit";
import { InjectedConnector } from "starknetkit/injected";

interface WalletState {
  wallet: any | null;
  account: string | undefined;
  isConnected: boolean;
  chainId: bigint | undefined;
  connect: () => Promise<{ wallet: any; connectorData: any } | void>;
  disconnect: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  account: undefined,
  isConnected: false,
  chainId: undefined,

  connect: async () => {
    try {
      const { wallet, connectorData } = await connect({
        connectors: [new InjectedConnector({ options: { id: "braavos" } })],
      });

      if (wallet && connectorData) {
        set({
          wallet,
          account: connectorData.account,
          isConnected: true,
          chainId: connectorData.chainId ? BigInt(connectorData.chainId) : undefined,
        });

        wallet?.on("accountsChanged", (accounts?: string[]) => {
          console.log("Account changed:", accounts);
          set({ account: accounts?.[0] });
        });

        wallet?.on("networkChanged", (chainId?: string) => {
          console.log("Network changed:", chainId);
          set({ chainId: chainId ? BigInt(chainId) : undefined });
        });

        return { wallet, connectorData };
      }
    } catch (error) {
      console.error("Error connecting to wallet:", error);
    }
  },

  disconnect: async () => {
    try {
      await disconnect();
      set({
        wallet: null,
        account: undefined,
        isConnected: false,
        chainId: undefined,
      });
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  },
}));
