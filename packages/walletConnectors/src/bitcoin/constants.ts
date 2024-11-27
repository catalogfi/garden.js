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
};

export const walletIDs = {
  OKX: 'okx',
  Unisat: 'unisat',
  Xverse: 'xverse',
  Xdefi: 'xdefi',
  Phantom: 'phantom',
} as const;
