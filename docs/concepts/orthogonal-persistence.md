---
title: "Orthogonal Persistence"
description: "How canister memory survives across executions and upgrades without databases"
sidebar:
  order: 5
icskills: [stable-memory]
---

On traditional backends, application state lives in memory only while the process runs. To persist data across restarts, you need a database -- PostgreSQL, Redis, SQLite, or a file system. The application logic and the storage layer are separate concerns that developers must wire together.

On the Internet Computer, persistence is built into the execution model. A canister's memory persists between calls automatically -- no database and no file system. In Motoko, this is fully transparent: you declare a variable, assign it a value, and that value is still there the next time the canister executes -- no explicit save or load. In Rust, you choose persistent data structures that write directly to stable memory, giving you full control over what survives upgrades. Either way, the canister IS its own storage. This property is called **orthogonal persistence**: persistence is orthogonal to (independent of) the programming model.

There is no separate storage tier to configure, query, or maintain.

## Two memory regions

Every canister has two distinct memory regions, each with different characteristics:

### Heap (Wasm linear) memory

This is regular program memory -- the space where variables, data structures, and the call stack live during execution. It maps to the Wasm linear memory of the canister module.

- **Size limit:** 4 GiB for wasm32 canisters, 6 GiB for wasm64
- **Performance:** Fast, native Wasm memory access
- **Upgrade behavior:** Wiped on canister upgrade (Rust) -- use stable structures to persist data; automatically preserved in Motoko with `persistent actor`

### Stable memory

A separate, dedicated memory region provided by the Internet Computer runtime. Its sole purpose is to survive canister upgrades.

- **Size limit:** Up to 500 GiB per canister. The actual available capacity also depends on the subnet's total storage usage, since all canisters on a subnet share a common storage budget. For storage-heavy applications, consider [subnet selection](../guides/canister-management/subnet-selection.md).
- **Performance:** Slower than heap memory -- each access goes through system API calls rather than direct Wasm memory operations
- **Upgrade behavior:** Always survives upgrades

The distinction between these two regions is the foundation of all persistence strategies on ICP.

## How persistence differs by language

The two mainstream canister languages -- Motoko and Rust -- take fundamentally different approaches to persistence.

### Motoko: true orthogonal persistence

Motoko is the only ICP language that delivers true orthogonal persistence. With `persistent actor`, all variable declarations inside the actor body are automatically persisted across upgrades. Developers do not think about persistence at all -- they write normal code and data survives.

The runtime transparently manages the mapping between the program's heap and stable memory during upgrades. Fields marked `transient var` reset to their initial value on upgrade, giving developers explicit control over what is ephemeral (caches, counters) versus durable.

This is orthogonal persistence in its purest form: persistence is completely invisible to the programming model.

For implementation details and code examples, see the [Data persistence guide](../guides/backends/data-persistence.md).

### Rust: explicit stable structures

Rust canisters take an explicit approach. The `ic-stable-structures` crate provides data structures (`StableBTreeMap`, `StableCell`, `StableLog`) that are backed directly by stable memory. Data written to these structures survives upgrades without any serialization step.

This is not orthogonal persistence -- developers must consciously choose which data structures to use and how to partition stable memory. The tradeoff is full control: Rust developers decide exactly what persists, how it's stored, and how memory is allocated.

For implementation details and code examples, see the [Data persistence guide](../guides/backends/data-persistence.md).

## The dangerous pattern: heap serialization

Before stable structures existed, the standard approach in Rust was to store data in heap memory and serialize it to stable memory in `pre_upgrade`, then deserialize it back in `post_upgrade`.

This pattern has a critical failure mode: `pre_upgrade` runs with a fixed instruction limit. If the dataset grows large enough, serialization exceeds the limit and the hook traps. The upgrade fails, and recovery requires the `skip_pre_upgrade` flag, which bypasses the failing hook but may result in data loss.

Stable structures avoid this entirely by writing directly to stable memory during normal operation. There is nothing to serialize at upgrade time. New Rust canisters should always use stable structures rather than heap serialization.

## Heap vs. stable memory: trade-offs

| | Heap memory | Stable memory |
|---|---|---|
| **Size limit** | 4 GiB (wasm32) / 6 GiB (wasm64) | Up to 500 GiB |
| **Access speed** | Fast (native Wasm) | Slower (system API calls) |
| **Upgrade safety** | Automatic in Motoko `persistent actor`; wiped in Rust | Always survives upgrades |
| **API** | Native language constructs | `StableBTreeMap` etc. (Rust); automatic (Motoko) |
| **Use case** | All data in Motoko `persistent actor`; caches and temporary computation in Rust | All persistent application data (Rust) |

In Motoko with `persistent actor`, this trade-off is largely invisible -- the runtime manages the mapping between heap and stable memory during upgrades. In Rust, developers choose explicitly: heap data (fast but ephemeral) or stable structures (slightly slower but durable).

## Comparison with traditional backends

| Concern | Traditional backend | ICP canister |
|---|---|---|
| **State persistence** | External database (PostgreSQL, Redis) | Built into the runtime |
| **Configuration** | Connection strings, schemas, migrations | None (declare variables) |
| **Deployment** | App server + database server | Single canister |
| **Upgrade safety** | Database persists independently of app | Stable memory persists across upgrades |
| **Scaling storage** | Provision database storage separately | Stable memory grows with usage (up to 500 GiB per canister, subject to subnet storage budget) |

The mental model shift: instead of "my app talks to a database," think "my app IS the database." Canister state is the program's state, and the Internet Computer ensures it persists.

## Further reading

- [IC Internals: Orthogonal Persistence](https://medium.com/dfinity/ic-internals-orthogonal-persistence-9e0c094aac1a) -- deep dive into how orthogonal persistence works at the protocol level
- [A Journey into Stellarator (Part 2)](https://medium.com/dfinity/a-journey-into-stellarator-part-2-d4a83c631748) -- the Stellarator engine that powers Motoko's persistent actors
- [Orthogonal Persistence in 60 Seconds](https://www.youtube.com/shorts/g3sC2wjLzew) -- quick visual explainer

## Next steps

- [Data persistence guide](../guides/backends/data-persistence.md) -- practical implementation patterns for both languages
- [Rust stable structures](../languages/rust/stable-structures.md) -- detailed Rust patterns with `StableBTreeMap`, `StableCell`, and `StableLog`
- [Canister lifecycle](../guides/canister-management/lifecycle.md) -- how upgrades, reinstalls, and other lifecycle events interact with persistence

<!-- Upstream: informed by dfinity/portal persistence sections and stable-memory icskill -->
