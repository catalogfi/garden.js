import { SecretManager } from './secretManager';
import { arbitrumSepolia, sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { beforeAll, describe, expect, it } from 'vitest';

describe('secret manager', () => {
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const account = privateKeyToAccount(pk as `0x${string}`);
  console.log('account :', account.address);

  const walletClient = createWalletClient({
    account: account,
    chain: sepolia,
    transport: http(),
  });
  const walletClient2 = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });

  let secretManager: SecretManager;
  let secretManager2: SecretManager;

  beforeAll(async () => {
    const instance = await SecretManager.fromWalletClient(walletClient);
    const instance2 = await SecretManager.fromWalletClient(walletClient2);
    if (instance.error || instance2.error) {
      throw new Error(instance.error);
    }
    secretManager = instance.val;
    secretManager2 = instance2.val;
  });

  it('should return master private key', () => {
    const pk = secretManager.getMasterPrivKey();
    const pk2 = secretManager2.getMasterPrivKey();
    console.log('pk :', pk);
    console.log('pk :', pk2);
    expect(pk).toEqual(pk2);
    expect(pk).toBeTruthy();
  });

  it('should generate secret', async () => {
    const sign = secretManager.generateSecret(1);
    console.log('sign :', sign.val);
    expect(sign.val).toBeTruthy();
    expect(sign.error).toBeFalsy();
  });
});
