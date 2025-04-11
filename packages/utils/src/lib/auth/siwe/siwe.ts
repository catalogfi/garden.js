import { CookieJar } from 'tough-cookie';
import fetchCookie from 'fetch-cookie';
import { AuthHeader, IAuth, SiweOpts } from '../auth.types';
import { AsyncResult, Err, Ok, Result } from '@catalogfi/utils';
import { Url } from '../../url';
import { MemoryStorage } from '../../store/memoryStorage';
import { IStore, StoreKeys } from '../../store/store.interface';
import { APIResponse } from '../../apiResponse.types';
import { createWalletClient, http, WalletClient } from 'viem';
import { createSiweMessage } from 'viem/siwe';
import { add0x, Authorization, parseJwt } from '../../utils';
import { privateKeyToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';
import { DigestKey } from '../../digestKey/digestKey';
export class Siwe implements IAuth {
  private readonly url: Url;
  private store: IStore;
  private walletClient: WalletClient;
  private readonly signingStatement: string;
  private readonly domain: string;
  private fetchWithCookies: typeof fetch;

  constructor(url: Url, walletClient: WalletClient, opts?: SiweOpts) {
    this.url = url.endpoint('siwe');
    this.walletClient = walletClient;

    this.domain = opts?.domain || 'app.garden.finance';
    if (this.domain.startsWith('https://')) {
      this.domain = this.domain.split('https://')[1];
    }
    this.signingStatement = opts?.signingStatement ?? 'Garden.fi';

    this.store =
      opts?.store ??
      (typeof window !== 'undefined'
        ? window.localStorage
        : new MemoryStorage());

    if (typeof window === 'undefined') {
      // Node.js environment
      const jar = new CookieJar();
      this.fetchWithCookies = fetchCookie(fetch, jar);
    } else {
      // Browser environment
      this.fetchWithCookies = window.fetch.bind(window);
    }
  }

  static fromDigestKey(url: Url, digestKey: DigestKey, siweOpts?: SiweOpts) {
    const walletClient = createWalletClient({
      account: privateKeyToAccount(add0x(digestKey.digestKey) as `0x${string}`),
      transport: http(),
      chain: mainnet,
    });

    return new Siwe(url, walletClient, siweOpts);
  }

  verifyToken(token: string, account: string): Result<boolean, string> {
    try {
      const parsedToken = parseJwt<{
        user_id: string;
        exp: number;
      }>(token);
      if (!parsedToken) return Ok(false);
      const utcTimestampNow = Math.floor(Date.now() / 1000) + 120;
      return Ok(
        parsedToken.exp > utcTimestampNow &&
          parsedToken.user_id.toLowerCase() === account.toLowerCase(),
      );
    } catch {
      return Ok(false);
    }
  }

  async getToken(): AsyncResult<string, string> {
    if (!this.walletClient.account?.address) {
      return Err('Wallet client does not have an account');
    }

    const authToken = this.store.getItem(StoreKeys.AUTH_TOKEN);
    if (authToken) {
      const verify = this.verifyToken(
        authToken,
        this.walletClient.account.address,
      );
      if (verify.ok && verify.val) return Ok(authToken);
    }

    const res = await this.signStatement();
    if (res.error) {
      return Err(res.error);
    }

    let token: string;
    try {
      const tokenRes = await this.fetchWithCookies(
        this.url.endpoint('tokens'),
        {
          method: 'POST',
          body: JSON.stringify({
            ...res.val,
          }),
          headers: {
            'Content-Type': 'application/json',
            credentials: 'include',
          },
        },
      );
      const tokenResp: APIResponse<string> = await tokenRes.json();
      if (tokenResp.error || !tokenResp.result)
        return Err(tokenResp.error ?? 'Failed to get token');
      token = tokenResp.result;
    } catch (error) {
      return Err('Failed to get token', error);
    }

    const verify = this.verifyToken(token, this.walletClient.account.address);
    if (!verify.val) {
      throw new Error('Token verification failed');
    }

    this.store.setItem(StoreKeys.AUTH_TOKEN, token);
    return Ok(token);
  }

  private async signStatement(): AsyncResult<
    {
      message: string;
      signature: string;
      nonce: string;
    },
    string
  > {
    if (!this.walletClient.account?.address) {
      return Err('Wallet client does not have a valid account');
    }
    const date = new Date();
    const expirationTime = new Date(date.getTime() + 300 * 1000); //message expires in 5min

    let nonce: string;
    try {
      const res = await this.fetchWithCookies(this.url.endpoint('challenges'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          credentials: 'include',
        },
      });
      const nonceResp: APIResponse<string> = await res.json();
      if (nonceResp.error || !nonceResp.result) {
        return Err('Failed to get nonce');
      }
      nonce = nonceResp.result;
    } catch (error) {
      return Err('Failed to get nonce', error);
    }

    const chainID = await this.walletClient.getChainId();

    const message = createSiweMessage({
      domain: this.domain,
      address: this.walletClient.account.address,
      statement: this.signingStatement,
      nonce,
      uri: 'https://' + this.domain,
      version: '1',
      chainId: chainID,
      notBefore: expirationTime,
    });

    const signature = await this.walletClient.signMessage({
      account: this.walletClient.account,
      message,
    });

    return Ok({
      message,
      signature,
      nonce,
    });
  }

  async getAuthHeaders(): AsyncResult<AuthHeader, string> {
    const token = await this.getToken();
    if (token.error) return Err(token.error);
    return Ok({ Authorization: Authorization(token.val) });
  }
}
