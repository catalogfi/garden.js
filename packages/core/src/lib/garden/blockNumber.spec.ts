import { describe, expect, it } from 'vitest';
import { BlockNumberFetcher } from './blockNumber';

describe('blockNumber', () => {
  it('should fetch all block number', async () => {
    const fetcher = new BlockNumberFetcher(
      'https://prod-mainnet-virtual-balance-pr-5.onrender.com/',
      'testnet',
    );
    const res = await fetcher.fetchBlockNumbers();

    console.log('res :', res.val);
    if (res.error) {
      console.log('error while fetching block number ❌ :', res.error);
      throw new Error(res.error);
    }
    expect(res.ok).toBe(true);
    expect(res.error).toBeUndefined();
  });
});
