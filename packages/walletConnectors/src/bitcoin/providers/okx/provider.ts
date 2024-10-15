import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { IInjectedBitcoinProvider, Network } from '../../bitcoin.types';
import { OKXBitcoinProvider } from './okx.types';

export class OKXProvider implements IInjectedBitcoinProvider {
  #mainnetProvider: OKXBitcoinProvider;
  #testnetProvider: OKXBitcoinProvider;
  #currentNetwork: Network;
  public address: string = '';

  constructor(mainnetProvider: OKXBitcoinProvider, testnetProvider: OKXBitcoinProvider) {
    this.#mainnetProvider = mainnetProvider;
    this.#testnetProvider = testnetProvider;
    this.#currentNetwork = Network.MAINNET;  // Default to mainnet
  }

  get #currentProvider(): OKXBitcoinProvider {
    return this.#currentNetwork === Network.MAINNET ? this.#mainnetProvider : this.#testnetProvider;
  }

  async connect(): AsyncResult<{ address: string; provider: IInjectedBitcoinProvider; network: Network }, string> {
    try {
      const result = await this.#currentProvider.connect();
      if (!result || !result.address) {
        return Err('Failed to connect to OKX wallet');
      }
      this.address = result.address;
      
      return Ok({
        address: this.address,
        provider: this,
        network: this.#currentNetwork,
      });
    } catch (error) {
      return Err('Error while connecting to the OKX wallet', error);
    }
  }

  async getPublicKey(): AsyncResult<string, string> {
    return await executeWithTryCatch(async () => {
      return await this.#currentProvider.getPublicKey();
    }, 'Error while getting public key from OKX wallet');
  }

  async requestAccounts(): AsyncResult<string[], string> {
    const connectResult = await this.connect();
    if (connectResult.error) {
      return Err(connectResult.error);
    }
    return Ok([connectResult.val.address]);
  }

  async getAccounts(): AsyncResult<string[], string> {
    if (this.#currentNetwork === Network.TESTNET) {
      return await this.requestAccounts();
    }
    return await executeWithTryCatch(async () => {
      return await this.#mainnetProvider.getAccounts();
    }, 'Error while getting accounts from OKX wallet');
  }

  async getNetwork(): AsyncResult<Network, string> {
    return Ok(this.#currentNetwork);
  }

  async switchNetwork(): AsyncResult<Network, string> {
    this.#currentNetwork = this.#currentNetwork === Network.MAINNET ? Network.TESTNET : Network.MAINNET;
    // Re-connect with the new network provider
    const connectResult = await this.connect();
    if (connectResult.error) {
      return Err(`Failed to connect to ${this.#currentNetwork}: ${connectResult.error}`);
    }
    return Ok(this.#currentNetwork);
  }

  async getBalance(): AsyncResult<{ confirmed: number; unconfirmed: number; total: number }, string> {
    return await executeWithTryCatch(async () => {
      return await this.#currentProvider.getBalance();
    }, 'Error while getting balance from OKX wallet');
  }

  async sendBitcoin(toAddress: string, satoshis: number): AsyncResult<string, string> {
    return await executeWithTryCatch(async () => {
      return await this.#currentProvider.sendBitcoin(toAddress, satoshis);
    }, 'Error while sending bitcoin from OKX wallet');
  }

  on(event: string, callback: (data: any) => void): void {
    this.#mainnetProvider.on(event, callback);
    this.#testnetProvider.on(event, callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.#mainnetProvider.off(event, callback);
    this.#testnetProvider.off(event, callback);
  }
}