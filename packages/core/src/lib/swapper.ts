import { Actions, Order, parseStatus } from '@gardenfi/orderbook';
import { Chain, EvmChain, chainToId } from '@gardenfi/orderbook';
import {
    IBaseWallet,
    IBitcoinWallet,
    IHTLCWallet,
    WalletChain,
} from '@catalogfi/wallets';
import { computeSecret } from './utils';
import { SwapperErrors } from './errors';
import { GardenHTLC } from './htlc';

export interface ISwapper {
    id(): string;
    next(): Promise<SwapOutput>;
}

export class Swapper implements ISwapper {
    private order: Order;
    private wallets: Partial<Record<Chain, IBaseWallet>>;

    constructor(order: Order, wallet: Partial<Record<Chain, IBaseWallet>>) {
        this.order = order;
        this.wallets = wallet;
    }

    get action(): Actions {
        return parseStatus(this.order);
    }

    get status(): number {
        return +`${this.order.status}${this.order.initiatorAtomicSwap.swapStatus}${this.order.followerAtomicSwap.swapStatus}`;
    }

    async next(): Promise<SwapOutput> {
        switch (SwapperAction[this.action]) {
            case SwapperActions.Init:
                return await this.init();
            case SwapperActions.Redeem:
                return await this.redeem();
            case SwapperActions.Refund:
                return await this.refund();
            default:
                return DefaultSwapOutput;
        }
    }

    private async init(): Promise<SwapOutput> {
        switch (this.action) {
            case Actions.UserCanInitiate: {
                const fromWallet =
                    this.wallets[this.order.initiatorAtomicSwap.chain as Chain];
                if (!fromWallet) {
                    throw new Error(
                        `No ${this.order.initiatorAtomicSwap.chain} wallet found`
                    );
                }
                const swap = await htlcWalletFromOrder(
                    fromWallet,
                    this.order,
                    User.NATIVE,
                    this.order.initiatorAtomicSwap.asset
                );
                return {
                    user: SwapperRole.INITIATOR,
                    action: SwapperActions.Init,
                    output: await swap.init(),
                };
            }
            case Actions.CounterpartyCanInitiate: {
                const toWallet =
                    this.wallets[this.order.followerAtomicSwap.chain as Chain];
                if (!toWallet) {
                    throw new Error(
                        `No ${this.order.followerAtomicSwap.chain} wallet`
                    );
                }

                const swap = await htlcWalletFromOrder(
                    toWallet,
                    this.order,
                    User.FOREIGN,
                    this.order.followerAtomicSwap.asset
                );
                return {
                    user: SwapperRole.REDEEMER,
                    action: SwapperActions.Init,
                    output: await swap.init(),
                };
            }
            default: {
                throw new Error(
                    SwapperErrors.INVALID_ACTION('init', this.status)
                );
            }
        }
    }

