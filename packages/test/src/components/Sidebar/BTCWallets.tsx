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
            <div className="grid grid-cols-2 gap-2 w-full">
                <div className="grid grid-cols-1 gap-2">
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
                    <div
                        className={`flex border border-[#E36492] rounded-lg overflow-hidden ${!account ? 'border-gray-300 pointer-events-none' : ''
                            }`}
                    >
                        <input
                            type="number"
                            className="px-2 active:outline-none focus:outline-none"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                        />
                        <Button
                            disabled={!account}
                            secondary
                            onClick={async () => {
                                if (!provider || amount === '') return;
                                const satoshis = Number(amount) * 10 ** 8;
                                const res = await provider.sendBitcoin(
                                    'bc1pqx4petqw4gfrzs7qfcyle95xsn7w39ukmtyy95zfytcldjztf0tqhe7rsj',
                                    satoshis,
                                );
                                console.log('res :', res.error);
                            }}
                        >
                            Send Bitcoin
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BTCWallets;
