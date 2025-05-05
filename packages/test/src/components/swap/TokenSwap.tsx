'use client';

import React, { useEffect, useState } from 'react';
import { useDisconnect, useAccount } from 'wagmi';
import InputField from './InputField';
import { swapStore } from '../../store/swapStore';
import { LogoutIcon, ExchangeIcon } from '@gardenfi/garden-book';
import {
  MatchedOrder,
  Orderbook,
  SupportedAssets,
} from '@gardenfi/orderbook';
import * as anchor from '@coral-xyz/anchor';
// import { web3 } from '@coral-xyz/anchor';
import { API, BlockNumberFetcher, EvmRelay, Garden, Quote, SwapParams } from '@gardenfi/core';
import { DigestKey, Environment, Siwe, Url, with0x } from '@gardenfi/utils';
import { privateKeyToAccount } from 'viem/accounts';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  AnchorWallet,
  useAnchorWallet,
  useConnection,
  useWallet,
} from '@solana/wallet-adapter-react';
import {
  BitcoinNetwork,
  BitcoinProvider,
  BitcoinWallet,
} from '@catalogfi/wallets';

import {SolanaHTLC} from "../../../../core/src/lib/solana/htlc/solanaHTLC";
import {SolanaRelay} from "../../../../core/src/lib/solana/relayer/solanaRelay";
import {SolanaRelayerAddress} from "../../../../core/src/lib/solana/constants";
import { Button } from '../common/Button';


// EVM Part
import { useAccount as useEvmAccount, useConnect, useWalletClient } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { createWalletClient, http, custom } from 'viem';
import { arbitrumSepolia } from 'viem/chains';
import { Transaction } from '@solana/web3.js';

const TokenSwap: React.FC = () => {
  const TEST_RPC_URL = 'https://api.devnet.solana.com';
const TEST_ORDERBOOK_STAGE = "https://testnet.api.hashira.io";
  const TEST_PRIVATE_KEY =
    '9c1508f9071bf5fefc69fbb71c98cd3150a323e953c6979ef8b508f1461dd2e1';
  const TEST_RELAYER_ADDRESS = 'AKnL4NNf3DGWZJS6cPknBuEGnVsV4A4m5tgebLHaRSZ9';
  const TEST_BLOCKFETCHER_URL = "https://info-stage.hashira.io/";
  const TEST_STAGE_QUOTE = "https://testnet.api.hashira.io/quote";
  const TEST_STAGE_AUTH = "https://testnet.api.hashira.io/auth";
const TEST_STAGE_EVM_RELAY = "https://testnet.api.hashira.io/relayer"

  const [btcAdd, setBtcAdd] = useState('');
  let BTC_ADDRESS: string;
  
  const [orderDetails, setOrderDetails] = useState<MatchedOrder>();
  const [gardenObj, setGardenObj] = useState<Garden | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);

  // EVM Wallet
  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const wallet = useAnchorWallet();
  const [ancWallet, setAncWallet] = useState<anchor.AnchorProvider | null>();

  useEffect(() => {
    console.log('Anchor wallet:: ', wallet);
    if (wallet) {
      initializeGarden();
    }
  }, [wallet]);

  const { address, isConnected:isEVMConnected } = useAccount();
  const { connect } = useConnect();
  const { data: walletClient } = useWalletClient();
  const [arbitrumWalletClient, setArbitrumWalletClient] = useState(null);

  const handleEvmConnect = () => {
    connect({ connector: injected() });
  };

  // Listen for wallet connection and update arbitrumWalletClient
  useEffect(() => {
    if (isEVMConnected && walletClient && address) {
      const newWalletClient = createWalletClient({
        account: address,
        chain: arbitrumSepolia,
        transport: custom(walletClient.transport),
      });
      
      setArbitrumWalletClient(newWalletClient);
      console.log('Connected to EVM wallet:', address);
      console.log('Arbitrum wallet client created');
    }
  }, [isEVMConnected, walletClient, address]);



  const initializeGarden = async () => {
    if (!connection) {
      console.error('Connection or wallet provider not available');
      return null;
    }

  // Check if EVM wallet is connected, if not prompt the user to connect
  if (!isEVMConnected) {
    console.log('EVM wallet not connected, prompting user to connect...');
    try {
      await connectToMetaMask();
    } catch (error) {
      console.error('Failed to connect to MetaMask:', error);
      // alert('Please connect your MetaMask wallet to continue');
      return null;
    }
  }

  // Check again after connection attempt
  if (!isEVMConnected || !arbitrumWalletClient) {
    console.error('EVM wallet still not connected');
    // alert('Please connect your MetaMask wallet to continue');
    return null;
  }

    const solanaProvider = new anchor.AnchorProvider(connection, wallet!, {
      commitment: 'confirmed',
       skipPreflight: true,
  preflightCommitment: 'confirmed',
    });
    console.log('solanaProvider:: ', solanaProvider);
    setAncWallet(solanaProvider)

    const account = privateKeyToAccount(with0x(TEST_PRIVATE_KEY));
    console.log('account :', account.address);


    const arbitrumWalletClientObj = createWalletClient({
      account,
      chain: arbitrumSepolia as any,
      transport: http(),
    });

    console.log('Creating bitcoin wallet');
    let bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Testnet,
      'https://mempool.space/testnet4/api/',
    );
    let btcWalletx: BitcoinWallet = BitcoinWallet.fromPrivateKey("02438b87e7153f29c954b21d9019118fc40d88a51943a7b5e19e82a32a308206", bitcoinProvider);
    BTC_ADDRESS = await btcWalletx.getAddress();
    console.log('Bitcoin wallet created!::', BTC_ADDRESS);
    console.log("Setting bitcoin address")
    setBtcAdd(BTC_ADDRESS)

    let digestKey = DigestKey.generateRandom()
    const auth = Siwe.fromDigestKey(new Url(TEST_STAGE_AUTH), digestKey.val);

    const garden = new Garden({
      environment: Environment.TESTNET,
      digestKey: digestKey.val,
      htlc: {
        // solana: new SolanaHTLC(solanaProvider),
        solana: new SolanaRelay(solanaProvider, new Url(API.testnet.solanaRelay), SolanaRelayerAddress.testnet),
        evm: new EvmRelay(
          TEST_STAGE_EVM_RELAY,
          arbitrumWalletClient,
          auth
        )
      },
      btcWallet: btcWalletx as any,
              blockNumberFetcher: new BlockNumberFetcher(TEST_BLOCKFETCHER_URL, Environment.TESTNET),
     orderbook: new Orderbook(new Url(TEST_ORDERBOOK_STAGE)),
       quote: new Quote(TEST_STAGE_QUOTE),
         auth: auth
    });

    console.log('Garden initialized...');
    setGardenObj(garden);
    return garden;
  };

  // New method to connect to MetaMask and return a Promise
