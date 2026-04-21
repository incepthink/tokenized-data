// Midnight Document Vault — on-chain contract API
// Wraps the 5 compiled circuits for client-side ZK transaction submission via the 1AM wallet.

import {
  createCircuitContext,
  proofDataIntoSerializedPreimage,
  ContractState,
} from "@midnight-ntwrk/compact-runtime";
import type { ProofData } from "@midnight-ntwrk/compact-runtime";
import type { KeyMaterialProvider } from "@midnight-ntwrk/dapp-connector-api";
import { bech32m } from "@scure/base";

import { Contract } from "@/lib/managed/contract";
import type { MidnightConnectedAPI, MidnightNetwork } from "./types";

// ZK artifact URL imports — Vite serves these as hashed static assets
import createCollectionZkir    from "@/lib/managed/zkir/createCollection.zkir?url";
import mintDocumentZkir        from "@/lib/managed/zkir/mintDocument.zkir?url";
import grantAccessZkir         from "@/lib/managed/zkir/grantAccess.zkir?url";
import revokeAccessZkir        from "@/lib/managed/zkir/revokeAccess.zkir?url";
import signDocumentZkir        from "@/lib/managed/zkir/signDocument.zkir?url";

import createCollectionProver  from "@/lib/managed/keys/createCollection.prover?url";
import mintDocumentProver      from "@/lib/managed/keys/mintDocument.prover?url";
import grantAccessProver       from "@/lib/managed/keys/grantAccess.prover?url";
import revokeAccessProver      from "@/lib/managed/keys/revokeAccess.prover?url";
import signDocumentProver      from "@/lib/managed/keys/signDocument.prover?url";

import createCollectionVerifier from "@/lib/managed/keys/createCollection.verifier?url";
import mintDocumentVerifier     from "@/lib/managed/keys/mintDocument.verifier?url";
import grantAccessVerifier      from "@/lib/managed/keys/grantAccess.verifier?url";
import revokeAccessVerifier     from "@/lib/managed/keys/revokeAccess.verifier?url";
import signDocumentVerifier     from "@/lib/managed/keys/signDocument.verifier?url";

// ─── ZK artifact URL maps (Vite ?url → hashed static asset paths) ────────────

const ZKIR_URLS: Record<string, string> = {
  createCollection: createCollectionZkir,
  mintDocument:     mintDocumentZkir,
  grantAccess:      grantAccessZkir,
  revokeAccess:     revokeAccessZkir,
  signDocument:     signDocumentZkir,
};
const PROVER_URLS: Record<string, string> = {
  createCollection: createCollectionProver,
  mintDocument:     mintDocumentProver,
  grantAccess:      grantAccessProver,
  revokeAccess:     revokeAccessProver,
  signDocument:     signDocumentProver,
};
const VERIFIER_URLS: Record<string, string> = {
  createCollection: createCollectionVerifier,
  mintDocument:     mintDocumentVerifier,
  grantAccess:      grantAccessVerifier,
  revokeAccess:     revokeAccessVerifier,
  signDocument:     signDocumentVerifier,
};

// ─── Constants ───────────────────────────────────────────────────────────────

export const CONTRACT_ADDRESS =
  "1b43e6ec23099d0e99fdefd0a1c6fd0b3e2682218c553df529a4f9a980c5df92";
export const CONTRACT_NETWORK: MidnightNetwork = "preprod";

// Key location identifiers used by the proving provider to fetch ZK circuit keys.
// These correspond to circuit names served by the prover key server.
const CIRCUIT_KEY = {
  createCollection: "createCollection",
  mintDocument: "mintDocument",
  grantAccess: "grantAccess",
  revokeAccess: "revokeAccess",
  signDocument: "signDocument",
} as const;

// ─── Utility: decode shielded address → raw 32-byte public key ───────────────

/**
 * Decodes a Bech32m-encoded shielded address into its raw 32-byte Uint8Array.
 * Used when the caller needs a raw `Bytes<32>` for Compact circuits.
 *
 * Note: Midnight's on-chain `persistentHash(sk)` is the ZK public key, which is
 * what the contract stores. If this decode does not match, use the wallet's
 * `shieldedCoinPublicKey` directly (a string) with `encodeCoinPublicKey()` instead.
 */
export function decodeShieldedAddress(addr: string): Uint8Array {
  const { words } = bech32m.decode(addr as `${string}1${string}`, 1000);
  return new Uint8Array(bech32m.fromWords(words)).slice(-32);
}

