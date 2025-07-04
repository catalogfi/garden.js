import { ArrowRightIcon } from "@gardenfi/garden-book";
import { Asset, isBitcoin } from "@gardenfi/orderbook";
import { FC } from "react";
import { assetInfoStore } from "../store/assetInfoStore";
import { AssetChainLogos } from "./AssetChainLogos";

type SwapInfoProps = {
  sendAsset: Asset;
  receiveAsset: Asset;
  sendAmount: string | number;
  receiveAmount: string | number;
};

export const SwapInfo: FC<SwapInfoProps> = ({
  sendAsset,
  receiveAsset,
  sendAmount,
  receiveAmount,
}) => {
  const { chains } = assetInfoStore();
  const sendChain =
    chains && !isBitcoin(sendAsset.chain) ? chains[sendAsset.chain] : undefined;
  const receiveChain =
    chains && !isBitcoin(receiveAsset.chain)
      ? chains[receiveAsset.chain]
      : undefined;

  return (
    <div className="flex justify-between items-center">
      <div className="flex grow basis-0 items-center gap-2">
        <p>
          {sendAmount}
        </p>
        <AssetChainLogos
          tokenLogo={sendAsset.logo ?? ""}
          chainLogo={sendChain?.networkLogo ?? ""}
        />
      </div>
      <ArrowRightIcon className="fill-white"/>
      <div className="flex grow basis-0 justify-end items-center gap-2">
        <p>
          {receiveAmount}
        </p>
        <AssetChainLogos
          tokenLogo={receiveAsset.logo ?? ""}
          chainLogo={receiveChain?.networkLogo ?? ""}
        />
      </div>
    </div>
  );
};
