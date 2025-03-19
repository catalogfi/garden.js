import { create } from 'zustand';

interface AuthState {
  authToken: string;
  setAuthToken: (token: string) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  authToken: "",
  setAuthToken: (token) => set({ authToken: token }),
}));