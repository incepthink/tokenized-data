// NexVault identity.
//
// Each account has a 32-byte vault secret key. It is derived in the browser
// from the account's email and password (PBKDF2-SHA256) and is never sent to
// the backend or the chain. The public half, derivePk(secret) as defined in
// contracts/document_vault.compact, is the account's "vault id" and is what
// the contract stores for creators, owners and viewers.

const STORAGE_KEY = "nexvault.vaultSecret";
const VAULT_ID_PREFIX = "nxv1";
const PBKDF2_ITERATIONS = 210_000;

export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export function hexToBytes(hex: string): Uint8Array {
  const clean = hex.startsWith("0x") ? hex.slice(2) : hex;
  if (clean.length % 2 !== 0 || /[^0-9a-f]/i.test(clean)) {
    throw new Error("Invalid hex string");
  }
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export async function sha256(data: Uint8Array): Promise<Uint8Array> {
  return new Uint8Array(await crypto.subtle.digest("SHA-256", data));
}

/** Derives the vault secret key from the account credentials. */
export async function deriveVaultSecret(email: string, password: string): Promise<Uint8Array> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: "PBKDF2",
      hash: "SHA-256",
      salt: enc.encode(`nexvault:vault-secret:v1:${email.trim().toLowerCase()}`),
      iterations: PBKDF2_ITERATIONS,
    },
    material,
    256,
  );
  return new Uint8Array(bits);
}

/** Public key for a vault secret, computed with the contract's own derivePk circuit. */
export async function vaultPkFromSecret(secret: Uint8Array): Promise<Uint8Array> {
  const { pureCircuits } = await import("@/lib/managed/contract/index.js");
  return pureCircuits.derivePk(secret);
}

export const vaultIdFromPk = (pk: Uint8Array): string => VAULT_ID_PREFIX + bytesToHex(pk);

export const isVaultId = (value: string | null | undefined): boolean =>
  !!value && new RegExp(`^${VAULT_ID_PREFIX}[0-9a-f]{64}$`).test(value.trim());

export function pkFromVaultId(vaultId: string): Uint8Array {
  if (!isVaultId(vaultId)) {
    throw new Error("Not a NexVault ID. This account predates on-chain identities.");
  }
  return hexToBytes(vaultId.trim().slice(VAULT_ID_PREFIX.length));
}

export function storeVaultSecret(secret: Uint8Array): void {
  localStorage.setItem(STORAGE_KEY, bytesToHex(secret));
}

export function loadVaultSecret(): Uint8Array | null {
  const hex = localStorage.getItem(STORAGE_KEY);
  if (!hex) return null;
  try {
    const bytes = hexToBytes(hex);
    return bytes.length === 32 ? bytes : null;
  } catch {
    return null;
  }
}

export function clearVaultSecret(): void {
  localStorage.removeItem(STORAGE_KEY);
}
