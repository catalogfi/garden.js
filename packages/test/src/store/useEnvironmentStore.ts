import { create } from 'zustand';
import { Environment } from '@gardenfi/utils';

interface EnvironmentState {
  environment: Environment;
  setEnvironment: (env: Environment) => void;
}

export const useEnvironmentStore = create<EnvironmentState>((set) => ({
  environment: Environment.LOCALNET,
  setEnvironment: (env) => set({ environment: env }),
}));
