import { crypto } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { xOnlyPubkey } from './utils';

// All these values are taken from bip341

const G_X = Buffer.from(
    '79be667ef9dcbbac55a06295ce870b07029bfcdb2dce28d959f2815b16f81798',
    'hex'
);
const G_Y = Buffer.from(
    '483ada7726a3c4655da4fbfc0e1108a8fd17b448a68554199c47d08ffb10d4b8',
    'hex'
);

const G = Buffer.concat([G_X, G_Y]);

const H = Buffer.from(
    '0250929b74c1a04954b78b4b6035e97a5e078a5a0f28ec96d547bfee9ace803ac0',
    'hex'
);

const errors = {
    failedToCreateInternalPubkey: 'failed to create internal pubkey',
    failedToTweakPubkey: 'failed to tweak pubkey',
};

/**
 * Generates NUMS internal key
 *
 * Uses Standard ECDSA secp256k1 curve's G point
 */
export function generateInternalkey() {
    const hash = crypto.sha256(Buffer.from('GardenHTLC', 'utf-8'));
    const R = ecc.pointMultiply(
        Buffer.concat([Buffer.from('04', 'hex'), G]),
        hash
    );

    if (!R) {
        throw new Error(errors.failedToCreateInternalPubkey);
    }

    const internalPubKey = ecc.pointAdd(H, R);
    if (!internalPubKey) throw new Error(errors.failedToCreateInternalPubkey);

    return xOnlyPubkey(Buffer.from(internalPubKey));
}

export function tweakPubkey(pubkey: Buffer, hash: Buffer) {
    const tweak = crypto.taggedHash('TapTweak', Buffer.concat([pubkey, hash]));
    const tweakedPubKey = ecc.xOnlyPointAddTweak(pubkey, tweak);

    if (!tweakedPubKey) {
        throw new Error(errors.failedToTweakPubkey);
    }

    return tweakedPubKey;
}
