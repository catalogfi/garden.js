import { MarkRequired } from '@gardenfi/utils';
import { OnChainIdentifier } from 'src/lib/identifier';
import { Address } from 'viem';

export type AtomicSwapConfig = {
  secretHash: string;
  /**
   * The number of blocks before the swap expires
   */
  expiryBlocks: number;
  /**
   * Amount in it's lowest denomination
   */
  amount: bigint;
  recipientAddress: OnChainIdentifier;
  refundAddress: OnChainIdentifier;
  initiatorAddress: OnChainIdentifier;

  //EVM specific
  contractAddress?: Address;
  chain?: number;
};

export type EVMSwapConfig = MarkRequired<
  AtomicSwapConfig,
  'chain' | 'contractAddress'
>;

export const EVMHTLCErrors = {
  INVALID_SECRET_HASH: 'invalid secret hash',
  INSUFFICIENT_TOKENS: 'insufficient token balance',
  ORDER_INITIATED: 'your order has been initiated already',
  INVALID_SECRET: 'invalid secret',
  ORDER_NOT_EXPIRED: 'you cannot refund before your transaction expires',
  INSUFFICIENT_FUNDS: (balance: string, required: string) =>
    'you have insufficient funds. You have: ' +
    balance +
    ' ETH, you need: ' +
    required,
};
