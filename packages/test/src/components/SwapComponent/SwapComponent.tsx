import { BitcoinNetwork, useGarden } from '@gardenfi/react-hooks';
import { useAccount, useWalletClient } from 'wagmi';
import { Button } from '../common/Button';
import SwapInput from './SwapInput';
import SwapOutput from './SwapOutput';
import { useSwapStore } from '../../store/swapStore';
import { useState } from 'react';
import BigNumber from 'bignumber.js';
import { isBitcoin } from '@gardenfi/orderbook';
import { useBitcoinWallet } from '@gardenfi/wallet-connectors';
import Transaction from './Transactions/Transactions';
import { BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';
import { useEnvironmentStore } from '../../store/useEnvironmentStore';
import { EvmRelay, Garden, Quote, StarknetRelay } from '@gardenfi/core';
import { Environment, Siwe, Url, with0x } from '@gardenfi/utils';
import { useWalletStore } from '../../store/useWalletStore';
import { createWalletClient } from 'viem';
// import { API } from '@gardenfi/utils';

const API = {
  localnet: {
    orderbook: '',
    quote: '',
    info: '',
    bitcoin: '',
    ethereum: '',
    arbitrum: '',
    btcnode: '',
  },
};

const RELAYER_URL = 'https://orderbook.garden.finance';
// const RELAYER_URL = 'http://10.67.22.233:4436';
const STARKNET_NODE_URL =
  'https://starknet-sepolia.g.alchemy.com/starknet/version/rpc/v0_7/fjZ8CPTHtjIN989lInvYqljpGNqJTspg';
// const STARKNET_NODE_URL = 'https://starknet-sepolia.public.blastapi.io';
const QUOTE_SERVER_URL = 'https://price.garden.finance';
const STARKNET_RELAY_URL = 'https://starknet-relay.garden.finance';
const DIGEST_KEY =
  '7fb6d160fccb337904f2c630649950cc974a24a2931c3fdd652d3cd43810a857';

export const SwapComponent = () => {
  const { swapParams, setAdditionalId, btcWallet, setBtcWallet } =
    useSwapStore();
  const { address: EvmAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { account } = useBitcoinWallet();
  const { provider } = useBitcoinWallet();
  const { swapAndInitiate } = useGarden();
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);
  const { wallet: starknetWallet } = useWalletStore();
  const environment = useEnvironmentStore((state) => state.environment);
  // if (!walletClient) return;
  // if (!account) return;
  // if (!starknetWallet) return;
  const garden = new Garden({
    api: RELAYER_URL,
    environment: Environment.TESTNET,
    digestKey: DIGEST_KEY,
    quote: new Quote(QUOTE_SERVER_URL),
    htlc: {
      evm: new EvmRelay(
        RELAYER_URL,
        walletClient,
        Siwe.fromDigestKey(new Url(RELAYER_URL), DIGEST_KEY),
      ),
      starknet: new StarknetRelay(
        STARKNET_RELAY_URL,
        starknetWallet,
        STARKNET_NODE_URL,
      ),
    },
  });

  // console.log('yo', starknetWallet?.address);
  // console.log(garden.starknetHTLC?.htlcActorAddress);

  async function fund(addr: string): Promise<void> {
    console.log('Funding address:', addr);

    try {
      const response = await fetch('/fund', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ address: addr }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      console.log('Funding request sent successfully!');
    } catch (error) {
      console.error('Funding failed: ', error);
    }
  }

  const handleCreate = async () => {
    if (!swapParams.fromAsset || !swapParams.toAsset) return;
    setFunding(true);
    const bitcoinProvider = new BitcoinProvider(
      BitcoinNetwork.Regtest,
      API.localnet.bitcoin,
    );

    const newBtcWallet = BitcoinWallet.createRandom(bitcoinProvider);
    setBtcWallet(newBtcWallet);

    if (!newBtcWallet) return;

    const newBtcAddress = await newBtcWallet.getAddress();
    if (isBitcoin(swapParams.fromAsset.chain || swapParams.toAsset.chain))
      setAdditionalId(swapParams.additionalData.strategyId, newBtcAddress);

    await fund(account ?? newBtcAddress);
    setFunding(false);
  };
  const handleSwap = async () => {
    if (
      !garden.swap ||
      !EvmAddress ||
      !swapParams.sendAmount ||
      !swapParams.receiveAmount ||
      !swapParams.fromAsset ||
      !swapParams.toAsset
    )
      return;

    const inputAmountInDecimals = new BigNumber(swapParams.sendAmount)
      .multipliedBy(10 ** swapParams.fromAsset.decimals)
      .toFixed();
    const outputAmountInDecimals = new BigNumber(swapParams.receiveAmount)
      .multipliedBy(10 ** swapParams.toAsset.decimals)
      .toFixed();
    const orderData = {
      fromAsset: swapParams.fromAsset,
      toAsset: swapParams.toAsset,
      sendAmount: inputAmountInDecimals,
      receiveAmount: outputAmountInDecimals,
      additionalData: {
        strategyId: swapParams.additionalData.strategyId,
      },
      minDestinationConfirmations: 1,
    };

    setLoading(true);
    console.log(starknetWallet?.execute);

    // const result = await garden.swap(orderData);
    // if (result.error) {
    //   console.log('Error while creating order ❌:', result.error);
    //   throw new Error(result.error);
    // }

    // console.log(
    //   'Order created and matched ✅',
    //   result.val.create_order.create_id,
    // );
    const result = await garden.orderbook.getOrder(
      'fc5bd465120743ff483d9c8df06ddf2aef83fb434d159b3aa490189831d9523d',
      true,
    );
    const initRes = await garden.evmHTLC?.initiate(result.val);
    // const initRes = await garden.execute();
    // const initRes = await garden.(result.val);
    // if (initRes?.error) {
    //   console.log('Error while initiating HTLC ❌:', initRes.error);
    //   throw new Error(initRes.error);
    // }
    console.log('HTLC initiated ✅', initRes?.val);
    // console.log('The TX ID of user is: ', res.val);

    if (isBitcoin(result.val.source_swap.chain)) {
      if (provider) {
        const order = result.val;
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
        if (!btcWallet) return;
        const order = result.val;
        const tx = await btcWallet.send(
          order.source_swap.swap_id,
          Number(order.source_swap.amount),
        );
        console.log('The TX ID of user BTC init is: ', tx);
      }
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
            <Button onClick={handleCreate} disabled={funding}>
              {funding ? 'Funding...' : 'Create & Fund BTC'}
            </Button>
          )}
          <div className="flex items-center justify-between gap-6">
            <SwapInput garden={garden} />
            <SwapOutput />
          </div>
          <Button onClick={handleSwap}>
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
