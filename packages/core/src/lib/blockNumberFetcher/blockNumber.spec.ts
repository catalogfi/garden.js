import { describe, expect, it } from 'vitest';
import { BlockNumberFetcher } from './blockNumber';
import { Environment } from 'gardenfi/utils';

describe('blockNumber', () => {
  it('should fetch all block number', async () => {
    const fetcher = new BlockNumberFetcher(
      'https://testnet.api.garden.finance/info',
      Environment.TESTNET,
    );
    const res = await fetcher.fetchBlockNumbers();

    console.log('res :', res.val);
    if (!res.ok) {
      console.log('error while fetching block number ❌ :', res.error);
      throw new Error(res.error);
    }
    expect(res.ok).toBe(true);
    expect(res.error).toBeUndefined();
  });
});
