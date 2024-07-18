import { InferType } from 'yup';
import {
  claimGardenQuestSchema,
  claimIntegrationFeesSchema,
  leaderboardSchema,
  orderRewardSchema,
  questsSchema,
  remainingSeedSchema,
} from './leaderboard.schema';
import { AsyncResult } from '@catalogfi/utils';

export interface ILeaderboard {
  leaderboard(): AsyncResult<LeaderboardData, string>;
  quests(): AsyncResult<Quests, string>;
  orderReward(orderId: number): AsyncResult<string, string>;
  remainingSeed(): AsyncResult<RemainingSeed, string>;
  claimGardenQuest(address: string): AsyncResult<string, string>;
  claimIntegrationFees(
    interfaceFeesConfig: ClaimIntegrationFeesConfig
  ): AsyncResult<number, string>;
}

export type ClaimIntegrationFeesConfig = {
  userAddress: string;
  chain: Chain;
  partner: Partner;
  proof: string;
  authToken: string;
};

export type Chain =
  | 'ethereum'
  | 'arbitrum'
  | 'polygon'
  | 'optimism'
  | 'avalanche'
  | 'binance';

export type Partner =
  | 'gmx'
  | 'radiant'
  | 'vertex'
  | 'garden'
  | 'debridge'
  | 'camelot'
  | 'traderjoe'
  | 'pancake'
  | 'arkdigital'
  | 'dodo';

export type LeaderboardData = { userAddress: string; amount: string }[];

export const LeaderboardResources = {
  Leaderboard: 'leaderboard',
  Quests: 'quests',
  OrderRewards: (orderId: number) => `rewards/${orderId}`,
  RemainingSeed: 'remainingSeed',
  ClaimGardenQuest: (address: string) => `claimGardenQuest/${address}`,
  ClaimIntegrationFees: 'integrations/claimFees',
};

export type LeaderboardDataResponse = InferType<typeof leaderboardSchema>;
export type Quests = InferType<typeof questsSchema>;
export type OrderRewardsResponse = InferType<typeof orderRewardSchema>;
export type RemainingSeed = InferType<typeof remainingSeedSchema>;
export type ClaimGardenQuest = InferType<typeof claimGardenQuestSchema>;
export type ClaimIntegrationFeesResponse = InferType<
  typeof claimIntegrationFeesSchema
>;