// ─── Utility: hex helpers ─────────────────────────────────────────────────────

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function hexToBytes(hex: string): Uint8Array {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.slice(i, i + 2), 16);
  }
  return arr;
}

/** Computes a SHA-256 hash of a hex-encoded string, returns hex string. */
async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const hashBuf = await crypto.subtle.digest("SHA-256", bytes);
  return bytesToHex(new Uint8Array(hashBuf));
}

// ─── Indexer: fetch current on-chain contract state ──────────────────────────

/**
 * Fetches the current contract state from the Midnight indexer via GraphQL.
 * The indexer exposes contract ledger state as a JSON-encoded `EncodedStateValue`.
 */
async function fetchContractState(indexerUri: string): Promise<ContractState> {
  const query = `query {
    contractAction(address: "${CONTRACT_ADDRESS}") {
      state
    }
  }`;
  const res = await fetch(indexerUri, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Indexer request failed: ${res.status} ${res.statusText}`);
  }
  const { data, errors } = await res.json();
  if (errors?.length) {
    throw new Error(`Indexer GraphQL error: ${errors[0].message}`);
  }
  // The indexer returns state as an EncodedStateValue (JSON)
  return ContractState.deserialize(hexToBytes(data.contractAction.state));
}

// ─── Proving: build KeyMaterialProvider from prover server ───────────────────

/**
 * Builds a KeyMaterialProvider backed by the locally bundled ZK artifacts.
 * Files are imported via Vite ?url and served as hashed static assets.
 * The wallet calls getZKIR/getProverKey/getVerifierKey with the circuit name
 * (e.g. "mintDocument") which maps to the ZKIR_URLS / PROVER_URLS / VERIFIER_URLS tables.
 */
function buildKeyMaterialProvider(): KeyMaterialProvider {
  const fetchBin = async (url: string): Promise<Uint8Array> => {
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`Failed to fetch key material: ${url} (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  };
  return {
    getZKIR: (loc) => {
      const url = ZKIR_URLS[loc];
      if (!url) throw new Error(`No ZKIR for circuit: ${loc}`);
      return fetchBin(url);
    },
    getProverKey: (loc) => {
      const url = PROVER_URLS[loc];
      if (!url) throw new Error(`No prover key for circuit: ${loc}`);
      return fetchBin(url);
    },
    getVerifierKey: (loc) => {
      const url = VERIFIER_URLS[loc];
      if (!url) throw new Error(`No verifier key for circuit: ${loc}`);
      return fetchBin(url);
    },
  };
}

// ─── Circuit context builder ──────────────────────────────────────────────────

/**
 * Builds a CircuitContext from the current on-chain state and connected wallet.
 *
 * - contractAddress: the deployed contract's hex address (string = ContractAddress)
 * - coinPublicKey: wallet's shieldedCoinPublicKey (bech32m string = CoinPublicKey)
 * - contractState: current ledger state fetched from the indexer
 * - privateState: empty object (no local private state for this contract)
 */
async function buildCircuitContext(connectedAPI: MidnightConnectedAPI) {
  const [config, addresses] = await Promise.all([
    connectedAPI.getConfiguration(),
    connectedAPI.getShieldedAddresses(),
  ]);
  const contractState = await fetchContractState(config.indexerUri);
  // shieldedCoinPublicKey is the raw 32-byte hex coin pk (standard SDK v4+).
  // Fall back to bech32m-decoding shieldedAddress for older wallet versions.
  const coinPkHex =
    addresses.shieldedCoinPublicKey ??
    bytesToHex(decodeShieldedAddress(addresses.shieldedAddress));
  return createCircuitContext(
    CONTRACT_ADDRESS, // ContractAddress (string)
    coinPkHex, // CoinPublicKey (hex-encoded 32-byte coin pk)
    contractState, // current on-chain ledger state
    {}, // private state (unused by this contract)
  );
}

// ─── Transaction pipeline: prove → balance → submit ─────────────────────────

/**
 * Serializes circuit proof data, proves it with the wallet's proving provider,
 * balances the transaction, submits it, and returns a deterministic txHash.
 *
 * The txHash is derived as SHA-256 of the balanced serialized transaction string.
 * This is a deterministic identifier; the actual on-chain transaction hash may
 * differ depending on Midnight's ledger hashing scheme.
 */
async function proveBalanceSubmit(
  connectedAPI: MidnightConnectedAPI,
  proofData: ProofData,
  circuitKeyLocation: string,
): Promise<string> {
  console.log(
    "[proveBalanceSubmit] starting — circuitKeyLocation:",
    circuitKeyLocation,
  );
  try {
    // Serialize the proof data into the preimage format expected by the prover.
    // Both 1AM and Lace paths start from the same serialized preimage.
    const serializedPreimage = proofDataIntoSerializedPreimage(
      proofData.input,
      proofData.output,
      proofData.publicTranscript,
      proofData.privateTranscriptOutputs,
      circuitKeyLocation,
    );
    console.log(
      "[proveBalanceSubmit] serializedPreimage built, byte length:",
      serializedPreimage.length,
    );

    const keyMaterialProvider = buildKeyMaterialProvider();
    console.log(
      "[proveBalanceSubmit] keyMaterialProvider built",
      keyMaterialProvider,
    );

    // if (typeof (connectedAPI as any).getProvingProvider !== "function") {
    //   throw new Error(
    //     "WALLET_NO_PROVING_PROVIDER: This wallet does not support getProvingProvider. " +
    //       "Update your Lace or 1AM extension, or use simulated minting.",
    //   );
    // }
    const provingProvider =
      await connectedAPI.getProvingProvider(keyMaterialProvider);

    // ── DEBUG: inspect what the wallet actually returned ──────────────────────
    console.log("[proveBalanceSubmit] provingProvider raw value:", provingProvider);
    console.log("[proveBalanceSubmit] provingProvider typeof:", typeof provingProvider);
    console.log("[proveBalanceSubmit] provingProvider is null?", provingProvider == null);
    if (provingProvider != null) {
      console.log("[proveBalanceSubmit] provingProvider constructor:", (provingProvider as any)?.constructor?.name);
      console.log("[proveBalanceSubmit] provingProvider own keys:", Object.keys(provingProvider as object));
      console.log("[proveBalanceSubmit] provingProvider prototype keys:", Object.getOwnPropertyNames(Object.getPrototypeOf(provingProvider as object)));
      console.log("[proveBalanceSubmit] typeof provingProvider.prove:", typeof (provingProvider as any).prove);
      // Log every enumerable property and its type
      for (const key of Object.keys(provingProvider as object)) {
        console.log(`[proveBalanceSubmit]   .${key} =>`, typeof (provingProvider as any)[key], (provingProvider as any)[key]);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const provenBytes = await provingProvider.prove(
      serializedPreimage,
      circuitKeyLocation,
    );
    const provenHex = bytesToHex(provenBytes);
    console.log(
      "[proveBalanceSubmit] prove() complete, provenHex length:",
      provenHex.length,
    );

    const { tx: balancedTx } =
      await connectedAPI.balanceUnsealedTransaction(provenHex);
    console.log("[proveBalanceSubmit] balanceUnsealedTransaction() complete");

    await connectedAPI.submitTransaction(balancedTx);
    console.log("[proveBalanceSubmit] submitTransaction() complete");

    const txHash = await sha256Hex(balancedTx);
    console.log("[proveBalanceSubmit] done, txHash:", txHash);
    return txHash;
  } catch (err) {
    console.error("[proveBalanceSubmit] ERROR:", err);
    throw err;
  }
}

// ─── Witness factories ────────────────────────────────────────────────────────

/**
 * Creates witness stubs for circuits.
 * ownerSecretKey / viewerSecretKey are injected server-side by the wallet's proving
 * provider and never invoked locally. Only viewerSignatureHash is locally provided.
 */
function makeWitnesses(sigHash?: Uint8Array) {
  return {
    ownerSecretKey: (): [object, Uint8Array] => {
      throw new Error(
        "ownerSecretKey is injected by the wallet proving provider",
      );
    },
    viewerSecretKey: (): [object, Uint8Array] => {
      throw new Error(
        "viewerSecretKey is injected by the wallet proving provider",
      );
    },
    viewerSignatureHash: (): [object, Uint8Array] => {
      if (!sigHash) throw new Error("sigHash is required for signDocument");
      return [{}, sigHash];
    },
  };
}

// ─── Exported circuit call functions ─────────────────────────────────────────

/**
 * Calls the `createCollection` circuit.
 * @param creatorPk - 32-byte raw public key of the creator (decoded from shielded address)
 * @returns onchainCollectionId (bigint) and txId (hex string)
 */
export async function callCreateCollection(
  connectedAPI: MidnightConnectedAPI,
  creatorPk: Uint8Array,
): Promise<{ onchainCollectionId: bigint; txId: string }> {
  const contract = new Contract(makeWitnesses());
  const ctx = await buildCircuitContext(connectedAPI);
  const { result, proofData } = contract.circuits.createCollection(
    ctx,
    creatorPk,
  );
  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    CIRCUIT_KEY.createCollection,
  );
  return { onchainCollectionId: result, txId };
}

/**
 * Calls the `mintDocument` circuit.
 * @param params.docHash - SHA-256 of document file bytes (32 bytes)
 * @param params.metaHash - SHA-256 of title|category|description string (32 bytes)
 * @param params.ownerPk - 32-byte public key of the intended document owner
 * @param params.creatorPk - 32-byte public key of the connected creator wallet
 * @param params.onchainCollectionId - bigint collection ID returned by createCollection
 * @returns onchainTokenId (bigint) and txId (hex string)
 */
export async function callMintDocument(
  connectedAPI: MidnightConnectedAPI,
  params: {
    docHash: Uint8Array;
    metaHash: Uint8Array;
    ownerPk: Uint8Array;
    creatorPk: Uint8Array;
    onchainCollectionId: bigint;
  },
): Promise<{ onchainTokenId: bigint; txId: string }> {
  const contract = new Contract(makeWitnesses());
  console.log("contrasct", contract);

  const ctx = await buildCircuitContext(connectedAPI);
  console.log("ctx", ctx);

  const { result, proofData } = contract.circuits.mintDocument(
    ctx,
    params.docHash,
    params.metaHash,
    params.ownerPk,
    params.creatorPk,
    params.onchainCollectionId,
  );
  console.log("mintDocument result", result);
  console.log("mintDocument proofData", proofData);

  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    CIRCUIT_KEY.mintDocument,
  );
  console.log("mintDocument txId", txId);
  return { onchainTokenId: result, txId };
}

/**
 * Calls the `grantAccess` circuit.
 * The wallet's proving provider injects the owner's secret key witness server-side.
 * @param tokenId - bigint token ID of the document
 * @param viewerPk - 32-byte public key of the viewer being granted access
 * @returns txId (hex string)
 */
export async function callGrantAccess(
  connectedAPI: MidnightConnectedAPI,
  tokenId: bigint,
  viewerPk: Uint8Array,
): Promise<{ txId: string }> {
  const contract = new Contract(makeWitnesses());
  const ctx = await buildCircuitContext(connectedAPI);
  const { proofData } = contract.circuits.grantAccess(ctx, tokenId, viewerPk);
  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    CIRCUIT_KEY.grantAccess,
  );
  return { txId };
}

