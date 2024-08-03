import { UnisatBitcoinProvider } from './unisat.types';
import { Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import {
  Balance,
  IInjectedBitcoinProvider,
  Network,
} from '../../bitcoin.types';

export class UnisatProvider implements IInjectedBitcoinProvider {
  #unisatProvider: UnisatBitcoinProvider;
  public address: string = '';
  public publicKey: string = '';

  constructor(unisatProvider: UnisatBitcoinProvider) {
    this.#unisatProvider = unisatProvider;
  }

  async connect() {
    try {
      await this.#unisatProvider.requestAccounts();

      if (!window.unisat) return Err('unisat wallet not found');
      const provider = new UnisatProvider(window.unisat);
      this.#unisatProvider = provider.#unisatProvider;

      const accounts = await this.#unisatProvider.getAccounts();
      if (accounts.length > 0) this.address = accounts[0];

      const pubKey = await this.#unisatProvider.getPublicKey();
      if (pubKey) this.publicKey = pubKey;

      const network = await this.getNetwork();
      if (network.error) return Err('Could not get network', network.error);

      return Ok({
        address: this.address,
        publicKey: this.publicKey,
        provider: provider,
        network: network.val,
      });
    } catch (error) {
      return Err('Error while connecting to the Unisat wallet', error);
    }
  }

  // requests accounts from the wallet, if not connected, it will connect first
  async requestAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#unisatProvider.requestAccounts();
    }, 'Error while requesting accounts from the Unisat wallet');
  }

  //silently gets accounts if already connected
  async getAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#unisatProvider.getAccounts();
    }, 'Error while getting accounts from the Unisat wallet');
  }

  async getNetwork() {
    return await executeWithTryCatch(async () => {
      const network = await this.#unisatProvider.getNetwork();
      if (network === 'livenet') return Network.MAINNET;
      return Network.TESTNET;
    }, 'Error while getting network from Unisat wallet');
  }

  async getBalance() {
    return await executeWithTryCatch(async () => {
      const response = await this.#unisatProvider.getBalance();
      return response;
    }, 'Error while getting balance from Unisat wallet');
  }

  async sendBitcoin(toAddress: string, satoshis: number) {
    return await executeWithTryCatch(async () => {
      return await this.#unisatProvider.sendBitcoin(toAddress, satoshis);
    }, 'Error while sending bitcoin from Unisat wallet');
  }

  on(event: string, callback: (data: any) => void) {
    this.#unisatProvider.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.#unisatProvider.removeListener(event, callback);
  }
}
