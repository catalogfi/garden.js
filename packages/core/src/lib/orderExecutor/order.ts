import { WalletClient } from 'viem';
import { executeParams, IOrder, OrderActions } from './order.types';
import { IBitcoinWallet } from '@catalogfi/wallets';
import { isBitcoin, MatchedOrder } from '@gardenfi/orderbook';
import { IStore } from '@gardenfi/utils';
import { parseAction } from './orderStatusParser';
import { fetchBitcoinBlockNumber, fetchEVMBlockNumber } from './blockNumber';
import { AsyncResult, Err, Ok, Void } from '@catalogfi/utils';
import { EvmRelay } from '../evmRelay/evmRelay';
import { GardenHTLC } from '../bitcoin/htlc';
import { toXOnly } from '../utils';
import { ISecretManager } from '../secretManager/secretManager.types';

//orderBook will return orderExecutorInstance
export class Order implements IOrder {
  private order: MatchedOrder;
  private relayURL: string;
  private secretManager: ISecretManager;
  private opts;

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
  }

  getOrder(): MatchedOrder {
    return this.order;
  }

  async init(
    walletClient: WalletClient,
    currentBlockNumber: number,
  ): AsyncResult<string, string> {
    if (isBitcoin(this.order.source_swap.chain))
      return Ok('Bitcoin initiation is not automated');

    const evmRelayer = new EvmRelay(this.relayURL, walletClient, this.opts);
    return await evmRelayer.init(this.order, currentBlockNumber);
  }

  async redeem(
    wallet: WalletClient | IBitcoinWallet,
    secret: string,
  ): AsyncResult<string, string> {
    if (isBitcoin(this.order.destination_swap.chain)) {
      try {
        const bitcoinExecutor = await GardenHTLC.from(
          wallet as IBitcoinWallet,
          Number(this.order.destination_swap.amount),
          this.order.create_order.secret_hash,
          toXOnly(this.order.source_swap.initiator),
          toXOnly(this.order.source_swap.redeemer),
          this.order.destination_swap.timelock,
        );
        const res = await bitcoinExecutor.redeem(secret);
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
    return await evmRelay.redeem(this.order.create_order.create_id, secret);
  }

  async refund() {
    if (!isBitcoin(this.order.source_swap.chain)) {
      return Ok('EVM refund is automatically done by relayer service');
    }
    return Err('Not implemented');
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
        return await this.refund();

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
