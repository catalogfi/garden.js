import { Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { IInjectedBitcoinProvider, Network } from '../../bitcoin.types';
import { OKXBitcoinProvider } from './okx.types';

export class OKXProvider implements IInjectedBitcoinProvider {
  #okxProvider: OKXBitcoinProvider;
  public address: string = '';
  public publicKey: string = '';

  constructor(okxProvider: OKXBitcoinProvider) {
    this.#okxProvider = okxProvider;
  }

  async connect() {
    try {
      const result = await this.#okxProvider.connect();
      this.address = result.address;
      this.publicKey = result.publicKey;

      if (!window.okxwallet || !window.okxwallet.bitcoin)
        return Err('OKX wallet not found');

      const provider = new OKXProvider(window.okxwallet.bitcoin);
      this.#okxProvider = provider.#okxProvider;

      const network = await this.getNetwork();
      if (network.error) return Err('Could not get network', network.error);

      return Ok({
        address: this.address,
        publicKey: this.publicKey,
        provider: provider,
        network: network.val,
      });
    } catch (error) {
      return Err('Error while connecting to the OKX wallet', error);
    }
  }

  async getPublicKey() {
    return await executeWithTryCatch(async () => {
      return await this.#okxProvider.getPublicKey();
    }, 'Error while getting public key from OKX wallet');
  }

  // requests accounts from the wallet, if not connected, it will connect first
  async requestAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#okxProvider.requestAccounts();
    }, 'Error while requesting accounts from the OKX wallet');
  }
  //silently gets accounts if already connected
  async getAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#okxProvider.getAccounts();
    }, 'Error while getting accounts from the OKX wallet');
  }

  async getNetwork() {
    return await executeWithTryCatch(async () => {
      const network = await this.#okxProvider.getNetwork();
      if (network === 'livenet') return Network.MAINNET;
      return Network.TESTNET;
    }, 'Error while getting network from OKX wallet');
  }

  async getBalance() {
    return await executeWithTryCatch(async () => {
      const response = await this.#okxProvider.getBalance();
      return response;
    }, 'Error while getting balance from OKX wallet');
  }

  async sendBitcoin(toAddress: string, satoshis: number) {
    return await executeWithTryCatch(async () => {
      return await this.#okxProvider.sendBitcoin(toAddress, satoshis);
    }, 'Error while sending bitcoin from OKX wallet');
  }

  on(event: string, callback: (data: any) => void) {
    return this.#okxProvider.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    return this.#okxProvider.off(event, callback);
  }
}
