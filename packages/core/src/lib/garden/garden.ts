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
  isEVM,
  isMainnet,
  MatchedOrder,
  Orderbook,
} from '@gardenfi/orderbook';
import {
  APIResponse,
  Environment,
  EventBroker,
  fetchBitcoinBlockNumber,
  fetchEVMBlockNumber,
  IAuth,
  Siwe,
  sleep,
  Url,
} from '@gardenfi/utils';
import { IQuote } from '../quote/quote.types';
import { getBitcoinNetwork, isValidBitcoinPubKey, toXOnly } from '../utils';
import { WalletClient } from 'viem';
import {
  BitcoinProvider,
  BitcoinWallet,
  IBitcoinWallet,
} from '@catalogfi/wallets';
import {
  isOrderExpired,
  parseActionFromStatus,
  ParseOrderStatus,
} from '../orderStatusParser';
import { EvmRelay } from '../evm/relay/evmRelay';
import { GardenHTLC } from '../bitcoin/htlc';
import { Cache, ExecutorCache } from './cache/executorCache';
import BigNumber from 'bignumber.js';
import {
  BlockNumberFetcher,
  IBlockNumberFetcher,
} from '../blockNumberFetcher/blockNumber';
import { OrderStatus } from '../status';
import { API } from '../constants';
import { Quote } from '../quote/quote';
import { SecretManager } from '../secretManager/secretManager';
import { IEVMRelay } from '../evm/relay/evmRelay.types';
import { Auth } from '@gardenfi/utils';

import { AnchorProvider } from '@coral-xyz/anchor';
import { SolanaRelay } from '../solana/solanaRelay';
import { SwapConfig } from '../solana/solanaTypes';
import { SolanaHTLC } from '../solana/solanaHTLC';

export class Garden extends EventBroker<GardenEvents> implements IGardenJS {
  private environment: Environment;
  private _secretManager: ISecretManager;
  private _orderBook: IOrderbook;
  private _quote: IQuote;
  private getOrderThreshold = 20;
  private _orderbookUrl: Url;
  private _auth: IAuth;
  private orderExecutorCache: IOrderExecutorCache;
  private _blockNumberFetcher: IBlockNumberFetcher;
  private refundSacpCache = new Map<string, any>();
  private _evmRelay: IEVMRelay;
  private _evmWallet: WalletClient;
  private _btcWallet: IBitcoinWallet | undefined;
  private _solWallet: AnchorProvider | undefined;
  private bitcoinRedeemCache = new Cache<{
    redeemedFromUTXO: string;
    redeemedAt: number;
    redeemTxHash: string;
  }>();
  private solanaRelayUrl?: URL;
  private solanaRelayerAddress?: string;

  constructor(config: GardenProps) {
    super();
    this.environment = config.environment;
    const api =
      config.environment === Environment.MAINNET
        ? API.mainnet
        : config.environment === Environment.TESTNET
          ? API.testnet
          : config.environment === Environment.LOCALNET
            ? API.testnet : undefined;
    if (!api)
      throw new Error(
        'API not found, invalid environment ' + config.environment,
      );
    this._quote = new Quote(config.quote ?? api.quote);
    this._orderbookUrl = new Url(config.orderbookURl ?? api.orderbook);
    this._auth = new Auth({
      siwe: config.apiKey
        ? undefined
        : new Siwe(
          new Url(config.orderbookURl ?? api.orderbook),
          config.evmWallet,
          config.siweOpts,
        ),
      apiKey: config.apiKey,
    });
    this._orderBook = new Orderbook({
      url: config.orderbookURl ?? api.orderbook,
      walletClient: config.evmWallet,
      auth: this._auth,
      solanaClient: config?.solWallet,
    });
    this._evmRelay = new EvmRelay(this._orderbookUrl, this._auth);
    this._secretManager =
      config.secretManager ?? SecretManager.fromWalletClient(config.evmWallet);
    this.orderExecutorCache = new ExecutorCache();
    this._evmWallet = config.evmWallet;
    if (!config.evmWallet.account)
      throw new Error('Account not found in evmWallet');
    this._blockNumberFetcher =
      config.blockNumberFetcher ??
      new BlockNumberFetcher(api.info, config.environment);

    this._solWallet = config?.solWallet;
    this.solanaRelayUrl = config?.solanaRelayUrl;
    this.solanaRelayerAddress = config?.solanaRelayerAddress;
    this._btcWallet = config?.btcWallet
  }

  get orderbookUrl() {
    return this._orderbookUrl.toString();
  }

  get evmRelay() {
    return this._evmRelay;
  }

  get quote() {
    return this._quote;
  }

  get btcWallet() {
    return this._btcWallet;
  }

  get orderbook() {
    return this._orderBook;
  }

  get blockNumberFetcher() {
    return this._blockNumberFetcher;
  }

  get secretManager() {
    return this._secretManager;
  }



