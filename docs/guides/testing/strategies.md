---
title: "Testing Strategies"
description: "Test canisters with unit tests, PocketIC integration tests, and benchmarking"
sidebar:
  order: 1
---

Testing [canisters](../../concepts/canisters.md) on ICP deserves particular attention for two reasons. First, canister upgrades are irreversible in
practice: once a buggy upgrade runs `pre_upgrade`, your stable memory may be corrupted before you can roll back.
Second, [cycles](../../concepts/cycles.md) cost real money: a performance regression that doubles your instruction count doubles your operating
cost. Catching these problems in tests before deployment avoids both classes of harm.

## The testing pyramid

Effective canister testing uses three layers, from fastest to slowest:

1. **Unit tests**: Pure Rust or Motoko tests with mocked IC dependencies. Milliseconds per test, no WASM
   compilation, run in parallel. Cover 90%+ of your business logic here.
2. **PocketIC integration tests**: Deploy your canister WASM into a lightweight in-process IC replica. Seconds per
   test, but test actual IC behavior: canister calls, upgrade hooks, stable memory, multi-canister interactions, and
   time-based logic.
3. **Deployed testing**: Test against a real network (local or mainnet) via the CLI or scripts. Slowest, but
   validates deployment configuration, cycles top-up, and inter-canister call routing.

Most projects need all three layers. The key insight is to push as much logic as possible into unit tests, then use
PocketIC integration tests to verify that the IC-specific scaffolding (stable memory encoding, upgrade hooks,
inter-canister calls) behaves correctly end-to-end.

## Unit testing in Rust

The challenge with testing Rust canisters is that `ic_cdk` functions like `ic_cdk::caller()`,
`ic_cdk::api::time()`, and inter-canister calls are not available outside the IC execution environment. The solution
is dependency injection: abstract all non-deterministic IC operations behind traits, then inject mocks in tests.

### Structuring canisters for testability

Define a trait for each external dependency:

```rust
pub trait StorageApi: Send + Sync {
    fn get_count(&self) -> u64;
    fn increment(&self) -> u64;
}
```

Collect dependencies in a central struct:

```rust
use std::sync::Arc;

pub struct CanisterApi {
    pub storage: Arc<dyn StorageApi>,
    // add more dependencies here (governance, time, etc.)
}

impl CanisterApi {
    pub fn new(storage: Arc<dyn StorageApi>) -> Self {
        Self { storage }
    }
}
```

In production, initialize with real implementations. In tests, inject mocks:

```rust
thread_local! {
    pub static CANISTER_API: RefCell<CanisterApi> = RefCell::new({
        let storage = Arc::new(StableMemoryStorage);
        CanisterApi::new(storage)
    });
}
```

### Writing unit tests

With this structure, unit tests run entirely in pure Rust. No WASM, no PocketIC, no network:

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use std::sync::Arc;

    struct TestStorage {
        count: std::cell::Cell<u64>,
    }

    impl StorageApi for TestStorage {
        fn get_count(&self) -> u64 { self.count.get() }
        fn increment(&self) -> u64 {
            let n = self.count.get() + 1;
            self.count.set(n);
            n
        }
    }

    #[test]
    fn test_increment() {
        let storage = Arc::new(TestStorage { count: std::cell::Cell::new(0) });
        let api = CanisterApi::new(storage);

        assert_eq!(api.storage.get_count(), 0);
        assert_eq!(api.storage.increment(), 1);
        assert_eq!(api.storage.increment(), 2);
    }
}
```

Run unit tests with:

```bash
cargo test --lib
```

For a complete working example that shows mocking inter-canister calls, stable memory, and async endpoints, see the
[unit_testable_rust_canister example](https://github.com/dfinity/examples/tree/master/rust/unit_testable_rust_canister).

## Unit testing in Motoko

Motoko unit tests use the [mops](https://mops.one) package manager's test runner. Install the `mops` CLI, add a
test dependency, and run `mops test`.

A typical test file using the `test` package from mops:

```motoko
import { test; suite; expect } "mo:test";
import Counter "Counter";

suite("Counter", func() {
    test("increments correctly", func() {
        let c = Counter.Counter(0);
        c.increment();
        expect.nat(c.get()).equal(1);
    });
});
```

```bash
mops test
```

<!-- Source unavailable: JS SDK pic-js docs are distributed as zip archives, not readable source files — written from content brief and upstream PocketIC Rust crate docs -->

## Integration testing with PocketIC

PocketIC is a lightweight, in-process IC replica designed for testing. It supports Rust and JavaScript/TypeScript.
Use PocketIC to test anything that requires actual IC execution: upgrade hooks, stable memory encoding, query
vs. update semantics, and multi-canister call graphs.

### Rust PocketIC

Add `pocket-ic` to your dev dependencies:

```toml title="Cargo.toml"
[dev-dependencies]
pocket-ic = "9.0.2"
candid = "0.10"
```

A basic integration test deploys your canister WASM and calls it:

```rust
use pocket_ic::{PocketIc, PocketIcBuilder};
use candid::{encode_one, decode_one, Principal};

