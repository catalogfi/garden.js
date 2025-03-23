import { create } from 'zustand';
import { Asset, SupportedAssets } from '@gardenfi/orderbook';
import { useEnvironmentStore } from '../store/useEnvironmentStore';
import { BitcoinWallet } from '@catalogfi/wallets';

export const getAssets = (environment: string) => {
  const assets =
    environment === 'mainnet'
      ? SupportedAssets.mainnet
      : environment === 'testnet'
      ? SupportedAssets.testnet
      : SupportedAssets.localnet;

  return Object.entries(assets).reduce((acc, [key, asset]) => {
    acc[key] = asset;
    return acc;
  }, {} as Record<string, Asset>);
};

type SwapParams = {
  fromAsset?: Asset;
  toAsset?: Asset;
  sendAmount?: string;
  receiveAmount?: string;
  additionalData: { strategyId: string; btcAddress?: string };
};

type SwapStore = {
  assets: Record<string, Asset>;
  swapParams: SwapParams;
  btcWallet: BitcoinWallet | undefined;
  setFromAsset: (asset: Asset) => void;
  setToAsset: (asset: Asset) => void;
  setSendAmount: (amount: string) => void;
  setReceiveAmount: (amount: string) => void;
  setAdditionalId: (strategyId: string, btcAddress?: string) => void;
  setBtcWallet: (wallet: BitcoinWallet | undefined) => void;
  refreshAssets: () => void;
};

export const useSwapStore = create<SwapStore>((set, get) => {
  const environment = useEnvironmentStore.getState().environment;
  const initialAssets = getAssets(environment);

  return {
    assets: initialAssets,
    swapParams: {
      additionalData: { strategyId: '' },
    },
    btcWallet: undefined,

    setFromAsset: (asset) =>
      set((state) => ({
        swapParams: { ...state.swapParams, fromAsset: asset },
      })),
    setToAsset: (asset) =>
      set((state) => ({ swapParams: { ...state.swapParams, toAsset: asset } })),
    setSendAmount: (amount) =>
      set((state) => ({
        swapParams: { ...state.swapParams, sendAmount: amount },
      })),
    setReceiveAmount: (amount) =>
      set((state) => ({
        swapParams: { ...state.swapParams, receiveAmount: amount },
      })),
    setAdditionalId: (strategyId, btcAddress?) =>
      set((state) => ({
        swapParams: {
          ...state.swapParams,
          additionalData: { strategyId, btcAddress },
        },
      })),
    setBtcWallet: (wallet) => set({ btcWallet: wallet }),

    refreshAssets: () => {
      const updatedEnvironment = useEnvironmentStore.getState().environment;
      const updatedAssets = getAssets(updatedEnvironment);

      set({
        assets: updatedAssets,
        swapParams: {
          ...get().swapParams,
          fromAsset: get().swapParams.fromAsset,
          toAsset: get().swapParams.toAsset,
        },
      });
    },
  };
});
