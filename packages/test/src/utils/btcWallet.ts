import { BitcoinProvider, BitcoinWallet } from '@catalogfi/wallets';
import { BitcoinNetwork } from '@gardenfi/react-hooks';
import { API } from '@gardenfi/utils';

const LOCALNET_PRIVATE_KEY = 'e74774de025ff84c957593cce735c3547a7a14cc035d2e8e73e7cc8932f592d3';

export const getLocalnetBTCWallet = () => {
  const provider = new BitcoinProvider(BitcoinNetwork.Regtest, API.localnet.bitcoin);
  const wallet = BitcoinWallet.fromPrivateKey(LOCALNET_PRIVATE_KEY, provider);
  // Btc address: bcrt1q7vncwjphkythgcu48nvcw4exw26mh57hwe9rx2
  return wallet;
};
