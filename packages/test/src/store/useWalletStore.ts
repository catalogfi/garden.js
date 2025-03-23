import { create } from 'zustand';
import { connect, disconnect } from 'starknetkit';
import { InjectedConnector } from 'starknetkit/injected';
import { cairo, shortString, TypedDataRevision } from 'starknet';
import { hexToU32Array } from '@gardenfi/utils';

interface WalletState {
  wallet: any | null;
  account: string | undefined;
  isConnected: boolean;
  chainId: bigint | undefined;
  connect: (
    walletName: string,
  ) => Promise<{ wallet: any; connectorData: any } | void>;
  disconnect: () => Promise<void>;
  signTypedData: () => Promise<any>;
}

export const useWalletStore = create<WalletState>((set) => ({
  wallet: null,
  account: undefined,
  isConnected: false,
  chainId: undefined,

  connect: async (walletName: string) => {
    try {
      const { wallet, connectorData } = await connect({
        connectors: [new InjectedConnector({ options: { id: walletName } })],
      });

      if (wallet && connectorData) {
        set({
          wallet,
          account: connectorData.account,
          isConnected: true,
          chainId: connectorData.chainId
            ? BigInt(connectorData.chainId)
            : undefined,
        });

        wallet?.on('accountsChanged', (accounts?: string[]) => {
          console.log('Account changed:', accounts);
          set({ account: accounts?.[0] });
        });

        wallet?.on('networkChanged', (chainId?: string) => {
          console.log('Network changed:', chainId);
          set({ chainId: chainId ? BigInt(chainId) : undefined });
        });

        return { wallet, connectorData };
      }
    } catch (error) {
      console.error('Error connecting to wallet:', error);
    }
  },

  signTypedData: async () => {
    try {
      const { wallet, connectorData } = await connect({
        connectors: [new InjectedConnector({ options: { id: 'braavos' } })],
      });
      const typedData = {
        types: {
          StarknetDomain: [
            { name: 'name', type: 'shortstring' },
            { name: 'version', type: 'shortstring' },
            { name: 'chainId', type: 'shortstring' },
            { name: 'revision', type: 'shortstring' },
          ],
          Initiate: [
            { name: 'redeemer', type: 'ContractAddress' },
            { name: 'amount', type: 'u256' },
            { name: 'timelock', type: 'u128' },
            { name: 'secretHash', type: 'u128*' },
          ],
        },
        primaryType: 'Initiate',
        domain: {
          name: 'HTLC',
          version: shortString.encodeShortString('1'),
          chainId: '0x534e5f5345504f4c4941', // SN_SEPOLIA
          revision: TypedDataRevision.ACTIVE,
        },
        message: {
          redeemer:
            '0x0160a7b102d87ad4c06435a92d530f68e120355614352096824b7cd833e72773',
          amount: cairo.uint256('10000000000000000'),
          timelock: 7000,
          secretHash: hexToU32Array(
            '3d0775cd9cb6816a06302213d4ad73965fdc3f297c6cef546d56486aa9f0f25a',
          ),
        },
      };

      if (!wallet) throw new Error('Wallet not connected');

      const signature = await wallet.request({
        type: 'wallet_signTypedData',
        params: typedData,
      });

      console.log('Signature:', signature);
      return signature;
    } catch (error) {
      console.error('Error signing typed data:', error);
      throw error;
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
      console.error('Error disconnecting wallet:', error);
    }
  },
}));
