import { ISecretManager } from './../secretManager/secretManager.types';
import { AsyncResult, Err, Fetcher, Ok, trim0x } from '@catalogfi/utils';
import {
  GardenEvents,
  GardenProps,
  IGardenJS,
  IOrderExecutorCache,
  OrderActions,
  OrderWithStatus,
  SwapParams,
} from './garden.types';
import {
  BlockchainType,
  Chain,
  CreateOrderReqWithStrategyId,
  getBlockchainType,
  getTimeLock,
  IOrderbook,
  isBitcoin,
  isMainnet,
  MatchedOrder,
  Orderbook,
} from '@gardenfi/orderbook';
import {
  APIResponse,
  Environment,
  EventBroker,
  IAuth,
  Siwe,
  sleep,
  Url,
} from '@gardenfi/utils';
import { IQuote } from '../quote/quote.types';
import { getBitcoinNetwork, isValidBitcoinPubKey, toXOnly } from '../utils';
import {
  BitcoinProvider,
  BitcoinWallet,
  IBitcoinWallet,
} from '@catalogfi/wallets';
import {
  isOrderExpired,
  parseActionFromStatus,
  ParseOrderStatus,
} from '../orderStatus/orderStatusParser';
import { GardenHTLC } from '../bitcoin/htlc';
import { Cache, ExecutorCache } from './cache/executorCache';
import BigNumber from 'bignumber.js';
import {
  BlockNumberFetcher,
  IBlockNumberFetcher,
} from '../blockNumberFetcher/blockNumber';
import { OrderStatus } from '../orderStatus/status';
import { API } from '../constants';
import { Quote } from '../quote/quote';
import { SecretManager } from '../secretManager/secretManager';
import { IEVMHTLC } from '../evm/htlc.types';
import { DigestKey } from './digestKey/digestKey';
import { WalletClient } from 'viem';
import { EvmRelay } from '../evm/relay/evmRelay';
import { IStarknetHTLC } from '../starknet/starknetHTLC.types';
import { Account } from 'starknet';
import { StarknetRelay } from '../starknet/relay/starknetRelay';

export class Garden extends EventBroker<GardenEvents> implements IGardenJS {
  private environment: Environment;
  private _secretManager: ISecretManager;
  private _orderbook: IOrderbook;
  private _quote: IQuote;
  private getOrderThreshold = 20;
  private _orderbookUrl: Url;
  private _auth: IAuth;
  private orderExecutorCache: IOrderExecutorCache;
  private _blockNumberFetcher: IBlockNumberFetcher;
  private refundSacpCache = new Map<string, any>();
  private _evmHTLC: IEVMHTLC | undefined;
  private _starknetHTLC: IStarknetHTLC | undefined;
  private _btcWallet: IBitcoinWallet | undefined;
  private bitcoinRedeemCache = new Cache<{
    redeemedFromUTXO: string;
    redeemedAt: number;
    redeemTxHash: string;
  }>();
  private _digestKey: DigestKey;

  constructor(config: GardenProps) {
    super();
    const _digestKey = DigestKey.from(config.digestKey);
    if (_digestKey.error) throw new Error(_digestKey.error);
    this._digestKey = _digestKey.val;

    this.environment = config.environment;
    const api =
      config.environment === Environment.MAINNET
        ? API.mainnet
        : config.environment === Environment.TESTNET
        ? API.testnet
        : API.localnet;
    if (!api)
      throw new Error(
        'API not found, invalid environment ' + config.environment,
      );

    this._orderbookUrl = new Url(config.api ?? api.orderbook);

    this._quote = config.quote ?? new Quote(api.quote);
    this._auth = Siwe.fromDigestKey(
      new Url(config.api ?? api.orderbook),
      this._digestKey.digestKey,
    );
    this._orderbook = new Orderbook(new Url(config.api ?? api.orderbook));
    this._evmHTLC = config.htlc.evm;
    this._starknetHTLC = config.htlc.starknet;
    this._secretManager =
      config.secretManager ??
      SecretManager.fromDigestKey(this._digestKey.digestKey);
    this.orderExecutorCache = new ExecutorCache();
    this._blockNumberFetcher =
      config.blockNumberFetcher ??
      new BlockNumberFetcher(api.info, config.environment);
  }

