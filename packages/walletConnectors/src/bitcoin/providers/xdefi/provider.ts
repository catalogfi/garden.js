import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import { IInjectedBitcoinProvider, Network } from '../../bitcoin.types';
import { XdefiBitcoinProvider } from './xdefi.types';
import { getBalance } from '../../utils';

export class XdefiProvider implements IInjectedBitcoinProvider {
  #xdefiProvider: XdefiBitcoinProvider;
  public address: string = '';

  constructor(xdefiProvider: XdefiBitcoinProvider) {
    this.#xdefiProvider = xdefiProvider;
  }

  async connect(): AsyncResult<{ address: string; provider: IInjectedBitcoinProvider; network: Network }, string> {
    try {
      if (!window.xfi || !window.xfi.bitcoin)
        return Err('Xdefi wallet not found');

      const res = await this.#xdefiProvider.getAccounts();
      if (res.length === 0) return Err('No accounts found in Xdefi wallet');

      const provider = new XdefiProvider(window.xfi.bitcoin);
      this.#xdefiProvider = provider.#xdefiProvider;

      this.address = res[0];

      return Ok({
        address: res[0],
        provider: provider,
        network: provider.#xdefiProvider.network,
      });
    } catch (error) {
      return Err('Error while connecting to the Xdefi wallet', error);
    }
  };

  // requests accounts from the wallet, if not connected, it will connect first
  async requestAccounts() {
    return await executeWithTryCatch(
      async () => await this.#xdefiProvider.requestAccounts(),
      'Error while requesting accounts from the Xdefi wallet'
    );
  }

  //silently gets accounts if already connected
  async getAccounts() {
    return await executeWithTryCatch(
      async () => await this.#xdefiProvider.getAccounts(),
      'Error while getting accounts from the Xdefi wallet'
    );
  }

  async getNetwork() {
    return Ok(this.#xdefiProvider.network);
  }

  async switchNetwork(): AsyncResult<Network, string> {
    try {
      const currentNetwork = await this.getNetwork();
      const newNetwork = currentNetwork.val === Network.MAINNET ? Network.TESTNET : Network.MAINNET;
      await this.#xdefiProvider.changeNetwork(newNetwork);
      const accounts = await this.getAccounts();
      this.address = accounts.val[0];
      return Ok(newNetwork);
    } catch (error) {
      return Err('Error while switching networks in the Xdefi wallet:', error)
    }
  }

  async getPublicKey() {
    return Err('not available in Xdefi wallet');
  }

  async getBalance() {
    const network = await this.getNetwork();
    const res = await getBalance(this.address, network.val);
    if (res.error) return Err(res.error);
    return Ok(res.val);
  }

  sendBitcoin = async (toAddress: string, satoshis: number) => {
    const res = await new Promise<{ error: any; txHash: string }>(
      (resolve, reject) => {
        this.#xdefiProvider.request(
          {
            method: 'transfer',
            params: [
              {
                feeRate: 10,
                from: this.address,
                recipient: toAddress,
                amount: {
                  amount: satoshis,
                  decimals: 8
                },
                memo: 'Send Bitcoin',
              },
            ],
          },
          (error: any, txHash: string) => {
            console.log('here :', error);
            resolve({ error, txHash });
          }
        );
      }
    );
    if (res.error) return Err(res.error);
    return Ok(res.txHash);
  };

  on = (event: string, callback: (data: any) => void) =>
    this.#xdefiProvider.on(event, callback);

  off = (event: string, callback: (data: any) => void) =>
    this.#xdefiProvider.off(event, callback);
}