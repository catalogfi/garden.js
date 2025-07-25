import * as bitcoin from 'bitcoinjs-lib';
import * as ecc from 'tiny-secp256k1';
import { generateInternalkey } from './internalKey';
import { Taptree } from 'bitcoinjs-lib/src/types';
import { serializeTaprootSignature } from 'bitcoinjs-lib/src/psbt/bip371';
import { assert, xOnlyPubkey } from '../utils';
import { serializeScript, sortLeaves } from '../utils';
import { htlcErrors } from '../errors';
import { BitcoinUTXO } from './provider/provider.interface';
import { Urgency } from './provider/provider.interface';
import { IHTLCWallet } from '../htlc.interface';
import { IBitcoinWallet } from './wallet/wallet.interface';

export enum Leaf {
  REFUND,
  REDEEM,
  INSTANT_REFUND,
}

const LEAF_VERSION = 0xc0;

bitcoin.initEccLib(ecc);

export class GardenHTLC implements IHTLCWallet {
  /**
   * Signer of the HTLC can be either the initiator or the redeemer
   */
  private signer: IBitcoinWallet;
  private secretHash: string;
  /**
   * redeemer's x-only public key without 02 or 03 prefix
   */
  private redeemerPubkey: string;
  /**
   * initiator's x-only public key without 02 or 03 prefix
   */
  private initiatorPubkey: string;
  private expiry: number;
  /**
   * NUMS internal key which blocks key path spending
   */
  private internalPubkey: Buffer;
  private network: bitcoin.networks.Network;

  // Amount to initiate the HTLC
  private initiateAmount: number;

  // UTXO hashes which will be used instead of fetching from the rpcs
  private utxoHashes?: string[];

  /**
   * Note: redeemerAddress and initiatorAddress should be x-only public key without 02 or 03 prefix
   */
  private constructor(
    signer: IBitcoinWallet,
    initiateAmount: number,
    secretHash: string,
    redeemerPubkey: string,
    initiatorPubkey: string,
    expiry: number,
    network: bitcoin.networks.Network,
    utxoHashes?: string[],
  ) {
    this.secretHash = secretHash;
    this.redeemerPubkey = redeemerPubkey;
    this.initiatorPubkey = initiatorPubkey;
    this.expiry = expiry;
    this.signer = signer;
    this.network = network;
    this.internalPubkey = generateInternalkey();
    this.initiateAmount = initiateAmount;
    this.utxoHashes = utxoHashes;
  }

  /**
   * Creates a GardenHTLC instance
   * @param signer Bitcoin wallet of the initiator or redeemer
   * @param secretHash 32 bytes secret hash
   * @param initiatorPubkey initiator's x-only public key without 02 or 03 prefix
   * @param redeemerPubkey redeemer's x-only public key without 02 or 03 prefix
   * @param expiry block height after which the funds can be refunded
   * @returns GardenHTLC instance
   *
   *
   * Note: When the signer is the initiator, only refund and instant refund can be done
   * When the signer is the redeemer, only redeem can be done
   */
  static async from(
    signer: IBitcoinWallet,
    initiateAmount: number,
    secretHash: string,
    initiatorPubkey: string,
    redeemerPubkey: string,
    expiry: number,
    utxoHashes?: string[],
  ): Promise<GardenHTLC> {
    // trim 0x prefix if present
    secretHash = secretHash.startsWith('0x') ? secretHash.slice(2) : secretHash;

    assert(secretHash.length === 64, htlcErrors.secretHashLenMismatch);
    // initiator and redeemer pubkey should be either x-only 32 bytes or normal 33 bytes pubkey which
    // will be trimmed to x-only pubkey later
    assert(
      initiatorPubkey.length === 64 || initiatorPubkey.length === 66,
      `initiator ${htlcErrors.pubkeyLenMismatch}`,
    );
    assert(
      redeemerPubkey.length === 64 || redeemerPubkey.length === 66,
      `redeemer ${htlcErrors.pubkeyLenMismatch}`,
    );
    assert(expiry > 0, htlcErrors.zeroOrNegativeExpiry);

    const network = await signer.getNetwork();
    return new GardenHTLC(
      signer,
      initiateAmount,
      secretHash,
      xOnlyPubkey(redeemerPubkey).toString('hex'),
      xOnlyPubkey(initiatorPubkey).toString('hex'),
      expiry,
      network,
      utxoHashes,
    );
  }

