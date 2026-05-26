---
title: "Execution layer"
description: "How ICP deterministically executes canister code using WebAssembly, deterministic time slicing, and concurrent execution."
sidebar:
  order: 4
---

The execution layer is the topmost layer of the ICP core protocol stack. It is responsible for executing canister code after message routing has inducted messages into canister input queues. Code runs in a [WebAssembly](https://webassembly.org/) (Wasm) virtual machine deployed on every subnet node. Wasm bytecode executes deterministically and at near-native speed, both of which are essential properties for a replicated system.

Execution proceeds deterministically: every honest node on the subnet executes the same messages in the same order and reaches the same resulting state.

## Replicated execution

Execution proceeds in rounds. Each round, message routing invokes the execution layer once to process (a subset of) the messages in canister input queues. A round ends either when all queued messages have been executed or when the cycles limit for the round is reached, ensuring bounded round times.

Executing a message can:

- Modify memory pages in the canister's state (marking them "dirty")
- Create new messages to other canisters on the same or different subnets
- Generate a response to an ingress message

Messages to local canisters are queued directly in the target canister's input queue and scheduled for the same or an upcoming round, without going through consensus. Messages to canisters on other subnets are placed into the XNet queue and certified by the subnet at the end of the round.

## Concurrent execution

The execution layer is designed to execute multiple canisters concurrently on different CPU cores. This is possible because each canister has its own isolated state and inter-canister communication is asynchronous. Concurrent execution within a subnet, combined with multiple subnets running in parallel, makes ICP scale like a public cloud: by adding more subnets.

## Deterministic time slicing

Each execution round is synchronized with block production, which happens roughly once per second. The current per-round instruction limit is approximately 2 billion instructions per canister given present node hardware.

For longer computations (up to 20 billion instructions, or up to 200 billion for code installation), ICP uses **Deterministic Time Slicing (DTS)**. DTS pauses a long-running computation at the end of a round and resumes it in the next, allowing a task to span multiple rounds without slowing block creation. DTS is automatic and transparent to canisters: no special canister code is needed.

## Memory handling

One of the execution layer's key responsibilities is managing canister bytecode and state (collectively: canister memory). The replicated state a subnet can hold is bounded by available SSD storage, not RAM. Available RAM affects performance through access latency, much as it does in traditional systems.

ICP node machines are equipped with high-end SSD storage and substantial RAM to hold large amounts of replicated canister state and Wasm code.

Memory pages representing canister state are persisted to SSD automatically by the execution layer. This [**orthogonal persistence**](../orthogonal-persistence.md) frees developers from explicitly managing reads and writes to storage. The full canister state is always available on the heap or in stable memory:

- **Heap memory** is cleared when canister code is upgraded. State intended to survive upgrades must be moved to stable memory before the upgrade and restored afterward.
- **Stable memory** persists across code upgrades. Large state should be kept in stable memory directly to avoid the cost and risk of copying it back and forth at upgrade time.

## Random number generation

Many applications require a secure source of randomness. Generating random numbers naively in a replicated setting destroys determinism, since each node would produce different values. ICP solves this with the **random tape**: a distributed pseudorandom number generator built using chain-key cryptography.

Each round, the subnet produces a fresh threshold BLS signature. This signature is unpredictable and uniformly distributed by its nature. It is used as a seed for a cryptographic pseudorandom generator, giving canisters access to a secure, efficient, and verifiable source of randomness.

## Cycles accounting

Executing a canister consumes network resources. These resources are paid for with [**cycles**](../../references/glossary.md#cycle). Each canister holds a local cycles account. The canister itself pays for its own storage and computation: users never send cycles with their messages. Ensuring the cycles account is funded is the responsibility of the canister's maintainer (a developer, a team, or a community-governed application).

When canister Wasm code is installed or upgraded, it is instrumented with instruction-counting code. This allows the exact number of cycles to be charged for each message execution in a fully deterministic way, so every node charges the same amount and replicated state machine properties are preserved.

Cycles are also charged for:

- **Storage.** Both Wasm code and canister state are charged per unit of time, similar to cloud storage billing. Prices scale with the subnet's replication factor.
- **Networking.** Receiving ingress messages, sending XNet messages, and making HTTPS outcalls are all charged in cycles.

## Query execution

[Query calls](../../references/glossary.md#query) (non-replicated execution) are executed by a single node and return a response synchronously. Unlike update calls, queries cannot change the replicated state of the subnet: they are read operations on one replica. Queries execute concurrently across multiple threads on a single node, and all nodes in the subnet can serve different queries concurrently, so query throughput scales linearly with subnet size.

The tradeoff is the trust model: a single node executes the query, so a compromised node could return an arbitrary result. For critical data, use update calls (which produce responses certified by the subnet) or [certified variables](../../guides/backends/certified-variables.md).

## Further reading

- [Protocol Stack](index.md): how execution fits into the four-layer architecture
- [Usenix ATC paper on the ICP execution environment](https://www.usenix.org/system/files/atc23-arutyunyan.pdf)

<!-- Upstream: informed by Learn Hub article "Execution Layer" (migrated, source retired) -->
