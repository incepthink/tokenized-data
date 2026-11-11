// Midnight wallet state for the app: detects injected wallets (1AM, Lace),
// connects through the DApp Connector API and exposes the connected API that
// src/lib/midnight/vault.ts uses to prove, balance and submit transactions.

import { useCallback, useEffect, useRef, useState } from "react";
import { MIDNIGHT_NETWORK } from "@/lib/midnight/config";
import {
  watchWallets,
  walletCanProve,
  type ConnectedAPI,
  type DetectedWallet,
  type WalletKind,
} from "@/lib/midnight/wallet";

const LAST_WALLET_KEY = "nexvault.lastWallet";

export interface MidnightWalletState {
  isDetecting: boolean;
  isOneamInstalled: boolean;
  isLaceInstalled: boolean;
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  connectedWallet: WalletKind | null;
  walletName: string | null;
  /** Shielded address of the connected wallet. */
  address: string | null;
  network: string | null;
  /** False for wallets that need a separate proof server (Lace). */
  canProve: boolean;
  connectedAPI: ConnectedAPI | null;
  error: string | null;
  connect: () => Promise<void>;
  connectLace: () => Promise<void>;
  disconnect: () => void;
}

function messageOf(err: unknown): string {
  if (err && typeof err === "object") {
    const e = err as { message?: unknown; reason?: unknown };
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.reason === "string" && e.reason) return e.reason;
  }
  return typeof err === "string" ? err : "Could not connect to the wallet";
}

export function useMidnightWallet(): MidnightWalletState {
  const [wallets, setWallets] = useState<DetectedWallet[]>([]);
  const [isDetecting, setIsDetecting] = useState(true);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectedAPI, setConnectedAPI] = useState<ConnectedAPI | null>(null);
  const [connectedWallet, setConnectedWallet] = useState<WalletKind | null>(null);
  const [walletName, setWalletName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<string | null>(null);
  const [canProve, setCanProve] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const triedAutoConnect = useRef(false);

  const connectTo = useCallback(async (wallet: DetectedWallet | undefined, kind: WalletKind) => {
    setError(null);
    if (!wallet) {
      setError(kind === "lace" ? "Lace wallet not found" : "1AM wallet not found");
      return;
    }
    setIsConnecting(true);
    try {
      const api = await wallet.api.connect(MIDNIGHT_NETWORK);
      const [config, addresses] = await Promise.all([
        api.getConfiguration(),
        api.getShieldedAddresses(),
      ]);
      setConnectedAPI(api);
      setConnectedWallet(wallet.kind === "lace" ? "lace" : "oneam");
      setWalletName(wallet.name);
      setAddress(addresses.shieldedAddress);
      setNetwork(config.networkId);
      setCanProve(walletCanProve(api));
      localStorage.setItem(LAST_WALLET_KEY, wallet.key);
    } catch (err) {
      console.error("[Midnight] wallet connect failed:", err);
      setError(messageOf(err));
      localStorage.removeItem(LAST_WALLET_KEY);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  useEffect(() => {
    const stop = watchWallets(setWallets);
    const done = setTimeout(() => setIsDetecting(false), 1500);
    return () => {
      stop();
      clearTimeout(done);
    };
  }, []);

  // Reconnect to the wallet used last time, so a page reload keeps the session.
  useEffect(() => {
    if (triedAutoConnect.current || connectedAPI) return;
    const lastKey = localStorage.getItem(LAST_WALLET_KEY);
    if (!lastKey) return;
    const wallet = wallets.find((w) => w.key === lastKey);
    if (!wallet) return;
    triedAutoConnect.current = true;
    void connectTo(wallet, wallet.kind);
  }, [wallets, connectedAPI, connectTo]);

  const oneam = wallets.find((w) => w.kind === "oneam");
  const lace = wallets.find((w) => w.kind === "lace");

  const connect = useCallback(() => connectTo(oneam ?? wallets.find((w) => w.kind === "other"), "oneam"), [connectTo, oneam, wallets]);
  const connectLace = useCallback(() => connectTo(lace, "lace"), [connectTo, lace]);

  const disconnect = useCallback(() => {
    localStorage.removeItem(LAST_WALLET_KEY);
    setConnectedAPI(null);
    setConnectedWallet(null);
    setWalletName(null);
    setAddress(null);
    setNetwork(null);
    setCanProve(false);
    setError(null);
  }, []);

  return {
    isDetecting,
    isOneamInstalled: !!oneam || wallets.some((w) => w.kind === "other"),
    isLaceInstalled: !!lace,
    isInstalled: wallets.length > 0,
    isConnected: !!connectedAPI,
    isConnecting,
    connectedWallet,
    walletName,
    address,
    network,
    canProve,
    connectedAPI,
    error,
    connect,
    connectLace,
    disconnect,
  };
}
