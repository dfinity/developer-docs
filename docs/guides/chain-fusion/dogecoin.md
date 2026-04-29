---
title: "Dogecoin Integration"
description: "Send and receive DOGE from ICP canisters using the Dogecoin canister"
sidebar:
  order: 4
---

:::caution[Beta]
The Dogecoin integration is currently in **beta**. No major API changes are expected, but Dogecoin differs from Bitcoin in significant ways (for example, its difficulty adjustment algorithm) that may affect the Dogecoin canister and warrant careful observation before using in production.
:::

ICP canisters can interact directly with the Dogecoin network without bridges or oracles. The integration works through two components:

- **Dogecoin canister**: a system canister controlled by the NNS that exposes an API for querying Dogecoin network state (UTXOs, balances, block information) and submitting signed transactions.
- **Threshold ECDSA**: canisters request threshold ECDSA signatures from the management canister to sign Dogecoin transactions. The private key is never reconstructed; it exists only as secret shares distributed across subnet nodes.

This is the same model as the [Bitcoin integration](bitcoin.md), using a UTXO-based transaction model and secp256k1 ECDSA signatures. The main difference is that Dogecoin transactions are submitted through the Dogecoin canister rather than the Bitcoin management canister API.

## How it works

When a canister wants to send DOGE, it follows these steps:

1. **Get a public key**: call `ecdsa_public_key` on the management canister with a derivation path unique to the user or context.
2. **Derive a Dogecoin address**: compute a P2PKH address from the public key using Dogecoin's address format.
3. **Read UTXOs**: call `dogecoin_get_utxos` on the Dogecoin canister to list unspent outputs for the address.
4. **Build the transaction**: select UTXOs as inputs, set outputs (recipient and change address), and compute the transaction hash.
5. **Sign each input**: call `sign_with_ecdsa` on the management canister to sign the transaction hash for each input.
6. **Submit the transaction**: call `dogecoin_send_transaction` on the Dogecoin canister to broadcast the signed transaction.

For reading balances and UTXO state without sending a transaction, only steps 1–3 are needed.

## Dogecoin canister API

The Dogecoin canister exposes these methods:

- `dogecoin_get_utxos`: returns unspent transaction outputs for a Dogecoin address
- `dogecoin_get_balance`: returns the balance of a Dogecoin address in koinus (1 DOGE = 100,000,000 koinus)
- `dogecoin_get_current_fee_percentiles`: returns fee percentiles from recent Dogecoin transactions
- `dogecoin_send_transaction`: submits a signed transaction to the Dogecoin network

