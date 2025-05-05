import { parseJwt } from '../../utils';
import { Siwe } from './siwe';
import { describe, it, expect } from 'vitest';
import { Url } from '../../url';
import { DigestKey } from '../../digestKey/digestKey';

describe.each(['https://testnet.api.garden.finance/auth'])(
  'Siwe - Orderbook API: %s',
  (OrderbookApi) => {
    // Provide a valid private key before running the test
    const digestKey =
      '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

    const siwe = Siwe.fromDigestKey(
      new Url(OrderbookApi),
      DigestKey.from(digestKey).val,
    );

    it('should generate a valid token', async () => {
      const token = await siwe.getAuthHeaders();
      console.log('token :', token.val);
      expect(token.ok).toBeTruthy();
    });

    it('should return the same token if it has already been generated', async () => {
      const firstToken = await siwe.getToken();
      const secondToken = await siwe.getToken();

      expect(firstToken).toEqual(secondToken);
    });

    it('test parseJWT', async () => {
      const parsedToken = parseJwt<{
        user_id: string;
        exp: number;
      }>(
        'eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyX2lkIjoiMHhkNTNENGYxMDBBYUJBMzE0YkYwMzNmOTlmODZhMzEyQmZiZERGMTEzIiwiZXhwIjoxNzQxOTQyMzYzfQ.F21W1k_D_IRIns7KacdTkGkrxF5dTjbRA4JQnbmLIHY',
      );
      console.log('parsedToken :', parsedToken);
      expect(parsedToken).toBeTruthy();
    });

    // it.only('should generate a valid token from a digest key', async () => {
    //   const siwe = Siwe.fromDigestKey(
    //     url,
    //     '6a78c7fc568243b3e134c1c5eeda8ce8d4fcbb51e5fddef3edcc7f204d4a2f42',
    //   );
    //   const token = await siwe.getToken();
    //   console.log('token :', token.val);
    //   expect(token.ok).toBeTruthy();
    // });
  },
);
