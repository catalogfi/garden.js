import { useState } from 'react';
import { useBitcoinWallet } from '../../../src';

export const Hello = () => {
  const { walletList, account, provider, connect } = useBitcoinWallet();
  const [balance, setBalance] = useState();
  const [network, setNetwork] = useState('');
  console.log('provider :', provider);
  console.log('account :', account);

  return (
    <>
      {Object.values(walletList).map((wallet) => (
        <div
          onClick={async () => {
            const res = await connect(wallet);
            if (res.error) {
              console.error(res.error);
              return;
            }
          }}
          key={wallet.symbol}
          style={{ cursor: 'pointer' }}
        >
          Connect {wallet.name}
        </div>
      ))}
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
          balance: {balance}
        </div>
        <div
          onClick={() => {
            if (!provider) return;
            provider.getNetwork().then((res) => {
              if (res.error) {
                console.error(res.error);
                return;
              }
              setNetwork(res.val);
            });
          }}
          style={{ cursor: 'pointer' }}
        >
          Network: {network}
        </div>
      </div>
    </>
  );
};
