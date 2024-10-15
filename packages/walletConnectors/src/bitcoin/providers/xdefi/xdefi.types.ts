import { Network } from '../../bitcoin.types';

type RequestFunction = (
  { method, params }: { method: string; params: any[] },
  callback: (error: any, accounts: any) => void
) => Promise<any>;

export interface XdefiBitcoinProvider {
  request: RequestFunction;
  network: Network;
  changeNetwork: (network: Network) => Promise<string[]>;
  requestAccounts: () => Promise<string[]>;
  getAccounts: () => Promise<string[]>;
  on: (event: string, callback: (data: any) => void) => void;
  off: (event: string, callback: (data: any) => void) => void;
}
