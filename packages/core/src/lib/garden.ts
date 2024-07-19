import { Orders, Order, Asset, Chain } from '@gardenfi/orderbook';
import type { IOrderbook } from '@gardenfi/orderbook';
import { sha256 } from 'ethers';
import { ISwapper, Swapper } from './swapper';
import { computeSecret, isFromChainBitcoin } from './utils';
import { IGardenJS, Wallets } from './garden.types';
import { GardenErrors } from './errors';
import { with0x } from '@catalogfi/utils';
import { Connector, isCatalogWalletInstalled } from '@catalogfi/extension';
import { catalogWalletActions } from './catalogActions';
import { AbstractBitcoinWallet, IBaseWallet } from '@catalogfi/wallets';

/**
 * GardenJS is the core component of the Garden SDK. It allows you to create orders,
 * subscribe to order updates, and perform initiates, redeems, and refunds on swaps.
 *
 * Visit the [GardenJS documentation](https://docs.garden.finance/developers/sdk/) for more information.
 */
export class GardenJS implements IGardenJS {
  private readonly orderbook: IOrderbook;
  private readonly wallets: Partial<Wallets>;

  /**
   * @constructor
   *
   * @param {IOrderbook} orderbook - The orderbook you want to connect to
   * @param {Partial<Wallets>} wallets - Each field in the wallet corresponds to the chain name and it's corresponding value is the wallet
   *
   */
  constructor(orderbook: IOrderbook, wallets: Partial<Wallets>) {
    this.orderbook = orderbook;
    this.wallets = wallets;
  }

  subscribeOrders(address: string, callback: (orders: Orders) => void): void {
    this.orderbook.subscribeOrders(address, callback);
  }

  unsubscribeOrders(): void {
    return this.orderbook.unsubscribeOrders();
  }
  /**
   * Creates a swap order in the orderbook backend. Checkout `Assets` from @gardenfi/orderbook for the available assets
   * @param from from asset (e.g. Assets.ethereum.WBTC)
   * @param to to asset (e.g. Assets.bitcoin.BTC)
   * @param amt send amount
   * @param receiveAmount receive amount
   * @param opts if the swap destination is bitcoin, you can provide a btcInputAddress to redeem funds to.
   * @returns order id
   *
   * Note: localnet assets require `merry` running, else it will throw an error saying unsupported asset.
   */
  async swap(
    from: Asset,
    to: Asset,
    amt: number,
    receiveAmount: number,
    opts?: { btcUserAddress?: string }
  ): Promise<number> {
    if (isCatalogWalletInstalled()) {
      const id = await new Connector().send(
        catalogWalletActions.createOrderAndSwap,
        {
          from,
          to,
          amt,
          receiveAmount,
          opts,
        }
      );
      return Number(id);
    }

    const fromWallet = this.wallets[from.chain];
    const toWallet = this.wallets[to.chain];

    if (!fromWallet) {
      throw new Error(GardenErrors.WALLET_NOT_FOUND(true));
    }
    if (!toWallet) {
      throw new Error(GardenErrors.WALLET_NOT_FOUND(false));
    }

    validateChain(from.chain, to.chain);

    if ((opts && !opts.btcUserAddress) || !opts) {
      opts = opts || {};

      const bitcoinWallet = this.getBitcoinWallet();

      if (!bitcoinWallet || !(bitcoinWallet instanceof AbstractBitcoinWallet)) {
        throw new Error(GardenErrors.CHAIN_WALLET_NOT_FOUND('Bitcoin'));
      }

      opts.btcUserAddress = await bitcoinWallet.getAddress();
    }

    const fromBitcoin = isFromChainBitcoin(from.chain);
    const evmWallet = fromBitcoin ? toWallet : fromWallet;
    const bitcoinWallet = fromBitcoin ? fromWallet : toWallet;

    const address = await evmWallet.getAddress();
    const orders = await this.orderbook.getOrders(address);

    const sendAddress = fromBitcoin
      ? await bitcoinWallet.getAddress()
      : await evmWallet.getAddress();
    const receiveAddress = fromBitcoin
      ? await evmWallet.getAddress()
      : await bitcoinWallet.getAddress();

    const secret = await computeSecret(
      from.chain,
      to.chain,
      this.wallets,
      orders.length + 1
    );

    return await this.orderbook.createOrder({
      fromAsset: from,
      toAsset: to,
      sendAmount: amt.toString(),
      receiveAmount: receiveAmount.toString(),
      receiveAddress,
      sendAddress,
      secretHash: sha256(with0x(secret)),
      btcInputAddress:
        opts.btcUserAddress ?? (await bitcoinWallet.getAddress()),
    });
  }

  /**
   * Given an order, returns a Swapper instance to progress the swap (init, redeem, refund)
   */
  getSwap(order: Order): ISwapper {
    return new Swapper(order, this.wallets);
  }

  /**
   * Calculates the receive amount for the given send amount. The send amount should be in it's lowest denomination
   */
  calculateReceiveAmt(
    from: Asset,
    to: Asset,
    sendAmt: number
  ): Promise<number> {
    return Promise.resolve(Math.floor(sendAmt - sendAmt * 0.003));
  }

  private getBitcoinWallet(): IBaseWallet | null {
    for (const chain in this.wallets) {
      if (isFromChainBitcoin(chain as Chain)) {
        return this.wallets[chain as Chain] as IBaseWallet;
      }
    }
    return null;
  }
}

const validateChain = (from: Chain, to: Chain) => {
  if (isFromChainBitcoin(from) === isFromChainBitcoin(to))
    throw new Error(
      isFromChainBitcoin(from)
        ? GardenErrors.CHAIN_WALLET_NOT_FOUND('Bitcoin')
        : GardenErrors.CHAIN_WALLET_NOT_FOUND('EVM')
    );
};
