import { AsyncResult } from '@catalogfi/utils';
import { DURATION_MAP } from './constants';

export type Stake = {
  id: string;
  filler: string;
  expiry: number;
  used: boolean;
  votes: number;
  amount: string;
  stakedAt: string;
  status: string;
  lastStakedAtBlock: number;
};

export type Config = {
  SEED_ADDRESS: string;
  STAKING_CONTRACT_ADDRESS: string;
  GARDEN_FILLER_ADDRESS: string;
  FLOWER_CONTRACT_ADDRESS: string;
  STAKING_CHAIN: number;
  CIRCULATING_SEED_SUPPLY: number;
  FEE_HUB: string;
  GARDEN_HTLC_ADDR: string;
  RPC: string;
};

export type GlobalStakingData = {
  totalStaked: string;
  ast: string;
  totalVotes: string;
};

export type StakeRewards = {
  [key: string]: string;
};

export type StakeApy = {
  stakeApys: {
    [key: string]: string;
  };
  userApy: string;
};

export type DURATION = keyof typeof DURATION_MAP;

export interface IStakeProvider {
  /**
   * Stake and vote.
   */
  stakeAndVote(
    stakeAmount: number,
    selectedDuration: DURATION
  ): AsyncResult<string, string>;
  /**
   * Unstake.
   */
  unStake(stakeId: string): AsyncResult<string, string>;
  /**
   * Renew stake.
   */
  renewStake(stakeId: string, duration: DURATION): AsyncResult<string, string>;
  /**
   * Extend stake.
   */
  extendStake(stakeId: string, duration: DURATION): AsyncResult<string, string>;
}

export interface IFeehub {
  /**
   * Get the staking rewards per stake id.
   */
  getStakingRewards(): AsyncResult<StakeRewards, string>;
  /**
   * Get the staking APY for all the individual stakes and the user.
   */
  getStakeApy(): AsyncResult<StakeApy, string>;
}
