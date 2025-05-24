import { Chain } from "@gardenfi/orderbook";
import axios from "axios";
import { create } from "zustand";
import { Environment, Network } from "@gardenfi/utils";
import { API } from "@gardenfi/core";
import { useEnvironmentStore } from './useEnvironmentStore';

type BlockNumberStore = {
  blockNumbers: Record<Chain, number> | null;
  isLoading: boolean;
  error: string;
  fetchAndSetBlockNumbers: () => Promise<Record<Chain, number> | null>;
};

export const blockNumberStore = create<BlockNumberStore>()((set, get) => ({
  blockNumbers: null,
  isLoading: false,
  error: "",

  fetchAndSetBlockNumbers: async () => {
    try {
      set({ isLoading: true });

      const environment = useEnvironmentStore.getState().environment as Environment | Network;
      const BASE_URL = API[environment].info;

      const url = `${BASE_URL}/blocknumbers/${environment}`;
      const res = await axios.get<Record<Chain, number>>(url);

      set({ blockNumbers: res.data, error: "" });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }

    return get().blockNumbers;
  },
}));
