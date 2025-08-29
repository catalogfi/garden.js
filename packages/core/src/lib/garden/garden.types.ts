import {
  AffiliateFee,
  Asset,
  ChainAsset,
  IOrderbook,
  Order,
} from '@gardenfi/orderbook';
import { OrderStatus } from '../orderStatus/status';
import {
  ApiKey,
  AsyncResult,
  Environment,
  EventBroker,
  IAuth,
} from '@gardenfi/utils';
import { ISecretManager } from '../secretManager/secretManager.types';
import { IQuote } from '../quote/quote.types';
import { IBlockNumberFetcher } from '../blockNumberFetcher/blockNumber';

import { IEVMHTLC } from '../evm/htlc.types';
import { IStarknetHTLC } from '../starknet/starknetHTLC.types';
import { DigestKey } from '@gardenfi/utils';
import { AccountInterface } from 'starknet';
import { WalletClient } from 'viem';
import { IBitcoinWallet } from '../bitcoin/wallet/wallet.interface';
import { ISolanaHTLC } from '../solana/htlc/ISolanaHTLC';
import { AnchorProvider } from '@coral-xyz/anchor';
import { Api } from '../constants';
import { ISuiHTLC } from '../sui/suiHTLC.types';
import { WalletWithRequiredFeatures } from '@mysten/wallet-standard';
import { IBitcoinHTLC } from '../bitcoin/bitcoinhtlc.types';

export type SwapParams = {
  /**
   * Asset to be sent.
   */
  // fromAsset: ChainAsset;
  fromAsset: Asset | ChainAsset;
  /**
   * Asset to be received.
   */
  // toAsset: ChainAsset;
  toAsset: Asset | ChainAsset;
  /**
   * Amount in lowest denomination of the sendAsset.
   */
  sendAmount: string;
  /**
   * Amount in lowest denomination of the toAsset.
   */
  receiveAmount: string;
  /**
   * Slippage for the order.
   */
  slippage?: number;
  /**
   * Additional data for the order.
   */
  additionalData: {
    /**
     * Provide btcAddress if the destination or source chain is bitcoin. This address is used as refund address if source chain is bitcoin, and as redeem address if destination chain is bitcoin.
     */
    btcAddress?: string;
  };
  /**
   * Integrator fee for the order.
   */
  affiliateFee?: AffiliateFee[];
};

export type OrderWithStatus = Order & {
  status: OrderStatus;
};

export type GardenEvents = {
  error: (order: Order, error: string) => void;
  success: (order: Order, action: OrderActions, result: string) => void;
  onPendingOrdersChanged: (orders: OrderWithStatus[]) => void;
  log: (id: string, message: string) => void;
  rbf: (order: Order, result: string) => void;
};

export type EventCallback = (...args: any[]) => void;

/**
 * Interface representing the GardenJS library.
 */
export interface IGardenJS extends EventBroker<GardenEvents> {
  /**
   * Create Order
   * @param {SwapParams} params - The parameters for creating the order.
   * @returns {AsyncResult<Order, string>} The result of the swap operation.
   */
  swap(params: SwapParams): AsyncResult<Order, string>;

  /**
   * Execute an action.
   * @returns {Promise<() => void>} A promise that resolves to a function to cancel the execution.
   */
  execute(): Promise<() => void>;

  /**
   * The EVM relay.
   * @readonly
   */
  get evmHTLC(): IEVMHTLC | undefined;

  /**
   * The Starknet relay.
   * @readonly
   */
  get starknetHTLC(): IStarknetHTLC | undefined;

  /**
   * The Solana relay.
   * @readonly
   */
  get solanaHTLC(): ISolanaHTLC | undefined;

  /**
   * The Sui relay.
   * @readonly
   */
  get suiHTLC(): ISuiHTLC | undefined;

  /**
   * The current quote.
   * @readonly
   */
  get quote(): IQuote;

  /**
   * The BTC wallet.
   * @readonly
   */
  get btcHTLC(): IBitcoinHTLC | undefined;

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

  /**
   * The auth.
   * @readonly
   */
  get auth(): IAuth;

  /**
   * The digest key.
   * @readonly
   */
  get digestKey(): DigestKey;
}

export type OrderCacheValue = {
  txHash: string;
  timeStamp: number;
  btcRedeemUTXO?: string;
};

export interface IOrderExecutorCache {
  set(order: Order, action: OrderActions, txHash: string, utxo?: string): void;
  get(order: Order, action: OrderActions): OrderCacheValue | null;
  remove(order: Order, action: OrderActions): void;
}

export type ApiConfig =
  | Environment
  | (Partial<Api> & { environment: Environment });

export type GardenCoreConfig = {
  environment: ApiConfig;
  digestKey: string | DigestKey;
  apiKey?: string | ApiKey;
  secretManager?: ISecretManager;
  auth?: IAuth;
  orderbook?: IOrderbook;
  quote?: IQuote;
  blockNumberFetcher?: IBlockNumberFetcher;
  solanaProgramAddress?: {
    native?: string;
    spl?: string;
  };
};

export type GardenHTLCModules = {
  htlc: {
    evm?: IEVMHTLC;
    starknet?: IStarknetHTLC;
    solana?: ISolanaHTLC;
    sui?: ISuiHTLC;
    bitcoin?: IBitcoinHTLC;
  };
};

export type GardenWalletModules = {
  wallets: {
    evm?: WalletClient;
    starknet?: AccountInterface;
    solana?: AnchorProvider;
    sui?: WalletWithRequiredFeatures;
    bitcoin?: IBitcoinWallet;
  };
};

export type GardenConfigWithWallets = GardenCoreConfig & GardenWalletModules;
export type GardenConfigWithHTLCs = GardenCoreConfig & GardenHTLCModules;

/**
 * Actions that can be performed on the order.
 */
export enum OrderActions {
  Idle = 'Idle',
  Initiate = 'Initiate',
  Redeem = 'Redeem',
  Refund = 'Refund',
}
