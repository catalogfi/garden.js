import { Url } from '@gardenfi/utils';
import {
  BaseCreateOrderResponse,
  CreateOrderResponse,
} from './orderbook/orderbook.types';

/**
 * Constructs a URL with the given base URL, endpoint and parameters (query params)
 * @param baseUrl Base URL
 * @param params Query params
 * @returns Constructed URL
 */
export const ConstructUrl = (
  baseUrl: Url,
  endPoint: string,
  params?: {
    [key: string]: string | number | boolean | undefined;
  },
): URL => {
  const url = baseUrl.endpoint(endPoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  return url;
};

export function withDiscriminatedType(
  response: BaseCreateOrderResponse,
): CreateOrderResponse | null {
  if ('typed_data' in response && 'initiate_transaction' in response) {
    return { type: 'evm', ...response } as CreateOrderResponse;
  }
  if ('typed_data' in response && 'initiate_call' in response) {
    return { type: 'starknet', ...response } as CreateOrderResponse;
  }
  if ('to' in response && 'amount' in response) {
    return { type: 'bitcoin', ...response } as CreateOrderResponse;
  }
  if ('versioned_tx' in response) {
    return { type: 'solana', ...response } as CreateOrderResponse;
  }
  return null;
}
