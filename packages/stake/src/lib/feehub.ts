import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import { IFeehub, StakeApy, StakeRewards } from './stake.types';
import { Url } from '@gardenfi/utils';

export class Feehub implements IFeehub {
  private readonly api: Url;
  private readonly address: string;

  constructor(api: string, address: string) {
    this.api = new Url(api);
    this.address = address;
  }

  async getStakingRewards(): AsyncResult<StakeRewards, string> {
    try {
      const res = await Fetcher.get<{ data: StakeRewards }>(
        this.api.endpoint('/rewards/' + this.address)
      );
      return Ok(res.data);
    } catch (error) {
      return Err('Failed to get staking rewards: ' + error);
    }
  }

  async getStakeApy(): AsyncResult<StakeApy, string> {
    try {
      const res = await Fetcher.get<{ data: StakeApy }>(
        this.api.endpoint('/apy/' + this.address)
      );
      return Ok(res.data);
    } catch (error) {
      return Err('Failed to get staking APY: ' + error);
    }
  }
}
