import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import { Chain } from '@gardenfi/orderbook';
import { Environment, Url } from '@gardenfi/utils';

// Updated Response type to match the nested structure from the API
type BlockNumbersByChain = {
  [key in Chain]?: number;
};

type Response = {
  testnet?: BlockNumbersByChain;
  mainnet?: BlockNumbersByChain;
};

export interface IBlockNumberFetcher {
  fetchBlockNumbers(): AsyncResult<Response, string>;
}

export class BlockNumberFetcher implements IBlockNumberFetcher {
  private url: Url;
  private environment: Environment;

  constructor(url: string, environment: Environment) {
    console.log(environment);
    this.url = new Url(url).endpoint('blocknumber');
    this.environment = environment;
  }

  async fetchBlockNumbers(): AsyncResult<Response, string> {
    try {
      console.log("Get block number:: ", this.url);
      const res = await Fetcher.get<Response>(this.url);
      console.log("res of block numeber:: ", res);
      return Ok(res);
    } catch (error) {
      return Err('Failed to fetch block numbers', error);
    }
  }
}