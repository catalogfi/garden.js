import { IInjectedBitcoinProvider, Network } from '../../bitcoin.types';
import { PhantomBitcoinProvider } from './phantom.types';
import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import { initEccLib } from 'bitcoinjs-lib';
import * as secp256k1 from '@bitcoinerlab/secp256k1';

// Initialize the ECC library
initEccLib(secp256k1);

interface UTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height: number;
    block_hash: string;
    block_time: number;
  };
  value: number;
}

export class PhantomProvider implements IInjectedBitcoinProvider {
  #phantomProvider: PhantomBitcoinProvider;
  public address: string = '';
  private mempoolApiBaseUrl: string = 'https://mempool.space/api';

  constructor(phantomProvider: PhantomBitcoinProvider) {
    this.#phantomProvider = phantomProvider;
  }

  async connect(
    network?: Network,
  ): AsyncResult<
    { address: string; provider: IInjectedBitcoinProvider; network: Network },
    string
  > {
    if (!network) network = Network.MAINNET;
    try {
      const accounts = await this.#phantomProvider.requestAccounts();

      if (!window.phantom) return Err('phantom wallet not found');
      if (accounts.length === 0) return Err('No accounts found');

      const provider = new PhantomProvider(window.phantom.bitcoin);
      this.#phantomProvider = provider.#phantomProvider;

      for (const account of accounts) {
        if (account.purpose === 'payment') this.address = account.address;
      }
      if (this.address === '')
        return Err('Could not connect to Phantom bitcoin payment account');

      const network = await this.getNetwork();
      if (network.error) return Err('Could not get network: ' + network.error);

      return Ok({
        address: this.address,
        provider: provider,
        network: network.val,
      });
    } catch (error) {
      return Err('Error while connecting to Phantom wallet: ' + error);
    }
  }

  async requestAccounts() {
    return await executeWithTryCatch(async () => {
      const accounts = await this.#phantomProvider.requestAccounts();
      if (accounts.length > 0) {
        this.address = accounts[0].address;
      }
      return accounts.map((account) => account.address);
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
    return Err('Phantom wallet does not support testnet');
  }

  async getBalance(): AsyncResult<
    { confirmed: number; unconfirmed: number; total: number },
    string
  > {
    return await executeWithTryCatch(async () => {
      return await this.#phantomProvider.getBalance();
    }, 'Error while getting balance from Phantom wallet');
  }

  async sendBitcoin(
    toAddress: string,
    satoshis: number,
  ): AsyncResult<string, string> {
    return await executeWithTryCatch(async () => {
      const network = bitcoin.networks.bitcoin;
      const psbt = new bitcoin.Psbt({ network });

      const utxos = await this.getUnspentOutputs();
      let totalInput = 0;
      utxos.forEach((utxo) => {
        psbt.addInput({
          hash: utxo.txid,
          index: utxo.vout,
          witnessUtxo: {
            script: bitcoin.address.toOutputScript(this.address, network),
            value: BigInt(utxo.value),
          },
        });
        totalInput += utxo.value;
      });

      psbt.addOutput({
        address: toAddress,
        value: BigInt(satoshis),
      });

      const fee = 1000; // Set fee
      const change = totalInput - satoshis - fee;
      if (change > 0) {
        psbt.addOutput({
          address: this.address, // change goes back to sender
          value: BigInt(change),
        });
      }

      const serializedPsbt = psbt.toHex();

      const signedPsbtBytes = await this.#phantomProvider.signPSBT(
        this.fromHexString(serializedPsbt),
        {
          inputsToSign: [
            {
              address: this.address,
              signingIndexes: Array.from(Array(utxos.length).keys()),
              sigHash: bitcoin.Transaction.SIGHASH_ALL,
            },
          ],
        },
      );

      const signedPsbt = bitcoin.Psbt.fromBuffer(Buffer.from(signedPsbtBytes));
      signedPsbt.finalizeAllInputs();

      const tx = signedPsbt.extractTransaction();
      const txId = tx.getId();

      await this.broadcastTransaction(tx.toHex());

      return txId;
    }, 'Error while sending bitcoin from Phantom wallet');
  }

  private async getUnspentOutputs(): Promise<UTXO[]> {
    try {
      const response = await axios.get(
        `${this.mempoolApiBaseUrl}/address/${this.address}/utxo`,
      );
      return response.data as UTXO[];
    } catch (error) {
      console.error('Error fetching UTXOs:', error);
      throw new Error('Failed to fetch unspent outputs');
    }
  }

  private async broadcastTransaction(txHex: string): Promise<void> {
    try {
      await axios.post(`${this.mempoolApiBaseUrl}/tx`, txHex, {
        headers: { 'Content-Type': 'text/plain' },
      });
    } catch (error) {
      console.error('Error broadcasting transaction:', error);
      throw new Error('Failed to broadcast transaction');
    }
  }

  private fromHexString(hexString: string): Uint8Array {
    return Uint8Array.from(
      hexString.match(/.{1,2}/g)!.map((byte) => parseInt(byte, 16)),
    );
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
  };
}