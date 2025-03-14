import { AsyncResult } from '@catalogfi/utils';
import { Asset, IOrderbook, MatchedOrder } from '@gardenfi/orderbook';
import { OrderStatus } from '../status';
import { Environment, EventBroker, SiweOpts } from '@gardenfi/utils';
import { WalletClient } from 'viem';
import { ISecretManager } from '../secretManager/secretManager.types';
import { IQuote } from '../quote/quote.types';
import { IBlockNumberFetcher } from '../blockNumberFetcher/blockNumber';
import { IEVMRelay } from '../evm/relay/evmRelay.types';
import { BitcoinWallet, IBitcoinWallet } from '@catalogfi/wallets';
import { AnchorProvider } from '@coral-xyz/anchor';

export type SwapParams = {
  /**
   * Asset to be sent.
   */
  fromAsset: Asset;
  /**
   * Asset to be received.
   */
  toAsset: Asset;
  /**
   * Amount in lowest denomination of the asset.
   */
  sendAmount: string;
  /**
   * Amount in lowest denomination of the asset.
   */
  receiveAmount: string;
  /**
   * Time lock for the swap.
   */
  timelock?: number;
  /**
   * This will wait for the specified number of confirmations before redeeming the funds.
   */
  minDestinationConfirmations?: number;
  /**
   * Unique nonce for generating secret and secret hashes. If not provided, it will be generated as the total order count until now + 1.
   */
  nonce?: number;
  /**
   * Additional data for the order.
   */
  additionalData: {
    /**
     * Get strategy id from the quote
     */
    strategyId: string;
    /**
     * Provide btcAddress if the destination or source chain is bitcoin. This address is used as refund address if source chain is bitcoin, and as redeem address if destination chain is bitcoin.
     */
    btcAddress?: string;
  };
};

export enum TimeLocks {
  evm = 14400,
  btc = 288,
  sol = 432000,
}

export type OrderWithStatus = MatchedOrder & {
  status: OrderStatus;
};

export type GardenEvents = {
  error: (order: MatchedOrder, error: string) => void;
  success: (order: MatchedOrder, action: OrderActions, result: string) => void;
  onPendingOrdersChanged: (orders: OrderWithStatus[]) => void;
  log: (id: string, message: string) => void;
  rbf: (order: MatchedOrder, result: string) => void;
};

export type EventCallback = (...args: any[]) => void;

/**
 * Interface representing the GardenJS library.
 */
export interface IGardenJS extends EventBroker<GardenEvents> {
  /**
   * Create Order
   * @param {SwapParams} params - The parameters for creating the order.
   * @returns {AsyncResult<MatchedOrder, string>} The result of the swap operation.
   */
  swap(params: SwapParams): AsyncResult<MatchedOrder, string>;

  /**
   * Execute an action.
   * @returns {Promise<() => void>} A promise that resolves to a function to cancel the execution.
   */
  execute(): Promise<() => void>;

  /**
   * The URL of the orderbook.
   * @readonly
   */
  get orderbookUrl(): string;

  /**
   * The EVM relay.
   * @readonly
   */
  get evmRelay(): IEVMRelay;


  /**
   * The current quote.
   * @readonly
   */
  get quote(): IQuote;

  /**
   * The BTC wallet.
   * @readonly
   */
  get btcWallet(): IBitcoinWallet | undefined;

  /**
   * The orderbook.
   * @readonly
   */
  get orderbook(): IOrderbook;

  /**
   * The block number fetcher.
   * @readonly
   */
  get blockNumberFetcher(): IBlockNumberFetcher;

  /**
   * The secret manager.
   * @readonly
   */
  get secretManager(): ISecretManager;
}

export type OrderCacheValue = {
  txHash: string;
  timeStamp: number;
  btcRedeemUTXO?: string;
};

export interface IOrderExecutorCache {
  set(
    order: MatchedOrder,
    action: OrderActions,
    txHash: string,
    utxo?: string,
  ): void;
  get(order: MatchedOrder, action: OrderActions): OrderCacheValue | null;
  remove(order: MatchedOrder, action: OrderActions): void;
}

export type GardenProps = {
  environment: Environment;
  apiKey?: string;
  evmWallet: WalletClient;
  secretManager?: ISecretManager;
  siweOpts?: SiweOpts;
  orderbookURl?: string;
  quote?: string;
  blockNumberFetcher?: IBlockNumberFetcher;
  solanaRelayUrl?: URL;
  solanaRelayerAddress?: string;
  solWallet?: AnchorProvider;
  btcWallet?: BitcoinWallet;
};

/**
 * Actions that can be performed on the order.
 */
export enum OrderActions {
  Idle = 'Idle',
  Initiate = 'Initiate',
  Redeem = 'Redeem',
  Refund = 'Refund',
}
