// Midnight Wallet — React hook
// Supports both 1AM (window.midnight['1am']) and Lace (window.midnight.mnLace) wallets.
// Wraps both imperative wallet APIs into a single React state.

import { useState, useEffect, useCallback } from "react";
import {
  detectMidnightWallet,
  detectLaceWallet,
} from "@/lib/midnight/detectWallet";
import type {
  MidnightWalletAPI,
  MidnightConnectedAPI,
  MidnightNetwork,
  LaceWalletObject,
} from "@/lib/midnight/types";

export interface MidnightWalletState {
  /** Whether the 1AM wallet extension is installed */
  isOneamInstalled: boolean;
  /** Whether the Lace wallet extension is installed */
  isLaceInstalled: boolean;
  /** Alias for isOneamInstalled — kept for backward compatibility */
  isInstalled: boolean;
  /** Whether the user has connected either wallet */
  isConnected: boolean;
  /** True while detecting or connecting */
  isConnecting: boolean;
  /** Which wallet is currently connected */
  connectedWallet: "oneam" | "lace" | null;
  /** The connected shielded address / coin public key (primary display address) */
  address: string | null;
  /** The connected network */
  network: MidnightNetwork | null;
  /** The raw connected API (for contractApi.ts) */
  connectedAPI: MidnightConnectedAPI | null;
  /** Error message if connection failed */
  error: string | null;
  /** Connect to the 1AM wallet */
  connect: () => Promise<void>;
  /** Connect to the Lace wallet */
  connectLace: () => Promise<void>;
  /** Disconnect (clears local state; wallet stays connected in extension) */
  disconnect: () => void;
}

const NETWORK: MidnightNetwork = "preprod";

export function useMidnightWallet(): MidnightWalletState {
  const [oneamWalletAPI, setOneamWalletAPI] =
    useState<MidnightWalletAPI | null>(null);
  const [laceWalletObject, setLaceWalletObject] =
    useState<LaceWalletObject | null>(null);

  const [isOneamInstalled, setIsOneamInstalled] = useState(false);
  const [isLaceInstalled, setIsLaceInstalled] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true); // true while detecting
  const [connectedWallet, setConnectedWallet] = useState<
    "oneam" | "lace" | null
  >(null);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<MidnightNetwork | null>(null);
  const [connectedAPI, setConnectedAPI] = useState<MidnightConnectedAPI | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);

  // On mount: detect both wallet extensions
  useEffect(() => {
    let cancelled = false;

    // Lace is synchronous — check immediately
    const lace = detectLaceWallet();
    if (lace && !cancelled) {
      setLaceWalletObject(lace);
      setIsLaceInstalled(true);
    }

    // 1AM requires polling
    detectMidnightWallet().then((api) => {
      if (cancelled) return;
      if (api) {
        setOneamWalletAPI(api);
        setIsOneamInstalled(true);
      }
      setIsConnecting(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    if (!oneamWalletAPI) {
      setError("1AM Midnight Wallet is not installed.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const api = await oneamWalletAPI.connect(NETWORK);
      const { shieldedAddress } = await api.getShieldedAddresses();
      const adapterAPI = new Proxy(api, {
        get(target, prop, receiver) {
          if (prop === "walletType") return "oneam";
          const val = Reflect.get(target, prop, receiver);
          return typeof val === "function" ? val.bind(target) : val;
        },
      }) as unknown as MidnightConnectedAPI;
      setConnectedAPI(adapterAPI);
      setAddress(shieldedAddress);
      setNetwork(NETWORK);
      setConnectedWallet("oneam");
      setIsConnected(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect 1AM wallet.",
      );
    } finally {
      setIsConnecting(false);
    }
  }, [oneamWalletAPI]);

  const connectLace = useCallback(async () => {
    if (!laceWalletObject) {
      setError("Lace Midnight Wallet is not installed.");
      return;
    }
    setIsConnecting(true);
    setError(null);
    try {
      const laceAPI = await laceWalletObject.connect(NETWORK);
      console.warn(
        "[Midnight/Lace] Connected API methods:",
        Object.getOwnPropertyNames(Object.getPrototypeOf(laceAPI)).concat(
          Object.keys(laceAPI),
        ),
      );
      const { unshieldedAddress } = await laceAPI.getUnshieldedAddress();
      const adapterAPI = new Proxy(laceAPI, {
        get(target, prop, receiver) {
          if (prop === "walletType") return "lace";
          if (prop === "getDustAddress")
            return () =>
              Promise.reject(new Error("getDustAddress not supported by Lace"));
          if (prop === "getShieldedBalances")
            return () =>
              Promise.reject(
                new Error("getShieldedBalances not supported by Lace"),
              );
          // if (prop === 'getProvingProvider') return () => Promise.reject(new Error("WALLET_NO_PROVING_PROVIDER: Lace does not support getProvingProvider"));
          const val = Reflect.get(target, prop, receiver);
          return typeof val === "function" ? val.bind(target) : val;
        },
      }) as unknown as MidnightConnectedAPI;
      setConnectedAPI(adapterAPI);
      setAddress(unshieldedAddress);
      setNetwork(NETWORK);
      setConnectedWallet("lace");
      setIsConnected(true);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to connect Lace wallet.",
      );
    } finally {
      setIsConnecting(false);
    }
  }, [laceWalletObject]);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setNetwork(null);
    setConnectedAPI(null);
    setConnectedWallet(null);
    setError(null);
  }, []);

  return {
    isOneamInstalled,
    isLaceInstalled,
    isInstalled: isOneamInstalled, // backward compat
    isConnected,
    isConnecting,
    connectedWallet,
    address,
    network,
    connectedAPI,
    error,
    connect,
    connectLace,
    disconnect,
  };
}
