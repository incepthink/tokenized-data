// Midnight Wallet — React hook (mock)
// Returns a simulated connected state with a dummy shielded address.
// Real wallet APIs are bypassed since NexVault is a demo app.

import { useState, useEffect, useCallback } from "react";
import type { MidnightConnectedAPI, MidnightNetwork } from "@/lib/midnight/types";

export interface MidnightWalletState {
  isOneamInstalled: boolean;
  isLaceInstalled: boolean;
  isInstalled: boolean;
  isConnected: boolean;
  isConnecting: boolean;
  connectedWallet: "oneam" | "lace" | null;
  address: string | null;
  network: MidnightNetwork | null;
  connectedAPI: MidnightConnectedAPI | null;
  error: string | null;
  connect: () => Promise<void>;
  connectLace: () => Promise<void>;
  disconnect: () => void;
}

const NETWORK: MidnightNetwork = "preprod";
const MOCK_ONEAM_ADDRESS = "mn1q9rvzfk3p8xw4c6y2l0m5d7n3j8e4t2h6s1afq";
const MOCK_LACE_ADDRESS = "mn1q7kpxz2r4w9v8c3n0l6m5d2j7e8t4h1s9afq3";

export function useMidnightWallet(): MidnightWalletState {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(true);
  const [connectedWallet, setConnectedWallet] = useState<"oneam" | "lace" | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [network, setNetwork] = useState<MidnightNetwork | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsConnecting(false);
  }, []);

  const connect = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 800));
    setAddress(MOCK_ONEAM_ADDRESS);
    setNetwork(NETWORK);
    setConnectedWallet("oneam");
    setIsConnected(true);
    setIsConnecting(false);
  }, []);

  const connectLace = useCallback(async () => {
    setIsConnecting(true);
    setError(null);
    await new Promise((r) => setTimeout(r, 800));
    setAddress(MOCK_LACE_ADDRESS);
    setNetwork(NETWORK);
    setConnectedWallet("lace");
    setIsConnected(true);
    setIsConnecting(false);
  }, []);

  const disconnect = useCallback(() => {
    setIsConnected(false);
    setAddress(null);
    setNetwork(null);
    setConnectedWallet(null);
    setError(null);
  }, []);

  return {
    isOneamInstalled: true,
    isLaceInstalled: true,
    isInstalled: true,
    isConnected,
    isConnecting,
    connectedWallet,
    address,
    network,
    connectedAPI: null,
    error,
    connect,
    connectLace,
    disconnect,
  };
}
