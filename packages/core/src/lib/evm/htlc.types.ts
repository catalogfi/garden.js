import { MatchedOrder } from '@gardenfi/orderbook';
import { AsyncResult } from '@gardenfi/utils';

export interface IEVMHTLC {
  /**
   * Returns the HTLC actor address.
   * This is the user's wallet address in the case of EVM.
   */
  get htlcActorAddress(): string;

  /**
   * Initiates the HTLC by sending funds to the HTLC contract.
   * @param order - The matched order.
   * @returns A promise resolving to the transaction hash of the initiation.
   */
  initiate(order: MatchedOrder): AsyncResult<string, string>;

  /**
   * Redeems funds from the HTLC contract to the actor's address.
   * @param order - The matched order.
   * @param secret - The secret required to unlock the htlc.
   * @returns A promise resolving to the transaction hash of the redemption.
   */
  redeem(order: MatchedOrder, secret: string): AsyncResult<string, string>;

  /**
   * Refunds funds from the HTLC contract back to the actor's address upon expiration.
   * @param order - The matched order.
   * @returns A promise resolving to the transaction hash of the refund.
   */
  refund(order: MatchedOrder): AsyncResult<string, string>;
}
