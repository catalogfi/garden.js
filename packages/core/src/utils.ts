import { IBaseWallet } from "@catalogfi/wallets";
import { Chain } from "@gardenfi/orderbook";
import { sha256 } from "ethers";
import { trim0x, with0x } from "@catalogfi/utils";

export const computeSecret = async (
    fromChain: Chain,
    toChain: Chain,
    wallets: Partial<Record<Chain, IBaseWallet>>,
    nonce: number
) => {
    const initiatorWallet = wallets[fromChain as Chain];
    const followerWallet = wallets[toChain as Chain];
    if (!followerWallet) throw new Error(`No ${fromChain} wallet found`);
    if (!initiatorWallet) throw new Error(`No ${toChain} wallet found`);

    let sig = undefined;
    if (isFromChainBitcoin(fromChain)) {
        const msg = sha256(
            with0x(
                Buffer.from(
                    "catalog.js" + nonce + (await followerWallet.getAddress())
                ).toString("hex")
            )
        ).slice(2);
        sig = await initiatorWallet.sign(msg);
    } else {
        const msg = sha256(
            with0x(
                Buffer.from(
                    "catalog.js" + nonce + (await initiatorWallet.getAddress())
                ).toString("hex")
            )
        ).slice(2);
        sig = await followerWallet.sign(msg);
    }

    return trim0x(sha256(with0x(sig)));
};

export const isFromChainBitcoin = (chain: Chain) => {
    return (
        chain === "bitcoin" ||
        chain === "bitcoin_testnet" ||
        chain === "bitcoin_regtest"
    );
};
