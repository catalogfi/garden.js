import { useState } from 'react';
import { useBitcoinWallet } from '../../../src';

export const Hello = () => {
  const [balance, setBalance] = useState({
    total: 0,
    confirmed: 0,
    unconfirmed: 0,
  });
  const [sendAmount, setSendAmount] = useState<number>();
  const [sendAddress, setSendAddress] = useState('');
  const { walletList, account, provider, connect, network } =
    useBitcoinWallet();

  return (
    <>
      {Object.entries(walletList).map(([name, wallet], i) => (
        <div
          onClick={async () => {
            const res = await connect(wallet);
            if (res.error) {
              console.error(res.error);
              return;
            }
          }}
          key={i}
          style={{ cursor: 'pointer' }}
        >
          Connect {name}
        </div>
      ))}
      <div>Account: {account}</div>
      <div>Network: {network}</div>
      <div>
        <div
          onClick={() => {
            if (!provider) return;
            provider.getBalance().then((res) => {
              if (res.error) {
                console.error(res.error);
                return;
              }
              setBalance(res.val);
            });
          }}
          style={{ cursor: 'pointer' }}
        >
          total balance: {balance.total}
        </div>
        <div>confirmed balance: {balance.confirmed}</div>
        <div>unconfirmed balance: {balance.unconfirmed}</div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
        }}
      >
        <div
          style={{
            display: 'flex',
            gap: '10px',
          }}
        >
          <input
            type="number"
            value={sendAmount}
            placeholder="amount"
            onChange={(e) => setSendAmount(parseInt(e.target.value))}
          />
          <input
            type="text"
            value={sendAddress}
            placeholder="address"
            onChange={(e) => setSendAddress(e.target.value)}
          />
        </div>

        <button
          onClick={() => {
            if (!provider || !sendAmount) return;
            provider.sendBitcoin(sendAddress, sendAmount).then((res) => {
              if (res.error) {
                console.error('error while sending bitcoin ', res.error);
                return;
              }
              console.log('transaction id:', res.val);
            });
          }}
        >
          Send Bitcoin
        </button>
      </div>
    </>
  );
};
