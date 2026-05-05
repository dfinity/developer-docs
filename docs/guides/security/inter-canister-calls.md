---
title: "Inter-Canister Call Safety"
description: "Handle reentrancy, callback traps, and async safety in inter-canister calls"
sidebar:
  order: 5
---

Inter-canister calls are the most common source of security bugs on the Internet Computer. The async messaging model creates a class of vulnerabilities that do not exist in synchronous systems: state can change between an `await` and its response, traps in callbacks can skip security-critical operations, and calls to untrusted canisters can permanently block upgrades.

This guide covers the specific patterns you must apply whenever your canister makes an inter-canister call.

## Why inter-canister calls are dangerous

When your canister `await`s a call to another canister, the IC scheduler can interleave other incoming messages while your canister waits for the response. This means:

- State your canister read before the `await` may be different when the callback runs.
- A second call from the same user can arrive and begin executing before the first call's callback completes.
- If the callback traps, any mutations made in the callback are rolled back: but mutations made before the `await` are already committed.

The code before `await` and the code after `await` execute as **separate atomic message executions**. Understanding this is the foundation of inter-canister call security.

## Reentrancy and the CallerGuard pattern

A reentrancy bug occurs when a second message from the same caller interleaves with a first message that is still in progress: that is, awaiting a response. In DeFi contexts this enables double-spending: the attacker calls `withdraw()`, waits for it to begin the inter-canister transfer, then calls `withdraw()` again before the first call updates the balance.

The CallerGuard pattern prevents this by tracking which callers have an in-flight operation. When a second call arrives from the same caller, it is rejected before it can interleave.

### Motoko

In Motoko, the guard must be released in a `finally` block. The `finally` block runs in cleanup context, where state changes are committed even if the `try` body trapped. If you release the guard inside the `try` body, a trap in the callback leaves the guard held forever. The caller is permanently locked out.

```motoko
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Error "mo:core/Error";
import Result "mo:core/Result";

// Inside your persistent actor class { ... }
// Replace otherCanister with your canister reference.

let pendingRequests = Map.empty<Principal, Bool>();

func acquireGuard(principal : Principal) : Result.Result<(), Text> {
  if (Map.get(pendingRequests, Principal.compare, principal) != null) {
    return #err("already processing a request for this caller");
  };
  Map.add(pendingRequests, Principal.compare, principal, true);
  #ok
};

func releaseGuard(principal : Principal) {
  ignore Map.delete(pendingRequests, Principal.compare, principal);
};

public shared ({ caller }) func withdraw(amount : Nat) : async Result.Result<(), Text> {
  if (Principal.isAnonymous(caller)) {
    return #err("anonymous caller not allowed");
  };

  // Acquire per-caller lock before any state reads or async calls.
  switch (acquireGuard(caller)) {
    case (#err(msg)) { return #err(msg) };
    case (#ok) {};
  };

  try {
    // Read state and make the inter-canister call here.
    let result = await otherCanister.transfer(caller, amount);
    #ok(result)
  } catch (e) {
    #err("transfer failed: " # Error.message(e))
  } finally {
    // Runs in cleanup context regardless of success or trap.
    // State mutations here are always committed.
    releaseGuard(caller);
  };
};
```

### Rust

In Rust, the `Drop` trait releases the lock when the guard goes out of scope: including when the async function is cancelled or a trap occurs. Never write `let _ = CallerGuard::new(caller)?`: the leading underscore drops the guard immediately, making locking ineffective. Always bind to a named variable: `let _guard = CallerGuard::new(caller)?`.

```rust
use std::cell::RefCell;
use std::collections::BTreeSet;
use candid::Principal;
use ic_cdk::update;
use ic_cdk::api::msg_caller;
use ic_cdk::call::Call;

// Replace other_canister_id() with your canister's ID lookup.

thread_local! {
    static PENDING: RefCell<BTreeSet<Principal>> = RefCell::new(BTreeSet::new());
}

struct CallerGuard {
    principal: Principal,
}

impl CallerGuard {
    fn new(principal: Principal) -> Result<Self, String> {
        PENDING.with(|p| {
            if !p.borrow_mut().insert(principal) {
                return Err("already processing a request for this caller".to_string());
            }
            Ok(Self { principal })
        })
    }
}

impl Drop for CallerGuard {
    fn drop(&mut self) {
        PENDING.with(|p| {
            p.borrow_mut().remove(&self.principal);
        });
    }
}

#[update]
async fn withdraw(amount: u64) -> Result<(), String> {
    let caller = msg_caller();
    if caller == Principal::anonymous() {
        return Err("anonymous caller not allowed".to_string());
    }

    // Acquire per-caller lock. Drop releases the lock when _guard goes out of scope.
    let _guard = CallerGuard::new(caller)?;

    // Make the inter-canister call while the lock is held.
    Call::bounded_wait(other_canister_id(), "transfer")
        .with_args(&(caller, amount))
        .await
        .map_err(|e| format!("transfer failed: {:?}", e))?;

    Ok(())
    // _guard dropped here: lock released
}
```

