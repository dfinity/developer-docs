---
title: "Network Overview"
description: "How the Internet Computer works: subnets, nodes, consensus, and boundary nodes"
sidebar:
  order: 1
icskills: []
---

The Internet Computer (ICP) is a network of independent blockchains called **subnets** that run smart contracts ([canisters](canisters.md)) at web speed. From a developer's perspective, the key things to understand are how your code gets replicated, how fast it runs, and how requests reach it.

## Subnets

A subnet is a group of nodes that run their own instance of the ICP consensus protocol. Each subnet maintains its own blockchain, executes canisters, and produces blocks independently of other subnets.

When you deploy a canister, it lands on one subnet and is replicated across every node in that subnet. This replication is what makes canisters tamperproof — a single node cannot unilaterally change a canister's state.

### What subnets mean for developers

- **Parallelism.** Subnets run in parallel, so the network scales by adding more subnets. Your canister's performance depends on its subnet's load, not the network's total load.
- **Cross-subnet calls.** Canisters on different subnets can call each other through the network's messaging layer. These calls are slightly slower than calls within the same subnet (they require an extra consensus round), but they work transparently — you don't need to know which subnet a canister lives on.
- **Subnet size and cost.** Subnets typically range from 13 to 40 nodes. Larger subnets provide stronger security guarantees (more nodes must collude to compromise state) but cost more cycles to run on. Most application canisters run on 13-node subnets.
- **Finality.** ICP achieves finality in 1–2 seconds. Once your update call returns, the state change is committed and replicated — there are no probabilistic confirmations or reorgs.
- **Geographic distribution.** Nodes within a subnet are distributed across data centers, operators, and jurisdictions to maximize decentralization. Localized subnets also exist for applications with data residency requirements.

For details on subnet types and how to choose one, see [Subnet types](../reference/subnet-types.md) and [Subnet selection](../guides/canister-management/subnet-selection.md).

## Nodes

Each physical machine in the network is a **node**. Nodes run software called the **replica**, which implements the ICP protocol stack: consensus, message routing, execution, and state management.

Nodes are owned by **node providers** — independent entities who operate the hardware. Node providers are voted into the network by the governance system (NNS) and must meet specific hardware requirements. This process, called **deterministic decentralization**, ensures that subnet membership is diverse across operators, geographies, and jurisdictions.

As a developer, you don't interact with individual nodes directly. The protocol abstracts them away — you deploy to a subnet, and the network handles replication across its nodes.

## Consensus

Each subnet runs a four-phase consensus protocol:

1. **Block making.** A designated block maker proposes a block of messages to execute.
2. **Notarization.** A threshold of nodes validates and signs the proposed block.
3. **Finalization.** Once a notarized block has no competing blocks, it is finalized.
4. **Execution.** All nodes execute the messages in the finalized block deterministically, reaching the same resulting state.

This produces one block per round (approximately every 1 second). Update calls achieve the rapid finality described above because there is no need to wait for multiple block confirmations.

Query calls skip consensus entirely: a single node handles the request and returns its local state, which is why queries are fast (milliseconds) but provide weaker authenticity guarantees than update calls.

For a deeper dive into the consensus protocol and other protocol internals, see the [Learn Hub](https://learn.internetcomputer.org).

## Boundary nodes

Boundary nodes are the entry point for all external traffic to ICP. They serve two purposes:

1. **HTTP gateway.** When a user's browser requests `https://<canister-id>.icp0.io`, a boundary node translates that HTTP request into a canister message, routes it to the correct subnet, and returns the response.
2. **API endpoint.** Agent libraries (like [`@icp-sdk/core/agent`](https://js.icp.build) in JavaScript) send ingress messages to boundary nodes, which forward them to the target canister's subnet.

Boundary nodes also cache query responses and provide TLS termination. They are not part of consensus and cannot modify canister state — they are routing infrastructure.

From a developer's perspective, boundary nodes are mostly transparent. You interact with them through the standard agent libraries or icp-cli, and they handle the routing. The main thing to be aware of is that query responses pass through a boundary node, which is why [certified variables](../guides/backends/certified-variables.md) exist for applications that need authenticated query results.

## How it all fits together

Here is the path of a typical request:

1. A user's browser sends an HTTPS request to a boundary node.
2. The boundary node looks up which subnet hosts the target canister and forwards the message.
3. For update calls: the subnet's consensus protocol includes the message in a block, all nodes execute it, and the subnet signs the response. For query calls: a single node executes the call and returns the result — query responses are not threshold-signed by the subnet, so they should be treated as unverified unless the canister uses [certified variables](../guides/backends/certified-variables.md).
4. The boundary node returns the response to the user.

The entire flow — from user request to signed response — completes within the finality window described above for updates, and under 100 milliseconds for queries.

## Chain-key cryptography

Each subnet has a single public key, but no individual node holds the corresponding private key. Instead, the key is split into shares distributed across the subnet's nodes using **threshold cryptography**. Nodes collectively sign responses without ever reconstructing the full key.

This means verifying a response from ICP only requires checking one signature against one public key — regardless of how many nodes are in the subnet. It also enables canisters to sign transactions on other blockchains (Bitcoin, Ethereum, and others) directly, without bridges or oracles.

For more on this, see [Chain-key cryptography](chain-key-cryptography.md).

## Governance

The network is governed by the **Network Nervous System (NNS)**, a DAO implemented as a set of canisters on ICP itself. All operational changes — protocol upgrades, subnet creation, node onboarding — go through NNS proposals and voting. This eliminates hard forks: approved upgrades are executed automatically.

Individual applications can also be governed by a **Service Nervous System (SNS)**, which applies the same DAO model at the application level. See [Governance](governance.md) for details.

## What's next

- [Canisters](canisters.md) — what runs on the network
- [App architecture](app-architecture.md) — how applications use subnets and canisters
- [Subnet types](../reference/subnet-types.md) — comparing subnet sizes and properties

<!-- Upstream: informed by dfinity/portal docs/building-apps/essentials/network-overview.mdx -->
