---
title: "Chain-Key Cryptography"
description: "Sign transactions on Bitcoin, Ethereum, and other chains using threshold signatures"
sidebar:
  order: 2
doc_type: explanation
level: intermediate
features: [chain-key, threshold-ecdsa, threshold-schnorr]
icskills: [ckbtc, evm-rpc]
last_verified: 2026-03-10
---

Chain-key cryptography allows canisters to sign transactions on other blockchains without holding private keys. The private key exists only as secret shares distributed across subnet nodes. Signatures are computed collaboratively -- the full key is never reconstructed.

This powers direct integration with Bitcoin, Ethereum, Solana, and any chain that uses ECDSA or Schnorr signature schemes.

## Threshold ECDSA

Threshold ECDSA enables canisters to sign messages compatible with Bitcoin (secp256k1) and all EVM chains. Each canister controls a unique ECDSA public key and can derive unlimited additional keys using different derivation paths.

Use cases:

- Holding native BTC in a canister
- Signing Ethereum and EVM transactions
- Integrating with any ECDSA-based blockchain
- Issuing certificates from a decentralized CA

### Signing with ECDSA

The management canister exposes two methods:

- `sign_with_ecdsa` -- sign a message hash
- `ecdsa_public_key` -- obtain the public key for a canister and derivation path

The Candid interface for signing:

```candid
type sign_with_ecdsa_args = record {
    message_hash : blob;
    derivation_path : vec blob;
    key_id : record { curve : ecdsa_curve; name : text };
};

type sign_with_ecdsa_result = record {
    signature : blob;
};
```

**Motoko**

```motoko
let ic = actor "aaaaa-aa" : actor {
    sign_with_ecdsa : {
        message_hash : Blob;
        derivation_path : [Blob];
        key_id : { curve : { #secp256k1 }; name : Text };
    } -> async { signature : Blob };
};

let { signature } = await ic.sign_with_ecdsa({
    message_hash = hash;
    derivation_path = [Text.encodeUtf8("my_key")];
    key_id = { curve = #secp256k1; name = "key_1" };
});
```

**Rust**

```rust
use ic_cdk::api::management_canister::ecdsa::{
    sign_with_ecdsa, EcdsaCurve, EcdsaKeyId, SignWithEcdsaArgument,
};

let request = SignWithEcdsaArgument {
    message_hash: hash.to_vec(),
    derivation_path: vec![b"my_key".to_vec()],
    key_id: EcdsaKeyId {
        curve: EcdsaCurve::Secp256k1,
        name: "key_1".to_string(),
    },
};
let (response,) = sign_with_ecdsa(request).await.unwrap();
let signature = response.signature;
```

### Key IDs

| Key name | Environment |
|---|---|
| `dfx_test_key` | Local development only |
| `test_key_1` | ICP mainnet (testing) |
| `key_1` | ICP mainnet (production) |

Signing requires cycles to be attached. In Rust, the CDK handles this automatically. In Motoko, you must add cycles manually.

## Threshold Schnorr

Threshold Schnorr supports two algorithms:

- **BIP-340 (secp256k1)** -- used by Bitcoin Ordinals, Runes, and BRC-20
- **Ed25519** -- used by Solana, Cardano, Polkadot, Ripple, and for signing X.509 certificates

Schnorr signatures offer higher throughput than ECDSA and take a full message as input (not a hash), since the hashing is part of the signature scheme.

### Signing with Schnorr

The API mirrors the ECDSA interface:

- `sign_with_schnorr` -- sign a message
- `schnorr_public_key` -- obtain the public key

**Motoko**

```motoko
let ic = actor "aaaaa-aa" : actor {
    sign_with_schnorr : {
        message : Blob;
        derivation_path : [Blob];
        key_id : { algorithm : { #bip340secp256k1; #ed25519 }; name : Text };
    } -> async { signature : Blob };
};

let { signature } = await ic.sign_with_schnorr({
    message = msg;
    derivation_path = [Text.encodeUtf8("my_key")];
    key_id = { algorithm = #ed25519; name = "key_1" };
});
```

**Rust**

```rust
use ic_cdk::api::management_canister::schnorr::{
    sign_with_schnorr, SchnorrAlgorithm, SchnorrKeyId, SignWithSchnorrArgument,
};

let request = SignWithSchnorrArgument {
    message: msg.to_vec(),
    derivation_path: vec![b"my_key".to_vec()],
    key_id: SchnorrKeyId {
        algorithm: SchnorrAlgorithm::Ed25519,
        name: "key_1".to_string(),
    },
};
let (response,) = sign_with_schnorr(request).await.unwrap();
let signature = response.signature;
```

For BIP-340, you can optionally provide a 32-byte taproot merkle tree root as a key tweak per BIP-341.

## Key derivation paths

Every canister has a root key derived from the subnet's master key and the canister's principal. From this root key, you can derive an unlimited number of child keys by specifying a `derivation_path` -- a vector of byte arrays.

The derivation is deterministic: the same canister ID + derivation path always produces the same key pair. This means you can derive keys for different purposes (e.g., one per user, one per asset) without any additional state.

### Offline key derivation

Public keys can also be derived offline using the `ic-pub-key` library, without calling the management canister:

**Rust**

```rust
let canister_id = ic_pub_key::CanisterId::from_str("h5jwf-5iaaa-aaaan-qmvoa-cai")?;
let args = ic_pub_key::EcdsaPublicKeyArgs {
    canister_id: Some(canister_id),
    derivation_path: vec![b"my_key"],
    key_id: ic_pub_key::EcdsaKeyId {
        curve: ic_pub_key::EcdsaCurve::Secp256k1,
        name: "key_1".to_string(),
    },
};
let derived_public_key = ic_pub_key::derive_ecdsa_key(&args)?;
```

## Resources

- [Chain-key signatures: technology overview](https://internetcomputer.org/how-it-works/chain-key-technology/)
- [Threshold ECDSA sample -- Motoko](https://github.com/dfinity/examples/tree/master/motoko/threshold-ecdsa)
- [Threshold ECDSA sample -- Rust](https://github.com/dfinity/examples/tree/master/rust/threshold-ecdsa)
- [Threshold Schnorr sample -- Motoko](https://github.com/dfinity/examples/tree/master/motoko/threshold-schnorr)
- [Threshold Schnorr sample -- Rust](https://github.com/dfinity/examples/tree/master/rust/threshold-schnorr)
- [ic-pub-key Rust crate](https://crates.io/crates/ic-pub-key)
- [ic-pub-key TypeScript package](https://www.npmjs.com/package/@dfinity/ic-pub-key)
- [Chain Fusion guides](/concepts/chain-fusion/) for end-to-end multi-chain integration
- icskills: [ckbtc](https://github.com/dfinity/icskills/blob/main/skills/ckbtc/SKILL.md), [evm-rpc](https://github.com/dfinity/icskills/blob/main/skills/evm-rpc/SKILL.md)