## State mutations before and after await

Because the code before `await` and the code after `await` are separate message executions, you must treat them independently when reasoning about consistency.

**The critical rule:** If your canister mutates state before an `await`, that mutation is committed even if the callback traps.

### Example: deduct before transferring

In a token transfer flow, deduct the balance before the inter-canister call rather than after. If the call fails, refund in the callback. This approach is safe: if the callback traps, the pre-deducted balance stays deducted (you can detect and remediate the stuck state. If you deduct after the call and the callback traps, the transfer happened but the balance was never deducted) funds are double-spent.

**Motoko:**

```motoko
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Error "mo:core/Error";
import Result "mo:core/Result";

// Inside your persistent actor class { ... }
let balances = Map.empty<Principal, Nat>();

public shared ({ caller }) func transfer(to : Principal, amount : Nat) : async Result.Result<(), Text> {
  // 1. Validate balance before the await.
  let balance = switch (Map.get(balances, Principal.compare, caller)) {
    case (?b) b;
    case null 0;
  };
  if (balance < amount) {
    return #err("insufficient balance");
  };

  // 2. Deduct BEFORE the await: mutation is committed regardless of callback outcome.
  Map.add(balances, Principal.compare, caller, balance - amount);

  // 3. Perform the inter-canister call.
  try {
    await ledgerCanister.transfer(to, amount);
    #ok(())
  } catch (e) {
    // 4. Refund on failure: the deduction persists even if this try/catch runs.
    let currentBalance = switch (Map.get(balances, Principal.compare, caller)) {
      case (?b) b;
      case null 0;
    };
    Map.add(balances, Principal.compare, caller, currentBalance + amount);
    #err("transfer failed: " # Error.message(e))
  }
};
```

**Rust:**

```rust
use std::cell::RefCell;
use std::collections::BTreeMap;
use candid::Principal;
use ic_cdk::update;
use ic_cdk::api::msg_caller;
use ic_cdk::call::Call;

// Replace ledger_canister_id() with your canister's ID lookup.

thread_local! {
    static BALANCES: RefCell<BTreeMap<Principal, u64>> =
        RefCell::new(BTreeMap::new());
}

#[update]
async fn transfer(to: Principal, amount: u64) -> Result<(), String> {
    let caller = msg_caller();

    // 1. Validate and deduct BEFORE the await.
    BALANCES.with(|b| {
        let mut balances = b.borrow_mut();
        let balance = balances.get(&caller).copied().unwrap_or(0);
        if balance < amount {
            return Err("insufficient balance".to_string());
        }
        balances.insert(caller, balance - amount);
        Ok(())
    })?;

    // 2. Make the inter-canister call.
    let result = Call::bounded_wait(ledger_canister_id(), "transfer")
        .with_args(&(to, amount))
        .await;

    if let Err(e) = result {
        // 3. Refund on failure.
        BALANCES.with(|b| {
            let mut balances = b.borrow_mut();
            let current = balances.get(&caller).copied().unwrap_or(0);
            balances.insert(caller, current + amount);
        });
        return Err(format!("transfer failed: {:?}", e));
    }

    Ok(())
}
```

## Callback traps and security-critical cleanup

A trap in an inter-canister call callback is particularly dangerous: the callback's state mutations are rolled back, but the pre-`await` mutations are not. A malicious callee can induce a trap in your callback to skip actions that should always run: like debiting an account.

To protect against this:

