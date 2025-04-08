import { useSwapStore } from '../../store/swapStore';

export const SwapOutput = () => {
  const { swapParams, setToAsset, assets } = useSwapStore();

  return (
    <div className="w-full justify-start items-center flex flex-col gap-2">
      <h3 className="flex text-sm font-medium">Output token</h3>
      <select
        className="px-2 py-1 rounded-lg w-full"
        onChange={(e) => setToAsset(assets[e.target.value])}
        value={
          Object.keys(assets).find(
            (key) => assets[key] === swapParams.toAsset,
          ) || ''
        }
      >
        <option value="">Select output token</option>
        {Object.entries(assets).map(([key, asset]) => (
          <option key={asset.name + asset.chain} value={key}>
            {asset.name + ' ' + asset.chain}
          </option>
        ))}
      </select>
      <div className="px-2 py-1 rounded-lg w-full bg-white">
        <input
          type="number"
          className="w-full focus:outline-none active:outline-none"
          placeholder="Output amount"
          value={swapParams.receiveAmount || ''}
          disabled
        />
      </div>
    </div>
  );
};

export default SwapOutput;
