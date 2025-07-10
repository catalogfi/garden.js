import { useGarden } from '@gardenfi/react-hooks';
import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { Button } from '../common/Button';
import { chainToAsset } from '../../constants/constants';
import SwapInput from './SwapInput';
import SwapOutput from './SwapOutput';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import {
  Provider,
  useAppKitConnection,
} from '@reown/appkit-adapter-solana/react';

export const SwapComponent = () => {
  const [loading, setLoading] = useState(false);
  const [swapParams, setSwapParams] = useState({
    inputToken: chainToAsset.ethereum_localnet,
    outputToken: chainToAsset.arbitrum_localnet,
    inputAmount: 0.001,
    outputAmount: 0.0009,
    btcAddress: '',
  });

  const { garden } = useGarden();

  const { address: EvmAddress } = useAccount();
  const { swapAndInitiate, getQuote } = useGarden();

  useEffect(() => {
    const fetchQuote = async () => {
      if (
        !swapParams.inputAmount ||
        !swapParams.inputToken ||
        !swapParams.outputToken
      )
        return;

      try {
        if (!getQuote) return;
        console.log('swapParams', swapParams);
        const quote = await getQuote({
          fromAsset: swapParams.inputToken,
          toAsset: swapParams.outputToken,
          amount: swapParams.inputAmount * 10 ** swapParams.inputToken.decimals,
        });
        if (!quote) return;

        if (quote.ok && quote.val) {
          const strategyId = Object.keys(quote.val.quotes)[0];
          const receiveAmount = Object.values(quote.val.quotes)[0];

          setSwapParams((prev) => ({
            ...prev,
            outputAmount:
              Number(receiveAmount) / 10 ** swapParams.outputToken.decimals,
            strategyId: strategyId,
          }));
        }
      } catch (error) {
        console.error('Failed to fetch quote:', error);
      }
    };

    fetchQuote();
  }, [
    swapParams.inputAmount,
    swapParams.inputToken,
    swapParams.outputToken,
    getQuote,
  ]);

  const handleSwap = async () => {
    const sendAmount =
      swapParams.inputAmount * 10 ** swapParams.inputToken.decimals;
    const receiveAmount =
      swapParams.outputAmount * 10 ** swapParams.outputToken.decimals;
    if (
      !swapAndInitiate ||
      !EvmAddress ||
      !swapParams.inputAmount ||
      !swapParams.outputAmount
    )
      return;
    console.log({
      sendAddress: EvmAddress,
      receiveAddress: EvmAddress,
      fromAsset: swapParams.inputToken,
      toAsset: swapParams.outputToken,
      sendAmount: sendAmount.toFixed(),
      receiveAmount: receiveAmount.toFixed(),
      minDestinationConfirmations: 3,
    });

    setLoading(true);
    const res = await swapAndInitiate({
      fromAsset: swapParams.inputToken,
      toAsset: swapParams.outputToken,
      sendAmount: sendAmount.toString(),
      receiveAmount: receiveAmount.toString(),
      minDestinationConfirmations: 3,
      additionalData: {
        btcAddress: swapParams.btcAddress,
        strategyId: '1',
      },
    });
    setLoading(false);
    console.log('res.error :', res.error);
    console.log('res.ok :', res.ok);
    console.log('res.val :', res.val);
  };

  const handleBtcInput = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSwapParams({ ...swapParams, btcAddress: event.target.value });
  };

  const handleInitialize = async () => {
    if (!garden) return;
    await garden.secretManager.initialize();
  };

  return (
    <div className="flex flex-col gap-3 items-center w-full justify-center text-center bg-[#7BDCBA] ">
      {/* Swap Component here */}
      <div className="p-8 rounded-xl bg-white/50 gap-3 flex flex-col">
        <h2 className="text-lg font-semibold">Create order</h2>
        <div className="flex items-center justify-between gap-6">
          <SwapInput setSwapParams={setSwapParams} swapParams={swapParams} />
          <SwapOutput setSwapParams={setSwapParams} swapParams={swapParams} />
        </div>
        <div className="px-2 py-1 rounded-lg w-full bg-white">
          <input
            type="text"
            placeholder="BTC address"
            className="w-full focus:outline-none active:outline-none"
            value={swapParams.btcAddress}
            onChange={(event) => handleBtcInput(event)}
          />
        </div>
        <div
          className={`flex flex-col gap-2 rounded-md ${
            loading
              ? 'pointer-events-none text-[#E36492]'
              : 'pointer-events-auto'
          }`}
        >
          <Button
            className="text-center items-center justify-center font-medium text-lg bg-opacity-80 hover:bg-opacity-100 bg-[#E36492]"
            secondary={loading}
            onClick={handleSwap}
          >
            {loading ? 'Swapping...' : 'Swap'}
          </Button>
          <Button
            className="text-center items-center justify-center font-medium text-lg bg-opacity-80 hover:bg-opacity-100 bg-[#E36492]"
            secondary={loading}
            onClick={handleInitialize}
          >
            Initialize
          </Button>
        </div>
      </div>
    </div>
  );
};

export default SwapComponent;
