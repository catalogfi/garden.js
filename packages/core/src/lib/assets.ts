// Enhanced types for IntelliSense support
type ExtractSymbolsFromAssets<T extends Record<string, AssetConfig>> = {
  [K in T[keyof T]['symbol']]: Extract<T[keyof T], { symbol: K }>;
};

// Enhanced chain wrapper with IntelliSense support
class EnhancedChainAssets<T extends Record<string, AssetConfig>> {
  private tokensBySymbol: ExtractSymbolsFromAssets<T>;
  private originalTokensByAddress: T;

  constructor(tokens: T) {
    this.originalTokensByAddress = tokens;

    // Build symbol-based lookup for IntelliSense
    this.tokensBySymbol = Object.values(tokens).reduce((acc, token) => {
      (acc as any)[token.symbol] = token;
      return acc;
    }, {} as ExtractSymbolsFromAssets<T>);
  }

  // Symbol-based access with full IntelliSense
  get symbols(): ExtractSymbolsFromAssets<T> {
    return this.tokensBySymbol;
  }

  // Address-based access (your original flattened structure)
  get byAddress(): T {
    return this.originalTokensByAddress;
  }

  // Convenience method for case-insensitive address lookup
  getByAddress(address: string): AssetConfig | undefined {
    return this.originalTokensByAddress[address.toLowerCase()];
  }

  // Get token by symbol
  getBySymbol(symbol: string): AssetConfig | undefined {
    return (this.tokensBySymbol as any)[symbol];
  }

  // Get all tokens as array
  get all(): AssetConfig[] {
    return Object.values(this.originalTokensByAddress);
  }

  // Search functionality
  search(query: string): AssetConfig[] {
    const lowerQuery = query.toLowerCase();
    return this.all.filter(
      (token) =>
        token.symbol.toLowerCase().includes(lowerQuery) ||
        token.name.toLowerCase().includes(lowerQuery) ||
        token.tokenAddress.toLowerCase().includes(lowerQuery),
    );
  }

  // Check if symbol exists
  hasSymbol(symbol: string): boolean {
    return symbol in this.tokensBySymbol;
  }

  // Check if address exists
  hasAddress(address: string): boolean {
    return address.toLowerCase() in this.originalTokensByAddress;
  }
}

// Enhanced assets wrapper with IntelliSense
type EnhancedAssetsWrapper<TData extends FlattenedAssets> = {
  [K in keyof TData]: TData[K] extends Record<string, AssetConfig>
    ? EnhancedChainAssets<TData[K]>
    : never;
} & {
  // Utility methods
  getChain<K extends keyof TData>(
    chainId: K,
  ): TData[K] extends Record<string, AssetConfig>
    ? EnhancedChainAssets<TData[K]>
    : never;
  getAllChains(): (keyof TData)[];
  findTokenAcrossChains(symbolOrAddress: string): Array<{
    chain: keyof TData;
    token: AssetConfig;
  }>;
  // Your original flattened structure for backward compatibility
  raw: TData;
};

// Factory function to create enhanced assets wrapper
function createEnhancedAssetsWrapper<TData extends FlattenedAssets>(
  data: TData,
): EnhancedAssetsWrapper<TData> {
  const chains = {} as any;

  // Create EnhancedChainAssets for each chain
  for (const [chainId, tokens] of Object.entries(data)) {
    if (tokens) {
      chains[chainId] = new EnhancedChainAssets(tokens);
    }
  }

  // Add utility methods
  chains.getChain = function <K extends keyof TData>(chainId: K) {
    return chains[chainId];
  };

  chains.getAllChains = function (): (keyof TData)[] {
    return Object.keys(data);
  };

  chains.findTokenAcrossChains = function (symbolOrAddress: string): Array<{
    chain: keyof TData;
    token: AssetConfig;
  }> {
    const results: Array<{ chain: keyof TData; token: AssetConfig }> = [];
    const isAddress =
      symbolOrAddress.startsWith('0x') || symbolOrAddress.length > 10;

    for (const [chainId, chainAssets] of Object.entries(chains)) {
      if (typeof chainAssets !== 'object' || !chainAssets.getByAddress)
        continue;

      let token: AssetConfig | undefined;
      if (isAddress) {
        token = chainAssets.getByAddress(symbolOrAddress);
      } else {
        token = chainAssets.getBySymbol(symbolOrAddress);
      }

      if (token) {
        results.push({ chain: chainId as keyof TData, token });
      }
    }

    return results;
  };

  // Keep raw data for backward compatibility
  chains.raw = data;

  return chains;
}

// Your existing SDK class with enhancements
export class BlockchainAssetsSDK {
  private cache: Map<string, EnhancedAssetsWrapper<any>> = new Map();

  constructor(private _api?: any, private environment?: any) {}

  private isChain(value: string): value is Chain {
    return value in Chains;
  }

  private flattenSupportedAssets(
    assets: Partial<SupportedAssetsResponse>,
  ): FlattenedAssets {
    const flattened: FlattenedAssets = {};

    for (const [networkId, network] of Object.entries(assets)) {
      if (!this.isChain(networkId) || !network) continue;

      const tokenMap: Record<string, AssetConfig> = {};

      for (const asset of network.assetConfig) {
        tokenMap[asset.tokenAddress.toLowerCase()] = asset;
      }

      flattened[networkId] = tokenMap;
    }

    return flattened;
  }

  // Enhanced version of your supportedAssets method
  async supportedAssets(
    network?: any,
  ): Promise<EnhancedAssetsWrapper<FlattenedAssets>> {
    const cacheKey = `assets_${network || this.environment}`;

    const api = this._api?.info;
    const endpoint = new (URL as any)(api!)
      .endpoint('assets')
      .endpoint(
        network
          ? network === 'MAINNET'
            ? 'mainnet'
            : 'testnet'
          : this.environment === 'MAINNET'
          ? 'mainnet'
          : 'testnet',
      );

    try {
      // Simulated fetch - replace with your actual Fetcher.get
      const res = await this.fetchAssets<SupportedAssetsResponse>(endpoint);

      const filtered: Partial<SupportedAssetsResponse> = {};

      for (const [key, network] of Object.entries(res)) {
        if (network.disabled || !this.isChain(key)) continue;

        const enabledAssets = Array.isArray(network.assetConfig)
          ? network.assetConfig.filter((asset) => !asset.disabled)
          : [];

        if (enabledAssets.length > 0) {
          filtered[key as Chain] = {
            ...network,
            assetConfig: enabledAssets,
          };
        }
      }

      const flattened = this.flattenSupportedAssets(filtered);
      const enhanced = createEnhancedAssetsWrapper(flattened);

      return enhanced;
    } catch (error) {
      console.error('Error fetching supported assets:', error);
      return createEnhancedAssetsWrapper({});
    }
  }

  // Placeholder for your actual fetch implementation
  private async fetchAssets<T>(endpoint: any): Promise<T> {
    // Replace this with your actual Fetcher.get implementation
    const response = await fetch(endpoint.toString());
    return response.json();
  }
}

export default BlockchainAssetsSDK;
