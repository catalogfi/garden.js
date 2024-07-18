import { Err, Ok, Result } from '@catalogfi/utils';
import { LeaderboardData } from './leaderboard.types';

export const getRank = (
  leaderboard: LeaderboardData,
  address: string
): Result<number, number> => {
  const lowerCaseAddress = address.toLowerCase();
  for (let i = 0; i < leaderboard.length; i++) {
    if (leaderboard[i].userAddress === lowerCaseAddress) {
      return Ok(i + 1);
    }
  }

  return Err(-1);
};
