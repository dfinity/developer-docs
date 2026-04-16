---
title: "Secure Upgrades"
description: "Upgrade canisters safely: pre/post hooks, stable memory, Candid compatibility, snapshot rollbacks, schema evolution, and testing"
sidebar:
  order: 2
---

Canister upgrades are one of the highest-risk operations in production. A bad upgrade can corrupt state, make the canister permanently non-upgradeable, or break clients. This guide covers the patterns and checks you need to upgrade safely.

## Checklist

Use this before every production upgrade:

- [ ] Take a snapshot immediately before upgrading
- [ ] Run the upgrade locally first with `icp deploy`
- [ ] Verify data survives: write → upgrade → read
- [ ] Check Candid interface compatibility — no removed methods, no breaking type changes
- [ ] Avoid `pre_upgrade` hooks that serialize large state (use stable structures instead)
- [ ] In Motoko, use `persistent actor` (which eliminates the need for pre_upgrade hooks) — avoid manual `pre_upgrade`/`post_upgrade`
- [ ] Confirm you have a backup controller (cannot recover from a trapped `post_upgrade` without one)
- [ ] Add a rollback plan: snapshot ID recorded, restore procedure tested

## How upgrades work

When you run `icp deploy` on an existing canister, the IC executes the following sequence:

1. **Stop** the canister (waits for in-flight messages to complete)
2. Run `pre_upgrade` on the old code (if defined)
3. Replace the Wasm module with the new code
4. Run `post_upgrade` on the new code (if defined)
5. **Restart** the canister

Stable memory is preserved through steps 2–4. Heap memory is cleared when the new Wasm loads. If `pre_upgrade` or `post_upgrade` traps, the upgrade fails with different consequences:

| Hook | Trap result |
|------|-------------|
| `pre_upgrade` | Upgrade cancelled. Old code still running. State intact but may need attention. |
| `post_upgrade` | New Wasm installed but initialization failed. Canister may be in an inconsistent state. |

Both scenarios leave the canister in a difficult state. Prevention is far better than recovery.

## Stable memory patterns

### Motoko: use `persistent actor`

The `persistent actor` declaration automatically stores all `let` and `var` fields in stable memory. No serialization, no upgrade hooks, no instruction-limit traps.

```motoko
persistent actor Counter {
  var count : Nat = 0;

  public func increment() : async Nat {
    count += 1;
    count;
  };

  public query func get() : async Nat { count };

  // transient: resets to [] on each upgrade — correct for caches, transient logs, and reset-on-upgrade counters
  transient var recentCallers : [Principal] = [];
};
```

**Key rules:**

- All `let`/`var` fields persist automatically — no `stable` keyword needed
- `transient var` for caches or counters that should reset on upgrade
- Do not write manual `pre_upgrade`/`post_upgrade` hooks — the runtime handles everything
- If a persistent field's type changes incompatibly, the upgrade traps. See [Schema evolution](#schema-evolution).

### Rust: use stable structures

