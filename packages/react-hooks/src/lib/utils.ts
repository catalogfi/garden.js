import { Asset } from '@gardenfi/orderbook';

export const constructOrderpair = (fromAsset: Asset, toAsset: Asset) =>
  `${fromAsset.chain}:${fromAsset.atomicSwapAddress}::${toAsset.chain}:${toAsset.atomicSwapAddress}`;

export const hasAnyValidValue = (obj: Record<string, any>) => {
  return Object.values(obj).some((value) => value !== undefined);
};
