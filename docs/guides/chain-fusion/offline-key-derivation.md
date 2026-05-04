---
title: "Offline public key derivation"
description: "Derive canister threshold public keys and network addresses offline, without any network calls or costs."
sidebar:
  order: 6
---

ICP's threshold key derivation is deterministic: given the subnet's master public key, a canister principal, and a derivation path, anyone can compute the same canister public key locally. No secrets are involved and no canister call is needed.

This is useful for computing Ethereum or Bitcoin addresses for a canister, building explorers or dashboards, and testing locally without a live ICP connection.

## TypeScript

Install the library and its peer dependency:

```bash
npm install @dfinity/ic-pub-key @dfinity/principal
```

### ECDSA (secp256k1)

Used for Ethereum, EVM chains, and Bitcoin (legacy/SegWit).

```typescript
import { ecdsa } from "@dfinity/ic-pub-key";
import { Principal } from "@dfinity/principal";

const masterKey = ecdsa.secp256k1.PublicKeyWithChainCode.forMainnetKey("key_1");
const path = ecdsa.secp256k1.DerivationPath.withCanisterPrefix(
  Principal.fromText("your-canister-id"),
  [] // additional sub-path components, if any
);
const derived = masterKey.deriveSubkeyWithChainCode(path);
console.log(derived.public_key.toHex()); // SEC1-compressed hex public key
```

Use `forMainnetKey("test_key_1")` for the development key, or `forPocketIcKey("key_1")` for PocketIC tests.

### Schnorr (Ed25519)

Used for Solana, TON, Polkadot, Cardano, and NEAR.

```typescript
import { schnorr } from "@dfinity/ic-pub-key";
import { Principal } from "@dfinity/principal";

const masterKey = schnorr.ed25519.PublicKeyWithChainCode.forMainnetKey("key_1");
const path = schnorr.ed25519.DerivationPath.withCanisterPrefix(
  Principal.fromText("your-canister-id"),
  []
);
const derived = masterKey.deriveSubkeyWithChainCode(path);
console.log(derived.public_key.toHex()); // 32-byte Ed25519 public key as hex
```

## Rust

```toml
# Cargo.toml
# Disable the vetkeys feature to avoid pulling in heavy transitive dependencies
# if VetKD support is not needed.
ic-pub-key = { version = "0.3.0", default-features = false, features = ["secp256k1", "ed25519"] }
```

See [docs.rs/ic-pub-key](https://docs.rs/ic-pub-key) for the full Rust API. The crate wraps `ic-secp256k1` and `ic-ed25519` from the ICP monorepo and exposes the same offline derivation logic.

## CLI

The `derive` commands accept a parent public key and chain code and output the derived key as JSON. Pass the hex values from `forMainnetKey()` above or from a prior `ecdsa_public_key` / `schnorr_public_key` call:

```bash
# ECDSA secp256k1
npx @dfinity/ic-pub-key derive ecdsa secp256k1 \
  --pubkey <parent-public-key-hex> \
  --chaincode <parent-chain-code-hex> \
  --derivationpath <candid-blob-path>

# Schnorr Ed25519 (mainnet key_1 is the default: no flags needed for the master key)
npx @dfinity/ic-pub-key derive schnorr ed25519 \
  --derivationpath <candid-blob-path>
```

For deriving Chain Fusion Signer addresses specifically (ETH/BTC for a given principal), use the `signer` commands instead: see the [Chain Fusion Signer guide](chain-fusion-signer.md#derive-offline-no-cycles).

## Next steps

- [Chain Fusion Signer](chain-fusion-signer.md): sign transactions for Bitcoin and Ethereum from web apps and CLI
- [Management canister reference](../../references/management-canister.md#chain-key-signing): the `ecdsa_public_key` and `schnorr_public_key` management canister methods
- [Chain-key cryptography](../../concepts/chain-key-cryptography.md): how threshold key derivation works

<!-- ic-pub-key: known issue — @dfinity/ic-pub-key v1.0.1 npm package is missing .d.ts type declarations (https://github.com/dfinity/ic-pub-key/issues/197); verify this is fixed before editing TypeScript examples. Package may also move to the @icp-sdk/ namespace in a future release — update all references when that happens. -->

<!-- Upstream: informed by dfinity/ic-pub-key — src/ecdsa/secp256k1.ts, src/schnorr/ed25519.ts, src/cli.ts, README.md -->
