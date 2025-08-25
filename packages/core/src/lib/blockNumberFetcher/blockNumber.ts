import { Chain } from '@gardenfi/orderbook';
import { Environment, Fetcher, Url } from '@gardenfi/utils';
import { AsyncResult, Err, Ok } from '@gardenfi/utils';

type Response = {
  [key in Chain]: number;
};

export interface IBlockNumberFetcher {
  fetchBlockNumbers(): AsyncResult<Response, string>;
}

export class BlockNumberFetcher implements IBlockNumberFetcher {
  private url: Url;

  constructor(url: Url, network: Environment) {
    this.url = url.endpoint('blocknumbers').endpoint(network);
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
