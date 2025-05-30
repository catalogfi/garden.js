import { SecretManager } from './secretManager';
import { arbitrumSepolia, sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { describe, expect, it } from 'vitest';
import { API } from '@gardenfi/utils';

describe('secret manager', () => {
  const pk = API.pk;
  const account = privateKeyToAccount(pk as `0x${string}`);
  console.log('account :', account.address);

  const walletClient = createWalletClient({
    account: account,
    chain: sepolia,
    transport: http(),
  });
  const arbitrumwalletClient = createWalletClient({
    account,
    chain: arbitrumSepolia,
    transport: http(),
  });

  const secretManager = SecretManager.fromWalletClient(walletClient);
  const arbsecretManager = SecretManager.fromWalletClient(arbitrumwalletClient);

  it('should return master private key', async () => {
    const pk = await secretManager.getDigestKey();
    const pk2 = await arbsecretManager.getDigestKey();
    console.log('pk :', pk);
    console.log('pk :', pk2);
    expect(pk).toEqual(pk2);
    expect(pk).toBeTruthy();
  });

  it('should generate secret', async () => {
    const sign = await secretManager.generateSecret('hello');
    console.log('sign :', sign.val);
    expect(sign.val).toBeTruthy();
    expect(sign.error).toBeFalsy();
  });
});
