export const FlowerABI = [
  {
    inputs: [
      { internalType: 'bytes32', name: 'stakeID', type: 'bytes32' },
      { internalType: 'address', name: 'newFiller', type: 'address' },
    ],
    name: 'changeVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: 'filler', type: 'address' }],
    name: 'mint',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
