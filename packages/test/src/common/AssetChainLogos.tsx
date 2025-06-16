import Image from "next/image";
import { FC, HTMLAttributes } from "react";

type AssetChainLogosProps = HTMLAttributes<HTMLDivElement> & {
  tokenLogo: string;
  chainLogo: string;
};

export const AssetChainLogos: FC<AssetChainLogosProps> = ({
  tokenLogo,
  chainLogo,
  ...rest
}) => {
  return (
    <div
      className={`relative flex items-center justify-between h-5 ${
        chainLogo ? "w-[36px]" : "w-5"
      }`}
      {...rest}
    >
      <Image
        src={tokenLogo}
        alt="Token Logo"
        width={20}
        height={20}
        className="absolute left-0 z-30 rounded-full"
      />

      {chainLogo && (
        <Image
          src={chainLogo}
          alt="Chain Logo"
          width={20}
          height={20}
          className="absolute right-0 z-20 rounded-full"
        />
      )}
    </div>
  );
};
