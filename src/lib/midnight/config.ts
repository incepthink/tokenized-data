// Midnight network configuration for NexVault. Everything is overridable from
// Vercel env vars so the same build can move to Preprod or Mainnet.
//
// Defaults: the document_vault contract deployed to the Preview network on
// 2026-11-11 by chain/e2e.mjs (deploy tx be56bf15757b22986ca23c371f4df11ecca0e6859c8064f135fcb6cd6fa35c53).

const DEFAULT_NETWORK = "preview";
const DEFAULT_CONTRACT_ADDRESS =
  "f7fe7d8091040cbdd4a39df34a69f7a7dfdb1d57ba4f78780ac5d34e2f1c01c5";

export const MIDNIGHT_NETWORK: string =
  import.meta.env.VITE_MIDNIGHT_NETWORK || DEFAULT_NETWORK;

/** Address of the deployed document_vault contract on MIDNIGHT_NETWORK. */
export const CONTRACT_ADDRESS: string = (
  import.meta.env.VITE_MIDNIGHT_CONTRACT_ADDRESS ||
  (MIDNIGHT_NETWORK === DEFAULT_NETWORK ? DEFAULT_CONTRACT_ADDRESS : "")
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
