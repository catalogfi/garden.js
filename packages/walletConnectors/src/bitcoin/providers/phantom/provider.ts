import { IInjectedBitcoinProvider, Network } from "src/bitcoin/bitcoin.types";
import { PhantomBitcoinProvider } from "./phantom.types";
import { AsyncResult, Err, executeWithTryCatch, Ok } from "@catalogfi/utils";

export class PhantomProvider implements IInjectedBitcoinProvider {
  #phantomProvider: PhantomBitcoinProvider;
  public address: string = '';

  constructor(phantomProvider: PhantomBitcoinProvider) {
    this.#phantomProvider = phantomProvider;
  }

  async connect(): AsyncResult<{ address: string; provider: IInjectedBitcoinProvider; network: Network }, string> {
    try {
      await this.#phantomProvider.requestAccounts();

      if (!window.phantom) return Err('phantom wallet not found');
      const provider = new PhantomProvider(window.phantom.bitcoin);
      this.#phantomProvider = provider.#phantomProvider;

      const accounts = await this.#phantomProvider.requestAccounts();
      if (accounts.length > 0) this.address = accounts[0];

      const network = await this.getNetwork();
      if (network.error) return Err('Could not get network:', network.error);

      return Ok({
        address: this.address,
        provider: provider,
        network: network.val,
      });
    } catch(error) {
      return Err('Error while connecting to Phantom wallet:', error);
    }
  }

  // request accounts from wallet; if not connected, connect first
  async requestAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#phantomProvider.requestAccounts();
    }, 'Error while requesting accounts from Phantom wallet');
  }

  // silently get accounts
  async getAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#phantomProvider.requestAccounts();
    }, 'Error while getting accounts from Phantom wallet');
  }

  // bitcoin testnet is not supported in Phantom wallet
  async getNetwork() {
    return Ok(Network.MAINNET);
  }

  async switchNetwork(): AsyncResult<Network, string> {
    return Err("Phantom wallet does not support testnet");
  }

  async getBalance(): AsyncResult<{ confirmed: number; unconfirmed: number; total: number }, string> {
    return await executeWithTryCatch(async () => {
      return await this.#phantomProvider.getBalance();
    }, 'Error while getting balance from OKX wallet');
  }

  async sendBitcoin(toAddress: string, satoshis: number): AsyncResult<string, string> {
    return await executeWithTryCatch(async () => {
      return await this.#phantomProvider.sendBitcoin(toAddress, satoshis);
    }, 'Error while sending bitcoin from Phantom wallet');
  }

  on(event: string, callback: (data: any) => void): void {
    this.#phantomProvider.on(event, callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.#phantomProvider.off(event, callback);
  }

  disconnect = (): AsyncResult<string, string> => {
    this.address = '';
    return Promise.resolve(Ok('Disconnected Phantom wallet'));
  }
}