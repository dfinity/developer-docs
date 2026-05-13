---
title: "Choose your path"
description: "Choose your development path based on what you want to build"
sidebar:
  order: 4
---

Choose your next step based on what you want to build. Each path links to the first guide you should read, with a suggested progression from there.

## Understand the platform first

If you prefer to learn the concepts before diving into guides, the [Concepts](../concepts/index.md) section explains how ICP works under the hood:

- [Network overview](../concepts/network-overview.md): how the Internet Computer is structured
- [Canisters](../concepts/canisters.md): the compute unit of ICP
- [Orthogonal persistence](../concepts/orthogonal-persistence.md): how data survives canister upgrades
- [Cycles](../concepts/cycles.md): why users don't pay to interact with apps
- [Chain-key cryptography](../concepts/chain-key-cryptography.md): the cryptographic foundation enabling chain fusion

## Coding with agents

**You want to:** Use AI coding agents to build on ICP.

ICP has a set of [ICP skills](https://skills.internetcomputer.org): structured knowledge files that AI agents can load to write canister code, debug deployments, and navigate the platform. If you work with tools like Claude Code, Cursor, or Copilot, ICP skills give them the context they need.

**Learn more:** [AI coding agents](../guides/ai-coding-agents.md)

## Backend development

**You want to:** Write canister logic: store data, call APIs, run scheduled tasks.

This is where most developers start after the quickstart. The backend guides cover the core patterns for building canister applications in Rust or Motoko.

**Start with:** [Data persistence](../guides/backends/data-persistence.md): learn how canisters store and retrieve data using stable memory and orthogonal persistence.

**Then explore:**

- [HTTPS outcalls](../guides/backends/https-outcalls.md): call external APIs from your canister
- [Timers](../guides/backends/timers.md): schedule recurring tasks
- [Randomness](../guides/backends/randomness.md): generate unpredictable values onchain
- [Calling other canisters](../guides/canister-calls/inter-canister-calls.md): compose functionality across canisters

## Fullstack applications

**You want to:** Build a web application with a frontend that talks to your canister.

ICP can serve web assets directly from canisters, giving you a tamperproof application with no external hosting required.

**Start with:** [Asset canister](../guides/frontends/asset-canister.md): deploy a frontend alongside your backend canister.

**Then explore:**

- [Framework integration](../guides/frontends/frameworks.md): use React, Vue, Svelte, or other frameworks
- [Custom domains](../guides/frontends/custom-domains.md): serve your app from your own domain name
- [Internet Identity](../guides/authentication/internet-identity.md): add passwordless authentication
- [Wallet integration](../guides/digital-assets/wallet-integration.md): connect user wallets

## Coming from Ethereum

**You know:** Solidity, EVM, smart contracts.

Here is how Ethereum concepts map to ICP:

| Ethereum | ICP | Key difference |
|----------|-----|----------------|
| Smart contract | [Canister](../concepts/canisters.md) | Canisters hold GiBs of state, serve HTTP, run Wasm |
| EVM bytecode | WebAssembly | Wasm runs general-purpose code at near-native speed |
| Solidity / Vyper | Motoko, Rust (official); TypeScript, Python (community) | Multiple language options, full standard libraries |
| Block time (~12s) | Finality (~1–2s) | Update calls typically finalize in 1–2 seconds |
| Fee (user pays) | [Cycles](../concepts/cycles.md) (canister pays) | Users interact for free; developers fund computation |
| No HTTP serving | Built-in HTTP serving | Canisters serve web pages directly |
| Offchain storage (IPFS, etc.) | Onchain stable memory | Up to 500 GiB per canister, no external storage needed |
| Bridges / oracles | [Chain-key signing](../concepts/chain-fusion/index.md), [HTTPS outcalls](../guides/backends/https-outcalls.md) | Canisters sign transactions on other chains natively; HTTPS outcalls fetch external data without oracles |
| Immutable by default | Upgradeable by default | Canisters can be upgraded while preserving state |

The biggest shift: on Ethereum, smart contracts are minimal programs that rely on offchain infrastructure. On ICP, a canister can be an entire application (frontend, backend, database, and scheduled jobs) all onchain.

## Chain fusion (cross-chain)

**You want to:** Integrate with Bitcoin, Ethereum, or other blockchains.

Chain fusion lets your canister hold native assets, sign transactions, and interact with smart contracts on other chains, without bridges or intermediaries. This is possible because ICP canisters can derive cryptographic keys and sign transactions using chain-key cryptography.

**Start with:** [Bitcoin integration](../guides/chain-fusion/bitcoin.md): read Bitcoin state and create transactions directly from a canister.

**Then explore:**

- [Ethereum integration](../guides/chain-fusion/ethereum.md): interact with EVM smart contracts and hold ETH
- [Solana integration](../guides/chain-fusion/solana.md): connect to the Solana network
- [Dogecoin integration](../guides/chain-fusion/dogecoin.md): work with Dogecoin using the same chain-key ECDSA signing as Bitcoin

## Digital assets

**You want to:** Create tokens, interact with ledgers, or build financial applications.

ICP has a standard token framework (ICRC) and chain-key tokens that represent assets from other chains. These guides cover the ledger APIs and token patterns for building payment flows, issuing digital assets, and integrating with exchanges.

**Start with:** [Ledgers](../guides/digital-assets/ledgers.md): understand ICRC token standards and interact with ledger canisters.

**Then explore:**

- [Chain-key tokens](../guides/digital-assets/chain-key-tokens.md): work with ckBTC, ckETH, and other wrapped assets
- [Rosetta API](../guides/digital-assets/rosetta.md): integrate with exchanges and wallets using the Rosetta standard

## Decentralized governance

**You want to:** Hand control of your application to a community through an SNS DAO.

The Service Nervous System (SNS) lets you tokenize your application and create a decentralized autonomous organization that governs upgrades, treasury, and parameters through proposals and voting.

**Start with:** [Launching an SNS](../guides/governance/launching.md): understand the process and requirements for decentralizing your application.

**Then explore:**

- [Managing an SNS](../guides/governance/managing.md): submit proposals and manage governance
- [Testing an SNS](../guides/governance/testing.md): validate your SNS configuration before launch

<!-- Upstream: hand-written -->
