import { Url } from '@gardenfi/utils';

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
    [key: string]: string | string[] | number | boolean | undefined;
  },
): URL => {
  const url = baseUrl.endpoint(endPoint);
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        if (Array.isArray(value)) url.searchParams.append(key, value.join(','));
        else url.searchParams.append(key, value.toString());
      }
    });
  }
  return url;
};
