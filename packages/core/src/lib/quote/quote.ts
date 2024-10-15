import { AsyncResult, Err, Fetcher, Ok } from '@catalogfi/utils';
import { IQuote, QuoteResponse } from './quote.types';
import {
  CreateOrderRequestWithAdditionalData,
  CreateOrderReqWithStrategyId,
} from '@gardenfi/orderbook';
import { APIResponse, Url } from '@gardenfi/utils';

export class Quote implements IQuote {
  private quoteUrl: Url;

  constructor(quoteUrl: string) {
    this.quoteUrl = new Url('/quote', quoteUrl);
  }

  async getQuote(orderpair: string, amount: number, isExactOut = false) {
    try {
      const url = this.quoteUrl.addSearchParams({
        order_pair: orderpair,
        amount: amount.toString(),
        exact_out: isExactOut.toString(),
      });
      const res = await Fetcher.get<APIResponse<QuoteResponse>>(url);

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
      >(this.quoteUrl.endpoint('/attested').toString(), {
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
}
