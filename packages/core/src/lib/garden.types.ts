import { Asset, Chain, EvmChain, Order, Orders } from '@gardenfi/orderbook';
import { IBitcoinWallet, IEVMWallet } from '@catalogfi/wallets';
import { ISwapper } from './swapper';

export interface IGardenJS {
  /**
   *
   * Creates an order
   *
   * @method
   * @param {Asset} from - The asset you want to swap from
   * @param {Asset} to - The asset you want to swap to
   * @param {number} amt - The amount you want to swap in it's lowest denomination
   * @param {number} receiveAmount - The amount you want to receive in it's lowest denomination
   * @param {Object} [opts] - Additional options for creating an order
   * @param {string} [opts.btcUserAddress] - If specified, BTC will be sent to this address
   * @returns {Promise<number>} The order ID
   */
  swap(
    from: Asset,
    to: Asset,
    amt: number,
    receiveAmount: number,
    opts?: {
      btcUserAddress?: string;
    }
  ): Promise<number>;

  /**
   * Calculates the amount you receive. Currently deducts 0.3% of the amount you send.
   */
  calculateReceiveAmt(from: Asset, to: Asset, sendAmt: number): Promise<number>;
  /**
   * Subscribes to order updates
   *
   * @method
   * @param {string} address - The address to subscribe to, currently each GardenJS instance can only connect to a single address
   * @param {(orders: Orders) => void} callback - The callback to call when the orders are updated. The first response are all the orders created by a given address
   *
   * @returns {void}
   */
  subscribeOrders(address: string, callback: (orders: Orders) => void): void;
  /**
   * Unsubscribes from order updates
   *
   * @method
   * @returns {void}
   */
  unsubscribeOrders(): void;
  /**
   * Gets the swapper for an order, which allows you to progess (init, redeem, refund) the swap
   *
   * @param {Order} order - The order to get the swapper for
   * @returns {ISwapper} The swapper
   */
  getSwap(order: Order): ISwapper;
}

export type Wallets<T extends Chain = Chain> = {
  [K in T]: K extends EvmChain ? IEVMWallet : IBitcoinWallet;
};
