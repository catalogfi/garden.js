/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solana_native_swaps.json`.
 */
export type SolanaNativeSwaps = {
  "address": "GfCxk9H9EoHP7cvophozquwRTkkm3ierP6sVUWKBBwCe",
  "metadata": {
    "name": "solanaNativeSwaps",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "initiate",
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
          "name": "swapAccount",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  115,
                  119,
                  97,
                  112,
                  95,
                  97,
                  99,
                  99,
                  111,
                  117,
                  110,
                  116
                ]
              },
              {
                "kind": "arg",
                "path": "swapId"
              }
            ]
          }
        },
        {
          "name": "initiator",
          "writable": true,
          "signer": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "swapId",
          "type": {
            "array": [
              "u8",
              32
            ]
          }
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
          "name": "amount",
          "type": "u64"
        },
        {
          "name": "expiresIn",
          "type": "u32"
        }
      ]
    },
    {
      "name": "instantRefund",
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
          "name": "swapAccount",
          "writable": true
        },
        {
          "name": "initiator",
          "writable": true
        },
        {
          "name": "redeemer",
          "signer": true
        }
      ],
      "args": []
    },
    {
      "name": "redeem",
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
          "name": "swapAccount",
          "writable": true
        },
        {
          "name": "redeemer",
          "writable": true
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
          "name": "swapAccount",
          "writable": true
        },
        {
          "name": "refundee",
          "writable": true
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
      "msg": "The provided redeemer is not the intended recipient of the swap amount"
    },
    {
      "code": 6001,
      "name": "invalidRefundee",
      "msg": "The provided refundee is not the initiator of the given swap account"
    },
    {
      "code": 6002,
      "name": "invalidSecret",
      "msg": "The provided secret does not correspond to the secret hash in the PDA"
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
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
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
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "instantRefunded",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapId",
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
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
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
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapId",
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
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "swapId",
            "type": {
              "array": [
                "u8",
                32
              ]
            }
          },
          {
            "name": "initiator",
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
            "name": "expirySlot",
            "type": "u64"
          },
          {
            "name": "amount",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
