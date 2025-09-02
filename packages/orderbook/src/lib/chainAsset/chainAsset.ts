import { Network } from '@gardenfi/utils';
import {
  Asset,
  BlockchainType,
  Chain,
  Chains,
  ChainsConfig,
  getBlockchainType,
} from '../asset';
import { SupportedAssets } from '../constants';

export type ChainAssetString = `${Chain}:${string}`;

export class ChainAsset extends String {
  constructor(chain: Chain, symbol: string) {
    const formatted =
      `${chain.toLowerCase()}:${symbol.toLowerCase()}` as ChainAssetString;
    super(formatted);
  }

  static from(asset: Asset | ChainAssetString | ChainAsset): ChainAsset {
    if (asset instanceof ChainAsset) {
      return asset;
    }
    if (typeof asset === 'string') {
      return ChainAsset.fromString(asset);
    }
    return ChainAsset.fromAsset(asset);
  }

  static fromChainAndSymbol(chain: Chain, symbol: string): ChainAsset {
    return new ChainAsset(chain, symbol);
  }

  static fromString(formatted: ChainAssetString): ChainAsset {
    const [chain, symbol] = formatted.split(':');
    if (!(chain in Chains)) {
      throw new Error(`Invalid chain in asset string: ${chain}`);
    }

    return new ChainAsset(chain as Chain, symbol);
  }

  static fromAsset(asset: Asset): ChainAsset {
    return new ChainAsset(asset.chain, asset.symbol);
  }

  getChain(): Chain {
    return this.toString().split(':')[0] as Chain;
  }

  getSymbol(): string {
    return this.toString().split(':')[1];
  }

  getNetwork(): Network {
    return ChainsConfig[this.getChain()].network;
  }

  getBlockchainType(): BlockchainType {
    return getBlockchainType(this.getChain());
  }

  getAsset(): Asset {
    return SupportedAssets[this.getNetwork()][
      this.getChain() as keyof (typeof SupportedAssets)[Network]
    ][this.getSymbol()];
  }

  override toString() {
    return super.toString();
  }

  // For clean console.log output
  [Symbol.for('nodejs.util.inspect.custom')]() {
    return this.toString();
  }

  // For JSON serialization (API calls, etc.)
  toJSON() {
    return this.toString();
  }
}
