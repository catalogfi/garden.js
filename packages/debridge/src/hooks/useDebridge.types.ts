import { AsyncResult } from '@catalogfi/utils';
import { IStore } from '@gardenfi/utils';
import { Debridge } from 'src/debridge';
import { DeBridgeTransaction } from 'src/debridge.api.types';
import { SwapConfig, SwapResponse } from 'src/debridge.types';

export type DebridgeContextType = {
  debridge: Debridge;
  store: IStore;
  swap: (swapConfig: SwapConfig) => AsyncResult<SwapResponse, string>;
  txs: Record<string, DeBridgeTransaction[]>;
};

export type DebridgeProviderProps = {
  children: React.ReactNode;
  address: `0x${string}`;
  store: IStore;
};
