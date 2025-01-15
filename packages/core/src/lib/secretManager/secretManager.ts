import { AsyncResult, Err, Ok, trim0x } from '@catalogfi/utils';
import { sha256, WalletClient } from 'viem';
import ECPairFactory from 'ecpair';
import * as ecc from 'tiny-secp256k1';
import { EventBroker, IndexedDBStore, with0x } from '@gardenfi/utils';
import { ISecretManager, SecretManagerEvents } from './secretManager.types';

export class SecretManager
  extends EventBroker<SecretManagerEvents>
  implements ISecretManager
{
  private privKey?: string;
  private secretStore: IndexedDBStore;
  private walletClient?: WalletClient;

  get isInitialized() {
    return !!this.privKey;
  }

  private constructor(
    privKey?: string,
    walletClient?: WalletClient,
    store?: IndexedDBStore,
  ) {
    super();
    this.privKey = privKey;
    this.walletClient = walletClient;
    this.secretStore = store ?? new IndexedDBStore();
  }

  static fromPrivKey(privKey: string) {
    return new SecretManager(trim0x(privKey));
  }

  static fromWalletClient(walletClient: WalletClient) {
    return new SecretManager(undefined, walletClient);
  }

  async initialize(): AsyncResult<string, string> {
    if (this.privKey) {
      return Ok('Already initialized');
    }
    try {
      if (this.secretStore.initialize) {
        await this.secretStore.initialize();
      }

      if (this.walletClient?.account && this.secretStore.getAsyncItem) {
        const storedKeyResult = await this.secretStore.getAsyncItem(
          this.walletClient.account.address,
        );

        if (!storedKeyResult.error && storedKeyResult.val) {
          this.privKey = storedKeyResult.val;
          this.emit('initialized', true);
          return Ok('Initialized from stored key');
        }
      }

      const res = await this.derivePrivKeyFromWalletClient();
      if (res.error) {
        return Err(res.error);
      }

      if (this.walletClient?.account && this.privKey) {
        await this.secretStore.setItem(
          this.walletClient.account.address,
          this.privKey,
        );
      }

      this.emit('initialized', true);
      return Ok('Initialized');
    } catch (error) {
      return Err('Failed to initialize storage: ' + error);
    }
  }

  private async derivePrivKeyFromWalletClient() {
    if (!this.walletClient) {
      return Err('No walletClient found');
    }
    if (!this.walletClient.account) {
      return Err('No account found');
    }

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
      console.log('Signature derived:', signature);
      this.privKey = trim0x(sha256(signature));
      this.emit('initialized', true);

      console.log('Private key derived:', this.privKey);
      return Ok(this.privKey);
    } catch (error) {
      console.error('Error during private key derivation:', error);
      return Err('Failed to initialize: ' + error);
    }
  }

  async getMasterPrivKey() {
    console.log('Getting master private key...');
    if (!this.privKey && !this.walletClient) {
      return Err('No private key or wallet client found');
    }

    if (!this.privKey && this.walletClient?.account) {
      const storedKey = await this.secretStore.getItem(
        this.walletClient.account.address,
      );
      if (storedKey) {
        this.privKey = storedKey;
        return Ok(this.privKey);
      }
    }

    if (!this.privKey && this.walletClient) {
      const privKey = await this.derivePrivKeyFromWalletClient();
      if (privKey.error) {
        console.error('Error deriving private key:', privKey.error);
        return Err(privKey.error);
      }
      if (this.walletClient.account && this.privKey) {
        await this.secretStore.setItem(
          this.walletClient.account.address,
          this.privKey,
        );
        console.log('Stored derived private key');
      }
    }

    if (!this.privKey) {
      return Err('No private key found');
    }
    console.log('Master private key:', this.privKey);
    return Ok(this.privKey);
  }

  async generateSecret(nonce: number) {
    const signature = await this.signMessage(nonce);
    if (signature.error) {
      console.error('Error signing message:', signature.error);
      return Err(signature.error);
    }

    const secret = sha256(with0x(signature.val));
    const secretHash = sha256(secret);
    console.log('Generated secret:', secret);
    console.log('Generated secret hash:', secretHash);
    return Ok({ secret, secretHash });
  }

  private async signMessage(nonce: number) {
    console.log('Signing message with nonce:', nonce);
    if (!this.privKey) {
      console.log('No private key found, retrieving master private key...');
      const privKey = await this.getMasterPrivKey();
      if (privKey.error) {
        console.error('Error getting master private key:', privKey.error);
        return Err(privKey.error);
      }

      this.privKey = privKey.val;
    }

    const ECPair = ECPairFactory(ecc);
    const signMessage = 'Garden.fi' + nonce.toString();
    const signMessageBuffer = Buffer.from(signMessage, 'utf8');
    const hash = sha256(signMessageBuffer);

    const privKeyBuf = Buffer.from(trim0x(this.privKey), 'hex');
    if (privKeyBuf.length !== 32) {
      console.error('Invalid private key length. Expected 32 bytes.');
      return Err('Invalid private key length. Expected 32 bytes.');
    }
    const keyPair = ECPair.fromPrivateKey(privKeyBuf);
    const signature = keyPair.sign(Buffer.from(trim0x(hash), 'hex'));
    return Ok(signature.toString('hex'));
  }
}
