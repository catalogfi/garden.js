import { describe, it } from 'vitest';

describe('api key', async () => {
  it('decode and verify', async () => {
    function decodeBase64UrlSafe(base64Url: string) {
      // Convert from URL-safe Base64 to standard Base64
      let base64 = base64Url.replace(/_/g, '/').replace(/-/g, '+');

      // Ensure proper padding
      while (base64.length % 4 !== 0) {
        base64 += '=';
      }

      // Decode Base64
      return Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
    }

    const encodedKey =
      'AAAAAGm47cw6Og5G37SuhX_uiXy8CYZCwx5XHgNS1DCsTi_HOzpOaAoYBPZLbGm1th0qVlom1EuaV_OtU6oJ_UIffIpsfVVDbKAc';
    const decodedBytes = decodeBase64UrlSafe(encodedKey);

    console.log(decodedBytes);
    const text = new TextDecoder().decode(decodedBytes);
    console.log('text: ', text);

    function extractData(bytes: Uint8Array) {
      const DELIMITER = new TextEncoder().encode('::'); // Adjust if needed

      // Find the delimiter position
      const delimiterPos = bytes.findIndex((_, i) =>
        bytes
          .slice(i, i + DELIMITER.length)
          .every((b, j) => b === DELIMITER[j]),
      );

      if (delimiterPos === -1) {
        throw new Error('Invalid format: delimiter not found');
      }

      // Extract expiry timestamp (first 8 bytes)
      const expiryBytes = bytes.slice(0, 8);
      const expiryTimestamp = new DataView(expiryBytes.buffer).getBigUint64(
        0,
        false,
      );

      // Extract signature (bytes after delimiter)
      const sigBytes = bytes.slice(delimiterPos + DELIMITER.length);

      return { expiryTimestamp, signature: sigBytes };
    }

    try {
      const { expiryTimestamp, signature } = extractData(decodedBytes);
      console.log(
        'Expiry Timestamp:',
        new Date(Number(expiryTimestamp) * 1000),
      );
      console.log(
        'Signature (Hex):',
        Array.from(signature)
          .map((b) => b.toString(16).padStart(2, '0'))
          .join(''),
      );
    } catch (error) {
      console.error(error);
    }
  });
});
