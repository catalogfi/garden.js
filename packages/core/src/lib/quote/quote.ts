import { Err, Fetcher, Ok, Request as UtilsRequest } from '@gardenfi/utils';
import {
  IQuote,
  QuoteParamsForAssets,
  QuoteResponse,
  Strategies,
  StrategiesResponse,
} from './quote.types';
import { APIResponse, Url } from '@gardenfi/utils';
import { constructOrderPair } from '../utils';

export class Quote implements IQuote {
  private quoteUrl: Url;

  constructor(quoteUrl: string) {
    this.quoteUrl = new Url(quoteUrl);
  }

  async getQuoteFromAssets({
    fromAsset,
    toAsset,
    amount,
    isExactOut = false,
    options,
  }: QuoteParamsForAssets) {
    const orderpair = constructOrderPair(
      fromAsset.chain,
      fromAsset.atomicSwapAddress,
      toAsset.chain,
      toAsset.atomicSwapAddress,
    );

    return this.getQuote(orderpair, amount, isExactOut, options);
  }

  async getQuote(
    orderpair: string,
    amount: number,
    isExactOut = false,
    options?: {
      affiliateFee?: number;
      request?: UtilsRequest;
    },
  ) {
    try {
      const params: Record<string, string> = {
        order_pair: orderpair,
        amount: amount.toString(),
        exact_out: isExactOut.toString(),
        ...(options?.affiliateFee !== undefined && {
          affiliate_fee: options.affiliateFee.toString(),
        }),
      };

      const url = this.quoteUrl.endpoint('/').addSearchParams(params);
      const res = await Fetcher.get<APIResponse<QuoteResponse>>(url, {
        retryCount: 0,
        ...options?.request,
      });

      if (res.error) return Err(res.error);
      if (!res.result)
        return Err('GetQuote: Unexpected error, result is undefined');

      return Ok(res.result);
    } catch (error) {
      return Err('GetQuote:', String(error));
    }
  }

  async getStrategies() {
    try {
      const res = await Fetcher.get<StrategiesResponse>(
        this.quoteUrl.endpoint('/strategies'),
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
          fixed_fee: Number(value.fixed_fee),
        };
      }

      return Ok(strategies);
    } catch (error) {
      return Err('GetStrategies:', String(error));
    }
  }
}
