---
title: "Access Control Patterns"
description: "Implementing access control and authorization in ICP canisters"
sidebar:
  order: 3
doc_type: how-to
level: intermediate
last_verified: 2026-03-10
---

Every canister call on ICP includes the caller's principal. Your canister must validate this principal to ensure only authorized users can perform sensitive operations.

## Caller identification

The caller principal is available through the system API:

- **Rust:** `ic_cdk::caller()`
- **Motoko:** `msg.caller` in shared functions

Every principal is one of these types:

- **Self-authenticating** -- derived from a user's public key
- **Anonymous** -- the special principal `2vxsx-fae`, used when no identity is provided
- **Canister** -- the principal of another canister making an inter-canister call
- **Opaque** -- used internally by the system

## Reject the anonymous principal

The anonymous principal (`2vxsx-fae`) is shared by all unauthenticated callers. Allowing it in authenticated endpoints effectively creates a shared account anyone can access.

**Rust:**

```rust
fn ensure_authenticated() -> Result<Principal, String> {
    let caller = ic_cdk::caller();
    if caller == Principal::anonymous() {
        Err("Anonymous principal not allowed".into())
    } else {
        Ok(caller)
    }
}

#[update]
fn sensitive_operation() -> Result<(), String> {
    let caller = ensure_authenticated()?;
    // proceed with authenticated caller
    Ok(())
}
```

**Motoko:**

```motoko
import Principal "mo:base/Principal";

private func ensureAuthenticated(caller : Principal) : Bool {
    not Principal.isAnonymous(caller)
};

public shared ({ caller }) func sensitiveOperation() : async () {
    assert ensureAuthenticated(caller);
    // proceed with authenticated caller
};
```

Perform authentication as early as possible in the call to avoid executing expensive operations before checking identity.

## Controller checks

Controllers are principals authorized to manage a canister (install code, change settings, stop/delete). Check controller status for admin operations:

**Rust:**

```rust
use ic_cdk::api::is_controller;

#[update]
fn admin_only_operation() -> Result<(), String> {
    if !is_controller(&ic_cdk::caller()) {
        return Err("Caller is not a controller".into());
    }
    // admin logic
    Ok(())
}
```

**Motoko:**

```motoko
import ExperimentalCycles "mo:base/ExperimentalCycles";

// Store controllers in canister state if needed
stable var controllers : [Principal] = [/* initial controllers */];

public shared ({ caller }) func adminOnlyOperation() : async () {
    assert isController(caller);
    // admin logic
};

private func isController(p : Principal) : Bool {
    Array.find<Principal>(controllers, func(c) { c == p }) != null
};
```

## Role-based access control (RBAC)

For applications with multiple permission levels, implement RBAC by mapping principals to roles:

**Rust:**

```rust
use std::collections::HashMap;

#[derive(Clone, PartialEq)]
enum Role {
    Admin,
    Moderator,
    User,
}

thread_local! {
    static ROLES: RefCell<HashMap<Principal, Role>> = RefCell::new(HashMap::new());
}

fn require_role(caller: Principal, required: Role) -> Result<(), String> {
    ROLES.with(|roles| {
        match roles.borrow().get(&caller) {
            Some(role) if *role == required || *role == Role::Admin => Ok(()),
            _ => Err("Insufficient permissions".into()),
        }
    })
}

#[update]
fn moderate_content(content_id: u64) -> Result<(), String> {
    let caller = ensure_authenticated()?;
    require_role(caller, Role::Moderator)?;
    // moderation logic
    Ok(())
}
```

## Allowlists and denylists

For simple access control, maintain a set of allowed or denied principals:

```rust
thread_local! {
    static ALLOWLIST: RefCell<BTreeSet<Principal>> = RefCell::new(BTreeSet::new());
}

fn require_allowlisted(caller: Principal) -> Result<(), String> {
    ALLOWLIST.with(|list| {
        if list.borrow().contains(&caller) {
            Ok(())
        } else {
            Err("Caller not in allowlist".into())
        }
    })
}
```

Allowlists are simpler to reason about than denylists. Prefer allowlists unless you have a specific reason to use a denylist.

## Multi-canister authorization

When canister A calls canister B on behalf of a user, canister B sees canister A's principal as the caller, not the original user. Two approaches:

**1. Pass the user principal as an argument and trust canister A:**

```rust
// Canister B
#[update]
fn action_on_behalf(user: Principal) -> Result<(), String> {
    let caller = ic_cdk::caller();
    // Only trust calls from known canister A
    if caller != CANISTER_A_ID {
        return Err("Unauthorized canister".into());
    }
    // Use `user` as the authenticated identity
    Ok(())
}
```

**2. Use delegation chains** where the user provides a signed delegation to canister A.

## Ingress message inspection

The `canister_inspect_message` hook runs on a single replica before an ingress message is executed. It can reject messages early, saving cycles. However, it has limitations:

- It runs on only one replica. A malicious replica can skip it.
- It is not called for inter-canister messages.

**Never rely solely on `canister_inspect_message` for security-critical checks.** Always duplicate access control checks in your update methods.

```rust
#[inspect_message]
fn inspect_message() {
    // Reject anonymous callers early to save cycles
    if ic_cdk::caller() == Principal::anonymous() {
        ic_cdk::trap("Anonymous not allowed");
    }
    ic_cdk::api::call::accept_message();
}
```

## Summary of best practices

| Practice | Reason |
|----------|--------|
| Reject anonymous principal in all authenticated endpoints | Prevents shared-account access |
| Authenticate early in the call | Avoids wasted computation |
| Use controller checks for admin operations | Leverages built-in permission model |
| Implement RBAC for multi-role applications | Scales beyond simple owner checks |
| Prefer allowlists over denylists | Easier to audit and reason about |
| Validate caller in update methods, not just inspect | Inspect is not reliable |
| For cross-canister auth, verify the calling canister ID | Prevents spoofing |
