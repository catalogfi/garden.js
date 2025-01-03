import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { Connect, IInjectedBitcoinProvider } from '../../bitcoin.types';
import { OKXBitcoinProvider } from './okx.types';
import { Network } from '@gardenfi/utils';
import { WALLET_CONFIG } from './../../constants';

export class OKXProvider implements IInjectedBitcoinProvider {
  #provider: OKXBitcoinProvider;
  #network: Network;
  public address: string = '';
  public id = WALLET_CONFIG.OKX.id;
  public name = WALLET_CONFIG.OKX.name;
  public icon = WALLET_CONFIG.OKX.icon;
  
  constructor(provider: OKXBitcoinProvider, network: Network) {
    this.#provider = provider;
    this.#network = network;
  }

  async connect(): AsyncResult<Connect, string> {
    try {
      const result = await this.#provider.connect();
      if (!result || !result.address) {
        return Err('Failed to connect to OKX wallet');
      }
      this.address = result.address;

      return Ok({
        address: this.address,
        provider: this,
        network: this.#network,
        id: WALLET_CONFIG.OKX.id,
      });
    } catch (error) {
      return Err('Error while connecting to the OKX wallet', error);
    }
  }

  async getPublicKey(): AsyncResult<string, string> {
    return await executeWithTryCatch(async () => {
      return await this.#provider.getPublicKey();
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
    if (this.#network === Network.TESTNET) {
      return await this.requestAccounts();
    }
    return await executeWithTryCatch(async () => {
      return await this.#provider.getAccounts();
    }, 'Error while getting accounts from OKX wallet');
  }

  async getNetwork(): AsyncResult<Network, string> {
    return Ok(this.#network);
  }

  async switchNetwork(): AsyncResult<Network, string> {
    this.#network =
      this.#network === Network.MAINNET ? Network.TESTNET : Network.MAINNET;
    // Re-connect with the new network provider
    const connectResult = await this.connect();
    if (connectResult.error) {
      return Err(
        `Failed to connect to ${this.#network}: ${connectResult.error}`,
      );
    }
    return Ok(this.#network);
  }

  async getBalance(): AsyncResult<
    { confirmed: number; unconfirmed: number; total: number },
    string
  > {
    return await executeWithTryCatch(async () => {
      return await this.#provider.getBalance();
    }, 'Error while getting balance from OKX wallet');
  }

  async sendBitcoin(
    toAddress: string,
    satoshis: number,
  ): AsyncResult<string, string> {
    return await executeWithTryCatch(async () => {
      return await this.#provider.sendBitcoin(toAddress, satoshis);
    }, 'Error while sending bitcoin from OKX wallet');
  }

  on(event: 'accountsChanged', callback: (data: string[]) => void): void {
    this.#provider.on(event, callback);
  }

  off(event: 'accountsChanged', callback: (data: string[]) => void): void {
    this.#provider.off(event, callback);
  }

  disconnect = (): AsyncResult<string, string> => {
    this.address = '';
    this.#provider.disconnect();
    return Promise.resolve(Ok('Disconnected OKX wallet'));
  };
}
