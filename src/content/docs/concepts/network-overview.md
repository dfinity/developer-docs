---
title: "Network Overview"
description: "ICP network topology: subnets, nodes, boundary nodes, consensus, and request routing"
sidebar:
  order: 1
doc_type: explanation
level: beginner
last_verified: 2026-03-10
---

The Internet Computer (ICP) is a decentralized network that runs canister smart contracts across globally distributed data centers. This page explains the key components of the network and how they work together.

## Nodes

ICP runs on dedicated physical machines (nodes) operated by independent **node providers** in data centers worldwide. Each node runs the ICP replica software — the implementation of the Internet Computer Protocol.

Node providers are onboarded through NNS governance proposals. The hardware and hosting requirements ensure consistent performance across the network.

## Subnets

Nodes are grouped into **subnets**, each of which is an independent blockchain that runs a set of canisters. A subnet typically consists of 13 to 40 nodes, depending on the desired replication level and security properties.

Each subnet:

- Runs its own instance of the ICP consensus protocol.
- Maintains its own chain of finalized blocks.
- Executes the canisters assigned to it independently of other subnets.

There are two types of subnets:

| Type | Purpose |
|------|---------|
| **System subnets** | Host NNS canisters and protocol canisters. Higher replication for critical infrastructure. |
| **Application subnets** | Host developer-deployed canisters. Standard replication. |

The **NNS (Network Nervous System) subnet** is a special system subnet that governs the entire network — it manages subnet membership, node assignments, protocol upgrades, and canister creation.

## Consensus

Each subnet runs a four-phase consensus protocol:

1. **Block making** — a designated block maker proposes a block of ingress messages and inter-canister messages.
2. **Notarization** — nodes validate the block and produce notarization shares.
3. **Finalization** — once enough shares are collected, the block is finalized.
4. **Execution** — the finalized block's messages are executed deterministically on all nodes.

Finality is reached in 1–2 seconds. All nodes in a subnet execute the same messages in the same order, producing identical state.

## Boundary nodes

Boundary nodes are the entry point for all external traffic into ICP. They:

- Route HTTP requests to the correct subnet based on the target canister ID.
- Verify response authenticity using ICP's chain-key cryptography (certified variables).
- Translate between standard HTTPS and the IC protocol.
- Serve the service worker and asset certification for frontend canisters.

When a user visits an ICP-hosted app at `https://<canister-id>.icp0.io`, the request hits a boundary node first.

## Request routing

A request to a canister follows this path:

1. **Client** sends an HTTPS request to a boundary node (or uses an agent library).
2. **Boundary node** identifies the target canister's subnet and forwards the request.
3. **Subnet consensus** includes the request in a block.
4. **Execution** processes the request on all subnet nodes.
5. **Response** is returned to the client, optionally with a certification proof.

For **query calls** (read-only), a single node can respond without going through consensus, which makes them faster but not certified by default.

For **update calls** (state-changing), the full consensus path is required.

## Cross-subnet communication

Canisters on different subnets communicate through **XNet (cross-subnet) messages**. When canister A on subnet 1 calls canister B on subnet 2:

1. Subnet 1 includes the outgoing message in a finalized block.
2. The XNet protocol delivers the message to subnet 2.
3. Subnet 2 processes it in its own consensus round.
4. The response travels back the same way.

This happens transparently — from the developer's perspective, inter-canister calls work the same regardless of whether the canisters are on the same subnet.

## Further reading

- [Canister Types](/concepts/canister-types/) — system, protocol, and application canisters
- [App Architecture](/concepts/app-architecture/) — how ICP applications are structured
- [IC Interface Specification](/reference/ic-interface-spec/) — the formal protocol specification