  private async initializeSMandBTCWallet() {

    // If we already have a wallet, return it regardless of secret manager state
    if (this._btcWallet) {
      return Ok(this._btcWallet);
    }

    // Only try to create a new wallet if we don't have one yet
    if (!this._secretManager.isInitialized) {
      return Err("Secret manager is not initialized");
    }

    const digestKey = await this._secretManager.getDigestKey();
    if (digestKey.error) return Err(digestKey.error);

    try {
      const bitcoinNetwork = getBitcoinNetwork(this.environment);
      const provider = new BitcoinProvider(bitcoinNetwork);
      this._btcWallet = BitcoinWallet.fromPrivateKey(digestKey.val, provider);
      return Ok(this._btcWallet);
    } catch (error) {
      return Err("Failed to initialize Bitcoin wallet: " + error);
    }
  }

  /**
   * This method takes in the `SwapParams` and returns a placed order
   * It internally calls `getAttestedQuote`, `createOrder` and `pollOrder`
   * @param swapParams  
   * @returns 
   */
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

    const createOrderRes = await this._orderBook.createOrder(quoteRes.val);
    if (createOrderRes.error) return Err(createOrderRes.error);

    const orderRes = await this.pollOrder(createOrderRes.val);
    if (orderRes.error) return Err(orderRes.error);

    // Check if the order result is okay and if source chain is Solana, call solInit
    if (orderRes.val && getBlockchainType(orderRes.val.source_swap.chain) === BlockchainType.Solana) {
      const secrets = await this._secretManager.generateSecret(orderRes.val.create_order.nonce);
      if (secrets.error) return Err(secrets.error);

      const solInitResult = await this.solInit(orderRes.val);
      if (solInitResult.error) return Err(solInitResult.error);
    }

