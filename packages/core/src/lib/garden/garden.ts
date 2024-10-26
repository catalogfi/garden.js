import { ISecretManager } from './../secretManager/secretManager.types';
import { AsyncResult, Err, Ok, trim0x } from '@catalogfi/utils';
import {
  GardenEvents,
  IGardenJS,
  IOrderExecutorCache,
  OrderActions,
  SwapParams,
  TimeLocks,
} from './garden.types';
import {
  BlockchainType,
  Chain,
  CreateOrderReqWithStrategyId,
  getBlockchainType,
  IOrderbook,
  isBitcoin,
  isMainnet,
  MatchedOrder,
  Orderbook,
} from '@gardenfi/orderbook';
import {
  fetchBitcoinBlockNumber,
  fetchEVMBlockNumber,
  IAuth,
  sleep,
} from '@gardenfi/utils';
import { IQuote } from '../quote/quote.types';
import { isValidBitcoinPubKey, toXOnly } from '../utils';
import { WalletClient } from 'viem';
import { IBitcoinWallet } from '@catalogfi/wallets';
import { parseAction } from './orderStatusParser';
import { EvmRelay } from '../evm/relay/evmRelay';
import { GardenHTLC } from '../bitcoin/htlc';
import { ExecutorCache } from './cache/executorCache';
import BigNumber from 'bignumber.js';
import {
  BlockNumberFetcher,
  IBlockNumberFetcher,
  Network,
} from './blockNumber';

export class Garden implements IGardenJS {
  private secretManager: ISecretManager;
  private readonly eventListeners: Map<
    keyof GardenEvents,
    Array<GardenEvents[keyof GardenEvents]>
  > = new Map();
  private orderBook: IOrderbook;
  private quote: IQuote;
  private getOrderThreshold = 20;
  private pendingOrdersCount = 0;
  private orderbookUrl: string;
  private auth: IAuth;
  //TODO: do not use relay if set to false
  private useRelay = true;
  private wallets: {
    evmWallet: WalletClient;
    btcWallet?: IBitcoinWallet;
  };
  private evmAddress: string;
  private orderExecutorCache: IOrderExecutorCache;
  private blockNumberFetcher: IBlockNumberFetcher | undefined;

  constructor(config: {
    orderbookURl: string;
    secretManager: ISecretManager;
    quote: IQuote;
    auth: IAuth;
    wallets: {
      evmWallet: WalletClient;
      btcWallet?: IBitcoinWallet;
    };
    blockNumberFetcher?: {
      url: string;
      network: Network;
    };
  }) {
    this.orderBook = new Orderbook({
      url: config.orderbookURl,
      walletClient: config.wallets.evmWallet,
      auth: config.auth,
    });
    this.quote = config.quote;
    this.secretManager = config.secretManager;
    this.wallets = config.wallets;
    this.orderbookUrl = config.orderbookURl;
    this.auth = config.auth;
    this.orderExecutorCache = new ExecutorCache();

    if (!config.wallets.evmWallet.account)
      throw new Error('Account not found in evmWallet');
    this.evmAddress = config.wallets.evmWallet.account.address;
    this.blockNumberFetcher =
      config.blockNumberFetcher &&
      new BlockNumberFetcher(
        config.blockNumberFetcher.url,
        config.blockNumberFetcher.network,
      );
  }

  getPendingOrderCount(): number {
    return this.pendingOrdersCount;
  }

  setUseRelay(useRelay: boolean): void {
    this.useRelay = useRelay;
  }

