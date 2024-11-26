import React, { useState } from 'react';
import { useGarden } from '@gardenfi/react-hooks';
import { useAccount, useChainId, useConnect, useWalletClient } from 'wagmi';
import {
  bitcoinRegtestAsset,
  Chains,
  WBTCArbitrumLocalnetAsset,
  WBTCEthereumLocalnetAsset,
} from '@gardenfi/orderbook';
import './App.css';
import { switchOrAddNetwork } from '@gardenfi/core';

const chainToAsset = {
  ethereum_localnet: WBTCEthereumLocalnetAsset,
  arbitrum_localnet: WBTCArbitrumLocalnetAsset,
  bitcoin_regtest: bitcoinRegtestAsset,
};

function App() {
  const [sm, setSm] = useState('');
  const chainId = useChainId();
  const { connectors } = useConnect();
  const { address: EvmAddress } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { initializeSecretManager, swapAndInitiate } = useGarden();
  const [loading, setLoading] = useState(false);

  const [swapParams, setSwapParams] = useState({
    inputToken: chainToAsset.ethereum_localnet,
    outputToken: chainToAsset.arbitrum_localnet,
    inputAmount: 0.001,
    outputAmount: 0.0009,
    btcAddress: '',
  });

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <div>Address: {EvmAddress}</div>
          <button
            onClick={async () => {
              if (!initializeSecretManager) return;
              const res = await initializeSecretManager();
              if (res.ok) {
                setSm(res.val.getMasterPrivKey());
              }
            }}
          >
            Initialize SM
          </button>
          {sm && <div>MasterPrivKey: {sm}</div>}
        </div>
        <div>
          <div>CurrentChainId: {chainId}</div>
          <h2>Wallets</h2>
          {connectors.map((connector) => {
            return (
              <div
                style={{
                  cursor: 'pointer',
                }}
                key={connector.uid}
                onClick={async () => {
                  await connector.connect();
                }}
              >
                {connector.name}
              </div>
            );
          })}
        </div>
        <div>
          <h2>Networks</h2>
          {Object.values(Chains).map((chain) => {
            if (chain.includes('bitcoin')) return null;
            return (
              <div
                key={chain}
                style={{
                  cursor: 'pointer',
                }}
                onClick={() => {
                  if (!walletClient) return;
                  switchOrAddNetwork(chain, walletClient);
                }}
              >
                {chain}
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <h2>Create order</h2>
        <div
          style={{
            display: 'flex',
            gap: '40px',
          }}
        >
          <div>
            <div>Input token</div>
            <select
              onChange={(e) => {
                setSwapParams({
                  ...swapParams,
                  inputToken:
                    chainToAsset[e.target.value as keyof typeof chainToAsset],
                });
              }}
            >
              <option>--select input token--</option>
              {Object.entries(chainToAsset).map(([network, asset]) => {
                return (
                  <option key={asset.name} value={network}>
                    {asset.name}
                  </option>
                );
              })}
            </select>
            <div>
              <input
                type="number"
                placeholder="Input amount"
                value={swapParams.inputAmount}
                onChange={(event) => {
                  const amount = Number(event.target.value);
                  const outputAmount = amount * 0.997;
                  setSwapParams({
                    ...swapParams,
                    inputAmount: amount,
                    outputAmount: outputAmount,
                  });
                }}
              />
            </div>
          </div>
          <div>
            <div>Output token</div>
            <select
              onChange={(e) => {
                setSwapParams({
                  ...swapParams,
                  outputToken:
                    chainToAsset[e.target.value as keyof typeof chainToAsset],
                });
              }}
            >
              <option>--select output token--</option>
              {Object.entries(chainToAsset).map(([network, asset]) => {
                return (
                  <option key={asset.name} value={network}>
                    {asset.name}
                  </option>
                );
              })}
            </select>
            <div>
              <input
                type="number"
                placeholder="Output amount"
                value={swapParams.outputAmount}
                onChange={(event) => {
                  setSwapParams({
                    ...swapParams,
                    outputAmount: Number(event.target.value),
                  });
                }}
              />
            </div>
          </div>
        </div>
      </div>
      <input
        type="text"
        placeholder="BTC address"
        value={swapParams.btcAddress}
        onChange={(event) => {
          setSwapParams({ ...swapParams, btcAddress: event.target.value });
        }}
      />
      <div>
        <button
          style={{
            cursor: 'pointer',
            padding: '10px',
            margin: '10px 0',
            border: '1px solid black',
          }}
          onClick={async () => {
            const sendAmount =
              swapParams.inputAmount * 10 ** swapParams.inputToken.decimals;
            const receiveAmount =
              swapParams.outputAmount * 10 ** swapParams.outputToken.decimals;
            if (
              !swapAndInitiate ||
              !EvmAddress ||
              !swapParams.inputAmount ||
              !swapParams.outputAmount
            )
              return;
            console.log({
              sendAddress: EvmAddress,
              receiveAddress: EvmAddress,
              fromAsset: swapParams.inputToken,
              toAsset: swapParams.outputToken,
              sendAmount: sendAmount.toFixed(),
              receiveAmount: receiveAmount.toFixed(),
              minDestinationConfirmations: 3,
            });

            setLoading(true);
            const res = await swapAndInitiate({
              fromAsset: swapParams.inputToken,
              toAsset: swapParams.outputToken,
              sendAmount: sendAmount.toString(),
              receiveAmount: receiveAmount.toString(),
              minDestinationConfirmations: 3,
              additionalData: {
                btcAddress: swapParams.btcAddress,
                strategyId: '1',
              },
            });
            setLoading(false);
            console.log('res.error :', res.error);
            console.log('res.ok :', res.ok);
            console.log('res.val :', res.val);
          }}
        >
          {loading ? 'Swapping...' : 'Swap'}
        </button>
      </div>
    </div>
  );
}

export default App;
