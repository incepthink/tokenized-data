// NexVault on Midnight: every state change in the app goes through one of the
// five circuits of contracts/document_vault.compact, proven in zero knowledge
// and submitted through the user's Midnight wallet.

import { CompiledContract } from "@midnight-ntwrk/compact-js";
import { ContractState } from "@midnight-ntwrk/compact-runtime";
import {
  deployContract,
  findDeployedContract,
} from "@midnight-ntwrk/midnight-js/contracts";
import type { MidnightProviders } from "@midnight-ntwrk/midnight-js/types";
import {
  dappConnectorNetwork,
  dappConnectorProofProvider,
  dappConnectorWalletProviders,
} from "@midnight-ntwrk/midnight-js-dapp-connector-proof-provider";
import { FetchZkConfigProvider } from "@midnight-ntwrk/midnight-js-fetch-zk-config-provider";
import { httpClientProofProvider } from "@midnight-ntwrk/midnight-js-http-client-proof-provider";
import { indexerPublicDataProvider } from "@midnight-ntwrk/midnight-js-indexer-public-data-provider";
import { levelPrivateStateProvider } from "@midnight-ntwrk/midnight-js-level-private-state-provider";
import { CostModel } from "@midnightntwrk/ledger-v9";

import * as Vault from "@/lib/managed/contract/index.js";
import {
  CONTRACT_ADDRESS,
  FALLBACK_PROOF_SERVER,
  MIDNIGHT_NETWORK,
} from "./config";
import { loadVaultSecret } from "./identity";
import { walletCanProve, type ConnectedAPI } from "./wallet";

const CONTRACT_NAME = "document_vault";
const TRANSACTION_TTL_SECONDS = 3600;

type VaultContract = Vault.Contract<undefined>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProviders = MidnightProviders<any>;

/** Thrown for problems the user can fix; the message is shown as-is. */
export class VaultError extends Error {}

// ─── Witness: the vault secret key ───────────────────────────────────────────
// Runs only in this browser while a proof is being built. The key is read from
// local storage at call time and is never part of a transaction.
const witnesses: Vault.Witnesses<undefined> = {
  secretKey: ({ privateState }) => {
    const secret = loadVaultSecret();
    if (!secret) {
      throw new VaultError("Your vault key is not loaded. Log out and log in again.");
    }
    return [privateState, secret];
  },
};

const compiledVault = CompiledContract.make<VaultContract>(CONTRACT_NAME, Vault.Contract).pipe(
  CompiledContract.withWitnesses(witnesses as never),
  CompiledContract.withCompiledFileAssets(`./contract/${CONTRACT_NAME}`),
);

// ─── Providers ───────────────────────────────────────────────────────────────

interface ProviderBundle {
  providers: AnyProviders;
  networkId: string;
  dispose: () => Promise<void>;
}

async function buildProviders(api: ConnectedAPI): Promise<ProviderBundle> {
  const zkBase = new URL(
    `${import.meta.env.BASE_URL}contract/${CONTRACT_NAME}`,
    window.location.origin,
  ).toString();
  const zkConfigProvider = new FetchZkConfigProvider<string>(zkBase, {
    fetchFunc: fetch.bind(window),
  });

  const network = await dappConnectorNetwork(api);
  if (network.networkId.toLowerCase() !== MIDNIGHT_NETWORK.toLowerCase()) {
    throw new VaultError(
      `Your wallet is on "${network.networkId}". Switch it to "${MIDNIGHT_NETWORK}" and reconnect.`,
    );
  }
  const publicDataProvider = indexerPublicDataProvider(network.indexer);

  try {
    // 1AM proves inside the wallet (hosted prover). Lace cannot, so for Lace the
    // proof comes from a proof server the user runs next to their wallet.
    const proofProvider = walletCanProve(api)
      ? await dappConnectorProofProvider(api, zkConfigProvider, CostModel.initialCostModel())
      : httpClientProofProvider(FALLBACK_PROOF_SERVER, zkConfigProvider);

    const { walletProvider, midnightProvider } = await dappConnectorWalletProviders(api);
    const { shieldedAddress } = await api.getShieldedAddresses();

    const privateStateProvider = levelPrivateStateProvider({
      // Nothing secret is kept in this store: the contract has no private state
      // and the vault key lives outside it. It only satisfies the provider set.
      privateStoragePasswordProvider: () => "NexVault-local-store-password-v1!",
      accountId: shieldedAddress,
    });

    return {
      providers: {
        config: { networkId: network.networkId, ttlSeconds: TRANSACTION_TTL_SECONDS },
        privateStateProvider,
        publicDataProvider,
        zkConfigProvider,
        proofProvider,
        walletProvider,
        midnightProvider,
      } as AnyProviders,
      networkId: network.networkId,
      dispose: () => publicDataProvider.dispose(),
    };
  } catch (error) {
    await publicDataProvider.dispose().catch(() => undefined);
    throw error;
  }
}

