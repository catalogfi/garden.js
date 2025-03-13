import { AsyncResult, Err, Fetcher, Ok, Request } from '@catalogfi/utils';
import {
  IQuote,
  QuoteResponse,
  Strategies,
  StrategiesResponse,
} from './quote.types';
import {
  CreateOrderRequestWithAdditionalData,
  CreateOrderReqWithStrategyId,
} from '@gardenfi/orderbook';
import { APIResponse, Url } from '@gardenfi/utils';
import { constructOrderPair } from '../utils';

export class Quote implements IQuote {
  private quoteUrl: Url;

  constructor(quoteUrl: string) {
    this.quoteUrl = new Url('/quote', quoteUrl);
  }

  async getQuote(
    orderpair: string,
    amount: number,
    isExactOut = false,
    request?: Request,
  ) {
    try {
      const url = this.quoteUrl.addSearchParams({
        order_pair: orderpair,
        amount: amount.toString(),
        exact_out: isExactOut.toString(),
      });
      const res = await Fetcher.get<APIResponse<QuoteResponse>>(url, {
        retryCount: 0,
        ...request,
      });

      if (res.error) return Err(res.error);
      if (!res.result)
        return Err('GetQuote: Unexpected error, result is undefined');

      return Ok(res.result);
    } catch (error) {
      return Err('GetQuote:', String(error));
    }
  }

  async getAttestedQuote(
    order: CreateOrderReqWithStrategyId,
  ): AsyncResult<CreateOrderRequestWithAdditionalData, string> {
    try {
      const res = await Fetcher.post<
        APIResponse<CreateOrderRequestWithAdditionalData>
      >(this.quoteUrl.endpoint('attested').toString(), {
        body: JSON.stringify(order),
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (res.error) return Err(res.error);
      if (!res.result)
        return Err('GetAttestedQuote: Unexpected error, result is undefined');

      return Ok(res.result);
    } catch (error) {
      console.log('error :', error);
      return Err('GetAttestedQuote:', String(error));
    }
  }

  async getStrategies() {
    try {
      const res = await Fetcher.get<StrategiesResponse>(
        this.quoteUrl.endpoint('strategies'),
      );

      if (res.error) return Err(res.error);
      if (!res.result)
        return Err('GetStrategies: Unexpected error, result is undefined');

      const strategies: Strategies = {};

      for (const value of Object.values(res.result)) {
        const orderPair = constructOrderPair(
          value.source_chain,
          value.source_asset.asset,
          value.dest_chain,
          value.dest_asset.asset,
        );
        strategies[orderPair] = {
          id: value.id,
          minAmount: value.min_amount,
          maxAmount: value.max_amount,
          fee: value.fee,
        };
      }

      return Ok(strategies);
    } catch (error) {
      return Err('GetStrategies:', String(error));
    }
  }
}
