import { Address } from 'viem';
import { OnChainIdentifier } from '../identifier';

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
