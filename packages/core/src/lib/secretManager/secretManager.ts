import { Err, Ok, trim0x } from '@catalogfi/utils';
import { sha256, WalletClient } from 'viem';
import { ECPairFactory } from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { with0x } from '@gardenfi/utils';
import { ISecretManager } from './secretManager.types';

export class SecretManager implements ISecretManager {
  private privKey: string;

  private constructor(privKey: string) {
    this.privKey = privKey;
  }

  static fromPrivKey(privKey: string) {
    return new SecretManager(trim0x(privKey));
  }

  static async fromWalletClient(walletClient: WalletClient) {
    if (!walletClient.account) return Err('No account found');

    try {
      const signature = await walletClient.signTypedData({
        account: walletClient.account,
        types: {
          EIP712Domain: [
            { name: 'name', type: 'string' },
            { name: 'version', type: 'string' },
          ],
          Data: [
            { name: 'Message', type: 'string' },
            { name: 'Version', type: 'string' },
            { name: 'Nonce', type: 'uint256' },
          ],
        },
        domain: {
          name: 'WBTC GARDEN',
          version: '1',
        },
        primaryType: 'Data',
        message: {
          Message: 'Initialize your swap',
          Version: '1.0.2',
          Nonce: 1n,
        },
      });

      return Ok(new SecretManager(trim0x(sha256(signature))));
    } catch (error) {
      return Err('Failed to initialize: ' + error);
    }
  }

  getMasterPrivKey() {
    return this.privKey;
  }

  generateSecret(nonce: number) {
    const signature = this.signMessage(nonce);
    const secret = sha256(with0x(signature));
    const secretHash = sha256(secret);
    return Ok({ secret, secretHash });
  }

  private signMessage(nonce: number) {
    const ECPair = ECPairFactory(ecc);

    const signMessage = 'Garden.fi' + nonce.toString();
    const signMessageBuffer = Buffer.from(signMessage, 'utf8');
    const hash = sha256(signMessageBuffer);

    const privKeyBuf = Buffer.from(trim0x(this.privKey), 'hex');
    if (privKeyBuf.length !== 32) {
      throw new Error('Invalid private key length. Expected 32 bytes.');
    }
    const keyPair = ECPair.fromPrivateKey(privKeyBuf);
    const signature = keyPair.sign(Buffer.from(trim0x(hash), 'hex'));
    return signature.toString('hex');
  }
}
