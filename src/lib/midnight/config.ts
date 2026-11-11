// Midnight network configuration for NexVault. Everything is overridable from
// Vercel env vars so the same build can move from Preprod to Mainnet.

export const MIDNIGHT_NETWORK: string =
  import.meta.env.VITE_MIDNIGHT_NETWORK || "preprod";

/** Address of the deployed document_vault contract on MIDNIGHT_NETWORK. */
export const CONTRACT_ADDRESS: string = (
  import.meta.env.VITE_MIDNIGHT_CONTRACT_ADDRESS || ""
).trim();

/** Used only when the connected wallet cannot prove (Lace): a proof server the user runs. */
export const FALLBACK_PROOF_SERVER: string =
  import.meta.env.VITE_MIDNIGHT_PROOF_SERVER_URL || "http://localhost:6300";

/** Explorer URL template; "{tx}" is replaced by the transaction hash. */
const EXPLORER_TX_URL: string = import.meta.env.VITE_MIDNIGHT_EXPLORER_TX_URL || "";

export function explorerTxUrl(txHash: string | null | undefined): string | null {
  if (!txHash || !EXPLORER_TX_URL) return null;
  return EXPLORER_TX_URL.replace("{tx}", txHash);
}

export const isContractConfigured = (): boolean => CONTRACT_ADDRESS.length > 0;
