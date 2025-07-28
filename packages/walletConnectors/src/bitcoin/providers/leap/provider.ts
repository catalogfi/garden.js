import { Connect, IInjectedBitcoinProvider } from '../../bitcoin.types';
import { LeapBitcoinProvider } from './leap.types';
import * as bitcoin from 'bitcoinjs-lib';
import { initEccLib } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import {
  AsyncResult,
  Err,
  executeWithTryCatch,
  Network,
  Ok,
} from '@gardenfi/utils';
import { WALLET_CONFIG } from './../../constants';
import { getBalance } from '../../utils';

initEccLib(ecc);

export class LeapProvider implements IInjectedBitcoinProvider {
  #leapProvider: LeapBitcoinProvider;
  public address: string = '';
  public id = WALLET_CONFIG.Leap.id;
  public name = WALLET_CONFIG.Leap.name;
  public icon = WALLET_CONFIG.Leap.icon;

  constructor(leapProvider: LeapBitcoinProvider) {
    this.#leapProvider = leapProvider;
  }

  async connect(network?: Network): AsyncResult<Connect, string> {
    if (!network) network = Network.MAINNET;
    if (network === Network.TESTNET)
      return Err('Leap wallet does not support testnet');

    try {
      const accounts = await this.#leapProvider.requestAccounts();
      if (accounts.length > 0) this.address = accounts[0];

      return Ok({
        address: this.address,
        provider: this,
        network: network,
        id: WALLET_CONFIG.Leap.id,
      });
    } catch (error) {
      return Err('Error while connecting to Leap wallet: ' + error);
    }
  }

  async requestAccounts() {
    return await executeWithTryCatch(async () => {
      return await this.#leapProvider.requestAccounts();
    }, 'Error while requesting accounts from Leap wallet');
  }

  async getAccounts() {
    return await executeWithTryCatch(async () => {
        return await this.#leapProvider.getAccounts();
      }, 'Error while getting accounts from Leap wallet');
  }

  // bitcoin testnet is not supported in Leap wallet
  async getNetwork() {
    return Ok(Network.MAINNET);
  }

  async switchNetwork(): AsyncResult<Network, string> {
    return Err('Keplr wallet does not support testnet4');
  }

  async getBalance(): AsyncResult<
    { confirmed: number; unconfirmed: number; total: number },
    string
  > {
    return await executeWithTryCatch(async () => {
      const balance = await getBalance(this.address, Network.MAINNET);
      if (balance.ok && balance.val) {
        return balance.val;
      }
      throw new Error(balance.error);
    }, 'Error while getting balance from Leap wallet');
  }

  async sendBitcoin(toAddress: string, satoshis: number) {
    return await executeWithTryCatch(async () => {
      return await this.#leapProvider.sendBitcoin(toAddress, satoshis);
    }, 'Error while sending bitcoin from Unisat wallet');
  }

  on(event: string, callback: (data: any) => void): void {
    this.#leapProvider.on(event, callback);
  }

  off(event: string, callback: (data: any) => void): void {
    this.#leapProvider.off(event, callback);
  }

  disconnect = (): AsyncResult<string, string> => {
    this.address = '';
    return Promise.resolve(Ok('Disconnected Leap wallet'));
  };
}
