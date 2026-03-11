---
title: "Safe Upgrade Patterns"
description: "Patterns for safely upgrading canisters without data loss"
sidebar:
  order: 5
doc_type: how-to
level: intermediate
last_verified: 2026-03-10
---

Canister upgrades replace the Wasm module while preserving stable memory. Done incorrectly, upgrades can cause data loss or permanently brick a canister. This page covers the risks and safe patterns for both Rust and Motoko.

## The upgrade lifecycle

When you run `icp canister install --mode upgrade`, the following happens:

1. **`pre_upgrade`** runs on the old Wasm module. Typically serializes heap data to stable memory.
2. The old Wasm module is discarded. Heap memory is cleared.
3. The new Wasm module is loaded.
4. **`post_upgrade`** runs on the new Wasm module. Typically deserializes data from stable memory.

Stable memory persists across upgrades. Heap memory does not.

## The critical risk: trapping in pre_upgrade

If `pre_upgrade` traps (panics, exceeds instruction limit, or runs out of memory), **the upgrade fails and cannot be retried with new code** because `pre_upgrade` always runs the old code. This can permanently brick the canister.

### Recommendation: avoid pre_upgrade entirely

The safest approach is to never use `pre_upgrade` for serialization. Instead, use stable data structures that write directly to stable memory during normal operation.

**Rust -- stable structures:**

```rust
use ic_stable_structures::{StableBTreeMap, DefaultMemoryImpl};

thread_local! {
    static MAP: RefCell<StableBTreeMap<u64, Vec<u8>, DefaultMemoryImpl>> =
        RefCell::new(StableBTreeMap::init(DefaultMemoryImpl::default()));
}
```

With stable structures, data is already in stable memory. No serialization step is needed during upgrade.

**Motoko -- stable variables:**

```motoko
actor {
    stable var counter : Nat = 0;
    stable var users : [(Principal, Text)] = [];
};
```

Motoko's `stable` keyword handles serialization automatically. Motoko's enhanced orthogonal persistence further reduces upgrade risks by persisting heap state transparently.

## Safe post_upgrade patterns

Unlike `pre_upgrade`, if `post_upgrade` traps, you can retry with fixed code. Therefore:

- **Do trap** in `post_upgrade` if you detect invalid state. This aborts the upgrade cleanly and lets you retry.
- **Do not silently ignore** deserialization errors. An upgrade that succeeds with corrupted data is worse than one that fails cleanly.

```rust
#[post_upgrade]
fn post_upgrade() {
    // Deserialize and validate state
    let state = stable_restore::<(MyState,)>()
        .expect("Failed to restore state -- aborting upgrade");

    // Reinitialize timers (they are lost on upgrade)
    ic_cdk_timers::set_timer_interval(
        Duration::from_secs(60),
        || ic_cdk::spawn(periodic_task()),
    );
}
```

## Reinstantiate timers during upgrades

Global timers are deactivated when a canister's Wasm module changes. If your canister relies on timers for periodic tasks (rate updates, cleanup, heartbeat logic), you must set them up again in `post_upgrade`.

**Rust:**

```rust
#[post_upgrade]
fn post_upgrade() {
    // Restore state...

    // Re-register timers
    ic_cdk_timers::set_timer_interval(
        Duration::from_secs(3600),
        || ic_cdk::spawn(hourly_cleanup()),
    );
}
```

**Motoko:**

```motoko
system func postupgrade() {
    ignore Timer.recurringTimer<system>(#seconds 3600, hourlyCleanup);
};
```

Failing to reinstate timers can silently break functionality. For example, a DEX that relies on timers to update exchange rates would serve stale prices after an upgrade.

## Migration patterns

### Adding fields

Add new fields with default values. Existing stable memory data can be deserialized into the new structure with the new field set to its default.

```rust
#[derive(Serialize, Deserialize)]
struct UserV2 {
    name: String,
    email: String,
    #[serde(default)]
    avatar_url: Option<String>,  // new field, defaults to None
}
```

### Removing fields

Use `#[serde(deny_unknown_fields)]` cautiously. When removing a field, you may need a migration step that reads the old format and writes the new format.

### Renaming fields

Rename with Serde aliases to maintain backward compatibility:

```rust
#[derive(Serialize, Deserialize)]
struct Config {
    #[serde(alias = "old_name")]
    new_name: String,
}
```

### Versioned state

For complex migrations, version your state:

```rust
enum PersistedState {
    V1(StateV1),
    V2(StateV2),
}

fn migrate(state: PersistedState) -> StateV2 {
    match state {
        PersistedState::V1(v1) => StateV2::from(v1),
        PersistedState::V2(v2) => v2,
    }
}
```

## Testing upgrades locally

Always test upgrades before deploying to mainnet:

```bash
# Deploy the current version
icp deploy my_canister

# Add some state
icp canister call my_canister add_data '("test")'

# Build and deploy the new version as upgrade
icp deploy my_canister --mode upgrade

# Verify state survived
icp canister call my_canister get_data '()'
```

For automated testing, the `pocket-ic` library lets you simulate upgrades in Rust integration tests:

```rust
#[test]
fn test_upgrade_preserves_state() {
    let pic = PocketIc::new();
    let canister = pic.create_and_install_canister(WASM_V1);

    // Add state...

    pic.upgrade_canister(canister, WASM_V2);

    // Verify state survived...
}
```

## Rollback strategies

If an upgrade causes issues:

1. **Re-upgrade** with the previous Wasm module. This works if the new `post_upgrade` did not corrupt stable memory.
2. **Deploy a fixed version** that handles the corrupted state gracefully.
3. **Reinstall** as a last resort. This wipes all canister state (both heap and stable memory).

To protect against needing a full reinstall, consider:

- Maintaining snapshots of critical state in a separate canister
- Using the canister snapshot feature (if available) before upgrades
- Implementing an export/import mechanism for critical data

## Summary of safe practices

| Practice | Reason |
|----------|--------|
| Avoid logic in `pre_upgrade` | Traps here permanently brick the canister |
| Use stable structures (Rust) or stable vars (Motoko) | Data persists without serialization during upgrades |
| Trap on invalid state in `post_upgrade` | Allows retrying with fixed code |
| Reinitialize timers in `post_upgrade` | Timers are lost on module change |
| Version your persisted state | Enables safe schema migrations |
| Test upgrades locally before mainnet | Catches serialization issues early |
| Keep `pre_upgrade` and `post_upgrade` simple | Reduces surface area for traps |
