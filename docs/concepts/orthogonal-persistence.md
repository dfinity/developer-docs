---
title: "Orthogonal Persistence"
description: "How canister memory survives across executions and upgrades without databases"
sidebar:
  order: 5
icskills: [stable-memory]
---

On traditional backends, application state lives in memory only while the process runs. To persist data across restarts, you need a database -- PostgreSQL, Redis, SQLite, or a file system. The application logic and the storage layer are separate concerns that developers must wire together.

On the Internet Computer, persistence is built into the execution model. A canister's memory persists between calls automatically -- no database, no file system, no explicit save/load. You declare a variable, assign it a value, and that value is still there the next time the canister executes. This property is called **orthogonal persistence**: persistence is orthogonal to (independent of) the programming model.

The practical effect is that the canister IS the database. There is no separate storage tier to configure, query, or maintain.

## Two memory regions

Every canister has two distinct memory regions, each with different characteristics:

### Heap (Wasm linear) memory

This is regular program memory -- the space where variables, data structures, and the call stack live during execution. It maps to the Wasm linear memory of the canister module.

- **Size limit:** 4 GB for wasm32 canisters, 6 GB for wasm64
- **Performance:** Fast, native Wasm memory access
- **Upgrade behavior:** Historically wiped on canister upgrade (Rust); automatically preserved in Motoko with `persistent actor`

### Stable memory

A separate, dedicated memory region provided by the Internet Computer runtime. Its sole purpose is to survive canister upgrades.

- **Size limit:** Hundreds of GB (bounded by the subnet storage limit, approximately 500 GB)
- **Performance:** Slower than heap memory -- each access goes through system API calls rather than direct Wasm memory operations
- **Upgrade behavior:** Always survives upgrades

The distinction between these two regions is the foundation of all persistence strategies on ICP.

## How persistence differs by language

The two mainstream canister languages -- Motoko and Rust -- take fundamentally different approaches to persistence.

### Motoko: automatic persistence

With `persistent actor` and `mo:core` 2.0, Motoko delivers true orthogonal persistence. All `let` and `var` declarations inside the actor body are automatically persisted across upgrades. No explicit stable memory management is needed.

```motoko
import Map "mo:core/Map";
import Nat "mo:core/Nat";

persistent actor {
  let users = Map.empty<Nat, Text>();
  var userCount : Nat = 0;

  // This resets to 0 on every upgrade
  transient var requestCount : Nat = 0;

  public func addUser(name : Text) : async Nat {
    let id = userCount;
    Map.add(users, Nat.compare, id, name);
    userCount += 1;
    requestCount += 1;
    id
  };
}
```

Key properties of Motoko persistent actors:

- **`let` and `var`** declarations persist across upgrades automatically
- **`transient var`** marks data that should reset to its initial value on upgrade (caches, request counters, temporary state)
- **No `stable` keyword needed** -- it is redundant in persistent actors and produces compiler warnings
- **No `pre_upgrade`/`post_upgrade` hooks needed** -- the runtime handles serialization transparently
- **Schema rule:** never change a field's type between upgrades (for example, `Nat` to `Int` will trap and data is unrecoverable). Only add new optional fields.

This is orthogonal persistence in its purest form -- developers do not think about persistence at all. They write normal code and data survives.

### Rust: explicit stable structures

Rust canisters take an explicit approach using the `ic-stable-structures` crate. Data structures are backed directly by stable memory, which means they survive upgrades without any serialization step.

```rust
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap,
};
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    // This data lives in stable memory -- survives upgrades
    static USERS: RefCell<StableBTreeMap<u64, Vec<u8>, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        ));
}
```

Key properties of Rust stable structures:

- **`MemoryManager`** partitions stable memory into virtual memories, each assigned a unique `MemoryId`
- **`StableBTreeMap`**, **`StableCell`**, and **`StableLog`** are the primary data structures, each backed by a virtual memory region
- **`#[init]` and `#[post_upgrade]`** handlers must be defined. Stable structures auto-restore, so `post_upgrade` only needs to reinitialize transient state (timers, caches)
- **No `pre_upgrade` serialization needed** -- data is already in stable memory

For full implementation patterns, see the [Rust stable structures](../languages/rust/stable-structures.md) guide.

## The dangerous pattern: heap serialization

Before stable structures existed, the standard approach in Rust was to store data in heap memory (`thread_local! { RefCell<HashMap<...>> }`) and serialize it to stable memory in `pre_upgrade`, then deserialize it back in `post_upgrade`.

This pattern has a critical failure mode: `pre_upgrade` runs with a fixed instruction limit. If the dataset grows large enough, serialization exceeds the limit, the hook traps, and the canister is **bricked** -- the upgrade fails and the data cannot be recovered.

Stable structures avoid this entirely by writing directly to stable memory during normal operation. There is nothing to serialize at upgrade time.

## Heap vs. stable memory: trade-offs

| | Heap memory | Stable memory |
|---|---|---|
| **Size limit** | 4 GB (wasm32) / 6 GB (wasm64) | Hundreds of GB |
| **Access speed** | Fast (native Wasm) | Slower (system API calls) |
| **Upgrade safety** | Automatic in Motoko `persistent actor`; wiped in Rust | Always survives upgrades |
| **API** | Native language constructs | `StableBTreeMap` etc. (Rust); automatic (Motoko) |
| **Use case** | Caches, temporary computation | All persistent application data |

In Motoko with `persistent actor`, this trade-off is largely invisible -- the runtime manages the mapping between heap and stable memory during upgrades. In Rust, developers choose explicitly: heap data (fast but ephemeral) or stable structures (slightly slower but durable).

## Comparison with traditional backends

| Concern | Traditional backend | ICP canister |
|---|---|---|
| **State persistence** | External database (PostgreSQL, Redis) | Built into the runtime |
| **Configuration** | Connection strings, schemas, migrations | None (declare variables) |
| **Deployment** | App server + database server | Single canister |
| **Upgrade safety** | Database persists independently of app | Stable memory persists across upgrades |
| **Scaling storage** | Provision database storage separately | Stable memory grows with usage (up to subnet limit) |

The mental model shift: instead of "my app talks to a database," think "my app IS the database." Canister state is the program's state, and the Internet Computer ensures it persists.

## Next steps

- [Data persistence guide](../guides/backends/data-persistence.md) -- practical implementation patterns for both languages
- [Rust stable structures](../languages/rust/stable-structures.md) -- detailed Rust patterns with `StableBTreeMap`, `StableCell`, and `StableLog`
- [Canister lifecycle](../guides/canister-management/lifecycle.md) -- how upgrades, reinstalls, and other lifecycle events interact with persistence

<!-- Upstream: informed by dfinity/portal persistence sections and stable-memory icskill -->
