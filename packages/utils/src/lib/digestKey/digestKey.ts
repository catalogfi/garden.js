import { trim0x } from '@catalogfi/utils';
import { Err, Ok } from '../result';
import { randomBytes } from 'crypto-browserify';
import { privateKeyToAccount } from 'viem/accounts';

export class DigestKey {
  private _digestKey: string;
  private _userId: string;

  constructor(digestKey: string) {
    if (!DigestKey.isValidDigestKey(digestKey)) {
      throw new Error('Invalid digest key format');
    }

    this._digestKey = digestKey;
    const account = privateKeyToAccount(('0x' + digestKey) as `0x${string}`);
    this._userId = account.address;
  }

  static from(digestKey: string) {
    digestKey = trim0x(digestKey);

    if (!this.isValidDigestKey(digestKey)) {
      return Err('Invalid digest key format');
    }

    return Ok(new DigestKey(digestKey));
  }

  static generateRandom() {
    const privateKey = DigestKey.generateRandomDigestKey();
    return DigestKey.from(privateKey);
  }

  private static isValidDigestKey(digestKey: string): boolean {
    return (
      /^[0-9a-fA-F]{64}$/.test(digestKey) && this.isValidPrivateKey(digestKey)
    );
  }

  private static isValidPrivateKey(privateKey: string): boolean {
    const bn = BigInt('0x' + privateKey);
    const min = 1n;
    const max = BigInt(
      '0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141',
    );
    return bn >= min && bn < max;
  }

  private static generateRandomDigestKey(): string {
    let privateKey;

    if (typeof window !== 'undefined' && window.crypto) {
      // Browser environment
      const randomBytes = new Uint8Array(32);
      window.crypto.getRandomValues(randomBytes);
      privateKey = trim0x(Buffer.from(randomBytes).toString('hex'));
    } else {
      // Node.js environment
      const _randomBytes = randomBytes(32);
      privateKey = trim0x(Buffer.from(_randomBytes).toString('hex'));
    }

    return DigestKey.isValidPrivateKey(privateKey)
      ? privateKey
      : DigestKey.generateRandomDigestKey();
  }

  get digestKey() {
    return this._digestKey;
  }

  get userId() {
    return this._userId;
  }
}
