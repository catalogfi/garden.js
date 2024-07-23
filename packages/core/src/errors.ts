export const GardenErrors = {
  WALLET_NOT_FOUND: (from: boolean): string =>
    `${
      from ? 'from' : 'to'
    } asset wallet not found; please pass the wallet associated with the chain of the asset swapping`,

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
