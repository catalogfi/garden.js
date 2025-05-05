export const nativeHTLCAbi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'version',
        type: 'string',
      },
    ],
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    inputs: [],
    name: 'InvalidShortString',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__DuplicateOrder',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__IncorrectFundsRecieved',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__IncorrectSecret',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__InsufficientBalance',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__InvalidRedeemerSignature',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__OrderFulfilled',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__OrderNotExpired',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__OrderNotInitiated',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__SameInitiatorAndRedeemer',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__ZeroAddressInitiator',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__ZeroAddressRedeemer',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__ZeroAmount',
    type: 'error',
  },
  {
    inputs: [],
    name: 'NativeHTLC__ZeroTimelock',
    type: 'error',
  },
  {
    inputs: [
      {
        internalType: 'string',
        name: 'str',
        type: 'string',
      },
    ],
    name: 'StringTooLong',
    type: 'error',
  },
  {
    anonymous: false,
    inputs: [],
    name: 'EIP712DomainChanged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'orderID',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'secretHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'Initiated',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'orderID',
        type: 'bytes32',
      },
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'secretHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        internalType: 'bytes',
        name: 'secret',
        type: 'bytes',
      },
    ],
    name: 'Redeemed',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: 'bytes32',
        name: 'orderID',
        type: 'bytes32',
      },
    ],
    name: 'Refunded',
    type: 'event',
  },
  {
    inputs: [],
    name: 'eip712Domain',
    outputs: [
      {
        internalType: 'bytes1',
        name: 'fields',
        type: 'bytes1',
      },
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'string',
        name: 'version',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'chainId',
        type: 'uint256',
      },
      {
        internalType: 'address',
        name: 'verifyingContract',
        type: 'address',
      },
      {
        internalType: 'bytes32',
        name: 'salt',
        type: 'bytes32',
      },
      {
        internalType: 'uint256[]',
        name: 'extensions',
        type: 'uint256[]',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'redeemer',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'timelock',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'secretHash',
        type: 'bytes32',
      },
    ],
    name: 'initiate',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'address payable',
        name: 'initiator',
        type: 'address',
      },
      {
        internalType: 'address payable',
        name: 'redeemer',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'timelock',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
      {
        internalType: 'bytes32',
        name: 'secretHash',
        type: 'bytes32',
      },
    ],
    name: 'initiateOnBehalf',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'orderID',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: 'signature',
        type: 'bytes',
      },
    ],
    name: 'instantRefund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'orderID',
        type: 'bytes32',
      },
    ],
    name: 'instantRefundDigest',
    outputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'orders',
    outputs: [
      {
        internalType: 'bool',
        name: 'isFulfilled',
        type: 'bool',
      },
      {
        internalType: 'address payable',
        name: 'initiator',
        type: 'address',
      },
      {
        internalType: 'address payable',
        name: 'redeemer',
        type: 'address',
      },
      {
        internalType: 'uint256',
        name: 'initiatedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'timelock',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'amount',
        type: 'uint256',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'orderID',
        type: 'bytes32',
      },
      {
        internalType: 'bytes',
        name: 'secret',
        type: 'bytes',
      },
    ],
    name: 'redeem',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [
      {
        internalType: 'bytes32',
        name: 'orderID',
        type: 'bytes32',
      },
    ],
    name: 'refund',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'token',
    outputs: [
      {
        internalType: 'address',
        name: '',
        type: 'address',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
] as const;
