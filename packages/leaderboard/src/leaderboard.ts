import { URL } from 'url';
import {
  ClaimIntegrationFeesConfig,
  LeaderboardData,
  LeaderboardDataResponse,
  LeaderboardResources,
  OrderRewardsResponse,
  Quests,
  RemainingSeed,
} from './leaderboard.types';
import {
  claimGardenQuestSchema,
  leaderboardSchema,
  orderRewardSchema,
  questsSchema,
  remainingSeedSchema,
  claimIntegrationFeesSchema,
} from './leaderboard.schema';
import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';

export class Leaderboard {
  public url: URL;
  constructor(
    leaderboardDomain: string = 'https://leaderboard.garden.finance'
  ) {
    this.url = new URL('/', leaderboardDomain);
  }

  async leaderboard(): AsyncResult<LeaderboardData, string> {
    const url = new URL(LeaderboardResources.Leaderboard, this.url);
    try {
      const leaderboardDataResponse =
        await Fetcher.get<LeaderboardDataResponse>(url);

      const parsedLeaderboardData = await leaderboardSchema.validate(
        leaderboardDataResponse
      );

      return Ok(
        parsedLeaderboardData.map((parsedLeaderboardItem) => ({
          userAddress: parsedLeaderboardItem.user_address,
          amount: parsedLeaderboardItem.amount,
        }))
      );
    } catch (err) {
      return Err(
        'leaderboard: failed to get leaderboard data: ' + parseError(err)
      );
    }
  }

  async quests(): AsyncResult<Quests, string> {
    const url = new URL(LeaderboardResources.Quests, this.url);
    try {
      const questResponse = await Fetcher.get<Quests>(url);

      const parsedQuests = await questsSchema.validate(questResponse);

      return Ok(parsedQuests);
    } catch (err) {
      return Err('leaderboard: failed to get quests: ' + parseError(err));
    }
  }

  async orderReward(orderId: number): AsyncResult<string, string> {
    const url = new URL(LeaderboardResources.OrderRewards(orderId), this.url);
    try {
      const rewardsResponse = await Fetcher.get<OrderRewardsResponse>(url);

      const parsedRewards = await orderRewardSchema.validate(rewardsResponse);

      const amount = Number(
        BigInt(parsedRewards.amount) / BigInt(1e18)
      ).toFixed(2);

      return Ok(amount);
    } catch (err) {
      return Err(
        `leaderboard: failed to get order rewards for ${orderId}: ` +
          parseError(err)
      );
    }
  }

  async remainingSeed(): AsyncResult<RemainingSeed, string> {
    const url = new URL(LeaderboardResources.RemainingSeed, this.url);

    try {
      const remainingSeedResponse = await Fetcher.get<RemainingSeed>(url);

      const parsedRemainingSeed = await remainingSeedSchema.validate(
        remainingSeedResponse
      );

      const remainingSeed = Number(
        BigInt(parsedRemainingSeed) / BigInt(1e18)
      ).toFixed(0);

      return Ok(remainingSeed);
    } catch (err) {
      return Err(
        'leaderboard: failed to get remaining seed: ' + parseError(err)
      );
    }
  }

  async canClaimGardenQuest(address: string): AsyncResult<string, string> {
    const url = new URL(
      LeaderboardResources.ClaimGardenQuest(address.toLowerCase()),
      this.url
    );

    try {
      const canClaimGardenQuest = await Fetcher.get<boolean>(url, {
        retryCount: 0,
        retryDelay: 0,
      });

      const parsedClaimGardenQuest = await claimGardenQuestSchema.validate(
        canClaimGardenQuest
      );

      if (Object.keys(parsedClaimGardenQuest).includes('message')) {
        return Ok((parsedClaimGardenQuest as { message: string }).message);
      } else {
        return Err((parsedClaimGardenQuest as { error: string }).error);
      }
    } catch (err) {
      return Err(
        'leaderboard: failed to get canClaimGardenQuest: ' + parseError(err)
      );
    }
  }

  async claimIntegrationFees(
    claimIntegrationFeesConfig: ClaimIntegrationFeesConfig
  ): AsyncResult<number, string> {
    const url = new URL(LeaderboardResources.ClaimIntegrationFees, this.url);
    try {
      const integrationFees = await Fetcher.post<number>(url, {
        headers: new Headers({
          authorization: `Bearer ${claimIntegrationFeesConfig.authToken}`,
        }),
        body: JSON.stringify({
          userAddress: claimIntegrationFeesConfig.userAddress,
          chain: claimIntegrationFeesConfig.chain,
          partner: claimIntegrationFeesConfig.partner,
          proof: claimIntegrationFeesConfig.proof,
        }),
        retryCount: 0,
        retryDelay: 0,
      });

      const parsedIntegrationFees = await claimIntegrationFeesSchema.validate(
        integrationFees
      );

      return Ok(parsedIntegrationFees);
    } catch (err) {
      return Err(
        'leaderboard: failed to get claimIntegrationFees: ' + parseError(err)
      );
    }
  }
}

export const parseError = (error: unknown) => {
  if (error instanceof Error) {
    return error.message;
  }
  return error?.toString() ?? 'Unknown error';
};