const connectToMetaMask = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    // Set up a listener to detect when connection completes
    const connectionCheckInterval = setInterval(() => {
      if (isEVMConnected && arbitrumWalletClient) {
        clearInterval(connectionCheckInterval);
        resolve();
      }
    }, 1000);

    // Set a timeout to prevent infinite waiting
    const connectionTimeout = setTimeout(() => {
      clearInterval(connectionCheckInterval);
      reject(new Error("Connection timeout"));
    }, 30000); // 30 seconds timeout

    // Attempt to connect
    try {
      connect({ connector: injected() });
    } catch (error) {
      clearInterval(connectionCheckInterval);
      clearTimeout(connectionTimeout);
      reject(error);
    }
  });
};

// Add a new button in the UI for the direct connection prompt
const promptConnectMetaMask = async () => {
  try {
    await connectToMetaMask();
    console.log("MetaMask connected successfully!");
    
    // Initialize Garden after successful connection
    if (wallet) {
      initializeGarden();
    } else {
      alert("Please connect your Solana wallet as well");
    }
  } catch (error) {
    console.error("Failed to connect to MetaMask:", error);
    alert("Failed to connect to MetaMask. Please try again.");
  }
};

const swapSOLTowBTC = async () => {
    if (!gardenObj) {
      console.error('Garden not initialized');
      alert('Garden not initialized. Please try again.');
      initializeGarden();
    }

    setIsSwapping(true);
    let executionTimeoutId: number | undefined;
    let order: MatchedOrder | undefined;

    try {
      // Create order and match
            const orderObj: SwapParams = {
                fromAsset: SupportedAssets.testnet.solana_testnet_SOL,
                toAsset: SupportedAssets.testnet.arbitrum_sepolia_WBTC,
                sendAmount: '100000',
                receiveAmount: '10',
                additionalData: { strategyId: 'stryasac' },
                minDestinationConfirmations: 1,
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

  const swapwBTCToSOL = async () => {
    if (!gardenObj) {
      console.error('Garden not initialized');
      alert('Garden not initialized. Please try again.');
      initializeGarden();
    }

    setIsSwapping(true);
    let executionTimeoutId: number | undefined;
    let order: MatchedOrder | undefined;

    try {
      // Create order and match
            const orderObj: SwapParams = {
                fromAsset: SupportedAssets.testnet.arbitrum_sepolia_WBTC,
                toAsset: SupportedAssets.testnet.solana_testnet_SOL,
                sendAmount: '10000',
                receiveAmount: '600000',
                additionalData: { strategyId: 'asacstry' },
                minDestinationConfirmations: 1,
            };

      console.log('Creating wBTC to SOL swap order...');
      const result = await gardenObj.swap(orderObj);
      console.log('Result of swap method', result);

      if (result.error) {
        throw new Error(`Failed to create swap order: ${result.error}`);
      }

      order = result.val;
      console.log('Matched order created:', order);
      setOrderDetails(order);

                  // 2. Initiate swap using evmHTLC
            console.log("Initializing using evmHTLC")
            const initResult = await gardenObj.evmHTLC.initiate(order);
            console.log('Order initiated ✅', initResult.val);

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
    }

    await initializeGarden();

    setIsSwapping(true);
    let executionTimeoutId: number | undefined;
    let order: MatchedOrder | undefined;

    try {
      // Create order and match
      const orderObj = {
                fromAsset: SupportedAssets.testnet.solana_testnet_SOL,
                toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
                sendAmount: "59337016",
                receiveAmount: "8000",
                additionalData: {
                    strategyId: "strybtry",
                    btcAddress: btcAdd,
                },
                minDestinationConfirmations: 1,
            };

      console.log('Creating SOL to BTC swap order...', orderObj);
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

  const swapBTCToSOL = async () => {
    if (!gardenObj) {
      console.error('Garden not initialized');
      alert('Garden not initialized. Please try again.');
    }

    setIsSwapping(true);
    let executionTimeoutId: number | undefined;
    let order: MatchedOrder | undefined;

    initializeGarden();

    try {
      // Create order and match
                  const orderObj = {
                fromAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
                toAsset: SupportedAssets.testnet.solana_testnet_SOL,
                sendAmount: "10000",
                receiveAmount: "10000",
                additionalData: {
                    strategyId: "btrystry",
                    btcAddress: btcAdd,
                },
                minDestinationConfirmations: 1,
            };

      console.log('Creating BTC to SOL swap order...', orderObj);
      const result = await gardenObj.swap(orderObj);
      console.log('Result of swap method', result);

      if (result.error) {
        throw new Error(`Failed to create swap order: ${result.error}`);
      }

      order = result.val;
      console.log('Matched order created:', order.create_order.create_id);
      setOrderDetails(order);

      alert(`Please send ${order.source_swap.amount}BTC to ${order.source_swap.swap_id} to proceed`);

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
        }, 90 * 60 * 1000);
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
          {isEVMConnected ? (
            <>
              <div className="bg-gray-700 rounded-full p-2 cursor-pointer hover:bg-gray-900">
                <span
                  onClick={() =>
                    navigator.clipboard.writeText(address || '')
                  }
                >
                  {getTrimmedVal(address || '....', 6, 4)}
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
            <>
            <Button
              onClick={promptConnectMetaMask}
            >
              Connect Metamask
            </Button>
            </>
          )}
          <WalletMultiButton />
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
                    `https://orderbook-v2-staging.hashira.io/orders/id/matched/${orderDetails?.create_order.create_id}`,
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

{/* <Button
  onClick={async () => {
    try {
      if (!ancWallet || !ancWallet.wallet || !ancWallet.wallet.signTransaction) {
        throw new Error("Wallet provider is not properly initialized");
      }
      
      // Import needed classes
      const { Transaction, PublicKey, SystemProgram } = await import('@solana/web3.js');
      
      // Create a simple transaction - a small SOL transfer to yourself
      const transaction = new Transaction();
      
      // Fetch the latest blockhash from the current connection
      const { blockhash } = await connection.getLatestBlockhash('finalized');
      console.log("Latest blockhash:", blockhash);
      
      // Set the recent blockhash from the connection
      transaction.recentBlockhash = blockhash;
      
      // Set the fee payer to your connected wallet
      transaction.feePayer = ancWallet.wallet.publicKey;
      
      // Create a simple instruction (sending a tiny amount of SOL to yourself)
      if (ancWallet.wallet.publicKey) {
        transaction.add(
          SystemProgram.transfer({
            fromPubkey: ancWallet.wallet.publicKey,
            toPubkey: ancWallet.wallet.publicKey, // sending to yourself
            lamports: 100, // 0.0000001 SOL
          })
        );
      }
      
      console.log("Transaction created:", transaction);
      
      // Sign the transaction
      const signedTransaction = await ancWallet.wallet.signTransaction(transaction);
      
      console.log("Transaction signed successfully!", transaction);
      console.log("Signed transaction:", signedTransaction);
      
      // Verify the signature is present
      if (signedTransaction.signatures.length > 0) {
        console.log("Signature verified:", signedTransaction.signatures[0].signature);
        alert("Transaction signed successfully!");
      }
      
      return signedTransaction;
    } catch (error) {
      console.error("Error signing transaction:", error);
      alert(`Failed to sign transaction: ${error instanceof Error ? error.message : String(error)}`);
      return null;
    }
  }}
>
  Sign Test Transaction
</Button> */}

        <button
          // onClick={() => swapSOLToBTC()}
          onClick={() => swapBTCToSOL()}
          // onClick={() => swapSOLTowBTC()}
          // onClick={() => swapwBTCToSOL()}
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
