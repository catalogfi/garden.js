import { AsyncResult } from '@catalogfi/utils';
import { InferType } from 'yup';
import {
  DeBridgePointsSchema,
  GetDebridgeTxsResponseSchema,
} from './debridge.schema';

export interface IDebridge {
  createTx(createTxConfig: CreateTxConfig): AsyncResult<string, string>;
  getTxs(
    getTxsConfig: GetTxsConfig
  ): AsyncResult<GetDebridgeTxsResponse, string>;
  getTx(txHash: string): AsyncResult<GetDebridgeTxsResponse, string>;
  getPoints(address: string): AsyncResult<DebridgePoints, string>;
}

export type GetTxsConfig = {
  chainIdsFrom: string[];
  chainIdsTo: string[];
  address: string;
};

export type CreateTxConfig = {
  srcChainId: number;
  srcChainTokenIn: string;
  srcTokenDecimals: number;
  sellAmount: string;
  isExactOut: boolean;
  dstChainId: number;
  dstChainTokenOut: string;
  dstChainTokenOutRecipient: string;
  senderAddress: string;
};

export type GetDebridgeTxsResponse = InferType<
  typeof GetDebridgeTxsResponseSchema
>;
export type DebridgePoints = InferType<typeof DeBridgePointsSchema>;