In Rust, use [`ic-stable-structures`](https://docs.rs/ic-stable-structures/latest/ic_stable_structures/) to store data directly in stable memory. Data lives there from the start — no serialization step on upgrade.

```rust
use ic_stable_structures::{
    memory_manager::{MemoryId, MemoryManager, VirtualMemory},
    DefaultMemoryImpl, StableBTreeMap, StableCell,
};
use std::cell::RefCell;

type Memory = VirtualMemory<DefaultMemoryImpl>;

// Each structure must have its own unique MemoryId — never reuse IDs
const USERS_MEM_ID: MemoryId = MemoryId::new(0);
const COUNTER_MEM_ID: MemoryId = MemoryId::new(1);

thread_local! {
    static MEMORY_MANAGER: RefCell<MemoryManager<DefaultMemoryImpl>> =
        RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));

    static USERS: RefCell<StableBTreeMap<u64, Vec<u8>, Memory>> =
        RefCell::new(StableBTreeMap::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(USERS_MEM_ID))
        ));

    static COUNTER: RefCell<StableCell<u64, Memory>> =
        RefCell::new(StableCell::init(
            MEMORY_MANAGER.with(|m| m.borrow().get(COUNTER_MEM_ID)),
            0u64,
        ).expect("Failed to init counter"));
}

#[ic_cdk::post_upgrade]
fn post_upgrade() {
    // Stable structures auto-restore — no deserialization needed.
    // Re-initialize timers or transient state here if required.
}
```

> **Warning:** Each `MemoryId` must map to exactly one data structure for the lifetime of the canister. Reusing a `MemoryId` for a different structure after an upgrade corrupts both. Keep a written record of your `MemoryId` allocations and never reorder them.

### Avoid `pre_upgrade` serialization

The serialization-based upgrade pattern is common in older Rust code but is fundamentally fragile:

```rust
// DO NOT DO THIS in production
#[ic_cdk::pre_upgrade]
fn pre_upgrade() {
    // If STATE is large, this hits the instruction limit and traps.
    // A trapped pre_upgrade prevents the upgrade — canister stays on old code.
    ic_cdk::storage::stable_save((STATE.with(|s| s.borrow().clone()),)).unwrap();
}
```

When `pre_upgrade` traps due to instruction exhaustion, the canister cannot be upgraded. The `skip_pre_upgrade` flag (an emergency escape hatch via the management canister's `install_code` API — see [Management canister reference](../../reference/management-canister.md)) bypasses the hook — but anything the hook would have saved is lost. Use stable structures so the upgrade path cannot brick itself under load.

## Candid interface compatibility

The IC checks your new Wasm module's Candid interface against the old one before completing the upgrade. If the new interface is not backward-compatible, the upgrade is rejected.

**Safe changes:**

| Change | Why it is safe |
|--------|---------------|
| Add a new method | Existing clients don't call it |
| Add optional parameters to an existing method | Old clients send no value; IC substitutes `null` |
| Remove trailing parameters from an existing method | Old clients send extra values; IC ignores them |
| Return additional values from a method | Old clients ignore extra return values |
| Change a parameter type to a supertype | Old values remain valid inputs |
| Change a return type to a subtype | New values remain valid for old clients |

**Breaking changes (upgrade rejected or clients break):**

| Change | Why it breaks |
|--------|--------------|
| Remove a method | Clients calling it get errors |
| Add a required (non-optional) parameter | Old clients don't send it |
| Change a parameter type to an incompatible type | Old clients send invalid values |

**Example — safe evolution:**

```candid
// Before
service counter : {
  add : (nat) -> ();
  get : () -> (int) query;
}

// After — safe: optional param added, new return value, new method
service counter : {
  add : (nat, label : opt text) -> (new_val : nat);
  get : () -> (nat, last_change : nat) query;
  reset : () -> ();
}
```

icp-cli checks Candid compatibility during deploy and prompts for confirmation if it detects a potentially breaking change. Use `--yes` in automated pipelines after manually verifying compatibility:

```bash
icp deploy my-canister -e ic --yes
```

## Snapshot-based rollback

Always take a snapshot immediately before a risky upgrade. If the upgrade causes unexpected behavior, you can restore the previous state within minutes.

```bash
# 1. Stop the canister and create a snapshot
icp canister stop my-canister -e ic
icp canister snapshot create my-canister -e ic
# Note the snapshot ID printed in the output
icp canister start my-canister -e ic

# 2. Deploy the upgrade
icp deploy my-canister -e ic

# 3. Verify correctness
icp canister call my-canister health_check -e ic

# 4a. If everything works, clean up when no longer needed
icp canister snapshot delete my-canister <snapshot-id> -e ic

# 4b. If something is wrong, stop and restore
icp canister stop my-canister -e ic
icp canister snapshot restore my-canister <snapshot-id> -e ic
icp canister start my-canister -e ic
```

Snapshots capture the full canister state: Wasm module, Wasm heap memory, stable memory, and chunk store. Restoring from a snapshot brings back all of this state atomically.

See [Canister snapshots](../canister-management/snapshots.md) for listing, downloading, and the state transfer workflow.

## Schema evolution

Upgrading canister code sometimes requires changing the shape of stored data. The rules differ by language.

### Motoko

When upgrading a `persistent actor`, the runtime checks that every persistent field's current type is compatible with the value stored in stable memory. Incompatible changes cause the upgrade to trap.

**Safe changes:**

- Add new `let` or `var` fields with initial values — the runtime initializes them on upgrade
- Add optional record fields (e.g., change `{ name : Text }` to `{ name : Text; email : ?Text }`)
- Widen a field's type (e.g., `Nat` → `Int`)

**Unsafe changes (upgrade traps):**

- Remove or rename a persistent field
- Narrow a field's type (e.g., `Int` → `Nat`)
- Change a non-optional field to an incompatible type

If you need to make an unsafe change, migrate the data in two upgrades: add the new field alongside the old one, upgrade once (both fields present), then upgrade again to remove the old field. Test this two-step process locally before deploying to mainnet.

### Rust

Rust stable structures use serialized bytes on disk. Schema evolution safety depends on the serialization format and versioning strategy.

**Adding fields safely with Candid encoding:**

```rust
use candid::{CandidType, Decode, Deserialize, Encode};
use ic_stable_structures::storable::{Bound, Storable};
use std::borrow::Cow;

#[derive(CandidType, Deserialize, Clone)]
struct UserV2 {
    id: u64,
    name: String,
    created: u64,
    // New optional field — safe to add: old records deserialize with None
    email: Option<String>,
}

impl Storable for UserV2 {
    // Unbounded avoids write failures when struct grows.
    // Bounded requires a fixed max_size; if encoded size exceeds it after
    // adding fields, writes trap.
    const BOUND: Bound = Bound::Unbounded;

    fn to_bytes(&self) -> Cow<'_, [u8]> {
        Cow::Owned(Encode!(self).expect("failed to encode UserV2"))
    }

    fn from_bytes(bytes: Cow<'_, [u8]>) -> Self {
        Decode!(&bytes, Self).expect("failed to decode UserV2")
    }
}
```

**Rules:**

- Use `Option<T>` for new fields — Candid deserializes absent fields as `None`, so old records remain readable after the upgrade
- Use `Bound::Unbounded` unless you have a strict size requirement
- Never reorder `MemoryId` allocations across upgrades — same effect as changing a field type
- For breaking schema changes, use a versioned enum and migrate records lazily on read

## Testing upgrades locally

Never upgrade on mainnet without first verifying locally that data written before the upgrade is still readable after.

**Motoko:**

```bash
# Start local network
icp network start -d

# Deploy initial version
icp deploy backend

# Write data
icp canister call backend increment '()'
icp canister call backend increment '()'
icp canister call backend get '()'
# Returns: (2 : nat)

# Modify source code, then redeploy
icp deploy backend

# Verify data survived
icp canister call backend get '()'
# Must still return: (2 : nat)
```

**Rust:**

```bash
# Start local network
icp network start -d

# Deploy initial version
icp deploy backend

# Write data
icp canister call backend add_user '("Alice")'
icp canister call backend get_user_count '()'
# Returns: (1 : nat64)

# Modify source code, then upgrade
icp deploy backend

# Verify data survived
icp canister call backend get_user_count '()'
# Must still return: (1 : nat64)
```

If the count drops to zero after upgrade, your data is not in stable memory — review your storage declarations before touching mainnet.

For advanced scenarios (upgrade rollbacks, schema migrations, concurrent call safety), use [PocketIC](../testing/pocket-ic.md) to script multi-step upgrade scenarios in a controlled environment.

## Controller safety

You cannot upgrade a canister without a valid controller. Losing all controller keys leaves the canister permanently frozen at its current code — there is no recovery path on the IC.

```bash
# Check current controllers
icp canister settings show my-canister -e ic

# Add a backup controller before any risky upgrade
icp canister settings update my-canister --add-controller <backup-principal> -e ic
```

For production canisters:

- Maintain at least two controllers (primary identity + hardware wallet or multisig)
- For fully onchain governance, add an SNS or DAO canister as controller and remove personal principals

See [Access management](access-management.md) for detailed controller management patterns.

## Next steps

- [Data persistence](../backends/data-persistence.md) — stable structures and upgrade patterns in depth
- [Canister lifecycle](../canister-management/lifecycle.md) — the full upgrade sequence and install modes
- [Canister snapshots](../canister-management/snapshots.md) — create and restore snapshots
- [Testing strategies](../testing/strategies.md) — test upgrade scenarios before deploying to mainnet
- [Access management](access-management.md) — manage controllers and prevent lock-out

<!-- Upstream: informed by dfinity/icskills — skills/canister-security/SKILL.md; dfinity/portal — docs/building-apps/canister-management/upgrade.mdx, docs/building-apps/interact-with-canisters/candid/using-candid.mdx; dfinity/icp-cli — docs/guides/canister-snapshots.md; dfinity/cdk-rs — ic-cdk/src/api/management_canister/main/types.rs; dfinity/examples — rust/tokenmania/backend/types.rs -->
