import { IAuth, SiweOpts } from './auth.types';
import { SiweMessage } from 'siwe';
import { AsyncResult, Err, Fetcher, Ok, Result } from '@catalogfi/utils';
import { Url } from '../url';
import { MemoryStorage } from '../store/memoryStorage';
import { IStore, StoreKeys } from '../store/store.interface';
import { APIResponse } from '../apiResponse.types';
import { WalletClient } from 'viem';

export class Siwe implements IAuth {
  private readonly API = 'https://api.garden.finance';
  private readonly url: Url;
  private store: IStore;
  private walletClient: WalletClient;
  private readonly signingStatement: string;
  private readonly domain: string;

  constructor(url: Url, walletClient: WalletClient, opts?: SiweOpts) {
    this.url = new Url('/', url ?? this.API);
    this.walletClient = walletClient;

    this.domain = opts?.domain || 'app.garden.finance';
    if (this.domain.startsWith('https://')) {
      this.domain = this.domain.split('https://')[1];
    }
    this.signingStatement = opts?.signingStatement ?? 'Garden.fi';

    this.store = opts?.store ?? new MemoryStorage();
  }

  verifyToken(token: string, account: string): Result<boolean, string> {
    const parsedToken = parseJwt(token);
    if (!parsedToken) return Ok(false);

    try {
      const utcTimestampNow = Math.floor(Date.now() / 1000) + 120; // auth should be valid for atleast 2 minutes
      return Ok(
        parsedToken.exp > utcTimestampNow &&
          parsedToken.address.toLowerCase() === account.toLowerCase(),
      );
    } catch (error) {
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

    const tokenRes = await Fetcher.post<APIResponse<string>>(
      this.url.endpoint('verify'),
      {
        body: JSON.stringify({
          ...res.val,
        }),
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
    if (tokenRes.error) return Err(tokenRes.error);

    const token = tokenRes.result;
    if (!token) return Err('Failed to get token');

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
    if (!this.walletClient.chain?.id || !this.walletClient.account?.address) {
      return Err('Wallet client does not have a chain');
    }
    const date = new Date();
    const expirationTime = new Date(date.getTime() + 300 * 1000); //message expires in 5min

    const res = await Fetcher.get<APIResponse<string>>(
      this.url.endpoint('nonce'),
    );
    const nonce = res.result;
    if (!nonce) {
      return Err('Failed to get nonce');
    }

    const chainID = this.walletClient.chain?.id;
    const message = new SiweMessage({
      domain: this.domain,
      address: this.walletClient.account.address,
      statement: this.signingStatement,
      nonce,
      uri: 'https://' + this.domain,
      version: '1',
      chainId: chainID,
      expirationTime: expirationTime.toISOString(),
    });
    const preparedMessage = message.prepareMessage();
    const signature = await this.walletClient.signMessage({
      account: this.walletClient.account,
      message: preparedMessage,
    });

    return Ok({
      message: preparedMessage,
      signature,
      nonce,
    });
  }
}

const parseJwt = (token: string) => {
  try {
    if (token.split('.').length < 3) return;
    const jwt = token.split('.')[1];
    if (!jwt) return;
    //TODO: check this again
    return JSON.parse(Buffer.from(jwt, 'base64').toString('latin1'));
  } catch {
    return;
  }
};
