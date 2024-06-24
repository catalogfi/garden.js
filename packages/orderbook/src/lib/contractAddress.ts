export type ContractAddress = {
  // TODO: Make this lowercase
  AtomicSwap: string;
};

export const CONTRACT_ADDRESS: Record<number, ContractAddress> = {
  1: {
    AtomicSwap: "0xA5E38d098b54C00F10e32E51647086232a9A0afD",
  },
  11155111: {
    AtomicSwap: "0x9ceD08aeE17Fbc333BB7741Ec5eB2907b0CA4241",
  },
  42161: {
    AtomicSwap: "0x203DAC25763aE783Ad532A035FfF33d8df9437eE",
  },
  31337: {
    AtomicSwap: "0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512",
  },
  31338: {
    AtomicSwap: "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9",
  },
};
