---
title: "Testing Rust canisters"
description: "Unit and integration testing patterns for Rust canisters, including dependency injection, mocking, and PocketIC"
sidebar:
  order: 3
---

Testing Rust canisters requires a different mindset from ordinary Rust testing because most IC-specific APIs
(`ic_cdk::caller()`, `ic_cdk::api::time()`, inter-canister calls) are only available inside a live IC execution
environment. The key is to isolate those dependencies behind traits so your business logic can be tested in plain
Rust without any IC infrastructure.

This page covers the two main testing layers for Rust:

- **Unit tests**: pure Rust with mocked IC dependencies; milliseconds per test
- **Integration tests**: deploy your canister WASM into PocketIC and make real calls

For a general overview of the testing pyramid and guidance on Motoko testing, see
[Testing strategies](../../guides/testing/strategies.md). For advanced PocketIC features (multi-subnet, time travel,
Pic JS), see [PocketIC](../../guides/testing/pocket-ic.md).

## Structuring canisters for unit testing

The challenge is that `ic_cdk` functions trap when called outside the IC runtime. The solution is
**dependency injection**: define a trait for each external dependency (stable memory, inter-canister calls,
time), provide real implementations for production, and provide in-memory implementations in tests.

### Define traits for external dependencies

Identify every IC-specific operation your canister performs and model each as a trait. For example, a counter
canister that reads and writes stable memory:

```rust
// counter.rs
pub trait Counter: Send + Sync {
    fn get_count(&self) -> u64;
    fn increment_count(&self) -> u64;
    fn decrement_count(&self) -> u64;
}
```

For inter-canister calls, define a trait that wraps the remote canister's interface. This lets unit tests inject
a mock that returns pre-configured results without any actual Wasm execution:

```rust
// governance.rs
use async_trait::async_trait;

#[async_trait]
pub trait GovernanceApi: Send + Sync {
    async fn list_proposals(
        &self,
        request: ListProposalInfo,
    ) -> Result<ListProposalInfoResponse, String>;

    async fn get_proposal_info(
        &self,
        proposal_id: u64,
    ) -> Result<Option<ProposalInfo>, String>;
}
```

### Collect dependencies in a central struct

Instead of using generics throughout your business logic (which becomes unwieldy), collect all dependencies in a
single `CanisterApi` struct using `Arc<dyn Trait>`:

```rust
// canister_api.rs
use std::sync::Arc;
use crate::counter::Counter;
use crate::governance::GovernanceApi;

pub struct CanisterApi {
    governance: Arc<dyn GovernanceApi>,
    counter: Arc<dyn Counter>,
}

impl CanisterApi {
    pub fn new(governance: Arc<dyn GovernanceApi>, counter: Arc<dyn Counter>) -> Self {
        Self { governance, counter }
    }

    pub fn get_count(&self) -> u64 {
        self.counter.get_count()
    }

    pub fn increment_count(&self) -> u64 {
        self.counter.increment_count()
    }
}
```

Business logic functions take `&CanisterApi` directly. No nested generics required.

### Initialize with production dependencies

In `lib.rs`, initialize the thread-local with real implementations:

```rust
// lib.rs
use std::cell::RefCell;
use std::sync::Arc;

thread_local! {
    pub static CANISTER_API: RefCell<CanisterApi> = RefCell::new({
        let governance = Arc::new(NnsGovernanceApi::new());
        let counter = Arc::new(StableMemoryCounter);
        CanisterApi::new(governance, counter)
    });
}

#[ic_cdk::query]
fn get_count(_: GetCountRequest) -> GetCountResponse {
    CANISTER_API.with(|api| api.borrow().get_count())
}

#[ic_cdk::update]
fn increment_count(_: IncrementCountRequest) -> IncrementCountResponse {
    CANISTER_API.with(|api| api.borrow().increment_count())
}
```

### Production implementation: stable memory counter

The production `Counter` reads and writes stable memory via `ic-stable-structures`:

```rust
// counter.rs (production)
pub struct StableMemoryCounter;

impl Counter for StableMemoryCounter {
    fn get_count(&self) -> u64 {
        with_counter(|c| *c)
    }
    fn increment_count(&self) -> u64 {
        with_counter_mut(|c| { *c += 1; *c })
    }
    fn decrement_count(&self) -> u64 {
        with_counter_mut(|c| { *c = c.saturating_sub(1); *c })
    }
}
```

