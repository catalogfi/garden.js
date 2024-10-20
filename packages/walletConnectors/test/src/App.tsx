import './App.css';
import { BTCWalletProvider } from './../../src';
import { Hello } from './components/Hello';

function App() {
  // console.log('suppported wallets', SupportedBTCWallets);

  return (
    <BTCWalletProvider>
      <Hello />
    </BTCWalletProvider>
  );
}

export default App;
