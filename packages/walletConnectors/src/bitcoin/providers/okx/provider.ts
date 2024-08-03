import { executeWithTryCatch } from '@catalogfi/utils';
import { IInjectedBitcoinProvider, Network } from '../../bitcoin.types';
import { OKXBitcoinProvider } from './okx.types';

export class OKXProvider implements IInjectedBitcoinProvider {
  #okxProvider: OKXBitcoinProvider;

  constructor(okxProvider: OKXBitcoinProvider) {
    this.#okxProvider = okxProvider;
  }

  async connect() {
    return await executeWithTryCatch(async () => {
      await this.#okxProvider.connect();
    }, 'Error while connecting to the OKX wallet');
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
      if (
        !this.#okxProvider.selectedAccount ||
        !this.#okxProvider.selectedAccount.address
      )
        return 0;
      const response = await this.#okxProvider.getBalance();
      if (!response.confirmed) return 0;
      return response.confirmed;
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
