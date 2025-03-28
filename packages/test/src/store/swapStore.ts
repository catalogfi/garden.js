import { create } from "zustand";
import { SupportedAssets } from "@gardenfi/orderbook";
import { SwapParams } from "@gardenfi/core";

interface SwapState {
  swapParams: SwapParams;
  inputAmount: string;
  btcAddress: string;
  errorMessage: string | null;
  loading: boolean;
  // BTC <-> wBTC
  isBtcToWbtc: boolean;
  isWbtcToBtc: boolean;
  // SOL <-> wBTC
  isSolToWbtc: boolean;
  isWbtcToSol: boolean;
  // SOL <-> BTC
  isSolToBtc: boolean;
  isBtcToSol: boolean;
  solAddress?: string;
  setSwapParams: (params: Partial<SwapState["swapParams"]>) => void;
  setInputAmount: (amount: string) => void;
  setBtcAddress: (address: string) => void;
  setSolanaAddress: (address: string) => void;
  setErrorMessage: (message: string | null) => void;
  setLoading: (loading: boolean) => void;
  toggleSwapDirection: () => void;
}

export const swapStore = create<SwapState>((set) => ({
  swapParams: {
    fromAsset: SupportedAssets.testnet.ethereum_sepolia_WBTC,
    toAsset: SupportedAssets.testnet.bitcoin_testnet_BTC,
    sendAmount: "0",
    receiveAmount: "0",
    additionalData: { strategyId: "" },
  },
  inputAmount: "",
  btcAddress: "",
  errorMessage: null,
  loading: false,
  isBtcToWbtc: false,
  isWbtcToBtc: true,
  isSolToWbtc: false,
  isWbtcToSol: false,
  isSolToBtc: false,
  isBtcToSol: false,
  solAddress: "",
  setSwapParams: (params) =>
    set((state) => ({
      swapParams: { ...state.swapParams, ...params },
    })),
  setInputAmount: (amount) => set({ inputAmount: amount }),
  setBtcAddress: (address) => set({ btcAddress: address }),
  setSolanaAddress: (address) => set({ solAddress: address }),
  setErrorMessage: (message) => set({ errorMessage: message }),
  setLoading: (loading) => set({ loading }),
  toggleSwapDirection: () =>
    set((state) => {
      // Determine current active swap type
      let newState = {
        isBtcToWbtc: false,
        isWbtcToBtc: false,
        isSolToWbtc: false,
        isWbtcToSol: false,
        isSolToBtc: false,
        isBtcToSol: false,
      };

      if (state.isBtcToWbtc || state.isWbtcToBtc) {
        // Toggle between BTC and WBTC
        newState = {
          isBtcToWbtc: !state.isBtcToWbtc,
          isWbtcToBtc: !state.isWbtcToBtc,
          isSolToWbtc: false,
          isWbtcToSol: false,
          isSolToBtc: false,
          isBtcToSol: false,
        };
      } else if (state.isSolToWbtc || state.isWbtcToSol) {
        // Toggle between SOL and WBTC
        newState = {
          isSolToWbtc: !state.isSolToWbtc,
          isWbtcToSol: !state.isWbtcToSol,
          isBtcToWbtc: false,
          isWbtcToBtc: false,
          isSolToBtc: false,
          isBtcToSol: false,
        };
      } else if (state.isSolToBtc || state.isBtcToSol) {
        // Toggle between SOL and BTC
        newState = {
          isSolToBtc: !state.isSolToBtc,
          isBtcToSol: !state.isBtcToSol,
          isBtcToWbtc: false,
          isWbtcToBtc: false,
          isSolToWbtc: false,
          isWbtcToSol: false,
        };
      }

      // Determine assets based on current active swap
      let fromAsset, toAsset;

      if (newState.isBtcToWbtc) {
        fromAsset = SupportedAssets.testnet.bitcoin_testnet_BTC;
        toAsset = SupportedAssets.testnet.ethereum_sepolia_WBTC;
      } else if (newState.isWbtcToBtc) {
        fromAsset = SupportedAssets.testnet.ethereum_sepolia_WBTC;
        toAsset = SupportedAssets.testnet.bitcoin_testnet_BTC;
      } else if (newState.isSolToWbtc) {
        fromAsset = SupportedAssets.localnet.solana_localnet_SOL;
        toAsset = SupportedAssets.testnet.ethereum_sepolia_WBTC;
      } else if (newState.isWbtcToSol) {
        fromAsset = SupportedAssets.testnet.ethereum_sepolia_WBTC;
        toAsset = SupportedAssets.localnet.solana_localnet_SOL;
      } else if (newState.isSolToBtc) {
        fromAsset = SupportedAssets.localnet.solana_localnet_SOL;
        toAsset = SupportedAssets.testnet.bitcoin_testnet_BTC;
      } else if (newState.isBtcToSol) {
        fromAsset = SupportedAssets.testnet.bitcoin_testnet_BTC;
        toAsset = SupportedAssets.localnet.solana_localnet_SOL;
      }

      return {
        ...newState,
        inputAmount: "",
        btcAddress: "",
        solAddress: "",
        swapParams: {
          fromAsset,
          toAsset,
          sendAmount: "0",
          receiveAmount: "0",
          additionalData: { strategyId: "" },
        }
      };
    }),
}));
