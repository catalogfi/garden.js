import React from 'react';
import { useAccount } from 'wagmi';
import { DebridgeProvider } from '@gardenfi/debridge';

const AccountDebridgeProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const { isConnected, address } = useAccount();
  if (!isConnected || !address) return <div>Please connect your account</div>;
  return (
    <DebridgeProvider address={address} store={localStorage}>
      {children}
    </DebridgeProvider>
  );
};

export default AccountDebridgeProvider;
