export declare const Chains: {
    readonly ethereum_sepolia: "ethereum_sepolia";
    readonly ethereum: "ethereum";
    readonly bitcoin: "bitcoin";
    readonly bitcoin_testnet: "bitcoin_testnet";
    readonly bitcoin_regtest: "bitcoin_regtest";
    readonly ethereum_arbitrum: "ethereum_arbitrum";
};
export type Chain = keyof typeof Chains;
export type EvmChain = keyof Omit<typeof Chains, 'bitcoin' | 'bitcoin_testnet' | 'bitcoin_regtest'>;
export type AssetCommon = {
    name: string;
    symbol: string;
    decimals: number;
    chain: Chain;
    isToken: boolean;
    thumbnail: string;
};
export type AssetNative = AssetCommon;
export type AssetToken = AssetCommon & {
    address: string;
    isToken: true;
};
export type Asset = AssetToken | AssetNative;
export declare const Assets: {
    ethereum: {
        WBTC: {
            name: string;
            symbol: string;
            decimals: number;
            chain: "ethereum";
            isToken: boolean;
            thumbnail: string;
            address: string;
        };
    };
    ethereum_sepolia: {
        WBTC: {
            name: string;
            symbol: string;
            decimals: number;
            chain: "ethereum_sepolia";
            isToken: boolean;
            thumbnail: string;
            address: string;
        };
    };
    bitcoin: {
        BTC: {
            name: string;
            symbol: string;
            decimals: number;
            thumbnail: string;
            chain: "bitcoin";
            isToken: boolean;
        };
    };
    bitcoin_testnet: {
        BTC: {
            name: string;
            symbol: string;
            decimals: number;
            thumbnail: string;
            chain: "bitcoin_testnet";
            isToken: boolean;
        };
    };
    ethereum_arbitrum: {
        WBTC: {
            name: string;
            symbol: string;
            decimals: number;
            chain: "ethereum_arbitrum";
            isToken: boolean;
            thumbnail: string;
            address: string;
        };
    };
};
export type ChainData = {
    nativeAsset: Asset;
};
export declare const ChainsData: Record<Chain, ChainData>;
export declare const isMainnet: (chain: Chain) => boolean;
