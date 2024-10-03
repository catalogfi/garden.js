import { WalletClient } from 'viem';
import {
  executeParams,
  IOrder,
  IOrderCache,
  OrderActions,
  OrderCacheAction,
} from './order.types';
import { IBitcoinWallet } from '@catalogfi/wallets';
import { isBitcoin, MatchedOrder } from '@gardenfi/orderbook';
import { IStore, MemoryStorage } from '@gardenfi/utils';
import { parseAction } from './orderStatusParser';
import { fetchBitcoinBlockNumber, fetchEVMBlockNumber } from './blockNumber';
import { AsyncResult, Err, Ok, trim0x, Void } from '@catalogfi/utils';
import { EvmRelay } from '../evmRelay/evmRelay';
import { GardenHTLC } from '../bitcoin/htlc';
import { toXOnly } from '../utils';
import { ISecretManager } from '../secretManager/secretManager.types';
import { OrderCache } from './orderCache';

//orderBook will return orderExecutorInstance
export class Order implements IOrder {
  private order: MatchedOrder;
  private relayURL: string;
  private secretManager: ISecretManager;
  private opts;
  private orderCache: IOrderCache;

  constructor(
    order: MatchedOrder,
    relayURL: string,
    secretManager: ISecretManager,
    opts?: {
      store?: IStore;
      domain?: string;
    },
  ) {
    this.order = order;
    this.relayURL = relayURL;
    this.secretManager = secretManager;
    this.opts = opts;
    this.orderCache = new OrderCache(order, opts?.store || new MemoryStorage());
  }

  getOrder(): MatchedOrder {
    return this.order;
  }

  async init(
    walletClient: WalletClient,
    currentBlockNumber: number,
  ): AsyncResult<string, string> {
    const initHash = this.orderCache.get(OrderCacheAction.init);
    if (initHash) return Ok(initHash.txHash);
    if (isBitcoin(this.order.source_swap.chain))
      return Ok('Bitcoin initiation is not automated');

    const evmRelayer = new EvmRelay(this.relayURL, walletClient, this.opts);
    const res = await evmRelayer.init(this.order, currentBlockNumber);
    if (!res.error && res.val) {
      this.orderCache.set(OrderCacheAction.init, res.val);
    }
    return res;
  }

  async redeem(
    wallet: WalletClient | IBitcoinWallet,
    secret: string,
  ): AsyncResult<string, string> {
    const redeemHash = this.orderCache.get(OrderCacheAction.redeem);
    if (redeemHash) return Ok(redeemHash.txHash);
    if (isBitcoin(this.order.destination_swap.chain)) {
      try {
        const bitcoinExecutor = await GardenHTLC.from(
          wallet as IBitcoinWallet,
          Number(this.order.destination_swap.amount),
          this.order.create_order.secret_hash,
          toXOnly(this.order.destination_swap.initiator),
          toXOnly(this.order.destination_swap.redeemer),
          this.order.destination_swap.timelock,
        );
        const res = await bitcoinExecutor.redeem(
          trim0x(secret),
          this.order.create_order.additional_data?.bitcoin_optional_recipient,
        );
        this.orderCache.set(OrderCacheAction.redeem, res);
        return Ok(res);
      } catch (error) {
        return Err('Failed btc redeem: ' + error);
      }
    }

    const evmRelay = new EvmRelay(
      this.relayURL,
      wallet as WalletClient,
      this.opts,
    );
    const res = await evmRelay.redeem(
      this.order.create_order.create_id,
      secret,
    );

    if (!res.error && res.val)
      this.orderCache.set(OrderCacheAction.redeem, res.val);
    return res;
  }

  async refund(wallet: IBitcoinWallet): AsyncResult<string, string> {
    const refundHash = this.orderCache.get(OrderCacheAction.refund);
    if (refundHash) return Ok(refundHash.txHash);
    if (!isBitcoin(this.order.source_swap.chain)) {
      return Ok('EVM refund is automatically done by relayer service');
    }

    try {
      const bitcoinExecutor = await GardenHTLC.from(
        wallet,
        Number(this.order.source_swap.amount),
        this.order.create_order.secret_hash,
        toXOnly(this.order.source_swap.initiator),
        toXOnly(this.order.source_swap.redeemer),
        this.order.source_swap.timelock,
      );
      const res = await bitcoinExecutor.refund(
        this.order.create_order.additional_data?.bitcoin_optional_recipient,
      );
      this.orderCache.set(OrderCacheAction.refund, res);
      return Ok(res);
    } catch (error) {
      return Err('Failed btc refund: ' + error);
    }
  }

  async execute(params: executeParams) {
    const { wallets } = params;

    // fetch the current block number of the source and destination chains if not provided
    let { blockNumbers } = params;
    if (!blockNumbers) {
      const currentBlockNumber = await this.fetchCurrentBlockNumber(wallets);
      if (currentBlockNumber.error) {
        return Err(currentBlockNumber.error);
      }
      blockNumbers = currentBlockNumber.val;
    }

    // parse the action needed to be performed on the order
    const action = parseAction(
      this.order,
      blockNumbers.source,
      blockNumbers.destination,
    );

    switch (action) {
      case OrderActions.Initiate:
        if (isBitcoin(this.order.source_swap.chain))
          return Ok('Bitcoin initiation is not automated');

        return await this.init(
          wallets.source as WalletClient,
          blockNumbers.source,
        );

      case OrderActions.Redeem: {
        const secret = this.secretManager.generateSecret(
          Number(this.order.create_order.nonce),
        );
        if (secret.error) return Err(secret.error);

        return await this.redeem(wallets.destination, secret.val.secret);
      }
      case OrderActions.Refund:
        if (!isBitcoin(this.order.source_swap.chain))
          return Ok('EVM refund is automatically done by relayer service');
        return await this.refund(wallets.source as IBitcoinWallet);

      default:
        return Ok(Void);
    }
  }
  private async fetchCurrentBlockNumber(wallets: executeParams['wallets']) {
    const sourceBlockNumber = isBitcoin(this.order.source_swap.chain)
      ? await fetchBitcoinBlockNumber(
          await (wallets.source as IBitcoinWallet).getProvider(),
        )
      : await fetchEVMBlockNumber(wallets.source as WalletClient);
    if (sourceBlockNumber.error) return Err(sourceBlockNumber.error);

    const destinationBlockNumber = isBitcoin(this.order.destination_swap.chain)
      ? await fetchBitcoinBlockNumber(
          await (wallets.destination as IBitcoinWallet).getProvider(),
        )
      : await fetchEVMBlockNumber(wallets.destination as WalletClient);
    if (destinationBlockNumber.error) return Err(destinationBlockNumber.error);

    return Ok({
      source: sourceBlockNumber.val,
      destination: destinationBlockNumber.val,
    });
  }
}