  /**
   * Generates a taproot address for receiving the funds
   */
  address(): string {
    const { address } = bitcoin.payments.p2tr({
      internalPubkey: this.internalPubkey,
      network: this.network,
      scriptTree: this.leaves() as Taptree,
    });
    if (!address) throw new Error(htlcErrors.htlcAddressGenerationFailed);
    return address;
  }
  /**
   * returns the address of the HTLC
   */
  id(): string {
    return this.address();
  }

  private async _buildRawTx(
    receiver: string,
    options?: {
      fee?: number;
      vSize?: number;
    },
  ) {
    const tx = new bitcoin.Transaction();
    tx.version = 2;

    const address = this.address();
    const provider = await this.signer.getProvider();

    let utxos: BitcoinUTXO[] = [];
    if (this.utxoHashes && this.utxoHashes.length > 0) {
      for (const utxoHash of this.utxoHashes) {
        const tx = await provider.getTransaction(utxoHash);
        for (let i = 0; i < tx.vout.length; i++) {
          const vout = tx.vout[i];
          if (vout.scriptpubkey_address === address) {
            utxos.push({
              txid: tx.txid,
              vout: i,
              value: vout.value,
              status: { confirmed: false },
            });
          }
        }
      }
    } else {
      utxos = await provider.getUTXOs(address);
    }

    const balance = utxos.reduce((acc, utxo) => acc + utxo.value, 0);
    if (balance === 0) throw new Error(`${address} ${htlcErrors.notFunded}`);

    for (let i = 0; i < utxos.length; i++) {
      tx.addInput(Buffer.from(utxos[i].txid, 'hex').reverse(), utxos[i].vout);
    }

    if (options?.vSize) {
      // calculate fees based on vSize
      const feeRate = await provider.getFeeRates();
      const fees = Math.ceil(feeRate.hourFee * options.vSize);
      const amountAfterFees = balance - fees;

      tx.addOutput(
        bitcoin.address.toOutputScript(receiver, this.network),
        amountAfterFees,
      );

      return { tx, usedUtxos: utxos };
    }

    const fee =
      options?.fee ??
      (await provider.suggestFee(address, balance, Urgency.MEDIUM));
    tx.addOutput(
      bitcoin.address.toOutputScript(receiver, this.network),
      balance - fee,
    );

    return { tx, usedUtxos: utxos, fee, balance };
  }

  /**
   * prevout script for the gardenHTLC address
   */
  private getOutputScript() {
    return bitcoin.address.toOutputScript(this.address(), this.network);
  }

  async init(fee?: number): Promise<string> {
    fee ??= await (
      await this.signer.getProvider()
    ).suggestFee(
      await this.signer.getAddress(),
      this.initiateAmount,
      Urgency.MEDIUM,
    );

    return await this.signer.send(this.address(), this.initiateAmount, fee);
  }

  async generateRedeemSACP(secret: string, receiver: string, fee?: number) {
    const { tx, usedUtxos } = await this._buildRawTx(receiver, { fee });
    const output = this.getOutputScript();

    const hashType =
      bitcoin.Transaction.SIGHASH_SINGLE |
      bitcoin.Transaction.SIGHASH_ANYONECANPAY;
    const redeemLeafHash = this.leafHash(Leaf.REDEEM);

    const values = usedUtxos.map((utxo) => utxo.value);
    const outputs = generateOutputs(output, usedUtxos.length);

    for (let i = 0; i < tx.ins.length; i++) {
      const hash = tx.hashForWitnessV1(
        i,
        outputs,
        values,
        hashType,
        redeemLeafHash,
      );

      const signature = await this.signer.signSchnorr(hash);
      tx.setWitness(i, [
        serializeTaprootSignature(signature, hashType),
        Buffer.from(secret, 'hex'),
        this.redeemLeaf(),
        this.generateControlBlockFor(Leaf.REDEEM),
      ]);
    }
    return tx.toHex();
  }

