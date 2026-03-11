---
title: "Application Canisters"
description: "EVM RPC, SNS Wasm, and other notable application-level canisters on ICP"
sidebar:
  order: 5
doc_type: reference
level: intermediate
last_verified: 2026-03-10
---

Application canisters are deployed on regular ICP subnets by DFINITY or community teams. Unlike system and protocol canisters, they pay for their own cycles and do not require NNS proposals for upgrades (unless managed by an SNS).

This page lists well-known application canisters that developers commonly interact with.

## Quick reference

| Canister | Canister ID | Maintainer |
|----------|-------------|------------|
| EVM RPC | `7hfb6-caaaa-aaaar-qadga-cai` | DFINITY |
| NNS Dapp (frontend) | `qoctq-giaaa-aaaaa-aaaea-cai` | DFINITY |

---

## EVM RPC Canister

**Canister ID:** [`7hfb6-caaaa-aaaar-qadga-cai`](https://dashboard.internetcomputer.org/canister/7hfb6-caaaa-aaaar-qadga-cai)

**Maintainer:** DFINITY

The EVM RPC canister enables canisters on ICP to make JSON-RPC calls to Ethereum and other EVM-compatible chains (Arbitrum, Optimism, Base, etc.) without running your own RPC nodes. It uses HTTPS outcalls under the hood and aggregates responses from multiple RPC providers for reliability.

**Common operations:**

- Call `eth_getBalance`, `eth_call`, `eth_sendRawTransaction`, and other standard JSON-RPC methods
- Interact with EVM smart contracts from ICP canisters
- Read EVM chain state (block numbers, logs, receipts)

**Example — call from Rust:**

```rust
use ic_cdk::api::call::call;
use candid::Principal;

let evm_rpc = Principal::from_text("7hfb6-caaaa-aaaar-qadga-cai").unwrap();

// Example: get ETH balance
let (result,): (Result<String, String>,) = call(
    evm_rpc,
    "eth_getBalance",
    (
        "ethereum",       // chain
        "0xAbC123...",    // address
        "latest",         // block tag
    ),
).await.unwrap();
```

**Source:** [EVM RPC canister repository](https://github.com/dfinity/evm-rpc-canister)

---

## NNS Dapp

**Canister ID:** [`qoctq-giaaa-aaaaa-aaaea-cai`](https://dashboard.internetcomputer.org/canister/qoctq-giaaa-aaaaa-aaaea-cai)

**Maintainer:** DFINITY

The NNS Dapp is the web frontend for the Network Nervous System. Users interact with it to manage neurons, vote on proposals, and participate in SNS launches. It is deployed as an asset canister serving a web application.

While developers do not typically call this canister programmatically, it demonstrates a production-grade ICP web application.

**Access:** [https://nns.ic0.app](https://nns.ic0.app)

**Source:** [NNS Dapp repository](https://github.com/dfinity/nns-dapp)

---

## OISY Wallet

**Maintainer:** DFINITY

OISY is a multi-chain wallet running entirely on ICP. It supports ICP, Bitcoin, Ethereum, and ERC-20 tokens through a browser-based interface with no extensions required.

**Access:** [https://oisy.com](https://oisy.com)

**Source:** [OISY repository](https://github.com/dfinity/oisy-wallet)

---

## Community canisters

The ICP ecosystem includes many community-built canisters. Some notable categories:

- **DeFi protocols** — DEXes, lending platforms, and stablecoin canisters
- **NFT marketplaces** — canister-based NFT minting and trading
- **Social platforms** — decentralized messaging and social networking
- **Developer tooling** — logging, monitoring, and analytics canisters

You can discover canisters by browsing the [ICP Dashboard](https://dashboard.internetcomputer.org/) or community directories.

---

## Deploying your own application canister

To deploy a new application canister to mainnet:

```bash
# Deploy to mainnet
icp deploy -e ic

# Check canister status
icp canister status <your-canister-id> -n ic
```

Application canisters can be upgraded by their controllers at any time. For community-governed upgrades, consider launching an [SNS](https://learn.internetcomputer.org/hc/en-us/articles/34084394684564-SNS-Service-Nervous-System) to decentralize control.
