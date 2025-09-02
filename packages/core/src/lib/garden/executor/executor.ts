import { DigestKey, EventBroker } from '@gardenfi/utils';
import {
  GardenEvents,
  GardenHTLCModules,
  IOrderExecutorCache,
} from './../garden.types';
import {
  BlockchainType,
  getBlockchainType,
  IOrderbook,
  isBitcoin,
  Order,
  OrderLifecycle,
} from '@gardenfi/orderbook';
import {
  isCompleted,
  OrderAction,
  parseAction,
  ParseOrderStatus,
} from 'src/lib/orderStatus/orderStatus';
import { ISecretManager } from 'src/lib/secretManager/secretManager.types';
import { SecretManager } from 'src/lib/secretManager/secretManager';
import { ExecutorCache } from '../cache/executorCache';

export class Executor extends EventBroker<GardenEvents> {
  private htlcs: GardenHTLCModules;
  #digestKey: DigestKey;
  #orderbook: IOrderbook;
  #secretManager: ISecretManager;
  #orderExecutorCache: IOrderExecutorCache;

  constructor(
    digestKey: DigestKey,
    htlcs: GardenHTLCModules,
    orderbook: IOrderbook,
  ) {
    super();
    this.htlcs = htlcs;
    this.#digestKey = digestKey;
    this.#orderbook = orderbook;
    this.#secretManager = SecretManager.fromDigestKey(digestKey.digestKey);
    this.#orderExecutorCache = new ExecutorCache();
  }

  async execute(interval: number = 5000): Promise<() => void> {
    return await this.#orderbook.subscribeOrders(
      {
        address: this.#digestKey.userId,
        status: OrderLifecycle.pending,
        per_page: 500,
      },
      async (pendingOrders) => {
        const ordersWithStatus = pendingOrders.data.map((order) => {
          return { ...order, status: ParseOrderStatus(order) };
        });
        this.emit('onPendingOrdersChanged', ordersWithStatus);
        if (pendingOrders.data.length === 0) return;

        for (const order of ordersWithStatus) {
          const orderAction = parseAction(order);

          if (
            isBitcoin(order.source_swap.chain) &&
            // post refund sacp for bitcoin orders only at relevent statuses
            !isCompleted(order)
          ) {
            const wallet = this._btcWallet;
            if (!wallet) {
              this.emit('error', order, 'BTC wallet not found');
              continue;
            }
            await this.postRefundSACP(order, wallet);
          }

          switch (orderAction) {
            case OrderAction.Redeem: {
              const secrets = await this.#secretManager.generateSecret(
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
            //TODO: handle refund case
            // case OrderAction.Refund:
          }
        }
      },
      interval,
    );
  }

  private async evmRedeem(order: Order, secret: string): Promise<void> {
    this.emit('log', order.order_id, 'executing evm redeem');
    const cache = this.#orderExecutorCache.get(order, OrderAction.Redeem);
    if (cache) {
      this.emit('log', order.order_id, 'already redeemed');
      return;
    }

    if (!this.htlcs.evm) {
      this.emit('error', order, 'EVMHTLC is required');
      return;
    }

    const res = await this.htlcs.evm.redeem(order, secret);

    if (!res.ok) {
      this.emit('error', order, res.error);
      if (res.error.includes('Order already redeemed')) {
        this.#orderExecutorCache.set(
          order,
          OrderAction.Redeem,
          order.destination_swap.redeem_tx_hash,
        );
      }
      return;
    }

    this.#orderExecutorCache.set(order, OrderAction.Redeem, res.val);
    this.emit('success', order, OrderAction.Redeem, res.val);
  }

  private async starknetRedeem(order: Order, secret: string) {
    this.emit('log', order.order_id, 'executing starknet redeem');
    const cache = this.#orderExecutorCache.get(order, OrderAction.Redeem);
    if (cache) {
      this.emit('log', order.order_id, 'already redeemed');
      return;
    }
    if (!this.htlcs.starknet) {
      this.emit('error', order, 'StarknetHTLC is required');
      return;
    }

    const res = await this.htlcs.starknet.redeem(order, secret);
    if (!res.ok) {
      this.emit('error', order, res.error);
      if (res.error.includes('Order already redeemed')) {
        this.#orderExecutorCache.set(
          order,
          OrderAction.Redeem,
          order.destination_swap.redeem_tx_hash,
        );
      }
      return;
    }
    if (res.val) {
      this.#orderExecutorCache.set(order, OrderAction.Redeem, res.val);
      this.emit('success', order, OrderAction.Redeem, res.val);
    }
  }

  private async solRedeem(order: Order, secret: string) {
    this.emit('log', order.order_id, 'executing sol redeem');
    const cache = this.#orderExecutorCache.get(order, OrderAction.Redeem);
    if (cache) {
      this.emit('log', order.order_id, 'already redeemed');
      return;
    }

    if (!this.htlcs.solana) {
      this.emit('error', order, 'Solana HTLC is required');
      return;
    }

    const res = await this.htlcs.solana.redeem(order, secret);

    if (res.error) {
      this.emit('error', order, res.error);

      if (res.error.includes('Order already redeemed')) {
        this.#orderExecutorCache.set(
          order,
          OrderAction.Redeem,
          order.destination_swap.redeem_tx_hash,
        );
      }
      return;
    }

    if (res.val) {
      this.#orderExecutorCache.set(order, OrderAction.Redeem, res.val);
      this.emit('success', order, OrderAction.Redeem, res.val);
    }
  }

  private async suiRedeem(order: Order, secret: string) {
    this.emit('log', order.order_id, 'executing sui redeem');
    const cache = this.#orderExecutorCache.get(order, OrderAction.Redeem);
    if (cache) {
      this.emit('log', order.order_id, 'already redeemed');
      return;
    }

    if (!this.htlcs.sui) {
      this.emit('error', order, 'Sui HTLC is required');
      return;
    }

    const res = await this.htlcs.sui.redeem(order, secret);

    if (res.error) {
      this.emit('error', order, res.error);

      if (res.error.includes('Order already redeemed')) {
        this.#orderExecutorCache.set(
          order,
          OrderAction.Redeem,
          order.destination_swap.redeem_tx_hash,
        );
      }
      return;
    }

    if (res.val) {
      this.#orderExecutorCache.set(order, OrderAction.Redeem, res.val);
      this.emit('success', order, OrderAction.Redeem, res.val);
    }
  }
}
