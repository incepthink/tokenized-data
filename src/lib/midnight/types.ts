// Midnight Wallet — TypeScript type definitions
// 1AM docs: https://1am.xyz/developers
// Lace docs: https://docs.midnight.network/sdks/community/build-using-meshsdk/lace-wallet
// Both wallets inject themselves at window.midnight; no npm package required for basic wallet connect.

// ─── 1AM Wallet ───────────────────────────────────────────────────────────────

export interface MidnightWalletAPI {
  connect(network: 'preview' | 'preprod' | 'mainnet'): Promise<MidnightConnectedAPI>;
}

export interface MidnightConnectedAPI {
  /** Identifies which wallet produced this API; used to branch transaction logic in contractApi.ts */
  walletType?: 'oneam' | 'lace';
  getConfiguration(): Promise<MidnightConfig>;
  getShieldedAddresses(): Promise<{ shieldedAddress: string; shieldedCoinPublicKey?: string; shieldedEncryptionPublicKey?: string }>;
  getUnshieldedAddress(): Promise<{ unshieldedAddress: string }>;
  getDustAddress(): Promise<{ dustAddress: string }>;
  getShieldedBalances(): Promise<Record<string, bigint>>;
  getProvingProvider(keyMaterialProvider?: import('@midnight-ntwrk/dapp-connector-api').KeyMaterialProvider): Promise<ProvingProvider>;
  balanceUnsealedTransaction(tx: UnbalancedTransaction, options?: { payFees?: boolean }): Promise<{ tx: string }>;
  submitTransaction(tx: BalancedTransaction): Promise<string>; // returns txId
}

export interface MidnightConfig {
  networkId: string;
  indexerUri: string;
  indexerWsUri: string;
  proverServerUri: string;
  substrateNodeUri: string;
}

export type MidnightNetwork = 'preview' | 'preprod' | 'mainnet';

export type ProvingProvider = any;       // from @midnight-ntwrk/dapp-connector-api
export type UnbalancedTransaction = any;
export type BalancedTransaction = any;

// ─── Lace Wallet ──────────────────────────────────────────────────────────────

/** Outer Lace wallet object available at window.midnight.mnLace */
export interface LaceWalletObject {
  connect(network: MidnightNetwork): Promise<LaceConnectedAPI>;
}

/**
 * Connected Lace wallet API returned by wallet.connect(network).
 * Lace implements the standard @midnight-ntwrk/dapp-connector-api ConnectedAPI —
 * same prove-then-balance flow as the 1AM wallet.
 */
export interface LaceConnectedAPI {
  getConfiguration(): Promise<MidnightConfig>;
  getShieldedAddresses(): Promise<{ shieldedAddress: string; shieldedCoinPublicKey: string; shieldedEncryptionPublicKey: string }>;
  getUnshieldedAddress(): Promise<{ unshieldedAddress: string }>;
  balanceUnsealedTransaction(tx: string, options?: { payFees?: boolean }): Promise<{ tx: string }>;
  getProvingProvider(keyMaterialProvider: import('@midnight-ntwrk/dapp-connector-api').KeyMaterialProvider): Promise<ProvingProvider>;
  submitTransaction(tx: string): Promise<string>;
}
