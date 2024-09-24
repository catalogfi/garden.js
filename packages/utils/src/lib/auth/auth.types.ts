import { AsyncResult, Result } from '@catalogfi/utils';
import { IStore } from '../store/store.interface';

export type SiweOpts = {
  domain?: string;
  store?: IStore;
  signingStatement?: string;
};

export interface IAuth {
  /**
   * Get a token from store if available or fetch from the wallet
   * @returns verified token
   */
  getToken(): AsyncResult<string, string>;
  /**
   * Verify the token expiry and account
   * @param token The token to verify
   * @param account The account to verify the token against
   */
  verifyToken(token: string, account: string): Result<boolean, string>;
}
