import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { Connect, IInjectedBitcoinProvider } from '../../bitcoin.types';
import { Network } from '@gardenfi/utils';
import { WALLET_CONFIG } from './../../constants';
import { GardenWalletBitcoinProvider } from './gardenwallet.types';

export class GardenWalletProvider implements IInjectedBitcoinProvider {
  #gardentWalletProvider: GardenWalletBitcoinProvider;
  public address: string = '';
  public id = WALLET_CONFIG.GardenWallet.id;
  public name = WALLET_CONFIG.GardenWallet.name;
  public icon = WALLET_CONFIG.GardenWallet.icon;

  constructor(gardenWalletProvider: GardenWalletBitcoinProvider) {
    this.#gardentWalletProvider = gardenWalletProvider;
  }

  async connect(network?: Network): AsyncResult<Connect, string> {
    try {
      if (!network) network = Network.MAINNET;

      const currentNetwork = await this.getNetwork();
      if (currentNetwork.error)
        return Err('Could not get network', currentNetwork.error);

      if (currentNetwork.val !== network) {
        const switchRes = await this.switchNetwork();
        if (switchRes.error)
          return Err('Failed to switch network', switchRes.error);
      }
      const accounts = await this.#gardentWalletProvider.requestAccounts();
      if (accounts.length > 0) this.address = accounts[0];

      return Ok({
        address: this.address,
        provider: this,
        network: network,
        id: WALLET_CONFIG.GardenWallet.id,
      });
    } catch (error) {
      return Err('Error while connecting to the Unisat wallet', error);
    }
  }
  async requestAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#gardentWalletProvider.requestAccounts();
    }, 'Error while requesting accounts from the Unisat wallet');
  }

  async getAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#gardentWalletProvider.getAccounts();
    }, 'Error while getting accounts from the Unisat wallet');
  }

  async getNetwork() {
    return await executeWithTryCatch(async () => {
      const network = await this.#gardentWalletProvider.getNetwork();
      if (network === 'mainnet') return Network.MAINNET;
      if (network === 'testnet') return Network.TESTNET;
      throw new Error('Invalid or unsupported network');
    }, 'Error while getting network from Unisat wallet');
  }

  async switchNetwork(): AsyncResult<Network, string> {
    try {
      const currentNetwork = await this.getNetwork();
      if (currentNetwork.error) {
        return Err('Failed to get current network');
      }
      const toNetwork =
        currentNetwork.val === 'mainnet' ? 'testnet' : 'mainnet';
      await this.#gardentWalletProvider.switchNetwork(toNetwork);

      const newNetwork = await this.getNetwork();
      if (newNetwork.error) {
        return Err('Failed to verify network switch');
      }

      return Ok(newNetwork.val);
    } catch (error) {
      return Err('Error while switching network in Unisat:', error);
    }
  }

  async getBalance() {
    return await executeWithTryCatch(async () => {
      const response = await this.#gardentWalletProvider.getBalance();
      return response;
    }, 'Error while getting balance from Unisat wallet');
  }

  async getPublicKey() {
    return await executeWithTryCatch(async () => {
      return await this.#gardentWalletProvider.getPublicKey();
    }, 'Error while getting public key from Unisat wallet');
  }

  async sendBitcoin(toAddress: string, satoshis: number) {
    return await executeWithTryCatch(async () => {
      return await this.#gardentWalletProvider.sendBitcoin(toAddress, satoshis);
    }, 'Error while sending bitcoin from Unisat wallet');
  }

  on(event: string, callback: (data: any) => void) {
    this.#gardentWalletProvider.on(event, callback);
  }

  off(event: string, callback: (data: any) => void) {
    this.#gardentWalletProvider.off(event, callback);
  }

  disconnect = (): AsyncResult<string, string> => {
    this.address = '';
    return Promise.resolve(Ok('Disconnected garden wallet'));
  };
}