1. **Keep callbacks minimal.** The less logic in a callback, the fewer opportunities for a trap.
2. **Use `finally` (Motoko) or `Drop` guards (Rust) for cleanup.** Cleanup that runs in `finally` or in `drop()` executes in cleanup context where mutations persist even after a trap.
3. **Avoid calling untrusted canisters** from callbacks that perform security-critical state changes. The callee can cause your callback to trap.

### Motoko: cleanup in finally

```motoko
import Error "mo:core/Error";

// Inside your persistent actor class { ... }
// Replace otherCanister with your canister reference.

var operationInProgress = false;

public shared ({ caller }) func riskyOperation() : async () {
  operationInProgress := true;  // Committed immediately

  try {
    await otherCanister.doSomething();
    // ... callback logic
  } catch (e) {
    // Handle error
    ignore Error.message(e);
  } finally {
    // Runs in cleanup context: mutation persists even if callback trapped.
    operationInProgress := false;
  }
};
```

### Rust: cleanup via Drop

```rust
use std::cell::Cell;
use ic_cdk::update;
use ic_cdk::call::Call;

// Replace other_canister_id() with your canister's ID lookup.

thread_local! {
    static OPERATION_IN_PROGRESS: Cell<bool> = Cell::new(false);
}

struct OperationGuard;

impl Drop for OperationGuard {
    fn drop(&mut self) {
        // Runs when the guard is dropped, even during cleanup after a trap.
        OPERATION_IN_PROGRESS.with(|f| f.set(false));
    }
}

#[update]
async fn risky_operation() -> Result<(), String> {
    OPERATION_IN_PROGRESS.with(|f| f.set(true)); // Committed immediately

    // _guard released (Drop called) when this function returns or is cancelled.
    let _guard = OperationGuard;

    Call::bounded_wait(other_canister_id(), "do_something")
        .await
        .map_err(|e| format!("call failed: {:?}", e))?;

    Ok(())
}
```

## Bounded vs unbounded wait

The IC offers two kinds of inter-canister calls:

| | `bounded_wait` | `unbounded_wait` |
|---|---|---|
| Timeout | 300 seconds (default) | No timeout |
| If callee is unresponsive | Returns `SYS_UNKNOWN` error | Waits indefinitely |
| Upgrade safety | Canister can be stopped and upgraded after timeout | Canister **cannot be stopped** while awaiting |
| Use for | Calls to external or untrusted canisters | Calls to your own canisters you control |

**The upgrade safety issue:** A canister cannot be stopped (and therefore cannot be upgraded) while it has outstanding unbounded-wait calls. If the callee is malicious or buggy and never responds, your canister is permanently stuck. Use `bounded_wait` for any call to a canister you do not control.

### Motoko: bounded vs unbounded

Motoko does not yet expose a direct API to switch between bounded and unbounded wait. The `await` keyword currently uses unbounded wait. For calls to untrusted canisters, prefer the system-level API (available via Rust) or structure your application so calls to untrusted canisters only go out from canisters you can afford to sacrifice.

<!-- Needs human verification: Motoko bounded-wait API availability — as of current release, Motoko does not expose a bounded_wait equivalent. Verify against compiler release notes. -->

### Rust: choose bounded_wait for untrusted canisters

```rust
use ic_cdk::call::Call;
use candid::Principal;

async fn call_trusted(canister: Principal, method: &str) -> Result<String, String> {
    // Use unbounded_wait only for canisters you control.
    Call::unbounded_wait(canister, method)
        .await
        .map_err(|e| format!("call failed: {:?}", e))?
        .candid()
        .map_err(|e| format!("decode failed: {:?}", e))
}

async fn call_untrusted(canister: Principal, method: &str) -> Result<String, String> {
    // Use bounded_wait for external or untrusted canisters.
    // Default timeout is 300 seconds. Adjust with .change_timeout(seconds).
    Call::bounded_wait(canister, method)
        .await
        .map_err(|e| format!("call failed: {:?}", e))?
        .candid()
        .map_err(|e| format!("decode failed: {:?}", e))
}
```

## Response size limits

All inter-canister call payloads (both requests and responses) are limited to **2 MB**. A request above 2 MB fails synchronously. A response above 2 MB causes the callee to trap.

When reading large datasets across canisters, use pagination: return chunks of data per call rather than everything at once. Keep individual payloads under 1 MB to leave room for encoding overhead.

