---
title: "Denial of Service Prevention"
description: "Protecting canisters from denial of service attacks"
sidebar:
  order: 6
doc_type: how-to
level: advanced
last_verified: 2026-03-10
---

ICP's reverse gas model means canisters pay for the computation their callers trigger. This inverts the typical blockchain DoS model: an attacker can drain your canister's cycles or exhaust its resources without paying anything themselves.

## Attack vectors

### Cycle drainage

An attacker repeatedly calls expensive operations (HTTPS outcalls, threshold signing, large computations) to drain the canister's cycles balance. Once cycles run out, the canister stops executing.

### Memory exhaustion

An attacker writes data to unbounded data structures (vectors, maps, logs) until the canister hits its memory limit and can no longer function.

### Instruction limit abuse

An attacker crafts inputs that cause pathological behavior in canister logic (e.g., worst-case sort, deep recursion), consuming maximum instructions per call and slowing down legitimate users.

## Prevention strategies

### Authentication and rate limiting

The most effective defense: require authentication for all non-trivial operations and rate-limit per caller.

```rust
use std::collections::HashMap;

thread_local! {
    static RATE_LIMITS: RefCell<HashMap<Principal, (u64, u64)>> = RefCell::new(HashMap::new());
    // Maps caller -> (call_count, window_start_timestamp)
}

fn check_rate_limit(caller: Principal, max_calls: u64, window_ns: u64) -> Result<(), String> {
    let now = ic_cdk::api::time();
    RATE_LIMITS.with(|limits| {
        let mut limits = limits.borrow_mut();
        let entry = limits.entry(caller).or_insert((0, now));

        if now - entry.1 > window_ns {
            // New window
            *entry = (1, now);
            Ok(())
        } else if entry.0 >= max_calls {
            Err("Rate limit exceeded".into())
        } else {
            entry.0 += 1;
            Ok(())
        }
    })
}
```

### Protect expensive operations

Operations that consume significant cycles deserve extra protection:

| Operation | Approximate cost | Protection |
|-----------|-----------------|------------|
| Threshold ECDSA signing | ~26B cycles | Require authentication + rate limit |
| Threshold Schnorr signing | ~26B cycles | Require authentication + rate limit |
| HTTPS outcall | ~49M-250M cycles | Require authentication + rate limit |
| Large stable memory writes | Variable | Bound data size per caller |

**CAPTCHAs:** For user-facing operations, require a CAPTCHA before allowing expensive calls. Internet Identity has a [CAPTCHA implementation](https://github.com/dfinity/internet-identity) that can serve as a reference.

**Proof of work:** Require callers to solve a computational puzzle before executing expensive operations. This makes attacks proportionally expensive for the attacker.

### Ingress message inspection

Use `canister_inspect_message` to reject obviously invalid messages before they consume cycles. This runs on a single replica at no cycles cost.

```rust
#[inspect_message]
fn inspect_message() {
    let caller = ic_cdk::caller();

    // Reject anonymous callers
    if caller == Principal::anonymous() {
        ic_cdk::trap("Anonymous not allowed");
    }

    // Reject if method requires specific roles
    let method = ic_cdk::api::call::method_name();
    if method == "admin_operation" && !is_controller(&caller) {
        ic_cdk::trap("Not authorized");
    }

    ic_cdk::api::call::accept_message();
}
```

**Important:** A malicious replica can skip `inspect_message`. Never rely on it as the sole access control check.

### Bound all data structures

Every user-writable data structure must have a size limit:

```rust
const MAX_ENTRIES_PER_USER: usize = 1000;
const MAX_TOTAL_ENTRIES: usize = 1_000_000;

#[update]
fn add_entry(data: Vec<u8>) -> Result<(), String> {
    let caller = ensure_authenticated()?;

    if data.len() > MAX_ENTRY_SIZE {
        return Err("Entry too large".into());
    }

    STATE.with(|state| {
        let mut state = state.borrow_mut();
        let user_count = state.count_entries(&caller);
        if user_count >= MAX_ENTRIES_PER_USER {
            return Err("Per-user entry limit reached".into());
        }
        if state.total_entries() >= MAX_TOTAL_ENTRIES {
            return Err("Total entry limit reached".into());
        }
        state.insert(caller, data);
        Ok(())
    })
}
```

### Configure the freezing threshold

The freezing threshold determines when a canister stops accepting new calls to preserve remaining cycles for storage costs. The default is 30 days, which is usually appropriate.

```bash
icp canister update-settings <canister-id> --freezing-threshold 2592000 -n ic
```

If the canister's cycles balance can only cover storage for fewer than the threshold number of seconds, it enters a frozen state and rejects all calls except those from controllers.

### Reserve resources against noisy neighbors

Multiple canisters share a subnet. A resource-hungry neighbor can impact your canister's performance.

**Memory allocation:** Reserve memory to guarantee availability.

```bash
icp canister update-settings <canister-id> --memory-allocation 2147483648 -n ic
```

**Compute allocation:** Reserve a percentage of CPU time.

```bash
icp canister update-settings <canister-id> --compute-allocation 50 -n ic
```

Both reservations come at a cost -- you pay for the reserved resources whether you use them or not.

### Charge for expensive inter-canister calls

If your canister provides a service to other canisters, require cycles to be attached to calls:

```rust
#[update]
fn expensive_service(request: ServiceRequest) -> Result<ServiceResponse, String> {
    let cycles_received = ic_cdk::api::call::msg_cycles_available128();
    let required_cycles: u128 = 1_000_000_000; // 1B cycles

    if cycles_received < required_cycles {
        return Err(format!("Attach at least {} cycles", required_cycles));
    }

    ic_cdk::api::call::msg_cycles_accept128(required_cycles);
    // Process the request
    Ok(process(request))
}
```

## Monitoring and alerting

Set up monitoring to detect attacks early:

- **Track cycles balance** over time. A sudden drop indicates a potential drain attack.
- **Monitor call volume** per method. Unusual spikes signal abuse.
- **Alert on memory growth** that exceeds expected patterns.
- **Check canister status** regularly:

```bash
icp canister status <canister-id> -n ic
```

## Summary

| Attack vector | Mitigation |
|---------------|-----------|
| Cycle drainage via expensive calls | Authenticate + rate limit + CAPTCHA/PoW |
| Memory exhaustion | Bound all data structures; set per-user limits |
| Instruction limit abuse | Validate input sizes; reject pathological inputs |
| Anonymous spam | Reject anonymous principal; use inspect_message |
| Noisy neighbors | Reserve memory and compute allocation |
| Cycles running out | Set freezing threshold; monitor balance; charge for services |
