import { IBaseWallet } from "@catalogfi/wallets";
import { Chain } from "@gardenfi/orderbook";
export declare const computeSecret: (fromChain: Chain, toChain: Chain, wallets: Partial<Record<Chain, IBaseWallet>>, nonce: number) => Promise<string>;
export declare const isFromChainBitcoin: (chain: Chain) => boolean;
