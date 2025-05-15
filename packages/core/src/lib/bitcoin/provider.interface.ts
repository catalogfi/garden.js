type BaseUTXO = {
  txid: string;
  vout: number;
  value: number;
};

export type BitcoinUTXO = (
  | {
      status: { confirmed: true; block_height: number };
    }
  | {
      status: { confirmed: false };
    }
) &
  BaseUTXO;

/**
 * Enum for fee rates
 * @enum {string}
 */
export enum Urgency {
  SLOW = 'SLOW',
  MEDIUM = 'MEDIUM',
  FAST = 'FAST',
}

/**
 * Interface for Bitcoin provider
 *
 * Gives read only access to the mempool
 */
export interface IBitcoinProvider {
  broadcast(tx: string): Promise<string>;
  getUTXOs(address: string, balance?: number): Promise<BitcoinUTXO[]>;
  getBalance(address: string): Promise<number>;
  getTransaction(txId: string): Promise<BitcoinTx>;
  getTransactionHex(txId: string): Promise<string>;
  getFeeRates(): Promise<FeeRates>;
  getTransactions(address: string, type: BitcoinTxType): Promise<BitcoinTx[]>;
  getNetwork(): BitcoinNetwork;
  getLatestTip(): Promise<number>;
  getConfirmations(txHash: string): Promise<number>;
  getTxIndex(txId: string, address: string): Promise<number>;
  getTransactionTimes(txIds: string[]): Promise<number[]>;
  suggestFee(
    account: string,
    amount: number,
    urgency: Urgency,
  ): Promise<number>;
}

export type BitcoinTx = {
  txid: string;
  fee: number;
  vin: {
    txid: string;
    vout: number;
    scriptsig?: string;
    scriptsig_asm?: string;
    is_coinbase: boolean;
    witness?: string[];
    sequence: number;
    prevout: {
      scriptpubkey: string;
      scriptpubkey_asm: string;
      scriptpubkey_type: string;
      scriptpubkey_address: string;
      value: number;
    };
  }[];
  vout: {
    scriptpubkey: string;
    scriptpubkey_asm: string;
    scriptpubkey_type: string;
    scriptpubkey_address: string;
    value: number;
  }[];
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
};

export type FeeRates = {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
};

export enum BitcoinNetwork {
  Mainnet = 'Mainnet',
  Testnet = 'Testnet',
  Regtest = 'Regtest',
}

export enum BitcoinTxType {
  ALL = 'ALL',
  IN = 'IN',
  OUT = 'OUT',
}

export type FeeRateKeys = keyof FeeRates;

export const UrgencyToFeeRateKey: {
  [urgency in Urgency]: FeeRateKeys;
} = {
  [Urgency.SLOW]: 'economyFee',
  [Urgency.MEDIUM]: 'hourFee',
  [Urgency.FAST]: 'fastestFee',
};
