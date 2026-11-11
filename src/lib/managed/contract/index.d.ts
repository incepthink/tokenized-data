import type * as __compactRuntime from '@midnight-ntwrk/compact-runtime';

export type Witnesses<PS> = {
  secretKey(context: __compactRuntime.WitnessContext<Ledger, PS>): [PS, Uint8Array];
}

export type ImpureCircuits<PS> = {
  createCollection(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  mintDocument(context: __compactRuntime.CircuitContext<PS>,
               inputDocHash_0: Uint8Array,
               inputMetaHash_0: Uint8Array,
               inputOwnerPk_0: Uint8Array,
               inputCollectionId_0: bigint): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  grantAccess(context: __compactRuntime.CircuitContext<PS>,
              tokenId_0: bigint,
              viewerPubKey_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  revokeAccess(context: __compactRuntime.CircuitContext<PS>,
               tokenId_0: bigint,
               viewerPubKey_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  signDocument(context: __compactRuntime.CircuitContext<PS>,
               tokenId_0: bigint,
               sigHash_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type ProvableCircuits<PS> = {
  createCollection(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  mintDocument(context: __compactRuntime.CircuitContext<PS>,
               inputDocHash_0: Uint8Array,
               inputMetaHash_0: Uint8Array,
               inputOwnerPk_0: Uint8Array,
               inputCollectionId_0: bigint): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  grantAccess(context: __compactRuntime.CircuitContext<PS>,
              tokenId_0: bigint,
              viewerPubKey_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  revokeAccess(context: __compactRuntime.CircuitContext<PS>,
               tokenId_0: bigint,
               viewerPubKey_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  signDocument(context: __compactRuntime.CircuitContext<PS>,
               tokenId_0: bigint,
               sigHash_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type PureCircuits = {
  derivePk(sk_0: Uint8Array): Uint8Array;
  accessKey(tokenId_0: bigint, viewerPk_0: Uint8Array): Uint8Array;
}

export type Circuits<PS> = {
  derivePk(context: __compactRuntime.CircuitContext<PS>, sk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  accessKey(context: __compactRuntime.CircuitContext<PS>,
            tokenId_0: bigint,
            viewerPk_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, Uint8Array>>;
  createCollection(context: __compactRuntime.CircuitContext<PS>): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  mintDocument(context: __compactRuntime.CircuitContext<PS>,
               inputDocHash_0: Uint8Array,
               inputMetaHash_0: Uint8Array,
               inputOwnerPk_0: Uint8Array,
               inputCollectionId_0: bigint): Promise<__compactRuntime.CircuitResults<PS, bigint>>;
  grantAccess(context: __compactRuntime.CircuitContext<PS>,
              tokenId_0: bigint,
              viewerPubKey_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  revokeAccess(context: __compactRuntime.CircuitContext<PS>,
               tokenId_0: bigint,
               viewerPubKey_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
  signDocument(context: __compactRuntime.CircuitContext<PS>,
               tokenId_0: bigint,
               sigHash_0: Uint8Array): Promise<__compactRuntime.CircuitResults<PS, []>>;
}

export type Ledger = {
  readonly tokenCounter: bigint;
  readonly collectionCounter: bigint;
  docHash: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  metadataHash: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  ownerPk: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  creatorPk: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  docCollection: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): bigint;
    [Symbol.iterator](): Iterator<[bigint, bigint]>
  };
  collectionOwner: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: bigint): boolean;
    lookup(key_0: bigint): Uint8Array;
    [Symbol.iterator](): Iterator<[bigint, Uint8Array]>
  };
  accessGrants: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): boolean;
    [Symbol.iterator](): Iterator<[Uint8Array, boolean]>
  };
  accessLogs: {
    isEmpty(): boolean;
    size(): bigint;
    member(key_0: Uint8Array): boolean;
    lookup(key_0: Uint8Array): Uint8Array;
    [Symbol.iterator](): Iterator<[Uint8Array, Uint8Array]>
  };
}

export declare class Contract<PS = any, W extends Witnesses<PS> = Witnesses<PS>> {
  witnesses: W;
  circuits: Circuits<PS>;
  impureCircuits: ImpureCircuits<PS>;
  provableCircuits: ProvableCircuits<PS>;
  constructor(witnesses: W);
  initialState(context: __compactRuntime.ConstructorContext<PS>): Promise<__compactRuntime.ConstructorResult<PS>>;
}

export declare function ledger(state: __compactRuntime.StateValue | __compactRuntime.ChargedState): Ledger;
export declare const pureCircuits: PureCircuits;
export declare const expectedVk: Record<string, string>;
export declare const circuitSignatures: __compactRuntime.CircuitSignatures;
export declare const declaredInterfaces: __compactRuntime.DeclaredInterfaces;
