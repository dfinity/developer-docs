---
title: "Bitcoin Integration"
description: "How ICP connects to Bitcoin natively: the adapter, the Bitcoin canister, the checker canister, and ckBTC"
---

ICP's Bitcoin integration lets canisters hold Bitcoin addresses, query balances and UTXOs, and sign and broadcast Bitcoin transactions, all without bridges or custodians. This page covers the protocol architecture: the Bitcoin adapter, the Bitcoin canister, the Bitcoin checker canister, and chain-key Bitcoin (ckBTC).

## Architecture

The integration has two layers:

**Protocol layer.** ICP nodes run a _Bitcoin adapter_, a process separate from the replica that speaks the Bitcoin peer-to-peer protocol. The adapter connects to Bitcoin nodes, downloads blocks, and relays pending transactions. It keeps the replica informed about the latest Bitcoin state. Inside the replica, the _Bitcoin canister_ (a canister running on a dedicated system subnet) processes blocks from the adapter, maintains the UTXO set for all Bitcoin addresses, and exposes a low-level API to other canisters.

**Signing layer.** Each canister can derive its own Bitcoin addresses through [chain-key signatures](../chain-key-cryptography.md). Because Bitcoin addresses are tied to ECDSA or Schnorr public keys, and the protocol can produce threshold signatures for those keys, a canister can authorize Bitcoin transactions without any node ever holding the full private key.

Together, these two layers give a canister the ability to receive bitcoin, check its balance, construct transactions, sign them, and broadcast them to the Bitcoin network.

## Bitcoin canister API

The Bitcoin canister exposes three main endpoints accessible through the management canister:

- `bitcoin_get_balance`: returns the balance of any Bitcoin address.
- `bitcoin_get_utxos`: returns the unspent transaction outputs (UTXOs) for a given address. This is the primary input when constructing a Bitcoin transaction.
- `bitcoin_get_current_fee_percentiles`: returns recent fee rates so a canister can estimate an appropriate miner fee.
- `bitcoin_send_transaction`: broadcasts a signed transaction to the Bitcoin network via the adapter.

A typical flow for a canister spending bitcoin is: fetch UTXOs for its address, select inputs, build the transaction, call `sign_with_ecdsa` (or `sign_with_schnorr` for Taproot) for each input, then call `bitcoin_send_transaction`.

## Bitcoin checker canister

The Bitcoin checker canister (`oltsj-fqaaa-aaaar-qal5q-cai`) screens Bitcoin addresses and transactions against the [OFAC Specially Designated Nationals (SDN) list](https://sanctionslist.ofac.treas.gov/Home/SdnList). It is used by ckBTC and any canister that wants to avoid handling funds associated with sanctioned activity.

Two primary endpoints are available:

- `check_address`: checks a single Bitcoin address against the SDN list. This is a simple lookup with no cycle cost.
- `check_transaction`: checks all input addresses of a transaction. The canister fetches the transaction and each of its inputs via HTTPS outcalls, derives the input addresses, and checks each one against the SDN list. Because of the HTTPS outcalls, at least 40 billion cycles must be attached; unused cycles are refunded. `check_transaction_str` accepts the transaction ID as a string instead of a blob.

Both endpoints return `Passed` or `Failed`. The canister itself is controlled by the NNS, so its SDN list can only be updated via a governance proposal.

## Chain-key Bitcoin (ckBTC)

ckBTC is a digital asset on ICP backed 1:1 by real bitcoin. 1 ckBTC can always be redeemed for 1 BTC and vice versa. Unlike wrapped assets, ckBTC relies on no third-party custodian: the bitcoin is held by a canister-controlled address on the Bitcoin network, and the minting and burning happen entirely onchain.

ckBTC transactions settle in seconds and cost a fraction of a satoshi, making it practical for high-frequency or low-value transfers that would be uneconomical on Bitcoin directly.

### Canisters

Two canisters run on the [pzp6e subnet](https://dashboard.internetcomputer.org/subnet/pzp6e-ekpqk-3c5x7-2h6so-njoeq-mt45d-h3h6c-q3mxf-vpeez-fez7a-iae), both controlled by the NNS root canister:

| Canister | ID |
|----------|-----|
| ckBTC minter | `mqygn-kiaaa-aaaar-qaadq-cai` |
| ckBTC ledger | `mxzaz-hqaaa-aaaar-qaada-cai` |

The **ledger** is an ICRC-1/ICRC-2 compliant digital asset ledger. It records all ckBTC balances and handles transfers. The transfer fee is 0.0000001 ckBTC (10 satoshi), sent to the minter's fee subaccount.

The **minter** manages the BTC side: it controls Bitcoin addresses, tracks UTXOs, triggers minting when deposits arrive, and signs and submits Bitcoin transactions when users withdraw.

### Converting BTC to ckBTC

1. The user calls `get_btc_address` on the minter to receive a deposit address (a P2WPKH address) tied to their principal.
2. The user sends bitcoin to that address on the Bitcoin network.
3. After 6 confirmations, the user calls `update_balance` on the minter.
4. The minter fetches UTXOs for the deposit address via `bitcoin_get_utxos` and checks each new UTXO with the Bitcoin checker canister. UTXOs that pass the check are minted as ckBTC into the user's ledger account (minus the 100-satoshi checker fee). UTXOs that fail the check are quarantined.

The 6-confirmation requirement protects against Bitcoin chain reorganizations.

### Converting ckBTC to BTC

The recommended flow uses ICRC-2 approval:

1. The user calls `icrc2_approve` on the ckBTC ledger, authorizing the minter to withdraw the desired amount.
2. The user calls `retrieve_btc_with_approval` on the minter, specifying the amount and destination Bitcoin address.
3. The minter checks the destination address with the Bitcoin checker canister. If it passes, the minter burns the ckBTC from the user's account and queues a Bitcoin withdrawal.
4. The minter periodically batches pending requests: it selects UTXOs, builds a Bitcoin transaction, signs each input using threshold ECDSA, and submits via `bitcoin_send_transaction`.

Requests are batched to reduce Bitcoin miner fees: if at least 20 requests accumulate or the oldest request is 10 minutes old, the minter creates a single transaction serving up to 100 requests.

The minimum withdrawal amount is 0.0005 BTC (50,000 satoshi) to ensure the fee remains proportionally small.

### Minter fee

The minter fee for a withdrawal transaction is `146 × inputs + 4 × outputs + 26` satoshi. This formula covers the cost of threshold ECDSA signatures and transaction broadcasting. The fee is split among all outputs in a batch transaction.

### UTXO consolidation

As deposits accumulate, the minter manages a growing set of UTXOs. Too many small UTXOs can make large withdrawals impossible (a Bitcoin transaction is limited to 100 KB). When the UTXO count exceeds 10,000, the minter periodically creates _consolidation transactions_ that merge the 1,000 smallest UTXOs into 2 new outputs, funded from the minter's fee account.

## Next steps

- [Bitcoin guide](../../guides/chain-fusion/bitcoin.md): build Bitcoin transactions from a canister
- [Dogecoin integration](dogecoin.md): Bitcoin fork integration using the same architecture
- [Chain Fusion overview](index.md): integration patterns and supported chains
- [Chain-key cryptography](../chain-key-cryptography.md): threshold ECDSA and Schnorr signing

<!-- Upstream: informed by Learn Hub articles "Bitcoin Integration", "Bitcoin Checker Canister", "Chain-Key Bitcoin" (migrated, source retired) -->
