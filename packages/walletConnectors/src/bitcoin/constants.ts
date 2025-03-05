export const SupportedWallets = {
  OKX: {
    name: 'OKX',
    icon: 'https://garden-finance.s3.ap-south-2.amazonaws.com/wallets/okx.svg',
    description: 'OKX wallet',
  },
  Unisat: {
    name: 'Unisat',
    icon: 'https://next-cdn.unisat.io/_/285/logo/color.svg',
    description: 'Unisat wallet',
  },
  Xverse: {
    name: 'Xverse',
    icon: 'https://cdn.prod.website-files.com/624b08d53d7ac60ccfc11d8d/64637a04ad4e523a3e07675c_32x32.png',
    description: 'Xverse wallet',
  },
  Xdefi: {
    name: 'Xdefi',
    icon: 'https://garden-finance.s3.ap-south-2.amazonaws.com/wallets/xdefi.svg',
    description: 'Xdefi wallet',
  },
  Phantom: {
    name: 'Phantom',
    icon: '',
    description: 'Phantom wallet',
  },
  GardenWallet: {
    name: 'Garden',
    icon: 'https://ik.imagekit.io/vsn/gardenlogo.svg',
    description: 'Garden wallet',
  },
};

export const WALLET_CONFIG = {
  OKX: {
    id: 'okx',
    name: 'OKX wallet',
    icon: 'https://garden-finance.imgix.net/wallets/okx.svg',
  },
  Unisat: {
    id: 'unisat',
    name: 'Unisat wallet',
    icon: 'https://garden-finance.imgix.net/wallets/unisat.svg',
  },
  Xverse: {
    id: 'xverse',
    name: 'Xverse wallet',
    icon: 'https://cdn.prod.website-files.com/624b08d53d7ac60ccfc11d8d/64637a04ad4e523a3e07675c_32x32.png',
  },
  Xdefi: {
    id: 'xdefi',
    name: 'Xdefi wallet',
    icon: 'https://garden-finance.s3.ap-south-2.amazonaws.com/wallets/xdefi.svg',
  },
  Phantom: {
    id: 'phantom',
    name: 'Phantom wallet',
    icon: 'https://garden-finance.imgix.net/wallets/phantom.svg',
  },
  GardenWallet: {
    id: 'garden',
    name: 'Garden wallet',
    icon: 'https://ik.imagekit.io/vsn/gardenlogo.svg',
  },
} as const;
