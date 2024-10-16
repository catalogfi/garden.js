import { with0x } from './../utils';
import { Siwe } from './siwe';
import { describe, it, expect } from 'vitest';
import { Url } from '../url';
import { createWalletClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

describe('Siwe', () => {
  //Provide a valid OrderbookApi and pk before running the test
  const OrderbookApi = 'http://localhost:4426';
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
        domain: 'https://random-domain.com',
      });
    });
  });

  it('should generate a valid token', async () => {
    const siwe = new Siwe(url, walletClient, {
      domain: 'https://random-domain.com',
    });
    const token = await siwe.getToken();
    expect(token).toBeTruthy();
  });

  it('should return the same token if it has already been generated', async () => {
    const siwe = new Siwe(url, walletClient, {
      domain: 'https://random-domain.com',
    });
    const firstToken = await siwe.getToken();
    const secondToken = await siwe.getToken();

    expect(firstToken).toEqual(secondToken);
  });
});
