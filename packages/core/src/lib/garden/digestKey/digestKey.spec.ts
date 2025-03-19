import { describe, expect, it } from 'vitest';
import { DigestKey } from './digestKey';

describe('DigestKey', () => {
  it('should be able to create a digest key', () => {
    const digestKey = DigestKey.from(
      '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
    );
    expect(digestKey.val).toBeDefined();
    expect(digestKey.error).toBeUndefined();
    expect(digestKey.val.digestKey).toBeTypeOf('string');
    expect(digestKey.val.userId).toBeTypeOf('string');
  });
  it('should not be able to create a digest key', () => {
    const digestKey = DigestKey.from('0xgardenfi');
    expect(digestKey.error).toBeDefined();
  });
});
