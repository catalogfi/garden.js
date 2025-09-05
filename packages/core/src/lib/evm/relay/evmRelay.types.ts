import { Order } from '@gardenfi/orderbook';
import { AsyncResult, IStore } from '@gardenfi/utils';
import { WalletClient } from 'viem';

export type EVMRelayOpts = {
  store?: IStore;
  domain?: string;
};

export interface IEVMRelay {
  /**
   * Deposits funds to the EVM atomic swap contract using relay service.
   * Sends the signature to the relay service.
   * @param order Matched Order
   * @param currentL1BlockNumber Current L1 block number. Used to calculate the swap expiry.
   * @NOTE send the current block number of the L1 chain, if the order is on L2 chain (arbitrum).
   * @returns txHash of Initiation
   */
  init(walletClient: WalletClient, order: Order): AsyncResult<string, string>;

  /**
   * Redeems funds from the EVM atomic swap contract using relay service.
   * Sends the secret to the relay service.
   * @param orderId Create order Id of the order
   * @param secret Secret of the HTLC generated when creating the order
   */
  redeem(orderId: string, secret: string): AsyncResult<string, string>;
}
