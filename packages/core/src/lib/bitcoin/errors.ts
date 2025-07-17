export const BWErrors = {
  INVALID_PK: 'invalid private key',
  FEE_EXCEEDS_AMOUNT: (fee: number, amt: number) =>
    `fee exceeds amount: fee: ${fee} > amount: ${amt}`,
  SWAP_NOT_FOUND: 'swap config not found, please set the swap config first',
  SCRIPT_NOT_FUNDED: 'script not funded',
  SWAP_NOT_EXPIRED: (expiry: number) =>
    `swap not expired. Need ${expiry} more blocks`,
  MIN_AMOUNT: (minAmt: number) =>
    `amount is too low. Minimum amount is ${minAmt}`,
  INSUFFICIENT_FUNDS: (actual: number, expected: number) =>
    `insufficient funds, need ${expected} but got ${actual}`,
  AmtPlusFeeExceedsBalance: (amt: number, fee: number, balance: number) =>
    `amount + fee exceeds balance. Need ${amt + fee} but got ${balance}`,
};

export const BitcoinHTLCErrors = {
  INVALID_SECRET_HASH: 'invalid secret hash',
  INVALID_PUBKEY_OR_SECRET: 'invalid public key or secret',
  INVALID_PUBKEY: 'invalid public key',
  ORDER_NOT_EXPIRED: 'you cannot refund before your transaction expires',
};
