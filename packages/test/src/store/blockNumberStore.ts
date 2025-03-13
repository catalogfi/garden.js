import { Chain } from '@gardenfi/orderbook';
import axios from 'axios';
import { create } from 'zustand';
import { Environment, Network } from '@gardenfi/utils';
import { API } from '@gardenfi/core';
export const network: Environment | Network = Environment.TESTNET;

const BASE_URL = API[network].info;

type BlockNumberStore = {
  blockNumbers: Record<Chain, number> | null;
  isLoading: boolean;
  error: string;
  fetchAndSetBlockNumbers: () => Promise<Record<Chain, number> | null>;
};

export const blockNumberStore = create<BlockNumberStore>()((set, get) => ({
  blockNumbers: null,
  isLoading: false,
  error: '',
  fetchAndSetBlockNumbers: async () => {
    try {
      set({ isLoading: true });
      const url = `${BASE_URL}/blocknumber/${network}`;
      const res = await axios.get<Record<Chain, number>>(url);
      set({ blockNumbers: res.data, error: '' });
    } catch (error) {
      set({ error: (error as Error).message });
    } finally {
      set({ isLoading: false });
    }
    return get().blockNumbers;
  },
}));
