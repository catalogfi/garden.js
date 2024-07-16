export interface ILeaderboard {
  leaderboard(): Promise<LeaderboardData>;
  quests(): Promise<Quests>;
  orderReward(orderId: number): Promise<number>;
  remainingSeed(): Promise<number>;
  canClaimGardenQuest(address: string): Promise<void>;
  integrationFees(
    userAddress: string,
    chain: Chain,
    partner: string,
    proof: string,
    authToken: string
  ): Promise<number>;
}

export type Chain = string; //TODO, change to enum / map that has all the proper chains

export type LeaderboardData = { userAddress: string; amount: bigint }[];

export type RaffleEntry = {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: any;
  userAddress: string;
  partner: string;
};

export type OneTimeBonus = RaffleEntry & { amount: string };
export type RaffleWinner = OneTimeBonus;

export type Quests = {
  oneTimeBonus: OneTimeBonus[];
  raffleEntries: RaffleEntry[];
  raffleWinner: RaffleWinner[];
};
