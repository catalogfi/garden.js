import { Url } from '@gardenfi/utils';
import { OrderVersion } from './orderbook/orderbook.types';

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

/**
 * Converts a lowercase version string to uppercase OrderVersion enum
 * @param version - The lowercase version string (e.g., 'v1', 'v2')
 * @returns The corresponding OrderVersion enum value
 */
export function parseOrderVersion(version: string): OrderVersion {
  const upperVersion = version.toUpperCase();
  if (upperVersion === 'V1') {
    return OrderVersion.V1;
  } else if (upperVersion === 'V2') {
    return OrderVersion.V2;
  }
  throw new Error(`Unsupported order version: ${version}`);
}

/**
 * Converts an OrderVersion enum to lowercase string
 * @param version - The OrderVersion enum value
 * @returns The lowercase version string (e.g., 'v1', 'v2')
 */
export function orderVersionToString(version: OrderVersion): string {
  return version.toLowerCase();
}
