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
    status: number,
  ): string => `can not ${action} on status: ${status}`,
};

export const htlcErrors = {
  secretMismatch: 'invalid secret',
  secretHashLenMismatch: 'secret hash should be 32 bytes',
  pubkeyLenMismatch: 'pubkey should be 32 bytes',
  zeroOrNegativeExpiry: 'expiry should be greater than 0',
  htlcAddressGenerationFailed: 'failed to generate htlc address',
  notFunded: 'address not funded',
  noCounterpartySigs: 'counterparty signatures are required',
  counterPartySigNotFound: (utxo: string) =>
    'counterparty signature not found for utxo ' + utxo,
  invalidCounterpartySigForUTXO: (utxo: string) =>
    'invalid counterparty signature for utxo ' + utxo,
  htlcNotExpired: (blocks: number) =>
    `HTLC not expired, need more ${blocks} blocks`,
  controlBlockGenerationFailed: 'failed to generate control block',
  invalidLeaf: 'invalid leaf',
};
