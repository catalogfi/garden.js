import { SecretManager } from './secretManager';
import { arbitrumSepolia, sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { describe, expect, it } from 'vitest';

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

  const secretManager = SecretManager.fromWalletClient(walletClient);
  const secretManager2 = SecretManager.fromWalletClient(walletClient2);

  it('should return master private key', async () => {
    const pk = await secretManager.getMasterPrivKey();
    const pk2 = await secretManager2.getMasterPrivKey();
    console.log('pk :', pk);
    console.log('pk :', pk2);
    expect(pk).toEqual(pk2);
    expect(pk).toBeTruthy();
  });

  it('should generate secret', async () => {
    const sign = await secretManager.generateSecret(1);
    console.log('sign :', sign.val);
    expect(sign.val).toBeTruthy();
    expect(sign.error).toBeFalsy();
  });
});
