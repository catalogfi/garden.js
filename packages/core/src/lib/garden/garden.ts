import { ISecretManager } from './../secretManager/secretManager.types';
import { AsyncResult, Err, Ok, Result, Void, trim0x } from '@catalogfi/utils';
import { IGardenJS, SwapParams, TimeLocks } from './garden.types';
import {
  CreateOrderReqWithStrategyId,
  IOrderbook,
  isBitcoin,
  isEVM,
  MatchedOrder,
} from '@gardenfi/orderbook';
import { IStore, sleep, Url } from '@gardenfi/utils';
import { IOrderExecutor } from '../orderExecutor/orderExecutor.types';
import { OrderExecutor } from '../orderExecutor/orderExecutor';
import { IQuote } from '../quote/quote.types';
import { Quote } from '../quote/quote';
import { isValidBitcoinPubKey } from '../utils';

export class Garden implements IGardenJS {
  private secretManager: ISecretManager;
  private orderBook: IOrderbook;
  private relayURL: Url;
  private quote: IQuote;
  private opts;
  private getOrderThreshold = 20;

  constructor(
    orderbook: IOrderbook,
    secretManager: ISecretManager,
    relayUrl: string,
    quoteUrl: string,
    opts?: {
      store?: IStore;
      domain?: string;
    },
  ) {
    this.orderBook = orderbook;
    this.relayURL = new Url(relayUrl);
    this.quote = new Quote(quoteUrl);
    this.secretManager = secretManager;
    this.opts = opts;
  }

  async swap(params: SwapParams): AsyncResult<MatchedOrder, string> {
    const validate = this.validateSwapParams(params);
    if (validate.error) return Err(validate.error);

    const evmAddress = isEVM(params.fromAsset.chain)
      ? params.sendAddress
      : params.receiveAddress;

    const nonceRes = await this.orderBook.getOrdersCount(evmAddress);
    if (nonceRes.error) return Err(nonceRes.error);
    const nonce = nonceRes.val + 1;

    const secrets = this.secretManager.generateSecret(nonce);
    if (secrets.error) return Err(secrets.error);

    const timelock = isBitcoin(params.fromAsset.chain)
      ? TimeLocks.btc
      : isEVM(params.fromAsset.chain)
      ? TimeLocks.evm
      : undefined;
    if (!timelock) return Err('Unsupported chain');

    const additionalData = params.additionalData.btcAddress
      ? {
          strategy_id: params.additionalData.strategyId,
          btcAddress: params.additionalData.btcAddress,
        }
      : {
          strategy_id: params.additionalData.strategyId,
        };

    const order: CreateOrderReqWithStrategyId = {
      source_chain: params.fromAsset.chain,
      destination_chain: params.toAsset.chain,
      source_asset: params.fromAsset.atomicSwapAddress,
      destination_asset: params.toAsset.atomicSwapAddress,
      initiator_source_address: params.sendAddress,
      initiator_destination_address: params.receiveAddress,
      source_amount: params.sendAmount,
      destination_amount: params.receiveAmount,
      fee: '1',
      nonce: nonce.toString(),
      timelock: timelock,
      secret_hash: trim0x(secrets.val.secretHash),
      min_destination_confirmations: params.minDestinationConfirmations ?? 0,
      additional_data: additionalData,
    };

    const quoteRes = await this.quote.getAttestedQuote(order);
    if (quoteRes.error) return Err(quoteRes.error);

    const createOrderRes = await this.orderBook.createOrder(quoteRes.val);
    if (createOrderRes.error) return Err(createOrderRes.error);

    //poll for order
    let orderRes = await this.orderBook.getOrder(createOrderRes.val, true);
    for (let i = 0; i < this.getOrderThreshold; i++) {
      await sleep(1000);

      orderRes = await this.orderBook.getOrder(createOrderRes.val, true);
      if (orderRes.error) {
        if (!orderRes.error.includes('result is undefined'))
          return Err(orderRes.error);
      } else if (
        orderRes.val &&
        orderRes.val.create_order.create_id.toLowerCase() ===
          createOrderRes.val.toLowerCase()
      )
        break;
    }
    if (!orderRes.val)
      return Err('Order not found, createOrder id: ', createOrderRes.val);

    return Ok(orderRes.val);
  }

  async subscribeOrders(
    cb: (executor: IOrderExecutor) => Promise<void>,
    interval: number = 5000,
  ): Promise<() => void> {
    return await this.orderBook.subscribeToOrders(
      true,
      interval,
      async (order) => {
        for (let i = 0; i < order.data.length; i++) {
          const orderExecutor = new OrderExecutor(
            order.data[i],
            this.relayURL.toString(),
            this.secretManager,
            this.opts,
          );
          await cb(orderExecutor);
        }
      },
      true,
    );
  }

  private validateSwapParams(params: SwapParams): Result<undefined, string> {
    const pubKey = isBitcoin(params.fromAsset.chain)
      ? params.sendAddress
      : isBitcoin(params.toAsset.chain)
      ? params.receiveAddress
      : undefined;

    if (pubKey && !isValidBitcoinPubKey(pubKey))
      return Err('Invalid bitcoin public key ', pubKey);

    if (
      (isBitcoin(params.fromAsset.chain) || isBitcoin(params.toAsset.chain)) &&
      !params.additionalData.btcAddress
    )
      return Err('btcAddress in additionalData is required for bitcoin chain');

    const inputAmount = BigInt(params.sendAmount);
    const outputAmount = BigInt(params.receiveAmount);

    if (
      params.sendAmount == null ||
      inputAmount <= 0n ||
      params.sendAmount.includes('.')
    )
      return Err('Invalid send amount ', params.sendAmount);

    if (
      params.receiveAmount == null ||
      outputAmount <= 0n ||
      params.receiveAmount.includes('.')
    )
      return Err('Invalid receive amount ', params.receiveAmount);

    if (inputAmount < outputAmount)
      return Err('Send amount should be greater than receive amount');

    return Ok(Void);
  }
}
