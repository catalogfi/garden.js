import { create } from "zustand";
import { Asset, Chain } from "@gardenfi/orderbook";
import axios from "axios";
import { IQuote, Strategies } from "@gardenfi/core";

const ASSETS_API_URL = `${process.env.NEXT_PUBLIC_DATA_URL}/assets`;

export const generateTokenKey = (chain: Chain, asset: string) => {
  return `${chain}_${asset.toLowerCase()}`;
};

export enum IOType {
  input = "input",
  output = "output",
}

export type Networks = {
  [chain in Chain]: ChainData & { assetConfig: Omit<Asset, "chain">[] };
};

export type ChainData = {
  chainId: number;
  explorer: string;
  networkLogo: string;
  networkType: string;
  name: string;
  identifier: Chain;
};

export type Assets = Record<string, Asset>;
export type Chains = Partial<Record<Chain, ChainData>>;

type AssetInfoState = {
  assets: Assets | null;
  chains: Chains | null;
  isLoading: boolean;
  isAssetSelectorOpen: {
    isOpen: boolean;
    type: IOType;
  };
  error: string | null;
  strategies: {
    val: Strategies | null;
    error: string | null;
    isLoading: boolean;
  };
  setOpenAssetSelector: (type: IOType) => void;
  CloseAssetSelector: () => void;
  fetchAndSetAssetsAndChains: () => Promise<void>;
  fetchAndSetStrategies: (quote: IQuote) => Promise<void>;
};

export const assetInfoStore = create<AssetInfoState>((set, get) => ({
  assets: null,
  chains: null,
  isAssetSelectorOpen: {
    isOpen: false,
    type: IOType.input,
  },
  isLoading: false,
  error: null,
  strategies: {
    val: null,
    error: null,
    isLoading: false,
  },

  setOpenAssetSelector: (type) =>
    set({
      isAssetSelectorOpen: {
        isOpen: true,
        type,
      },
    }),

  CloseAssetSelector: () =>
    set({
      isAssetSelectorOpen: {
        type: get().isAssetSelectorOpen.type,
        isOpen: false,
      },
    }),

  fetchAndSetAssetsAndChains: async () => {
    try {
      set({ isLoading: true });

      const res = await axios.get<{
        data: { networks: Networks };
      }>(ASSETS_API_URL);

      const assetsData = res.data.data.networks;

      const assets: Assets = {};
      const chains: Chains = {};

      for (const chainInfo of Object.values(assetsData)) {
        chains[chainInfo.identifier] = {
          chainId: chainInfo.chainId,
          explorer: chainInfo.explorer,
          networkLogo: chainInfo.networkLogo,
          networkType: chainInfo.networkType,
          name: chainInfo.name,
          identifier: chainInfo.identifier,
        };
        for (const asset of chainInfo.assetConfig) {
          assets[
            generateTokenKey(chainInfo.identifier, asset.atomicSwapAddress)
          ] = {
            ...asset,
            chain: chainInfo.identifier,
          };
        }
      }
      set({ assets, chains });
    } catch {
      set({ error: "Failed to fetch assets data" });
    } finally {
      set({ isLoading: false });
    }
  },
  fetchAndSetStrategies: async (quote) => {
    try {
      set({ strategies: { ...get().strategies, isLoading: true } });
      const res = await quote.getStrategies();
      if (res.error) return;
      set({ strategies: { val: res.val, isLoading: false, error: null } });
    } catch {
      set({
        strategies: {
          ...get().strategies,
          error: "Failed to fetch strategies",
          isLoading: false,
        },
      });
    }
  },
}));
