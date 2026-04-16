---
title: "Stable Structures"
description: "Use StableBTreeMap, StableVec, StableCell, and MemoryManager for upgrade-safe persistent storage in Rust canisters"
sidebar:
  order: 2
---

Stable structures are data structures that read and write directly to stable memory, bypassing the heap entirely. Unlike heap data, stable memory survives canister upgrades — no `pre_upgrade`/`post_upgrade` serialization hooks required.

The [`ic-stable-structures`](https://docs.rs/ic-stable-structures/latest/ic_stable_structures/) crate provides the building blocks. This page covers how to use them in Rust canisters.

## Why stable structures

On ICP, heap memory (Wasm linear memory) is preserved across update calls within a session but is **wiped on every canister upgrade**. Any data you store in a plain `HashMap` or `Vec` on the heap will be lost the next time you `icp deploy`.

The two approaches to persistence across upgrades are:

| Approach | When to use |
|----------|-------------|
| **Stable structures** | Recommended for all new canisters. Data lives in stable memory directly — no serialization step, no instruction-limit risk. |
| **Pre/post upgrade hooks** | Simple to add to existing code, but does not scale. Serializing large datasets in `pre_upgrade` can hit the instruction limit and brick the canister. |

Stable structures eliminate the upgrade risk entirely. The `MemoryManager` partitions stable memory (which can grow to hundreds of GB) into independent virtual regions, one per data structure.

## Add the dependency

Add `ic-stable-structures` to your `Cargo.toml`:

```toml
[package]
name = "backend"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib"]

[dependencies]
ic-cdk = "0.19"
ic-stable-structures = "0.7"
candid = "0.10"
serde = { version = "1", features = ["derive"] }
ciborium = "0.2"
```

`ciborium` provides CBOR serialization for custom types stored in stable memory. CBOR is compact and fast — preferred over Candid for this use case.

## Available structures

The crate provides four main persistent data structures:

| Type | Use case |
|------|----------|
| [`StableBTreeMap`](https://docs.rs/ic-stable-structures/latest/ic_stable_structures/btreemap/struct.BTreeMap.html) | Key-value store. Keys must implement `Storable + Ord`. |
| [`StableCell`](https://docs.rs/ic-stable-structures/latest/ic_stable_structures/cell/struct.Cell.html) | Single persistent value — counters, configuration, state flags. |
| [`StableLog`](https://docs.rs/ic-stable-structures/latest/ic_stable_structures/log/struct.Log.html) | Append-only log. Efficient for event streams and audit trails. |
| [`StableVec`](https://docs.rs/ic-stable-structures/latest/ic_stable_structures/vec/struct.Vec.html) | Ordered sequence. Efficient indexed access. |

There is also a [`StableMinHeap`](https://docs.rs/ic-stable-structures/latest/ic_stable_structures/min_heap/struct.MinHeap.html) for priority queue patterns.

## Implement Storable for custom types

Every key and value stored in a stable structure must implement the `Storable` trait, which defines how the value is serialized to and from bytes in stable memory. Primitive types (`u64`, `u32`, `bool`, `f64`), `String`, `Vec<u8>`, and `Principal` implement `Storable` already.

For custom structs, implement `Storable` using CBOR serialization:

```rust
use ic_stable_structures::storable::{Bound, Storable};
use candid::CandidType;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct User {
    id: u64,
    name: String,
    created_at: u64,
}

impl Storable for User {
    // Use Unbounded to avoid compatibility issues when adding new fields.
    // Bound::Bounded requires a fixed max_size — exceeding it after a
    // schema change breaks deserialization of existing data.
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        ciborium::into_writer(self, &mut buf).expect("failed to encode User");
        Cow::Owned(buf)
    }

    fn into_bytes(self) -> Vec<u8> {
        let mut buf = vec![];
        ciborium::into_writer(&self, &mut buf).expect("failed to encode User");
        buf
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        ciborium::from_reader(bytes.as_ref()).expect("failed to decode User")
    }
}
```

## MemoryManager and MemoryId

The `MemoryManager` partitions a single stable memory region into virtual regions. Each data structure is allocated its own `MemoryId`. Two structures that share a `MemoryId` corrupt each other's data — always use distinct IDs.

```rust
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl,
};

type Memory = VirtualMemory<DefaultMemoryImpl>;

// Declare IDs as constants to prevent accidental reuse.
const USERS_MEM_ID:     MemoryId = MemoryId::new(0);
const COUNTER_MEM_ID:   MemoryId = MemoryId::new(1);
const LOG_INDEX_MEM_ID: MemoryId = MemoryId::new(2);
const LOG_DATA_MEM_ID:  MemoryId = MemoryId::new(3);
```

`StableLog` requires two separate memory regions — one for the index and one for the data.

## Complete canister example

The following example stores user records in a `StableBTreeMap` and a total count in a `StableCell`. Both survive upgrades with no serialization step.

```rust
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    storable::{Bound, Storable},
    DefaultMemoryImpl, StableBTreeMap,
};
use ic_cdk::{init, post_upgrade, query, update};
use candid::CandidType;
use serde::{Deserialize, Serialize};
use std::borrow::Cow;
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

const USERS_MEM_ID:   MemoryId = MemoryId::new(0);
const COUNTER_MEM_ID: MemoryId = MemoryId::new(1);

#[derive(CandidType, Serialize, Deserialize, Clone)]
struct User {
    id: u64,
    name: String,
    created_at: u64,
}

impl Storable for User {
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        let mut buf = vec![];
        ciborium::into_writer(self, &mut buf).expect("failed to encode User");
        Cow::Owned(buf)
    }

    fn into_bytes(self) -> Vec<u8> {
        let mut buf = vec![];
        ciborium::into_writer(&self, &mut buf).expect("failed to encode User");
        buf
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        ciborium::from_reader(bytes.as_ref()).expect("failed to decode User")
    }
}

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    // StableBTreeMap: key-value store persisted in stable memory
    static USERS: RefCell<StableBTreeMap<u64, User, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MEM_ID))
        ));

    // StableCell: single value persisted in stable memory
    static COUNTER: RefCell<ic_stable_structures::StableCell<u64, Memory>> =
        RefCell::new(ic_stable_structures::StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(COUNTER_MEM_ID)),
            0u64,
        ).expect("failed to init COUNTER"));
}

#[init]
fn init() {
    // One-time initialization logic here.
    // Stable structures are ready to use immediately — no setup needed.
}

#[post_upgrade]
fn post_upgrade() {
    // Stable structures auto-restore from stable memory — no deserialization needed.
    // Re-initialize timers or other transient state here if required.
}

#[update]
fn add_user(name: String) -> u64 {
    let id = COUNTER.with(|c| {
        let mut cell = c.borrow_mut();
        let current = *cell.get();
        cell.set(current + 1).expect("failed to increment counter");
        current
    });

    let user = User {
        id,
        name,
        created_at: ic_cdk::api::time(),
    };

    USERS.with(|users| {
        users.borrow_mut().insert(id, user);
    });

    id
}

#[query]
fn get_user(id: u64) -> Option<User> {
    USERS.with(|users| users.borrow().get(&id))
}

#[query]
fn get_user_count() -> u64 {
    USERS.with(|users| users.borrow().len())
}

ic_cdk::export_candid!();
```

Key patterns in this example:

- `thread_local! { RefCell<StableBTreeMap<...>> }` is the standard pattern. The `RefCell` allows interior mutability inside `thread_local!`; the stable structure itself lives in stable memory, not the heap.
- `#[init]` and `#[post_upgrade]` are defined even when they do nothing. The `#[post_upgrade]` entry point ensures the canister has a known restoration path after an upgrade — omitting it can cause unexpected behavior.
- `ic_cdk::api::time()` returns nanoseconds since the Unix epoch as a `u64`.

## Multiple data structures

When a canister needs more than one stable structure, allocate a unique `MemoryId` for each:

```rust
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, StableLog,
};
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

const USERS_MEM_ID:     MemoryId = MemoryId::new(0);
const POSTS_MEM_ID:     MemoryId = MemoryId::new(1);
const COUNTER_MEM_ID:   MemoryId = MemoryId::new(2);
// StableLog requires two memory regions
const LOG_INDEX_MEM_ID: MemoryId = MemoryId::new(3);
const LOG_DATA_MEM_ID:  MemoryId = MemoryId::new(4);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static USERS: RefCell<StableBTreeMap<u64, Vec<u8>, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MEM_ID))
        ));

    static POSTS: RefCell<StableBTreeMap<u64, Vec<u8>, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(POSTS_MEM_ID))
        ));

    static COUNTER: RefCell<ic_stable_structures::StableCell<u64, Memory>> =
        RefCell::new(ic_stable_structures::StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(COUNTER_MEM_ID)),
            0u64,
        ).expect("failed to init COUNTER"));

    // StableLog: append-only log with separate index and data regions
    static AUDIT_LOG: RefCell<StableLog<Vec<u8>, Memory, Memory>> =
        RefCell::new(StableLog::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(LOG_INDEX_MEM_ID)),
            MEMORY_MANAGER.with(|m| m.borrow().get(LOG_DATA_MEM_ID)),
        ).expect("failed to init AUDIT_LOG"));
}
```

## When to use heap vs stable memory

| Scenario | Use |
|----------|-----|
| Data that must survive upgrades (user records, balances, settings) | Stable structures |
| Large datasets that could grow beyond a few MB | Stable structures — stable memory can grow to hundreds of GB |
| Temporary computation state within a single call | Heap (`Vec`, `HashMap`) |
| Caches that can be rebuilt after an upgrade | `transient` patterns or heap with recomputation in `#[post_upgrade]` |
| Small configuration that changes rarely | `StableCell` |

The pre/post upgrade hook pattern (serializing heap state in `pre_upgrade` and deserializing in `post_upgrade`) becomes dangerous as datasets grow. Both hooks run under a fixed instruction limit. Exceeding the limit traps the upgrade, leaving the canister stuck. Stable structures bypass this risk entirely because no serialization step occurs during upgrade.

## Verify persistence across upgrades

To confirm your canister actually persists data:

```bash
# Start a local network
icp network start -d

# Deploy the canister
icp deploy backend

# Add some data
icp canister call backend add_user '("Alice")'
# Expected: (0 : nat64)

icp canister call backend add_user '("Bob")'
# Expected: (1 : nat64)

# Record the count before upgrade
icp canister call backend get_user_count '()'
# Expected: (2 : nat64)

# Redeploy (simulates a code update + upgrade)
icp deploy backend

# Count must still be 2 — not 0
icp canister call backend get_user_count '()'
# Expected: (2 : nat64)

# Data must still be retrievable
icp canister call backend get_user '(0)'
# Expected: (opt record { id = 0 : nat64; name = "Alice"; created_at = ... })
```

If the count drops to 0 after redeployment, the data is not in stable memory. Check that the structures are initialized inside `thread_local!` using the `MemoryManager`, not as plain heap types.

## Common mistakes

**Reusing a `MemoryId` for two different structures** corrupts both. Declare IDs as named constants to prevent mistakes.

**Using `thread_local! { RefCell<HashMap<...>> }` for persistent state.** This is heap memory and is wiped on every upgrade. Use `StableBTreeMap` instead.

**Using `Bound::Bounded` with a `max_size` that is too small.** If you add a field to a struct later, existing records that fit the old `max_size` may still encode larger than expected, or the new layout may exceed the bound and break deserialization. Prefer `Bound::Unbounded` unless you have a specific reason to bound the size.

**Omitting `#[post_upgrade]`.** Even when the function body is empty, defining `#[post_upgrade]` documents the upgrade contract and avoids surprising runtime defaults.

**Serializing heap data in `pre_upgrade` as the sole persistence strategy.** This does not scale. For canisters with user-facing data, use stable structures from the start.

## Next steps

- [`ic-stable-structures` API reference](https://docs.rs/ic-stable-structures/latest/ic_stable_structures/) — complete trait and type documentation
- [Data persistence guide](../../guides/backends/data-persistence.md) — cross-language comparison of persistence patterns
- [Orthogonal persistence](../../concepts/orthogonal-persistence.md) — how ICP manages canister state
- [Canister lifecycle](../../guides/canister-management/lifecycle.md) — upgrades, snapshots, and state management

<!-- Upstream: informed by dfinity/icskills skills/stable-memory/SKILL.md; dfinity/portal docs/building-apps/developer-tools/cdks/rust/stable-structures.mdx; dfinity/cdk-rs ic-cdk/README.md; dfinity/examples rust/unit_testable_rust_canister -->
