# @gardenfi/wallet-connectors

The `@gardenfi/wallet-connectors` package handles bitcoin wallet connections across different providers (OKX, Unisat, Xverse, Phantom, Keplr, Leap) with a unified interface. It supports mainnet and testnet networks, provides balance checking capabilities, and offers a React context for managing wallet state throughout your application.

## Installation

```
yarn add @gardenfi/wallet-connectors
```

## Usage

### Setup Provider

```tsx
import {
  BTCWalletProvider,
  useBitcoinWallet,
} from '@gardenfi/wallet-connectors';
import { Network } from '@gardenfi/utils';

function App() {
  return (
    <BTCWalletProvider network={Network.MAINNET} store={localStorage}>
      <YourApp />
    </BTCWalletProvider>
  );
}
```

### Connect to Wallet

```tsx
import { useBitcoinWallet } from '@gardenfi/wallet-connectors';

function WalletConnect() {
  const { availableWallets, connect, account, isConnected, disconnect } =
    useBitcoinWallet();

  const handleConnect = async (wallet) => {
    const result = await connect(wallet);
    if (result.ok) {
      console.log('Connected to wallet');
    }
  };

  return (
    <div>
      {!isConnected ? (
        <div>
          {Object.values(availableWallets).map((wallet) => (
            <button key={wallet.id} onClick={() => handleConnect(wallet)}>
              Connect {wallet.name}
            </button>
          ))}
        </div>
      ) : (
        <div>
          <p>Connected: {account}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      )}
    </div>
  );
}
```