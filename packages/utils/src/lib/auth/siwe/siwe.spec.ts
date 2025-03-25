import { parseJwt, with0x } from '../../utils';
import { Siwe } from './siwe';
import { describe, it, expect } from 'vitest';
import { Url } from '../../url';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

describe.each([
  'https://orderbook-stage.hashira.io',
  'https://orderbook.garden.finance',
])('Siwe - Orderbook API: %s', (OrderbookApi) => {
  // Provide a valid private key before running the test
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

  const account = privateKeyToAccount(with0x(pk));
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(),
  });

  const url = new Url('/', OrderbookApi);

  describe('construction', () => {
    it('should be made with https domains', async () => {
      new Siwe(url, walletClient, {
        domain: OrderbookApi,
      });
    });
  });

  it('should generate a valid token', async () => {
    const siwe = new Siwe(url, walletClient, {
      domain: OrderbookApi,
    });
    const token = await siwe.getToken();
    expect(token.ok).toBeTruthy();
  });

  it('should return the same token if it has already been generated', async () => {
    const siwe = new Siwe(url, walletClient, {
      domain: OrderbookApi,
    });
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
});
