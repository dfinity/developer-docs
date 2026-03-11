---
title: "Orthogonal Persistence"
description: "Canister state survives upgrades — no external database needed"
sidebar:
  order: 8
doc_type: explanation
level: intermediate
features: [persistence]
icskills: [stable-memory]
last_verified: 2026-03-10
---

On ICP, canister state is persistent by default. There is no external database to set up, no ORM to configure, no state migration scripts to maintain. When you store a value in a canister, it stays there -- across messages, across rounds, and across upgrades.

This is **orthogonal persistence**: the persistence mechanism is orthogonal to (independent of) the application logic. You write your program as if memory simply never goes away.

## Two types of memory

Every canister has access to two memory regions:

### Heap memory (Wasm memory)

- Standard WebAssembly linear memory
- Maximum size: **4 GiB**
- Used by default for all variables, data structures, and program state
- **Cleared on reinstall** (but preserved through upgrades in Motoko with enhanced orthogonal persistence)

### Stable memory

- A separate, persistent storage region unique to ICP
- Maximum size: **500 GiB** (subject to subnet capacity)
- Persists across all canister lifecycle events (upgrades, code changes)
- Must be explicitly used in Rust; automatically managed in Motoko

## Motoko: enhanced orthogonal persistence

Motoko provides the most seamless persistence experience. Variables declared with the `stable` keyword automatically survive canister upgrades:

```motoko
actor Counter {
    stable var count : Nat = 0;

    public func increment() : async Nat {
        count += 1;
        count
    };

    public query func get() : async Nat {
        count
    };
};
```

After upgrading this canister with new code, `count` retains its value. No serialization, no migration -- it just works.

Under the hood, Motoko's enhanced orthogonal persistence stores stable variables in stable memory during upgrades and restores them when the new code starts. The runtime handles serialization and deserialization transparently.

For complex data structures, Motoko's stable type system ensures that type changes between upgrades are compatible, warning you at compile time if an upgrade would lose data.

## Rust: stable structures

In Rust, heap memory is cleared on upgrade. To persist data, use the [`ic-stable-structures`](https://github.com/dfinity/stable-structures) crate, which provides data structures backed directly by stable memory:

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

    static USERS: RefCell<StableBTreeMap<u64, String, Memory>> = RefCell::new(
        StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(MemoryId::new(0)))
        )
    );
}

#[ic_cdk::update]
fn add_user(id: u64, name: String) {
    USERS.with(|users| users.borrow_mut().insert(id, name));
}

#[ic_cdk::query]
fn get_user(id: u64) -> Option<String> {
    USERS.with(|users| users.borrow().get(&id))
}
```

Available stable structures include:

- `StableBTreeMap` -- sorted key-value store
- `StableVec` -- growable array
- `StableLog` -- append-only log
- `StableMinHeap` -- min-heap priority queue

These data structures write directly to stable memory, so data survives upgrades without any `pre_upgrade`/`post_upgrade` hooks.

## Canister upgrades

To upgrade a canister's code while preserving state:

```bash
# Build the new Wasm module
icp build <canister-name>

# Install with upgrade mode
icp canister install <canister-name> --mode upgrade
```

During an upgrade:

1. The canister is stopped
2. If defined, the `pre_upgrade` hook runs (use with caution)
3. Heap memory is discarded
4. The new Wasm module is installed
5. Stable memory is preserved and made available to the new module
6. If defined, the `post_upgrade` hook runs
7. The canister resumes execution

**Best practice**: avoid relying on `pre_upgrade` hooks for state serialization. A trap in `pre_upgrade` can make your canister non-upgradeable. Use stable structures (Rust) or stable variables (Motoko) instead.

## Canister snapshots

Snapshots provide point-in-time backups of a canister's full state (Wasm module, heap memory, and stable memory). Use them as a safety net before risky upgrades:

```bash
# Stop the canister and take a snapshot
icp canister stop <canister-name>
icp canister snapshot create <canister-name>

# List available snapshots
icp canister snapshot list <canister-name>

# Roll back to a snapshot if something goes wrong
icp canister snapshot load <canister-name> <snapshot-id>
```

Each canister can store up to 10 snapshots. Only a controller can create or load snapshots.

## Storage costs

Storage costs are the same for heap and stable memory: **127K cycles per GiB per second** on a 13-node subnet, which works out to roughly **$5.35 per GiB per year**.

## Resources

- [`ic-stable-structures` crate](https://github.com/dfinity/stable-structures)
- [Stable structures tutorial](https://mmapped.blog/posts/14-stable-structures.html)
- [Motoko stable types](/languages/motoko/fundamentals/stable-types/)
- [Canister settings](/guides/canisters/settings/)
- icskills: [stable-memory](https://github.com/dfinity/icskills/blob/main/skills/stable-memory/SKILL.md)
