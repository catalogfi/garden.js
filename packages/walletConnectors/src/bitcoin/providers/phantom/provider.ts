import { Connect, IInjectedBitcoinProvider } from '../../bitcoin.types';
import { PhantomBitcoinProvider } from './phantom.types';
import { AsyncResult, Err, executeWithTryCatch, Ok } from '@catalogfi/utils';
import * as bitcoin from 'bitcoinjs-lib';
import axios from 'axios';
import { initEccLib, networks } from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { Network } from '@gardenfi/utils';
import { WALLET_CONFIG } from './../../constants';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BWErrors,
  IBitcoinProvider,
  Urgency,
} from '@catalogfi/wallets';

initEccLib(ecc);

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
  public id = WALLET_CONFIG.Phantom.id;
  private mempoolApiBaseUrl: string = 'https://mempool.space/api';
  public name = WALLET_CONFIG.Phantom.name;
  public icon = WALLET_CONFIG.Phantom.icon;

  constructor(phantomProvider: PhantomBitcoinProvider) {
    this.#phantomProvider = phantomProvider;
  }

  async connect(network?: Network): AsyncResult<Connect, string> {
    if (!network) network = Network.MAINNET;
    if (network === Network.TESTNET)
      return Err('Phantom wallet does not support testnet');

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
        id: WALLET_CONFIG.Phantom.id,
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

  private async generateUnsignedPBST(
    provider: IBitcoinProvider,
    network: networks.Network,
    fromAddress: string,
    toAddress: string,
    amt: number,
    fee?: number,
  ): Promise<{
    txHex: string;
    utxoCount: number;
  }> {
    if (!fee) fee = await provider.suggestFee(fromAddress, amt, Urgency.FAST);
    if (fee > amt) throw new Error(BWErrors.FEE_EXCEEDS_AMOUNT(fee, amt));

    const utxos = await provider.getUTXOs(fromAddress);

    const utxosWithRawTx = await Promise.all(
      utxos.map(async (utxo) => {
        const rawTxHex = await provider.getTransactionHex(utxo.txid);
        return { ...utxo, rawTxHex };
      }),
    );
    const utxoCount = utxosWithRawTx.length;

    if (utxosWithRawTx.length === 0) {
      throw new Error('No UTXOs found for the sender address.');
    }
    console.log(utxosWithRawTx);

    const totalUTXOValue = utxosWithRawTx.reduce(
      (acc, utxo) => acc + utxo.value,
      0,
    );

    const change = totalUTXOValue - amt - fee;

    if (totalUTXOValue < amt + fee)
      throw new Error(BWErrors.INSUFFICIENT_FUNDS(totalUTXOValue, amt + fee));

    const psbt = new bitcoin.Psbt({ network });

    utxosWithRawTx.forEach((utxo) => {
      psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        nonWitnessUtxo: Buffer.from(utxo.rawTxHex, 'hex'),
      });
    });

    psbt.addOutput({
      address: toAddress,
      value: amt,
    });
    if (change > 0) {
      psbt.addOutput({
        address: fromAddress,
        value: change,
      });
    }

    console.log('generated psbt : ', psbt);
    return { txHex: psbt.toHex(), utxoCount: utxoCount };
  }

  async sendBitcoin(
    toAddress: string,
    satoshis: number,
  ): AsyncResult<string, string> {
    return await executeWithTryCatch(async () => {
      //considering only mainnet because phantom doesn't support testnet
      const network = bitcoin.networks.bitcoin;

      const provider = new BitcoinProvider(BitcoinNetwork.Mainnet);
      try {
        const { txHex, utxoCount } = await this.generateUnsignedPBST(
          provider,
          network,
          this.address,
          toAddress,
          satoshis,
        );
        console.log('txHex :', txHex);

        const signedPsbtBytes = await this.#phantomProvider.signPSBT(
          this.fromHexString(txHex),
          {
            inputsToSign: [
              {
                address: this.address,
                signingIndexes: Array.from({ length: utxoCount }, (_, i) => i),
                sigHash: bitcoin.Transaction.SIGHASH_ALL,
              },
            ],
          },
        );

        const signedPsbt = bitcoin.Psbt.fromBuffer(
          Buffer.from(signedPsbtBytes),
        );
        signedPsbt.finalizeAllInputs();

        const tx = signedPsbt.extractTransaction();
        const txId = tx.getId();

        await provider.broadcast(tx.toHex());

        return txId;
      } catch (error) {
        console.log('error :', error);
        throw new Error('Failed to send bitcoin');
      }
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
