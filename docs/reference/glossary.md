---
title: "Glossary"
description: "Definitions of ICP-specific terms: canister, cycle, principal, subnet, and more"
sidebar:
  order: 13
---

Alphabetical reference of Internet Computer Protocol (ICP) terminology.

## B

### Boundary node

A **boundary node** is a gateway server through which users access canisters running on ICP. Boundary nodes route requests to the appropriate subnet, provide geo-aware load balancing, cache certified responses, and protect subnets from DDoS attacks. The `icp0.io` domain resolves to a set of boundary nodes.

See [network overview](../concepts/network-overview.md).

## C

### Candid

**Candid** is the interface description language (IDL) used on ICP. It provides a language-agnostic way to describe canister interfaces so that canisters written in different languages (Motoko, Rust, etc.) can call each other and be called by external clients.

See [Candid specification](candid-spec.md).

### Canister

A **canister** is the smart contract unit of ICP. It bundles WebAssembly code and its associated state into a single deployable unit. Canisters process messages, hold data in stable memory, and pay for computation using cycles.

See [canisters concept](../concepts/canisters.md).

### Canister ID

A **canister ID** is a globally unique identifier for a canister on ICP, encoded in a textual form such as `ryjl3-tyaaa-aaaaa-aaaba-cai`. It is used to address the canister when sending messages or making cross-canister calls.

See [canisters concept](../concepts/canisters.md).

### CDK (Canister Development Kit)

A **CDK** is a library that provides the low-level bindings needed to write canisters in a given language. The Rust CDK (`ic-cdk`) and the Motoko compiler are the primary CDKs for ICP development.

### Chain fusion

**Chain fusion** is ICP's capability to directly interact with other blockchains — such as Bitcoin, Ethereum, and Solana — without bridges or wrapped tokens. It is built on chain-key cryptography, threshold ECDSA/Schnorr, and HTTPS outcalls.

See [chain fusion concept](../concepts/chain-fusion.md).

### Chain-key cryptography

**Chain-key cryptography** is the suite of cryptographic protocols that coordinate the nodes composing the Internet Computer. Its key innovation is that the entire ICP network has a single public key, enabling any device to verify artifacts from ICP. It underpins threshold ECDSA, threshold Schnorr, and vetKeys.

See [chain-key cryptography concept](../concepts/chain-key-cryptography.md).

### ckBTC

**ckBTC** (chain-key Bitcoin) is a fungible ICRC token on ICP backed 1:1 by Bitcoin. Each ckBTC token is redeemable for native BTC through a system of canisters that verify Bitcoin state directly using chain-key cryptography, without requiring a bridge or custodian.

See [Bitcoin integration guide](../guides/chain-fusion/bitcoin.md).

### ckETH

**ckETH** (chain-key ETH) is a fungible ICRC token on ICP backed 1:1 by Ether. It works analogously to ckBTC, enabling ICP canisters to hold and transfer ETH-equivalent value using ICRC token standards.

See [Ethereum integration guide](../guides/chain-fusion/ethereum.md).

### CMC (Cycles Minting Canister)

The **Cycles Minting Canister (CMC)** is the system canister responsible for converting ICP tokens into cycles. When a developer sends ICP to the CMC with a target canister specified, the CMC burns the ICP and credits the resulting cycles to that canister.

See [system canisters](system-canisters.md).

### Composite query

A **composite query** is a query call that can itself make query calls to other canisters on the same subnet. Composite queries allow aggregating data across multiple canisters without an update call, while still not persisting state changes.

See [canisters concept](../concepts/canisters.md).

### Controller

A **controller** is a principal that has administrative authority over a canister. Controllers can upgrade the canister's Wasm module, change settings, add or remove other controllers, and delete the canister. A canister with no controllers has immutable code.

See [canister lifecycle guide](../guides/canister-management/lifecycle.md).

### Cycle

A **cycle** is the unit of computation cost on ICP. Canisters pay for CPU, memory, storage, and network bandwidth in cycles. ICP tokens are converted to cycles at a rate pegged to XDR (one trillion cycles = 1 XDR). Unlike gas on other blockchains, cycles are held by the canister itself (reverse gas model).

See [cycles costs reference](cycles-costs.md) and [cycles management guide](../guides/canister-management/cycles-management.md).

## D

### Dapp

A **dapp** (decentralized application) is a software program that runs on a decentralized network rather than a single computer. On ICP, dapps are composed of one or more canister smart contracts that store both code and state onchain. Because canisters are hosted on ICP's decentralized subnet infrastructure, dapps can serve web content and process user requests without relying on a centralized server.

