---
title: "Choose Your Path"
description: "Choose your development path based on what you want to build"
sidebar:
  order: 3
---

Choose your next step based on what you want to build. Each path links to the first guide you should read, with a suggested progression from there. Not sure where to start? Most developers begin with [backend development](#backend-development).

## Understand the platform first

If you prefer to learn the concepts before diving into guides, the [Concepts](../concepts/index.md) section explains how ICP works under the hood:

- [Network overview](../concepts/network-overview.md): how the Internet Computer is structured
- [Canisters](../concepts/canisters.md): the compute unit of ICP
- [Orthogonal persistence](../concepts/orthogonal-persistence.md): how data survives canister upgrades
- [Reverse gas model](../concepts/reverse-gas-model.md): why users don't pay gas fees
- [Chain-key cryptography](../concepts/chain-key-cryptography.md): the cryptographic foundation enabling chain fusion

## Backend development

**You want to:** Write canister logic: store data, call APIs, run scheduled tasks.

This is where most developers start after the quickstart. The backend guides cover the core patterns for building canister applications in Rust or Motoko.

**Start with:** [Data persistence](../guides/backends/data-persistence.md): learn how canisters store and retrieve data using stable memory and orthogonal persistence.

**Then explore:**

- [HTTPS outcalls](../guides/backends/https-outcalls.md): call external APIs from your canister
- [Timers](../guides/backends/timers.md): schedule recurring tasks
- [Randomness](../guides/backends/randomness.md): generate unpredictable values onchain
- [Calling other canisters](../guides/canister-calls/onchain-calls.md): compose functionality across canisters

## Full-stack applications

**You want to:** Build a web application with a frontend that talks to your canister.

ICP can serve web assets directly from canisters, giving you a tamperproof application with no external hosting required.

**Start with:** [Asset canister](../guides/frontends/asset-canister.md): deploy a frontend alongside your backend canister.

**Then explore:**

- [Framework integration](../guides/frontends/frameworks.md): use React, Vue, Svelte, or other frameworks
- [Custom domains](../guides/frontends/custom-domains.md): serve your app from your own domain name
- [Internet Identity](../guides/authentication/internet-identity.md): add passwordless authentication
- [Wallet integration](../guides/defi/wallet-integration.md): connect user wallets

## Chain fusion (cross-chain)

**You want to:** Integrate with Bitcoin, Ethereum, or other blockchains.

Chain fusion lets your canister hold native assets, sign transactions, and interact with smart contracts on other chains, without bridges or intermediaries. This is possible because ICP canisters can derive cryptographic keys and sign transactions using chain-key cryptography.

**Start with:** [Bitcoin integration](../guides/chain-fusion/bitcoin.md): read Bitcoin state and create transactions directly from a canister.

**Then explore:**

- [Ethereum integration](../guides/chain-fusion/ethereum.md): interact with EVM smart contracts and hold ETH
- [Solana integration](../guides/chain-fusion/solana.md): connect to the Solana network
- [Dogecoin integration](../guides/chain-fusion/dogecoin.md): work with Dogecoin using the same chain-key ECDSA signing as Bitcoin

## DeFi and tokens

**You want to:** Create tokens, interact with ledgers, or build financial applications.

ICP has a standard token framework (ICRC) and chain-key tokens that represent assets from other chains. These guides cover the ledger APIs and token patterns you need for DeFi.

**Start with:** [Token ledgers](../guides/defi/token-ledgers.md): understand ICRC token standards and interact with ledger canisters.

**Then explore:**

- [Chain-key tokens](../guides/defi/chain-key-tokens.md): work with ckBTC, ckETH, and other wrapped assets
- [Rosetta API](../guides/defi/rosetta.md): integrate with exchanges and wallets using the Rosetta standard

## Decentralized governance

**You want to:** Hand control of your application to a community through an SNS DAO.

The Service Nervous System (SNS) lets you tokenize your application and create a decentralized autonomous organization that governs upgrades, treasury, and parameters through proposals and voting.

**Start with:** [Launching an SNS](../guides/governance/launching.md): understand the process and requirements for decentralizing your application.

**Then explore:**

- [Managing an SNS](../guides/governance/managing.md): submit proposals and manage governance
- [Testing an SNS](../guides/governance/testing.md): validate your SNS configuration before launch

## AI-assisted development

**You want to:** Use AI coding agents to build on ICP.

ICP has a set of [ICP skills](https://skills.internetcomputer.org): structured knowledge files that AI agents can load to write canister code, debug deployments, and navigate the platform. If you work with tools like Claude Code, Cursor, or Copilot, ICP skills give them the context they need.

**Learn more:** [AI coding agents](../guides/tools/ai-coding-agents.md)

<!-- Upstream: hand-written -->
