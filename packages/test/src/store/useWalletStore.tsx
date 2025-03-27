import { create } from 'zustand';
import { connect, disconnect } from 'starknetkit';
import { InjectedConnector } from 'starknetkit/injected';
import { Account, RpcProvider } from 'starknet';

interface WalletState {
  wallet: Account | null;
  account: string | undefined;
  isConnected: boolean;
  chainId: bigint | undefined;
  connectWallet: (walletName: string) => Promise<void>;
  disconnectWallet: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  account: undefined,
  isConnected: false,
  chainId: undefined,

  connectWallet: async (walletName: string) => {
    try {
      const { wallet: connectedWallet, connectorData } = await connect({
        connectors: [new InjectedConnector({ options: { id: walletName } })],
      });

      if (connectedWallet && connectorData) {
        const provider = new RpcProvider({
          nodeUrl: `https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/${process.env.NEXT_PUBLIC_ALCHEMY_API_KEY}`,
        });

        const account = new Account(
          provider,
          connectorData.account || '',
          connectorData.address,
          '1',
        );

        set({
          wallet: account,
          account: connectorData.account,
          isConnected: true,
          chainId: connectorData.chainId
            ? BigInt(connectorData.chainId)
            : undefined,
        });
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  },

  disconnectWallet: async () => {
    try {
      await disconnect();
      set({
        wallet: null,
        account: undefined,
        isConnected: false,
        chainId: undefined,
      });
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  },
}));
