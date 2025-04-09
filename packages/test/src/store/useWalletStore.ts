import { AccountInterface } from 'starknet';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface WalletState {
  wallet: any;
  account: AccountInterface | undefined;
  isConnected: boolean;
  chainId: bigint | undefined;
  setWalletDetails: (details: {
    wallet: any;
    account: AccountInterface | undefined;
    chainId: string | undefined;
  }) => void;
  resetWallet: () => void;
}

export const useWalletStore = create<WalletState>()(
  persist(
    (set) => ({
      wallet: null,
      account: undefined,
      isConnected: false,
      chainId: undefined,

      setWalletDetails: (details) => {
        set({
          wallet: details.wallet,
          account: details.account,
          isConnected: true,
          chainId: details.chainId ? BigInt(details.chainId) : undefined,
        });
      },

      resetWallet: () => {
        set({
          wallet: null,
          account: undefined,
          isConnected: false,
          chainId: undefined,
        });
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
