import { describe, expect, it } from 'vitest';
import { isExpired } from './orderStatusParser';

describe('orderStatus', () => {
  it('test IsExpired', async () => {
    const res1 = isExpired(Date.now(), 1);
    const res2 = isExpired(1729608769, 1);
    expect(res1).toBe(false);
    expect(res2).toBe(true);
  });
});
