'use client';

import React, { useState } from 'react';
import { useDisconnect, useAccount } from 'wagmi';
import { useGarden } from '@gardenfi/react-hooks';
import InputField from './InputField';
import { swapStore } from '../../store/swapStore';
import { LogoutIcon, ExchangeIcon } from '@gardenfi/garden-book';
import BigNumber from 'bignumber.js';
import { MatchedOrder } from '@gardenfi/orderbook';
import { useAppKitConnection } from '@reown/appkit-adapter-solana/react';
import { useAppKitAccount, useAppKitProvider } from '@reown/appkit/react';
import type { Provider } from '@reown/appkit-adapter-solana/react';
import * as anchor from '@coral-xyz/anchor';

const TokenSwap: React.FC = () => {
  const [orderDetails, setOrderDetails] = useState<MatchedOrder>();
  const { isConnected: walletConnected, address } = useAppKitAccount();
  const { connection } = useAppKitConnection();
  const { walletProvider } = useAppKitProvider<Provider>('solana');

  // Accessing global swap state using Zustand store
  const {
    swapParams,
    inputAmount,
    btcAddress,
    errorMessage,
    loading,
    isBtcToWbtc,
    setSwapParams,
    setInputAmount,
    setBtcAddress,
    setErrorMessage,
    setLoading,
    toggleSwapDirection,
  } = swapStore();

  // Wallet connection handlers
  const { disconnect } = useDisconnect();
  const { isConnected, address: evmAddress } = useAccount();
  const { getQuote, swapAndInitiate } = useGarden();

  const getTrimmedVal = (address: string | undefined, start = 6, end = 4) => {
    if (!address) return '....';
    return `${address.slice(0, start)}...${address.slice(-end)}`;
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const W3MButton = 'w3m-button' as any;

  // Input validation to ensure valid swap amounts
  const validateInput = (value: string): string | null => {
    const numericValue = parseFloat(value);
    if (numericValue <= 0)
      return 'Invalid amount. Please enter a number greater than 0.';
    if (numericValue < 0.005) return 'Amount must be at least 0.005.';
    return null;
  };

  // Handle input changes and fetch quote if valid
  const handleInputChange = async (value: string) => {
    if (!getQuote) {
      console.error('getQuote is undefined.');
      return;
    }

    if (/^[0-9]*\.?[0-9]*$/.test(value)) {
      setInputAmount(value);
      const validationError = validateInput(value);
      setErrorMessage(validationError);

      if (!validationError && value) {
        await fetchQuote(value);
      } else if (value === '') {
        setSwapParams({ ...swapParams, receiveAmount: '0' });
      }
    }
  };

  // Fetch a swap quote based on user input
  const fetchQuote = async (amount: string) => {
    if (!getQuote) return;

    const amountInDecimals = new BigNumber(amount).multipliedBy(
      10 ** swapParams.fromAsset.decimals,
    );

    const quote = await getQuote({
      fromAsset: swapParams.fromAsset,
      toAsset: swapParams.toAsset,
      amount: amountInDecimals.toNumber(),
      isExactOut: false,
    });

    if (quote?.val?.quotes) {
      const [strategy, quoteAmount] = Object.entries(quote.val.quotes)[0] as [
        string,
        string,
      ];
      const quoteAmountInDecimals = new BigNumber(quoteAmount).div(
        10 ** swapParams.toAsset.decimals,
      );

      setSwapParams({
        ...swapParams,
        sendAmount: amount,
        receiveAmount: quoteAmountInDecimals.toFixed(8, BigNumber.ROUND_DOWN),
        additionalData: { strategyId: strategy },
      });
    } else {
      setSwapParams({ ...swapParams, receiveAmount: '0' });
    }
  };

  // Fetch the swap strategy before initiating a swap
  const fetchSwapQuote = async () => {
    if (!getQuote) throw new Error('Quote service unavailable.');

    const sendAmount =
      Number(swapParams.sendAmount) * 10 ** swapParams.fromAsset.decimals;

    const quote = await getQuote({
      fromAsset: swapParams.fromAsset,
      toAsset: swapParams.toAsset,
      amount: sendAmount,
    });

    if (!quote?.val) throw new Error(quote?.error || 'Error fetching quote.');

    const [strategyId, receiveAmount] = Object.entries(quote.val.quotes)[0] as [
      string,
      string,
    ];

    return { strategyId, receiveAmount };
  };

  // Perform the swap using swapAndInitiate method from useGarden hook
  const performSwap = async (strategyId: string, receiveAmount: string) => {
    if (!swapAndInitiate) throw new Error('Swap service unavailable.');

    const sendAmount = (
      Number(swapParams.sendAmount) *
      10 ** swapParams.fromAsset.decimals
    ).toString();

    const res = await swapAndInitiate({
      fromAsset: swapParams.fromAsset,
      toAsset: swapParams.toAsset,
      sendAmount,
      receiveAmount,
      additionalData: {
        btcAddress,
        strategyId,
      },
    });

    if (res?.error) throw new Error(res.error);

    return res;
  };

  // Main swap function to handle swap click
  const handleSwap = async () => {
    if (!getQuote || !swapAndInitiate) {
      console.error('Required services are unavailable.');
      return;
    }

    if (!evmAddress || !btcAddress || Number(swapParams.sendAmount) <= 0) {
      alert('Please fill in all fields correctly.');
      return;
    }

    setLoading(true);

    try {
      const { strategyId, receiveAmount } = await fetchSwapQuote();
      const swapResult = await performSwap(strategyId, receiveAmount);

      alert('Order Created successfully!');
      setOrderDetails(swapResult.val);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'An error occurred.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center p-8 bg-gray-800 h-full min-h-[inherit] rounded-2xl text-white">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold">Swap Assets</h1>
        <div className="flex space-x-2">
          {isConnected ? (
            <>
              <div className="bg-gray-700 rounded-full p-2 cursor-pointer hover:bg-gray-900">
                <span
                  onClick={() =>
                    navigator.clipboard.writeText(evmAddress || '')
                  }
                >
                  {getTrimmedVal(evmAddress || '....', 6, 4)}
                </span>
              </div>
              <div
                className="flex items-center bg-gray-700 rounded-full p-3 cursor-pointer transition-colors hover:bg-gray-900"
                onClick={() => disconnect()}
              >
                <LogoutIcon className="w-5 h-4 cursor-pointer fill-white" />
              </div>
            </>
          ) : (
            <W3MButton />
          )}
        </div>
      </div>
      <div className="relative space-y-5">
        <InputField
          id={isBtcToWbtc ? 'btc' : 'wbtc'}
          label={isBtcToWbtc ? 'Send BTC' : 'Send WBTC'}
          placeholder="0.0"
          onChange={handleInputChange}
          value={inputAmount}
          error={errorMessage}
        />
        <div
          className="absolute bg-gray-700 border border-gray-900 rounded-full left-1/2 -translate-x-1/2 -translate-y-8/10 transition-transform hover:scale-[1.1] p-1.5 cursor-pointer"
          onClick={toggleSwapDirection}
        >
          <ExchangeIcon className="fill-white" />
        </div>
        <InputField
          id={isBtcToWbtc ? 'wbtc' : 'btc'}
          label={isBtcToWbtc ? 'Receive WBTC' : 'Receive BTC'}
          placeholder="0.0"
          value={swapParams.receiveAmount.toString()}
          readOnly
        />
        <InputField
          id="receive-address"
          label="Receive Address"
          placeholder="Your Bitcoin Address"
          value={btcAddress}
          onChange={setBtcAddress}
        />

        {orderDetails && (
          <div className="p-4 bg-gray-700 space-y-2 rounded-2xl text-white">
            {isBtcToWbtc && (
              <div className="flex justify-between items-center">
                Deposit Address:{' '}
                <span
                  className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
                  onClick={() =>
                    navigator.clipboard.writeText(
                      orderDetails?.source_swap.swap_id || '',
                    )
                  }
                >
                  {getTrimmedVal(orderDetails?.source_swap.swap_id)}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              Order ID:
              <span
                onClick={() =>
                  window.open(
                    `https://gardenexplorer.hashira.io/order/${orderDetails?.create_order.create_id}`,
                    '_blank',
                  )
                }
                className="text-blue-400 underline hover:text-blue-300 cursor-pointer"
              >
                {getTrimmedVal(orderDetails?.create_order.create_id)}
              </span>
            </div>
          </div>
        )}

        <button
          onClick={() => {
            console.log({
              isConnected,
              address,
              connection,
              walletProvider,
            });
          }}
          className={`w-full p-2 cursor-pointer text-white rounded-xl ${
            loading
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-gray-700'
          }`}
          disabled={loading}
        >
          {loading ? 'Processing...' : 'Swap'}
        </button>
      </div>
    </div>
  );
};

export default TokenSwap;
