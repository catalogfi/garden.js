import { create } from 'zustand';
import { AccountInterface, Provider } from 'starknet';

interface StarknetState {
  isConnected: boolean;
  account: AccountInterface | null;
  provider: Provider | null;
  error: string | null;
  setConnection: (account: AccountInterface | null, provider: Provider | null) => void;
  resetConnection: () => void;
  setError: (error: string | null) => void;
}

export const useStarknetStore = create<StarknetState>((set) => ({
  isConnected: false,
  account: null,
  provider: null,
  error: null,
  setConnection: (account, provider) => 
    set({ isConnected: !!account, account, provider, error: null }),
  resetConnection: () => 
    set({ isConnected: false, account: null, provider: null, error: null }),
  setError: (error) => set({ error }),
}));