```motoko
// Paginated query: avoid returning unbounded data
// Requires: import Array "mo:core/Array"; import Nat "mo:core/Nat";
public query func getItems(offset : Nat, limit : Nat) : async [Item] {
  // Return at most `limit` items starting from `offset`.
  // Caller makes multiple calls to retrieve all data.
  Array.sliceToArray(items, offset, offset + Nat.min(limit, items.size() - offset))
};
```

## Caller identity across await points

In Motoko, the `caller` is captured as an immutable binding at function entry via `public shared ({ caller }) func`. This is safe across `await` points.

In Rust, the current ic-cdk executor preserves caller across `.await` points via protected tasks, but this is an implementation detail: not a language guarantee. Bind `msg_caller()` before the first `await` as a defensive practice.

```rust
use ic_cdk::update;
use ic_cdk::api::msg_caller;
use ic_cdk::call::Call;
use candid::Principal;

// Replace other_canister_id() with your canister's ID lookup.

#[update]
async fn process() -> Result<(), String> {
    // Capture caller BEFORE any await: defensive practice in Rust.
    let caller: Principal = msg_caller();

    Call::bounded_wait(other_canister_id(), "validate")
        .with_arg(caller)
        .await
        .map_err(|e| format!("validation failed: {:?}", e))?;

    // Use the captured binding, not msg_caller() again.
    do_work_for(caller);
    Ok(())
}

fn do_work_for(_caller: Principal) {
    // ...
}
```

## canister_inspect_message is not called for inter-canister calls

`canister_inspect_message` (Motoko: `system func inspect`) runs only for **ingress messages**: calls from external users arriving at the boundary nodes. It is never called for inter-canister calls.

This means any access control you implement in `inspect_message` does not protect your canister from being called by another canister. Always duplicate access checks inside the method body itself.

For full details on access control patterns, see [access management](access-management.md).

## Handling rejected calls

Inter-canister calls can be rejected for reasons beyond your control: the callee may have trapped, run out of cycles, been stopped, or the system may have rejected the message due to resource pressure. Unhandled rejections trap your canister.

Always handle the error result of an inter-canister call.

**Motoko:** use `try/catch`:

```motoko
import Error "mo:core/Error";
import Result "mo:core/Result";

// Inside your persistent actor class { ... }
// Replace otherCanister with your canister reference.

public shared func callSomething() : async Result.Result<Text, Text> {
  try {
    let result = await otherCanister.someMethod();
    #ok(result)
  } catch (e) {
    #err("call failed: " # Error.message(e))
  }
};
```

**Rust:** handle the `Result` from `Call::bounded_wait`:

```rust
use ic_cdk::update;
use ic_cdk::call::Call;
use candid::Principal;

// Replace other_canister_id() with your canister's ID lookup.

#[update]
async fn call_something() -> Result<String, String> {
    let response = Call::bounded_wait(other_canister_id(), "some_method")
        .await
        .map_err(|e| format!("call rejected: {:?}", e))?;

    response.candid::<String>()
        .map_err(|e| format!("decode failed: {:?}", e))
}
```

## Summary checklist

Before shipping any canister that makes inter-canister calls:

- **Reentrancy:** Apply CallerGuard (per-caller lock) to any method that makes an inter-canister call and reads or writes shared state.
- **State ordering:** Deduct or commit before `await`; compensate on failure in the callback.
- **Cleanup:** Use `finally` (Motoko) or `Drop` (Rust) for locks and cleanup that must always run.
- **Wait type:** Use `bounded_wait` for calls to canisters you do not control; `unbounded_wait` only for your own canisters.
- **Payload size:** Keep request and response payloads under 1 MB; paginate larger datasets.
- **Caller capture:** In Rust, bind `msg_caller()` before the first `await`.
- **Access control:** Do not rely on `canister_inspect_message` for inter-canister call security: always check the caller inside the method.
- **Error handling:** Always handle the `Result` of every inter-canister call.

## Next steps

- [Inter-canister calls](../canister-calls/inter-canister-calls.md#making-calls): Basic inter-canister call patterns and the `Call` API
- [Parallel inter-canister calls](../canister-calls/parallel-inter-canister-calls.md): Running multiple calls concurrently and handling partial failures
- [Security concepts](../../concepts/security.md): IC security model and threat landscape

<!-- Upstream: informed by dfinity/icskills — canister-security/SKILL.md, multi-canister/SKILL.md -->
