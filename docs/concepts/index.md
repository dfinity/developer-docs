---
title: "Concepts"
description: "Developer-focused explanations of ICP architecture, capabilities, and design decisions"
sidebar:
  hidden: true
---

Understand the ideas behind the Internet Computer before you build on it. These explanations cover architecture, capabilities, and design decisions that shape how you write ICP applications.

## Architecture

- **[Network Overview](network-overview.md)**: Subnets, nodes, consensus, and boundary nodes.
- **[Application Architecture](app-architecture.md)**: How ICP applications are structured: canisters, frontends, and inter-canister communication.
- **[Canisters](canisters.md)**: Smart contracts that run WebAssembly, hold state, serve HTTP, and pay for their own compute.

## Core capabilities

- **[Reverse Gas Model](reverse-gas-model.md)**: Why users never pay gas: canisters pay cycles for compute, storage, and bandwidth.
- **[Orthogonal Persistence](orthogonal-persistence.md)**: How canister memory survives across executions and upgrades without databases.
- **[HTTPS Outcalls](https-outcalls.md)**: How canisters make HTTP requests to external services with consensus on responses.
- **[Onchain Randomness](onchain-randomness.md)**: Cryptographically secure random numbers using threshold VRF.
- **[Timers](timers.md)**: Periodic and one-shot scheduled tasks via the global timer mechanism.

## Cryptography and cross-chain

- **[Chain-Key Cryptography](chain-key-cryptography.md)**: Threshold signatures that enable cross-chain integration, fast finality, and chain evolution.
- **[Chain Fusion](chain-fusion.md)**: How ICP connects to Bitcoin, Ethereum, Solana, and other blockchains natively.
- **[VetKeys](vetkeys.md)**: Verifiable encrypted threshold key derivation for onchain encryption and secret management.

## Trust and governance

- **[Security Model](security.md)**: Canister isolation, trust boundaries, and the threat model for app developers.
- **[Governance](governance.md)**: The NNS, SNS for app governance, neurons, and proposals.
