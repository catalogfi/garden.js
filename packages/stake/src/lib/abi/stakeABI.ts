export const StakeABI = [
  {
    inputs: [
      {
        internalType: 'address',
        name: '_filler',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: '_units',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: '_lockBlocks',
        type: 'uint256',
      },
    ],
    name: 'vote',
    outputs: [
      {
        internalType: 'bytes32',
        name: 'stakeID',
        type: 'bytes32',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_stakeID',
        type: 'bytes32',
      },
      {
        internalType: 'address',
        name: '_newFiller',
        type: 'address',
      },
    ],
    name: 'changeVote',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_stakeID',
        type: 'bytes32',
      },
    ],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address',
        name: '_filler',
        type: 'address',
      },
    ],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_stakeID',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: '_newLockBlocks',
        type: 'uint256',
      },
    ],
    name: 'renew',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '_stakeID',
        type: 'bytes32',
      },
      {
        internalType: 'uint256',
        name: '_newLockBlocks',
        type: 'uint256',
      },
    ],
    name: 'extend',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as const;
