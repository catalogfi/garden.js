import {
  IInjectedBitcoinProvider,
  useBitcoinWallet,
} from '@gardenfi/wallet-connectors';
import { Button } from '../common/Button';
import { useState } from 'react';

export const BTCWallets = () => {
  const { availableWallets, connect, account, provider, isConnected } =
    useBitcoinWallet();
  const [amount, setAmount] = useState('');
  const [btcAddress, setBtcAddress] = useState('');

  const handleConnect = async (wallet: IInjectedBitcoinProvider) => {
    const res = await connect(wallet);
    if (res.error) {
      console.error(res.error);
      return;
    }
  };

  const handleSwitchNetwork = async () => {
    if (!provider) return;
    await provider.switchNetwork();
  };

  return (
    <div className="flex flex-col items-start justify-start gap-2">
      <h2 className="text-sm opacity-60">BTC Wallets</h2>
      <div className="grid grid-cols-2 gap-2 w-full items-center">
        <div className="grid grid-cols-1 gap-2 items-center">
          {Object.entries(availableWallets).map(([name, wallet], i) => (
            <Button
              disabled={isConnected}
              onClick={() => handleConnect(wallet)}
              key={i}
            >
              Connect {name}
            </Button>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2">
          <Button
            disabled={!account}
            secondary
            onClick={() => handleSwitchNetwork()}
          >
            SwitchNetwork
          </Button>
          <input
            type="string"
            className="p-1 border border-[#E36492] rounded-lg active:outline-none focus:outline-none"
            value={btcAddress}
            placeholder='Enter BTC Address'
            onChange={(e) => setBtcAddress(e.target.value)}
          />
          <div
            className={`flex flex-col border border-[#E36492] rounded-lg overflow-hidden ${
              !account ? 'border-gray-300 pointer-events-none' : ''
            }`}
          >
            <input
              type="number"
              className="p-1 active:outline-none focus:outline-none"
              placeholder='Enter Amount'
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button
            disabled={!account}
            secondary
            onClick={async () => {
              if (!provider || amount === '') return;
              const satoshis = Number(amount) * 10 ** 8;
              const res = await provider.sendBitcoin(btcAddress, satoshis);
              console.log('res :', res.error);
            }}
          >
            Send Bitcoin
          </Button>
        </div>
      </div>
    </div>
  );
};

export default BTCWallets;