  async swap(params: SwapParams): AsyncResult<MatchedOrder, string> {
    const validate = await this.validateAndFillParams(params);
    if (validate.error) return Err(validate.error);

    const { sendAddress, receiveAddress, timelock } = validate.val;

    const nonceRes = await this.orderBook.getOrdersCount(this.evmAddress);
    if (nonceRes.error) return Err(nonceRes.error);
    const nonce = nonceRes.val + 1;

    const secrets = this.secretManager.generateSecret(nonce);
    if (secrets.error) return Err(secrets.error);

    const { strategyId, btcAddress } = params.additionalData;
    const additionalData = {
      strategy_id: strategyId,
      ...(btcAddress && {
        bitcoin_optional_recipient: btcAddress,
      }),
    };

    const order: CreateOrderReqWithStrategyId = {
      source_chain: params.fromAsset.chain,
      destination_chain: params.toAsset.chain,
      source_asset: params.fromAsset.atomicSwapAddress,
      destination_asset: params.toAsset.atomicSwapAddress,
      initiator_source_address: sendAddress,
      initiator_destination_address: receiveAddress,
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

    const orderRes = await this.pollOrder(createOrderRes.val);
    if (orderRes.error) return Err(orderRes.error);

    return Ok(orderRes.val);
  }

  private async validateAndFillParams(params: SwapParams) {
    if (
      params.fromAsset.chain === params.toAsset.chain &&
      params.fromAsset.atomicSwapAddress === params.toAsset.atomicSwapAddress
    )
      return Err('Source and destination assets cannot be the same');

    if (
      (isMainnet(params.fromAsset.chain) && !isMainnet(params.toAsset.chain)) ||
      (!isMainnet(params.fromAsset.chain) && isMainnet(params.toAsset.chain))
    )
      return Err(
        'Both assets should be on the same network (either mainnet or testnet)',
      );

    if (isBitcoin(params.fromAsset.chain) || isBitcoin(params.toAsset.chain)) {
      if (!this.wallets.btcWallet)
        return Err(
          'btcWallet is required for bitcoin chain. Please provide btcWallet in the constructor',
        );
      if (!params.additionalData.btcAddress)
        return Err(
          'btcAddress in additionalData is required for bitcoin chain',
        );
    }

    const sendAddress = await this.getAddresses(params.fromAsset.chain);
    if (sendAddress.error) return Err(sendAddress.error);

    const receiveAddress = await this.getAddresses(params.toAsset.chain);
    if (receiveAddress.error) return Err(receiveAddress.error);

    const inputAmount = this.validateAmount(params.sendAmount);
    if (inputAmount.error) return Err(inputAmount.error);

    const outputAmount = this.validateAmount(params.receiveAmount);
    if (outputAmount.error) return Err(outputAmount.error);

    if (inputAmount < outputAmount)
      return Err('Send amount should be greater than receive amount');

    const timelock = this.getTimelock(params.fromAsset.chain);
    if (!timelock) return Err('Unsupported chain for timelock');

    return Ok({
      sendAddress: sendAddress.val,
      receiveAddress: receiveAddress.val,
      timelock: params.timelock ?? timelock,
    });
  }

  private async getAddresses(chain: Chain) {
    const blockChianType = getBlockchainType(chain);
    switch (blockChianType) {
      case BlockchainType.EVM:
        if (!this.wallets.evmWallet.account) return Err('EVM Wallet not found');
        return Ok(this.wallets.evmWallet.account.address);
      case BlockchainType.Bitcoin: {
        const pubKey = await this.wallets.btcWallet?.getPublicKey();
        if (!pubKey || !isValidBitcoinPubKey(pubKey))
          return Err('Invalid btc public key');
        return Ok(toXOnly(pubKey));
      }
      default:
        return Err('Unsupported chain');
    }
  }

  private validateAmount(amount: string) {
    if (amount == null || amount.includes('.'))
      return Err('Invalid amount ', amount);
    const amountBigInt = new BigNumber(amount);
    if (
      !amountBigInt.isInteger() ||
      amountBigInt.isNaN() ||
      amountBigInt.lt(0) ||
      amountBigInt.isLessThanOrEqualTo(0)
    )
      return Err('Invalid amount ', amount);
    return Ok(amountBigInt);
  }

  private getTimelock(chain: Chain) {
    const blockChainType = getBlockchainType(chain);
    switch (blockChainType) {
      case BlockchainType.EVM:
        return TimeLocks.evm;
      case BlockchainType.Bitcoin:
        return TimeLocks.btc;
      default:
        return undefined;
    }
  }

  private async pollOrder(createOrderID: string) {
    let orderRes = await this.orderBook.getOrder(createOrderID, true);
    let attempts = 0;

    while (attempts < this.getOrderThreshold) {
      await sleep(1000);
      attempts++;

      if (orderRes.error) {
        if (!orderRes.error.includes('result is undefined')) {
          return Err(orderRes.error);
        }
      } else if (
        orderRes.val &&
        orderRes.val.create_order.create_id.toLowerCase() ===
          createOrderID.toLowerCase()
      ) {
        return Ok(orderRes.val);
      }

      orderRes = await this.orderBook.getOrder(createOrderID, true);
    }

    return Err(`Order not found, createOrder id: ${createOrderID}`);
  }

  private emit<E extends keyof GardenEvents>(
    event: E,
    ...args: Parameters<GardenEvents[E]>
  ): void {
    const listeners = this.eventListeners.get(event) ?? [];
    listeners.forEach((cb) => {
      (cb as (...args: Parameters<GardenEvents[E]>) => void)(...args);
    });
  }

  async execute(interval: number = 5000): Promise<() => void> {
    return await this.orderBook.subscribeToOrders(
      true,
      interval,
      async (pendingOrders) => {
        this.pendingOrdersCount = pendingOrders.data.length;
        this.emit('onPendingOrdersChanged', pendingOrders.data);

        const blockNumbers = await this.blockNumberFetcher?.fetchBlockNumbers();

        //initialize swappers and execute
        for (let i = 0; i < pendingOrders.data.length; i++) {
          const order = pendingOrders.data[i];
          const sourceChain = order.source_swap.chain;
          const destinationChain = order.destination_swap.chain;

          const sourceWallet = this.getWallet(sourceChain);
          const destWallet = this.getWallet(destinationChain);
          if (
            sourceWallet.error ||
            destWallet.error ||
            !sourceWallet.val ||
            !destWallet.val
          ) {
            this.emit(
              'error',
              order,
              'Source or Destination Wallet not found while executing order',
            );
            return;
          }

          let sourceChainBlockNumber = blockNumbers?.val[sourceChain];
          let destinationChainBlockNumber = blockNumbers?.val[destinationChain];

          if (!sourceChainBlockNumber || !destinationChainBlockNumber) {
            const _blockNumbers = await this.fetchCurrentBlockNumbers(order, {
              source: sourceWallet.val,
              destination: destWallet.val,
            });
            if (_blockNumbers.error) {
              this.emit(
                'error',
                order,
                'Error while fetching CurrentBlockNumbers: ' +
                  _blockNumbers.error,
              );
              return;
            }

            sourceChainBlockNumber = _blockNumbers.val.source;
            destinationChainBlockNumber = _blockNumbers.val.destination;
          }

          const orderAction = parseAction(
            order,
            sourceChainBlockNumber,
            destinationChainBlockNumber,
          );

          switch (orderAction) {
            case OrderActions.Redeem: {
              const secrets = this.secretManager.generateSecret(
                Number(order.create_order.nonce),
              );
              if (secrets.error) {
                this.emit('error', order, secrets.error);
                return;
              }

              switch (getBlockchainType(order.destination_swap.chain)) {
                case BlockchainType.EVM: {
                  await this.evmRedeem(order, secrets.val.secret);
                  break;
                }
                case BlockchainType.Bitcoin: {
                  await this.btcRedeem(
                    destWallet.val as IBitcoinWallet,
                    order,
                    secrets.val.secret,
                  );
                  break;
                }
                default:
                  this.emit(
                    'error',
                    order,
                    'Unsupported chain: ' + order.destination_swap.chain,
                  );
              }
              break;
            }
            case OrderActions.Refund: {
              switch (getBlockchainType(order.source_swap.chain)) {
                case BlockchainType.EVM: {
                  this.emit(
                    'error',
                    order,
                    'EVM refund is automatically done by relay service',
                  );
                  break;
                }
                case BlockchainType.Bitcoin: {
                  await this.btcRefund(
                    sourceWallet.val as IBitcoinWallet,
                    order,
                  );
                  break;
                }
                default:
                  this.emit(
                    'error',
                    order,
                    'Unsupported chain: ' + order.source_swap.chain,
                  );
              }
              break;
            }
          }
        }
        return;
      },
      {
        per_page: 500,
      },
      true,
    );
  }

  private async evmRedeem(order: MatchedOrder, secret: string) {
    this.emit('log', order.create_order.create_id, 'executing evm redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.create_order.create_id, 'already redeemed');
      return;
    }
    const evmRelay = new EvmRelay(order, this.orderbookUrl, this.auth);
    const res = await evmRelay.redeem(order.create_order.create_id, secret);
    if (res.error) {
      this.emit('error', order, res.error);
      return;
    }

    this.emit('success', order, OrderActions.Redeem, res.val);
    this.orderExecutorCache.set(order, OrderActions.Redeem, res.val);
  }

  private async btcRedeem(
    wallet: IBitcoinWallet,
    order: MatchedOrder,
    secret: string,
  ) {
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    let rbf = false;
    if (cache) {
      if (
        cache.btcRedeemUTXO &&
        cache.btcRedeemUTXO !== order.destination_swap.initiate_tx_hash
      ) {
        rbf = true;
        this.emit('log', order.create_order.create_id, 'rbf btc redeem');
      } else {
        this.emit(
          'log',
          order.create_order.create_id,
          'btcRedeem: already redeemed',
        );
        return;
      }
    }

    this.emit('log', order.create_order.create_id, 'executing btc redeem');
    try {
      const bitcoinExecutor = await GardenHTLC.from(
        wallet as IBitcoinWallet,
        Number(order.destination_swap.amount),
        order.create_order.secret_hash,
        toXOnly(order.destination_swap.initiator),
        toXOnly(order.destination_swap.redeemer),
        order.destination_swap.timelock,
        rbf ? [order.destination_swap.initiate_tx_hash] : [],
      );
      const res = await bitcoinExecutor.redeem(
        trim0x(secret),
        order.create_order.additional_data?.bitcoin_optional_recipient,
      );

      this.emit('success', order, OrderActions.Redeem, res);
      this.orderExecutorCache.set(
        order,
        OrderActions.Redeem,
        res,
        order.destination_swap.initiate_tx_hash,
      );
    } catch (error) {
      this.emit('error', order, 'Failed btc redeem: ' + error);
    }
  }

  private async btcRefund(wallet: IBitcoinWallet, order: MatchedOrder) {
    if (this.orderExecutorCache.get(order, OrderActions.Refund)) {
      return;
    }

    this.emit('log', order.create_order.create_id, 'executing btc refund');

    try {
      const bitcoinExecutor = await GardenHTLC.from(
        wallet as IBitcoinWallet,
        Number(order.source_swap.amount),
        order.create_order.secret_hash,
        toXOnly(order.source_swap.initiator),
        toXOnly(order.source_swap.redeemer),
        order.source_swap.timelock,
      );
      const res = await bitcoinExecutor.refund(
        order.create_order.additional_data?.bitcoin_optional_recipient,
      );
      this.emit('success', order, OrderActions.Refund, res);
      this.orderExecutorCache.set(order, OrderActions.Refund, res);
    } catch (error) {
      this.emit('error', order, 'Failed btc refund: ' + error);
    }
  }

  private getWallet(chain: Chain) {
    const blockChainType = getBlockchainType(chain);
    switch (blockChainType) {
      case BlockchainType.EVM:
        return Ok(this.wallets.evmWallet);
      case BlockchainType.Bitcoin:
        return Ok(this.wallets.btcWallet);
      default:
        return Err('Unsupported chain for wallet');
    }
  }

  on<E extends keyof GardenEvents>(event: E, cb: GardenEvents[E]): void {
    const listeners = this.eventListeners.get(event) ?? [];
    listeners.push(cb);
    this.eventListeners.set(event, listeners);
  }

  off<E extends keyof GardenEvents>(event: E, cb: GardenEvents[E]): void {
    const listeners = this.eventListeners.get(event) ?? [];
    const index = listeners.indexOf(cb);
    if (index !== -1) {
      listeners.splice(index, 1);
    }
  }

  private async fetchCurrentBlockNumbers(
    order: MatchedOrder,
    wallets: {
      source: WalletClient | IBitcoinWallet;
      destination: WalletClient | IBitcoinWallet;
    },
  ) {
    if (!wallets || !wallets.source || !wallets.destination)
      return Err('Provide wallets to fetch the current block number');

    const sourceBlockNumber = isBitcoin(order.source_swap.chain)
      ? await fetchBitcoinBlockNumber(
          await (wallets.source as IBitcoinWallet).getProvider(),
        )
      : await fetchEVMBlockNumber(wallets.source as WalletClient);
    if (sourceBlockNumber.error) return Err(sourceBlockNumber.error);

    const destinationBlockNumber = isBitcoin(order.destination_swap.chain)
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
