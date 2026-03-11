---
title: "Testing Strategies"
description: "Approaches for unit, integration, and end-to-end testing of canisters."
sidebar:
  order: 2
doc_type: how-to
level: intermediate
features: []
icskills: []
last_verified: 2026-03-10
---

Testing canisters requires a layered approach. Each layer catches different classes of bugs and runs at different speeds.

## Testing pyramid

| Layer | Speed | What it tests | Tool |
|-------|-------|---------------|------|
| Unit tests | Fast | Pure logic, data structures | Language-native test framework |
| Integration tests | Medium | Canister interactions, state management | PocketIC |
| End-to-end tests | Slow | Full user flows, frontend + backend | Playwright, Cypress + local network |

## Unit tests

Test pure business logic without the canister runtime. These run fastest and should cover the majority of your logic.

### Motoko

Use the Motoko testing library or assertions directly:

```motoko
import Debug "mo:base/Debug";

// In a test file or test module
func testTransferValidation() {
  let balance = 100;
  let amount = 50;
  assert(amount <= balance); // passes
  Debug.print("Transfer validation passed");
};
```

For structured testing, use a test framework like [motoko-test](https://mops.one/test):

```bash
mops add test --dev
mops test
```

### Rust

Use standard `#[cfg(test)]` modules. Extract core logic into functions that don't depend on `ic_cdk`:

```rust
// src/lib.rs
pub fn validate_transfer(balance: u64, amount: u64) -> Result<u64, String> {
    if amount > balance {
        return Err("Insufficient funds".to_string());
    }
    Ok(balance - amount)
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_valid_transfer() {
        assert_eq!(validate_transfer(100, 50), Ok(50));
    }

    #[test]
    fn test_insufficient_funds() {
        assert!(validate_transfer(50, 100).is_err());
    }
}
```

Run with:

```bash
cargo test
```

## Integration tests with PocketIC

Integration tests deploy your canister into a simulated IC environment and exercise its public API. Use [PocketIC](/guides/testing/pocket-ic/) for deterministic, fast integration tests.

```rust
use candid::{encode_one, decode_one, Principal};
use pocket_ic::PocketIc;

#[test]
fn test_increment_and_read() {
    let pic = PocketIc::new();
    let canister_id = pic.create_canister();
    pic.add_cycles(canister_id, 2_000_000_000_000);
    pic.install_canister(canister_id, counter_wasm(), vec![], None);

    // Increment
    pic.update_call(
        canister_id,
        Principal::anonymous(),
        "increment",
        encode_one(()).unwrap(),
    ).unwrap();

    // Read and verify
    let response = pic.query_call(
        canister_id,
        Principal::anonymous(),
        "get",
        encode_one(()).unwrap(),
    ).unwrap();
    let count: u64 = decode_one(&response).unwrap();
    assert_eq!(count, 1);
}
```

### Testing upgrades

Verify that state is preserved across canister upgrades:

```rust
#[test]
fn test_upgrade_preserves_state() {
    let pic = PocketIc::new();
    let canister_id = pic.create_canister();
    pic.add_cycles(canister_id, 2_000_000_000_000);
    pic.install_canister(canister_id, v1_wasm(), vec![], None);

    // Set some state
    pic.update_call(canister_id, Principal::anonymous(), "set", encode_one("hello").unwrap()).unwrap();

    // Upgrade to v2
    pic.upgrade_canister(canister_id, v2_wasm(), vec![], None).unwrap();

    // Verify state survived
    let response = pic.query_call(canister_id, Principal::anonymous(), "get", encode_one(()).unwrap()).unwrap();
    let value: String = decode_one(&response).unwrap();
    assert_eq!(value, "hello");
}
```

### Testing multi-canister systems

```rust
#[test]
fn test_cross_canister_call() {
    let pic = PocketIc::new();

    // Deploy backend canister
    let backend = pic.create_canister();
    pic.add_cycles(backend, 2_000_000_000_000);
    pic.install_canister(backend, backend_wasm(), vec![], None);

    // Deploy frontend canister that calls backend
    let frontend = pic.create_canister();
    pic.add_cycles(frontend, 2_000_000_000_000);
    let init_arg = encode_one(backend).unwrap(); // pass backend ID as init arg
    pic.install_canister(frontend, frontend_wasm(), init_arg, None);

    // Call frontend, which internally calls backend
    let response = pic.update_call(
        frontend,
        Principal::anonymous(),
        "fetch_from_backend",
        encode_one(()).unwrap(),
    ).unwrap();
    assert!(!response.is_empty());
}
```

## End-to-end tests

E2E tests exercise the full stack: frontend UI, authentication, and backend canisters. Use a browser automation tool against a local deployment.

### Setup with Playwright

```bash
npm install -D @playwright/test
```

```ts
// tests/e2e/app.spec.ts
import { test, expect } from "@playwright/test";

test("displays greeting after form submit", async ({ page }) => {
  await page.goto("http://localhost:8000/?canisterId=<frontend-canister-id>");
  await page.fill('input[name="name"]', "World");
  await page.click('button[type="submit"]');
  await expect(page.locator("#greeting")).toContainText("Hello, World!");
});
```

Run with a local network:

```bash
icp network start -d
icp deploy
npx playwright test
```

## Testing checklist

- [ ] **Unit tests** cover all pure logic and edge cases
- [ ] **Integration tests** verify canister API behavior with PocketIC
- [ ] **Upgrade tests** confirm stable memory migration works
- [ ] **Error handling tests** verify graceful failure on bad input
- [ ] **Multi-canister tests** exercise inter-canister call flows
- [ ] **E2E tests** validate critical user journeys

## Tips

- **Keep unit tests fast.** Avoid `ic_cdk` dependencies in testable logic. Structure your code so core functions are pure and testable without the canister runtime.
- **Test upgrades early.** Broken upgrades can make a canister unrecoverable. Test every schema change.
- **Use PocketIC for CI.** It runs without Docker or VMs and is fast enough for continuous integration pipelines.
- **Mock external canisters.** In integration tests, deploy mock canisters that return predictable responses for dependencies you don't control.

## Next steps

- [PocketIC](/guides/testing/pocket-ic/) -- detailed PocketIC setup and examples
- [Canister lifecycle](/guides/canisters/lifecycle/) -- understand upgrade mechanics
- [icp-cli CLI reference](https://dfinity.github.io/icp-cli/reference/cli/) -- deploy, build, and canister call commands
