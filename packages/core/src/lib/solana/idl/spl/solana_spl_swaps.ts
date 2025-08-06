/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solana_spl_swaps.json`.
 */
export type SolanaSplSwaps = {
  "address": "2WXpY8havGjfRxme9LUxtjFHTh1EfU3ur4v6wiK4KdNC",
  "metadata": {
    "name": "solanaSplSwaps",
    "version": "0.4.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initiate",
      "docs": [
        "Initiates the atomic swap. Funds are transferred from the initiator to the token vault.",
        "As such, the initiator's signature is required for this instruction.",
        "A sponsor may be involved, who pays PDA rent and transaction fees in SOL, allowing for the",
        "initiator to participate without holding SOL. As such, the sponsor must also sign this transaction.",
        "`swap_amount` represents the quantity of tokens to be transferred through this atomic swap",
        "in base units of the token mint.",
        "E.g: A quantity of $1 represented by the token \"USDC\" with \"6\" decimals",
        "must be provided as 1,000,000.",
        "`expires_in_slots` represents the number of slots after which (non-instant) refunds are allowed.",
        "`destination_data` can hold optional information regarding the destination chain",
        "in the atomic swap, to be emitted in the logs as-is."
      ],
      "discriminator": [
        5,
        63,
        123,
        113,
        153,
        75,
        148,
        14
      ],
      "accounts": [
        {
          "name": "identityPda",
          "docs": [
            "the token transfers of the `token_vault` PDA.",
            "This PDA will be created during the first most invocation of the `initiate()` function",
            "using the `init_if_needed` attribute, and be reused for all succeeding instructions."
          ],
          "writable": true,
          "pda": {
            "seeds": []
          }
        },
        {
          "name": "swapData",
          "docs": [
            "A PDA that maintains the on-chain state of the atomic swap throughout its lifecycle.",
            "The choice of seeds ensure that any swap with equal `initiator` and",
            "`secret_hash` wont be created until an existing one completes.",
            "This PDA will be deleted upon completion of the swap."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "initiator"
              },
              {
                "kind": "arg",
                "path": "secretHash"
              }
            ]
          }
        },
        {
          "name": "tokenVault",
          "docs": [
            "A permanent PDA that is controlled by the program through the `identity_pda`, as implied",
            "by the value of the `authority` field below. As such, it serves as the \"vault\" by escrowing tokens",
            "of type `mint` for the atomic swap.",
            "It is intended to be reused for all swaps involving the same mint.",
            "Just like `identity_pda`, it will be created during the first most invocation of `initiate()`",
            "of every distinct mint using the `init_if_needed` attribute."
          ],
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "account",
                "path": "mint"
              }
            ]
          }
        },
        {
          "name": "initiator",
          "docs": [
            "The initiator of the atomic swap. They must sign this transaction."
          ],
          "signer": true
        },
        {
          "name": "initiatorTokenAccount",
          "docs": [
            "The token account of the initiator"
          ],
          "writable": true
        },
        {
          "name": "mint",
          "docs": [
            "The mint of the tokens involved in this swap. As this is a parameter, this program can thus be reused",
            "for atomic swaps with different mints."
          ]
        },
        {
          "name": "sponsor",
          "docs": [
            "Any entity that pays the PDA rent.",
            "Upon completion of the swap, the PDA rent refund resulting from the",
            "deletion of `swap_data` will be refunded to this address."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "expiresInSlots",
          "type": "u64"
        },
        {
          "name": "redeemer",
          "type": "pubkey"
        },
        {
          "name": "secretHash",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        },
        {
          "name": "swapAmount",
          "type": "u64"
        },
        {
          "name": "destinationData",
          "type": {
            "option": "bytes"
          }
        }
      ]
    },
    {
      "name": "instantRefund",
      "docs": [
        "Funds are returned to the initiator, with the redeemer's consent.",
        "As such, the redeemer's signature is required for this instruction.",
        "This allows for refunds before the expiry slot."
      ],
      "discriminator": [
        211,
        202,
        103,
        41,
        183,
        147,
        59,
        251
      ],
      "accounts": [
        {
          "name": "identityPda",
          "pda": {
            "seeds": []
          }
        },
        {
          "name": "swapData",
          "docs": [
            "The PDA holding the state information of the atomic swap. Will be closed upon successful execution",
            "and the resulting rent refund will be sent to the sponsor."
          ],
          "writable": true
        },
        {
          "name": "tokenVault",
          "docs": [
            "A token account controlled by the program, escrowing the tokens for this atomic swap"
          ],
          "writable": true
        },
        {
          "name": "initiatorTokenAccount",
          "writable": true
        },
        {
          "name": "redeemer",
          "docs": [
            "The redeemer of the atomic swap. They must sign this transaction."
          ],
          "writable": true,
          "signer": true
        },
        {
          "name": "sponsor",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    },
    {
      "name": "redeem",
      "docs": [
        "Funds are transferred to the redeemer. This instruction does not require any signatures."
      ],
      "discriminator": [
        184,
        12,
        86,
        149,
        70,
        196,
        97,
        225
      ],
      "accounts": [
        {
          "name": "identityPda",
          "pda": {
            "seeds": []
          }
        },
        {
          "name": "swapData",
          "docs": [
            "The PDA holding the state information of the atomic swap. Will be closed upon successful execution",
            "and the resulting rent refund will be sent to the sponsor."
          ],
          "writable": true
        },
        {
          "name": "tokenVault",
          "docs": [
            "A token account controlled by the program, escrowing the tokens for this atomic swap"
          ],
          "writable": true
        },
        {
          "name": "redeemerTokenAccount",
          "writable": true
        },
        {
          "name": "sponsor",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": [
        {
          "name": "secret",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
        }
      ]
    },
    {
      "name": "refund",
      "docs": [
        "Funds are returned to the initiator, given that no redeems have occured",
        "and the expiry slot has been reached.",
        "This instruction does not require any signatures."
      ],
      "discriminator": [
        2,
        96,
        183,
        251,
        63,
        208,
        46,
        46
      ],
      "accounts": [
        {
          "name": "identityPda",
          "pda": {
            "seeds": []
          }
        },
        {
          "name": "swapData",
          "docs": [
            "The PDA holding the state information of the atomic swap. Will be closed upon successful execution",
            "and the resulting rent refund will be sent to the sponsor."
          ],
          "writable": true
        },
        {
          "name": "tokenVault",
          "docs": [
            "A token account controlled by the program, escrowing the tokens for this atomic swap"
          ],
          "writable": true
        },
        {
          "name": "initiatorTokenAccount",
          "writable": true
        },
        {
          "name": "sponsor",
          "writable": true
        },
        {
          "name": "tokenProgram",
          "address": "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
        }
      ],
      "args": []
    }
  ],
  "accounts": [
    {
      "name": "swapAccount",
      "discriminator": [
        53,
        126,
        9,
        14,
        14,
        197,
        105,
        182
      ]
    }
  ],
  "events": [
    {
      "name": "initiated",
      "discriminator": [
        6,
        108,
        212,
        91,
        67,
        60,
        207,
        221
      ]
    },
    {
      "name": "instantRefunded",
      "discriminator": [
        220,
        50,
        18,
        207,
        183,
        232,
        218,
        25
      ]
    },
    {
      "name": "redeemed",
      "discriminator": [
        14,
        29,
        183,
        71,
        31,
        165,
        107,
        38
      ]
    },
    {
      "name": "refunded",
      "discriminator": [
        35,
        103,
        149,
        246,
        196,
        123,
        221,
        99
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidRedeemer",
      "msg": "The provider redeemer is not the original redeemer of this swap"
    },
    {
      "code": 6001,
      "name": "invalidSecret",
      "msg": "The provided secret does not correspond to the secret hash of this swap"
    },
    {
      "code": 6002,
      "name": "invalidSponsor",
      "msg": "The provided sponsor is not the original sponsor of this swap"
    },
    {
      "code": 6003,
      "name": "refundBeforeExpiry",
      "msg": "Attempt to perform a refund before expiry time"
    }
  ],
  "types": [
    {
      "name": "initiated",
      "docs": [
        "Represents the initiated state of the swap where the initiator has deposited funds into the vault"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapAmount",
            "docs": [
              "The quantity of tokens transferred through this atomic swap in base units of the token mint.",
              "E.g: A quantity of $1 represented by the token \"USDC\" with \"6\" decimals will be represented as 1,000,000."
            ],
            "type": "u64"
          },
          {
            "name": "expiresInSlots",
            "docs": [
              "`expires_in_slots` represents the number of slots after which (non-instant) refunds are allowed"
            ],
            "type": "u64"
          },
          {
            "name": "initiator",
            "type": "pubkey"
          },
          {
            "name": "mint",
            "type": "pubkey"
          },
          {
            "name": "redeemer",
            "type": "pubkey"
          },
          {
            "name": "secretHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "destinationData",
            "docs": [
              "Information regarding the destination chain in the atomic swap"
            ],
            "type": {
              "option": "bytes"
            }
          }
        ]
      }
    },
    {
      "name": "instantRefunded",
      "docs": [
        "Represents the instant refund state of the swap, where the initiator has withdrawn funds the vault",
        "with the redeemer's consent"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initiator",
            "type": "pubkey"
          },
          {
            "name": "secretHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "redeemed",
      "docs": [
        "Represents the redeemed state of the swap, where the redeemer has withdrawn funds from the vault"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initiator",
            "type": "pubkey"
          },
          {
            "name": "secret",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "refunded",
      "docs": [
        "Represents the refund state of the swap, where the initiator has withdrawn funds from the vault past expiry"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "initiator",
            "type": "pubkey"
          },
          {
            "name": "secretHash",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          }
        ]
      }
    },
    {
      "name": "swapAccount",
      "docs": [
        "Stores the state information of the atomic swap on-chain"
      ],
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "expirySlot",
            "docs": [
              "The exact slot after which (non-instant) refunds are allowed"
            ],
            "type": "u64"
          },
          {
            "name": "initiator",
            "docs": [
              "The initiator of the atomic swap"
            ],
            "type": "pubkey"
          },
          {
            "name": "redeemer",
            "docs": [
              "The redeemer of the atomic swap"
            ],
            "type": "pubkey"
          },
          {
            "name": "secretHash",
            "docs": [
              "The secret hash associated with the atomic swap"
            ],
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "swapAmount",
            "docs": [
              "The quantity tokens to be transferred through this atomic swap",
              "in base units of the token mint.",
              "E.g: A quantity of $1 represented by the token \"USDC\" with \"6\" decimals",
              "must be provided as 1,000,000."
            ],
            "type": "u64"
          },
          {
            "name": "identityPdaBump",
            "docs": [
              "The bump associated with the identity pda.",
              "This is needed by the program to authorize token transfers via the token vault."
            ],
            "type": "u8"
          },
          {
            "name": "sponsor",
            "docs": [
              "The entity that paid the rent fees for the creation of this PDA.",
              "This will be referenced during the refund of the same upon closing this PDA."
            ],
            "type": "pubkey"
          }
        ]
      }
    }
  ]
};