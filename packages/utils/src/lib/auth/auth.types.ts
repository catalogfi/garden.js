import { IStore } from '../store/store.interface';

export type SiweOpts = {
  domain?: string;
  store?: IStore;
};

export interface IAuth {
  getToken(): Promise<string>;
  verifyToken(token: string, account: string): boolean;
}