// ─── Session: one joined contract per connected wallet ───────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Joined = { callTx: Record<string, (...args: any[]) => Promise<any>> };

interface Session {
  api: ConnectedAPI;
  bundle: ProviderBundle;
  joined: Joined;
}

let sessionPromise: Promise<Session> | null = null;
let sessionApi: ConnectedAPI | null = null;

export async function closeVaultSession(): Promise<void> {
  const pending = sessionPromise;
  sessionPromise = null;
  sessionApi = null;
  if (pending) {
    await pending.then((s) => s.bundle.dispose()).catch(() => undefined);
  }
}

async function getSession(api: ConnectedAPI): Promise<Session> {
  if (!CONTRACT_ADDRESS) {
    throw new VaultError("The NexVault contract address is not configured for this deployment.");
  }
  if (sessionPromise && sessionApi === api) return sessionPromise;
  await closeVaultSession();
  sessionApi = api;
  const created = (async () => {
    const bundle = await buildProviders(api);
    try {
      const joined = (await findDeployedContract(bundle.providers, {
        compiledContract: compiledVault as never,
        contractAddress: CONTRACT_ADDRESS,
      })) as unknown as Joined;
      return { api, bundle, joined };
    } catch (error) {
      await bundle.dispose().catch(() => undefined);
      throw error;
    }
  })();
  sessionPromise = created;
  created.catch(() => {
    if (sessionPromise === created) {
      sessionPromise = null;
      sessionApi = null;
    }
  });
  return created;
}

// ─── Errors ──────────────────────────────────────────────────────────────────

/** Turns SDK, wallet and contract failures into one readable sentence. */
export function describeVaultError(error: unknown): string {
  if (error instanceof VaultError) return error.message;
  const parts: string[] = [];
  let current: unknown = error;
  for (let depth = 0; current && depth < 6; depth++) {
    const e = current as { message?: unknown; reason?: unknown; cause?: unknown };
    if (typeof e.message === "string") parts.push(e.message);
    else if (typeof e.reason === "string") parts.push(e.reason);
    current = e.cause;
  }
  const text = parts.join(" | ") || String(error);
  const known: [RegExp, string][] = [
    [/Not the collection creator/i, "Only the creator of this collection can mint into it."],
    [/Collection does not exist/i, "This collection is not registered on Midnight."],
    [/Not the document owner/i, "Only the owner of this document can change who has access."],
    [/does not have access/i, "This account has not been granted access on Midnight."],
    [/access was revoked/i, "Access to this document was revoked on Midnight."],
    [/reject|denied|declin|cancel/i, "The request was rejected in the wallet."],
    [/insufficient|InsufficientFunds|dust/i, "The wallet has no DUST to pay the fee. Get tNIGHT from the faucet and wait for DUST to generate."],
    [/Failed to fetch|NetworkError|ECONNREFUSED|6300/i, "Could not reach the prover. With Lace, run a local proof server on port 6300; 1AM proves by itself."],
  ];
  for (const [pattern, message] of known) {
    if (pattern.test(text)) return message;
  }
  return text.length > 220 ? `${text.slice(0, 220)}…` : text;
}