  async generateInstantRefundSACP(receiver: string) {
    const outputAddress = this.getOutputScript();
    const {
      tx,
      usedUtxos,
      fee: txFee,
    } = await this._buildRawTx(receiver, {
      fee: 0,
    });
    tx.outs = [];
    const maxUtxoValue = Math.max(...usedUtxos.map((utxo) => utxo.value));

    usedUtxos.forEach(({ value }) => {
      tx.addOutput(
        outputAddress,
        value - (value === maxUtxoValue ? txFee ?? 0 : 0),
      );
    });

    const hashType =
      bitcoin.Transaction.SIGHASH_SINGLE |
      bitcoin.Transaction.SIGHASH_ANYONECANPAY;
    const instantRefundLeafHash = this.leafHash(Leaf.INSTANT_REFUND);
    console.log(
      'instantRefundLeafHash :',
      instantRefundLeafHash.toString('hex'),
    );

    const values = usedUtxos.map((utxo) => utxo.value);
    console.log('values :', values);
    const outputs = generateOutputs(outputAddress, usedUtxos.length);
    console.log(
      'outputs :',
      outputs.map((output) => output.toString('hex')),
    );

    for (let i = 0; i < tx.ins.length; i++) {
      const hash = tx.hashForWitnessV1(
        i,
        outputs,
        values,
        hashType,
        instantRefundLeafHash,
      );

      console.log('hash :', hash.toString('hex'));
      const signature = await this.signer.signSchnorr(hash);
      tx.setWitness(i, [
        // first is initiator's signature
        serializeTaprootSignature(signature, hashType),
        // second is redeemer's signature
        // this is then modified by the redeemer to include their signature
        serializeTaprootSignature(signature, hashType),
        this.instantRefundLeaf(),
        this.generateControlBlockFor(Leaf.INSTANT_REFUND),
      ]);
    }
    console.log('tx: \n', tx);

    console.log('tx.toHex() :', tx.toHex());
    return tx.toHex();
  }

  async generateInstantRefundSACPWithHash(hash: string[]) {
    const signatures = [];
    const hashType =
      bitcoin.Transaction.SIGHASH_SINGLE |
      bitcoin.Transaction.SIGHASH_ANYONECANPAY;

    for (let i = 0; i < hash.length; i++) {
      const _hash = Buffer.from(hash[i], 'hex');

      const signature = await this.signer.signSchnorr(_hash);
      signatures.push(
        serializeTaprootSignature(signature, hashType).toString('hex'),
      );
    }
    return signatures;
  }

  /**
   * Instantly refunds the funds to the initiator given the counterparty's signatures and pubkey
   *
   * Note: If there are multiple UTXOs being spend, there should be a signature for each UTXO in counterPartySigs
   */
  async instantRefund(
    counterPartySigs: { utxo: string; sig: string }[],
    fee?: number,
  ) {
    assert(counterPartySigs.length > 0, htlcErrors.noCounterpartySigs);

    const { tx, usedUtxos } = await this._buildRawTx(
      await this.signer.getAddress(),
      { fee },
    );

    for (const utxo of usedUtxos) {
      if (!counterPartySigs.find((sig) => sig.utxo === utxo.txid)) {
        throw new Error(htlcErrors.counterPartySigNotFound(utxo.txid));
      }
    }

    const output = this.getOutputScript();

    const hashType = bitcoin.Transaction.SIGHASH_DEFAULT;
    const instantRefundLeafHash = this.leafHash(Leaf.INSTANT_REFUND);

    const values = usedUtxos.map((utxo) => utxo.value);
    const outputs = generateOutputs(output, usedUtxos.length);

    for (let i = 0; i < tx.ins.length; i++) {
      const hash = tx.hashForWitnessV1(
        i,
        outputs,
        values,
        hashType,
        instantRefundLeafHash,
      );
      if (
        !ecc.verifySchnorr(
          hash,
          Buffer.from(this.redeemerPubkey, 'hex'),
          Buffer.from(counterPartySigs[i].sig, 'hex'),
        )
      ) {
        throw new Error(
          htlcErrors.invalidCounterpartySigForUTXO(counterPartySigs[i].utxo),
        );
      }

      const signature = await this.signer.signSchnorr(hash);
      const txid = Buffer.from(tx.ins[i].hash).reverse().toString('hex');
      const counterPartySig = counterPartySigs.find((sig) => sig.utxo === txid);
      if (!counterPartySig)
        throw new Error(htlcErrors.counterPartySigNotFound(txid));

      tx.setWitness(i, [
        Buffer.from(counterPartySig.sig, 'hex'),
        signature,
        this.instantRefundLeaf(),
        this.generateControlBlockFor(Leaf.INSTANT_REFUND),
      ]);
    }

    const provider = await this.signer.getProvider();
    return await provider.broadcast(tx.toHex());
  }

