---
title: "PocketIC"
description: "Run integration tests against a lightweight IC replica with PocketIC"
sidebar:
  order: 2
---

PocketIC is a lightweight, deterministic testing library for [canister](../../concepts/canisters.md) integration tests. Unlike the full local network started by `icp network start`, PocketIC runs entirely inside your test process. No daemon, no ports, no Docker required. Tests execute synchronously, making them fast and fully reproducible.

The `icp-cli` local development network also uses PocketIC under the hood, so behavior you observe in tests closely matches what you see during development.

**When to use PocketIC:** Use it for integration tests that need to deploy one or more canisters and make calls between them. For unit tests that test individual functions without deploying, use Rust's built-in test framework directly. See [Testing strategies](strategies.md) for guidance on when each approach fits.

## How PocketIC works

A PocketIC instance is an in-process IC replica. It supports:

- Creating and installing canisters (from compiled `.wasm` files)
- Making update and query calls
- Multiple subnets (NNS, application, system)
- Time control: advance the clock without waiting
- Deterministic execution. The same test always produces the same result
- Parallel execution: each test gets its own `PocketIc` instance

PocketIC strips the consensus and networking layers from the IC replica, keeping only the execution environment. This makes it orders of magnitude faster than running a full local network.

## Client libraries

PocketIC has client libraries for several languages:

