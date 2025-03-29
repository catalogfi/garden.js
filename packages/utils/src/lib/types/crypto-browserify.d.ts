declare module 'crypto-browserify' {
  export function randomBytes(size: number): Buffer;
  export function createHash(algorithm: string): any;
  export function createHmac(algorithm: string, key: Buffer | string): any;
}
