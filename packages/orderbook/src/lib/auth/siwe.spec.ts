import { JsonRpcProvider, Wallet } from 'ethers';
import { Siwe } from './siwe';

import * as dotenv from 'dotenv';
import * as path from 'path';

import { describe, it, expect } from 'vitest';
import { Url } from '../url';
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

describe('Siwe', () => {
  const provider = new JsonRpcProvider('http://localhost:8545');
  const API_ENDPOINT = 'http://localhost:8080';
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

  const wallet = new Wallet(pk, provider);

  const url = new Url('/', API_ENDPOINT);

  describe('construction', () => {
    it('should be made with https domains', async () => {
      new Siwe(url, wallet, {
        domain: 'https://random-domain.com',
      });
    });
  });

  it('should generate a valid token', async () => {
    const siwe = new Siwe(url, wallet, {
      domain: 'https://random-domain.com',
    });
    const token = await siwe.getToken();
    expect(token).toBeTruthy();
  });

  it('should return the same token if it has already been generated', async () => {
    const siwe = new Siwe(url, wallet, {
      domain: 'https://random-domain.com',
    });
    const firstToken = await siwe.getToken();
    const secondToken = await siwe.getToken();

    expect(firstToken).toEqual(secondToken);
  });
});
