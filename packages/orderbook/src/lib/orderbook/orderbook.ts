import { WalletClient } from 'viem';
import {
  AsyncResult,
  Fetcher,
  trim0x,
  Ok,
  Err,
  Result,
  Void,
} from '@catalogfi/utils';
import {
  CreateOrder,
  CreateOrderConfig,
  CreateOrderRequest,
  CreateOrderResponse,
  IOrderbook,
  MatchedOrder,
  OrderbookConfig,
  PaginatedData,
  PaginationConfig,
} from './orderbook.types';
import { OrderbookErrors } from '../errors';
import { MAINNET_ORDERBOOK_API } from '../api';
import {
  Authorization,
  IAuth,
  MemoryStorage,
  Siwe,
  Url,
} from '@gardenfi/utils';
import { OrdersProvider } from '../orders/ordersProvider';
import { isBitcoin } from '../asset';

/**
 * A class that allows you to create and manage orders with the orderbook url.
 * @class
 * @extends {OrdersProvider}
 * @implements {IOrderbook}
 */
export class Orderbook extends OrdersProvider implements IOrderbook {
  private Url: Url;
  private auth: IAuth;
  private walletClient: WalletClient;

  /**
   * Creates an instance of Orderbook. Does not login to the orderbook.
   * @constructor
   * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
   */
  constructor(orderbookConfig: OrderbookConfig) {
    const url = new Url(
      '/relayer',
      orderbookConfig.url ?? MAINNET_ORDERBOOK_API,
    );
    super(url);

    this.Url = url;
    this.walletClient = orderbookConfig.walletClient;

    this.auth = new Siwe(this.Url, orderbookConfig.walletClient, {
      ...orderbookConfig.opts,
      store: orderbookConfig.opts?.store || new MemoryStorage(),
    });
  }

  /**
   * Initializes the orderbook as well as logs in the orderbook (fetches the auth token).
   * @param {OrderbookConfig} orderbookConfig - The configuration object for the orderbook.
   */
  static async init(orderbookConfig: OrderbookConfig) {
    const auth = new Siwe(
      new Url('/relayer', orderbookConfig.url ?? MAINNET_ORDERBOOK_API),
      orderbookConfig.walletClient,
      orderbookConfig.opts,
    );
    await auth.getToken();

    return new Orderbook(orderbookConfig);
  }

  /**
   * Creates an order
   * @param {CreateOrderConfig} createOrderConfig - The configuration for the creating the order.
   * @returns {string} The create order ID.
   */
  async createOrder(
    createOrderConfig: CreateOrderConfig,
  ): AsyncResult<string, string> {
    const {
      sendAmount,
      secretHash,
      receiveAmount,
      fromAsset,
      toAsset,
      receiveAddress,
      sendAddress,
      minDestinationConfirmations = 0,
      timelock,
      btcInputAddress,
    } = createOrderConfig;

    const checks = this.validateConfig(createOrderConfig);
    if (checks.error) return Err(checks.error);

    const auth = await this.auth.getToken();
    if (auth.error) return Err(auth.error);

    const additional_data = {
      additional_data: { bitcoin_optional_recipient: btcInputAddress ?? '' },
    };

    const createOrder: CreateOrderRequest = {
      nonce: createOrderConfig.nonce,
      source_amount: sendAmount,
      destination_amount: receiveAmount,
      source_asset: fromAsset.atomicSwapAddress,
      destination_asset: toAsset.atomicSwapAddress,
      secret_hash: trim0x(secretHash),
      source_chain: fromAsset.chain,
      destination_chain: toAsset.chain,
      initiator_source_address: sendAddress,
      initiator_destination_address: receiveAddress,
      min_destination_confirmations: minDestinationConfirmations,
      timelock,
      ...additional_data,
      fee: '1',
    };

    try {
      const res = await Fetcher.post<CreateOrderResponse>(
        this.Url.endpoint('create-order'),
        {
          body: JSON.stringify(createOrder),
          headers: {
            Authorization: Authorization(auth.val),
            'Content-Type': 'application/json',
          },
        },
      );

      if (res.error) return Err(res.error);
      return res.result
        ? Ok(res.result)
        : Err('CreateOrder: Unexpected error, result is undefined');
    } catch (error) {
      return Err('CreateOrder:', String(error));
    }
  }

  async fetchOrders<T extends boolean>(
    matched: T,
    pending: boolean = false,
    paginationConfig?: PaginationConfig,
  ): AsyncResult<
    PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    string
  > {
    const address = this.walletClient.account?.address;
    if (!address) return Err('Wallet client does not have an account');

    if (matched)
      return (await super.getMatchedOrders(
        address,
        pending,
        paginationConfig,
      )) as Result<
        PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
        string
      >;

    return (await super.getUnMatchedOrders(
      address,
      paginationConfig,
    )) as Result<
      PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
      string
    >;
  }

  /**
   * Wrapper for the subscribeOrders method in the OrdersProvider class to abstract the address parameter.
   * @param matched - Whether to get matched or unmatched orders
   * @param interval - The interval to poll for updates
   * @param cb - The callback to be called when the orders are updated
   * @param paginationConfig - The configuration for the pagination
   * @returns {() => void} A function to unsubscribe from the order updates
   */
  async subscribeToOrders<T extends boolean>(
    matched: T,
    interval: number,
    cb: (
      orders: PaginatedData<T extends true ? MatchedOrder : CreateOrder>,
    ) => void,
    pending?: boolean,
    paginationConfig?: PaginationConfig,
  ): Promise<() => void> {
    const address = this.walletClient.account?.address;
    if (!address) return () => {};

    return super.subscribeOrders(
      address,
      matched,
      interval,
      cb,
      pending,
      paginationConfig,
    );
  }

  async getUserOrdersCount(): AsyncResult<number, string> {
    const address = this.walletClient.account?.address;
    if (!address) return Err('Wallet client does not have an account');

    return super.getOrdersCount(address);
  }

  private validateConfig(config: CreateOrderConfig): Result<undefined, string> {
    const { sendAmount, receiveAmount, toAsset, fromAsset } = config;
    if (
      toAsset.atomicSwapAddress.toLowerCase() ===
        fromAsset.atomicSwapAddress.toLowerCase() &&
      toAsset.chain === fromAsset.chain
    )
      return Err(OrderbookErrors.SAME_ASSET);

    if (!isBitcoin(toAsset.chain) && !toAsset.atomicSwapAddress)
      return Err(OrderbookErrors.INVALID_AS_ADDRESS);

    if (!isBitcoin(fromAsset.chain) && !fromAsset.atomicSwapAddress)
      return Err(OrderbookErrors.INVALID_AS_ADDRESS);

    if (!toAsset.tokenAddress || !fromAsset.tokenAddress)
      return Err(OrderbookErrors.INVALID_TOKEN);

    const inputAmount = BigInt(sendAmount);
    const outputAmount = BigInt(receiveAmount);

    if (sendAmount == null || inputAmount <= 0n || sendAmount.includes('.'))
      return Err(OrderbookErrors.INVALID_SEND_AMOUNT);

    if (
      receiveAmount == null ||
      outputAmount <= 0n ||
      receiveAmount.includes('.')
    )
      return Err(OrderbookErrors.INVALID_RECEIVE_AMOUNT);

    if (inputAmount < outputAmount)
      return Err(OrderbookErrors.RECEIVE_AMOUNT_GREATER);

    return Ok(Void);
  }
}
