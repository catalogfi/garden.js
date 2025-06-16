import { useAccount, useChainId, useChains } from 'wagmi';
import { useBitcoinWallet } from '@gardenfi/wallet-connectors';
import { useEffect, useState } from 'react';

export const Details = () => {
    const [network, setNetwork] = useState<string | null>(null);
    const [balance, setBalance] = useState<number | null>(null);

    const chains = useChains();
    const chainMap = Object.fromEntries(chains.map(chain => [chain.id, chain.name]));
    const chainId = useChainId();
    const { address: EvmAddress } = useAccount();
    const { account, provider } = useBitcoinWallet();

    provider?.on("accountsChanged", async () => {
        const networkName = await provider?.getNetwork();
        const balanceBTC = await provider?.getBalance();
        setNetwork(networkName.val);
        setBalance(balanceBTC.val.total * 10 ** (-8));
    });

    useEffect(() => {
        const fetchInitialData = async () => {
            const networkName = await provider?.getNetwork();
            const balanceBTC = await provider?.getBalance();
            setNetwork(networkName!.val);
            setBalance(balanceBTC!.val.total * 10 ** (-8));
        };
        fetchInitialData();
    }, [provider]);

    return (
        (EvmAddress || account) &&
        <div className='flex flex-col items-start justify-start gap-2'>
            {EvmAddress && (
                <div className='grid grid-cols-2 gap-2 w-full'>
                    <div className='flex gap-3 items-center justify-start'>
                        <span className='text-sm font-bold opacity-60'>Current Chain Id:</span>
                        <span className='text-lg font-normal'>{chainId}</span>
                    </div>
                    <div className='flex gap-3 items-center justify-start'>
                        <span className='text-sm font-bold opacity-60'>Current EVM Chain Name:</span>
                        <span className='text-lg font-normal'>{chainMap[chainId!]}</span>
                    </div>
                    {account && <><div className='flex gap-3 items-center justify-start'>
                        <span className='text-sm font-bold opacity-60'>Current BTC Chain Name:</span>
                        <span className='text-lg font-normal'>{network}</span>
                    </div>
                        <div className='flex gap-3 items-center justify-start'>
                            <span className='text-sm font-bold opacity-60'>BTC Account Balance:</span>
                            <span className='text-lg font-normal'>{balance}</span>
                        </div>
                    </>
                    }
                </div>
            )}
            {EvmAddress && <div className='flex gap-3 items-center justify-between'>
                <span className='text-sm font-bold opacity-60'>EVM Address: </span>
                <span className='text-lg'>{EvmAddress}</span>
            </div>}
            {account && <div className='flex gap-3 items-center justify-between'>
                <span className='text-sm font-bold opacity-60'>BTC Account: </span>
                <span className='text-lg'>{account}</span>
            </div>}
        </div>
    );
};
