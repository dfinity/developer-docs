---
title: "Rust CDK Overview"
description: "Rust Canister Development Kit overview for Internet Computer development"
sidebar:
  order: 1
  label: "Overview"
doc_type: explanation
level: beginner
last_verified: 2026-03-10
---

Rust is a first-class language for building canisters on ICP. The Rust CDK (Canister Development Kit) provides macros and runtime support that integrate Rust code with ICP's execution environment. You get the full power of the Rust ecosystem -- crates.io, strong tooling, and fine-grained control over memory and performance.

## Why Rust on ICP?

- **Performance** -- Rust compiles to highly optimized Wasm, ideal for compute-intensive canisters.
- **Mature ecosystem** -- Access thousands of crates from crates.io.
- **Memory control** -- Direct management of heap and stable memory for large-scale data.
- **Safety** -- Rust's ownership model prevents common classes of bugs at compile time.
- **Wasm-native** -- Rust has first-class Wasm compilation support.

## Key crates

| Crate | Purpose |
|-------|---------|
| [`ic-cdk`](https://docs.rs/ic-cdk) | Core CDK: macros, system API bindings, inter-canister calls |
| [`ic-cdk-timers`](https://docs.rs/ic-cdk-timers) | Timer-based scheduling |
| [`candid`](https://docs.rs/candid) | Candid serialization/deserialization |
| [`ic-stable-structures`](https://docs.rs/ic-stable-structures) | Persistent data structures in stable memory |
| [`ic-agent`](https://docs.rs/ic-agent) | Off-chain agent for calling canisters (used in tests and tooling) |

Add them to your `Cargo.toml`:

```toml
[dependencies]
ic-cdk = "0.17"
ic-cdk-timers = "0.11"
candid = "0.10"
ic-stable-structures = "0.6"
```

## Canister entry points

The CDK uses attribute macros to mark functions as canister endpoints:

### `#[update]` -- State-changing calls

```rust
use ic_cdk::update;

#[update]
fn increment() -> u64 {
    COUNTER.with(|c| {
        let mut count = c.borrow_mut();
        *count += 1;
        *count
    })
}
```

### `#[query]` -- Read-only calls

```rust
use ic_cdk::query;

#[query]
fn get() -> u64 {
    COUNTER.with(|c| *c.borrow())
}
```

### `#[init]` -- Canister initialization

```rust
use ic_cdk::init;

#[init]
fn init(initial_value: u64) {
    COUNTER.with(|c| *c.borrow_mut() = initial_value);
}
```

### `#[pre_upgrade]` and `#[post_upgrade]` -- Upgrade hooks

```rust
use ic_cdk::{pre_upgrade, post_upgrade};
use ic_cdk::storage;

#[pre_upgrade]
fn pre_upgrade() {
    let count = COUNTER.with(|c| *c.borrow());
    storage::stable_save((count,)).expect("failed to save");
}

#[post_upgrade]
fn post_upgrade() {
    let (count,): (u64,) = storage::stable_restore().expect("failed to restore");
    COUNTER.with(|c| *c.borrow_mut() = count);
}
```

## Stable memory

For data that must persist across upgrades, use `ic-stable-structures`:

```rust
use ic_stable_structures::{StableBTreeMap, DefaultMemoryImpl};

thread_local! {
    static MAP: RefCell<StableBTreeMap<u64, String, DefaultMemoryImpl>> =
        RefCell::new(StableBTreeMap::init(DefaultMemoryImpl::default()));
}
```

Stable structures write directly to stable memory, so data persists without explicit serialization in upgrade hooks.

## Inter-canister calls

```rust
use ic_cdk::call;

let (balance,): (candid::Nat,) = call(
    ledger_canister_id,
    "icrc1_balance_of",
    (Account { owner, subaccount: None },),
).await.map_err(|e| format!("Call failed: {:?}", e))?;
```

## Project setup

Create a new Rust canister project:

```bash
icp new my-project --subfolder rust
cd my-project
```

The generated project includes:
- `Cargo.toml` with CDK dependencies.
- `src/lib.rs` with a basic canister.
- `icp.yaml` with canister configuration.

Build and deploy:

```bash
icp network start -d
icp deploy
```

## Optimizing Wasm size

Rust canisters can produce large Wasm modules. Use [ic-wasm](https://github.com/dfinity/ic-wasm) to shrink them:

```bash
ic-wasm target/wasm32-unknown-unknown/release/my_canister.wasm -o my_canister_opt.wasm shrink
```

The `icp` CLI runs `ic-wasm` optimizations automatically during deployment.

## When to choose Rust vs Motoko

| Factor | Rust | Motoko |
|--------|------|--------|
| Performance | Best for compute-intensive work | Good for most use cases |
| Ecosystem | Large (crates.io) | ICP-specific (Mops) |
| Memory management | Manual stable memory control | Orthogonal persistence built in |
| Learning curve | Steeper (ownership, lifetimes) | Lower (purpose-built for ICP) |
| Wasm size | Larger (use ic-wasm to optimize) | Smaller |

Choose Rust when you need maximum performance, want to leverage existing Rust libraries, or need fine-grained stable memory control. Choose Motoko when simplicity and rapid development are priorities.

## Further reading

- [ic-cdk API reference](https://docs.rs/ic-cdk)
- [ic-stable-structures docs](https://docs.rs/ic-stable-structures)
- [Candid reference](https://docs.rs/candid)
- [ic-wasm optimizer](https://github.com/dfinity/ic-wasm)
- [Motoko overview](/languages/motoko/)
