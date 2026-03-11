---
title: "Wallet Integration"
description: "Integrate wallet-based authentication into Internet Computer applications."
sidebar:
  order: 2
doc_type: how-to
level: intermediate
features: []
icskills:
  - wallet-integration
  - wallet
last_verified: 2026-03-10
---

Wallets provide an alternative authentication path for ICP applications, enabling users to connect with their existing crypto wallets to sign transactions and interact with canisters. This is especially relevant for DeFi applications and token operations.

## Wallet options on ICP

| Wallet | Key algorithm | Type |
|--------|--------------|------|
| [OISY](https://oisy.com) | Ed25519 | Web-based, multi-chain |
| [Plug](https://plug.wallet) | Secp256k1 | Browser extension |
| [NFID](https://nfid.one) | Ed25519 | Web-based, II-compatible |
| [Stoic](https://www.stoicwallet.com) | Ed25519 | Web-based |

## How wallet auth differs from Internet Identity

| | Internet Identity | Wallet |
|--|-------------------|--------|
| **Principal derivation** | Unique per application | Same principal across all apps |
| **Key management** | Passkeys (WebAuthn) | Wallet-managed keys |
| **Use case** | General authentication | Token operations, DeFi |
| **Cross-app identity** | Different principal per app | Same principal everywhere |

Wallet authentication exposes the same principal to all applications. This is useful for token balances and DeFi but reduces privacy compared to II.

## ICRC-25 and ICRC-49 signer standards

The [ICRC-25](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-25/ICRC-25.md) and [ICRC-49](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-49/ICRC-49.md) standards define a protocol for dapps to interact with external signers (wallets):

- **ICRC-25** -- permission management. Your app requests permissions from the wallet (e.g., `icrc49_call_canister`).
- **ICRC-49** -- canister call signing. Your app asks the wallet to sign and submit a canister call on the user's behalf.

This allows dapps to request transaction signing without direct access to private keys.

## Integrating Plug wallet

Plug uses Secp256k1 keys. You can integrate using the `@dfinity/identity-secp256k1` package:

```js
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";

// Create identity from a PEM key
const identity = Secp256k1KeyIdentity.fromPem(pemFileContentString);
```

For browser-based Plug integration, use the injected `window.ic.plug` API:

```js
// Check if Plug is installed
const isPlugInstalled = window.ic?.plug;

// Request connection
await window.ic.plug.requestConnect({
  whitelist: ["<canister-id>"], // canisters the app will call
  host: "https://icp-api.io",
});

// Get the principal
const principal = await window.ic.plug.agent.getPrincipal();

// Create an actor for canister calls
const actor = await window.ic.plug.createActor({
  canisterId: "<canister-id>",
  interfaceFactory: idlFactory,
});

const result = await actor.myMethod();
```

## Integrating OISY wallet

OISY is a web-based multi-chain wallet built on ICP. Integration uses the ICRC-25/ICRC-49 signer standards via a popup flow similar to Internet Identity:

```js
// Open OISY signer
const signer = await openSigner({
  url: "https://oisy.com/sign",
});

// Request permissions
await signer.requestPermissions([
  { method: "icrc49_call_canister" }
]);

// Request a canister call
const result = await signer.callCanister({
  canisterId: "<canister-id>",
  method: "transfer",
  arg: encodedArg,
});
```

## Backend authorization

Regardless of which wallet the user connects with, the backend receives the caller's principal. Authorization logic is the same as with Internet Identity:

```rust
#[ic_cdk::update]
fn transfer(to: Principal, amount: u64) -> Result<(), String> {
    let caller = ic_cdk::caller();
    if caller == candid::Principal::anonymous() {
        return Err("Anonymous callers not allowed".to_string());
    }
    // Proceed with transfer using caller as the source
    Ok(())
}
```

## Choosing an authentication method

- Use **Internet Identity** when privacy is important and you want unique per-app principals.
- Use **wallet integration** when your app involves tokens, DeFi, or needs a consistent identity across applications.
- You can support **both** by offering II and wallet login options side by side.

## Next steps

- [Internet Identity](/guides/authentication/internet-identity/) -- passkey-based authentication
- [ICRC-25 specification](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-25/ICRC-25.md) -- signer permission standard
- [ICRC-49 specification](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-49/ICRC-49.md) -- canister call signing standard