// ─── Circuit calls ───────────────────────────────────────────────────────────

export interface TxReceipt {
  /** Transaction hash as recorded in the block. */
  txHash: string;
  txId: string;
  blockHeight: number | null;
}

interface CallResult<R> {
  public: { txId: string; txHash?: string; blockHeight?: number };
  private: { result: R };
}

function receipt(result: CallResult<unknown>): TxReceipt {
  return {
    txHash: result.public.txHash ?? result.public.txId,
    txId: result.public.txId,
    blockHeight: result.public.blockHeight ?? null,
  };
}

async function call<R>(api: ConnectedAPI, circuit: string, ...args: unknown[]): Promise<CallResult<R>> {
  const session = await getSession(api);
  return (await session.joined.callTx[circuit](...args)) as CallResult<R>;
}

export async function callCreateCollection(
  api: ConnectedAPI,
): Promise<TxReceipt & { onchainCollectionId: bigint }> {
  const result = await call<bigint>(api, "createCollection");
  return { ...receipt(result), onchainCollectionId: result.private.result };
}

export async function callMintDocument(
  api: ConnectedAPI,
  params: {
    docHash: Uint8Array;
    metaHash: Uint8Array;
    ownerPk: Uint8Array;
    onchainCollectionId: bigint;
  },
): Promise<TxReceipt & { onchainTokenId: bigint }> {
  const result = await call<bigint>(
    api,
    "mintDocument",
    params.docHash,
    params.metaHash,
    params.ownerPk,
    params.onchainCollectionId,
  );
  return { ...receipt(result), onchainTokenId: result.private.result };
}

export async function callGrantAccess(api: ConnectedAPI, tokenId: bigint, viewerPk: Uint8Array): Promise<TxReceipt> {
  return receipt(await call<[]>(api, "grantAccess", tokenId, viewerPk));
}

export async function callRevokeAccess(api: ConnectedAPI, tokenId: bigint, viewerPk: Uint8Array): Promise<TxReceipt> {
  return receipt(await call<[]>(api, "revokeAccess", tokenId, viewerPk));
}

export async function callSignDocument(api: ConnectedAPI, tokenId: bigint, sigHash: Uint8Array): Promise<TxReceipt> {
  return receipt(await call<[]>(api, "signDocument", tokenId, sigHash));
}

// ─── Reading the public ledger ───────────────────────────────────────────────

/** Current public state of the vault contract, read from the indexer. */
export async function readVaultLedger(api: ConnectedAPI): Promise<Vault.Ledger | null> {
  const session = await getSession(api);
  const read = await session.bundle.providers.publicDataProvider.queryContractState(CONTRACT_ADDRESS);
  if (!read) return null;
  const state = read.contractState.deserialize({ v9: ContractState } as never) as ContractState;
  return Vault.ledger(state.data);
}

/** Whether `viewerPk` currently holds access to `tokenId` according to the chain. */
export async function hasOnchainAccess(api: ConnectedAPI, tokenId: bigint, viewerPk: Uint8Array): Promise<boolean> {
  const ledger = await readVaultLedger(api);
  if (!ledger) return false;
  const key = Vault.pureCircuits.accessKey(tokenId, viewerPk);
  return ledger.accessGrants.member(key) && ledger.accessGrants.lookup(key);
}

// ─── Deployment (one-off, from the admin page) ───────────────────────────────

export async function deployVault(api: ConnectedAPI): Promise<{ contractAddress: string; txHash: string }> {
  const bundle = await buildProviders(api);
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const deployed: any = await deployContract(bundle.providers, {
      compiledContract: compiledVault as never,
    } as never);
    return {
      contractAddress: deployed.deployTxData.public.contractAddress,
      txHash: deployed.deployTxData.public.txHash ?? deployed.deployTxData.public.txId,
    };
  } finally {
    await bundle.dispose().catch(() => undefined);
  }
}
