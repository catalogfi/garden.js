import { IStore } from '@gardenfi/utils';
import React, { ReactNode, useContext, useEffect, useState } from 'react';
import { Debridge } from '../debridge';
import { DEBRIDGE_TXS_CACHE_KEY } from 'src/constants';
import { DeBridgeTransaction } from 'src/debridge.api.types';
import { SwapConfig, SwapResponse } from 'src/debridge.types';
import { AsyncResult, Err, Ok } from '@catalogfi/utils';

type DebridgeContextType = {
  debridge: Debridge;
  store: IStore;
  swap: (swapConfig: SwapConfig) => AsyncResult<SwapResponse, string>;
  txs: Record<string, DeBridgeTransaction[]>;
};

const DebridgeContext = React.createContext<DebridgeContextType>(
  {} as DebridgeContextType
);

export const useDebridge = () => useContext(DebridgeContext);

export type UseDebridgeProps = {
  debridge: Debridge;
  store: IStore;
};

export const DebridgeProvider = ({
  children,
  address,
  store,
}: {
  children: ReactNode;
  address: `0x${string}`;
  store: IStore;
}) => {
  const [txs, oldSetTxs] = useState<Record<string, DeBridgeTransaction[]>>({});
  const setTxs = (...args: Parameters<typeof oldSetTxs>) => {
    store.setItem(DEBRIDGE_TXS_CACHE_KEY, JSON.stringify(txs));
    oldSetTxs(...args);
  };

  const cacheKey = DEBRIDGE_TXS_CACHE_KEY + address.toLowerCase();
  const debridge = new Debridge({
    debridgeDomain: 'https://api.dln.trade/v1.0',
    debridgeTxDomain: 'https://stats-api.dln.trade/api/Orders',
    debridgePointsDomain: 'https://points-api.debridge.finance/api/points',
  });

  useEffect(() => {
    if (!address) return;
    (async () => {
      const debridgeTxs = await debridge.getTxs({
        address,
      });

      if (debridgeTxs.error) {
        const cachedTxs = JSON.parse(
          store.getItem(DEBRIDGE_TXS_CACHE_KEY) || '[]'
        );
        setTxs((txs) => ({ ...txs, [`${cacheKey}`]: cachedTxs }));
        return;
      }

      setTxs((txs) => ({ ...txs, [`${cacheKey}`]: debridgeTxs.val.orders }));
    })();
  }, [address]); //txs change with address

  const swap = async (
    swapConfig: SwapConfig
  ): AsyncResult<SwapResponse, string> => {
    const swapRes = await debridge.swap(swapConfig);

    if (swapRes.error) return Err(swapRes.error);

    const txHash = swapRes.val.txHash;
    const tx = await debridge.getTx(txHash);

    if (tx.error) return Err(tx.error);

    setTxs((txs) => ({
      ...txs,
      [`${cacheKey}`]: [...txs[cacheKey], tx.val.orders[0]],
    }));

    return Ok(swapRes.val);
  };

  return (
    <DebridgeContext.Provider value={{ debridge, store, swap, txs }}>
      {children}
    </DebridgeContext.Provider>
  );
};
