import { useGarden } from '@gardenfi/react-hooks';
import { mineBtcBlocks } from '@gardenfi/core';
import { useAccount } from 'wagmi';
import { Button } from '../common/Button';
import SwapInput from './SwapInput';
import SwapOutput from './SwapOutput';
import { useSwapStore } from '../../store/swapStore';
import { useEffect, useState } from 'react';
import BigNumber from 'bignumber.js';
import { isBitcoin } from '@gardenfi/orderbook';
import { useBitcoinWallet } from '@gardenfi/wallet-connectors';
import Transaction from '../transactions/Transactions';
import { useEnvironmentStore } from '../../store/useEnvironmentStore';
import { getLocalnetBTCWallet } from '../../utils/btcWallet';
import { Environment } from '@gardenfi/utils';

export const SwapComponent = () => {
  const { swapParams, setAdditionalId, setBtcWallet } =
    useSwapStore();
  const { address: EvmAddress } = useAccount();
  const { provider, account } = useBitcoinWallet();
  const { swapAndInitiate } = useGarden();
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);
  const environment = useEnvironmentStore((state) => state.environment);
  const localnetBtcWallet = getLocalnetBTCWallet();

  useEffect(() => {
    if (environment === Environment.LOCALNET) {
      setBtcWallet(localnetBtcWallet);
    }
  }, [setBtcWallet]);
  
  const handleFund = async () => {
    if (!swapParams.fromAsset || !swapParams.toAsset) return;
    if (environment !== 'localnet') return;

    setFunding(true);

    const btcAddress = await localnetBtcWallet.getAddress();

    try {
      const response = await fetch('http://localhost:3000/faucet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: btcAddress }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.log('Funding request sent successfully to: ', btcAddress);
    } catch (error) {
      console.error('Funding failed: ', error);
    }
    setFunding(false);
  };

  const handleSwap = async () => {
    if (
      !swapAndInitiate ||
      !EvmAddress ||
      !swapParams.sendAmount ||
      !swapParams.receiveAmount ||
      !swapParams.fromAsset ||
      !swapParams.toAsset
    )
      return;

    setLoading(true);

    const inputAmountInDecimals = new BigNumber(swapParams.sendAmount)
      .multipliedBy(10 ** swapParams.fromAsset.decimals)
      .toFixed();
    const outputAmountInDecimals = new BigNumber(swapParams.receiveAmount)
      .multipliedBy(10 ** swapParams.toAsset.decimals)
      .toFixed();

    let btcAddress = '';
    let additionalData;

    if (environment === Environment.LOCALNET) {
      btcAddress = await localnetBtcWallet.getAddress();
    }
    else {
      btcAddress = account ?? "";
    }

    if (isBitcoin(swapParams.fromAsset.chain) || isBitcoin(swapParams.toAsset.chain)) {
      additionalData = {
        strategyId: swapParams.additionalData.strategyId,
        btcAddress,
      };
      setAdditionalId(swapParams.additionalData.strategyId, btcAddress);
    }
    else {
      additionalData = {
        strategyId: swapParams.additionalData.strategyId,
      };
      setAdditionalId(swapParams.additionalData.strategyId);
    }

    const res = await swapAndInitiate({
      fromAsset: swapParams.fromAsset,
      toAsset: swapParams.toAsset,
      sendAmount: inputAmountInDecimals,
      receiveAmount: outputAmountInDecimals,
      additionalData: additionalData,
    });

    if (isBitcoin(res.val.source_swap.chain)) {
      if (provider) {
        const order = res.val;
        const bitcoinRes = await provider.sendBitcoin(
          order.source_swap.swap_id,
          Number(order.source_swap.amount),
        );
        if (bitcoinRes.error) {
          console.error('Failed to send Bitcoin ❌', bitcoinRes.error);
          setLoading(false);
        }
        return;
      } else {
        if (!localnetBtcWallet || environment !== Environment.LOCALNET) return;
        const order = res.val;
        await localnetBtcWallet.send(
          order.source_swap.swap_id,
          Number(order.source_swap.amount),
        );
        const btcAddress = await localnetBtcWallet.getAddress();
        mineBtcBlocks(2, btcAddress);
      }
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col gap-3 items-center w-full justify-center text-center bg-[#7BDCBA] ">
      <div className="w-[500px] max-w-full flex flex-col gap-3">
        <div className="p-8 rounded-xl bg-white/50 gap-3 flex flex-col w-full">
          <h2 className="text-lg font-semibold">Create order</h2>
          {environment === 'localnet' && (
            <Button onClick={handleFund} disabled={funding}>
              {funding ? 'Funding...' : 'Fund BTC'}
            </Button>
          )}
          <div className="flex items-center justify-between gap-6">
            <SwapInput />
            <SwapOutput />
          </div>
          <Button onClick={handleSwap} disabled={loading}>
            {loading ? 'Swapping...' : 'Swap'}
          </Button>
        </div>
        <div className="w-full">
          <Transaction />
        </div>
      </div>
    </div>
  );
};

export default SwapComponent;