  static from(config: {
    environment: Environment;
    digestKey: string;
    wallets: {
      evm: WalletClient;
      starknet: Account;
    };
  }) {
    const api =
      config.environment === Environment.MAINNET
        ? API.mainnet
        : config.environment === Environment.TESTNET
        ? API.testnet
        : undefined;
    if (!api)
      throw new Error(
        'API not found, invalid environment ' + config.environment,
      );

    const htlc = {
      evm: new EvmRelay(
        api.evmRelay,
        config.wallets.evm,
        Siwe.fromDigestKey(new Url(api.orderbook), config.digestKey),
      ),
      starknet: new StarknetRelay(api.starknetRelay, config.wallets.starknet),
    };

    return new Garden({
      environment: config.environment,
      digestKey: config.digestKey,
      htlc,
    });
  }

  get orderbookUrl() {
    return this._orderbookUrl.toString();
  }

  get evmHTLC() {
    return this._evmHTLC;
  }

  get starknetHTLC() {
    return this._starknetHTLC;
  }

  get quote() {
    return this._quote;
  }

  get btcWallet() {
    return this._btcWallet;
  }

  get orderbook() {
    return this._orderbook;
  }

  get blockNumberFetcher() {
    return this._blockNumberFetcher;
  }

  get secretManager() {
    return this._secretManager;
  }

  get auth() {
    return this._auth;
  }

  get digestKey() {
    return this._digestKey;
  }

  private async initializeSMandBTCWallet() {
    if (this._secretManager.isInitialized && this._btcWallet)
      return Ok(this._btcWallet);
    const digestKey = await this._secretManager.getDigestKey();
    if (digestKey.error) return Err(digestKey.error);

    const provider = new BitcoinProvider(getBitcoinNetwork(this.environment));
    this._btcWallet = BitcoinWallet.fromPrivateKey(digestKey.val, provider);
    return Ok(this._btcWallet);
  }

  async swap(params: SwapParams): AsyncResult<MatchedOrder, string> {
    const validate = await this.validateAndFillParams(params);
    if (validate.error) return Err(validate.error);

    const { sendAddress, receiveAddress, timelock } = validate.val;

    const nonce = Date.now().toString();
    const secrets = await this._secretManager.generateSecret(nonce);
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
      nonce: nonce,
      timelock: timelock,
      secret_hash: trim0x(secrets.val.secretHash),
      min_destination_confirmations: params.minDestinationConfirmations ?? 0,
      additional_data: additionalData,
    };

    const quoteRes = await this._quote.getAttestedQuote(order);
    if (quoteRes.error) return Err(quoteRes.error);

    const createOrderRes = await this._orderbook.createOrder(
      quoteRes.val,
      this.auth,
    );
    if (createOrderRes.error) return Err(createOrderRes.error);

    const orderRes = await this.pollOrder(createOrderRes.val);
    if (orderRes.error) return Err(orderRes.error);

