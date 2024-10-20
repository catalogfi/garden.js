import { IInjectedBitcoinProvider, Network } from "../../bitcoin.types";
import { PhantomBitcoinProvider } from "./phantom.types";
import { AsyncResult, Err, executeWithTryCatch, Ok } from "@catalogfi/utils";

export class PhantomProvider implements IInjectedBitcoinProvider {
  #phantomProvider: PhantomBitcoinProvider;
  public address: string = '';

  constructor(phantomProvider: PhantomBitcoinProvider) {
    this.#phantomProvider = phantomProvider;
  }

  async connect(network: Network): AsyncResult<{ address: string; provider: IInjectedBitcoinProvider; network: Network }, string> {
    try {
      const accounts = await this.#phantomProvider.requestAccounts();

      if (!window.phantom) return Err('phantom wallet not found');
      if (accounts.length === 0) return Err('No accounts found');

      const provider = new PhantomProvider(window.phantom.bitcoin);
      this.#phantomProvider = provider.#phantomProvider;

      this.address = accounts[0].address;

      const network = await this.getNetwork();
      if (network.error) return Err('Could not get network: ' + network.error);

      return Ok({
        address: this.address,
        provider: provider,
        network: network.val,
      });
    } catch(error) {
      return Err('Error while connecting to Phantom wallet: ' + error);
    }
  }

  async requestAccounts(): AsyncResult<string[], string> {
    return await executeWithTryCatch(async () => {
      const accounts = await this.#phantomProvider.requestAccounts();
      if (accounts.length > 0) {
        this.address = accounts[0].address;
      }
      return accounts.map(account => account.address);
    }, 'Error while requesting accounts from Phantom wallet');
  }

  async getAccounts(): AsyncResult<string[], string> {
    return this.requestAccounts();
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
    }, 'Error while getting balance from Phantom wallet');
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