export const AddressType = {
  p2pkh: 'p2pkh',
  p2wpkh: 'p2wpkh',
  'p2wpkh-p2sh': 'p2wpkh-p2sh',
} as const;

export type AddressType = typeof AddressType[keyof typeof AddressType];