    private async redeem(): Promise<SwapOutput> {
        //TODO: always use the wallet which was used in swap
        const followerWallet = this.getWallet(
            this.order.followerAtomicSwap.chain
        );
        const initiatorWallet = this.getWallet(
            this.order.initiatorAtomicSwap.chain
        );

        switch (this.action) {
            case Actions.UserCanRedeem: {
                const swap = await htlcWalletFromOrder(
                    followerWallet,
                    this.order,
                    User.FOREIGN,
                    this.order.followerAtomicSwap.asset
                );
                const secret = await computeSecret(
                    this.order.initiatorAtomicSwap.chain as Chain,
                    this.order.followerAtomicSwap.chain as Chain,
                    this.wallets,
                    this.order.secretNonce
                );
                return {
                    user: SwapperRole.INITIATOR,
                    action: SwapperActions.Redeem,
                    output: await swap.redeem(
                        secret,
                        this.order.userBtcWalletAddress
                    ),
                };
            }
            case Actions.CounterpartyCanRedeem: {
                if (!this.order.secret)
                    throw new Error('Secret not found in order');
                const swap = await htlcWalletFromOrder(
                    initiatorWallet,
                    this.order,
                    User.NATIVE,
                    this.order.initiatorAtomicSwap.asset
                );
                return {
                    user: SwapperRole.REDEEMER,
                    action: SwapperActions.Redeem,
                    output: await swap.redeem(this.order.secret),
                };
            }
            default: {
                throw new Error(
                    SwapperErrors.INVALID_ACTION('redeem', this.status)
                );
            }
        }
    }
    private async refund(): Promise<SwapOutput> {
        const initWallet = this.getWallet(this.order.initiatorAtomicSwap.chain);
        const followerWallet = this.getWallet(
            this.order.followerAtomicSwap.chain
        );

        if (this.order.initiatorAtomicSwap.swapStatus === 3) {
            const swap = await htlcWalletFromOrder(
                initWallet,
                this.order,
                User.NATIVE,
                this.order.initiatorAtomicSwap.asset
            );
            return {
                user: SwapperRole.INITIATOR,
                action: SwapperActions.Refund,
                output: await swap.refund(this.order.userBtcWalletAddress),
            };
        } else if (this.order.followerAtomicSwap.swapStatus === 3) {
            const swap = await htlcWalletFromOrder(
                followerWallet,
                this.order,
                User.FOREIGN,
                this.order.followerAtomicSwap.asset
            );
            return {
                user: SwapperRole.REDEEMER,
                action: SwapperActions.Refund,
                output: await swap.refund(this.order.userBtcWalletAddress),
            };
        }
        throw new Error(SwapperErrors.INVALID_ACTION('refund', this.status));
    }
    id(): string {
        throw new Error('Method not implemented.');
    }

    private getWallet(chain: string) {
        const wallet = this.wallets[chain as Chain];
        if (!wallet) {
            throw new Error(`No ${chain} wallet found`);
        }
        return wallet;
    }
}

const htlcWalletFromOrder = async (
    wallet: IBaseWallet,
    order: Order,
    user: User,
    contractAddress: string
): Promise<IHTLCWallet> => {
    const atomicSwap =
        user === User.NATIVE
            ? order.initiatorAtomicSwap
            : order.followerAtomicSwap;

    if (wallet.chain() === WalletChain.Bitcoin) {
        return GardenHTLC.from(
            wallet as IBitcoinWallet,
            +atomicSwap.amount,
            order.secretHash,
            atomicSwap.initiatorAddress,
            atomicSwap.redeemerAddress,
            +atomicSwap.timelock
        );
    }

    return wallet.newSwap({
        recipientAddress: atomicSwap.redeemerAddress,
        refundAddress: atomicSwap.initiatorAddress,
        initiatorAddress: atomicSwap.initiatorAddress,
        chain: chainToId[atomicSwap.chain as EvmChain],
        expiryBlocks: +atomicSwap.timelock,
        secretHash: order.secretHash,
        amount: +atomicSwap.amount,
        contractAddress,
    });
};

export enum SwapperRole {
    INITIATOR = 'initiator',
    REDEEMER = 'redeemer',
}

enum User {
    NATIVE = 'native',
    FOREIGN = 'foreign',
}

export enum SwapperActions {
    Init = 'Initiate',
    Redeem = 'Redeem',
    Refund = 'Refund',
    None = 'None',
}
const SwapperAction: Record<Actions, SwapperActions> = {
    [Actions.UserCanInitiate]: SwapperActions.Init,
    [Actions.CounterpartyCanInitiate]: SwapperActions.Init,
    [Actions.UserCanRedeem]: SwapperActions.Redeem,
    [Actions.CounterpartyCanRedeem]: SwapperActions.Redeem,
    [Actions.UserCanRefund]: SwapperActions.Refund,
    [Actions.CounterpartyCanRefund]: SwapperActions.Refund,
    [Actions.NoAction]: SwapperActions.None,
};

export type SwapOutput = {
    user: SwapperRole;
    action: SwapperActions;
    output: string;
};

const DefaultSwapOutput = {
    user: SwapperRole.INITIATOR,
    action: SwapperActions.None,
    output: '',
};
