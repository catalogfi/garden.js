import { create } from 'zustand';
import { connect, disconnect, StarknetWindowObject } from 'starknetkit';
import { InjectedConnector } from 'starknetkit/injected';
import { Account, AccountInterface } from 'starknet';
import { persist } from 'zustand/middleware';
// import {
//   StarknetWalletProvider,
//   SignerInterface,
//   CairoVersion,
// } from 'starknet';

// Modify the WalletState interface to be more flexible
interface WalletState {
  wallet: Account | null;
  account: string | undefined;
  isConnected: boolean;
  chainId: bigint | undefined;
  connect: (
    walletId: string,
  ) => Promise<{ wallet: any; connectorData: any } | void>;
  disconnect: () => Promise<void>;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set, get) => ({
      wallet: null,
      account: undefined,
      isConnected: false,
      chainId: undefined,

      connect: async (walletId: string) => {
        try {
          const { wallet, connectorData } = await connect({
            modalMode: 'alwaysAsk',
            modalTheme: 'light',
            connectors: [new InjectedConnector({ options: { id: walletId } })],
          });
          console.log(connectorData);
          if (wallet && connectorData) {
            const walletAcc = wallet?.account as AccountInterface;
            const formatAddress = (address: string) => {
              const cleanAddr = address.toLowerCase().startsWith('0x')
                ? address.slice(2)
                : address;
              return `0x${cleanAddr.padStart(64, '0')}`;
            };

            const formattedAccount = connectorData.account
              ? formatAddress(connectorData.account)
              : undefined;

            // Use type assertion to resolve type compatibility
            const newState = {
              wallet: {
                ...walletAcc,
                address: formattedAccount,
              },
              account: formattedAccount,
              isConnected: true,
              chainId: connectorData.chainId
                ? BigInt(connectorData.chainId)
                : undefined,
            } as WalletState;

            set(newState);

            // Setup event listeners with null checks
            if (wallet) {
              wallet.on('accountsChanged', (accounts?: string[]) => {
                const newAccount = accounts?.[0]
                  ? formatAddress(accounts[0])
                  : undefined;
                set({ account: newAccount });
              });

              wallet.on('networkChanged', (chainId?: string) => {
                set({ chainId: chainId ? BigInt(chainId) : undefined });
              });
            }

            return { wallet, connectorData };
          }
        } catch (error) {
          console.error('Error connecting to wallet:', error);
          // Optionally reset state on error
          set({
            wallet: null,
            account: undefined,
            isConnected: false,
            chainId: undefined,
          });
        }
      },

      disconnect: async () => {
        try {
          const currentState = get();

          // Only attempt to disconnect if currently connected
          if (currentState.isConnected) {
            await disconnect();
            set({
              wallet: null,
              account: undefined,
              isConnected: false,
              chainId: undefined,
            });
          }
        } catch (error) {
          console.error('Error disconnecting wallet:', error);
        }
      },
    }),
    {
      name: 'starknet-wallet-storage',
      partialize: (state) => ({
        account: state.account,
        isConnected: state.isConnected,
        chainId: state.chainId?.toString(),
      }),
      version: 1,
    },
  ),
);
