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
- **[Canisters](canisters.md)**: Programs that run WebAssembly, hold state, serve HTTP, and pay for their own compute.
- **[Protocol Stack](protocol/index.md)**: The four-layer architecture (peer-to-peer, consensus, message routing, execution) and protocol internals including performance benchmarks.
- **[Principals](principals.md)**: The identity model: users, canisters, anonymous calls, and canister control.

## Core capabilities

- **[Cycles](cycles.md)**: How canisters pay for their own compute, storage, and bandwidth, and why users pay nothing.
- **[Orthogonal Persistence](orthogonal-persistence.md)**: How canister memory survives across executions and upgrades without databases.
- **[HTTPS Outcalls](https-outcalls.md)**: How canisters make HTTP requests to external services with consensus on responses.
- **[Verifiable Randomness](verifiable-randomness.md)**: Cryptographically secure random numbers using threshold VRF.
- **[Timers](timers.md)**: Periodic and one-shot scheduled tasks via the global timer mechanism.

## Cryptography and cross-chain

- **[Chain-Key Cryptography](chain-key-cryptography.md)**: Threshold signatures that enable cross-chain integration, fast finality, and chain evolution.
- **[Certified Data](certified-data.md)**: How canisters certify query responses using the subnet's threshold BLS key.
- **[Chain Fusion](chain-fusion/index.md)**: How ICP connects to Bitcoin, Ethereum, Solana, and other blockchains natively.
- **[VetKeys](vetkeys.md)**: Verifiable encrypted threshold key derivation for onchain encryption and secret management.

## Trust and governance

- **[Security Model](security.md)**: Canister isolation, trust boundaries, and the threat model for app developers.
- **[Governance](governance.md)**: The NNS, SNS for app governance, neurons, and proposals.
- **[Network Economics](network-economics.md)**: ICP token uses, voting rewards, supply dynamics, and SNS token economics.
- **[Ledgers](ledgers.md)**: How ICRC and ICP token ledgers work, address formats, and scaling architecture.
