# Solana
This directory contains files that implement Solana support to garden.js  
[solanaHTLC.ts](./solanaHTLC.ts) - Implementation of `IGardenHTLC` that performs atomic swaps directly, also paying the fees.  
[solanaRelay.ts](./solanaRelay.ts) - Performs atomic swaps via a relayer (a node that pays fees on behalf).

## Running the test:
### Prerequisites:
- Solana Test Validator with on-chain program deployed.
- Solana Relayer.

### Steps (without [Merry](https://merry.dev)):
- Install [Solana test validator](https://docs.solanalabs.com/cli/install) (basically a Solana localnet)
- Clone [solana-native-swaps](https://github.com/catalogfi/solana-native-swaps) and change to it.  
`git clone https://github.com/catalogfi/solana-native-swaps && cd solana-native-swaps`
- Install [Anchor](https://www.anchor-lang.com/docs/installation).
- Update the Program ID: `anchor keys sync`
- Build the solana on-chain program: `anchor build`
- Start the localnet in a separate shell: `solana-test-validator`
- Optionally, test the solana on-chain program: `anchor test --skip-local-validator`
- Deploy the program to the localnet: `anchor deploy`
- Copy the contents of `target/idl/` and `target/types/` into `solana/idl/`
- Clone [solana-relayer](https://github.com/catalogfi/solana-relayer) in a separate directory and change to it  
`git clone https://github.com/catalogfi/solana-relayer && cd solana-relayer`
- Copy the contents of `target/idl/` and `target/types/` from `solana-native-swaps/` into `solana-relayer/idl/`
- Optionally, run the relayer tests: `npm test relayer.test.ts`
- Start the relayer: `npm start`
- Finally, run the tests by running `npm test solana` in this directory.