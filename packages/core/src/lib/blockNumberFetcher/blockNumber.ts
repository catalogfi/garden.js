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
    this.url = new Url(url).endpoint('blocknumbers');
    this.environment = environment;
  }

  async fetchBlockNumbers(): AsyncResult<Response, string> {
    try {
      const res = await Fetcher.get<Response>(this.url);
      return Ok(res);
    } catch (error) {
      return Err('Failed to fetch block numbers', error);
    }
  }
}
