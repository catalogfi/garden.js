import { ISecretManager } from './../secretManager/secretManager.types';
import {
  GardenEvents,
  IGardenJS,
  IOrderExecutorCache,
  OrderActions,
  OrderWithStatus,
  SwapParams,
  GardenConfigWithHTLCs,
  GardenConfigWithWallets,
} from './garden.types';
import {
  AffiliateFee,
  Asset,
  BlockchainType,
  ChainAsset,
  CreateOrderRequest,
  getBlockchainType,
  getChain,
  getChainTypeFromAssetChain,
  IOrderbook,
  isBitcoin,
  isMainnet,
  Order,
  Orderbook,
  toFormattedAssetString,
} from '@gardenfi/orderbook';
import {
  APIResponse,
  Environment,
  EventBroker,
  IAuth,
  Siwe,
  Url,
  DigestKey,
  Network,
  trim0x,
  Err,
  AsyncResult,
  Ok,
  Fetcher,
  ApiKey,
  sleep,
} from '@gardenfi/utils';
import { IQuote } from '../quote/quote.types';
import {
  getBitcoinNetwork,
  isValidBitcoinPubKey,
  resolveApiConfig,
  toXOnly,
} from '../utils';
import {
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
import {
  Api,
  DEFAULT_AFFILIATE_ASSET,
  solanaProgramAddress,
  SolanaRelayerAddress,
} from '../constants';
import { Quote } from '../quote/quote';
import { SecretManager } from '../secretManager/secretManager';
import { IEVMHTLC } from '../evm/htlc.types';
import { EvmRelay } from '../evm/relay/evmRelay';
import { IStarknetHTLC } from '../starknet/starknetHTLC.types';
import { StarknetRelay } from '../starknet/relay/starknetRelay';
import { IBitcoinWallet } from '../bitcoin/wallet/wallet.interface';
import { BitcoinProvider } from '../bitcoin/provider/provider';
import { BitcoinWallet } from '../bitcoin/wallet/wallet';
import { ISolanaHTLC } from '../solana/htlc/ISolanaHTLC';
import { SolanaRelay } from '../solana/relayer/solanaRelay';
import { ISuiHTLC } from '../sui/suiHTLC.types';
import { SuiRelay } from '../sui/relay/suiRelay';

export class Garden extends EventBroker<GardenEvents> implements IGardenJS {
  private environment: Environment = Environment.TESTNET;
  private _secretManager: ISecretManager;
  private _orderbook: IOrderbook;
  private _quote: IQuote;
  private getOrderThreshold = 20;
  private _auth: IAuth;
  private orderExecutorCache: IOrderExecutorCache;
  private _blockNumberFetcher: IBlockNumberFetcher;
  private refundSacpCache = new Map<string, any>();
  private _evmHTLC: IEVMHTLC | undefined;
  private _starknetHTLC: IStarknetHTLC | undefined;
  private _solanaHTLC: ISolanaHTLC | undefined;
  private _suiHTLC: ISuiHTLC | undefined;
  private _btcWallet: IBitcoinWallet | undefined;
  private bitcoinRedeemCache = new Cache<{
    redeemedFromUTXO: string;
    redeemedAt: number;
    redeemTxHash: string;
  }>();
  private _digestKey: DigestKey;
  private _apiKey: ApiKey | undefined;
  private _api: Api | undefined;
  private isSecretManagementEnabled: boolean = false;

  constructor(config: GardenConfigWithHTLCs) {
    super();
    const { api, environment } = resolveApiConfig(config.environment);
    this.environment = environment;
    this._api = api;
    if (typeof config.digestKey === 'string') {
      const _digestKey = DigestKey.from(config.digestKey);
      if (!_digestKey.ok) throw new Error(_digestKey.error);
      this._digestKey = _digestKey.val;
    } else {
      this._digestKey = config.digestKey;
    }
    if (typeof config.apiKey === 'string') {
      this._apiKey = new ApiKey(config.apiKey);
    } else {
      this._apiKey = config.apiKey;
    }
    this._quote = config.quote ?? new Quote(this._api.baseurl);
    this._auth =
      config.auth ??
      Siwe.fromDigestKey(new Url(this._api.auth), this._digestKey) ??
      this._apiKey;
    this._orderbook =
      config.orderbook ?? new Orderbook(new Url(this._api.baseurl));
    this._evmHTLC = config.htlc.evm;
    this._starknetHTLC = config.htlc.starknet;
    this._solanaHTLC = config.htlc.solana;
    this._suiHTLC = config.htlc.sui;
    this._secretManager =
      config.secretManager ??
      SecretManager.fromDigestKey(this._digestKey.digestKey);
    this.orderExecutorCache = new ExecutorCache();
    this._blockNumberFetcher =
      config.blockNumberFetcher ??
      new BlockNumberFetcher(new Url(this._api.info), this.environment);

    const provider = new BitcoinProvider(getBitcoinNetwork(this.environment));
    this._btcWallet = BitcoinWallet.fromPrivateKey(
      this._digestKey.digestKey,
      provider,
    );
  }

  handleSecretManagement(enabled: boolean): this {
    this.isSecretManagementEnabled = enabled;
    return this;
  }

  static fromWallets(config: GardenConfigWithWallets) {
    let digestKey: DigestKey;
    let apiKey: ApiKey | undefined;
    if (typeof config.digestKey === 'string') {
      const _digestKey = DigestKey.from(config.digestKey);
      if (!_digestKey.ok) throw new Error(_digestKey.error);
      digestKey = _digestKey.val;
    } else {
      digestKey = config.digestKey;
    }
    if (typeof config.apiKey === 'string') {
      apiKey = new ApiKey(config.apiKey);
    } else {
      apiKey = config.apiKey;
    }
    const { api } = resolveApiConfig(config.environment);

    if (!api)
      throw new Error(
        'API not found, invalid environment ' + config.environment,
      );

    const htlc = {
      evm: config.wallets.evm
        ? new EvmRelay(
            api.baseurl,
            config.wallets.evm,
            apiKey
              ? apiKey
              : Siwe.fromDigestKey(new Url(api.baseurl), digestKey),
          )
        : undefined,
      starknet: config.wallets.starknet
        ? new StarknetRelay(
            api.baseurl,
            config.wallets.starknet,
            config.environment === Environment.MAINNET
              ? Network.MAINNET
              : Network.TESTNET,
            apiKey
              ? apiKey
              : Siwe.fromDigestKey(new Url(api.baseurl), digestKey),
          )
        : undefined,
      solana: config.wallets.solana
        ? new SolanaRelay(
            config.wallets.solana,
            new Url(api.baseurl),
            config.environment === Environment.MAINNET
              ? SolanaRelayerAddress.mainnet
              : SolanaRelayerAddress.testnet,
            {
              native:
                config.solanaProgramAddress &&
                config.solanaProgramAddress.native
                  ? config.solanaProgramAddress.native
                  : solanaProgramAddress.mainnet.native,
              spl:
                config.solanaProgramAddress && config.solanaProgramAddress.spl
                  ? config.solanaProgramAddress.spl
                  : solanaProgramAddress.mainnet.spl,
            },
            apiKey
              ? apiKey
              : Siwe.fromDigestKey(new Url(api.baseurl), digestKey),
          )
        : undefined,
      sui: config.wallets.sui
        ? new SuiRelay(
            api.suiRelay,
            config.wallets.sui,
            config.environment === Environment.MAINNET
              ? Network.MAINNET
              : Network.TESTNET,
          )
        : undefined,
    };

    return new Garden({
      htlc,
      ...config,
    });
  }

  get evmHTLC() {
    return this._evmHTLC;
  }

  get starknetHTLC() {
    return this._starknetHTLC;
  }

  get solanaHTLC() {
    return this._solanaHTLC;
  }

  get suiHTLC() {
    return this._suiHTLC;
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

  /**
   * This method takes in the `SwapParams` and returns a placed order
   * It internally calls `createOrder` and `pollOrder`
   * @param swapParams
   * @returns Order
   */
  /**
   * Executes a swap operation by creating and polling an order, and optionally initiating the HTLC
   * on the appropriate chain. Handles all error cases robustly and ensures proper flow.
   * @param params SwapParams
   * @returns AsyncResult<Order, string>
   */
  async swap(params: SwapParams): AsyncResult<Order, string> {
    const validation = await this.validateAndFillParams(params);
    if (!validation.ok) return Err(validation.error);

    const { sendAddress, receiveAddress } = validation.val;

    const nonce = Date.now().toString();
    let secretHash: string | undefined;

    if (this.isSecretManagementEnabled) {
      const secrets = await this._secretManager.generateSecret(nonce);
      if (!secrets.ok) return Err(secrets.error);
      secretHash = secrets.val.secretHash;
    }

    const { btcAddress } = params.additionalData || {};

    const isSourceBitcoin = isBitcoin(getChain(params.fromAsset));
    const isDestinationBitcoin = isBitcoin(getChain(params.toAsset));

    const orderRequest: CreateOrderRequest = {
      source: {
        asset: toFormattedAssetString(params.fromAsset),
        owner: sendAddress,
        delegate: isSourceBitcoin ? btcAddress ?? null : null,
        amount: params.sendAmount,
      },
      destination: {
        asset: toFormattedAssetString(params.toAsset),
        owner: receiveAddress,
        delegate: isDestinationBitcoin ? btcAddress ?? null : null,
        amount: params.receiveAmount,
      },
      nonce: Number(nonce),
      ...(this.isSecretManagementEnabled && secretHash
        ? {
            secret_hash: trim0x(secretHash),
          }
        : {}),
      affiliate_fees: this.withDefaultAffiliateFees(params.affiliateFee),
      slippage: 50,
    };
    const createOrderRes = await this._orderbook.createOrder(
      orderRequest,
      this._auth,
    );
    if (!createOrderRes.ok) return Err(createOrderRes.error);

    const orderRes = await this.pollOrder(createOrderRes.val.order_id);
    if (!orderRes.ok) return Err(orderRes.error);

    const chainType = getChainTypeFromAssetChain(orderRequest.source.asset);

    switch (chainType) {
      case BlockchainType.EVM:
        if (
          !this._evmHTLC ||
          typeof this._evmHTLC.initiate !== 'function' ||
          createOrderRes.val.type !== BlockchainType.EVM
        ) {
          return Err(
            'EVM HTLC is not initialized, does not support initiation, or order type is not EVM',
          );
        }
        {
          const evmInitRes = await this._evmHTLC.initiate(createOrderRes.val);
          if (!evmInitRes.ok)
            return Err(`EVM HTLC initiation failed: ${evmInitRes.error}`);
        }
        break;
      case BlockchainType.Solana:
        if (
          !this._solanaHTLC ||
          typeof this._solanaHTLC.initiate !== 'function' ||
          createOrderRes.val.type !== BlockchainType.Solana
        ) {
          return Err(
            'Solana HTLC is not initialized or does not support initiation',
          );
        }
        {
          const solanaInitRes = await this._solanaHTLC.initiate(
            createOrderRes.val,
          );
          if (!solanaInitRes.ok)
            return Err(`Solana HTLC initiation failed: ${solanaInitRes.error}`);
        }
        break;
      case BlockchainType.Starknet:
        if (
          !this._starknetHTLC ||
          typeof this._starknetHTLC.initiate !== 'function' ||
          createOrderRes.val.type !== BlockchainType.Starknet
        ) {
          return Err(
            'Starknet HTLC is not initialized or does not support initiation',
          );
        }
        {
          const starknetInitRes = await this._starknetHTLC.initiate(
            createOrderRes.val,
          );
          if (!starknetInitRes.ok)
            return Err(
              `Starknet HTLC initiation failed: ${starknetInitRes.error}`,
            );
        }
        break;
      default:
        return Err(`Unsupported chain type: ${chainType}`);
    }

    return Ok(orderRes.val);
  }

  private withDefaultAffiliateFees(
    list: AffiliateFee[] | undefined,
  ): AffiliateFee[] {
    return (list ?? []).map((fee) => ({
      fee: fee.fee,
      address: fee.address,
      asset: fee.asset ?? DEFAULT_AFFILIATE_ASSET.asset,
    }));
  }

  private async validateAndFillParams(params: SwapParams) {
    if (!params.fromAsset || !params.toAsset)
      return Err('Source and destination assets are required for swap');

    if (
      (isMainnet(getChain(params.fromAsset)) &&
        !isMainnet(getChain(params.toAsset))) ||
      (!isMainnet(getChain(params.fromAsset)) &&
        isMainnet(getChain(params.toAsset)))
    )
      return Err(
        'Both assets should be on the same network (either mainnet or testnet)',
      );

    const inputAmount = this.validateAmount(params.sendAmount);
    if (!inputAmount.ok) return Err(inputAmount.error);

    const outputAmount = this.validateAmount(params.receiveAmount);
    if (!outputAmount.ok) return Err(outputAmount.error);

    if (inputAmount < outputAmount)
      return Err('Send amount should be greater than receive amount');

    if (
      isBitcoin(getChain(params.fromAsset)) ||
      isBitcoin(getChain(params.toAsset))
    ) {
      if (!params.additionalData.btcAddress)
        return Err(
          'btcAddress in additionalData is required if source or destination chain is bitcoin, it is used as refund or redeem address.',
        );
    }

    const sendAddress = await this.getAddresses(params.fromAsset);
    if (!sendAddress.ok) return Err(sendAddress.error);

    const receiveAddress = await this.getAddresses(params.toAsset);
    if (!receiveAddress.ok) return Err(receiveAddress.error);

    return Ok({
      sendAddress: sendAddress.val,
      receiveAddress: receiveAddress.val,
    });
  }

  private async getAddresses(asset: Asset | ChainAsset) {
    const chain = getChain(asset);
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
      case BlockchainType.Solana: {
        if (!this._solanaHTLC)
          return Err('Please provide solanaHTLC when initializing garden');
        return Ok(this._solanaHTLC.htlcActorAddress);
      }
      case BlockchainType.Starknet: {
        if (!this._starknetHTLC)
          return Err('Please provide starknetHTLC when initializing garden');
        return Ok(this._starknetHTLC.htlcActorAddress);
      }
      case BlockchainType.Sui: {
        if (!this._suiHTLC)
          return Err('Please provide suiHTLC when initializing garden');
        return Ok(this._suiHTLC.htlcActorAddress);
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
    let orderRes = await this._orderbook.getOrder(createOrderID);
    let attempts = 0;

    while (attempts < this.getOrderThreshold) {
      await sleep(1000);
      attempts++;

      if (!orderRes.ok) {
        if (!orderRes.error.includes('result is undefined')) {
          return Err(orderRes.error);
        }
      } else if (
        orderRes.val &&
        orderRes.val.order_id.toLowerCase() === createOrderID.toLowerCase()
      ) {
        return Ok(orderRes.val);
      }

      orderRes = await this._orderbook.getOrder(createOrderID);
    }

    return Err(`Order not found, createOrder id: ${createOrderID}`);
  }

  async execute(interval: number = 5000): Promise<() => void> {
    return await this._orderbook.subscribeOrders(
      this.digestKey.userId,
      interval,
      async (pendingOrders) => {
        const ordersWithStatus = await this.assignStatus(pendingOrders.data);
        if (!ordersWithStatus.ok) return;
        this.emit('onPendingOrdersChanged', ordersWithStatus.val);
        if (pendingOrders.data.length === 0) return;

        for (const order of ordersWithStatus.val) {
          if (!this.isSecretManagementEnabled) {
            switch (order.status) {
              case OrderStatus.Completed:
              case OrderStatus.Redeemed:
              case OrderStatus.CounterPartyRedeemed: {
                if (!order.destination_swap.redeem_tx_hash) continue;

                this.orderExecutorCache.set(
                  order,
                  OrderActions.Redeem,
                  order.destination_swap.redeem_tx_hash,
                );
                this.emit(
                  'success',
                  order,
                  OrderActions.Redeem,
                  order.destination_swap.redeem_tx_hash,
                );
                break;
              }
            }
            continue;
          }

          const orderAction = parseActionFromStatus(order.status);

          if (
            isBitcoin(order.source_swap.chain) &&
            // post refund sacp for bitcoin orders only at relevent statuses
            (order.status === OrderStatus.InitiateDetected ||
              order.status === OrderStatus.Initiated ||
              order.status === OrderStatus.CounterPartyInitiated ||
              order.status === OrderStatus.CounterPartyInitiateDetected ||
              order.status === OrderStatus.CounterPartyRefundDetected ||
              order.status === OrderStatus.CounterPartyRefunded ||
              order.status === OrderStatus.CounterPartySwapExpired ||
              order.status === OrderStatus.Expired ||
              order.status === OrderStatus.DeadLineExceeded)
          ) {
            const wallet = this._btcWallet;
            if (!wallet) {
              this.emit('error', order, 'BTC wallet not found');
              continue;
            }
            await this.postRefundSACP(order, wallet);
          }

          switch (orderAction) {
            case OrderActions.Redeem: {
              const secrets = await this._secretManager.generateSecret(
                order.nonce,
              );
              if (!secrets.ok) {
                this.emit('error', order, secrets.error);
                return;
              }

              const secret = secrets.val.secret;
              switch (getBlockchainType(order.destination_swap.chain)) {
                case BlockchainType.EVM:
                  await this.evmRedeem(order, secret);
                  break;
                case BlockchainType.Bitcoin: {
                  const destWallet = this.btcWallet;
                  if (!destWallet) {
                    this.emit('error', order, 'BTC wallet not found');
                    return;
                  }
                  await this.btcRedeem(destWallet, order, secret);
                  break;
                }
                case BlockchainType.Starknet: {
                  await this.starknetRedeem(order, secret);
                  break;
                }
                case BlockchainType.Solana: {
                  await this.solRedeem(order, secrets.val.secret);
                  break;
                }
                case BlockchainType.Sui: {
                  await this.suiRedeem(order, secrets.val.secret);
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
                  const sourceWallet = this.btcWallet;
                  if (!sourceWallet) {
                    this.emit('error', order, 'BTC wallet not found');
                    continue;
                  }
                  await this.btcRefund(sourceWallet, order);
                  break;
                }
                case BlockchainType.Starknet:
                  this.emit(
                    'error',
                    order,
                    'Starknet refund is automatically done by relay service',
                  );
                  break;
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
      'pending',
      { per_page: 500 },
    );
  }

  private async solRedeem(order: Order, secret: string) {
    this.emit('log', order.order_id, 'executing sol redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.order_id, 'already redeemed');
      return;
    }

    if (!this._solanaHTLC) {
      this.emit('error', order, 'Solana HTLC is required');
      return;
    }

    const res = await this._solanaHTLC.redeem(order, secret);

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

  private async suiRedeem(order: Order, secret: string) {
    this.emit('log', order.order_id, 'executing sui redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.order_id, 'already redeemed');
      return;
    }

    if (!this._suiHTLC) {
      this.emit('error', order, 'Sui HTLC is required');
      return;
    }

    const res = await this._suiHTLC.redeem(order, secret);

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

  private async evmRedeem(order: Order, secret: string): Promise<void> {
    this.emit('log', order.order_id, 'executing evm redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.order_id, 'already redeemed');
      return;
    }

    if (!this._evmHTLC) {
      this.emit('error', order, 'EVMHTLC is required');
      return;
    }

    const res = await this._evmHTLC.redeem(order, secret);

    if (!res.ok) {
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

  private async starknetRedeem(order: Order, secret: string) {
    this.emit('log', order.order_id, 'executing starknet redeem');
    const cache = this.orderExecutorCache.get(order, OrderActions.Redeem);
    if (cache) {
      this.emit('log', order.order_id, 'already redeemed');
      return;
    }
    if (!this._starknetHTLC) {
      this.emit('error', order, 'StarknetHTLC is required');
      return;
    }

    const res = await this._starknetHTLC.redeem(order, secret);
    if (!res.ok) {
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
    order: Order,
    secret: string,
  ) {
    const _cache = this.bitcoinRedeemCache.get(order.order_id);
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
        this.emit('log', order.order_id, 'rbf btc redeem');
      } else if (
        _cache.redeemedAt &&
        Date.now() - _cache.redeemedAt > 1000 * 60 * 15 // 15 minutes
      ) {
        this.emit(
          'log',
          order.order_id,
          'redeem not confirmed in last 15 minutes',
        );
        rbf = true;
      } else {
        this.emit('log', order.order_id, 'btcRedeem: already redeemed');
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
          this.emit('log', order.order_id, 'already a valid redeem');
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

          this.bitcoinRedeemCache.set(order.order_id, {
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

    this.emit('log', order.order_id, 'executing btc redeem');
    try {
      const bitcoinExecutor = await GardenHTLC.from(
        wallet as IBitcoinWallet,
        Number(order.destination_swap.amount),
        order.source_swap.secret_hash,
        toXOnly(order.destination_swap.initiator),
        toXOnly(order.destination_swap.redeemer),
        order.destination_swap.timelock,
        rbf ? [fillerInitTx] : [],
      );
      const isSourceBitcoin = isBitcoin(order.source_swap.chain);
      const redeemHex = await bitcoinExecutor.getRedeemHex(
        trim0x(secret),
        isSourceBitcoin
          ? order.source_swap.delegate
          : order.destination_swap.delegate,
      );
      const res = await this.broadcastRedeemTx(redeemHex, order.order_id);
      if (!res.ok) {
        this.emit('error', order, res.error || 'Failed to broadcast redeem tx');
        return;
      }

      if (rbf) {
        this.emit('log', order.order_id, 'rbf: btc redeem success');
        this.emit('rbf', order, res.val);
      } else this.emit('success', order, OrderActions.Redeem, res.val);
      this.bitcoinRedeemCache.set(order.order_id, {
        redeemedFromUTXO: fillerInitTx,
        redeemedAt: Date.now(),
        redeemTxHash: res.val,
      });
    } catch (error) {
      this.emit('error', order, 'Failed btc redeem: ' + error);
    }
  }

  private async btcRefund(wallet: IBitcoinWallet, order: Order) {
    if (this.orderExecutorCache.get(order, OrderActions.Refund)) {
      return;
    }

    this.emit('log', order.order_id, 'executing btc refund');

    try {
      const bitcoinExecutor = await GardenHTLC.from(
        wallet as IBitcoinWallet,
        Number(order.source_swap.amount),
        order.source_swap.secret_hash,
        toXOnly(order.source_swap.initiator),
        toXOnly(order.source_swap.redeemer),
        order.source_swap.timelock,
      );
      const res = await bitcoinExecutor.refund(order.source_swap.delegate);
      this.orderExecutorCache.set(order, OrderActions.Refund, res);
      this.emit('success', order, OrderActions.Refund, res);
    } catch (error) {
      this.emit('error', order, 'Failed btc refund: ' + error);
    }
  }

  private async postRefundSACP(order: Order, wallet: IBitcoinWallet) {
    const cachedOrder = this.refundSacpCache.get(order.order_id);
    if (cachedOrder?.initTxHash === order.source_swap.initiate_tx_hash) return;

    const bitcoinExecutor = await GardenHTLC.from(
      wallet,
      Number(order.source_swap.amount),
      order.source_swap.secret_hash,
      toXOnly(order.source_swap.initiator),
      toXOnly(order.source_swap.redeemer),
      order.source_swap.timelock,
    );
    const userBTCAddress = order.source_swap.delegate;
    if (!userBTCAddress) return;

    try {
      if (!this._api) return;
      const authHeaders = await this._auth.getAuthHeaders();
      if (authHeaders.error) {
        this.emit(
          'error',
          order,
          'Failed to get auth headers: ' + authHeaders.error,
        );
        return;
      }

      const hash = await Fetcher.post<APIResponse<string[]>>(
        new Url(this._api.baseurl)
          .endpoint('orders')
          .endpoint(order.order_id)
          .endpoint('instant-refund-hash'),
        {
          headers: {
            'Content-Type': 'application/json',
            ...authHeaders.val,
          },
        },
      );
      if (hash.error || !hash.result) {
        this.emit(
          'error',
          order,
          'Failed to get hash while posting instant refund SACP: ' + hash.error,
        );
        return;
      }

      const signatures =
        await bitcoinExecutor.generateInstantRefundSACPWithHash(hash.result);

      const url = new Url(this._api.baseurl)
        .endpoint('orders')
        .endpoint(order.order_id)
        .addSearchParams({ action: 'instant-refund' });

      const res = await Fetcher.patch<APIResponse<string>>(url, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders.val,
        },
        body: JSON.stringify({ signatures }),
      });
      if (res.status === 'Ok') {
        this.refundSacpCache.set(order.order_id, {
          initTxHash: order.source_swap.initiate_tx_hash,
        });
      }
    } catch (error) {
      this.emit('error', order, 'Failed to generate and post SACP: ' + error);
      return;
    }
  }

  private async assignStatus(orders: Order[]) {
    if (orders.length === 0) return Ok([]);

    const blockNumbers = await this._blockNumberFetcher?.fetchBlockNumbers();
    if (!blockNumbers.ok) return Err(blockNumbers.error);

    const orderWithStatuses: OrderWithStatus[] = [];

    for (let i = 0; i < orders.length; i++) {
      const order = orders[i];

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
      if (!this._api) return Err('API not found');
      const url = new Url(this._api.baseurl)
        .endpoint('orders')
        .endpoint(orderId)
        .addSearchParams({ action: 'redeem' });
      const authHeaders = await this._auth.getAuthHeaders();
      const res = await Fetcher.patch<APIResponse<string>>(url, {
        headers: {
          'Content-Type': 'application/json',
          ...authHeaders.val,
        },
        body: JSON.stringify({ redeem_tx_bytes: redeemTx }),
      });

      if (res.status === 'Ok' && res.result) {
        return Ok(res.result);
      }
      return Err(res.error);
    } catch (error) {
      return Err('Failed to broadcast redeem tx: ' + error);
    }
  }
}
