import { IHTLCWallet } from '../../htlc.interface';
import { AtomicSwapConfig } from '../ASConfig';

export enum WalletChain {
  Bitcoin,
  EVM,
}

export interface IBaseWallet {
  chain(): WalletChain;
  getAddress(): Promise<string>;
  sign(hexMsg: string): Promise<string>;
  newSwap(swapConfig: AtomicSwapConfig): Promise<IHTLCWallet>;
}
