import { JsonRpcSigner, Wallet } from 'ethers';
import { IAuth } from './auth.interface';

import { SiweMessage } from 'siwe';
import { Fetcher } from '@catalogfi/utils';
import { OrderbookOpts } from '../orderbook.types';
import { IStore, StoreKeys } from '../store/store.interface';
import { MemoryStorage } from '../store/memoryStorage';
import { parseURL } from '../utils';
import { API } from '../api';

export class Siwe implements IAuth {
  private readonly url: string;
  private store: IStore;
  private readonly signer: JsonRpcSigner | Wallet;
  private readonly signingStatement: string = "I'm signing in to Catalog";
  private readonly domain: string;
  constructor(
    url: string,
    signer: JsonRpcSigner | Wallet,
    opts?: OrderbookOpts
  ) {
    this.url = parseURL(url ?? API);
    this.signer = signer;
    this.domain = opts?.domain || 'catalog.fi';
    if (this.domain.startsWith('https://')) {
      this.domain = this.domain.split('https://')[1];
    }
    this.store = opts?.store ?? new MemoryStorage();
  }

  verifyToken(token: string, account: string) {
    const parsedToken = parseJwt(token);
    if (!parsedToken) return false;

    try {
      const utcTimestampNow = Math.floor(Date.now() / 1000) + 120; // auth should be valid for atleast 2 minutes
      return (
        parsedToken.exp > utcTimestampNow &&
        parsedToken.userWallet.toLowerCase() === account.toLowerCase()
      );
    } catch (error) {
      return false;
    }
  }

  async getToken(): Promise<string> {
    const authToken = this.store.getItem(StoreKeys.AUTH_TOKEN);
    if (authToken && this.verifyToken(authToken, this.signer.address))
      return authToken;

    const { message, signature } = await this.signStatement();
    const { token } = await Fetcher.post<{ token: string }>(
      this.url + 'verify',
      {
        body: JSON.stringify({
          message,
          signature,
        }),
      }
    );

    if (!this.verifyToken(token, await this.signer.getAddress())) {
      throw new Error('Token verification failed');
    }
    this.store.setItem(StoreKeys.AUTH_TOKEN, token);
    return token;
  }

  private async signStatement() {
    if (!this.signer.provider)
      throw new Error('signer does not have a provider');
    const date = new Date();
    const expirationTime = new Date(date.getTime() + 300 * 1000); //message expires in 5min

    const { nonce } = await Fetcher.get<{
      nonce: string;
    }>(this.url + 'nonce');

    const network = await this.signer.provider.getNetwork();
    const message = new SiweMessage({
      domain: this.domain,
      address: await this.signer.getAddress(),
      statement: this.signingStatement,
      nonce,
      uri: 'https://' + this.domain,
      version: '1',
      chainId: +network.chainId.toString(),
      expirationTime: expirationTime.toISOString(),
    });
    const preparedMessage = message.prepareMessage();
    const signature = await this.signer.signMessage(preparedMessage);
    return {
      message: preparedMessage,
      signature,
    };
  }
}

const parseJwt = (token: string) => {
  try {
    if (token.split('.').length < 3) return;
    const jwt = token.split('.')[1];
    if (!jwt) return;
    //TODO: check this once
    return JSON.parse(Buffer.from(jwt, 'base64').toString('latin1'));
  } catch {
    return;
  }
};