The Dogecoin canister is an NNS-controlled system canister. Your canisters can call it directly without additional setup or trust assumptions beyond the NNS governance process. For the current canister ID and complete interface specification, see the [Dogecoin canister repository](https://github.com/dfinity/dogecoin-canister).

All calls to the Dogecoin canister require cycles. Attach cycles explicitly in Motoko using `(with cycles = amount)`; in Rust, attach them with `.with_cycles(amount)` on the `Call` builder.

## ECDSA key names

Threshold ECDSA uses a `key_id` to identify which key to use when calling `ecdsa_public_key` and `sign_with_ecdsa` on the management canister. Two key names are available on ICP mainnet:

| Key name | Use |
|---|---|
| `test_key_1` | Development and testing on mainnet |
| `key_1` | Production deployments |

Use `test_key_1` while developing and `key_1` for production. Both keys use the `secp256k1` curve.

## Example: get balance

The following example calls the Dogecoin canister to get the balance of a Dogecoin address:

```rust
use candid::{CandidType, Deserialize, Principal};
use ic_cdk::update;
use ic_cdk::call::Call;

// Replace with the canister ID from https://github.com/dfinity/dogecoin-canister
// Using this placeholder will panic at runtime: replace before deploying.
const DOGECOIN_CANISTER: &str = "xxxxxxxxx-xxxxx-xxxxx-xxxxx-xxx";

#[derive(CandidType, Deserialize, Clone, Debug)]
pub enum DogecoinNetwork {
    Mainnet,
    Testnet,
    Regtest,
}

#[derive(CandidType, Deserialize)]
struct GetBalanceRequest {
    address: String,
    network: DogecoinNetwork,
    min_confirmations: Option<u32>,
}

fn dogecoin_canister_id() -> Principal {
    Principal::from_text(DOGECOIN_CANISTER).expect("Invalid Dogecoin canister ID")
}

/// Returns the balance of a Dogecoin address in koinus (1 DOGE = 100,000,000 koinus).
#[update]
async fn get_dogecoin_balance(address: String, network: DogecoinNetwork) -> u64 {
    let (balance,): (u64,) = Call::unbounded_wait(dogecoin_canister_id(), "dogecoin_get_balance")
        .with_arg(GetBalanceRequest {
            address,
            network,
            min_confirmations: None,
        })
        .with_cycles(100_000_000)
        .await
        .expect("Failed to call dogecoin_get_balance")
        .candid_tuple()
        .expect("Failed to decode balance");

    balance
}
```

<!-- Needs human verification: The Dogecoin canister ID, exact cycle costs, API method names (`dogecoin_get_utxos`, `dogecoin_get_balance`, `dogecoin_get_current_fee_percentiles`, `dogecoin_send_transaction`), and the "koinu" unit name are not confirmed in available source material. Verify all at https://github.com/dfinity/dogecoin-canister before using in production. -->

Motoko canisters can call the Dogecoin canister using actor-based inter-canister calls with `(with cycles = amount)` syntax. The same pattern used for the Bitcoin integration.

## Transaction flow

Sending DOGE from a canister involves address derivation, UTXO selection, transaction construction, threshold signing, and submission. This multi-step process closely mirrors the Bitcoin direct API workflow.

For a complete, working implementation covering all steps (including deriving a Dogecoin address from a threshold ECDSA public key, constructing a transaction with proper input/output structure, signing each input, and broadcasting) see:

- [Build on Dogecoin book](https://dfinity.github.io/dogecoin-canister): step-by-step guide with complete examples
- [basic_dogecoin example](https://github.com/dfinity/dogecoin-canister/tree/master/examples/basic_dogecoin): complete Rust example for the full send flow

The [Bitcoin integration guide](bitcoin.md) covers the same conceptual steps with complete inline code. Because Dogecoin is a fork of Bitcoin and shares the same UTXO model and secp256k1 ECDSA signatures, the patterns translate directly with these differences:

- Use the Dogecoin canister for UTXO queries and transaction submission (not the management canister's `bitcoin_*` API)
- Use Dogecoin's P2PKH address format (mainnet addresses start with `D`)
- Dogecoin uses koinus instead of satoshis (1 DOGE = 100,000,000 koinus)
- Dogecoin uses a different fee rate: use `dogecoin_get_current_fee_percentiles` to get current rates

## Relationship to Bitcoin integration

Dogecoin is a fork of Bitcoin and shares its fundamental transaction model: UTXO-based, secp256k1 ECDSA signatures, and similar transaction structure. Both integrations on ICP are direct protocol-level integrations. No bridges or external oracles.

The key differences in implementation:

| | Bitcoin | Dogecoin |
|---|---|---|
| API | Management canister (`bitcoin_*` methods) | Dogecoin canister |
| Chain-key token | ckBTC | ckDOGE |
| Address prefix | `1`, `3`, `bc1` (mainnet) | `D` (mainnet) |
| Unit | satoshi | koinu |
| Status | Stable | Beta |

Developers familiar with the Bitcoin integration will find the Dogecoin integration conceptually identical. The primary practical difference is calling the Dogecoin canister rather than the management canister's Bitcoin API.

## NNS governance

The Dogecoin canister is controlled by the [Network Nervous System](../../concepts/governance.md). Any changes to the canister require an NNS proposal that the community must review and approve before taking effect. This means your canister can call the Dogecoin canister without additional trust assumptions beyond the NNS governance process itself.

## ckDOGE

ckDOGE is a 1:1 DOGE-backed token on ICP. The ckDOGE minter holds real DOGE and mints or burns ckDOGE using the same ICRC-1/ICRC-2 interface as ckBTC. For canister IDs and CLI-based deposit and withdrawal flows, see [Chain-key tokens](../digital-assets/chain-key-tokens.md).

### Deposit (DOGE to ckDOGE)

```plantuml
actor User
participant "ckDOGE Minter" as Minter
participant "Dogecoin Network" as DOGE

User -> Minter: get_doge_address(account)
Minter --> User: doge_address
User -> DOGE: send DOGE to doge_address
User -> Minter: update_balance(account)
Minter --> User: ckDOGE minted to ICRC-1 account
```

### Withdrawal (ckDOGE to DOGE)

```plantuml
actor User
participant "ckDOGE Ledger" as Ledger
participant "ckDOGE Minter" as Minter
participant "Dogecoin Network" as DOGE

User -> Ledger: icrc2_approve(spender=minter, amount)
User -> Minter: retrieve_doge_with_approval(doge_address, amount)
Minter -> Ledger: icrc2_transfer_from(user, minter, amount)
Minter -> DOGE: send DOGE to doge_address
```

## Next steps

- [Chain fusion overview](../../concepts/chain-fusion.md): understand how ICP integrates with external blockchains
- [Bitcoin integration](bitcoin.md): the same UTXO-based integration with complete code examples
- [Chain-key cryptography](../../concepts/chain-key-cryptography.md): how threshold ECDSA signatures work
- [Chain-key tokens](../digital-assets/chain-key-tokens.md): ckBTC, ckETH, and upcoming ckDOGE
- [Build on Dogecoin book](https://dfinity.github.io/dogecoin-canister): full tutorial for building Dogecoin apps on ICP

<!-- Upstream: informed by dfinity/portal — docs/building-apps/chain-fusion/dogecoin/overview.mdx, docs/building-apps/chain-fusion/supported-chains.mdx; dfinity/examples — rust/basic_dogecoin/README.md; learn.internetcomputer.org — Dogecoin integration overview (https://learn.internetcomputer.org/hc/en-us/articles/46782835018516) -->
