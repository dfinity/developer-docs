---
title: "PocketIC"
description: "Test canisters locally using the PocketIC testing framework."
sidebar:
  order: 1
doc_type: how-to
level: intermediate
features: []
icskills: []
last_verified: 2026-03-10
---

PocketIC is a lightweight, deterministic testing framework for canister integration tests. It strips away consensus and networking layers to give you fast, reproducible tests that simulate ICP behavior locally.

## Key features

- **Deterministic execution** -- fully reproducible tests without consensus non-determinism
- **Synchronous control** -- advance time, set stable memory, and control the environment programmatically
- **Multi-subnet simulation** -- test cross-subnet (XNet) calls locally
- **Parallel test execution** -- each test gets an independent IC instance
- **Client libraries** for Rust, Python, and JavaScript/TypeScript

## PocketIC as local dev environment

Starting with `icp network start`, PocketIC runs as the default local execution environment. Canisters deployed locally can be interacted with via CLI commands or the Candid UI.

## Setting up PocketIC for automated tests

### Rust

Add PocketIC as a dev dependency:

```bash
cargo add pocket-ic --dev
```

Write a basic test:

```rust
use candid::{Principal, encode_one};
use pocket_ic::PocketIc;

const INIT_CYCLES: u128 = 2_000_000_000_000;

#[test]
fn test_my_canister() {
    let pic = PocketIc::new();

    // Create and install a canister
    let canister_id = pic.create_canister();
    pic.add_cycles(canister_id, INIT_CYCLES);

    let wasm_bytes = std::fs::read("target/wasm32-unknown-unknown/release/my_canister.wasm")
        .expect("wasm file not found");
    pic.install_canister(canister_id, wasm_bytes, vec![], None);

    // Make a query call
    let response = pic.query_call(
        canister_id,
        Principal::anonymous(),
        "get",
        encode_one(()).unwrap(),
    )
    .expect("query failed");

    // Make an update call
    let response = pic.update_call(
        canister_id,
        Principal::anonymous(),
        "increment",
        encode_one(()).unwrap(),
    )
    .expect("update failed");
}
```

### Python

Install the PocketIC package:

```bash
pip3 install pocket-ic
```

Write a basic test:

```python
from pocket_ic import PocketIC

def test_my_canister():
    pic = PocketIC()

    canister_id = pic.create_canister()
    pic.add_cycles(canister_id, 2_000_000_000_000)

    with open("my_canister.wasm", "rb") as f:
        wasm = f.read()
    pic.install_code(canister_id, wasm, [])

    response = pic.update_call(canister_id, method="increment")
    assert response is not None
```

## Controlling the test environment

### Advance time

```rust
// Advance time by 1 hour
pic.advance_time(std::time::Duration::from_secs(3600));
// Execute pending timers and heartbeats
pic.tick();
```

### Set sender identity

```rust
// Calls as a specific principal
let alice = Principal::from_text("aaaaa-aa").unwrap();
pic.update_call(canister_id, alice, "my_method", encode_one(()).unwrap());
```

## Multi-subnet testing

Simulate multiple subnets, including named subnets with specific canister ID ranges:

```rust
use pocket_ic::PocketIcBuilder;

let pic = PocketIcBuilder::new()
    .with_nns_subnet()
    .with_application_subnet()
    .with_application_subnet()
    .build();

// Create a canister on the NNS subnet
let nns_subnet = pic.topology().get_nns_subnet().unwrap();
let nns_canister = pic.create_canister_on_subnet(None, None, nns_subnet);

// Create a canister on an application subnet
let app_subnets = pic.topology().get_app_subnets();
let app_canister = pic.create_canister_on_subnet(None, None, app_subnets[0]);
```

Available subnet types: NNS, SNS, Internet Identity, Bitcoin, Fiduciary, and generic application/system subnets.

## Running tests

### Rust

```bash
# Build your canister first
icp build my_canister

# Run tests
cargo test
```

### Python

```bash
# Set the PocketIC binary path
export POCKET_IC_BIN=/path/to/pocket-ic

python -m pytest tests/
```

The PocketIC client library automatically starts the PocketIC server using the binary at `POCKET_IC_BIN`.

## Resources

- [PocketIC GitHub](https://github.com/dfinity/pocketic)
- [PocketIC Rust crate](https://crates.io/crates/pocket-ic)
- [PocketIC Python package](https://pypi.org/project/pocket-ic/)
- [Rust hello world with PocketIC tests](https://github.com/dfinity/icp-hello-world-rust)
- [Motoko hello world with PocketIC tests](https://github.com/dfinity/icp-hello-world-motoko)
