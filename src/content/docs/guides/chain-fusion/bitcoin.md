---
title: "Bitcoin Integration"
description: "Send and receive Bitcoin directly from ICP canisters"
sidebar:
  order: 2
doc_type: how-to
level: intermediate
features: [chain-fusion, chain-key, threshold-ecdsa]
icskills: [ckbtc]
last_verified: 2026-03-10
---

# Bitcoin integration

ICP has a direct protocol-level integration with the Bitcoin network. Canisters can create Bitcoin addresses, query UTXOs and balances, build transactions, sign them with threshold ECDSA or Schnorr, and submit them to the Bitcoin network -- all without bridges or external oracles.

## Architecture

A dedicated **Bitcoin-activated subnet** runs the [Bitcoin canister](https://github.com/dfinity/bitcoin-canister) (`ghsi2-tqaaa-aaaan-aaaca-cai`). Each replica on that subnet runs a **Bitcoin adapter** that connects to Bitcoin P2P nodes, effectively making the subnet a native Bitcoin node.

The Bitcoin canister maintains a replica of the Bitcoin UTXO set in ICP's replicated state. Canisters on any subnet can call the Bitcoin API; requests are routed via ICP's cross-subnet (XNet) messaging.

## Transaction workflow

A canister submitting a Bitcoin transaction typically follows these steps:

1. **Get a public key** -- Call `ecdsa_public_key` or `schnorr_public_key` on the management canister.
2. **Derive a Bitcoin address** -- Convert the public key into a P2PKH, P2WPKH, or P2TR address.
3. **Query UTXOs** -- Call `bitcoin_get_utxos` to retrieve unspent outputs for the address.
4. **Build the transaction** -- Select UTXOs as inputs, set outputs, and calculate fees.
5. **Sign the transaction** -- Call `sign_with_ecdsa` or `sign_with_schnorr` to sign each input.
6. **Submit the transaction** -- Call `bitcoin_send_transaction` to broadcast to the Bitcoin network.

## Generating addresses

ICP supports multiple Bitcoin address types:

| Address type | Prefix | Signing scheme | API |
|---|---|---|---|
| P2PKH (legacy) | `1` | ECDSA | `ecdsa_public_key` |
| P2WPKH (SegWit) | `bc1q` | ECDSA | `ecdsa_public_key` |
| P2TR (Taproot) | `bc1p` | Schnorr | `schnorr_public_key` |

Example: retrieving an ECDSA public key and deriving a P2PKH address in Rust:

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
// Convert pub_key.public_key bytes to a P2PKH address
```

## Reading Bitcoin state

The Bitcoin canister exposes several query endpoints:

- `bitcoin_get_utxos` -- Returns the UTXO set for a given address.
- `bitcoin_get_balance` -- Returns the balance (in satoshi) for an address.
- `bitcoin_get_current_fee_percentiles` -- Returns fee percentiles from the last 10,000 mined transactions.
- `bitcoin_get_block_headers` -- Returns block headers for a given height range.

Example: querying UTXOs in Rust:

```rust
let (utxos,) = ic_cdk::api::management_canister::bitcoin::bitcoin_get_utxos(
    GetUtxosRequest {
        address: "bc1q...".to_string(),
        network: BitcoinNetwork::Mainnet,
        filter: None,
    },
)
.await
.unwrap();
```

## Ordinals and Runes

Canisters can inscribe **Ordinals** and etch **Runes** on Bitcoin by constructing the appropriate transactions and signing them with threshold Schnorr (Taproot P2TR addresses are required).

- **Ordinals** attach digital artifacts to individual satoshis through inscription transactions.
- **Runes** are fungible tokens on Bitcoin that use the `OP_RETURN` opcode and the UTXO model.

Both require generating a P2TR address via `schnorr_public_key`, then building and signing the specific transaction type. See the [basic Bitcoin example](https://github.com/dfinity/examples/tree/master/rust/basic_bitcoin) for working code.

## ckBTC

**ckBTC** (chain-key Bitcoin) is an ICRC-2 token on ICP backed 1:1 by real BTC. A pair of NNS-controlled canisters (the minter and the ledger) manage deposits and withdrawals trustlessly using threshold ECDSA.

Key properties:

- Transfer finality in 1-2 seconds
- Transaction fees of fractions of a cent
- No bridge -- the underlying BTC is held by a canister-controlled Bitcoin address

To work with ckBTC programmatically, use the ICRC-2 ledger interface. See the [ckBTC skill file](https://github.com/dfinity/icskills/blob/main/skills/ckbtc/SKILL.md) for integration details.

## Local development

For local testing, `icp` starts a `bitcoind` node in regtest mode. You can mine blocks, send test BTC, and exercise the full Bitcoin API locally:

```bash
icp network start -d --bitcoin-node
```

For pre-production testing, deploy to the ICP mainnet with the Bitcoin API set to testnet.

## Resources

- [Basic Bitcoin example (Rust)](https://github.com/dfinity/examples/tree/master/rust/basic_bitcoin)
- [Basic Bitcoin example (Motoko)](https://github.com/dfinity/examples/tree/master/motoko/basic_bitcoin)
- [Bitcoin canister source](https://github.com/dfinity/bitcoin-canister)
- [Mastering Bitcoin](https://github.com/bitcoinbook/bitcoinbook/blob/develop/BOOK.md)
- [Learn me a Bitcoin](https://learnmeabitcoin.com)
