---
title: "Concepts"
description: "Developer-focused explanations of ICP architecture, capabilities, and design decisions"
sidebar:
  hidden: true
---

Understand the ideas behind the Internet Computer before you build on it. These explanations cover architecture, capabilities, and design decisions that shape how you write ICP applications.

## Network

- **[Overview](network-overview.md)**: Subnets, nodes, consensus, and boundary nodes.
- **[Node infrastructure](node-infrastructure.md)**: How ICP nodes are structured: IC-OS, virtual machine isolation, and Trusted Execution Environments.
- **[Edge infrastructure](edge-infrastructure.md)**: How requests reach ICP canisters: API boundary nodes, HTTP gateways, and asset certification.
- **[Evolution & scaling](evolution-scaling.md)**: How ICP scales horizontally through subnet creation and upgrades its protocol without forks.

## Protocol Stack

- **[Overview](protocol/index.md)**: The four-layer architecture and how the layers interact.
- **[Peer-to-peer](protocol/peer-to-peer.md)**: How replicas discover each other and exchange artifacts.
- **[Consensus](protocol/consensus.md)**: How subnets agree on the order of messages.
- **[Message routing](protocol/message-routing.md)**: How messages are delivered to canisters after consensus.
- **[Execution](protocol/execution.md)**: How the Wasm runtime processes messages and manages canister state.
- **[State synchronization](protocol/state-synchronization.md)**: How replicas catch up after falling behind.
- **[Performance](protocol/performance.md)**: Throughput benchmarks and performance characteristics.

## Canisters & capabilities

- **[Canisters](canisters.md)**: Programs that run WebAssembly, hold state, serve HTTP, and pay for their own compute.
- **[Principals](principals.md)**: The identity model: who can call a canister, and how caller identity works.
- **[Application architecture](../getting-started/app-architecture.md)**: How ICP applications are structured: canisters, frontends, and inter-canister communication.
- **[Cycles](cycles.md)**: How canisters pay for their own compute, storage, and bandwidth, and why users pay nothing.
- **[Orthogonal persistence](orthogonal-persistence.md)**: How canister memory survives across executions and upgrades without databases.
- **[Timers](timers.md)**: Periodic and one-shot scheduled tasks via the global timer mechanism.
- **[Verifiable randomness](verifiable-randomness.md)**: Cryptographically secure random numbers using threshold VRF.
- **[HTTPS outcalls](https-outcalls.md)**: How canisters make HTTP requests to external services with consensus on responses.

## Cryptography

- **[Chain-key cryptography](chain-key-cryptography.md)**: Threshold signatures that enable crosschain integration, fast finality, and chain evolution.
- **[Certified data](certified-data.md)**: How canisters certify query responses using the subnet's threshold BLS key.
- **[VetKeys](vetkeys.md)**: Verifiable encrypted threshold key derivation for network-enforced encryption and secret management.

## Chain Fusion

- **[Chain Fusion](chain-fusion/index.md)**: How ICP connects to Bitcoin, Ethereum, Solana, and other blockchains natively.
- **[Bitcoin integration](chain-fusion/bitcoin.md)**: Native Bitcoin support via the Bitcoin canister and chain-key ECDSA.
- **[Ethereum integration](chain-fusion/ethereum.md)**: EVM chain integration via HTTPS outcalls, chain-key ECDSA, and the EVM RPC canister.
- **[Solana integration](chain-fusion/solana.md)**: Solana integration via the SOL RPC canister and chain-key Schnorr signatures.
- **[Dogecoin integration](chain-fusion/dogecoin.md)**: Dogecoin support using the same architecture as Bitcoin integration.
- **[Chain-key tokens](chain-fusion/chain-key-tokens.md)**: Trustless 1:1 representations of external chain assets on ICP (ckBTC, ckETH, and more).
- **[Exchange rate canister](chain-fusion/exchange-rate-canister.md)**: On-chain oracle for cryptocurrency and fiat exchange rates.

## Trust & governance

- **[Governance](governance.md)**: The NNS, SNS for app governance, neurons, and proposals.
- **[SNS framework](sns-framework.md)**: How the Service Nervous System works: architecture, launch process, neurons, and governance.
- **[Network economics](network-economics.md)**: ICP native asset uses, voting rewards, supply dynamics, and SNS asset configuration.
- **[Ledgers](ledgers.md)**: How ICRC and ICP ledgers work, address formats, and scaling architecture.
- **[Security model](security.md)**: Canister isolation, trust boundaries, and the threat model for app developers.
