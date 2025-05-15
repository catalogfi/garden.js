import { sha256, WalletClient } from 'viem';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { Err, EventBroker, Ok, trim0x, with0x } from '@gardenfi/utils';
import { ISecretManager, SecretManagerEvents } from './secretManager.types';

export class SecretManager extends EventBroker<SecretManagerEvents>
  implements ISecretManager {
  private digestKey?: string;
  private walletClient?: WalletClient;

  get isInitialized() {
    return !!this.digestKey;
  }

  private constructor(digestKey?: string, walletClient?: WalletClient) {
    super();
    this.digestKey = digestKey;
    this.walletClient = walletClient;
  }

  static fromDigestKey(digestKey: string) {
    return new SecretManager(trim0x(digestKey));
  }

  static fromWalletClient(walletClient: WalletClient) {
    return new SecretManager(undefined, walletClient);
  }

  async initialize() {
    if (this.digestKey) return Ok('Already initialized');
    const res = await this.deriveDigestKeyFromWalletClient();
    if (res.error) return Err(res.error);
    this.emit('initialized', true);
    return Ok('Initialized');
  }

  private async deriveDigestKeyFromWalletClient() {
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

      this.digestKey = trim0x(sha256(signature));
      this.emit('initialized', true);

      return Ok(this.digestKey);
    } catch (error) {
      return Err('Failed to initialize: ' + error);
    }
  }

  async getDigestKey() {
    if (!this.digestKey && !this.walletClient)
      return Err('No private key or wallet client found');

    if (!this.digestKey && this.walletClient) {
      const digestKey = await this.deriveDigestKeyFromWalletClient();
      if (digestKey.error) {
        return Err(digestKey.error);
      }
    }

    if (!this.digestKey) return Err('No private key found');

    return Ok(this.digestKey);
  }

  async generateSecret(nonce: string) {
    const signature = await this.signMessage(nonce);
    if (signature.error) return Err(signature.error);

    const secret = sha256(with0x(signature.val));
    const secretHash = sha256(secret);
    return Ok({ secret, secretHash });
  }

  private async signMessage(nonce: string) {
    if (!this.digestKey) {
      const digestKey = await this.getDigestKey();
      if (digestKey.error) return Err(digestKey.error);

      this.digestKey = digestKey.val;
    }

    const ECPair = ECPairFactory(ecc);

    const signMessage = 'Garden.fi' + nonce.toString();
    const signMessageBuffer = Buffer.from(signMessage, 'utf8');
    const hash = sha256(signMessageBuffer);

    const digestKeyBuf = Buffer.from(trim0x(this.digestKey), 'hex');
    if (digestKeyBuf.length !== 32) {
      return Err('Invalid private key length. Expected 32 bytes.');
    }
    const keyPair = ECPair.fromPrivateKey(digestKeyBuf);
    const signature = keyPair.sign(Buffer.from(trim0x(hash), 'hex'));
    return Ok(signature.toString('hex'));
  }
}
