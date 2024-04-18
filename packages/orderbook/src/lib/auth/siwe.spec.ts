import { JsonRpcProvider, Wallet } from 'ethers';
import { Siwe } from './siwe';

import * as dotenv from 'dotenv';
import * as path from 'path';
dotenv.config({ path: path.resolve(__dirname, '..', '..', '..', '.env') });

describe('Siwe', () => {
  if (!process.env['BACKEND_URL']) {
    throw new Error('BACKEND_URL not set');
  }
  const API_ENDPOINT = process.env['BACKEND_URL'];

  if (!process.env['ANKR_RPC_URL']) {
    throw new Error('ANKR_RPC_URL not set');
  }
  const provider = new JsonRpcProvider(process.env['ANKR_RPC_URL']);
  const pk =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';

  const wallet = new Wallet(pk, provider);

  describe('construction', () => {
    it('should be made with https domains', async () => {
      new Siwe('https://random-api.com', wallet, {
        domain: 'https://random-domain.com',
      });
    });
  });

  it('should generate a valid token', async () => {
    const siwe = new Siwe(API_ENDPOINT, wallet, {
      domain: 'https://random-domain.com',
    });
    const token = await siwe.getToken();
    expect(token).toBeTruthy();
  });

  it('should return the same token if it has already been generated', async () => {
    const siwe = new Siwe(API_ENDPOINT, wallet, {
      domain: 'https://random-domain.com',
    });
    const firstToken = await siwe.getToken();
    const secondToken = await siwe.getToken();

    expect(firstToken).toEqual(secondToken);
  });
});
