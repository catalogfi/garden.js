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
  LOCALNET = 'localnet',
}

export enum Environment {
  MAINNET = 'mainnet',
  TESTNET = 'testnet',
  LOCALNET = 'localnet',
}

export function hexToU32Array(
  hexString: string,
  endian: 'big' | 'little' = 'big',
): number[] {
  // Remove 0x prefix if present
  hexString = hexString.replace('0x', '');

  // Ensure we have 64 characters (32 bytes, will make 8 u32s)
  if (hexString.length !== 64) {
    throw new Error('Invalid hash length');
  }

  const result: number[] = [];

  // Process 8 bytes (32 bits) at a time to create each u32
  for (let i = 0; i < 8; i++) {
    // Take 8 hex characters (4 bytes/32 bits)
    const chunk = hexString.slice(i * 8, (i + 1) * 8);

    // Split into bytes
    const bytes = chunk.match(/.{2}/g)!;

    // Handle endianness
    if (endian === 'little') {
      bytes.reverse();
    }

    const finalHex = bytes.join('');
    result.push(parseInt(finalHex, 16));
  }

  return result;
}
