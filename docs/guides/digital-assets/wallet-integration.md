---
title: "Wallet Integration"
description: "Integrate ICRC signer-standard wallets with your app using explicit per-action user approval."
sidebar:
  order: 4
---

Wallet integration on the Internet Computer uses a popup-based signer model where every meaningful action requires explicit user approval. The app opens a wallet popup, requests permission, and the wallet shows a human-readable consent message before executing each canister call.

This guide covers integration using `@icp-sdk/signer`, the signer library in the ICP JavaScript SDK.

## Authentication vs. wallet signing

Internet Identity and wallet signers serve different purposes:

| | Internet Identity | Wallet signer |
|---|---|---|
| **Purpose** | Authenticate a user (prove identity) | Approve and sign canister calls |
| **User sees** | Login prompt once | Consent message per action |
| **After approval** | Session delegation (sign-once, act-many) | Single call executed |
| **Use when** | Read data, frequent writes, session-based UX | Token transfers, approvals, high-value one-off actions |

Use Internet Identity for login. Use a wallet signer when your app needs users to explicitly approve individual transactions: token transfers, NFT operations, or any action where a per-operation confirmation dialog is appropriate.

## ICRC signer standards

The signer model is defined by five ICRC standards (ICRC-21, 25, 27, 29, and 49) covering consent messages, permissions, account discovery, and canister call routing. For details on each, see [Wallet signer standards](../../references/icrc-standards.md#wallet-signer-standards). A compliant wallet such as [OISY](https://oisy.com) implements all five.

## How it works

The lifecycle of a wallet-initiated call:

1. Your app creates a `Signer` pointing to the wallet's signer URL
2. Call `getAccounts()`: the wallet popup opens and prompts the user to share their account
3. Construct a `SignerAgent` using the returned principal
4. Use the agent with any canister actor. The wallet intercepts every call, fetches an ICRC-21 consent message from the target canister, shows it to the user, and only executes if the user approves

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

You can request permissions upfront before calling `getAccounts()` to batch all permission prompts into a single interaction:

```javascript
// Request all needed permissions at once (optional but recommended)
await signer.requestPermissions([{ method: 'icrc27_accounts' }]);

const accounts = await signer.getAccounts();
```

If you skip this step, the signer handles permissions per-method. The user sees a permissions prompt the first time each method is called.

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

Call `closeChannel()` on the signer when the user logs out or closes the session:

```javascript
await signer.closeChannel();
```

`closeChannel()` closes the open communication channel with the wallet popup.

## Session persistence

The signer session is tied to the browser tab. After a page reload, the user's principal is no longer available from the signer. To avoid opening the popup again immediately, store the principal in `sessionStorage` and restore it on mount: then re-establish the signer session lazily when the user initiates a transfer:

```javascript
import { Principal } from '@icp-sdk/core/principal';

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
    switch (err.code) {
      case 3001: // ACTION_ABORTED: user closed the popup or rejected the prompt
        break;
      case 3000: // PERMISSION_NOT_GRANTED: permission was denied
        break;
      default:
        console.error('Signer error', err.code, err.message);
    }
  }
}
```

Common `err.code` values from the ICRC-25 standard:

| Code | Meaning |
|------|---------|
| `3000` | Permission not granted |
| `3001` | Action aborted: user closed the popup or rejected |
| `4000` | Network error: IC call failed |

## Local development

For local development against a running local network:

```javascript
const signer = new Signer({
  transport: new PostMessageTransport({ url: 'http://localhost:5174/sign' }),
});

const readAgent = await HttpAgent.create({ host: 'http://localhost:8000' });
```

For a test signer target, you can use any ICRC-25-compliant wallet running locally that exposes a `/sign` endpoint: for example, a local instance of [OISY](https://github.com/dfinity/oisy-wallet) or a custom signer built with `@icp-sdk/signer`.

On mainnet, omit `host` from `HttpAgent.create()`: it defaults to `https://icp0.io`.

## Working example

The [oisy-signer-demo](https://github.com/dfinity/examples/tree/master/hosting/oisy-signer-demo) example shows a complete app that:

1. Connects to OISY and fetches the user's accounts
2. Queries ICRC-1 token balances using a read-only agent
3. Performs self-transfers using the signer agent

To run locally:

```bash
git clone https://github.com/dfinity/examples
cd examples/hosting/oisy-signer-demo
icp network start -d
npm install
icp deploy
```

## Ecosystem libraries

Two additional libraries are available for more advanced wallet integration scenarios:

- [`@dfinity/ledger-wallet-identity`](https://www.npmjs.com/package/@dfinity/ledger-wallet-identity): hardware wallet identity support
- [`@dfinity/icrc21-agent`](https://www.npmjs.com/package/@dfinity/icrc21-agent): standalone ICRC-21 consent message agent

Both libraries are expected to move to the `@icp-sdk` namespace on npm and will likely be covered in the wallet-integration skill going forward. They are not documented in detail here.

## Next steps

- [Internet Identity integration](../authentication/internet-identity.md): add authentication alongside wallet signing
- [Ledgers](ledgers.md): transfer and manage assets with ledgers that implement digital asset standards
- [Digital Asset Standards](../../references/digital-asset-standards.md): formal ICRC specifications for fungible assets, NFTs, and their extensions

<!-- Upstream: informed by dfinity/icskills — skills/wallet-integration/SKILL.md; dfinity/examples — hosting/oisy-signer-demo; dfinity/icp-js-sdk-docs — signer/latest.zip -->
