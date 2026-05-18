// Midnight Document Vault — on-chain contract API
// Wraps the 5 compiled circuits for client-side ZK transaction submission via the 1AM wallet.

import {
  createCircuitContext,
  ContractState,
} from "@midnight-ntwrk/compact-runtime";
import type { ProofData } from "@midnight-ntwrk/compact-runtime";
import { httpClientProvingProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import {
  Intent,
  ContractCallPrototype,
  communicationCommitmentRandomness,
  CostModel,
  Transaction,
  ContractState as LedgerContractState,
} from "@midnight-ntwrk/ledger-v8";
import type { RunningCost } from "@midnight-ntwrk/ledger-v8";
import {
  setNetworkId,
  getNetworkId,
} from "@midnight-ntwrk/midnight-js-network-id";
import { ttlOneHour } from "@midnight-ntwrk/midnight-js-utils";
import {
  ZKConfigProvider,
  createZKIR,
  createProverKey,
  createVerifierKey,
  asContractAddress,
} from "@midnight-ntwrk/midnight-js-types";
import { bech32m } from "@scure/base";

import { Contract } from "@/lib/managed/contract";
import type {
  MidnightConnectedAPI,
  MidnightNetwork,
} from "./types";

// ZK artifact URL imports — Vite serves these as hashed static assets
import createCollectionZkir from "@/lib/managed/zkir/createCollection.bzkir?url";
import mintDocumentZkir from "@/lib/managed/zkir/mintDocument.bzkir?url";
import grantAccessZkir from "@/lib/managed/zkir/grantAccess.bzkir?url";
import revokeAccessZkir from "@/lib/managed/zkir/revokeAccess.bzkir?url";
import signDocumentZkir from "@/lib/managed/zkir/signDocument.bzkir?url";

import createCollectionProver from "@/lib/managed/keys/createCollection.prover?url";
import mintDocumentProver from "@/lib/managed/keys/mintDocument.prover?url";
import grantAccessProver from "@/lib/managed/keys/grantAccess.prover?url";
import revokeAccessProver from "@/lib/managed/keys/revokeAccess.prover?url";
import signDocumentProver from "@/lib/managed/keys/signDocument.prover?url";

import createCollectionVerifier from "@/lib/managed/keys/createCollection.verifier?url";
import mintDocumentVerifier from "@/lib/managed/keys/mintDocument.verifier?url";
import grantAccessVerifier from "@/lib/managed/keys/grantAccess.verifier?url";
import revokeAccessVerifier from "@/lib/managed/keys/revokeAccess.verifier?url";
import signDocumentVerifier from "@/lib/managed/keys/signDocument.verifier?url";

// ─── ZK artifact URL maps (Vite ?url → hashed static asset paths) ────────────

const ZKIR_URLS: Record<string, string> = {
  createCollection: createCollectionZkir,
  mintDocument: mintDocumentZkir,
  grantAccess: grantAccessZkir,
  revokeAccess: revokeAccessZkir,
  signDocument: signDocumentZkir,
};
const PROVER_URLS: Record<string, string> = {
  createCollection: createCollectionProver,
  mintDocument: mintDocumentProver,
  grantAccess: grantAccessProver,
  revokeAccess: revokeAccessProver,
  signDocument: signDocumentProver,
};
const VERIFIER_URLS: Record<string, string> = {
  createCollection: createCollectionVerifier,
  mintDocument: mintDocumentVerifier,
  grantAccess: grantAccessVerifier,
  revokeAccess: revokeAccessVerifier,
  signDocument: signDocumentVerifier,
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
 * Builds a ZKConfigProvider backed by the locally bundled ZK artifacts.
 * Files are imported via Vite ?url and served as hashed static assets.
 * The concrete subclass satisfies httpClientProvingProvider's ZKConfigProvider<K>
 * parameter — the base class provides get(), getVerifierKeys(), asKeyMaterialProvider().
 */
function buildZKConfigProvider(): ZKConfigProvider<string> {
  const fetchBin = async (url: string): Promise<Uint8Array> => {
    const res = await fetch(url);
    if (!res.ok)
      throw new Error(`Failed to fetch key material: ${url} (${res.status})`);
    return new Uint8Array(await res.arrayBuffer());
  };
  return new (class extends ZKConfigProvider<string> {
    getZKIR(loc: string) {
      const url = ZKIR_URLS[loc];
      if (!url) throw new Error(`No ZKIR for circuit: ${loc}`);
      return fetchBin(url).then(createZKIR);
    }
    getProverKey(loc: string) {
      const url = PROVER_URLS[loc];
      if (!url) throw new Error(`No prover key for circuit: ${loc}`);
      return fetchBin(url).then(createProverKey);
    }
    getVerifierKey(loc: string) {
      const url = VERIFIER_URLS[loc];
      if (!url) throw new Error(`No verifier key for circuit: ${loc}`);
      return fetchBin(url).then(createVerifierKey);
    }
  })();
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
 * Proves a circuit, assembles the proof into a proper Midnight transaction,
 * balances it via the wallet, submits it, and returns a deterministic txHash.
 *
 * Root cause of old bug: httpClientProvingProvider.prove() returns a raw proof
 * blob (midnight:proof-versioned:...), NOT a transaction.  Passing that blob
 * directly to balanceUnsealedTransaction() caused a deserialization error because
 * the wallet expects a Transaction<SignatureEnabled,Proof,PreBinding>.
 *
 * Fix: build an UnprovenTransaction from the circuit data, call .prove() on it
 * (which internally calls the proof server AND embeds the proof into the tx),
 * then serialize the resulting UnboundTransaction before handing it to Lace.
 */
async function proveBalanceSubmit(
  connectedAPI: MidnightConnectedAPI,
  proofData: ProofData,
  gasCost: RunningCost,
  circuitKeyLocation: string,
): Promise<string> {
  console.log(
    "[proveBalanceSubmit] starting — circuitKeyLocation:",
    circuitKeyLocation,
  );
  try {
    const config = await connectedAPI.getConfiguration();
    const proverServerUri = "http://localhost:6300";
    console.log("[proveBalanceSubmit] proverServerUri:", proverServerUri);

    // Build the circuit-level proving provider pointed at the local proof server.
    // httpClientProvingProvider.prove(preimage, key) → raw proof bytes.
    // We do NOT call .prove() directly here; instead we let Transaction.prove()
    // call it internally so it can embed the proof into the transaction structure.
    const zkConfigProvider = buildZKConfigProvider();
    const provingProvider = httpClientProvingProvider(
      proverServerUri,
      zkConfigProvider,
    );

    // ── Step 1: fetch on-chain contract state and extract the ContractOperation ──
    // The ContractOperation is needed by ContractCallPrototype to verify the
    // circuit entry point against the deployed contract state.
    const compactContractState = await fetchContractState(config.indexerUri);
    const ledgerContractState = LedgerContractState.deserialize(
      compactContractState.serialize(),
    );
    const operation = ledgerContractState.operation(circuitKeyLocation);
    if (!operation) {
      throw new Error(
        `[proveBalanceSubmit] no operation for circuit: ${circuitKeyLocation}`,
      );
    }
    console.log(
      "[proveBalanceSubmit] ContractOperation retrieved for:",
      circuitKeyLocation,
    );

    // ── Step 2: build the Transcript ──────────────────────────────────────────
    // document_vault.compact has no fallible {} blocks → entire publicTranscript
    // is guaranteed.  It also has no coin operations (no shielded inputs/outputs,
    // no nullifiers, no cross-contract calls, no token mints) → Effects is empty.
    const emptyEffects = {
      claimedNullifiers: [],
      claimedShieldedReceives: [],
      claimedShieldedSpends: [],
      claimedContractCalls: [],
      shieldedMints: new Map(),
      unshieldedMints: new Map(),
      unshieldedInputs: new Map(),
      unshieldedOutputs: new Map(),
      claimedUnshieldedSpends: new Map(),
    };
    const guaranteedTranscript = {
      gas: gasCost,
      effects: emptyEffects,
      program: proofData.publicTranscript,
    };
    console.log(
      "[proveBalanceSubmit] transcript program ops:",
      guaranteedTranscript.program.length,
    );

    // ── Step 3: build ContractCallPrototype ───────────────────────────────────
    const contractCallProto = new ContractCallPrototype(
      asContractAddress(CONTRACT_ADDRESS),
      circuitKeyLocation,
      operation,
      guaranteedTranscript as any, // Transcript<AlignedValue>
      undefined, // no fallible transcript
      proofData.privateTranscriptOutputs as any[],
      proofData.input as any,
      proofData.output as any,
      communicationCommitmentRandomness(),
      circuitKeyLocation,
    );

    // ── Step 4: build UnprovenTransaction ────────────────────────────────────
    // document_vault.compact has no shielded coin operations, so the ZswapOffer
    // (guaranteed/fallible coin offer) is undefined.
    setNetworkId(CONTRACT_NETWORK);
    const intent = Intent.new(ttlOneHour()).addCall(contractCallProto);
    const unprovenTx = Transaction.fromPartsRandomized(
      getNetworkId(),
      undefined, // no guaranteed coin offer
      undefined, // no fallible coin offer
      intent as any,
    );
    console.log(
      "[proveBalanceSubmit] UnprovenTransaction built, object type:",
      Object.prototype.toString.call(unprovenTx),
    );

    // ── Step 5: prove ─────────────────────────────────────────────────────────
    // Transaction.prove() calls provingProvider.prove(preimage, key) internally,
    // gets the raw proof bytes from the local proof server, and embeds them into
    // the transaction — returning Transaction<SignatureEnabled,Proof,PreBinding>.
    const costModel = CostModel.initialCostModel();
    const unboundTx = await unprovenTx.prove(provingProvider, costModel);

    // Transaction.toString() returns Rust Debug format "StandardTransaction { ... }" — NOT wire format.
    // Wire format lives in serialize(): ASCII header bytes + binary payload bytes.
    // Encoding: base64(binaryPayload) appended to the ASCII header gives the string
    // that balanceUnsealedTransaction() expects: midnight:transaction[v9](...):base64data
    const rawBytes = unboundTx.serialize();

    // Debug: confirm we have the right object and methods
    const proto = Object.getPrototypeOf(unboundTx);
    console.log(
      "[proveBalanceSubmit] unboundTx constructor:",
      unboundTx?.constructor?.name,
    );
    console.log(
      "[proveBalanceSubmit] methods on proto:",
      Object.getOwnPropertyNames(proto).filter(
        (n) => typeof (unboundTx as any)[n] === "function",
      ),
    );
    console.log(
      "[proveBalanceSubmit] has serialize():",
      typeof (unboundTx as any).serialize === "function",
    );
    console.log(
      "[proveBalanceSubmit] toString() prefix (40):",
      unboundTx.toString().slice(0, 40),
    );
    console.log(
      "[proveBalanceSubmit] serialize() byte length:",
      rawBytes.length,
    );

    // Serialize as pure hex — the wallet decodes hex → bytes → Transaction.deserialize() internally.
    // The reference (midnight-agent-did-manager/lib/providers.ts) uses toHex(tx.serialize()).
    // The previous custom base64 format was not hex, so the wallet decoded it to all-zero bytes
    // and the ASCII header was empty → "got: ''".
    const serializedHex = bytesToHex(rawBytes);
    console.log("[proveBalanceSubmit] serializedHex length:", serializedHex.length);
    console.log("[proveBalanceSubmit] serializedHex prefix (40):", serializedHex.slice(0, 40));

    // ── Step 6: balance ───────────────────────────────────────────────────────
    // payFees: true is required — the wallet will add fee coins to cover gas.
    const balanceResult = await (connectedAPI as any).balanceUnsealedTransaction(
      serializedHex,
      { payFees: true },
    );
    console.log(
      "[proveBalanceSubmit] balanceResult type:", typeof balanceResult,
      "has .tx:", 'tx' in Object(balanceResult),
    );

    // Wallet returns { tx: hexString }; support direct string return as fallback.
    const balancedHex: string = typeof balanceResult === 'string'
      ? balanceResult
      : (balanceResult as any).tx;
    console.log("[proveBalanceSubmit] balancedHex length:", balancedHex?.length);

    // ── Step 7: deserialize balanced tx to extract the on-chain identifier ────
    const balancedTx = Transaction.deserialize(
      "signature" as any,
      "proof" as any,
      "binding" as any,
      hexToBytes(balancedHex),
    );
    console.log(
      "[proveBalanceSubmit] balancedTx constructor:", balancedTx?.constructor?.name,
    );

    // ── Step 8: submit ────────────────────────────────────────────────────────
    await (connectedAPI as any).submitTransaction(bytesToHex(balancedTx.serialize()));
    console.log("[proveBalanceSubmit] submitTransaction() complete");

    const [txId] = (balancedTx as any).identifiers();
    console.log("[proveBalanceSubmit] done, txId:", String(txId));
    return String(txId ?? balancedHex.slice(0, 64));
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
  const { result, proofData, gasCost } = contract.circuits.createCollection(
    ctx,
    creatorPk,
  );
  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    gasCost,
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

  const { result, proofData, gasCost } = contract.circuits.mintDocument(
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
    gasCost,
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
  const { proofData, gasCost } = contract.circuits.grantAccess(
    ctx,
    tokenId,
    viewerPk,
  );
  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    gasCost,
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
  const { proofData, gasCost } = contract.circuits.revokeAccess(
    ctx,
    tokenId,
    viewerPk,
  );
  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    gasCost,
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
  const { proofData, gasCost } = contract.circuits.signDocument(
    ctx,
    tokenId,
    viewerPk,
  );
  const txId = await proveBalanceSubmit(
    connectedAPI,
    proofData,
    gasCost,
    CIRCUIT_KEY.signDocument,
  );
  return { txId };
}

// Re-export hex utilities for use by callers building sigHash or converting keys
export { hexToBytes, bytesToHex };
