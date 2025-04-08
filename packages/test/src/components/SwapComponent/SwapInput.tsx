import { useSwapStore } from '../../store/swapStore';
import { useGarden } from '@gardenfi/react-hooks';
import { Asset, isBitcoin } from '@gardenfi/orderbook';
import BigNumber from 'bignumber.js';
import { useBitcoinWallet } from '@gardenfi/wallet-connectors';
import { useEffect, useState } from 'react';
import { Garden } from '@gardenfi/core';

interface SwapInputProps {
  garden: Garden;
}

export const constructOrderpair = (fromAsset: Asset, toAsset: Asset) =>
  `${fromAsset.chain}:${fromAsset.atomicSwapAddress}::${toAsset.chain}:${toAsset.atomicSwapAddress}`;

export const SwapInput = ({ garden }: SwapInputProps) => {
  const {
    swapParams,
    setFromAsset,
    setSendAmount,
    setReceiveAmount,
    setAdditionalId,
    assets,
  } = useSwapStore();
  // const { getQuote } = useGarden();
  const { account } = useBitcoinWallet();

  const [inputAmount, setInputAmount] = useState(swapParams.sendAmount || '');
  const [debounceTimeout, setDebounceTimeout] = useState<NodeJS.Timeout | null>(
    null,
  );

  const fetchQuote = async (amount: string) => {
    console.log(swapParams);

    if (!garden.quote.getQuote || !swapParams.fromAsset || !swapParams.toAsset)
      return;

    if (!amount) {
      setReceiveAmount('');
      return;
    }

    const amountInDecimals = new BigNumber(amount).multipliedBy(
      10 ** swapParams.fromAsset.decimals,
    );
    const fromAsset = swapParams.fromAsset;
    const toAsset = swapParams.toAsset;

    const quote = await garden.quote.getQuote(
      constructOrderpair(fromAsset, toAsset),
      amountInDecimals.toNumber(),
      false,
    );

    if (quote?.val?.quotes) {
      const [strategy, quoteAmount] = Object.entries(quote.val.quotes)[0] as [
        string,
        string,
      ];

      const quoteAmountInDecimals = new BigNumber(quoteAmount).div(
        10 ** swapParams.toAsset.decimals,
      );

      setSendAmount(amount);
      setReceiveAmount(quoteAmountInDecimals.toFixed(8, BigNumber.ROUND_DOWN));

      if (isBitcoin(swapParams.fromAsset.chain || swapParams.toAsset.chain)) {
        if (account) setAdditionalId(strategy, account);
        else setAdditionalId(strategy);
      } else setAdditionalId(strategy);
    } else {
      setReceiveAmount('');
    }
  };

  const handleInputChange = (value: string) => {
    setInputAmount(value);

    if (debounceTimeout) {
      clearTimeout(debounceTimeout);
    }

    const newTimeout = setTimeout(() => {
      fetchQuote(value);
    }, 500);

    setDebounceTimeout(newTimeout);
  };

  useEffect(() => {
    return () => {
      if (debounceTimeout) clearTimeout(debounceTimeout);
    };
  }, [debounceTimeout]);

  return (
    <div className="w-full justify-start items-center flex flex-col gap-2">
      <h3 className="flex text-sm font-medium">Input token</h3>
      <select
        className="px-2 py-1 rounded-lg w-full"
        onChange={(e) => setFromAsset(assets[e.target.value])}
        value={
          Object.keys(assets).find(
            (key) => assets[key] === swapParams.fromAsset,
          ) || ''
        }
      >
        <option value="">Select input token</option>
        {Object.entries(assets).map(([key, asset]) => (
          <option key={asset.name + asset.chain} value={key}>
            {asset.name + ' ' + asset.chain}
          </option>
        ))}
      </select>
      <div className="px-2 py-1 rounded-lg w-full bg-white">
        <input
          type="number"
          placeholder="Input amount"
          className="w-full focus:outline-none active:outline-none"
          value={inputAmount}
          onChange={(event) => handleInputChange(event.target.value)}
        />
      </div>
    </div>
  );
};

export default SwapInput;
