import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Environment } from '@gardenfi/utils';

interface EnvironmentState {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
}

export const useEnvironmentStore = create<EnvironmentState>()(
  persist(
    (set) => ({
      environment: Environment.LOCALNET,
      setEnvironment: (env) => set({ environment: env }),
    }),
    {
      name: 'environment-store',
    }
  )
);
