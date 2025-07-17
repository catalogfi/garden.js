import { Transaction } from 'bitcoinjs-lib';
import { mixed } from 'yup';
export type SigHashType = number;
type SignatureType = 'segwitV0' | 'segwitV1' | 'p2shSignature';

export const SigHashType = {
  ALL: Transaction.SIGHASH_ALL,
  NONE: Transaction.SIGHASH_NONE,
  SINGLE: Transaction.SIGHASH_SINGLE,
  ALL_ANYONECANPAY: Transaction.SIGHASH_ALL | Transaction.SIGHASH_ANYONECANPAY,
  NONE_ANYONECANPAY:
    Transaction.SIGHASH_NONE | Transaction.SIGHASH_ANYONECANPAY,
  SINGLE_ANYONECANPAY:
    Transaction.SIGHASH_SINGLE | Transaction.SIGHASH_ANYONECANPAY,
} as const;

export class AddSignature {
  _scriptType: SignatureType;
  _sigHashType: SigHashType;
  constructor(type: SignatureType, sigHashType: SigHashType) {
    this._scriptType = type;
    this._sigHashType = sigHashType;
  }

  get scriptType() {
    return this._scriptType;
  }
  get sigHashType() {
    return this._sigHashType;
  }

  toString() {
    return `${this._scriptType} ${this._sigHashType}`;
  }

  static async fromString(str: string) {
    const [sigType, sigHashType] = str.split(' ');
    const validatedSigType = await mixed<SignatureType>()
      .oneOf(['segwitV0', 'segwitV1', 'p2shSignature'])
      .required()
      .validate(sigType);

    const validatedSigHashType = await mixed<SigHashType>()
      .oneOf(Object.values(SigHashType))
      .required()
      .validate(parseInt(sigHashType));

    return new AddSignature(validatedSigType, validatedSigHashType);
  }
}
