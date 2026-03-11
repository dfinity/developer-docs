---
title: "Solana Integration"
description: "Interact with Solana from ICP canisters using threshold Schnorr signatures"
sidebar:
  order: 4
doc_type: how-to
level: advanced
features: [chain-fusion, chain-key, threshold-schnorr]
last_verified: 2026-03-10
---

# Solana integration

ICP canisters can interact with the Solana network by combining **threshold Ed25519 signatures** (via the threshold Schnorr API) with **HTTPS outcalls** to Solana JSON-RPC endpoints. The **SOL RPC canister** provides a ready-to-use on-chain interface for Solana RPC calls.

## How it works

- **Threshold Ed25519** -- Solana uses Ed25519 for transaction signing. ICP's threshold Schnorr protocol supports Ed25519, allowing canisters to hold Solana private keys in a distributed, secure manner and produce valid signatures without any single node seeing the full key.

- **SOL RPC canister** -- The [SOL RPC canister](https://github.com/dfinity/sol-rpc-canister) is an NNS-controlled canister deployed on the ICP mainnet. It contacts multiple Solana JSON-RPC providers (Helius, Alchemy, Ankr, dRPC, Public Node) via HTTPS outcalls and aggregates their responses to avoid a single point of failure. Other canisters can call it directly with no API keys or additional setup required.

## Transaction workflow

1. **Get a public key** -- Call `schnorr_public_key` on the management canister with the `ed25519` algorithm.
2. **Derive a Solana address** -- A Solana address is the Base58-encoded Ed25519 public key.
3. **Build the transaction** -- Construct a Solana transaction (instructions, recent blockhash, fee payer).
4. **Sign the transaction** -- Call `sign_with_schnorr` with `algorithm: ed25519` to sign the serialized transaction message.
5. **Submit the transaction** -- Send the signed transaction to Solana via the SOL RPC canister or directly via HTTPS outcalls to a Solana RPC endpoint.

## Generating a Solana address

Retrieve an Ed25519 public key from the management canister:

```rust
let (pub_key,) = ic_cdk::api::management_canister::schnorr::schnorr_public_key(
    SchnorrPublicKeyArgument {
        canister_id: None,
        derivation_path: vec![],
        key_id: SchnorrKeyId {
            algorithm: SchnorrAlgorithm::Ed25519,
            name: "key_1".to_string(),
        },
    },
)
.await
.unwrap();

// The Solana address is the Base58 encoding of the 32-byte public key
let solana_address = bs58::encode(&pub_key.public_key).into_string();
```

## Signing a transaction

After building a Solana transaction message, sign it with threshold Schnorr:

```rust
let (sig,) = ic_cdk::api::management_canister::schnorr::sign_with_schnorr(
    SignWithSchnorrArgument {
        message: serialized_message.to_vec(),
        derivation_path: vec![],
        key_id: SchnorrKeyId {
            algorithm: SchnorrAlgorithm::Ed25519,
            name: "key_1".to_string(),
        },
    },
)
.await
.unwrap();
```

## Using the SOL RPC canister

The SOL RPC canister provides the same services as having a Solana RPC node available on the ICP mainnet. Follow the [SOL RPC canister README](https://github.com/dfinity/sol-rpc-canister/blob/main/README.md) for detailed API documentation and usage instructions.

Key points:

- Controlled by the NNS -- any changes require a governance proposal.
- No API keys needed -- canisters call it directly.
- Multiple providers are queried and results are aggregated for reliability.

## Resources

- [SOL RPC canister source](https://github.com/dfinity/sol-rpc-canister)
- [Threshold Schnorr documentation](/concepts/chain-key-cryptography/)
- [Solana RPC API reference](https://solana.com/docs/rpc/http)
