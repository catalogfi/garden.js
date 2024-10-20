import { useEffect, useState } from 'react';
import { useBitcoinWallet } from '../../../src';

export const Hello = () => {
  const [balance, setBalance] = useState({
    total: 0,
    confirmed: 0,
    unconfirmed: 0,
  });
  const [sendAmount, setSendAmount] = useState<number>();
  const [sendAddress, setSendAddress] = useState('');
  const [hash, setHash] = useState<string | null>(null);
  const { walletList, account, provider, connect, network, updateAccount } =
    useBitcoinWallet();

  const updateInfo = async () => {
    if (!provider) return;
    await updateAccount();
    provider.getBalance().then((res) => {
      if (res.error) {
        console.error(res.error);
        return;
      }
      setBalance(res.val);
    })
  }

  useEffect(() => {
    updateInfo();
  }, [provider, network]);

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
          style={{ cursor: 'pointer' }}
        >
          total balance: {balance.total}
        </div>
        <div>confirmed balance: {balance.confirmed}</div>
        <div>unconfirmed balance: {balance.unconfirmed}</div>
        {hash && <div>hash: <a href={`https://mempool.space/testnet/tx/${hash}`} target='_blank'>{hash}</a></div>}
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
              setHash(res.val);
            });
          }}
        >
          Send Bitcoin
        </button>

        <button
          onClick={async () => {
            if (!provider) {
              console.error("could not find provider");
              return;
            }
            const res = await provider.switchNetwork();
            if (res.error) {
              console.error('error while switching network:', res.error);
              return;
            }
            await updateInfo();
          }}
          
        >
          Switch Network
        </button>
      </div>
    </>
  );
};
