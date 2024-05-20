export type ContractAddress = {
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
};
