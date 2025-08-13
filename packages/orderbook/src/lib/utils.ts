import { Url } from '@gardenfi/utils';
import {
  BaseCreateOrderResponse,
  CreateOrderResponse,
} from './orderbook/orderbook.types';
import { BlockchainType } from './asset';

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
  // Helper to check if an object has all keys
  const hasKeys = (obj: any, keys: string[]) =>
    obj && typeof obj === 'object' && keys.every((k) => k in obj);

  // EVM: has typed_data and initiate_transaction with EVM fields
  if (
    'typed_data' in response &&
    hasKeys((response as any).initiate_transaction, [
      'to',
      'value',
      'data',
      'gas_limit',
      'chain_id',
    ])
  ) {
    return { type: BlockchainType.EVM, ...response } as CreateOrderResponse;
  }

  // Starknet: has typed_data and initiate_transaction with Starknet fields
  if (
    'typed_data' in response &&
    hasKeys((response as any).initiate_transaction, [
      'to',
      'selector',
      'calldata',
    ])
  ) {
    return {
      type: BlockchainType.Starknet,
      ...response,
    } as CreateOrderResponse;
  }

  // Bitcoin: has 'to' and 'amount'
  if (hasKeys(response, ['to', 'amount'])) {
    return { type: BlockchainType.Bitcoin, ...response } as CreateOrderResponse;
  }

  // Solana: has 'versioned_tx'
  if ('versioned_tx' in response) {
    return { type: BlockchainType.Solana, ...response } as CreateOrderResponse;
  }

  return null;
}
