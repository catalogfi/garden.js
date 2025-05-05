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

export const SwapInput = ({ swapParams, setSwapParams }: SwapComponentProps) => {
    return (
        <div className='w-full justify-start items-center flex flex-col gap-2'>
            <h3 className='flex text-sm font-medium'>Input token</h3>
            <select
                className='px-2 py-1 rounded-lg w-full'
                onChange={(e) => {
                    setSwapParams({
                        ...swapParams,
                        inputToken:
                            chainToAsset[e.target.value as keyof typeof chainToAsset],
                    });
                }}
            >
                <option>Select input token</option>
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
                    placeholder="Input amount"
                    className='w-full focus:outline-none active:outline-none'
                    value={swapParams.inputAmount}
                    onChange={(event) => {
                        const amount = Number(event.target.value);
                        const outputAmount = amount * 0.997;
                        setSwapParams({
                            ...swapParams,
                            inputAmount: amount,
                            outputAmount: outputAmount,
                        });
                    }}
                />
            </div>
        </div>
    )
}

export default SwapInput
