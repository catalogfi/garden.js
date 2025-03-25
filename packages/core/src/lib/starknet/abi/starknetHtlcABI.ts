export const starknetHtlcABI = [
  {
    name: 'HTLC',
    type: 'impl',
    interface_name: 'starknet_htlc::interface::IHTLC',
  },
  {
    name: 'core::integer::u256',
    type: 'struct',
    members: [
      {
        name: 'low',
        type: 'core::integer::u128',
      },
      {
        name: 'high',
        type: 'core::integer::u128',
      },
    ],
  },
  {
    name: 'starknet_htlc::interface::IHTLC',
    type: 'interface',
    items: [
      {
        name: 'token',
        type: 'function',
        inputs: [],
        outputs: [
          {
            type: 'core::starknet::contract_address::ContractAddress',
          },
        ],
        state_mutability: 'view',
      },
      {
        name: 'initiate',
        type: 'function',
        inputs: [
          {
            name: 'redeemer',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'timelock',
            type: 'core::integer::u128',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
          {
            name: 'secret_hash',
            type: '[core::integer::u32; 8]',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'initiate_on_behalf',
        type: 'function',
        inputs: [
          {
            name: 'initiator',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'redeemer',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'timelock',
            type: 'core::integer::u128',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
          {
            name: 'secret_hash',
            type: '[core::integer::u32; 8]',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'initiate_with_signature',
        type: 'function',
        inputs: [
          {
            name: 'initiator',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'redeemer',
            type: 'core::starknet::contract_address::ContractAddress',
          },
          {
            name: 'timelock',
            type: 'core::integer::u128',
          },
          {
            name: 'amount',
            type: 'core::integer::u256',
          },
          {
            name: 'secret_hash',
            type: '[core::integer::u32; 8]',
          },
          {
            name: 'signature',
            type: 'core::array::Array::<core::felt252>',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'redeem',
        type: 'function',
        inputs: [
          {
            name: 'order_id',
            type: 'core::felt252',
          },
          {
            name: 'secret',
            type: 'core::array::Array::<core::integer::u32>',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'refund',
        type: 'function',
        inputs: [
          {
            name: 'order_id',
            type: 'core::felt252',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
      {
        name: 'instant_refund',
        type: 'function',
        inputs: [
          {
            name: 'order_id',
            type: 'core::felt252',
          },
          {
            name: 'signature',
            type: 'core::array::Array::<core::felt252>',
          },
        ],
        outputs: [],
        state_mutability: 'external',
      },
    ],
  },
  {
    name: 'constructor',
    type: 'constructor',
    inputs: [
      {
        name: 'token',
        type: 'core::starknet::contract_address::ContractAddress',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'starknet_htlc::interface::events::Initiated',
    type: 'event',
    members: [
      {
        kind: 'key',
        name: 'order_id',
        type: 'core::felt252',
      },
      {
        kind: 'data',
        name: 'secret_hash',
        type: '[core::integer::u32; 8]',
      },
      {
        kind: 'data',
        name: 'amount',
        type: 'core::integer::u256',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'starknet_htlc::interface::events::Redeemed',
    type: 'event',
    members: [
      {
        kind: 'key',
        name: 'order_id',
        type: 'core::felt252',
      },
      {
        kind: 'data',
        name: 'secret_hash',
        type: '[core::integer::u32; 8]',
      },
      {
        kind: 'data',
        name: 'secret',
        type: 'core::array::Array::<core::integer::u32>',
      },
    ],
  },
  {
    kind: 'struct',
    name: 'starknet_htlc::interface::events::Refunded',
    type: 'event',
    members: [
      {
        kind: 'key',
        name: 'order_id',
        type: 'core::felt252',
      },
    ],
  },
  {
    kind: 'enum',
    name: 'starknet_htlc::htlc::HTLC::Event',
    type: 'event',
    variants: [
      {
        kind: 'nested',
        name: 'Initiated',
        type: 'starknet_htlc::interface::events::Initiated',
      },
      {
        kind: 'nested',
        name: 'Redeemed',
        type: 'starknet_htlc::interface::events::Redeemed',
      },
      {
        kind: 'nested',
        name: 'Refunded',
        type: 'starknet_htlc::interface::events::Refunded',
      },
    ],
  },
];
