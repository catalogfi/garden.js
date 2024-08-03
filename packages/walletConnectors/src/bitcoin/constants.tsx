import { IInjectedBitcoinProvider } from './bitcoin.types';
import { OKX_WALLET } from './providers/okx/okx';

export const XVERSE_WALLET = {
  name: 'XVerse',
  symbol: 'XVerse',
  isBTCWallet: true,
};

export const UNISAT_WALLET = {
  name: 'Unisat',
  symbol: 'Unisat',
  isBTCWallet: true,
};

export const SupportedBTCWallets = [OKX_WALLET, XVERSE_WALLET, UNISAT_WALLET];

export const STORAGE_KEY = 'bitcoinProvider';
