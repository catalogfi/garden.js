import { Err, Ok, trim0x } from '@catalogfi/utils';
import { randomBytes } from 'crypto';
import { privateKeyToAccount } from 'viem/accounts';

export class DigestKey {
  private _digestKey: string;
  private _userId: string;

  constructor(digestKey: string) {
    this._digestKey = digestKey;
    const account = privateKeyToAccount(('0x' + digestKey) as `0x${string}`);
    this._userId = account.address;
  }

  static from(digestKey: string) {
    digestKey = trim0x(digestKey);

    if (!/^[0-9a-fA-F]{64}$/.test(digestKey)) {
      return Err('Invalid digest key format');
    }

    if (!DigestKey.isValidPrivateKey(digestKey)) {
      return Err('Invalid private key');
    }

    return Ok(new DigestKey(digestKey));
  }

  static generateRandom() {
    const privateKey = DigestKey.generateRandomDigestKey();
    return DigestKey.from(privateKey);
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
