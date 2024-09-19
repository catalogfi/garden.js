import { AsyncResult, Result } from '@catalogfi/utils';
import { IStore } from '../store/store.interface';

export type SiweOpts = {
  domain?: string;
  store?: IStore;
  signingStatement?: string;
};

export interface IAuth {
  getToken(): AsyncResult<string, string>;
  verifyToken(token: string, account: string): Result<boolean, string>;
}
