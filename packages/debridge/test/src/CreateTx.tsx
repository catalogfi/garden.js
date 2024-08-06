import React, { useState } from 'react';
import { useDebridge } from '../../src/hooks/useDebridge';
import { Debridge, tokens } from '@gardenfi/debridge';
import { useAccount, useWalletClient } from 'wagmi';
import { config } from './config';
import { DeBridgeTransaction } from '../../src/debridge.api.types';
import { DEBRIDGE_TXS_CACHE_KEY } from '../../src/constants';
import { switchChain } from 'viem/actions';

const CreateTx = () => {
  const result = useWalletClient({ config });
  const [inputAmount, setInputAmount] = useState('');
  const [outputAmount, setOutputAmount] = useState('');
  const { address } = useAccount();
  const { txs, swap, debridge } = useDebridge();

  const cacheKey = DEBRIDGE_TXS_CACHE_KEY + address?.toLowerCase();

  const onInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputAmount(e.target.value);
    if (!address) return;
    const quoteRes = await (debridge as Debridge).quote({
      fromToken: tokens.arbitrum.WBTC,
      toToken: tokens.ethereum.WBTC,
      amount: e.target.value,
      toAddress: address,
      fromAddress: address,
      isExactOut: false,
    });

    console.log(quoteRes.val);

    if (!quoteRes.ok) {
      console.error(quoteRes.error);
    }

    setOutputAmount(quoteRes.val.quote.toString());
  };

  const onOutputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setOutputAmount(e.target.value);
    if (!address) return;
    const quoteRes = await (debridge as Debridge).quote({
      fromToken: tokens.arbitrum.WBTC,
      toToken: tokens.ethereum.WBTC,
      amount: e.target.value,
      toAddress: address,
      fromAddress: address,
      isExactOut: true,
    });

    if (!quoteRes.ok) {
      console.error(quoteRes.error);
    }

    setInputAmount(quoteRes.val.quote);
  };

  const onSubmit = async () => {
    if (!address || !result.data) return;

    //switch chain if needed

    switchChain(result.data, {
      id: tokens.arbitrum.WBTC.chainId,
    });

    const swapResult = await swap({
      fromToken: tokens.arbitrum.WBTC,
      toToken: tokens.ethereum.WBTC,
      amount: inputAmount,
      toAddress: address,
      fromAddress: address,
      isExactOut: false,
      client: result.data,
    });

    console.log(swapResult.ok, swapResult.error, swapResult.val);
  };

  return (
    <div>
      <input type="number" value={inputAmount} onChange={onInputChange} />
      <input type="number" value={outputAmount} onChange={onOutputChange} />
      <button onClick={onSubmit}>Submit</button>
      <br></br>
      {address &&
        txs[cacheKey] &&
        txs[cacheKey].map((tx: DeBridgeTransaction) => {
          return (
            <div>
              <div>------------------</div>
              <div>{tx.orderId.stringValue}</div>
              <div>in amount {tx.preswapData.inAmount.stringValue}</div>
              <div>out amount {tx.preswapData.outAmount.stringValue}</div>
            </div>
          );
        })}
    </div>
  );
};

export default CreateTx;
