---
title: "Rust CDK"
description: "Build ICP canisters with Rust using the ic-cdk canister development kit"
sidebar:
  order: 2
---

Rust is a natural fit for building canisters on the Internet Computer. Its strong type system, zero-cost abstractions, and memory safety guarantees produce reliable, high-performance Wasm modules. The **Rust CDK** (Canister Development Kit) provides the libraries and macros that connect your Rust code to the ICP system API.

## CDK crates

The Rust CDK is split into focused crates that you pull in as needed:

| Crate | Purpose |
|-------|---------|
| [`ic-cdk`](https://crates.io/crates/ic-cdk) | Core library: system API bindings, inter-canister calls, canister state |
| [`ic-cdk-macros`](https://crates.io/crates/ic-cdk-macros) | Procedural macros that register Rust functions as canister entry points (re-exported by `ic-cdk`) |
| [`ic-cdk-timers`](https://crates.io/crates/ic-cdk-timers) | One-shot and periodic timer scheduling |

You will also commonly use these companion crates:

| Crate | Purpose |
|-------|---------|
| [`candid`](https://crates.io/crates/candid) | Candid serialization: types, encoding, decoding |
| [`ic-stable-structures`](https://crates.io/crates/ic-stable-structures) | Persistent data structures that survive canister upgrades (see [Stable Structures](stable-structures.md)) |

## Quick example

A minimal counter canister with a query and an update method:

```rust
use std::cell::RefCell;

thread_local! {
    static COUNTER: RefCell<u64> = RefCell::new(0);
}

#[ic_cdk::query]
fn get() -> u64 {
    COUNTER.with(|c| *c.borrow())
}

#[ic_cdk::update]
fn increment() -> u64 {
    COUNTER.with(|c| {
        let mut val = c.borrow_mut();
        *val += 1;
        *val
    })
}

ic_cdk::export_candid!();
```

The `#[query]` and `#[update]` macros register Rust functions as canister endpoints. `export_candid!()` generates the Candid interface file so callers and tools can discover your canister's API automatically.

## Getting started

### Prerequisites

Install the Rust toolchain and the Wasm compilation target:

```bash
rustup target add wasm32-unknown-unknown
```

You also need `candid-extractor`, which the Rust recipe uses to auto-generate Candid interface files:

```bash
cargo install candid-extractor
```

### Project setup with icp-cli

Create a new project using the Rust template:

```bash
icp new my_project --subfolder rust
```

This generates an `icp.yaml` with a Rust canister recipe and a Cargo workspace. The key files are:

**icp.yaml**: declares the canister and its build recipe:

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/rust@<version>"
      configuration:
        package: backend
        shrink: true
```

**Cargo.toml**: must set the crate type to `cdylib` so the compiler produces a Wasm module:

```toml
[lib]
crate-type = ["cdylib"]

[dependencies]
ic-cdk = "0.19"
candid = "0.10"
```

Start a local network and deploy:

```bash
icp network start -d
icp deploy
```

See the [Quickstart](../../getting-started/quickstart.md) for a full walkthrough.

## Canister macros

Every canister entry point is a plain Rust function annotated with a procedural macro. The macros handle Candid serialization and hook into the ICP system API.

### Endpoint macros

| Macro | Description |
|-------|-------------|
| `#[query]` | Registers a read-only query method. Queries are fast (no consensus) but cannot modify state. |
| `#[update]` | Registers a state-modifying update method. Updates go through consensus. |

Both macros accept an optional `name` argument to set the Candid method name if it should differ from the Rust function name:

```rust
#[ic_cdk::query(name = "greet")]
fn greet_user(name: String) -> String {
    format!("Hello, {name}!")
}
```

### Lifecycle macros

| Macro | When it runs |
|-------|-------------|
| `#[init]` | Once, when the canister is first created. Use it to initialize state. |
| `#[pre_upgrade]` | Before a canister upgrade. Save any state that must survive the upgrade. |
| `#[post_upgrade]` | After a canister upgrade. Restore state saved in `pre_upgrade`. |

### System macros

| Macro | Purpose |
|-------|---------|
| `#[heartbeat]` | Called once per round by the system. Prefer `ic-cdk-timers` for scheduled work. |
| `#[inspect_message]` | Runs before update calls. Call `ic_cdk::api::accept_message()` to allow the call, or trap to reject it. |
| `#[on_low_wasm_memory]` | Triggered when Wasm memory usage crosses the configured threshold. |
| `export_candid!()` | Generates the `.did` Candid interface file from all annotated endpoints. Place this at the module root. |

## Async support and inter-canister calls

Entry points can be `async`. The CDK embeds its own async executor, so you can `.await` inter-canister calls directly:

```rust
use candid::Principal;
use ic_cdk::call::Call;

#[ic_cdk::update]
async fn call_other(canister: Principal) -> String {
    Call::bounded_wait(canister, "greet")
        .with_arg("World")
        .await
        .expect("call failed")
        .candid::<(String,)>()
        .expect("decode failed")
        .0
}
```

If you need to run work in the background after replying, use `ic_cdk::futures::spawn`:

```rust
#[ic_cdk::update]
async fn fire_and_forget() {
    ic_cdk::futures::spawn(async {
        // background work here
    });
}
```

> **Important:** Do not use `tokio`, `async-std`, or other async runtimes. They rely on OS threading and I/O primitives that are not available in the Wasm execution environment. Use the CDK's built-in executor and `ic_cdk::futures::spawn` instead.

## Data persistence

Rust canisters on ICP benefit from [orthogonal persistence](../../concepts/orthogonal-persistence.md): heap data is preserved across update calls automatically. However, heap data is **lost during canister upgrades** unless you explicitly save and restore it.

Two strategies for handling upgrades:

1. **Stable structures**: use the `ic-stable-structures` crate to store data in stable memory, which survives upgrades without any serialization. This is the recommended approach. See [Stable Structures](stable-structures.md).
2. **Pre/post upgrade hooks**: serialize heap data in `#[pre_upgrade]` and deserialize in `#[post_upgrade]`. Simpler for small state but does not scale well.

For a deeper look at persistence patterns across languages, see the [Data persistence guide](../../guides/backends/data-persistence.md).

## Wasm limitations and workarounds

Rust canisters compile to `wasm32-unknown-unknown`. Most pure-computation crates work out of the box, but anything that touches OS-level I/O, threading, or time does not. Here are the common issues and their solutions:

| What you need | Standard Rust | ICP equivalent |
|---------------|--------------|----------------|
| Threads / parallelism | `std::thread`, `rayon` | Not available. Use `ic_cdk::futures::spawn` for concurrent async tasks. |
| Sleep / delays | `std::thread::sleep` | Use `ic-cdk-timers` to schedule future execution. |
| Current time | `std::time::Instant` | `ic_cdk::api::time()` returns nanoseconds since the epoch. |
| Environment variables | `std::env::var` | Not available at runtime. Use `env!()` or `option_env!()` to embed values at compile time. |
| Random numbers | `rand`, `getrandom` | Use `ic_cdk::management_canister::raw_rand()` for onchain randomness, or implement `getrandom::register_custom_getrandom!` for crates that depend on `getrandom`. |
| Network I/O | `reqwest`, `hyper` | Use [HTTPS outcalls](../../guides/canister-calls/offchain-calls.md) via the management canister. |

Most crates that target `wasm32-unknown-unknown` for browser use (via `wasm-bindgen` or `wasm-pack`) will **not** work because they depend on JavaScript host bindings that do not exist in the ICP runtime.

## Further reading

- [Quickstart](../../getting-started/quickstart.md): Create and deploy your first canister
- [Stable Structures](stable-structures.md): Persistent data structures for Rust canisters
- [Testing Rust Canisters](testing.md): Unit and integration testing strategies
- [`ic-cdk` API docs](https://docs.rs/ic-cdk): Complete API reference
- [`ic-cdk-timers` API docs](https://docs.rs/ic-cdk-timers): Timer scheduling API
- [Motoko](../motoko/index.md): Alternative language for ICP canister development

<!-- Upstream: informed by dfinity/cdk-rs ic-cdk/README.md, dfinity/portal docs/building-apps/developer-tools/cdks/rust/ -->