    return Ok(orderRes.val);
  }

  private async validateAndFillParams(params: SwapParams) {
    if (!params.additionalData.strategyId) return Err('StrategyId is required');

    if (!params.fromAsset || !params.toAsset) {
      return Err('Source and destination assets are required for swap');
    }

    if (
      params.fromAsset.chain === params.toAsset.chain &&
      params.fromAsset.atomicSwapAddress === params.toAsset.atomicSwapAddress
    )
      return Err('Source and destination assets cannot be the same');

    if (
      (isMainnet(params.fromAsset.chain) && !isMainnet(params.toAsset.chain)) ||
      (!isMainnet(params.fromAsset.chain) && isMainnet(params.toAsset.chain))
    ) {
      return Err(
        'Both assets should be on the same network (either mainnet or testnet)',
      );
    }

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
        if (!this._evmWallet.account) return Err('EVM Wallet not found');
        return Ok(this._evmWallet.account.address);
      case BlockchainType.Bitcoin: {
        const pubKey = await this._btcWallet?.getPublicKey();
        if (!pubKey || !isValidBitcoinPubKey(pubKey))
          return Err('Invalid btc public key');
        return Ok(toXOnly(pubKey));
      }
      case BlockchainType.Solana: {
        const pubKey = this._solWallet?.publicKey;
        if (!pubKey)
          return Err("Missing solana wallet");
        return Ok(pubKey.toBase58());
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
    let orderRes = await this._orderBook.getOrder(createOrderID, true);
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

      orderRes = await this._orderBook.getOrder(createOrderID, true);
    }

    return Err(`Order not found, createOrder id: ${createOrderID}`);
  }

  async execute(interval: number = 5000): Promise<() => void> {
    //initiate SM and bitcoinWallet if not initialized
    await this.initializeSMandBTCWallet();

    return await this._orderBook.subscribeToOrders(
      interval,
      async (pendingOrders) => {
        if (pendingOrders.data.length === 0) return;

        const ordersWithStatus = await this.filterExpiredAndAssignStatus(
          pendingOrders.data,
        );

        if (ordersWithStatus.error) return;

        //initialize swappers and execute orders
        for (let i = 0; i < ordersWithStatus.val.length; i++) {
          const order = ordersWithStatus.val[i];
          const orderAction = parseActionFromStatus(order.status);

          //post refund sacp for bitcoin orders
          if (
            isBitcoin(order.source_swap.chain) &&
            order.status === OrderStatus.InitiateDetected
          ) {
            const walletRes = this.getWallet(order.source_swap.chain);
            if (walletRes.error) {
              this.emit('error', order, walletRes.error);
              continue;
            }
            await this.postRefundSACP(order, walletRes.val as IBitcoinWallet);
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
                  const destWallet = this._btcWallet;
                  if (!destWallet) {
                    this.emit('error', order, "No bitcoin wallet provided");
                    return;
                  }
                  await this.btcRedeem(
                    destWallet as IBitcoinWallet,
                    order,
                    secrets.val.secret,
                  );
                  break;
                }
                case BlockchainType.Solana:
                  await this.solRedeem(order, secrets.val.secret);
                  break;
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
                case BlockchainType.Solana: {
                  this.emit(
                    'error',
                    order,
                    'Solana refund is automatically done by relay service',
                  );
                  break;
                }
                case BlockchainType.EVM: {
                  this.emit(
                    'error',
                    order,
                    'EVM refund is automatically done by relay service',
                  );
                  break;
                }
                case BlockchainType.Bitcoin: {
                  const sourceWallet = this.getWallet(order.source_swap.chain);
                  if (sourceWallet.error) {
                    this.emit('error', order, sourceWallet.error);
                    return;
                  }

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

  private async solInit(order: MatchedOrder) {
    const swapConfig = SwapConfig.from(order);
    const solRelay = new SolanaHTLC(swapConfig, this._solWallet!);
    const res = await solRelay.init();
    this.emit('log', order.create_order.create_id, "Solana Order Initiated successfully");
    return Ok(res)
  }

  private async solRedeem(order: MatchedOrder, secret: string) {
    this.emit('log', order.create_order.create_id, 'executing sol redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.create_order.create_id, 'already redeemed');
      return;
    }
    const swapConfig = SwapConfig.from(order);
    const solRelay = new SolanaRelay(swapConfig, this._solWallet!, this.solanaRelayUrl!, this.solanaRelayerAddress!);
    let sig;
    try {
      sig = await solRelay.redeem(secret);
    } catch (err) {
      const error = err as Error;
      this.emit('error', order, error.message);
      if (error.message.includes("transaction has already been processed")) {
        this.orderExecutorCache.set(
          order,
          OrderActions.Redeem,
          order.destination_swap.redeem_tx_hash,
        );
      }
      return;
    }
    this.orderExecutorCache.set(order, OrderActions.Redeem, sig);
    this.emit("success", order, OrderActions.Redeem, sig);
  }

  private async evmRedeem(order: MatchedOrder, secret: string) {
    this.emit('log', order.create_order.create_id, 'executing evm redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.create_order.create_id, 'already redeemed');
      return;
    }
    const res = await this._evmRelay.redeem(
      order.create_order.create_id,
      secret,
    );
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

  private getWallet(chain: Chain) {
    const blockChainType = getBlockchainType(chain);
    switch (blockChainType) {
      case BlockchainType.EVM:
        return Ok(this._evmWallet);
      case BlockchainType.Bitcoin:
        return Ok(this._btcWallet);
      case BlockchainType.Solana:
        return Ok(this._solWallet);
      default:
        return Err('Unsupported chain for wallet');
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

  private async fetchCurrentBlockNumbers(
    order: MatchedOrder,
    wallets: {
      source: WalletClient | IBitcoinWallet | AnchorProvider;
      destination: WalletClient | IBitcoinWallet | AnchorProvider;
    },
  ) {
    if (!wallets || !wallets.source || !wallets.destination)
      return Err('Provide wallets to fetch the current block number');

    const solanaBlockNumber = async (provider: AnchorProvider) => {
      return Ok((await provider.connection.getLatestBlockhash()).lastValidBlockHeight);
    };

    let sourceBlockNumber;
    if (isBitcoin(order.source_swap.chain)) {
      sourceBlockNumber = await fetchBitcoinBlockNumber(await (wallets.source as IBitcoinWallet).getProvider());
    } else if (isEVM(order.source_swap.chain)) {
      sourceBlockNumber = await fetchEVMBlockNumber(wallets.source as WalletClient);
    } else {
      sourceBlockNumber = await solanaBlockNumber(wallets.source as AnchorProvider);
    }
    if (sourceBlockNumber?.error) return Err(sourceBlockNumber.error);

    let destinationBlockNumber;
    if (isBitcoin(order.destination_swap.chain)) {
      destinationBlockNumber = await fetchBitcoinBlockNumber(await (wallets.destination as IBitcoinWallet).getProvider());
    } else if (isEVM(order.destination_swap.chain)) {
      destinationBlockNumber = await fetchEVMBlockNumber(wallets.destination as WalletClient);
    } else {
      destinationBlockNumber = await solanaBlockNumber(wallets.source as AnchorProvider);
    }
    if (destinationBlockNumber.error) return Err(destinationBlockNumber.error);

    return Ok({
      source: sourceBlockNumber.val,
      destination: destinationBlockNumber.val,
    });
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


      //!FIX:  Better logic is required
      if (blockNumbers.val.solana) {
        blockNumbers.val.solana_devnet = blockNumbers.val.solana;
        blockNumbers.val.solana_localnet = blockNumbers.val.solana;
      }

      if (blockNumbers.val.arbitrum) {
        blockNumbers.val.arbitrum_localnet = blockNumbers.val.arbitrum;
      }

      if (blockNumbers.val.ethereum) {
        blockNumbers.val.ethereum_localnet = blockNumbers.val.ethereum
      }

      if (blockNumbers.val.bitcoin) {
        blockNumbers.val.bitcoin_regtest = blockNumbers.val.bitcoin
        blockNumbers.val.bitcoin_testnet = blockNumbers.val.bitcoin
      }

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
