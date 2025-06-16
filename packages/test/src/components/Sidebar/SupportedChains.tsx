import { Chains } from "@gardenfi/orderbook";

export const SupportedChains = () => {
    return (
        <div className='flex flex-col items-start justify-start gap-2'>
            <h2 className='text-sm opacity-60'>Supported Wallets</h2>
            <div className="grid grid-cols-2 gap-2 w-full">
                {Object.values(Chains).map((chain) => {
                    if (chain.includes('bitcoin')) return null;
                    return (
                        <div key={chain} className="px-3 py-1.5 rounded-md border pointer-events-none bg-transparent border-gray-200">
                            {chain}
                        </div>
                    );
                })}
            </div>
        </div>
    )
};