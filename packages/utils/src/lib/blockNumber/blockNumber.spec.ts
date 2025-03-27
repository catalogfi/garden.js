import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { arbitrum, mainnet } from 'viem/chains';
import { describe, expect, it } from 'vitest';
import { fetchEVMBlockNumber } from './blockNumber';
import { API } from '@gardenfi/utils';

describe('blockNumber', () => {
  const pk = API.pk;
  const account = privateKeyToAccount(pk);

  const arbitrumWalletClient = createWalletClient({
    account,
    chain: arbitrum,
    transport: http(),
  });
  const ethereumWalletClient = createWalletClient({
    account,
    chain: mainnet,
    transport: http(),
  });

  it('should return same block number for arbitrum and ethereum', async () => {
    const arbitrumBlockNumber = await fetchEVMBlockNumber(arbitrumWalletClient);
    const ethereumBlockNumber = await fetchEVMBlockNumber(ethereumWalletClient);
    console.log('BlockNumber :', ethereumBlockNumber.val);
    expect(arbitrumBlockNumber.val).toBe(ethereumBlockNumber.val);
    expect(arbitrumBlockNumber.error).toBeUndefined();
    expect(ethereumBlockNumber.error).toBeUndefined();
  });
});
