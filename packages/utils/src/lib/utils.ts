import { jwtDecode } from 'jwt-decode';

export const with0x = (str: string): `0x${string}` => {
  if (str.startsWith('0x')) return str as `0x${string}`;
  return `0x${str}`;
};

/**
 * Includes `Bearer ` in the Authorization header
 * @param authToken authToken
 * @returns Authorization header
 */
export const Authorization = (authToken: string) => `Bearer ${authToken}`;

export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const parseJwt = <T>(token: string): T | undefined => {
  try {
    return jwtDecode(token) as T;
  } catch {
    return;
  }
};

export enum Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
}

export enum Environment {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCALNET = 'localnet',
}

export const add0x = (str: string): `0x${string}` => {
  if (str.startsWith('0x')) return str as `0x${string}`;
  return `0x${str}`;
};
