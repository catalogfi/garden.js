'use client';

import React, { useEffect, useState } from 'react';
import { useDisconnect, useAccount } from 'wagmi';
import InputField from './InputField';
import { swapStore } from '../../store/swapStore';
import { LogoutIcon, ExchangeIcon } from '@gardenfi/garden-book';
import BigNumber from 'bignumber.js';
import {
  EthereumLocalnet,
  MatchedOrder,
  SupportedAssets,
} from '@gardenfi/orderbook';
import * as anchor from '@coral-xyz/anchor';
import { web3 } from '@coral-xyz/anchor';
import { BlockNumberFetcher, Garden, SwapParams } from '@gardenfi/core';
import { Environment, with0x } from '@gardenfi/utils';
import { privateKeyToAccount } from 'viem/accounts';
import { createWalletClient, http } from 'viem';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';

const TokenSwap: React.FC = () => {
  const TEST_RPC_URL = 'http://localhost:8899';
  const TEST_RELAY_URL = new URL('http://localhost:5014/relay');
  const TEST_SWAPPER_RELAYER = 'http://localhost:4426';
  const TEST_PRIVATE_KEY =
    '0x8fe869193b5010d1ee36e557478b43f2ade908f23cac40f024d4aa1cd1578a61';
  const TEST_RELAYER_ADDRESS = 'AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9';
  const TEST_BLOCKFETCHER_URL = 'http://localhost:3008';

  const [orderDetails, setOrderDetails] = useState<MatchedOrder>();
  const [gardenObj, setGardenObj] = useState<Garden | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const [bitcoinAdd, setBitcoinAdd] = useState('');

  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();

  useEffect(() => {
    console.log('Anchor wallet:: ', wallet);
    if (wallet) {
      initializeGarden();
    }
  }, [wallet]);

  async function fundBTC(to: string): Promise<void> {
    const payload = JSON.stringify({
      address: to,
    });

    const res = await fetch('http://127.0.0.1:3000/faucet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: payload,
    });

    const data = await res.text();

    if (!res.ok) {
      throw new Error(data);
    }

    const dat: { txId?: string } = JSON.parse(data);

    if (!dat.txId) {
      throw new Error('Not successful');
    }
  }

  const fundSolWallet = async (
    connection: web3.Connection,
    userProvider: anchor.AnchorProvider,
  ) => {
    try {
      console.log('Airdropping 10 SOL to the user for testing');
      const signature = await connection.requestAirdrop(
        userProvider.publicKey,
        web3.LAMPORTS_PER_SOL * 10,
      );
      await connection.confirmTransaction({
        signature,
        ...(await connection.getLatestBlockhash()),
      });
      console.log('Airdrop Success');
    } catch (e) {
      console.log('Error in airdropping:: ', e);
    }
  };

  const initializeGarden = async () => {
    if (!connection) {
      console.error('Connection or wallet provider not available');
      return null;
    }

    const solanaProvider = new anchor.AnchorProvider(connection, wallet!, {
      commitment: 'confirmed',
    });
    console.log('solanaProvider:: ', solanaProvider);

    const account = privateKeyToAccount(with0x(TEST_PRIVATE_KEY));
    console.log('account :', account.address);

    fundSolWallet(connection, solanaProvider);

    const arbitrumWalletClient = createWalletClient({
      account,
      chain: EthereumLocalnet as any,
      transport: http(),
    });

    console.log('Creating bitcoin wallet');
    let bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Regtest,
      'http://localhost:30000',
    );
    let btcWalletx: BitcoinWallet = BitcoinWallet.createRandom(bitcoinProvider);
    let BTC_ADDRESS = await btcWalletx.getAddress();
    console.log('Bitcoin wallet created!::', BTC_ADDRESS);

    setBitcoinAdd(BTC_ADDRESS);

    await fundBTC(BTC_ADDRESS);

    const garden = new Garden({
      environment: Environment.LOCALNET,
      evmWallet: arbitrumWalletClient as any,
      solWallet: solanaProvider as any,
      btcWallet: btcWalletx as any,
      solanaRelayUrl: TEST_RELAY_URL,
      orderbookURl: TEST_SWAPPER_RELAYER,
      solanaRelayerAddress: TEST_RELAYER_ADDRESS,
      blockNumberFetcher: new BlockNumberFetcher(
        TEST_BLOCKFETCHER_URL,
        Environment.LOCALNET,
      ),
      apiKey:
        'AAAAAGghjwU6Os1DVFgmUXj0GcNt5jTJPbBmXKw7xRARW-qivNy4nfpKVgMNebmmxig2o3v-6M4l_ZmCgLp3vKywfVXDYBcL3M4c',
      quote: 'http://localhost:6969',
    });

    console.log('Garden initialized...');
    setGardenObj(garden);
    return garden;
  };

  const swapSOLTowBTC = async () => {
    if (!gardenObj) {
      console.error('Garden not initialized');
      alert('Garden not initialized. Please try again.');
      return;
    }

    setIsSwapping(true);
    let executionTimeoutId: number | undefined;
    let order: MatchedOrder | undefined;

    try {
      // Create order and match
      const orderObj: SwapParams = {
        fromAsset: SupportedAssets.localnet.solana_localnet_SOL,
        toAsset: SupportedAssets.localnet.bitcoin_regtest_BTC,
        sendAmount: '10000000',
        receiveAmount: '998000',
        additionalData: { strategyId: 'sl4sal78' },
        minDestinationConfirmations: 2,
      };

      console.log('Creating SOL to wBTC swap order...');
      const result = await gardenObj.swap(orderObj);
      console.log('Result of swap method', result);

      if (result.error) {
        throw new Error(`Failed to create swap order: ${result.error}`);
      }

      order = result.val;
      console.log('Matched order created:', order);
      setOrderDetails(order);

      // Set up event listeners for order execution
      const executePromise = new Promise<void>((resolve, reject) => {
        // Set up event listeners
        gardenObj.on('error', (errOrder: MatchedOrder, error: string) => {
          console.error(
            `Error executing order ${errOrder.create_order.create_id}: ${error}`,
          );
          if (
            order &&
            errOrder.create_order.create_id === order.create_order.create_id
          ) {
            reject(new Error(error));
          }
        });

        gardenObj.on(
          'success',
          (successOrder: MatchedOrder, action: string) => {
            console.log(
              `Successfully executed ${action} for order ${successOrder.create_order.create_id}`,
            );
            if (
              order &&
              successOrder.create_order.create_id ===
                order.create_order.create_id
            ) {
              resolve();
            }
          },
        );

        gardenObj.on('log', (id: string, message: string) => {
          console.log(`Log [${id}]: ${message}`);
        });

        gardenObj.on('onPendingOrdersChanged', (orders: MatchedOrder[]) => {
          console.log(`Pending orders: ${orders.length}`);
          orders.forEach((pendingOrder) => {
            console.log(
              `Pending order: ${pendingOrder.create_order.create_id}`,
            );
          });
        });

        // Set a timeout for the execution (90 seconds, matching the test timeout)
        executionTimeoutId = window.setTimeout(() => {
          console.log('Execution timeout reached, but continuing...');
          resolve();
        }, 90000);
      });

      // Start execution and wait for completion or timeout
      console.log('Executing swap order...');
      gardenObj.execute().catch((error) => {
        console.error('Error during garden execution:', error);
      });

      // Wait for completion (either success, error, or timeout)
      await executePromise;

      console.log('Swap process completed');
      alert('Swap completed successfully!');
    } catch (error) {
      console.error('Error during swap:', error);
      alert(
        `Error during swap: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      // Clean up
      if (executionTimeoutId) {
        window.clearTimeout(executionTimeoutId);
      }

      setIsSwapping(false);
    }
  };

  const swapSOLToBTC = async () => {
    if (!gardenObj) {
      console.error('Garden not initialized');
      alert('Garden not initialized. Please try again.');
      return;
    }

    setIsSwapping(true);
    let executionTimeoutId: number | undefined;
    let order: MatchedOrder | undefined;

    try {
      // Create order and match
      const orderObj: SwapParams = {
        fromAsset: SupportedAssets.localnet.solana_localnet_SOL,
        toAsset: SupportedAssets.localnet.bitcoin_regtest_BTC,
        sendAmount: '20010',
        receiveAmount: '2000',
        additionalData: {
          strategyId: 'sl4sbrbc',
          btcAddress: bitcoinAdd, // Using the btcAddress from the state
        },
        minDestinationConfirmations: 3,
      };

      console.log('Creating SOL to BTC swap order...');
      const result = await gardenObj.swap(orderObj);
      console.log('Result of swap method', result);

      if (result.error) {
        throw new Error(`Failed to create swap order: ${result.error}`);
      }

      order = result.val;
      console.log('Matched order created:', order);
      setOrderDetails(order);

      // Set up event listeners for order execution
      const executePromise = new Promise<void>((resolve, reject) => {
        // Set up event listeners
        gardenObj.on('error', (errOrder: MatchedOrder, error: string) => {
          console.error(
            `Error executing order ${errOrder.create_order.create_id}: ${error}`,
          );
          if (
            order &&
            errOrder.create_order.create_id === order.create_order.create_id
          ) {
            reject(new Error(error));
          }
        });

        gardenObj.on(
          'success',
          (successOrder: MatchedOrder, action: string) => {
            console.log(
              `Successfully executed ${action} for order ${successOrder.create_order.create_id}`,
            );
            if (
              order &&
              successOrder.create_order.create_id ===
                order.create_order.create_id
            ) {
              resolve();
            }
          },
        );

        gardenObj.on('log', (id: string, message: string) => {
          console.log(`Log [${id}]: ${message}`);
        });

        gardenObj.on('onPendingOrdersChanged', (orders: MatchedOrder[]) => {
          console.log(`Pending orders: ${orders.length}`);
          orders.forEach((pendingOrder) => {
            console.log(
              `Pending order: ${pendingOrder.create_order.create_id}`,
            );
          });
        });

        gardenObj.on('rbf', (rbfOrder: MatchedOrder, result: unknown) => {
          console.log(
            `RBF for order ${rbfOrder.create_order.create_id}: ${JSON.stringify(
              result,
            )}`,
          );
        });

        // Set a timeout for the execution (90 seconds, matching the test timeout)
        executionTimeoutId = window.setTimeout(() => {
          console.log('Execution timeout reached, but continuing...');
          resolve();
        }, 90000);
      });

      // Start execution and wait for completion or timeout
      console.log('Executing swap order...');
      gardenObj.execute().catch((error) => {
        console.error('Error during garden execution:', error);
      });

      // Wait for completion (either success, error, or timeout)
      await executePromise;

      console.log('Swap process completed');
      alert('Swap completed successfully!');
    } catch (error) {
      console.error('Error during swap:', error);
      alert(
        `Error during swap: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`,
      );
    } finally {
      // Clean up
      if (executionTimeoutId) {
        window.clearTimeout(executionTimeoutId);
      }

      setIsSwapping(false);
    }
  };

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
  // const handleInputChange = async (value: string) => {
  //   if (!getQuote) {
  //     console.error('getQuote is undefined.');
  //     return;
  //   }

  //   if (/^[0-9]*\.?[0-9]*$/.test(value)) {
  //     setInputAmount(value);
  //     const validationError = validateInput(value);
  //     setErrorMessage(validationError);

  //     if (!validationError && value) {
  //       await fetchQuote(value);
  //     } else if (value === '') {
  //       setSwapParams({ ...swapParams, receiveAmount: '0' });
  //     }
  //   }
  // };

  // Fetch a swap quote based on user input
  // const fetchQuote = async (amount: string) => {
  //   if (!getQuote) return;

  //   const amountInDecimals = new BigNumber(amount).multipliedBy(
  //     10 ** swapParams.fromAsset.decimals,
  //   );

  //   const quote = await getQuote({
  //     fromAsset: swapParams.fromAsset,
  //     toAsset: swapParams.toAsset,
  //     amount: amountInDecimals.toNumber(),
  //     isExactOut: false,
  //   });

  //   if (quote?.val?.quotes) {
  //     const [strategy, quoteAmount] = Object.entries(quote.val.quotes)[0] as [
  //       string,
  //       string,
  //     ];
  //     const quoteAmountInDecimals = new BigNumber(quoteAmount).div(
  //       10 ** swapParams.toAsset.decimals,
  //     );

  //     setSwapParams({
  //       ...swapParams,
  //       sendAmount: amount,
  //       receiveAmount: quoteAmountInDecimals.toFixed(8, BigNumber.ROUND_DOWN),
  //       additionalData: { strategyId: strategy },
  //     });
  //   } else {
  //     setSwapParams({ ...swapParams, receiveAmount: '0' });
  //   }
  // };

  // Fetch the swap strategy before initiating a swap
  // const fetchSwapQuote = async () => {
  //   if (!getQuote) throw new Error('Quote service unavailable.');

  //   const sendAmount =
  //     Number(swapParams.sendAmount) * 10 ** swapParams.fromAsset.decimals;

  //   const quote = await getQuote({
  //     fromAsset: swapParams.fromAsset,
  //     toAsset: swapParams.toAsset,
  //     amount: sendAmount,
  //   });

  //   if (!quote?.val) throw new Error(quote?.error || 'Error fetching quote.');

  //   const [strategyId, receiveAmount] = Object.entries(quote.val.quotes)[0] as [
  //     string,
  //     string,
  //   ];

  //   return { strategyId, receiveAmount };
  // };

  // Perform the swap using swapAndInitiate method from useGarden hook
  // const performSwap = async (strategyId: string, receiveAmount: string) => {
  //   if (!swapAndInitiate) throw new Error('Swap service unavailable.');

  //   const sendAmount = (
  //     Number(swapParams.sendAmount) *
  //     10 ** swapParams.fromAsset.decimals
  //   ).toString();

  //   const res = await swapAndInitiate({
  //     fromAsset: swapParams.fromAsset,
  //     toAsset: swapParams.toAsset,
  //     sendAmount,
  //     receiveAmount,
  //     additionalData: {
  //       btcAddress,
  //       strategyId,
  //     },
  //   });

  //   if (res?.error) throw new Error(res.error);

  //   return res;
  // };

  // Main swap function to handle swap click
  // const handleSwap = async () => {
  //   if (gardenObj) {
  //     // Use the garden object for direct SOL to wBTC swap
  //     await swapSOLTowBTC(gardenObj);
  //   } else if (getQuote && swapAndInitiate) {
  //     // Use the regular flow
  //     if (!evmAddress || !btcAddress || Number(swapParams.sendAmount) <= 0) {
  //       alert('Please fill in all fields correctly.');
  //       return;
  //     }

  //     setLoading(true);

  //     try {
  //       const { strategyId, receiveAmount } = await fetchSwapQuote();
  //       const swapResult = await performSwap(strategyId, receiveAmount);

  //       alert('Order Created successfully!');
  //       setOrderDetails(swapResult.val);
  //     } catch (error) {
  //       alert(error instanceof Error ? error.message : 'An error occurred.');
  //     } finally {
  //       setLoading(false);
  //     }
  //   } else {
  //     console.error('Required services are unavailable.');
  //   }
  // };

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
            <WalletMultiButton />
          )}
        </div>
      </div>
      <div className="relative space-y-5">
        <InputField
          id={isBtcToWbtc ? 'btc' : 'wbtc'}
          label={isBtcToWbtc ? 'Send BTC' : 'Send WBTC'}
          placeholder="0.0"
          onChange={() => {}}
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
          onClick={() => swapSOLToBTC()}
          className={`w-full p-2 cursor-pointer text-white rounded-xl ${
            loading || isSwapping
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gray-900 hover:bg-gray-700'
          }`}
          disabled={loading || isSwapping}
        >
          {loading || isSwapping ? 'Processing...' : 'Swap'}
        </button>
      </div>
    </div>
  );
};

export default TokenSwap;
