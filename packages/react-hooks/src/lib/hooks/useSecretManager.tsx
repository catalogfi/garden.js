import { Err } from '@catalogfi/utils';
import { ISecretManager, SecretManager } from '@gardenfi/core';
import { SetStateAction } from 'react';
import { useWalletClient } from 'wagmi';

export const useSecretManager = (
  setSecretManager: React.Dispatch<SetStateAction<ISecretManager | undefined>>,
) => {
  const { data: walletClient } = useWalletClient();

  const initializeSecretManager = async () => {
    if (!walletClient) return Err('WalletClient not initialized');
    const sm = await SecretManager.fromWalletClient(walletClient);
    if (sm.error) {
      return Err(sm.error);
    }
    setSecretManager(sm.val);
    return sm;
  };

  return { initializeSecretManager };
};
