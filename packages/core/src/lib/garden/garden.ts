import { ISecretManager } from './../secretManager/secretManager.types';
import { AsyncResult, Err } from '@catalogfi/utils';
import { IGardenJS, SwapParams, TimeLocks } from './garden.types';
import { IOrderbook, isBitcoin, isEVM } from '@gardenfi/orderbook';
import { IStore, Url } from '@gardenfi/utils';
import { IOrderExecutor } from '../orderExecutor/orderExecutor.types';
import { OrderExecutor } from '../orderExecutor/orderExecutor';

export class Garden implements IGardenJS {
  private secretManager: ISecretManager;
  private orderBook: IOrderbook;
  private relayURL: Url;
  private opts;

  constructor(
    orderbook: IOrderbook,
    relayUrl: string,
    secretManager: ISecretManager,
    opts?: {
      store?: IStore;
      domain?: string;
    },
  ) {
    this.orderBook = orderbook;
    this.relayURL = new Url(relayUrl);
    this.secretManager = secretManager;
    this.opts = opts;
  }

  async swap(params: SwapParams): AsyncResult<string, string> {
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

    const res = await this.orderBook.createOrder({
      fromAsset: params.fromAsset,
      toAsset: params.toAsset,
      sendAddress: params.sendAddress,
      receiveAddress: params.receiveAddress,
      sendAmount: params.sendAmount,
      receiveAmount: params.receiveAmount,
      secretHash: secrets.val.secretHash,
      timelock: timelock,
      nonce: nonce.toString(),
      btcInputAddress: params.additionalData?.btcAddress,
      minDestinationConfirmations: params.minDestinationConfirmations,
    });

    if (res.error) return Err(res.error);

    return res;
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
}
