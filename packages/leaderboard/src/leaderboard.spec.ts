import { describe, it, expect } from 'vitest';
import { Leaderboard } from './leaderboard';

describe('Leaderboard', () => {
  it('should be fetched', async () => {
    const leaderboard = new Leaderboard();
    const data = await leaderboard.leaderboard();
    expect(data.ok).toBeTruthy();
  });

  it('quests should be fetched', async () => {
    const leaderboard = new Leaderboard();
    const data = await leaderboard.quests();
    expect(data.ok).toBeTruthy();
  });

  it('should fetch order rewards', async () => {
    const leaderboard = new Leaderboard();
    const data = await leaderboard.orderReward(26000);
    expect(data.ok).toBeTruthy();
    expect(data.val).toEqual('50.00');
  });

  it('should fetch remaining seed', async () => {
    const leaderboard = new Leaderboard();
    const data = await leaderboard.remainingSeed();
    expect(data.val.length).toBeGreaterThan(0);
  });

  it('should tell whether a user can claim a garden quest', async () => {
    const leaderboard = new Leaderboard();
    const data = await leaderboard.canClaimGardenQuest(
      '0x0000000000000000000000000000000000000000'
    );
    expect(data.ok).toBeFalsy();
  }, 10000);

  //   it('should claim fees for an integration', async () => {
  //     const leaderboard = new Leaderboard();
  //     await leaderboard.claimIntegrationFees({
  //       userAddress: '0x0000000000000000000000000000000000000000',
  //       chain: 'ethereum',
  //       partner: 'camelot',
  //       proof: '',
  //     });
  //   });
});
