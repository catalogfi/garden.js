import { BTCWalletProvider } from '../../src';
import './App.css';
import { Hello } from './components/Hello';
import { Network } from '@gardenfi/utils';

function App() {
  // console.log('suppported wallets', SupportedBTCWallets);

  return (
    <BTCWalletProvider network={Network.TESTNET}>
      <Hello />
    </BTCWalletProvider>
  );
}

export default App;
