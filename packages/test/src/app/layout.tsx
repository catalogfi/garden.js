import SolanaWalletProvider from '@/providers/SolanaWalletProvider';
import Providers from '../providers/Providers';
import './globals.css';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <SolanaWalletProvider>{children}</SolanaWalletProvider>
        </Providers>
      </body>
    </html>
  );
}
