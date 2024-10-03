import { fetchL1BlockNumber } from './blockNumber';
import { describe, expect, it } from 'vitest';
describe('blockNumber', () => {
  it('fetchL1BlockNumber', async () => {
    const l1BlockNumber = await fetchL1BlockNumber();
    console.log('l1BlockNumber :', l1BlockNumber.val);
    expect(l1BlockNumber.error).toBeUndefined();
    expect(l1BlockNumber.val).toBeTruthy();
  });
});
