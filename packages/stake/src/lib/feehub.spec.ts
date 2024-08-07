import { Feehub } from './feehub';
import { describe, expect, test } from 'vitest';

describe('feehub', () => {
  const fb = new Feehub(
    'https://feehub.garden.finance',
    '0x4cec89b2d6b976a8514ad63118a8e691e51bfd64'
  );
  test('should get staking rewards', async () => {
    const res = await fb.getStakingRewards();
    expect(res.ok).toBeTruthy();
  });
  test('should get staking APY', async () => {
    const res = await fb.getStakeApy();
    expect(res.ok).toBeTruthy();
  });
});