/**
 * Calls the `revokeAccess` circuit.
 * The wallet's proving provider injects the owner's secret key witness server-side.
 * @param tokenId - bigint token ID of the document
 * @param viewerPk - 32-byte public key of the viewer being revoked
 * @returns txId (hex string)
 */
export async function callRevokeAccess(
  connectedAPI: MidnightConnectedAPI,
  tokenId: bigint,
  viewerPk: Uint8Array,
): Promise<{ txId: string }> {
  const contract = new Contract(makeWitnesses());
  const ctx = await buildCircuitContext(connectedAPI);
  const { proofData } = contract.circuits.revokeAccess(ctx, tokenId, viewerPk);
  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    CIRCUIT_KEY.revokeAccess,
  );
  return { txId };
}

/**
 * Calls the `signDocument` circuit.
 * The `sigHash` is provided as a witness to the on-chain circuit and stored in `accessLogs`.
 * Build it as: sha256(viewerPk_bytes + timestamp_bytes + docId_bytes), 32 bytes.
 *
 * @param tokenId - bigint token ID of the document
 * @param viewerPk - 32-byte public key of the signing viewer
 * @param sigHash - 32-byte signature hash stored on-chain in accessLogs
 * @returns txId (hex string)
 */
export async function callSignDocument(
  connectedAPI: MidnightConnectedAPI,
  tokenId: bigint,
  viewerPk: Uint8Array,
  sigHash: Uint8Array,
): Promise<{ txId: string }> {
  const contract = new Contract(makeWitnesses(sigHash));
  const ctx = await buildCircuitContext(connectedAPI);
  const { proofData } = contract.circuits.signDocument(ctx, tokenId, viewerPk);
  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    CIRCUIT_KEY.signDocument,
  );
  return { txId };
}

// Re-export hex utilities for use by callers building sigHash or converting keys
export { hexToBytes, bytesToHex };
