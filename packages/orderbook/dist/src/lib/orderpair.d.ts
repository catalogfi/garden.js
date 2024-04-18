import { Asset, EvmChain } from './asset';
export declare const orderPairGenerator: (from: Asset, to: Asset) => string;
export declare const chainToId: Record<EvmChain, number>;
export declare const idToChain: Record<number, EvmChain>;
