---
title: "Protocol Canisters"
description: "Internet Identity, Bitcoin, Exchange Rate, and other protocol-level canisters with their canister IDs"
sidebar:
  order: 4
doc_type: reference
level: intermediate
last_verified: 2026-03-10
---

Protocol canisters extend ICP's capabilities beyond the core protocol. They are managed by NNS governance proposals and run on system subnets, but they serve higher-level functions such as authentication, blockchain integration, and pricing data.

## Quick reference

| Canister | Canister ID | Subnet |
|----------|-------------|--------|
| Internet Identity | `rdmx6-jaaaa-aaaaa-aaadq-cai` | System |
| Bitcoin Mainnet | `ghsi2-tqaaa-aaaan-aaaca-cai` | Bitcoin |
| Bitcoin Testnet | `g4xu7-jiaaa-aaaan-aaaaq-cai` | Bitcoin |
| Cycles Ledger | `um5iw-rqaaa-aaaaq-qaaba-cai` | System |
| Cycles Index | `ul4oc-4iaaa-aaaaq-qaabq-cai` | System |
| Exchange Rate (XRC) | `uf6dk-hyaaa-aaaaq-qaaaq-cai` | System |

---

## Internet Identity

**Canister ID:** [`rdmx6-jaaaa-aaaaa-aaadq-cai`](https://dashboard.internetcomputer.org/canister/rdmx6-jaaaa-aaaaa-aaadq-cai)

Internet Identity (II) provides passwordless authentication for ICP applications using WebAuthn and passkeys. Each user gets a unique principal per application origin, preventing cross-app tracking.

**How developers use it:**

- Integrate the II authentication flow in your frontend using the [auth-client](https://github.com/dfinity/agent-js/tree/main/packages/auth-client) library.
- Validate `ic_cdk::caller()` in your backend to authenticate users.
- Each user's principal is derived from their II anchor and your canister's frontend origin.

**For local development:**

Add Internet Identity as a dependency in your `icp.yaml` with its canister ID (`rdmx6-jaaaa-aaaaa-aaadq-cai`). The local replica will use the configured canister for authentication flows.

**Specification:** [Internet Identity specification](https://internetcomputer.org/docs/references/ii-spec)

---

## Bitcoin Mainnet

**Canister ID:** [`ghsi2-tqaaa-aaaan-aaaca-cai`](https://dashboard.internetcomputer.org/canister/ghsi2-tqaaa-aaaan-aaaca-cai)

The Bitcoin mainnet canister connects ICP to the Bitcoin mainnet. It maintains a local copy of the Bitcoin UTXO set and enables canisters to read Bitcoin state and submit transactions.

Developers typically interact with Bitcoin through the **management canister** API rather than calling this canister directly:

- `bitcoin_get_balance` — query BTC balance for an address
- `bitcoin_get_utxos` — retrieve UTXOs for an address
- `bitcoin_send_transaction` — broadcast a signed transaction
- `bitcoin_get_current_fee_percentiles` — get fee estimates

**Example — get balance:**

```rust
use ic_cdk::api::management_canister::bitcoin::{
    bitcoin_get_balance, GetBalanceRequest, BitcoinNetwork,
};

let balance = bitcoin_get_balance(GetBalanceRequest {
    address: "bc1q...".to_string(),
    network: BitcoinNetwork::Mainnet,
    min_confirmations: Some(6),
}).await.unwrap().0;
```

**Specification:** [Bitcoin canister specification](https://github.com/dfinity/bitcoin-canister/blob/master/INTERFACE_SPECIFICATION.md)

---

## Bitcoin Testnet

**Canister ID:** [`g4xu7-jiaaa-aaaan-aaaaq-cai`](https://dashboard.internetcomputer.org/canister/g4xu7-jiaaa-aaaan-aaaaq-cai)

Same API as the Bitcoin mainnet canister, connected to the Bitcoin testnet. Use `BitcoinNetwork::Testnet` in management canister calls to route requests here.

Useful for development and testing before deploying to mainnet.

---

## Cycles Ledger

**Canister ID:** [`um5iw-rqaaa-aaaaq-qaaba-cai`](https://dashboard.internetcomputer.org/canister/um5iw-rqaaa-aaaaq-qaaba-cai)

The Cycles Ledger allows principals to hold cycles directly without requiring a separate cycles wallet canister. It implements the ICRC-1 token standard for cycles.

**Common operations:**

- Query your cycles balance (`icrc1_balance_of`)
- Transfer cycles to another principal (`icrc1_transfer`)
- Create canisters with cycles from your balance

**Example — check balance:**

```bash
icp canister call um5iw-rqaaa-aaaaq-qaaba-cai icrc1_balance_of \
  '(record { owner = principal "YOUR_PRINCIPAL" })' -n ic
```

**Specification:** [Cycles Ledger specification](https://github.com/dfinity/cycles-ledger/blob/main/INTERFACE_SPECIFICATION.md)

---

## Cycles Index

**Canister ID:** [`ul4oc-4iaaa-aaaaq-qaabq-cai`](https://dashboard.internetcomputer.org/canister/ul4oc-4iaaa-aaaaq-qaabq-cai)

The Cycles Index canister indexes transactions from the Cycles Ledger, enabling efficient queries of cycles transaction history by account.

**Specification:** [Cycles Ledger specification](https://github.com/dfinity/cycles-ledger/blob/main/INTERFACE_SPECIFICATION.md)

---

## Exchange Rate Canister (XRC)

**Canister ID:** [`uf6dk-hyaaa-aaaaq-qaaaq-cai`](https://dashboard.internetcomputer.org/canister/uf6dk-hyaaa-aaaaq-qaaaq-cai)

The Exchange Rate Canister uses HTTPS outcalls to fetch real-time cryptocurrency and fiat exchange rates from multiple data sources. It aggregates prices from major exchanges and foreign exchange providers.

**Common operations:**

- Query the current exchange rate between two assets
- The CMC uses this canister to determine the ICP-to-cycles conversion rate

**How to call it:**

```bash
icp canister call uf6dk-hyaaa-aaaaq-qaaaq-cai get_exchange_rate \
  '(record { base_asset = record { symbol = "ICP"; class = variant { Cryptocurrency } }; quote_asset = record { symbol = "USD"; class = variant { FiatCurrency } } })' \
  -n ic
```

**Specification:** [Exchange Rate Canister specification](https://github.com/dfinity/exchange-rate-canister/blob/main/INTERFACE_SPECIFICATION.md)
