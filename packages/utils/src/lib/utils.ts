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

export enum Network {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCALNET = 'localnet'
}

export enum Environment {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCALNET = 'localnet',
}
