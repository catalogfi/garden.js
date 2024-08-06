import React, { createContext, useContext, useEffect, useState } from 'react';
import { Debridge } from '../debridge';
import {
  DEBRIDGE_DOMAIN,
  DEBRIDGE_POINTS_DOMAIN,
  DEBRIDGE_TX_DOMAIN,
  DEBRIDGE_TXS_CACHE_KEY,
} from '../constants';
import { DeBridgeTransaction } from 'src/debridge.api.types';
import { SwapConfig, SwapResponse } from 'src/debridge.types';
import { AsyncResult, Err, Ok } from '@catalogfi/utils';
import {
  DebridgeContextType,
  DebridgeProviderProps,
} from './useDebridge.types';

const DebridgeContext = createContext<DebridgeContextType>(
  {} as DebridgeContextType
);

export const DebridgeProvider = ({
  children,
  address,
  store,
}: DebridgeProviderProps) => {
  const [txs, oldSetTxs] = useState<Record<string, DeBridgeTransaction[]>>({});
  //stores the tx hashes of the unconfirmed txs
  const [unconfirmedTxs, setUnconfirmedTxs] = useState<string[]>([]);
  const cacheKey = DEBRIDGE_TXS_CACHE_KEY + address.toLowerCase();
  const setTxs = (...args: Parameters<typeof oldSetTxs>) => {
    if (!address) return;
    store.setItem(cacheKey, JSON.stringify(txs));
    oldSetTxs(...args);
  };

  useEffect(() => {
    if (!unconfirmedTxs || unconfirmedTxs.length === 0 || !address) return;

    const confirmTxs = async () => {
      const confirmedTxsIndices = new Set();

      const promises = unconfirmedTxs.map(async (txHash, i) => {
        const tx = await debridge.getTx(txHash);
        if (tx.error || tx.val.orders.length === 0) return;
        confirmedTxsIndices.add(i);
        return tx.val.orders[0];
      });

      const confirmedTxs = (await Promise.all(promises)).filter((tx) => !!tx);
      const newUnconfirmedTxs = unconfirmedTxs.filter(
        (_, i) => !confirmedTxsIndices.has(i)
      );

      if (newUnconfirmedTxs.length === 0) return;

      setUnconfirmedTxs(newUnconfirmedTxs);
      setTxs((txs) => ({
        ...txs,
        [cacheKey]: [...txs[cacheKey], ...confirmedTxs],
      }));
    };

    confirmTxs();
    const interval = setInterval(confirmTxs, 5 * 1000);

    return () => clearInterval(interval);
  }, [unconfirmedTxs]);

  const debridge = new Debridge({
    debridgeDomain: DEBRIDGE_DOMAIN,
    debridgeTxDomain: DEBRIDGE_TX_DOMAIN,
    debridgePointsDomain: DEBRIDGE_POINTS_DOMAIN,
  });

  useEffect(() => {
    if (!address) return;
    (async () => {
      const debridgeTxs = await debridge.getTxs({
        address,
      });

      if (debridgeTxs.error) {
        const cachedTxs = JSON.parse(store.getItem(cacheKey) || '[]');
        setTxs((txs) => ({ ...txs, [cacheKey]: cachedTxs }));
        return;
      }

      setTxs((txs) => ({ ...txs, [cacheKey]: debridgeTxs.val.orders }));
    })();
  }, [address]); //txs change with address

  const swap = async (
    swapConfig: SwapConfig
  ): AsyncResult<SwapResponse, string> => {
    const swapRes = await debridge.swap(swapConfig);

    if (swapRes.error) return Err(swapRes.error);

    setUnconfirmedTxs((txs) => [...txs, swapRes.val.txHash]);

    return Ok(swapRes.val);
  };

  return (
    <DebridgeContext.Provider value={{ debridge, store, swap, txs }}>
      {children}
    </DebridgeContext.Provider>
  );
};

export const useDebridge = () => {
  const context = useContext(DebridgeContext);
  if (context === undefined) {
    throw new Error('useDebridge must be used within a DebridgeProvider');
  }
  return context;
};
