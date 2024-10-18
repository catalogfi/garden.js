import { Network } from './bitcoin.types';
import { getBalance } from './utils';
import { describe, expect, test } from 'vitest';

describe('getBalance', () => {
  test('should return balance', async () => {
    // test code
    const res = await getBalance(
      'bc1qxvay4an52gcghxq5lavact7r6qe9l4laedsazz8fj2ee2cy47tlqff4aj4',
      Network.MAINNET
    );

    expect(res.ok).toBeTruthy();
    expect(res.val.confirmed).toBeTypeOf('number');
    expect(res.val.unconfirmed).toBeTypeOf('number');
    expect(res.val.total).toBeTypeOf('number');
  });
});
