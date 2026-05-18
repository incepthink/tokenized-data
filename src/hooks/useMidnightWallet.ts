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

    // Lace is synchronous — just check if it's installed for the UI flag.
    // We no longer store the object; connectLace() re-detects fresh each time.
    if (detectLaceWallet() && !cancelled) {
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
    setIsConnecting(true);
    setError(null);
    try {
      // Re-detect Lace fresh every time instead of using the stored reference.
      // If the extension's background worker restarted (MV3 service workers get
      // killed by the browser after ~30s of inactivity), the old reference is
      // dead. detectLaceWallet() reads window.midnight.mnLace right now, which
      // is always the live injected object.
      const freshLace = detectLaceWallet();
      if (!freshLace) {
        setError("Lace Midnight Wallet is not installed.");
        return;
      }

      // Helper that does the actual connect + address fetch.
      // Defined inline so we can call it twice (initial attempt + one retry).
      console.log("[Midnight/Lace] freshLace object:", freshLace);
      console.log("[Midnight/Lace] freshLace keys:", Object.keys(freshLace as any));
      console.log("[Midnight/Lace] calling connect('preprod')...");

      const attemptConnect = async () => {
        const laceAPI = await freshLace.connect(NETWORK);
        console.warn(
          "[Midnight/Lace] Connected API methods:",
          Object.getOwnPropertyNames(Object.getPrototypeOf(laceAPI)).concat(
            Object.keys(laceAPI),
          ),
        );
        const { unshieldedAddress } = await laceAPI.getUnshieldedAddress();
        return { laceAPI, unshieldedAddress };
      };

      let result: Awaited<ReturnType<typeof attemptConnect>>;
      try {
        result = await attemptConnect();
      } catch (firstErr) {
        console.error("[Midnight/Lace] connect() threw:", firstErr);
        console.error(
          "[Midnight/Lace] error message:",
          firstErr instanceof Error ? firstErr.message : String(firstErr),
        );
        console.error("[Midnight/Lace] error type:", (firstErr as any)?.constructor?.name);

        const msg = firstErr instanceof Error ? firstErr.message.toLowerCase() : "";

        // "channel was shutdown" — MV3 service worker was killed; retry wakes it.
        const isShutdown = msg.includes("was shutdown");
        // "not available" / "dapp connector" — extension not yet ready or feature
        // disabled; a single retry sometimes recovers if it's a timing issue.
        const isDappConnectorError =
          msg.includes("not available") ||
          msg.includes("dapp connector") ||
          msg.includes("functionality may be disabled");

        if (!isShutdown && !isDappConnectorError) throw firstErr;

        if (isShutdown) {
          console.warn("[Midnight/Lace] Channel shutdown detected — retrying once…");
        } else {
          console.warn("[Midnight/Lace] DApp connector error detected — retrying once…");
        }

        result = await attemptConnect();
      }

      const { laceAPI, unshieldedAddress } = result;

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
  }, []);

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
