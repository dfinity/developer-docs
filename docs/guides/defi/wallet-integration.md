---
title: "Wallet Integration"
description: "Integrate ICRC signer-standard wallets with your dapp using explicit per-action user approval."
sidebar:
  order: 4
---

Wallet integration on the Internet Computer uses a popup-based signer model where every meaningful action requires explicit user approval. The dapp opens a wallet popup, requests permission, and the wallet shows a human-readable consent message before executing each canister call.

This guide covers integration using `@icp-sdk/signer`, the signer library in the ICP JavaScript SDK.

## Authentication vs. wallet signing

Internet Identity and wallet signers serve different purposes:

| | Internet Identity | Wallet signer |
|---|---|---|
| **Purpose** | Authenticate a user (prove identity) | Approve and sign canister calls |
| **User sees** | Login prompt once | Consent message per action |
| **After approval** | Session delegation (sign-once, act-many) | Single call executed |
| **Use when** | Read data, frequent writes, session-based UX | Token transfers, approvals, high-value one-off actions |

Use Internet Identity for login. Use a wallet signer when your dapp needs users to explicitly approve individual transactions — token transfers, NFT operations, or any action where a per-operation confirmation dialog is appropriate.

## ICRC signer standards

The signer model is defined by a set of ICRC standards:

| Standard | What it covers |
|---|---|
| ICRC-21 | Canister call consent messages — human-readable summaries |
| ICRC-25 | Signer interaction standard — permission lifecycle |
| ICRC-27 | Accounts — requesting the user's principal |
| ICRC-29 | Window PostMessage transport — popup communication |
| ICRC-49 | Call canister — routing calls through the signer |