#[test]
fn test_counter_roundtrip() {
    let pic = PocketIcBuilder::new()
        .with_application_subnet()
        .build();

    // Create and fund the canister
    let canister_id = pic.create_canister();
    pic.add_cycles(canister_id, 2_000_000_000_000);

    // Install the compiled WASM
    let wasm = std::fs::read("target/wasm32-unknown-unknown/release/backend.wasm")
        .expect("build first: cargo build --target wasm32-unknown-unknown --release");
    pic.install_canister(canister_id, wasm, vec![], None);

    // Make an update call
    let result = pic.update_call(
        canister_id,
        Principal::anonymous(),
        "increment_count",
        encode_one(()).unwrap(),
    ).expect("update call failed");

    // Decode and assert
    let count: u64 = decode_one(&result).unwrap();
    assert_eq!(count, 1);
}
```

Run integration tests with:

```bash
# Build the WASM first
cargo build --target wasm32-unknown-unknown --release

# Run integration tests (in tests/ directory, not --lib)
cargo test
```

For advanced PocketIC usage: multi-subnet topologies, time travel, NNS subnet setup, and JavaScript/TypeScript
testing with Pic JS: see [PocketIC](pocket-ic.md).

## Performance benchmarking

ICP canisters run inside a deterministic virtual machine where every instruction is counted. Each update call is
limited to 40 billion instructions. `canbench` measures your canister's instruction count, heap memory, and stable
memory usage: and detects regressions by comparing against saved baselines.

### Setup

Install `canbench`:

```bash
cargo install canbench
```

Add an optional dependency to your `Cargo.toml`:

```toml title="Cargo.toml"
[dependencies]
canbench-rs = { version = "0.1.1", optional = true }
```

Create a `canbench.yml` pointing to your compiled WASM:

```yaml title="canbench.yml"
build_cmd:
  cargo build --release --target wasm32-unknown-unknown --features canbench-rs

wasm_path:
  ./target/wasm32-unknown-unknown/release/<YOUR_CANISTER>.wasm
```

### Writing benchmarks

Annotate benchmark functions with `#[bench]` inside a `canbench-rs` feature gate:

```rust
#[cfg(feature = "canbench-rs")]
mod benches {
    use super::*;
    use canbench_rs::bench;

    #[bench]
    fn fibonacci_20() {
        println!("{:?}", fibonacci(20));
    }
}
```

### Running benchmarks

```bash
canbench
```

Sample output:

```text
---------------------------------------------------
Benchmark: fibonacci_20 (new)
  total:
    instructions: 2301 (new)
    heap_increase: 0 pages (new)
    stable_memory_increase: 0 pages (new)
---------------------------------------------------
Executed 1 of 1 benchmarks.
```

Run `canbench` a second time after saving results: it compares against the baseline and reports regressions. Commit
the `canbench_results.yml` file to your repository so CI can catch regressions automatically.

For full crate documentation, see [canbench-rs on docs.rs](https://docs.rs/canbench-rs/latest/canbench_rs/).

## Containerized test networks

This section covers the "Deployed testing" tier of the testing pyramid: running tests against a full local network
rather than an in-process PocketIC replica. icp-cli supports Docker-based test networks for this purpose, which is
useful when you need to test deployment configuration, CLI workflows, asset canister behavior, or anything that
requires real network I/O.

### Configure a containerized network

Add a Docker-based network to `icp.yaml`:

```yaml title="icp.yaml"
networks:
  - name: docker-test
    mode: managed
    image: ghcr.io/dfinity/icp-cli-network-launcher
    port-mapping:
      - "8001:4943"
    rm-on-exit: true

environments:
  - name: test
    network: docker-test
    canisters: [backend]
```

### Run tests against the network

```bash
# Start the containerized network
icp network start docker-test

# Deploy to the test environment
icp deploy -e test

# Run your test scripts against http://localhost:8001
# ...

# Stop and clean up
icp network stop docker-test
```

The `rm-on-exit: true` flag removes the Docker container when the network stops, keeping CI environments clean.

For CI/CD pipelines, use `port-mapping: ["0:4943"]` to let Docker assign an available port, then read the actual
port with:

```bash
icp network status docker-test --json
```

For the full containerized network configuration reference: including environment variables, volume mounts, and
custom images: see the
[icp-cli containerized networks guide](https://cli.internetcomputer.org/guides/containerized-networks).

## Choosing the right approach

| Scenario | Recommended approach |
|---|---|
| Business logic, pure functions | Unit tests (Rust `#[test]` or Motoko `mops test`) |
| Upgrade hooks, stable memory encoding | PocketIC integration tests |
| Inter-canister calls | Unit tests (mocked) + PocketIC for end-to-end |
| Performance regression detection | `canbench` benchmarks in CI |
| Deployment config, asset canister | Containerized network tests |
| Candid interface compatibility | `candid_parser::utils::service_equal` in unit tests |

## Next steps

- [PocketIC](pocket-ic.md): Advanced integration testing: multi-subnet, time travel, Pic JS for TypeScript
- [Canister management: lifecycle](../canister-management/lifecycle.md): Test upgrade paths before deploying
- [Canister management: logs](../canister-management/logs.md): Add observability for debugging test failures

<!-- Upstream: informed by dfinity/portal docs/building-apps/advanced/benchmarking.mdx; dfinity/icp-cli docs/guides/containerized-networks.md; dfinity/examples rust/unit_testable_rust_canister -->