See [canisters concept](../concepts/canisters.md).

### Delegation

A **delegation** is a signed certificate that allows one identity to act on behalf of another for a limited time or scope. Internet Identity uses delegation chains to let users authenticate to dapps without exposing their device key directly.

See [Internet Identity guide](../guides/authentication/internet-identity.md).

## E

### ECDSA (Elliptic Curve Digital Signature Algorithm)

**ECDSA** is the signature scheme used by Bitcoin and Ethereum. ICP supports **threshold ECDSA**, which allows a subnet of nodes to collaboratively produce ECDSA signatures without any single node holding the private key. This enables ICP canisters to control Bitcoin and Ethereum addresses directly.

See [chain-key cryptography concept](../concepts/chain-key-cryptography.md).

## H

### Heartbeat

A **heartbeat** is a periodic system callback invoked on a canister by the ICP runtime at approximately every consensus round. Heartbeats are implemented as a `canister_heartbeat` system function and consume cycles even when idle. Timers are the preferred alternative for most scheduling needs.

See [timers concept](../concepts/timers.md).

### HTTPS outcalls

**HTTPS outcalls** are a capability that allows ICP canisters to make HTTP requests to external web servers directly, without oracles or other intermediaries. When a canister makes an HTTPS outcall, all replicas in the subnet independently send the same request to the target server; the results are normalized by a transform function and consensus is reached on a single response to return to the canister. HTTPS outcalls support `GET`, `HEAD`, and `POST` methods.

See [HTTPS outcalls concept](../concepts/https-outcalls.md).

## I

### ICP (token)

**ICP** is the native utility token of the Internet Computer. It is used to participate in governance by locking ICP into neurons, to pay for node provider rewards, and to purchase cycles for canister computation.

### ICRC

**ICRC** (Internet Computer Request for Comments) is the standard-setting process for fungible and non-fungible token interfaces on ICP. ICRC-1 defines the base fungible token standard; ICRC-2 adds approve/transfer-from semantics; ICRC-7 covers NFTs. All chain-key tokens (ckBTC, ckETH) use ICRC standards.

See [token standards reference](token-standards.md).

### Ingress message

An **ingress message** is a message sent from a user (or external client) to a canister. Ingress messages are signed with the sender's private key, submitted to a boundary node or replica, and processed as either query or update calls.

### Internet Identity

**Internet Identity** is ICP's privacy-preserving authentication service. It uses WebAuthn device credentials (Face ID, Touch ID, hardware security keys) to create anonymous, per-dapp identities without passwords. Each dapp receives a different pseudonymous principal, preventing cross-service tracking.

See [Internet Identity guide](../guides/authentication/internet-identity.md) and [Internet Identity specification](internet-identity-spec.md).

## M

### Management canister

The **management canister** is a virtual system canister (`aaaaa-aa`) that exposes the ICP system API. Canisters call the management canister to create and delete other canisters, install and upgrade Wasm modules, deposit cycles, and access chain-key signing endpoints.

See [management canister reference](management-canister.md).

### Motoko

**Motoko** is a programming language designed specifically for ICP. It features actor-based concurrency, automatic orthogonal persistence, and direct support for ICP system features like stable variables, timers, and heartbeats. Motoko compiles to WebAssembly.

See the [Motoko language documentation](../languages/motoko/index.md).

## N

### Neuron

A **neuron** is a governance participant created by locking ICP tokens in the NNS governance canister for a configurable dissolve delay. Neurons can submit and vote on NNS proposals. Voting power scales with the amount staked, the dissolve delay (up to 8 years), and the neuron's age. Neurons that vote earn rewards distributed as maturity, which can be converted to ICP or merged back into the stake.

See [governance concept](../concepts/governance.md).

### NNS (Network Nervous System)

The **Network Nervous System (NNS)** is the on-chain governance system that controls the Internet Computer. It is implemented as a set of system canisters and manages subnet topology, protocol upgrades, node onboarding, and token economics. ICP holders vote by locking tokens into neurons.

See [governance concept](../concepts/governance.md).

### Node

A **node** is a physical server operated by an independent node provider that runs the ICP replica software. Nodes are organized into subnets and collectively execute canister code through consensus.

See [network overview](../concepts/network-overview.md).

## O

### Orthogonal persistence

**Orthogonal persistence** is the property that a canister's heap memory persists automatically across message executions without the developer explicitly saving or loading state. On ICP, heap memory survives normal message processing but is cleared on canister upgrades; **stable memory** persists through upgrades.