A compliant wallet (such as [OISY](https://oisy.com)) implements all five standards.

## How it works

The lifecycle of a wallet-initiated call:

1. Your dapp creates a `Signer` pointing to the wallet's signer URL
2. Call `getAccounts()` — the wallet popup opens and prompts the user to share their account
3. Construct a `SignerAgent` using the returned principal
4. Use the agent with any canister actor — the wallet intercepts every call, fetches an ICRC-21 consent message from the target canister, shows it to the user, and only executes if the user approves

The key insight: a `SignerAgent` is a drop-in replacement for `HttpAgent`. Code that creates actors with `HttpAgent` can switch to `SignerAgent` to add wallet approval to every call.

## Prerequisites

```bash
npm install @icp-sdk/signer @icp-sdk/core
```

To interact with token ledgers, also install:

```bash
npm install @icp-sdk/canisters
```

## Connect and request accounts

```javascript
import { Signer } from '@icp-sdk/signer';
import { PostMessageTransport } from '@icp-sdk/signer/web';

const signer = new Signer({
  transport: new PostMessageTransport({ url: 'https://oisy.com/sign' }),
});

// Opens the wallet popup. User approves account sharing.
// Returns an array of { owner: Principal, subaccount?: Uint8Array }
const accounts = await signer.getAccounts();
const principal = accounts[0].owner;
```

`getAccounts()` triggers the wallet's `icrc27_accounts` flow. The popup opens, the user approves, and you receive their principal.

## Create a SignerAgent

`SignerAgent` wraps a `Signer` and acts as a drop-in replacement for `HttpAgent`. Any canister actor built with it routes calls through the wallet for approval.

```javascript
import { SignerAgent } from '@icp-sdk/signer/agent';
import { HttpAgent } from '@icp-sdk/core/agent';

// Create a read-only agent for balance queries (no wallet needed)
const readAgent = await HttpAgent.create({ host: 'https://icp0.io' });

// Create a SignerAgent for wallet-approved calls
const signerAgent = await SignerAgent.create({
  signer,
  account: principal,      // principal from getAccounts()
  agent: readAgent,        // optional: share the HttpAgent for root key fetch
});
```

## Query balances (no wallet needed)

Read operations don't require wallet approval. Use a plain `HttpAgent` for queries:

```javascript
import { IcrcLedgerCanister } from '@icp-sdk/canisters/ledger/icrc';
import { Principal } from '@icp-sdk/core/principal';

const ledger = IcrcLedgerCanister.create({
  agent: readAgent,
  canisterId: Principal.fromText('mxzaz-hqaaa-aaaar-qaada-cai'), // ckBTC ledger
});

const balance = await ledger.balance({ owner: principal });
```

Separate read and write agents: use `readAgent` for queries, `signerAgent` for transfers.

## Perform a token transfer

Using the signer agent with `IcrcLedgerCanister` routes the transfer through the wallet. The wallet fetches the ICRC-21 consent message and presents it to the user before the call executes.

```javascript
const signedLedger = IcrcLedgerCanister.create({
  agent: signerAgent,
  canisterId: Principal.fromText('mxzaz-hqaaa-aaaar-qaada-cai'),
});

// The wallet popup opens, shows a consent message, user approves
const blockIndex = await signedLedger.transfer({
  to: { owner: recipientPrincipal, subaccount: [] },
  amount: 1_000_000n,   // in base units (e.g. 0.01 ckBTC = 1_000_000 e8s)
});
```

## Disconnect

Call `disconnect()` on the signer when the user logs out or closes the session:

```javascript
await signer.disconnect();
```

Disconnect closes the wallet popup and removes any cached session state.

## Session persistence

The signer session is tied to the browser tab. After a page reload, the user's principal is no longer available from the signer. To avoid opening the popup again immediately, store the principal in `sessionStorage` and restore it on mount — then re-establish the signer session lazily when the user initiates a transfer:

```javascript
const SESSION_KEY = 'wallet-principal';

// On connect: store principal
sessionStorage.setItem(SESSION_KEY, principal.toText());

// On mount: restore principal without opening popup
const stored = sessionStorage.getItem(SESSION_KEY);
if (stored) {
  const restoredPrincipal = Principal.fromText(stored);
  // Use restoredPrincipal for read-only queries
  // Only call getAccounts() again when user initiates a write
}

// On disconnect: clear storage
sessionStorage.removeItem(SESSION_KEY);
```

## Error handling

```javascript
import { SignerError } from '@icp-sdk/signer';

try {
  await signer.getAccounts();
} catch (err) {
  if (err instanceof SignerError) {
    // err.code: numeric error code from the ICRC-25 standard
    // err.message: human-readable description
    console.error('Signer error', err.code, err.message);
  }
}
```

Common error scenarios:
- User closes the wallet popup without approving
- Wallet is not reachable at the configured URL
- Call is rejected (user denies the consent message)

## Local development

For local development against a running local network:

```javascript
const signer = new Signer({
  transport: new PostMessageTransport({ url: 'http://localhost:5174/sign' }),
});

const readAgent = await HttpAgent.create({ host: 'http://localhost:8000' });
```

The `@dfinity/oisy-wallet-signer` repository includes a [pseudo wallet signer](https://github.com/dfinity/oisy-wallet-signer) you can run locally as a test signer. See its `demo/` directory for setup instructions.

On mainnet, omit `host` from `HttpAgent.create()` — it defaults to `https://icp0.io`.

## Working example

The [oisy-signer-demo](https://github.com/dfinity/examples/tree/master/hosting/oisy-signer-demo) example shows a complete dapp that:

1. Connects to OISY and fetches the user's accounts
2. Queries ICRC-1 token balances using a read-only agent
3. Performs self-transfers using the signer agent

To run locally:

```bash
icp network start -d
cd examples/hosting/oisy-signer-demo
npm install
cd frontend && npm install
icp deploy
```

## Next steps

- [Internet Identity integration](../authentication/internet-identity.md) — add authentication alongside wallet signing
- [Token ledgers](token-ledgers.md) — work with ICRC-1 and ICRC-2 token standards
- [Token standards reference](../../reference/token-standards.md) — ICRC-1, ICRC-2, and related standards

<!-- Upstream: informed by dfinity/icskills — skills/wallet-integration/SKILL.md; dfinity/examples — hosting/oisy-signer-demo; dfinity/icp-js-sdk-docs — signer/latest.zip -->
