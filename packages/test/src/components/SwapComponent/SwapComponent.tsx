import { BitcoinNetwork, useGarden } from '@gardenfi/react-hooks';
import { useAccount } from 'wagmi';
import { Button } from '../common/Button';
import SwapInput from './SwapInput';
import SwapOutput from './SwapOutput';
import { useSwapStore } from '../../store/swapStore';
import { useState } from 'react';
import BigNumber from 'bignumber.js';
import { isBitcoin } from '@gardenfi/orderbook';
import { useBitcoinWallet } from '@gardenfi/wallet-connectors';
import Transaction from '../transactions/Transactions';
import { BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';
import { useEnvironmentStore } from '../../store/useEnvironmentStore';
import { API } from '@gardenfi/utils';

export const SwapComponent = () => {
  const { swapParams, setAdditionalId, btcWallet, setBtcWallet } =
    useSwapStore();
  const { address: EvmAddress } = useAccount();
  const { account } = useBitcoinWallet();
  const { provider } = useBitcoinWallet();
  const { swapAndInitiate } = useGarden();
  const [loading, setLoading] = useState(false);
  const [funding, setFunding] = useState(false);
  const environment = useEnvironmentStore((state) => state.environment);

  async function fund(addr: string): Promise<void> {
    console.log('Funding address:', addr);

    try {
      const response = await fetch('http://localhost:3000/faucet', {
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

    if (isBitcoin(swapParams.fromAsset.chain || swapParams.toAsset.chain)){
      console.log('Setting additional ID for Bitcoin swap');
      setAdditionalId(swapParams.additionalData.strategyId, newBtcAddress);
    }

    await fund(account ?? newBtcAddress);
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

      console.log(swapParams.additionalData.btcAddress);
    const res = await swapAndInitiate({
      fromAsset: swapParams.fromAsset,
      toAsset: swapParams.toAsset,
      sendAmount: inputAmountInDecimals,
      receiveAmount: outputAmountInDecimals,
      additionalData: swapParams.additionalData,
    });

    console.log('Swap result:', res);
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
        if (!btcWallet) return;
        const order = res.val;
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
