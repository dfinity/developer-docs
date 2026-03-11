---
title: "Dogecoin Integration"
description: "Send and receive Dogecoin from ICP canisters"
sidebar:
  order: 5
doc_type: how-to
level: intermediate
features: [chain-fusion, chain-key]
last_verified: 2026-03-10
---

# Dogecoin integration

ICP has a direct protocol-level integration with the Dogecoin network, similar to the Bitcoin integration. Canisters can query UTXO state, build transactions, sign them with threshold ECDSA, and submit them to the Dogecoin network without bridges or external services.

> The Dogecoin integration is currently in **beta**. Dogecoin differs from Bitcoin in significant ways (for example, difficulty adjustment), which may warrant a period of careful observation.

## Architecture

The [Dogecoin canister](https://github.com/dfinity/dogecoin-canister) is an NNS-controlled canister that provides the integration endpoints. It maintains the Dogecoin UTXO set in replicated state, similar to how the Bitcoin canister works. Canisters on any subnet can call its API, and requests are routed via XNet messaging.

## Transaction workflow

1. **Get a public key** -- Call `ecdsa_public_key` on the management canister.
2. **Derive a Dogecoin address** -- Convert the ECDSA public key into a Dogecoin address (P2PKH format, `D` prefix).
3. **Query UTXOs** -- Call the Dogecoin canister API to retrieve unspent outputs for the address.
4. **Build the transaction** -- Select UTXOs as inputs, set outputs, and calculate fees.
5. **Sign the transaction** -- Call `sign_with_ecdsa` to sign each transaction input.
6. **Submit the transaction** -- Call the Dogecoin canister's send transaction endpoint.

## Generating a Dogecoin address

Retrieve an ECDSA public key and derive a Dogecoin P2PKH address:

```rust
let (pub_key,) = ic_cdk::api::management_canister::ecdsa::ecdsa_public_key(
    EcdsaPublicKeyArgument {
        canister_id: None,
        derivation_path: vec![],
        key_id: EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: "key_1".to_string(),
        },
    },
)
.await
.unwrap();

// Convert pub_key.public_key bytes to a Dogecoin P2PKH address
// Dogecoin uses version byte 0x1E for mainnet addresses
```

## Reading Dogecoin state

The Dogecoin canister API provides endpoints to:

- **Get UTXOs** -- Retrieve unspent transaction outputs for a given address.
- **Get balance** -- Query the balance of a Dogecoin address.
- **Send transaction** -- Submit a signed transaction to the Dogecoin network.

## Signing and submitting transactions

Transaction signing follows the same pattern as Bitcoin: hash each input's signing data and call `sign_with_ecdsa` on the management canister. Then submit the fully signed transaction through the Dogecoin canister API.

```rust
let (sig,) = ic_cdk::api::management_canister::ecdsa::sign_with_ecdsa(
    SignWithEcdsaArgument {
        message_hash: sighash.to_vec(),
        derivation_path: vec![],
        key_id: EcdsaKeyId {
            curve: EcdsaCurve::Secp256k1,
            name: "key_1".to_string(),
        },
    },
)
.await
.unwrap();
```

## Key differences from Bitcoin

While Dogecoin is a fork of Bitcoin and shares the UTXO model, there are important differences:

- **Difficulty adjustment** -- Dogecoin adjusts mining difficulty every block, unlike Bitcoin's 2,016-block cycle.
- **Block time** -- Dogecoin targets 1-minute blocks versus Bitcoin's 10 minutes.
- **No supply cap** -- Dogecoin has no maximum supply; block rewards continue indefinitely.
- **Address format** -- Dogecoin mainnet addresses start with `D` (version byte `0x1E`).

Understanding core Bitcoin concepts (transactions, UTXOs, Script) is still essential for building Dogecoin applications.

## Resources

- [Build on Dogecoin book](https://dfinity.github.io/dogecoin-canister)
- [Dogecoin canister source](https://github.com/dfinity/dogecoin-canister)
- [Mastering Bitcoin](https://github.com/bitcoinbook/bitcoinbook/blob/develop/BOOK.md)
- [Learn me a Bitcoin](https://learnmeabitcoin.com)
