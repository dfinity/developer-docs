---
title: "Canister Lifecycle"
description: "Create, deploy, upgrade, and delete canisters on the Internet Computer."
sidebar:
  order: 1
doc_type: how-to
level: intermediate
features: []
icskills: []
last_verified: 2026-03-10
---

A canister goes through four main lifecycle stages: creation, code installation, upgrades, and deletion. Each stage has specific CLI commands and behaviors you need to understand.

## Create a canister

Creating a canister reserves an ID and allocates resources on a subnet, but does not install any code.

```bash
# Create locally
icp canister create my_canister

# Create on mainnet
icp canister create my_canister --environment ic
```

You can specify an initial controller at creation time:

```bash
icp canister create my_canister --controller <principal-id>
```

## Deploy (build + install)

The `icp deploy` command builds your code and installs it in one step:

```bash
# Deploy all canisters locally
icp deploy

# Deploy a specific canister to mainnet
icp deploy my_canister --environment ic
```

Under the hood, `icp deploy` runs `icp canister create`, `icp build`, and `icp canister install` in sequence.

## Install modes

When installing code into a canister, there are three modes:

| Mode | Preserves state? | Use case |
|------|-------------------|----------|
| `install` | N/A (fresh canister) | First-time installation |
| `upgrade` | Yes (stable memory) | Adding features, fixing bugs |
| `reinstall` | No | Full reset, development only |

```bash
# First-time install
icp canister install my_canister

# Upgrade (preserves stable memory)
icp canister install my_canister --mode upgrade

# Reinstall (wipes all state)
icp canister install my_canister --mode reinstall
```

## Upgrades and state preservation

During an upgrade, the system executes the following sequence:

1. **`pre_upgrade`** hook runs in the old code (serialize state to stable memory)
2. Old Wasm module is replaced with the new one
3. **`post_upgrade`** hook runs in the new code (deserialize state from stable memory)

### Motoko

In Motoko, mark variables as `stable` to automatically persist them across upgrades:

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
}
```

Motoko handles serialization of `stable` variables automatically. For types that cannot be made stable directly, use `pre_upgrade` and `post_upgrade` system methods to convert them.

### Rust

In Rust, use stable memory explicitly via `pre_upgrade` and `post_upgrade`:

```rust
use ic_cdk::{pre_upgrade, post_upgrade, storage};
use std::cell::RefCell;

thread_local! {
    static COUNTER: RefCell<u64> = RefCell::new(0);
}

#[pre_upgrade]
fn pre_upgrade() {
    COUNTER.with(|c| {
        ic_cdk::storage::stable_save((*c.borrow(),)).unwrap();
    });
}

#[post_upgrade]
fn post_upgrade() {
    let (count,): (u64,) = ic_cdk::storage::stable_restore().unwrap();
    COUNTER.with(|c| *c.borrow_mut() = count);
}
```

Alternatively, use `ic-stable-structures` for direct stable memory data structures that do not require serialization hooks.

## Canister state management

A canister can be in one of three states: **Running**, **Stopping**, or **Stopped**.

```bash
# Check canister status
icp canister status my_canister

# Stop a canister (drains pending messages)
icp canister stop my_canister

# Restart a stopped canister
icp canister start my_canister
```

Stop a canister before upgrading to ensure no in-flight messages are lost.

## Delete a canister

Deleting a canister permanently removes its code and state. This cannot be undone.

```bash
# Stop first, then delete
icp canister stop my_canister
icp canister delete my_canister
```

Remaining cycles are returned to the identity that initiated the deletion.

## Next steps

- [Canister settings](/guides/canisters/settings/) -- configure controllers, memory, and compute limits
- [Canister optimization](/guides/canisters/optimization/) -- reduce Wasm size and cycle consumption
- [icp-cli CLI reference](https://dfinity.github.io/icp-cli/reference/cli/) -- deploy, build, and canister management commands
