import { chainToAsset } from "../../constants/constants";

type SwapComponentProps = {
    swapParams: {
        inputToken: any;
        outputToken: any;
        inputAmount: number;
        outputAmount: number;
        btcAddress: string;
    };
    setSwapParams: React.Dispatch<React.SetStateAction<any>>;
}

function SwapOutput({ swapParams, setSwapParams }: SwapComponentProps) {
    return (
        <div className='w-full justify-start items-center flex flex-col gap-2'>
            <h3 className='flex text-sm font-medium'>Output token</h3>
            <select
                className='px-2 py-1 rounded-lg w-full'
                onChange={(e) => {
                    setSwapParams({
                        ...swapParams,
                        outputToken:
                            chainToAsset[e.target.value as keyof typeof chainToAsset],
                    });
                }}
            >
                <option>Select output token</option>
                {Object.entries(chainToAsset).map(([network, asset]) => {
                    return (
                        <option key={asset.name} value={network}>
                            {asset.name}
                        </option>
                    );
                })}
            </select>
            <div className='px-2 py-1 rounded-lg w-full bg-white'>
                <input
                    type="number"
                    placeholder="Output amount"
                    className='w-full focus:outline-none active:outline-none'
                    value={swapParams.outputAmount}
                    onChange={(event) => {
                        setSwapParams({
                            ...swapParams,
                            outputAmount: Number(event.target.value),
                        });
                    }}
                />
            </div>
        </div>
    )
}

export default SwapOutput
