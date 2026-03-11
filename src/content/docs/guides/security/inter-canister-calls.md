---
title: "Securing Inter-Canister Calls"
description: "Best practices for safe inter-canister call patterns on ICP"
sidebar:
  order: 2
doc_type: how-to
level: intermediate
last_verified: 2026-03-10
---

Inter-canister calls on ICP are asynchronous. A call sends a message, and the response arrives in a separate callback message. Between those two messages, other messages can execute and modify canister state. This creates risks that do not exist in synchronous programming models.

## The async execution model

When a canister makes an inter-canister call:

1. The canister executes code up to the `await` point and commits that state.
2. The outgoing message is sent. While waiting for the response, other messages can execute against the canister.
3. The callback executes as a separate message with its own commit point.

If the callback traps, state rolls back to the snapshot taken just before the callback started -- not to the state before the original call.

## Reentrancy risks

Because other messages can execute between step 1 and step 3, the canister state may change in unexpected ways.

**Double-spending example:**

```
1. User calls refund(). Canister checks eligibility -> yes.
2. Canister sends transfer to ledger (await).
   -- Meanwhile, user calls refund() again. Eligibility still shows yes
      because the first callback hasn't run yet. --
3. Both callbacks execute. User gets refunded twice.
```

**TOCTOU (time-of-check-time-of-use) example:**

```
1. Canister checks that account has sufficient balance.
2. Canister makes inter-canister call (await).
   -- Another call reduces the account balance. --
3. Callback proceeds with transfer, overdrawing the account.
```

## Prevention: locking patterns

The primary defense is to lock resources before making inter-canister calls and release the lock in the callback (or cleanup).

### Rust — CallerGuard with Drop

```rust
pub struct CallerGuard {
    principal: Principal,
}

impl CallerGuard {
    pub fn new(principal: Principal) -> Result<Self, String> {
        STATE.with(|state| {
            let pending = &mut state.borrow_mut().pending_requests;
            if pending.contains(&principal) {
                return Err("Already processing a request for this caller".into());
            }
            pending.insert(principal);
            Ok(Self { principal })
        })
    }
}

impl Drop for CallerGuard {
    fn drop(&mut self) {
        STATE.with(|state| {
            state.borrow_mut().pending_requests.remove(&self.principal);
        })
    }
}

#[update]
async fn protected_transfer() -> Result<(), String> {
    let caller = ic_cdk::caller();
    let _guard = CallerGuard::new(caller)?;  // lock acquired
    // ... make inter-canister call ...
    Ok(())
}   // guard dropped here, lock released -- even if callback traps
```

From Rust CDK version 0.5.1, local variables are dropped in the cleanup callback (`ic0.call_on_cleanup`), so the lock is released even if the callback traps.

**Important:** Never write `let _ = CallerGuard::new(caller)?;` -- this drops the guard immediately and the lock has no effect.

### Motoko — try/finally

```motoko
public shared ({ caller }) func protected_transfer() : async Result<(), Text> {
    var guard_acquired = false;
    try {
        switch (guard(caller)) {
            case (#ok) guard_acquired := true;
            case (#err e) return #err(Error.message(e));
        };
        // ... make inter-canister calls ...
        #ok
    } catch e {
        #err(Error.message(e));
    } finally {
        if guard_acquired { drop_guard(caller) };
    };
};
```

The `finally` block (Motoko 0.12.0+) ensures the lock is released regardless of traps.

## Handling traps in callbacks

If a callback traps, all state changes made within that callback are rolled back. This can leave the canister in an inconsistent state if the callback was supposed to record the result of an operation.

**Problematic pattern:**

```
1. Pre-call: deduct user balance (committed at await point).
2. Call ledger transfer.
3. Callback: record transfer result and update statistics.
   If statistics update traps, the transfer record is lost,
   but the balance deduction persists.
```

### Journaling

Journaling is the recommended approach for security-critical async flows. Before each failable step, record the intent in a persistent journal. After the step, record the result.

1. **Check journal** -- is this operation already in progress? If so, enter recovery.
2. **Journal the intent** -- record what you are about to do with enough context to recover.
3. **Execute the call** -- make the inter-canister call.
4. **Journal the result** -- record success or failure.
5. **Continue to dependent tasks** -- proceed based on the journaled result.

If a trap occurs at any point, the journal tells you what happened and what to do next. Recovery can be triggered by timers, heartbeats, or manual intervention.

## Handling rejected calls

Inter-canister calls can be rejected by the system. Handle each reject code appropriately:

| Reject code | Meaning | Action |
|-------------|---------|--------|
| `SYS_UNKNOWN` | Unknown whether the call took effect | Must determine outcome before retrying. Use idempotency keys. |
| `CANISTER_ERROR` | Bug in the callee; call may have had partial effect | Investigate and potentially enter manual recovery. |
| `CANISTER_REJECT` | Callee explicitly rejected the call | Typically safe to assume the call had no effect. |

Always handle the error case in your callback. Never assume an inter-canister call will succeed.

## Calling untrusted canisters

If a callee stalls indefinitely (never responds), your canister's callback remains registered and the canister cannot be cleanly upgraded. Use a state-free proxy canister for interactions with untrusted canisters. The proxy can be reinstalled if it gets stuck.

**Additional precautions:**

- Sanitize all data returned from inter-canister calls.
- Avoid loops in call graphs (A calls B, B calls C, C calls A) -- these can cause deadlocks.
- Consider using bounded-wait (best-effort) calls when available, as they provide timeouts.

## Summary

| Risk | Mitigation |
|------|-----------|
| Reentrancy / double spending | Per-caller locking with Drop (Rust) or try/finally (Motoko) |
| Inconsistent state from callback traps | Journaling pattern |
| Rejected calls | Handle all reject codes; use idempotency keys for `SYS_UNKNOWN` |
| Untrusted callees stalling | State-free proxy canister |
| Call graph deadlocks | Avoid loops; use bounded-wait calls |
