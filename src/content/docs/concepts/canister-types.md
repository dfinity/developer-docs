---
title: "Canister Types"
description: "System, protocol, and application canisters on ICP — what they are and when to use each"
sidebar:
  order: 3
doc_type: explanation
level: beginner
last_verified: 2026-03-10
---

ICP's architecture revolves around canisters — smart contracts that combine code and state into a single unit. Canisters fall into three categories based on who deploys and controls them, and what role they play in the network.

## Canister IDs

Every canister has a unique principal identifier (canister ID) encoded as text, such as `ryjl3-tyaaa-aaaaa-aaaba-cai`. This ID is assigned at creation time and remains stable for the canister's lifetime. Canister IDs follow the same encoding as user principals but include a specific internal tag that distinguishes them.

You can look up any canister on the [ICP Dashboard](https://dashboard.internetcomputer.org/).

## System canisters

System canisters are built into the ICP network and provide essential infrastructure. They run on the NNS subnet, pay no cycles, and are upgraded exclusively through NNS governance proposals.

Examples:

- **ICP Ledger** (`ryjl3-tyaaa-aaaaa-aaaba-cai`) — token transfers and balances
- **NNS Governance** (`rrkah-fqaaa-aaaaa-aaaaq-cai`) — proposal submission and voting
- **Cycles Minting Canister** (`rkp4c-7iaaa-aaaaa-aaaca-cai`) — converts ICP to cycles
- **SNS Wasm** (`qaa6y-5yaaa-aaaaa-aaafa-cai`) — launches SNS DAOs

See [System Canisters](/reference/system-canisters/) for the full reference table.

## Protocol canisters

Protocol canisters extend ICP's capabilities but are not part of the core protocol. They are managed by the NNS and run on system subnets. Developers interact with them through standard inter-canister calls.

Examples:

- **Internet Identity** (`rdmx6-jaaaa-aaaaa-aaadq-cai`) — authentication
- **Bitcoin Mainnet** (`ghsi2-tqaaa-aaaan-aaaca-cai`) — BTC integration
- **Cycles Ledger** (`um5iw-rqaaa-aaaaq-qaaba-cai`) — cycle balance management
- **Exchange Rate Canister** (`uf6dk-hyaaa-aaaaq-qaaaq-cai`) — real-time price feeds

See [Protocol Canisters](/reference/protocol-canisters/) for the full reference table.

## Application canisters

Application canisters are deployed by developers and community teams. They run on regular application subnets and pay for their own cycles. Some are widely used across the ecosystem.

Examples:

- **EVM RPC** (`7hfb6-caaaa-aaaar-qadga-cai`) — Ethereum JSON-RPC from ICP
- **NNS Dapp** (`qoctq-giaaa-aaaaa-aaaea-cai`) — NNS governance frontend
- Community-built DeFi, social, and tooling canisters

See [Application Canisters](/reference/application-canisters/) for notable examples.

## The management canister

The management canister (`aaaaa-aa`) is a virtual canister that does not have its own state or Wasm module. It is implemented as part of ICP itself and provides the API for all canister lifecycle operations, threshold signatures, HTTPS outcalls, randomness, and Bitcoin integration.

Every subnet responds to the management canister address. ICP routes requests to the correct subnet transparently.

See [Management Canister](/reference/management-canister/) for the full API reference.

## When to interact with each type

| Goal | Canister type | Example |
|------|--------------|---------|
| Create or manage canisters | Management canister | `create_canister`, `install_code` |
| Transfer ICP or query balances | System canister | ICP Ledger |
| Authenticate users | Protocol canister | Internet Identity |
| Read BTC balances | Protocol canister (via management canister) | Bitcoin canister |
| Call Ethereum RPCs | Application canister | EVM RPC |
| Launch a DAO | System canister | SNS Wasm |
