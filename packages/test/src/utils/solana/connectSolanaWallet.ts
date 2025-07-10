enum SolWallets {
    phantom,
    solflare,
    backpack
}

/** 
 * This will return a list of all the solana wallets installed by the user
 * @returns 
 */
export const getAllWallets: () => [keyof SolWallets] = () => {
    let installedWallets = []

    for (wallet in keyof SolWallets) {
        if (window[wallet]) {
            installedWallets.push(wallet)
        }
    }

    return installedWallets;
}

const connectPhantomWallet = () => {

}

const connectSolflareWallet = () => {

}

const connectBackPackWallet = () => {

}

/**
 * 
 * @param wallet `phantom` | `solflare` | `backpack`
 * @returns `AnchorProvider`
 */
export const connectSolanaWallet = (wallet: SolWallets) => {
    // Call the corresponding method of connecting the 

}