  /**
   * Reveals the secret and redeems the HTLC
   */
  async redeem(secret: string, receiver?: string): Promise<string> {
    const redeemHex = await this.getRedeemHex(secret, receiver);

    // broadcast the transaction
    const provider = await this.signer.getProvider();
    return await provider.broadcast(redeemHex);
  }

  async getRedeemHex(secret: string, receiver?: string): Promise<string> {
    assert(
      bitcoin.crypto.sha256(Buffer.from(secret, 'hex')).toString('hex') ===
        this.secretHash,
      htlcErrors.secretMismatch,
    );

    const receiverAddress = receiver ?? (await this.signer.getAddress());

    // First build and sign tx to calculate vSize
    const { tx: tempTx, usedUtxos: utxos } = await this._buildRawTx(
      receiverAddress,
      { fee: 0 },
    );

    const redeemLeafHash = this.leafHash(Leaf.REDEEM);
    const values = utxos.map((utxo) => utxo.value);
    const outputs = generateOutputs(this.getOutputScript(), utxos.length);
    const hashType = bitcoin.Transaction.SIGHASH_DEFAULT;

    // Sign temp transaction to get accurate vSize
    for (let i = 0; i < tempTx.ins.length; i++) {
      const hash = tempTx.hashForWitnessV1(
        i,
        outputs,
        values,
        hashType,
        redeemLeafHash,
      );
      const signature = await this.signer.signSchnorr(hash);

      tempTx.setWitness(i, [
        signature,
        Buffer.from(secret, 'hex'),
        this.redeemLeaf(),
        this.generateControlBlockFor(Leaf.REDEEM),
      ]);
    }

    // Build final tx with correct fees
    const { tx } = await this._buildRawTx(receiverAddress, {
      vSize: tempTx.virtualSize(),
    });

    // Sign final transaction
    for (let i = 0; i < tx.ins.length; i++) {
      const hash = tx.hashForWitnessV1(
        i,
        outputs,
        values,
        hashType,
        redeemLeafHash,
      );
      const signature = await this.signer.signSchnorr(hash);

      tx.setWitness(i, [
        signature,
        Buffer.from(secret, 'hex'),
        this.redeemLeaf(),
        this.generateControlBlockFor(Leaf.REDEEM),
      ]);
    }

    return tx.toHex();
  }

  /**
   * Refunds the funds back to the initiator if the expiry block height + 1 is reached
   */
  async refund(receiver?: string, fee?: number): Promise<string> {
    const { tx, usedUtxos } = await this._buildRawTx(
      receiver ?? (await this.signer.getAddress()),
      { fee },
    );

    const [canRefund, needMoreBlocks] = await this.canRefund(usedUtxos);
    if (!canRefund) {
      throw new Error(htlcErrors.htlcNotExpired(needMoreBlocks));
    }

    const refundLeafHash = this.leafHash(Leaf.REFUND);

    const values = usedUtxos.map((utxo) => utxo.value);
    const outputs = generateOutputs(this.getOutputScript(), usedUtxos.length);

    const hashType = bitcoin.Transaction.SIGHASH_DEFAULT;

    for (let i = 0; i < tx.ins.length; i++) {
      tx.ins[i].sequence = this.expiry;
      const hash = tx.hashForWitnessV1(
        i,
        outputs,
        values,
        hashType,
        refundLeafHash,
      );
      const signature = await this.signer.signSchnorr(hash);

      tx.setWitness(i, [
        signature,
        this.refundLeaf(),
        this.generateControlBlockFor(Leaf.REFUND),
      ]);
    }

    const provider = await this.signer.getProvider();
    return await provider.broadcast(tx.toHex());
  }

  /**
   * Given a list of UTXOs, checks if the HTLC can be refunded
   */
  private async canRefund(utxos: BitcoinUTXO[]): Promise<[boolean, number]> {
    const provider = await this.signer.getProvider();
    const currentBlockHeight = await provider.getLatestTip();

    // ensure all utxos are expired
    for (const utxo of utxos) {
      let needMoreBlocks = 0;
      if (
        utxo.status.confirmed &&
        utxo.status.block_height + this.expiry > currentBlockHeight
      ) {
        needMoreBlocks =
          utxo.status.block_height + this.expiry - currentBlockHeight + 1;
      } else if (!utxo.status.confirmed) {
        needMoreBlocks = this.expiry + 1;
      }
      if (needMoreBlocks > 0) {
        return [false, needMoreBlocks];
      }
    }

    return [true, 0];
  }