    return Ok(orderRes.val);
  }

  private async validateAndFillParams(params: SwapParams) {
    if (!params.additionalData.strategyId) return Err('StrategyId is required');

    if (!params.fromAsset || !params.toAsset)
      return Err('Source and destination assets are required for swap');

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

    const inputAmount = this.validateAmount(params.sendAmount);
    if (inputAmount.error) return Err(inputAmount.error);

    const outputAmount = this.validateAmount(params.receiveAmount);
    if (outputAmount.error) return Err(outputAmount.error);

    if (inputAmount < outputAmount)
      return Err('Send amount should be greater than receive amount');

    const timelock = getTimeLock(params.fromAsset.chain);
    if (!timelock) return Err('Unsupported chain for timelock');

    if (isBitcoin(params.fromAsset.chain) || isBitcoin(params.toAsset.chain)) {
      if (!params.additionalData.btcAddress)
        return Err(
          'btcAddress in additionalData is required if source or destination chain is bitcoin, it is used as refund or redeem address.',
        );

      const walletRes = await this.initializeSMandBTCWallet();
      if (walletRes.error) return Err(walletRes.error);

      if (!this._btcWallet)
        return Err(
          'btcWallet is required for bitcoin chain. Please provide btcWallet in the constructor',
        );
    }

    const sendAddress = await this.getAddresses(params.fromAsset.chain);
    if (sendAddress.error) return Err(sendAddress.error);

    const receiveAddress = await this.getAddresses(params.toAsset.chain);
    if (receiveAddress.error) return Err(receiveAddress.error);

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
        if (!this._evmHTLC)
          return Err('Please provide evmHTLC when initializing garden');
        return Ok(this._evmHTLC.htlcActorAddress);
      case BlockchainType.Bitcoin: {
        const pubKey = await this._btcWallet?.getPublicKey();
        if (!pubKey || !isValidBitcoinPubKey(pubKey))
          return Err('Invalid btc public key');
        return Ok(toXOnly(pubKey));
      }
      case BlockchainType.Starknet: {
        if (!this._starknetHTLC)
          return Err('Please provide starknetHTLC when initializing garden');
        return Ok(this._starknetHTLC.htlcActorAddress);
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

  private async pollOrder(createOrderID: string) {
    let orderRes = await this._orderbook.getOrder(createOrderID, true);
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

      orderRes = await this._orderbook.getOrder(createOrderID, true);
    }

    return Err(`Order not found, createOrder id: ${createOrderID}`);
  }

  async execute(interval: number = 5000): Promise<() => void> {
    //initiate SM and bitcoinWallet if not initialized
    await this.initializeSMandBTCWallet();

    return await this._orderbook.subscribeOrders(
      this._digestKey.userId,
      true,
      interval,
      async (pendingOrders) => {
        if (pendingOrders.data.length === 0) return;

        const ordersWithStatus = await this.filterExpiredAndAssignStatus(
          pendingOrders.data,
        );
        if (ordersWithStatus.error) return;

        this.emit('onPendingOrdersChanged', ordersWithStatus.val);

        //initialize swappers and execute orders
        for (let i = 0; i < ordersWithStatus.val.length; i++) {
          const order = ordersWithStatus.val[i];
          const orderAction = parseActionFromStatus(order.status);

          //post refund sacp for bitcoin orders
          if (
            isBitcoin(order.source_swap.chain) &&
            order.status === OrderStatus.InitiateDetected
          ) {
            const wallet = this.btcWallet;
            if (!wallet) {
              this.emit('error', order, 'BTC wallet not found');
              continue;
            }
            await this.postRefundSACP(order, wallet);
          }

          switch (orderAction) {
            case OrderActions.Redeem: {
              const secrets = await this._secretManager.generateSecret(
                order.create_order.nonce,
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
                  const destWallet = this.btcWallet;
                  if (!destWallet) {
                    this.emit('error', order, 'BTC wallet not found');
                    return;
                  }

                  await this.btcRedeem(destWallet, order, secrets.val.secret);
                  break;
                }
                case BlockchainType.Starknet: {
                  await this.starknetRedeem(order, secrets.val.secret);
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
                  const sourceWallet = this.btcWallet;
                  if (!sourceWallet) {
                    this.emit('error', order, 'BTC wallet not found');
                    return;
                  }

                  await this.btcRefund(sourceWallet, order);
                  break;
                }
                case BlockchainType.Starknet: {
                  this.emit(
                    'error',
                    order,
                    'Starknet refund is automatically done by relay service',
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
      true,
      {
        per_page: 500,
      },
    );
  }

  private async evmRedeem(order: MatchedOrder, secret: string): Promise<void> {
    this.emit('log', order.create_order.create_id, 'executing evm redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.create_order.create_id, 'already redeemed');
      return;
    }

    if (!this._evmHTLC) {
      this.emit('error', order, 'EVMHTLC is required');
      return;
    }

    const res = await this._evmHTLC.redeem(order, secret);

    if (res.error) {
      this.emit('error', order, res.error);
      if (res.error.includes('Order already redeemed')) {
        this.orderExecutorCache.set(
          order,
          OrderActions.Redeem,
          order.destination_swap.redeem_tx_hash,
        );
      }
      return;
    }

    this.orderExecutorCache.set(order, OrderActions.Redeem, res.val);
    this.emit('success', order, OrderActions.Redeem, res.val);
  }

  private async starknetRedeem(order: MatchedOrder, secret: string) {
    this.emit('log', order.create_order.create_id, 'executing starknet redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.create_order.create_id, 'already redeemed');
      return;
    }
    if (!this._starknetHTLC) {
      this.emit('error', order, 'StarknetHTLC is required');
      return;
    }

    const res = await this._starknetHTLC.redeem(order, secret);
    if (res.error) {
      this.emit('error', order, res.error);
      if (res.error.includes('Order already redeemed')) {
        this.orderExecutorCache.set(
          order,
          OrderActions.Redeem,
          order.destination_swap.redeem_tx_hash,
        );
      }
      return;
    }
    if (res.val) {
      this.orderExecutorCache.set(order, OrderActions.Redeem, res.val);
      this.emit('success', order, OrderActions.Redeem, res.val);
    }
  }

  private async btcRedeem(
    wallet: IBitcoinWallet,
    order: MatchedOrder,
    secret: string,
  ) {
    const _cache = this.bitcoinRedeemCache.get(order.create_order.create_id);
    const fillerInitTx = order.destination_swap.initiate_tx_hash
      .split(',')
      .at(-1)
      ?.split(':')
      .at(0);
    if (!fillerInitTx) {
      this.emit('error', order, 'Failed to get initiate_tx_hash');
      return;
    }

    let rbf = false;
    if (_cache) {
      if (_cache.redeemedFromUTXO && _cache.redeemedFromUTXO !== fillerInitTx) {
        rbf = true;
        this.emit('log', order.create_order.create_id, 'rbf btc redeem');
      } else if (
        _cache.redeemedAt &&
        Date.now() - _cache.redeemedAt > 1000 * 60 * 15 // 15 minutes
      ) {
        this.emit(
          'log',
          order.create_order.create_id,
          'redeem not confirmed in last 15 minutes',
        );
        rbf = true;
      } else {
        this.emit(
          'log',
          order.create_order.create_id,
          'btcRedeem: already redeemed',
        );
        return;
      }
    } else if (
      //check if redeem tx is valid if cache is not found.
      order.destination_swap.redeem_tx_hash &&
      !Number(order.destination_swap.redeem_block_number)
    ) {
      try {
        const tx = await (
          await wallet.getProvider()
        ).getTransaction(order.destination_swap.redeem_tx_hash);

        let isValidRedeem = false;
        for (const input of tx.vin) {
          if (input.txid === fillerInitTx) {
            isValidRedeem = true;
            break;
          }
        }
        if (isValidRedeem) {
          this.emit(
            'log',
            order.create_order.create_id,
            'already a valid redeem',
          );
          let redeemedAt = 0;
          try {
            const [_redeemedAt] = await (
              await wallet.getProvider()
            ).getTransactionTimes([order.destination_swap.redeem_tx_hash]);
            if (_redeemedAt !== 0) redeemedAt = _redeemedAt;
          } catch {
            // Ignore error - fallback to using current timestamp
            redeemedAt = Date.now();
          }

          this.bitcoinRedeemCache.set(order.create_order.create_id, {
            redeemedFromUTXO: fillerInitTx,
            redeemedAt,
            redeemTxHash: order.destination_swap.redeem_tx_hash,
          });
          return;
        }
        rbf = true;
      } catch (error) {
        if ((error as Error).message.includes('Transaction not found')) {
          rbf = true;
        } else {
          this.emit('error', order, 'Failed to get redeem tx: ' + error);
          return;
        }
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
        rbf ? [fillerInitTx] : [],
      );
      const redeemHex = await bitcoinExecutor.getRedeemHex(
        trim0x(secret),
        order.create_order.additional_data?.bitcoin_optional_recipient,
      );
      const res = await this.broadcastRedeemTx(
        redeemHex,
        order.create_order.create_id,
      );
      if (res.error || !res.val) {
        this.emit('error', order, res.error || 'Failed to broadcast redeem tx');
        return;
      }

      if (rbf) {
        this.emit(
          'log',
          order.create_order.create_id,
          'rbf: btc redeem success',
        );
        this.emit('rbf', order, res.val);
      } else this.emit('success', order, OrderActions.Redeem, res.val);
      this.bitcoinRedeemCache.set(order.create_order.create_id, {
        redeemedFromUTXO: fillerInitTx,
        redeemedAt: Date.now(),
        redeemTxHash: res.val,
      });
    } catch (error) {
      console.log('error', error);
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
      this.orderExecutorCache.set(order, OrderActions.Refund, res);
      this.emit('success', order, OrderActions.Refund, res);
    } catch (error) {
      this.emit('error', order, 'Failed btc refund: ' + error);
    }
  }

  private async postRefundSACP(order: MatchedOrder, wallet: IBitcoinWallet) {
    const cachedOrder = this.refundSacpCache.get(order.create_order.create_id);
    if (cachedOrder?.initTxHash === order.source_swap.initiate_tx_hash) return;

    const bitcoinExecutor = await GardenHTLC.from(
      wallet,
      Number(order.source_swap.amount),
      order.create_order.secret_hash,
      toXOnly(order.source_swap.initiator),
      toXOnly(order.source_swap.redeemer),
      order.source_swap.timelock,
    );
    const userBTCAddress =
      order.create_order.additional_data.bitcoin_optional_recipient;
    if (!userBTCAddress) return;

    try {
      const sacp = await bitcoinExecutor.generateInstantRefundSACP(
        userBTCAddress,
      );
      const url = this._orderbookUrl.endpoint('orders/add-instant-refund-sacp');

      const res = await Fetcher.post<APIResponse<string>>(url, {
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          order_id: order.create_order.create_id,
          instant_refund_tx_bytes: sacp,
        }),
      });
      if (res.status === 'Ok') {
        this.refundSacpCache.set(order.create_order.create_id, {
          initTxHash: order.source_swap.initiate_tx_hash,
        });
      }
    } catch (error) {
      this.emit('error', order, 'Failed to generate and post SACP: ' + error);
      return;
    }
  }

  private async filterExpiredAndAssignStatus(orders: MatchedOrder[]) {
    if (orders.length === 0) return Ok([]);

    const blockNumbers = await this._blockNumberFetcher?.fetchBlockNumbers();
    if (blockNumbers.error) return Err(blockNumbers.error);

    const orderWithStatuses: OrderWithStatus[] = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];

      if (isOrderExpired(order)) {
        continue;
      }

      const sourceChain = order.source_swap.chain;
      const destinationChain = order.destination_swap.chain;

      const sourceChainBlockNumber = blockNumbers?.val[sourceChain];
      const destinationChainBlockNumber = blockNumbers?.val[destinationChain];

      if (!sourceChainBlockNumber || !destinationChainBlockNumber) {
        this.emit('error', order, 'Error while fetching CurrentBlockNumbers');
        continue;
      }

      const status = ParseOrderStatus(
        order,
        sourceChainBlockNumber,
        destinationChainBlockNumber,
      );

      orderWithStatuses.push({
        ...order,
        status,
      });
    }

    return Ok(orderWithStatuses);
  }

  private async broadcastRedeemTx(redeemTx: string, orderId: string) {
    try {
      const url = this._orderbookUrl.endpoint('gasless/order/bitcoin/redeem');
      const authHeaders = await this._auth.getAuthHeaders();
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders.val,
        },
        body: JSON.stringify({
          redeem_tx_bytes: redeemTx,
          order_id: orderId,
        }),
      });

      const resJson: APIResponse<string> = await res.json();

      if (resJson.status === 'Ok' && resJson.result) {
        return Ok(resJson.result);
      }
      return Err(resJson.error);
    } catch (error) {
      return Err('Failed to broadcast redeem tx: ' + error);
    }
  }
}
