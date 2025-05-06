import {
  UnisatBitcoinProvider,
  UnisatChainEnum,
  UnisatNetworkEnum,
} from './unisat.types';
import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { Connect, IInjectedBitcoinProvider } from '../../bitcoin.types';
import { Network } from '@gardenfi/utils';
import { WALLET_CONFIG } from './../../constants';

export class UnisatProvider implements IInjectedBitcoinProvider {
  #unisatProvider: UnisatBitcoinProvider;
  #network: Network;
  public address: string = '';
  public id = WALLET_CONFIG.Unisat.id;
  public name = WALLET_CONFIG.Unisat.name;
  public icon = WALLET_CONFIG.Unisat.icon;

  constructor(unisatProvider: UnisatBitcoinProvider, network: Network) {
    this.#unisatProvider = unisatProvider;
    this.#network = network;
  }

  async connect(network?: Network): AsyncResult<Connect, string> {
    try {
      if (!network) network = Network.MAINNET;

      const currentNetwork = await this.getNetwork();
      const currentChain = await this.#unisatProvider.getChain();
      if (currentNetwork.error)
        return Err('Could not get network', currentNetwork.error);

      if (
        currentNetwork.val !== network ||
        currentChain.enum === UnisatChainEnum.BITCOIN_TESTNET
      ) {
        const switchRes = await this.switchNetwork();
        if (switchRes.error)
          return Err('Failed to switch network', switchRes.error);
      }
      
      const accounts = await this.#unisatProvider.requestAccounts();
      if (accounts.length > 0) this.address = accounts[0];

      return Ok({
        address: this.address,
        provider: this,
        network: network,
        id: WALLET_CONFIG.Unisat.id,
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
      if (network === UnisatNetworkEnum.LIVENET) {
        return Network.MAINNET;
      } else if (network === UnisatNetworkEnum.TESTNET) {
        return Network.TESTNET;
      }
      throw new Error('Invalid or unsupported network' + network);
    }, 'Error while getting network from Unisat wallet');
  }

  async switchNetwork(): AsyncResult<Network, string> {
    try {
      const currentNetwork = await this.getNetwork();
      const currentChain = await this.#unisatProvider.getChain();
      if (currentNetwork.error) {
        return Err('Failed to get current network');
      }
      const toNetwork =
        currentNetwork.val === Network.MAINNET
          ? UnisatChainEnum.BITCOIN_TESTNET4
          : this.#network === Network.TESTNET &&
            currentChain.enum === UnisatChainEnum.BITCOIN_TESTNET
          ? UnisatChainEnum.BITCOIN_TESTNET4
          : UnisatChainEnum.BITCOIN_MAINNET;

      await this.#unisatProvider.switchChain(toNetwork);

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

  disconnect = (): AsyncResult<string, string> => {
    this.address = '';
    return Promise.resolve(Ok('Disconnected unisat wallet'));
  };
}
