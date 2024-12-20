import { Err, Ok, trim0x } from '@catalogfi/utils';
import { sha256, WalletClient } from 'viem';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { with0x } from '@gardenfi/utils';
import { ISecretManager } from './secretManager.types';

export class SecretManager implements ISecretManager {
  private privKey?: string;
  private walletClient?: WalletClient;

  get isInitialized() {
    return !!this.privKey;
  }

  private constructor(privKey?: string, walletClient?: WalletClient) {
    this.privKey = privKey;
    this.walletClient = walletClient;
  }

  static fromPrivKey(privKey: string) {
    return new SecretManager(trim0x(privKey));
  }

  static fromWalletClient(walletClient: WalletClient) {
    return new SecretManager(undefined, walletClient);
  }

  async initialize() {
    if (this.privKey) return Ok('Already initialized');
    const res = await this.derivePrivKeyFromWalletClient();
    if (res.error) return Err(res.error);
    return Ok('Initialized');
  }

  private async derivePrivKeyFromWalletClient() {
    if (!this.walletClient) return Err('No walletClient found');
    if (!this.walletClient.account) return Err('No account found');

    try {
      const signature = await this.walletClient.signTypedData({
        account: this.walletClient.account,
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
          name: 'GARDEN FINANCE',
          version: '1',
        },
        primaryType: 'Data',
        message: {
          Message: 'Initialize your account',
          Version: '1.0.2',
          Nonce: 1n,
        },
      });

      return Ok(trim0x(sha256(signature)));
    } catch (error) {
      return Err('Failed to initialize: ' + error);
    }
  }

  async getMasterPrivKey() {
    if (!this.privKey && !this.walletClient)
      return Err('No private key or wallet client found');

    if (!this.privKey && this.walletClient) {
      const privKey = await this.derivePrivKeyFromWalletClient();
      if (privKey.error) {
        return Err(privKey.error);
      }
      this.privKey = privKey.val;
    }

    if (!this.privKey) return Err('No private key found');

    return Ok(this.privKey);
  }

  async generateSecret(nonce: number) {
    const signature = await this.signMessage(nonce);
    if (signature.error) return Err(signature.error);

    const secret = sha256(with0x(signature.val));
    const secretHash = sha256(secret);
    return Ok({ secret, secretHash });
  }

  private async signMessage(nonce: number) {
    if (!this.privKey) {
      const privKey = await this.getMasterPrivKey();
      if (privKey.error) return Err(privKey.error);

      this.privKey = privKey.val;
    }

    const ECPair = ECPairFactory(ecc);

    const signMessage = 'Garden.fi' + nonce.toString();
    const signMessageBuffer = Buffer.from(signMessage, 'utf8');
    const hash = sha256(signMessageBuffer);

    const privKeyBuf = Buffer.from(trim0x(this.privKey), 'hex');
    if (privKeyBuf.length !== 32) {
      return Err('Invalid private key length. Expected 32 bytes.');
    }
    const keyPair = ECPair.fromPrivateKey(privKeyBuf);
    const signature = keyPair.sign(Buffer.from(trim0x(hash), 'hex'));
    return Ok(signature.toString('hex'));
  }
}
