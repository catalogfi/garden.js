export declare const CatalogErrors: {
    WALLET_NOT_FOUND: (from: boolean) => string;
    CHAIN_WALLET_NOT_FOUND: (blockchain: 'EVM' | 'Bitcoin') => string;
};
export declare const SwapperErrors: {
    NO_ACTION: string;
    NO_SECRET: string;
    INVALID_ACTION: (action: 'init' | 'redeem' | 'refund', status: number) => string;
};
