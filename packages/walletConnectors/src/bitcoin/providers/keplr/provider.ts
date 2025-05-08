import { Connect, IInjectedBitcoinProvider } from 'src/bitcoin/bitcoin.types';
import { KeplrBitcoinChainType, KeplrBitcoinProvider } from './keplr.types';
import { WALLET_CONFIG } from '../../constants';
import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { Network } from '@gardenfi/utils';

export class KeplrProvider implements IInjectedBitcoinProvider {
  #keplrProvider: KeplrBitcoinProvider;
  public address: string = '';
  public id = WALLET_CONFIG.Keplr.id;
  public name = WALLET_CONFIG.Keplr.name;
  public icon = WALLET_CONFIG.Keplr.icon;

  constructor(provider: KeplrBitcoinProvider) {
    this.#keplrProvider = provider;
  }

  async connect(network?: Network): AsyncResult<Connect, string> {
    if (!network) network = Network.MAINNET;
    if (network === Network.TESTNET) {
      return Err('Keplr wallet does not support testnet4');
    }
    try {
      const accounts = await this.#keplrProvider.requestAccounts();
      if (accounts.length > 0) this.address = accounts[0];

      return Ok({
        address: this.address,
        provider: this,
        network: network,
        id: WALLET_CONFIG.Keplr.id,
      });
    } catch (error) {
      return Err('Error while connecting to the Keplr wallet', error);
    }
  }

  async requestAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#keplrProvider.requestAccounts();
    }, 'Error while requesting accounts from the Keplr wallet');
  }

  async getAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#keplrProvider.getAccounts();
    }, 'Error while getting accounts from the Keplr wallet');
  }

  async getNetwork() {
    return await executeWithTryCatch(async () => {
      const network = await this.#keplrProvider.getChain();
      if (network.enum === KeplrBitcoinChainType.MAINNET)
        return Network.MAINNET;
      else if (network.enum === KeplrBitcoinChainType.TESTNET)
        return Network.TESTNET;
      throw new Error('Invalid or unsupported network' + network.enum);
    }, 'Error while getting network from the Keplr wallet');
  }

  async switchNetwork(): AsyncResult<Network, string> {
    return Err('Keplr wallet does not support testnet4');
  }

  async getBalance() {
    return await executeWithTryCatch(async () => {
      const response = await this.#keplrProvider.getBalance();
      return response;
    }, 'Error while getting balance from Keplr wallet');
  }

  async sendBitcoin(toAddress: string, satoshis: number) {
    return await executeWithTryCatch(async () => {
      return await this.#keplrProvider.sendBitcoin(toAddress, satoshis);
    }, 'Error while sending bitcoin from Keplr wallet');
  }

  on(event: string, callback: (data: any) => void) {
    this.#keplrProvider.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.#keplrProvider.off(event, callback);
  }

  async disconnect() {
    await this.#keplrProvider.disconnect();
    this.address = '';
    return Ok('Disconnected Keplr wallet');
  }
}