### Test implementation: in-memory counter

The test `Counter` uses a plain `Mutex<u64>` and works in any Rust test runner:

```rust
// counter.rs (test utilities)
#[cfg(test)]
pub mod test_util {
    use super::*;
    use std::sync::{Arc, Mutex};

    #[derive(Default)]
    pub struct TestCounter {
        count: Arc<Mutex<u64>>,
    }

    impl TestCounter {
        pub fn new() -> Self { Default::default() }
    }

    impl Counter for TestCounter {
        fn get_count(&self) -> u64 {
            *self.count.lock().unwrap()
        }
        fn increment_count(&self) -> u64 {
            let mut g = self.count.lock().unwrap();
            *g = g.saturating_add(1);
            *g
        }
        fn decrement_count(&self) -> u64 {
            let mut g = self.count.lock().unwrap();
            *g = g.saturating_sub(1);
            *g
        }
    }
}
```

### Mock implementation for inter-canister calls

For traits that wrap inter-canister calls, provide a mock that returns pre-configured data without touching
the IC runtime:

```rust
// governance.rs (mock, inside #[cfg(test)])
#[cfg(test)]
pub mod test_utils {
    use super::*;
    use std::sync::{Arc, RwLock};

    #[derive(Clone)]
    pub struct MockGovernanceApi {
        proposals: Arc<RwLock<Vec<ProposalInfo>>>,
        should_fail_list: bool,
        should_fail_get: bool,
    }

    impl MockGovernanceApi {
        pub fn new() -> Self {
            // Populate with 20 test proposals
            let proposals = (0..20)
                .map(|id| ProposalInfo {
                    id: Some(ProposalId { id }),
                    proposal: Some(Box::from(Proposal {
                        title: Some(format!("Test title {id}")),
                        // ...
                    })),
                    // ...
                })
                .collect();
            Self { proposals: Arc::new(RwLock::new(proposals)), should_fail_list: false, should_fail_get: false }
        }

        pub fn with_failure_modes(should_fail_list: bool, should_fail_get: bool) -> Self {
            let mut m = Self::new();
            m.should_fail_list = should_fail_list;
            m.should_fail_get = should_fail_get;
            m
        }
    }

    #[async_trait]
    impl GovernanceApi for MockGovernanceApi {
        async fn list_proposals(&self, request: ListProposalInfo) -> Result<ListProposalInfoResponse, String> {
            if self.should_fail_list { return Err("Mock failure: list_proposals".to_string()); }
            let proposals = self.proposals.read().unwrap();
            let limit = request.limit as usize;
            let filtered: Vec<_> = proposals.iter().take(limit).cloned().collect();
            Ok(ListProposalInfoResponse { proposal_info: filtered })
        }

        async fn get_proposal_info(&self, proposal_id: u64) -> Result<Option<ProposalInfo>, String> {
            if self.should_fail_get { return Err("Mock failure: get_proposal".to_string()); }
            let proposals = self.proposals.read().unwrap();
            Ok(proposals.iter().find(|p| p.id.as_ref().unwrap().id == proposal_id).cloned())
        }
    }
}
```

## Writing unit tests

With the traits and mocks in place, unit tests construct a `CanisterApi` with test implementations directly:

```rust
// canister_api.rs
#[cfg(test)]
mod tests {
    use super::*;
    use crate::governance::test_utils::MockGovernanceApi;
    use crate::counter::test_util::TestCounter;
    use std::sync::Arc;

    fn create_test_api() -> CanisterApi {
        let governance = Arc::new(MockGovernanceApi::new());
        let counter = Arc::new(TestCounter::new());
        CanisterApi::new(governance, counter)
    }

    #[test]
    fn test_counter_endpoints() {
        let api = create_test_api();

        let response = api.get_count();
        assert_eq!(response.count, Some(0));

        let response = api.increment_count();
        assert_eq!(response.new_count, Some(1));

        let response = api.increment_count();
        assert_eq!(response.new_count, Some(2));

        let response = api.decrement_count();
        assert_eq!(response.new_count, Some(1));

        // Underflow is saturating
        api.decrement_count();
        api.decrement_count();
        let response = api.decrement_count();
        assert_eq!(response.new_count, Some(0));
    }
}
```

For async methods that drive inter-canister calls, use the `tokio` async runtime in dev dependencies:

```rust
// Cargo.toml
[dev-dependencies]
tokio = { version = "1.0", features = ["macros", "rt"] }
```

```rust
// Async unit test: no IC runtime needed
thread_local! {
    static TEST_API: RefCell<CanisterApi> = RefCell::new({
        let governance = Arc::new(MockGovernanceApi::new());
        let counter = Arc::new(TestCounter::new());
        CanisterApi::new(governance, counter)
    });
}

#[tokio::test]
async fn test_get_proposal_info_success() {
    let response = CanisterApi::get_proposal_info(
        &TEST_API,
        GetProposalInfoRequest { proposal_id: Some(1) },
    ).await;

    assert!(response.error.is_none());
    let info = response.basic_info.unwrap();
    assert_eq!(info.id.unwrap(), 1);
}

#[tokio::test]
async fn test_get_proposal_info_missing_id() {
    let response = CanisterApi::get_proposal_info(
        &TEST_API,
        GetProposalInfoRequest { proposal_id: None },
    ).await;

    assert!(response.basic_info.is_none());
    assert_eq!(response.error.as_deref(), Some("Missing proposal_id"));
}

#[tokio::test]
async fn test_error_propagation() {
    thread_local! {
        static FAILING_API: RefCell<CanisterApi> = RefCell::new({
            let governance = Arc::new(MockGovernanceApi::with_failure_modes(false, true));
            let counter = Arc::new(TestCounter::new());
            CanisterApi::new(governance, counter)
        });
    }

    let response = CanisterApi::get_proposal_info(
        &FAILING_API,
        GetProposalInfoRequest { proposal_id: Some(1) },
    ).await;

    assert!(response.basic_info.is_none());
    assert_eq!(response.error.as_deref(), Some("Mock failure: get_proposal"));
}
```

### Running unit tests

```bash
# Run unit tests only (fast, no WASM compilation)
cargo test --lib

# Run a specific test
cargo test --lib test_counter_endpoints
```

Each test runs in its own OS thread, so thread-local state is isolated automatically.

## Verifying your Candid interface

A common source of hard-to-diagnose bugs is a mismatch between your Rust implementation and your committed
`.did` file. Add this test to catch interface drift at compile time:

```rust
// lib.rs
ic_cdk::export_candid!();

#[cfg(test)]
mod tests {
    use super::*;
    use candid_parser::utils::{service_equal, CandidSource};
    use std::env;
    use std::path::PathBuf;

    #[test]
    fn candid_interface_compatibility() {
        let manifest_dir = env::var("CARGO_MANIFEST_DIR").unwrap();
        let candid_path = PathBuf::from(&manifest_dir).join("my_canister.did");

        let declared = std::fs::read_to_string(&candid_path).unwrap();
        let actual = __export_service();

        let result = service_equal(
            CandidSource::Text(&declared),
            CandidSource::Text(&actual),
        );
        assert!(result.is_ok(), "Candid interface mismatch:\n{:?}", result);
    }
}
```

Add `candid_parser` to dev dependencies:

```toml title="Cargo.toml"
[dev-dependencies]
candid_parser = "0.2"
```

This test fails if you add, remove, or change a method signature without updating the `.did` file: catching
the mismatch before deployment.

## Integration testing with PocketIC

PocketIC deploys your compiled canister WASM into an in-process IC replica and lets you make real update
and query calls. Use it to test anything that requires actual IC execution: upgrade hooks, stable memory
encoding, and multi-canister interactions.

### Setup

Add `pocket-ic` to dev dependencies:

```toml title="Cargo.toml"
[dev-dependencies]
pocket-ic = "9.0.2"
candid = "0.10"
```

Build your canister WASM before running integration tests:

```bash
cargo build --target wasm32-unknown-unknown --release
```

### Loading the WASM

Integration tests need to read the compiled WASM file at test time. A common pattern is to load it from the
`target/` directory, optionally rebuilding if source files are newer:

```rust
// tests/integration_tests.rs
use pocket_ic::{PocketIc, PocketIcBuilder};
use candid::{encode_one, decode_one, Principal};

fn get_wasm() -> Vec<u8> {
    // The relative path assumes a standard cargo workspace layout. Adjust if your
    // project structure differs. See the unit_testable_rust_canister example for a
    // timestamp-based rebuild helper that avoids manual build steps.
    let path = "../../target/wasm32-unknown-unknown/release/my_canister.wasm";
    std::fs::read(path)
        .expect("build first: cargo build --target wasm32-unknown-unknown --release")
}
```

