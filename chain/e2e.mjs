// Headless deploy + end-to-end check of document_vault on a public Midnight network.
//
//   NETWORK=preview|preprod   (default preview; preprod needs BLOCKFROST_PROJECT_ID)
//   SEED_FILE=path            wallet seed is created there on first run and reused
//   VAULT_ADDRESS=hex         reuse a deployed contract instead of deploying
//   PROOF_SERVER_PORT=6300    a proof server 9.x must be listening locally
//
// The wallet needs tNIGHT. On the first run the script prints the address to fund
// from the faucet and exits with code 2; run it again once the faucet has paid.
import { randomBytes, createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pino from 'pino';

import { CompiledContract } from '@midnight-ntwrk/compact-js';
import { ContractState } from '@midnight-ntwrk/compact-runtime';
import { deployContract, findDeployedContract } from '@midnight-ntwrk/midnight-js/contracts';
import {
  MidnightWalletProvider,
  PreviewTestEnvironment,
  PreprodTestEnvironment,
  StaticProofServerContainer,
  initializeMidnightProviders,
} from '@midnight-ntwrk/testkit-js';

import * as Vault from './managed/contract/index.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const NETWORK = process.env.NETWORK ?? 'preview';
const SEED_FILE = process.env.SEED_FILE ?? path.join(here, '.seed');
const PORT = Number(process.env.PROOF_SERVER_PORT ?? 6300);
const logger = pino({ level: process.env.LOG_LEVEL ?? 'warn' });
const say = (...a) => console.log('[nexvault]', ...a);
const hex = (b) => Buffer.from(b).toString('hex');
const sha = (s) => new Uint8Array(createHash('sha256').update(s).digest());

// One wallet pays for everything; the three NexVault identities are separate vault keys.
const secrets = { creator: sha('e2e creator ' + Date.now()), owner: randomBytes(32), viewer: randomBytes(32) };
let acting = 'creator';
const witnesses = { secretKey: ({ privateState }) => [privateState, new Uint8Array(secrets[acting])] };
const pk = (role) => Vault.pureCircuits.derivePk(new Uint8Array(secrets[role]));

const compiled = CompiledContract.make('document_vault', Vault.Contract).pipe(
  CompiledContract.withWitnesses(witnesses),
  CompiledContract.withCompiledFileAssets(path.join(here, 'managed')),
);

const seed = existsSync(SEED_FILE) ? readFileSync(SEED_FILE, 'utf8').trim() : hex(randomBytes(32));
if (!existsSync(SEED_FILE)) writeFileSync(SEED_FILE, seed, { mode: 0o600 });

const env = NETWORK === 'preprod' ? new PreprodTestEnvironment(logger) : new PreviewTestEnvironment(logger);
const config = await env.start(new StaticProofServerContainer(PORT));
say('network', config.networkId, 'indexer', config.indexer.replace(/project_id=[^&]+/, 'project_id=…'));

const wallet = await MidnightWalletProvider.build(logger, config, seed);
say('fund this address with tNIGHT if empty:', wallet.unshieldedKeystore.getBech32Address().asString());
await wallet.start(true);
const state = await new Promise((resolve) => {
  const sub = wallet.wallet.state().subscribe((s) => { if (s.isSynced) { sub.unsubscribe(); resolve(s); } });
});
const night = Object.values(state.unshielded.balances).reduce((a, b) => a + b, 0n);
const dust = state.dust.balance(new Date());
say('NIGHT', night.toString(), 'DUST', dust.toString());
if (night === 0n) { say('NO FUNDS: use the faucet for the address above, then run again.'); await wallet.stop(); process.exit(2); }
if (dust === 0n) { say('NO DUST YET: registration was submitted; wait a few minutes and run again.'); await wallet.stop(); process.exit(3); }

const providers = initializeMidnightProviders(wallet, config, {
  privateStateStoreName: 'nexvault-e2e',
  zkConfigPath: path.join(here, 'managed'),
});

let vault;
let address = process.env.VAULT_ADDRESS;
if (address) {
  vault = await findDeployedContract(providers, { compiledContract: compiled, contractAddress: address });
  say('joined contract', address);
} else {
  const t = Date.now();
  vault = await deployContract(providers, { compiledContract: compiled });
  address = vault.deployTxData.public.contractAddress;
  say('DEPLOYED', address, 'tx', vault.deployTxData.public.txHash ?? vault.deployTxData.public.txId, `${Date.now() - t}ms`);
}

const ledger = async () => {
  const read = await providers.publicDataProvider.queryContractState(address);
  const cs = read.contractState?.deserialize ? read.contractState.deserialize({ v9: ContractState }) : read;
  return Vault.ledger(cs.data);
};
const step = async (role, name, ...args) => {
  acting = role;
  const t = Date.now();
  const r = await vault.callTx[name](...args);
  say(`${name} as ${role}: tx ${r.public.txHash ?? r.public.txId} block ${r.public.blockHeight} ${Date.now() - t}ms`);
  return r.private.result;
};
const mustFail = async (label, fn) => {
  try { await fn(); } catch (e) { say(`${label}: rejected as expected (${String(e.message ?? e).slice(0, 90)})`); return; }
  throw new Error(`${label}: expected a rejection`);
};
const check = (cond, label) => { if (!cond) throw new Error('CHECK FAILED: ' + label); say('ok:', label); };

const colId = await step('creator', 'createCollection');
const tokenId = await step('creator', 'mintDocument', sha('file bytes'), sha('title|category|description'), pk('owner'), colId);
let l = await ledger();
check(hex(l.ownerPk.lookup(tokenId)) === hex(pk('owner')), 'document owner recorded on chain');
check(hex(l.creatorPk.lookup(tokenId)) === hex(pk('creator')), 'document creator recorded on chain');

await mustFail('mint into the collection by a non-creator', () => step('viewer', 'mintDocument', sha('x'), sha('y'), pk('viewer'), colId));
await mustFail('grant by a non-owner', () => step('creator', 'grantAccess', tokenId, pk('viewer')));
await mustFail('sign before access is granted', () => step('viewer', 'signDocument', tokenId, sha('sig0')));

await step('owner', 'grantAccess', tokenId, pk('viewer'));
const key = Vault.pureCircuits.accessKey(tokenId, pk('viewer'));
l = await ledger();
check(l.accessGrants.member(key) && l.accessGrants.lookup(key) === true, 'viewer access granted on chain');

const sig = sha('viewer signature ' + Date.now());
await step('viewer', 'signDocument', tokenId, sig);
l = await ledger();
check(hex(l.accessLogs.lookup(key)) === hex(sig), 'viewer signature logged on chain');

await step('owner', 'revokeAccess', tokenId, pk('viewer'));
l = await ledger();
check(l.accessGrants.lookup(key) === false, 'viewer access revoked on chain');
await mustFail('sign after revoke', () => step('viewer', 'signDocument', tokenId, sha('sig2')));

say('ALL CHECKS PASSED', JSON.stringify({ network: config.networkId, contractAddress: address, collectionId: String(colId), tokenId: String(tokenId) }));
await wallet.stop();
process.exit(0);
