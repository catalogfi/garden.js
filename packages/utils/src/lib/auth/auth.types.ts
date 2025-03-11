import { AsyncResult, Result } from '@catalogfi/utils';
import { IStore } from '../store/store.interface';

export type SiweOpts = {
  domain?: string;
  store?: IStore;
  signingStatement?: string;
};

export type AuthHeader = {
  [key: string]: string;
};

export interface ISiwe {
  getToken(): AsyncResult<string, string>;
  verifyToken(token: string, account: string): Result<boolean, string>;
}

export interface IAuth {
  siwe?: ISiwe;
  apiKey?: string;
  getAuthHeaders(): AsyncResult<AuthHeader, string>;
}
