import { AsyncResult } from '@catalogfi/utils';
import {
  Chain,
  CreateOrderRequestWithAdditionalData,
  CreateOrderReqWithStrategyId,
} from '@gardenfi/orderbook';
import { APIResponse } from '@gardenfi/utils';

export interface IQuote {
  /**
   * Get a quote for the given orderpair and amount
   * @param orderpair - A string representing the order pair for which the quote is requested.
   *
   * ``eg:- bitcoin_regtest:primary::arbitrum_localnet:0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9``
   *
   * Chain name and asset are separated by a colon(:) and chain pairs are separated by double colon(::)
   * @param amount - The amount to quote
   * @param isExactOut - Whether the amount is exact out
   */
  getQuote(
    orderpair: string,
    amount: number,
    isExactOut: boolean,
  ): AsyncResult<QuoteResponse, string>;

  /**
   * Attest the quote, server will return a signature by verifying and signing the quote according to the provided `strategy_id`
   * @param order - The order for which the attestation is requested. Order should include `strategy_id` in the `additional_data` field.
   * @returns {string} The attestation signature
   */
  getAttestedQuote(
    order: CreateOrderReqWithStrategyId,
  ): AsyncResult<CreateOrderRequestWithAdditionalData, string>;

  /**
   * Get the strategies available for quoting
   * @returns {Strategies} The strategies available
   */
  getStrategies(): AsyncResult<Strategies, string>;
}

export type QuoteResponse = {
  quotes: { [strategy_id: string]: string };
  input_token_price: number;
  output_token_price: number;
};

export type Strategies = Record<
  string,
  {
    id: string;
    minAmount: string;
    maxAmount: string;
    fee: number;
  }
>;

export type StrategiesResponse = APIResponse<{
  [strategy: string]: {
    id: string;
    min_amount: string;
    max_amount: string;
    fee: number;
    source_chain: Chain;
    dest_chain: Chain;
    source_asset: {
      asset: string;
      token_id: string;
      decimals: number;
    };
    dest_asset: {
      asset: string;
      token_id: string;
      decimals: number;
    };
  };
}>;
