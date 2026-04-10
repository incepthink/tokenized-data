// Midnight Wallet — Detection utilities
// 1AM: polls window.midnight['1am'] with 100ms intervals for up to 5 seconds (per 1AM docs)
// Lace: immediate check of window.midnight.mnLace (no polling needed)

import type { MidnightWalletAPI, LaceWalletObject } from "./types";

/**
 * Detects the 1AM Midnight wallet browser extension.
 * Returns the wallet API if found, or null if not installed / timed out.
 */
export async function detectMidnightWallet(): Promise<MidnightWalletAPI | null> {
  return new Promise((resolve) => {
    // Check immediately first
    const immediate = window.midnight?.["1am"];
    if (immediate) {
      resolve(immediate as unknown as MidnightWalletAPI);
      return;
    }

    let attempts = 0;
    const MAX_ATTEMPTS = 50; // 50 × 100ms = 5 seconds

    const interval = setInterval(() => {
      const wallet = window.midnight?.["1am"];
      if (wallet) {
        clearInterval(interval);
        resolve(wallet as unknown as MidnightWalletAPI);
      } else if (++attempts >= MAX_ATTEMPTS) {
        clearInterval(interval);
        resolve(null);
      }
    }, 100);
  });
}

/**
 * Detects the Lace Midnight wallet browser extension.
 * Lace injects synchronously, so no polling is needed.
 * Returns the wallet object if found, or null if not installed.
 */
export function detectLaceWallet(): LaceWalletObject | null {
  const midnight = window.midnight;
  if (!midnight) return null;

  // Check the documented Lace injection key first
  if ((midnight as any).mnLace) return (midnight as any).mnLace as LaceWalletObject;

  // Fallback: scan for rdns or name properties
  const lace = Object.values(midnight).find(
    (entry: any) =>
      entry?.rdns === "io.lace.wallet" ||
      entry?.name?.toLowerCase() === "lace"
  );

  return lace ? (lace as unknown as LaceWalletObject) : null;
}
