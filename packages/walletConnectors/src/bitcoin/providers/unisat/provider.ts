import { UnisatBitcoinProvider } from './unisat.types';
import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { IInjectedBitcoinProvider, Network } from '../../bitcoin.types';

export class UnisatProvider implements IInjectedBitcoinProvider {
  #unisatProvider: UnisatBitcoinProvider;
  public address: string = '';

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

      const network = await this.getNetwork();
      if (network.error) return Err('Could not get network', network.error);

      return Ok({
        address: this.address,
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

  async switchNetwork(): AsyncResult<Network, string> {
    return await executeWithTryCatch(async () => {
      const currentNetwork = await this.getNetwork();
      if (currentNetwork.error) {
        return Err('Failed to get current network');
      }

      const toNetwork = (currentNetwork.val === Network.MAINNET) ? Network.TESTNET : Network.MAINNET;
      
      console.log("current:", currentNetwork.val, "switching to:", toNetwork);
      
      await this.#unisatProvider.switchNetwork(toNetwork);

      const newNetwork = await this.getNetwork();
      if (newNetwork.error) {
        return Err('Failed to verify network switch');
      }
      if (newNetwork.val !== toNetwork) {
        return Err('Network switch failed');
      }

      return Ok(toNetwork);
    }, 'Error while switching network in Unisat')
  }

  async getBalance() {
    return await executeWithTryCatch(async () => {
      const response = await this.#unisatProvider.getBalance();
      return response;
    }, 'Error while getting balance from Unisat wallet');
  }

  async sendBitcoin(toAddress: string, satoshis: number) {
    return await executeWithTryCatch(async () => {
      console.log("unisat sending bitcoin:", this.address, toAddress, satoshis);
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
