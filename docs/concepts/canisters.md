---
title: "Canisters"
description: "Compute units that run WebAssembly, hold state, serve HTTP, and pay for their own compute"
sidebar:
  order: 2
---

Canisters are the compute units of the Internet Computer. Each canister bundles compiled WebAssembly code with its own persistent state into a single unit that the network executes, replicates, and secures. You deploy code to a canister, send it messages, and the network guarantees that every honest node in the [subnet](network-overview.md#subnets) reaches the same result.

Unlike programs on most other blockchains, canisters can serve web pages over HTTP, store gigabytes of data, make calls to external APIs, sign transactions on other chains, and run scheduled tasks autonomously, all without external infrastructure.

## Execution model

Canisters are WebAssembly module instances. You write code in Motoko or Rust (the official CDKs), or community-supported languages like TypeScript and Python: any language that compiles to Wasm works. The network runs your code in a sandboxed Wasm virtual machine.

Each canister runs on a single thread. It processes messages one at a time in sequence, which means there are no data races within a canister. However, many canisters execute concurrently across (and within) subnets, so the network as a whole achieves high throughput.

Canisters follow the [actor model](https://en.wikipedia.org/wiki/Actor_model): they maintain private state, receive messages, send messages to other canisters, and can create new canisters.

## Message types

All interaction with a canister happens through messages. There are two categories:

- **Ingress messages**: sent by external users (through a browser, CLI, or agent library).
- **Inter-canister messages**: sent from one canister to another within the network.

Ingress messages use one of two call types:

### Update calls

Update calls can modify canister state. They go through consensus: every node in the subnet executes the call, and the subnet collectively signs the response. This provides strong authenticity guarantees: a single malicious node cannot forge results.

Update calls typically complete in 1–2 seconds. They cost cycles.

### Query calls

Query calls read state without modifying it. A single node executes the call and returns the result directly, without consensus. Because the response is not threshold-signed by the subnet, query results should be treated as unverified unless you use certified variables. The tradeoff is speed: results come back in milliseconds.

For applications that need authenticated reads (for example, a governance app showing proposal text that a user will vote on), you have two options:

- Issue the query as an update call for full consensus, at the cost of higher latency.
- Use [certified variables](../guides/backends/certified-variables.md) to pre-sign data during updates and serve proofs in query responses.

### Composite queries

Composite queries let a query call other queries on canisters **within the same subnet**, then combine the results into a single response, all without going through consensus. This is useful for aggregating data across multiple canisters at query speed.

Key constraints:

- **Same subnet only**: composite queries cannot call canisters on other subnets.
- **Ingress only**: only external clients (browsers, CLI tools) can invoke composite queries. Other canisters cannot call them.
- **No replicated mode**: unlike regular queries, composite queries cannot be executed as update calls for stronger authenticity.

## Memory model

Each canister has two storage regions:

| Region | Max size | Persisted across upgrades | Access |
|--------|----------|--------------------------|--------|
| **Heap (Wasm) memory** | 4 GiB (wasm32) / 6 GiB (wasm64) | No (cleared on upgrade, unless using Motoko's orthogonal persistence) | Standard Wasm memory instructions |
| **Stable memory** | 500 GiB | Yes | System API calls |

**Heap memory** is standard Wasm linear memory. It holds your program's heap-allocated data: variables, data structures, and anything your code allocates at runtime. Both 32-bit and 64-bit Wasm memory are supported. Heap memory is cleared when you upgrade the canister's Wasm module.

**Stable memory** is a separate address space accessed through the [system API](../references/ic-interface-spec/canister-interface.md). It survives upgrades, making it the right place for any data that must persist long-term. Libraries like `StableBTreeMap` (Rust) or the [`core`](https://mops.one/core/docs) persistent data structures (Motoko) let you work with stable memory through familiar abstractions.

After a message executes successfully, the system atomically commits all memory changes. If execution traps (fails), no changes are committed. The canister's state rolls back to what it was before that message.

For a deeper dive, see [Orthogonal persistence](orthogonal-persistence.md).

## Canister IDs and principals

Every canister gets a globally unique **canister ID** when it is created. This ID is a [principal](https://learn.internetcomputer.org/hc/en-us/articles/34250491785108): the same type of identifier used for users: and serves as the canister's address on the network.

To send a message to a canister, you include its canister ID in the message header. The network routes the message to the correct subnet and places it in the canister's input queue for processing.

Canister IDs look like `ryjl3-tyaaa-aaaaa-aaaba-cai`. You can see them in `icp.yaml` after deploying, or look them up on the [ICP Dashboard](https://dashboard.internetcomputer.org).

## Canister lifecycle

A canister goes through four lifecycle stages:

### Create

Creating a canister allocates a canister ID and reserves resources on a subnet. At this point the canister exists but has no code.

### Install

Installing uploads a Wasm module to the canister and runs its initialization logic. After installation, the canister is running and accepting messages.

### Upgrade

Upgrading replaces the canister's Wasm module while preserving stable memory. The system runs a pre-upgrade hook (to save heap data to stable memory if needed), swaps the Wasm, then runs a post-upgrade hook (to restore data).

### Stop and delete

Stopping a canister prevents it from accepting new messages while letting in-flight messages complete. Once stopped, a canister can be deleted to reclaim its resources and remaining cycles.

For step-by-step CLI commands, see [Canister lifecycle management](../guides/canister-management/lifecycle.md).

## Controllers

Controllers are principals (users or other canisters) that have permission to manage a canister: upgrade its code, change its settings, stop it, or delete it.

If a canister has **no controllers**, it is immutable: no one can change its code or settings. This is a strong guarantee for users who want to verify that a canister's behavior will never change.

## Canister internals

Under the hood, each canister maintains several components:

- **Input queue**: holds incoming messages waiting to be processed. The canister processes one message at a time.
- **Output queue**: holds outgoing messages to other canisters, dispatched after successful execution.
- **Cycles balance**: the canister's fuel for computation and storage. The system deducts cycles after each message execution, whether it succeeds or fails.
- **Controllers list**: the set of principals authorized to manage the canister.
- **Settings**: configurable parameters like compute allocation, memory allocation, and the freezing threshold (the cycles balance below which the canister stops accepting new messages to avoid running out).

## Next steps

- [Cycles](cycles.md): how canisters pay for computation
- [App architecture](app-architecture.md): how canisters fit into application design
- [Canister lifecycle](../guides/canister-management/lifecycle.md): practical guide to managing canisters
- [Network overview](network-overview.md): the infrastructure canisters run on

<!-- Upstream: informed by dfinity/portal docs/building-apps/essentials/canisters.mdx, message-execution.mdx -->
