import { IInjectedBitcoinProvider } from 'src/bitcoin/bitcoin.types';
import { OKXProvider } from './provider';
import { AsyncResult, Err, Ok } from '@catalogfi/utils';

export const OKX_WALLET = {
  name: 'OKX Wallet (BTC)',
  symbol: 'OKX',
  connector: window.okxwallet?.bitcoin,
  connect: async (): AsyncResult<IInjectedBitcoinProvider, string> => {
    if (!window.okxwallet || !window.okxwallet.bitcoin) {
      return Err('OKX wallet not found');
    }
    const okxProvider = new OKXProvider(window.okxwallet.bitcoin);
    const res = await okxProvider.connect();
    if (res.error) {
      return Err(res.error);
    }
    const updatedProvider = new OKXProvider(window.okxwallet.bitcoin);
    return Ok(updatedProvider);
  },
};
