import { UnisatBitcoinProvider } from './unisat.types';
import { executeWithTryCatch } from '@catalogfi/utils';
import { IInjectedBitcoinProvider, Network } from '../../bitcoin.types';

export class UnisatProvider implements IInjectedBitcoinProvider {
  #unisatProvider: UnisatBitcoinProvider;

  constructor(unisatProvider: UnisatBitcoinProvider) {
    this.#unisatProvider = unisatProvider;
  }

  async connect() {
    return await executeWithTryCatch(async () => {
      await this.#unisatProvider.requestAccounts();
    }, 'Error while connecting to the Unisat wallet');
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
      if (!response.confirmed) return 0;
      return response.confirmed;
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