See [orthogonal persistence concept](../concepts/orthogonal-persistence.md).

## P

### PocketIC

**PocketIC** is a deterministic, lightweight testing environment for ICP canisters. It allows developers to write integration tests that run locally without a full replica, supporting multi-canister setups, time manipulation, and cross-subnet testing.

See [PocketIC testing guide](../guides/testing/pocket-ic.md).

### Principal

A **principal** is an authenticated identity on ICP. Principals can represent users (identified by their public key), canisters (identified by their canister ID), or anonymous callers. Every message on ICP carries a caller principal, which canisters can inspect for access control.

See [canisters concept](../concepts/canisters.md).

## Q

### Query call

A **query call** is a read-only call to a canister that does not go through consensus, returns a response quickly, and does not modify canister state. Query calls are cheap and fast but their responses are not certified unless the canister uses certified variables.

See [canisters concept](../concepts/canisters.md).

## R

### Replica

The **replica** is the software stack that runs on each ICP node. It implements the four-layer protocol: peer-to-peer, consensus, message routing, and execution. Every replica in a subnet maintains an identical copy of the subnet's canister state.

See [network overview](../concepts/network-overview.md).

### Reverse gas model

The **reverse gas model** is ICP's approach to computation costs: canisters pre-load cycles and pay for their own execution, rather than having callers pay per transaction. This means users can interact with dapps without holding any tokens.

See [reverse gas model concept](../concepts/reverse-gas-model.md).

## S

### Schnorr

**Schnorr** signatures are a digital signature scheme. ICP supports **threshold Schnorr**, enabling canisters to sign with Schnorr keys shared across a subnet. This is used for Bitcoin Taproot transactions and Solana integration.

See [chain-key cryptography concept](../concepts/chain-key-cryptography.md).

### SNS (Service Nervous System)

A **Service Nervous System (SNS)** is a DAO (decentralized autonomous organization) framework for ICP dapps. It lets a dapp hand control to a community of token holders who govern upgrades and settings through on-chain proposals and voting, modeled after the NNS.

See [SNS launch guide](../guides/governance/launching.md).

### Stable memory

**Stable memory** is a separate, 64-bit memory region in a canister that persists through upgrades. While heap memory is cleared during an upgrade, stable memory survives, making it suitable for storing long-lived data. In Rust, it is accessed through stable data structures such as `StableBTreeMap` from the `ic-stable-structures` crate; in Motoko, it is managed automatically via the `stable` variable keyword. At the protocol level it is backed by the `ic0.stable_*` system API.

See [orthogonal persistence concept](../concepts/orthogonal-persistence.md).

### Subnet

A **subnet** is a group of nodes that collectively run a shared instance of the ICP consensus protocol and host a set of canisters. Each subnet maintains its own blockchain. Subnets communicate with each other using chain-key cryptography.

See [subnet types reference](subnet-types.md) and [network overview](../concepts/network-overview.md).

## T

### Timer

A **timer** is a scheduled callback that a canister registers to be invoked at a future time or on a recurring interval. Timers are implemented via the `ic0.global_timer_set` system API (and wrapped in `ic-cdk-timers` for Rust / the `Timer` module in Motoko). They are the preferred alternative to heartbeats for most scheduling needs.

See [timers concept](../concepts/timers.md).

### Update call

An **update call** is a call to a canister that can modify state. Update calls go through consensus on the subnet and are therefore slower than query calls (typically 1–2 seconds), but their results are certified and state changes are permanent.

See [canisters concept](../concepts/canisters.md).

## V

### VetKeys

**VetKeys** (Verifiably Encrypted Threshold Keys) is an ICP protocol that enables threshold key derivation and encryption without any single node ever holding a plaintext private key. It allows canisters to derive per-user or per-secret keys for onchain encryption, IBE (identity-based encryption), and other advanced cryptographic use cases.

See [vetKeys concept](../concepts/vetkeys.md).

## W

### Wasm (WebAssembly)

**Wasm** (WebAssembly) is the binary instruction format to which canister code is compiled before deployment. ICP's execution environment runs Wasm modules for all canisters regardless of the source language (Motoko, Rust, etc.). ICP extends standard Wasm with the `ic0` system API.

## Next steps

- Explore [concepts](../concepts/index.md) for in-depth explanations of ICP fundamentals.
- Browse the [reference](index.md) section for specifications and technical details.
- Check [guides](../guides/index.md) for task-oriented how-to content.

<!-- Upstream: informed by dfinity/portal — docs/references/glossary.mdx -->
