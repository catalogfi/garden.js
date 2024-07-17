import { InferType } from 'yup';
import {
  claimGardenQuestSchema,
  claimIntegrationFeesSchema,
  leaderboardSchema,
  orderRewardSchema,
  questsSchema,
  remainingSeedSchema,
} from './leaderboard.schema';

export interface ILeaderboard {
  leaderboard(): Promise<LeaderboardData>;
  quests(): Promise<Quests>;
  orderReward(orderId: number): Promise<number>;
  remainingSeed(): Promise<number>;
  canClaimGardenQuest(address: string): Promise<void>;
  claimIntegrationFees(
    interfaceFeesConfig: ClaimIntegrationFeesConfig
  ): Promise<number>;
}

export type ClaimIntegrationFeesConfig = {
  userAddress: string;
  chain: Chain;
  partner: string;
  proof: string;
  authToken: string;
};

export type Chain = string; //TODO, change to enum / map that has all the proper chains

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