### Deploy and call

```rust
fn setup_pic() -> PocketIc {
    PocketIcBuilder::new()
        .with_application_subnet()
        .build()
}

fn deploy_canister(pic: &PocketIc) -> Principal {
    let canister_id = pic.create_canister();
    pic.add_cycles(canister_id, 2_000_000_000_000);
    pic.install_canister(canister_id, get_wasm(), vec![], None);

    // Let the canister initialize
    for _ in 0..5 { pic.tick(); }

    canister_id
}
```

### Update and query helpers

Define typed helpers to avoid repeating encode/decode boilerplate across tests:

```rust
use candid::{CandidType, Principal};
use serde::Deserialize;

fn update_call<T: CandidType + for<'de> Deserialize<'de>>(
    pic: &PocketIc,
    canister_id: Principal,
    method: &str,
    args: Vec<u8>,
) -> T {
    let result = pic.update_call(canister_id, Principal::anonymous(), method, args)
        .expect("update call failed");
    decode_one(&result).expect("decode failed")
}

fn query_call<T: CandidType + for<'de> Deserialize<'de>>(
    pic: &PocketIc,
    canister_id: Principal,
    method: &str,
    args: Vec<u8>,
) -> T {
    let result = pic.query_call(canister_id, Principal::anonymous(), method, args)
        .expect("query call failed");
    decode_one(&result).expect("decode failed")
}
```

### A complete integration test

```rust
#[test]
fn test_counter_integration() {
    let pic = setup_pic();
    let canister_id = deploy_canister(&pic);

    // Query initial state
    let response: GetCountResponse =
        query_call(&pic, canister_id, "get_count", encode_one(GetCountRequest {}).unwrap());
    assert_eq!(response.count, Some(0));

    // Increment
    let response: IncrementCountResponse =
        update_call(&pic, canister_id, "increment_count", encode_one(IncrementCountRequest {}).unwrap());
    assert_eq!(response.new_count, Some(1));

    // Confirm the counter persisted
    let response: GetCountResponse =
        query_call(&pic, canister_id, "get_count", encode_one(GetCountRequest {}).unwrap());
    assert_eq!(response.count, Some(1));
}
```

### Running integration tests

Integration tests live in a `tests/` directory alongside `src/` and are compiled separately. They require
a WASM build first:

```bash
# Build the WASM
cargo build --target wasm32-unknown-unknown --release

# Run all tests (including integration tests in tests/)
cargo test

# Run only integration tests
cargo test --test integration_tests
```

## Testing canister upgrades

Upgrade paths are a common source of data loss. PocketIC lets you test them without deploying to a live network:

```rust
#[test]
fn test_upgrade_preserves_state() {
    let pic = setup_pic();
    let canister_id = deploy_canister(&pic);

    // Set some state
    let _: IncrementCountResponse =
        update_call(&pic, canister_id, "increment_count", encode_one(IncrementCountRequest {}).unwrap());

    // Upgrade with the same WASM (or a new version)
    let new_wasm = get_wasm();
    pic.upgrade_canister(canister_id, new_wasm, vec![], None)
        .expect("upgrade failed");

    // Verify state survived
    let response: GetCountResponse =
        query_call(&pic, canister_id, "get_count", encode_one(GetCountRequest {}).unwrap());
    assert_eq!(response.count, Some(1));
}
```

## Testing with NNS and system canisters

If your canister calls system canisters (NNS governance, ledger, etc.), configure PocketIC with the appropriate
subnets:

```rust
fn setup_pic_with_nns() -> PocketIc {
    PocketIcBuilder::new()
        .with_application_subnet()
        .with_nns_subnet()
        .build()
}
```

You can then create canisters with specific mainnet canister IDs using
`pic.create_canister_with_id(controller, None, canister_id)` and install the corresponding WASM.

> **Important:** Setting up NNS canisters for integration tests (downloading production WASM binaries, building
> correct init arguments) is complex. This is a key reason to prefer unit tests with mocked dependencies for
> testing business logic. Reserve integration tests with real system canisters for verifying that the inter-canister
> call wiring itself works correctly.

## Cargo.toml configuration summary

A typical `Cargo.toml` for a testable canister:

