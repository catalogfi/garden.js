import { describe, it, expect } from 'vitest';
import { Leaderboard } from './leaderboard';
import { getRank } from './rank';

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
    const data = await leaderboard.claimGardenQuest(
      '0x0000000000000000000000000000000000000000'
    );
    expect(data.ok).toBeFalsy();
  }, 10000);

  it('should get the correct rank', async () => {
    const leaderboard = new Leaderboard();
    const leaderboardData = await leaderboard.leaderboard();

    expect(leaderboardData.ok).toBeTruthy();

    const expectedRank = leaderboardData.val.length / 2 + 1;
    const expectedAddress = leaderboardData.val[expectedRank - 1].userAddress;

    const actualRank = getRank(leaderboardData.val, expectedAddress);

    expect(expectedRank).toEqual(actualRank.val);
  });

  it('should return an error if user does not exist in the leaderboard', async () => {
    const leaderboard = new Leaderboard();
    const leaderboardData = await leaderboard.leaderboard();

    expect(leaderboardData.ok).toBeTruthy();

    const rank = getRank(
      leaderboardData.val,
      '0x0000000000000000000000000000000000000000'
    );

    expect(rank.error).toBeTruthy();
    expect(rank.error).toEqual(-1);
  });
});
