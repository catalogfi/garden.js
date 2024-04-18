export const CatalogErrors = {
  WALLET_NOT_FOUND: (from: boolean): string =>
    `${from ? 'from' : 'to'} wallet not found`,

  CHAIN_WALLET_NOT_FOUND: (blockchain: 'EVM' | 'Bitcoin'): string =>
    `no ${blockchain} wallet found`,
};

export const SwapperErrors = {
  NO_ACTION: 'no actions can be performed in this state',
  NO_SECRET: 'secret not found in order',
  INVALID_ACTION: (
    action: 'init' | 'redeem' | 'refund',
    status: number
  ): string => `can not ${action} on status: ${status}`,
};