```toml title="Cargo.toml"
[package]
name = "my_canister"
version = "0.1.0"
edition = "2021"

[lib]
path = "src/lib.rs"
crate-type = ["lib", "cdylib"]

[dependencies]
ic-cdk = "0.19"
candid = "0.10"
serde = { version = "1.0", features = ["derive"] }
ic-stable-structures = "0.6"
async-trait = "0.1"

[dev-dependencies]
candid_parser = "0.2"
pocket-ic = "9.0.2"
tokio = { version = "1.0", features = ["macros", "rt"] }
```

Note the dual crate type: `"lib"` lets unit tests import the crate directly; `"cdylib"` produces the `.wasm`
file for integration tests and deployment.

## Performance considerations

| Test type | Typical duration | Parallelism |
|---|---|---|
| Unit tests (`cargo test --lib`) | ~1ms per test | Full: each test runs in its own thread |
| Integration tests with PocketIC | 1–5s per test | Full: each test creates its own `PocketIc` instance |
| Integration tests with NNS setup | 10–30s per test | Full: but slow enough to run in a dedicated test binary |

The goal is to maximize coverage in unit tests so only a small number of integration tests are needed. A ratio of
90% unit tests to 10% integration tests is a reasonable target for most canisters.

## CI setup

Running canister tests in CI requires two extra steps compared to ordinary Rust projects: downloading the PocketIC
server binary before integration tests run, and building the canister WASM before the test binary loads it.

### GitHub Actions example

```yaml title=".github/workflows/ci.yml"
name: CI

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Rust toolchain
        run: rustup show active-toolchain || rustup toolchain install

      - name: Cache cargo registry and build artifacts
        uses: actions/cache@v4
        with:
          path: |
            ~/.cargo/registry/index/
            ~/.cargo/registry/cache/
            ~/.cargo/git/db/
            target/
          key: ${{ runner.os }}-cargo-${{ hashFiles('Cargo.lock') }}
          restore-keys: ${{ runner.os }}-cargo-

      - name: Build canister WASM
        run: cargo build --target wasm32-unknown-unknown --release

      - name: Run unit tests (fast, no WASM needed)
        run: cargo test --lib

      - name: Run integration tests
        run: cargo test --test integration_tests
```

Key points:
- **Cache the `target/` directory**: Rust compilation is the dominant cost. Caching on `Cargo.lock` gives a
  deterministic cache key.
- **Build the WASM before running integration tests**: the test binary reads the WASM from `target/` at runtime.
  Unit tests (`--lib`) do not need the WASM, so you can run them in parallel with the WASM build if your CI
  system supports it.
- **PocketIC server binary**: the `pocket-ic` Rust crate downloads the server binary automatically on first use.
  To cache it across runs, set `POCKET_IC_BIN` to a path in your cache and check whether the binary already exists
  before running tests. Alternatively, pin the download script from your CDK version (see
  [`scripts/download_pocket_ic_server.sh`](https://github.com/dfinity/cdk-rs/blob/main/scripts/download_pocket_ic_server.sh)
  in `dfinity/cdk-rs` for a reference implementation).

### Separating slow integration tests

If integration tests with NNS setup are too slow for every PR, run them in a separate job triggered only on
merge or on a schedule:

```yaml
  integration-tests:
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'   # only on main branch
    steps:
      - uses: actions/checkout@v4
      - name: Build canister WASM
        run: cargo build --target wasm32-unknown-unknown --release
      - name: Run all tests
        run: cargo test
```

This keeps fast unit tests in every PR while reserving the heavier NNS integration tests for post-merge runs.

## Next steps

- [Testing strategies](../../guides/testing/strategies.md): Motoko testing, benchmarking with `canbench`, and containerized network tests
- [PocketIC](../../guides/testing/pocket-ic.md): Multi-subnet topologies, time travel, and JavaScript testing with Pic JS
- [Stable Structures](stable-structures.md): Understand what data survives upgrades
- [`ic-cdk` API reference](https://docs.rs/ic-cdk/latest/ic_cdk/): Complete CDK API documentation
- [unit_testable_rust_canister example](https://github.com/dfinity/examples/tree/master/rust/unit_testable_rust_canister): Complete working example with mocked governance and stable memory

<!-- Upstream: informed by dfinity/examples rust/unit_testable_rust_canister; dfinity/cdk-rs e2e-tests -->
