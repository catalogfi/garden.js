import { Url } from '@gardenfi/utils';
import { Chain, Chains } from './asset';
import { PaginationConfig } from './orderbook/orderbook.types';

export const isBitcoin = (chain: Chain) => {
  return (
    chain === Chains.bitcoin ||
    chain === Chains.bitcoin_testnet ||
    chain === Chains.bitcoin_regtest
  );
};

/**
 * Includes `Bearer ` in the Authorization header
 * @param authToken authToken
 * @returns Authorization header
 */
export const Authorization = (authToken: string) => `Bearer ${authToken}`;

/**
 * Constructs a URL with the given base URL, endpoint and parameters (query params)
 * @param baseUrl Base URL
 * @param params Query params
 * @returns Constructed URL
 */
export const ConstructUrl = (
  baseUrl: Url,
  endPoint: string,
  params?: PaginationConfig,
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

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));
