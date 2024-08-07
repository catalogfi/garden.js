import {
  Balance,
  IInjectedBitcoinProvider,
  Network,
} from '../../bitcoin.types';
import { XVerseBitcoinProvider } from './xverse.types';
import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';

export class XverseProvider implements IInjectedBitcoinProvider {
  #xverseProvider: XVerseBitcoinProvider;
  public address = '';

  constructor(private provider: XVerseBitcoinProvider) {
    this.#xverseProvider = provider;
  }

  connect = async () => {
    try {
      const res = await this.#xverseProvider.request('getAccounts', {
        purposes: ['payment'],
        message: 'I want to connect',
        network: 'testnet',
      });

      const address = res.result[0].address;
      this.address = address;

      if (!window.XverseProviders || !window.XverseProviders.BitcoinProvider) {
        return Err('XVerse wallet not found');
      }

      const provider = new XverseProvider(
        window.XverseProviders.BitcoinProvider
      );
      this.#xverseProvider = provider.provider;

      const network = await this.getNetwork();
      if (network.error) return Err('Could not get network', network.error);

      return Ok({
        address: this.address,
        provider: provider,
        network: network.val,
      });
    } catch (error) {
      return Err('Error while connecting to the XVerse wallet', error);
    }
  };

  getBalance = async () => {
    return await executeWithTryCatch(async () => {
      const response = await this.#xverseProvider.request('getBalance', {});
      return response.result as Balance;
    }, 'Error while getting balance from XVerse wallet');
  };

  requestAccounts = async (): AsyncResult<string[], string> => {
    return Ok([]);
  };

  getAccounts = async (): AsyncResult<string[], string> => {
    return await executeWithTryCatch(async () => {
      const res = await this.#xverseProvider.request('getAccounts', {
        purposes: ['payment'],
        message: 'I want to connect',
      });
      return res.result.map((acc: any) => acc.address);
    });
  };

  sendBitcoin = async (
    toAddress: string,
    satoshis: number
  ): AsyncResult<string, string> => {
    try {
      const res = await this.#xverseProvider.request('sendTransfer', {
        recipients: [{ address: toAddress, amount: satoshis }],
      });
      if (res.status === 'success') {
        return Ok(res.result.txid);
      } else {
        if (res.error.code === -32000) {
          return Err('User rejected the transaction');
        } else {
          return Err(
            'Error while sending bitcoin from XVerse wallet',
            res.error
          );
        }
      }
    } catch (error) {
      return Err('Error while sending bitcoin from XVerse wallet', error);
    }
  };

  //TODO: get network from the wallet
  getNetwork = async (): AsyncResult<Network, string> => {
    if (
      this.address.startsWith('1') ||
      this.address.startsWith('3') ||
      this.address.startsWith('bc1')
    ) {
      return Ok(Network.MAINNET);
    } else if (
      this.address.startsWith('m') ||
      this.address.startsWith('n') ||
      this.address.startsWith('2') ||
      this.address.startsWith('tb1')
    ) {
      return Ok(Network.TESTNET);
    }
    return Ok(Network.TESTNET);
  };

  /**
   * not available in XVerse wallet
   */
  on = () => {};

  /**
   * not available in XVerse wallet
   */
  off = () => {};
}
