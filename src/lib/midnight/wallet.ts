// Midnight wallet discovery through the DApp Connector API (CAIP-372).
// Wallets (Lace, 1AM, ...) inject themselves under window.midnight.

import type { ConnectedAPI, InitialAPI } from "@midnightntwrk/dapp-connector-api";

export type { ConnectedAPI, InitialAPI };

export type WalletKind = "oneam" | "lace" | "other";

export interface DetectedWallet {
  key: string;
  kind: WalletKind;
  name: string;
  api: InitialAPI;
}

type MidnightWindow = Window & { midnight?: Record<string, unknown> };

function kindOf(key: string, api: InitialAPI): WalletKind {
  const id = `${key} ${api.name ?? ""} ${(api as { rdns?: string }).rdns ?? ""}`.toLowerCase();
  if (id.includes("1am")) return "oneam";
  if (id.includes("lace")) return "lace";
  return "other";
}

export function detectWallets(): DetectedWallet[] {
  const midnight = (window as MidnightWindow).midnight;
  if (!midnight) return [];
  const found: DetectedWallet[] = [];
  for (const key of Object.keys(midnight)) {
    const candidate = midnight[key] as Partial<InitialAPI> | undefined;
    if (candidate && typeof candidate === "object" && typeof candidate.connect === "function") {
      const api = candidate as InitialAPI;
      found.push({ key, kind: kindOf(key, api), name: api.name ?? key, api });
    }
  }
  return found;
}

/** Polls for injected wallets; extensions can inject after page load. */
export function watchWallets(
  onChange: (wallets: DetectedWallet[]) => void,
  { intervalMs = 400, attempts = 15 } = {},
): () => void {
  let count = 0;
  let lastKeys = "";
  const tick = () => {
    const wallets = detectWallets();
    const keys = wallets.map((w) => w.key).join(",");
    if (keys !== lastKeys) {
      lastKeys = keys;
      onChange(wallets);
    }
    if (++count >= attempts) clearInterval(timer);
  };
  const timer = setInterval(tick, intervalMs);
  tick();
  return () => clearInterval(timer);
}

export const walletCanProve = (api: ConnectedAPI): boolean =>
  typeof (api as Partial<ConnectedAPI>).getProvingProvider === "function";
