---
title: "Glossary"
description: "Glossary of terms used in Internet Computer development"
sidebar:
  order: 7
doc_type: reference
level: beginner
last_verified: 2026-03-10
---

## Boundary node

A server that sits at the edge of the ICP network. Boundary nodes route HTTP requests from users to the correct subnet and verify certified responses. They also provide caching and rate limiting.

## Candid

The interface description language (IDL) for ICP. Candid defines the types and methods exposed by a canister, enabling language-agnostic communication between canisters and clients. Candid files use the `.did` extension.

## Canister

A smart contract on ICP. A canister bundles WebAssembly code and persistent state. It can serve web content, process computation, and store data. Canisters communicate via asynchronous message passing.

## Chain-key cryptography

A suite of cryptographic protocols that allow ICP subnets to produce threshold signatures, certify responses, and communicate with other blockchains. It underpins features like chain-key tokens, HTTPS outcalls, and cross-subnet messaging.

## Controller

A principal that has administrative control over a canister. Controllers can install code, update settings, start/stop, and delete the canister. A canister can have multiple controllers, including other canisters.

## Cycles

The unit of computation and storage payment on ICP. 1 trillion cycles = 1 XDR (approximately $1.33 USD). Developers convert ICP tokens into cycles to pay for canister execution and storage.

## Delegation

A mechanism where one principal authorizes another to act on its behalf. In Internet Identity, delegations allow web applications to make authenticated calls to canisters without requiring repeated user interaction.

## Freezing threshold

A canister setting that determines when a canister is frozen to prevent it from running out of cycles and being deleted. When the cycles balance is projected to drop below the threshold, execution is paused but the canister's state is preserved.

## Heartbeat

A periodic function that the ICP runtime calls on a canister at regular intervals (approximately once per second). Heartbeats are being replaced by **timers** in most use cases.

## HTTP gateway

The protocol that allows standard web browsers to access canister-hosted content over HTTPS. Boundary nodes implement the HTTP gateway specification, translating HTTP requests into canister calls and verifying certified responses.

## ICRC

Internet Computer Request for Comments. A standards process for ICP, inspired by Ethereum's ERC system. ICRC standards define token interfaces (ICRC-1, ICRC-2, ICRC-7), transaction logs (ICRC-3), and more. Standards are proposed by the community working group and adopted through NNS votes.

## Ingress message

A message sent from an external user (outside the ICP network) to a canister. Ingress messages are processed as update calls and go through consensus.

## Internet Identity

ICP's native authentication system. It uses WebAuthn and passkeys to create pseudonymous identities for users, with a different principal for each dapp to preserve privacy.

## Ledger

A canister that records token balances and transactions. The ICP ledger manages the native ICP token. ICRC ledgers manage custom tokens. Each token has its own dedicated ledger canister.

## Management canister

A virtual canister (ID: `aaaaa-aa`) that exposes the ICP system API. It provides methods for creating canisters, installing code, managing settings, and accessing special features like threshold signing and HTTPS outcalls.

## Motoko

A programming language designed for ICP canister development. Motoko features actors, orthogonal persistence, and direct Candid integration.

## Neuron

A staking mechanism in the NNS or an SNS. Users lock tokens in neurons to gain voting power on governance proposals. Neurons have configurable dissolve delays that determine voting power and reward rates.

## NNS (Network Nervous System)

The DAO that governs the ICP network. It controls subnet configuration, node onboarding, protocol upgrades, and economic parameters. NNS proposals are voted on by neuron holders.

## Orthogonal persistence

A programming model where canister state is automatically persisted across executions and upgrades. The developer writes code as if memory is permanent, without explicit save/load operations. Motoko supports this natively.

## Principal

An identifier on ICP. Every user, canister, and node has a principal. Principals are derived from public keys and encoded as text strings (e.g., `ryjl3-tyaaa-aaaaa-aaaba-cai`). They are used for authentication and access control.

## Proposal

A governance action submitted to the NNS or an SNS. Proposals are voted on by neuron holders. If adopted, the proposed action executes automatically onchain.

## Query call

A read-only canister call that executes on a single replica and returns immediately (milliseconds). Query calls do not go through consensus and cannot modify canister state. They are free of charge.

## Replica

The software that runs on each node in the ICP network. A replica executes canister code, participates in consensus, and manages the subnet's state.

## Reverse gas model

ICP's approach to transaction fees where developers pay for their application's compute and storage, rather than end users. This enables a seamless user experience without wallets or gas tokens.

## SNS (Service Nervous System)

A DAO framework for decentralizing individual dapps on ICP. An SNS gives a community of token holders governance control over a dapp through proposals and voting.

## Stable memory

A separate memory region (up to ~400 GiB) available to each canister that persists across upgrades. Unlike the Wasm heap (up to 4 GiB), stable memory is not affected by code reinstallation.

## Subnet

A group of nodes that run consensus together and host a set of canisters. ICP consists of many subnets operating in parallel. Each subnet processes its canisters independently, and cross-subnet communication happens via certified messages.

## System canister

A canister maintained by the NNS that provides core infrastructure. Examples include the NNS governance canister, the ICP ledger, Internet Identity, and the cycles minting canister.

## Threshold signature

A signature produced collaboratively by multiple nodes in a subnet, where no single node holds the full signing key. ICP supports threshold ECDSA and threshold Schnorr signatures, enabling canisters to sign transactions on other blockchains (Bitcoin, Ethereum, etc.).

## Timer

A mechanism for scheduling future canister executions. Timers replace heartbeats for most periodic task use cases and offer more control over execution frequency.

## Trap

An abnormal termination of canister execution. Traps can result from WebAssembly errors (out-of-bounds access, division by zero) or explicit calls to `ic0.trap`. A trapped message's state changes are rolled back.

## Update call

A state-changing canister call that goes through consensus. Update calls are processed by all replicas in the subnet and typically finalize in 1-2 seconds. They cost cycles.

## VetKeys

An upcoming ICP feature for verifiably encrypted threshold key derivation. VetKeys will enable onchain encryption, decryption, and key management without exposing private keys.

## Wasm module

The compiled WebAssembly binary that contains a canister's executable code. Canister code written in Motoko, Rust, or other languages is compiled to Wasm for deployment on ICP.

## WebAuthn

A W3C standard for passwordless authentication using hardware security keys, biometrics, or platform authenticators. Internet Identity uses WebAuthn to provide secure, device-bound authentication for ICP users.