| Language | Package | Use case |
|----------|---------|----------|
| Rust | [`pocket-ic`](https://crates.io/crates/pocket-ic) | Rust canister tests |
| JavaScript/TypeScript | [`@dfinity/pic`](https://www.npmjs.com/package/@dfinity/pic) | Frontend and JS canister tests |
| Python | [`pocket-ic`](https://pypi.org/project/pocket-ic/) | Python-based tests |

This guide covers Rust (the most common choice for backend canister tests) and JavaScript with Pic JS.

## Rust: getting started

### Add the dependency

Add `pocket-ic` to your `Cargo.toml` as a dev dependency:

```toml
[dev-dependencies]
pocket-ic = "9"
candid = "*"
```

### Write a basic test

A typical PocketIC Rust test follows this pattern: create an instance, deploy a canister, make calls, assert results.

```rust title=tests/integration_tests.rs
use candid::{decode_one, encode_one, Principal};
use pocket_ic::PocketIc;

// Path to the compiled canister WASM
pub const CANISTER_WASM: &[u8] =
    include_bytes!("../target/wasm32-unknown-unknown/release/my_canister.wasm");

#[test]
fn test_counter() {
    // Create a new PocketIC instance with one application subnet
    let pic = PocketIc::new();

    // Create a canister and fund it with 2T cycles
    let canister_id = pic.create_canister();
    pic.add_cycles(canister_id, 2_000_000_000_000);

    // Install the canister WASM
    pic.install_canister(canister_id, CANISTER_WASM.to_vec(), vec![], None);

    // Make a query call
    let result = pic
        .query_call(
            canister_id,
            Principal::anonymous(),
            "get_count",
            encode_one(()).unwrap(),
        )
        .expect("query failed");

    let count: u64 = decode_one(&result).unwrap();
    assert_eq!(count, 0);

    // Make an update call
    pic.update_call(
        canister_id,
        Principal::anonymous(),
        "increment",
        encode_one(()).unwrap(),
    )
    .expect("update failed");

    // Verify the counter incremented
    let result = pic
        .query_call(
            canister_id,
            Principal::anonymous(),
            "get_count",
            encode_one(()).unwrap(),
        )
        .expect("query failed");

    let count: u64 = decode_one(&result).unwrap();
    assert_eq!(count, 1);
}
```

### Run the tests

Build the canister WASM first, then run the tests:

```bash
cargo build --target wasm32-unknown-unknown --release
cargo test
```

PocketIC automatically downloads the PocketIC server binary on first use and caches it in `~/.cache/pocket-ic/`. The `POCKET_IC_BIN` environment variable overrides the download path if you need a specific version.

### Use a helper struct for cleaner tests

For multiple tests against the same canister, extract setup into a helper struct:

```rust title=tests/integration_tests.rs
use candid::{decode_one, encode_one, Encode, Principal};
use pocket_ic::PocketIc;

pub const CANISTER_WASM: &[u8] =
    include_bytes!("../target/wasm32-unknown-unknown/release/my_canister.wasm");

pub struct CanisterFixture {
    pub env: PocketIc,
    pub canister_id: Principal,
}

impl CanisterFixture {
    pub fn new() -> Self {
        let env = PocketIc::new();
        let canister_id = env.create_canister();
        env.add_cycles(canister_id, 2_000_000_000_000);
        env.install_canister(canister_id, CANISTER_WASM.to_vec(), vec![], None);
        Self { env, canister_id }
    }

    pub fn query<T: candid::CandidType + for<'de> serde::Deserialize<'de>>(
        &self,
        method: &str,
        args: Vec<u8>,
    ) -> T {
        let bytes = self
            .env
            .query_call(self.canister_id, Principal::anonymous(), method, args)
            .expect("query failed");
        decode_one(&bytes).unwrap()
    }

    pub fn update<T: candid::CandidType + for<'de> serde::Deserialize<'de>>(
        &self,
        method: &str,
        args: Vec<u8>,
    ) -> T {
        let bytes = self
            .env
            .update_call(self.canister_id, Principal::anonymous(), method, args)
            .expect("update failed");
        decode_one(&bytes).unwrap()
    }
}

#[test]
fn test_with_fixture() {
    let canister = CanisterFixture::new();
    let count: u64 = canister.query("get_count", Encode!().unwrap());
    assert_eq!(count, 0);
}
```

### Canister lifecycle in tests

PocketIC exposes the full canister lifecycle:

```rust title=tests/lifecycle.rs
use pocket_ic::PocketIc;

// WASM_V1 and WASM_V2 are defined like CANISTER_WASM above, pointing to
// different compiled versions of the same canister
// e.g.: pub const WASM_V1: &[u8] = include_bytes!("../target/.../my_canister_v1.wasm");

#[test]
fn test_upgrade() {
    let pic = PocketIc::new();
    let canister_id = pic.create_canister();
    pic.add_cycles(canister_id, 2_000_000_000_000);

    // Install initial version
    pic.install_canister(canister_id, WASM_V1.to_vec(), vec![], None);

    // Upgrade to new version
    pic.upgrade_canister(canister_id, WASM_V2.to_vec(), vec![], None)
        .expect("upgrade failed");

    // Stop and start
    pic.stop_canister(canister_id, None).unwrap();
    pic.start_canister(canister_id, None).unwrap();
}
```

### Advance time

Canisters that depend on the current time (for example, timers or time-locked state) can be tested by controlling the clock:

```rust title=tests/timer.rs
use pocket_ic::PocketIc;
use std::time::Duration;

#[test]
fn test_timer_fires() {
    let pic = PocketIc::new();
    let canister_id = pic.create_canister();
    pic.add_cycles(canister_id, 2_000_000_000_000);
    pic.install_canister(canister_id, CANISTER_WASM.to_vec(), vec![], None);

    // Advance the clock by 10 seconds and process any pending timers
    pic.advance_time(Duration::from_secs(10));
    pic.tick(); // process one round of messages

    // Verify timer-triggered state change
    // ...
}
```

`pic.tick()` processes one round of messages without advancing time. Call it after `advance_time` to execute any timers that have fired.

### Multi-subnet testing

Test canister interactions that span subnets: for example, cross-subnet calls or NNS integration:

```rust title=tests/multi_subnet.rs
use pocket_ic::{PocketIc, PocketIcBuilder};
use candid::Principal;

#[test]
fn test_cross_subnet_call() {
    // Build an instance with an NNS subnet and two application subnets
    let pic = PocketIcBuilder::new()
        .with_nns_subnet()
        .with_application_subnet()
        .with_application_subnet()
        .build();

    // Get subnet IDs from the topology
    let app_subnets = pic.topology().get_app_subnets();
    let subnet_a = app_subnets[0];
    let subnet_b = app_subnets[1];

    // Create canisters on specific subnets
    let canister_a = pic.create_canister_on_subnet(None, None, subnet_a);
    pic.add_cycles(canister_a, 2_000_000_000_000);

    let canister_b = pic.create_canister_on_subnet(None, None, subnet_b);
    pic.add_cycles(canister_b, 2_000_000_000_000);

    // Install and test cross-subnet interactions
    // ...
}
```

Named subnets (NNS, SNS, II) carry the same canister ID ranges as mainnet, which matters when testing code that references specific canister IDs.

## JavaScript/TypeScript: Pic JS

Pic JS (`@dfinity/pic`) is the JavaScript/TypeScript client for PocketIC, designed for testing frontend code, agent-based workflows, or JavaScript canister backends. It exposes the same PocketIC capabilities with a Promise-based API.

### Install

```bash
npm install --save-dev @dfinity/pic
```

Pic JS manages the PocketIC server process for you via `PocketIcServer`. <!-- Needs human verification: POCKET_IC_SERVER_PATH env var name for @dfinity/pic: not in StartServerOptions API docs; may be read directly by the server binary outside the options object -->

### Write a basic test

This example uses [Jest](https://jestjs.io/), but Pic JS works with Vitest, Bun, and any other Node-compatible test runner.

```typescript title=src/__tests__/counter.test.ts
import { PocketIc, PocketIcServer } from '@dfinity/pic';
import { resolve } from 'node:path';
// idlFactory is generated from the canister's Candid interface (e.g. via icp-cli or candid-extractor)
// _SERVICE is the TypeScript type for the canister's public API
import { idlFactory, type _SERVICE } from '../declarations/counter';

const WASM_PATH = resolve(__dirname, '../../target/wasm32-unknown-unknown/release/counter.wasm');

describe('Counter canister', () => {
  let picServer: PocketIcServer;
  let pic: PocketIc;

  beforeAll(async () => {
    picServer = await PocketIcServer.start();
  });

  afterAll(async () => {
    await picServer.stop();
  });

  beforeEach(async () => {
    pic = await PocketIc.create(picServer.getUrl());
  });

  afterEach(async () => {
    await pic.tearDown();
  });

  it('should increment and read the counter', async () => {
    const fixture = await pic.setupCanister<_SERVICE>({
      idlFactory,
      wasm: WASM_PATH,
    });

    const { actor } = fixture;

    await actor.increment();
    const count = await actor.get_count();
    expect(count).toBe(1n);
  });
});
```

Pic JS generates typed actors from Candid declarations automatically when you use `setupCanister`. The `idlFactory` is generated from your canister's `.did` file by `icp-cli`: it lives in the `declarations/` directory alongside the TypeScript types. See the [Pic JS documentation](https://js.icp.build/pic-js) for the full API, including typed actor generation and subnet configuration.

### Advance time in JavaScript tests

This example uses inline setup for brevity. For test suites with multiple tests, the `beforeAll`/`afterAll` pattern from the basic example above is preferred: it avoids restarting the server for each test.

```typescript title=src/__tests__/timer.test.ts
import { PocketIc, PocketIcServer } from '@dfinity/pic';

it('should trigger timer after delay', async () => {
  const picServer = await PocketIcServer.start();
  const pic = await PocketIc.create(picServer.getUrl());
  // ... deploy canister ...

  // Advance time by 10 seconds and tick
  await pic.advanceTime(10_000); // milliseconds
  await pic.tick();

  // Assert timer-triggered state change
  // ...

  await pic.tearDown();
  await picServer.stop();
});
```

## Running PocketIC tests in CI

PocketIC downloads its server binary on first use and caches it. In CI environments, cache this directory to avoid repeated downloads:

```yaml title=.github/workflows/test.yml
- name: Cache PocketIC binary
  uses: actions/cache@v4
  with:
    path: ~/.cache/pocket-ic
    key: pocket-ic-${{ runner.os }}

- name: Run integration tests
  run: |
    cargo build --target wasm32-unknown-unknown --release
    cargo test
```

PocketIC runs on macOS and Linux. Windows is not currently supported for standalone PocketIC use, but the containerized network (`icp network start`) supports Windows.

## Connecting to a running network for testing

For end-to-end tests that need a full network with all system canisters, use a containerized network instead of PocketIC. See the [icp-cli containerized networks documentation](https://cli.internetcomputer.org/0.2/guides/containerized-networks) for how to configure Docker-based test networks in `icp.yaml`.

The containerized network is appropriate when:

- You need Internet Identity or NNS canisters pre-installed
- You are testing frontend interactions via HTTP
- You need to test with real cycle mechanics

PocketIC is appropriate when:

- You are testing canister logic in isolation
- You want fast, parallelizable tests without Docker
- You need deterministic time control or multi-subnet simulation

## Next steps

- [Testing strategies](strategies.md): overview of unit, integration, and end-to-end testing
- [Governance testing](../governance/testing.md): SNS testflight with PocketIC
- [Rust testing patterns](../../languages/rust/testing.md): Rust-specific patterns including unit testing with mocks

<!-- Upstream: informed by dfinity/portal docs/building-apps/test/pocket-ic.mdx; dfinity/examples rust/unit_testable_rust_canister rust/guards; dfinity/icp-cli docs/guides/containerized-networks.md; dfinity/icp-js-sdk-docs public/pic-js/latest.zip -->
