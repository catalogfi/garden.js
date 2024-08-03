import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import { IInjectedBitcoinProvider } from 'src/bitcoin/bitcoin.types';
import { UnisatProvider } from './provider';

export const UNISAT = {
  name: 'Unisat',
  symbol: 'Unisat',
  connect: async (): AsyncResult<IInjectedBitcoinProvider, string> => {
    if (!window.unisat) {
      return Err('unisat wallet not found');
    }
    const uniProvider = new UnisatProvider(window.unisat);
    const res = await uniProvider.connect();
    if (res.error) {
      return Err(res.error);
    }
    const updatedProvider = new UnisatProvider(window.unisat);
    return Ok(updatedProvider);
  },
};