  /**
   * Given a leaf, generates the control block necessary for spending the leaf
   */
  private generateControlBlockFor(leaf: Leaf) {
    let redeemScript: Buffer;
    switch (leaf) {
      case Leaf.REDEEM:
        redeemScript = this.redeemLeaf();
        break;
      case Leaf.REFUND:
        redeemScript = this.refundLeaf();
        break;
      case Leaf.INSTANT_REFUND:
        redeemScript = this.instantRefundLeaf();
        break;
      default:
        throw new Error(htlcErrors.invalidLeaf);
    }

    const payment = bitcoin.payments.p2tr({
      internalPubkey: this.internalPubkey,
      network: this.network,
      scriptTree: this.leaves() as Taptree,
      redeem: {
        output: redeemScript,
        redeemVersion: LEAF_VERSION,
      },
    });
    if (!payment.witness) {
      throw new Error(htlcErrors.controlBlockGenerationFailed);
    }

    return payment.witness[payment.witness.length - 1]!;
  }
  /**
   * Generates the hash of the leaf script
   * @param leaf Use leaf enum or pass 0 for refund, 1 for redeem, 2 for instant refund
   * @returns hash of the leaf script
   */
  leafHash(leaf: Leaf): Buffer {
    let leafScript = this.redeemLeaf();
    if (leaf === Leaf.REFUND) leafScript = this.refundLeaf();
    if (leaf === Leaf.INSTANT_REFUND) leafScript = this.instantRefundLeaf();
    return bitcoin.crypto.taggedHash('TapLeaf', serializeScript(leafScript));
  }

  private refundLeaf(): Buffer {
    return bitcoin.script.fromASM(
      `
			${bitcoin.script.number.encode(this.expiry).toString('hex')}
			OP_CHECKSEQUENCEVERIFY
			OP_DROP
			${this.initiatorPubkey}	
			OP_CHECKSIG
			`
        .trim()
        .replace(/\s+/g, ' '),
    );
  }

  private redeemLeaf(): Buffer {
    return bitcoin.script.fromASM(
      `
			OP_SHA256
			${this.secretHash}
			OP_EQUALVERIFY
			${this.redeemerPubkey}
			OP_CHECKSIG
			`
        .trim()
        .replace(/\s+/g, ' '),
    );
  }

  private instantRefundLeaf(): Buffer {
    return bitcoin.script.fromASM(
      `
			${this.initiatorPubkey}
			OP_CHECKSIG
			${this.redeemerPubkey}
			OP_CHECKSIGADD
			OP_2
			OP_NUMEQUAL
			`
        .trim()
        .replace(/\s+/g, ' '),
    );
  }

  private leaves() {
    return [
      // most probable leaf (redeem)
      {
        version: LEAF_VERSION,
        output: this.redeemLeaf(),
      },
      [
        {
          version: LEAF_VERSION,
          output: this.refundLeaf(),
        },
        {
          version: LEAF_VERSION,
          output: this.instantRefundLeaf(),
        },
      ],
    ];
  }

  /**
   * Generates the merkle proof for the leaf script
   */
  private generateMerkleProofFor(leaf: Leaf) {
    const redeemLeafHash = this.leafHash(Leaf.REDEEM);
    const instantRefundLeafHash = this.leafHash(Leaf.INSTANT_REFUND);
    const refundLeafHash = this.leafHash(Leaf.REFUND);
    switch (leaf) {
      case Leaf.REDEEM: {
        const sortedRefundLeaves = sortLeaves(
          refundLeafHash,
          instantRefundLeafHash,
        );
        return [
          bitcoin.crypto.taggedHash(
            'TapBranch',
            Buffer.concat(sortedRefundLeaves),
          ),
        ];
      }
      case Leaf.REFUND:
        return [instantRefundLeafHash, redeemLeafHash];
      case Leaf.INSTANT_REFUND:
        return [refundLeafHash, redeemLeafHash];
      default:
        throw new Error(htlcErrors.invalidLeaf);
    }
  }
}

/**
 * We only have one output script aka scriptpubkey, hence we generate the same output for signing
 */
function generateOutputs(output: Buffer, count: number): Buffer[] {
  const outputs: Buffer[] = [];
  for (let i = 0; i < count; i++) {
    outputs.push(output);
  }
  return outputs;
}
