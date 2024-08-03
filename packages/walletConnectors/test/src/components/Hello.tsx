import { useState } from 'react';
import { useBitcoinWallet } from '../../../src';

export const Hello = () => {
  const { walletList, account, provider, connect, publicKey, network } =
    useBitcoinWallet();
  const [balance, setBalance] = useState({
    total: 0,
    confirmed: 0,
    unconfirmed: 0,
  });
  // console.log('provider :', provider);
  // console.log('account :', account);

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
      <div>Public Key: {publicKey}</div>
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
    </>
  );
};
