---
title: "DoS Prevention"
description: "Protect canisters from denial-of-service attacks with rate limiting, cycle drain protection, and resource management"
sidebar:
  order: 4
---

On ICP, [canisters pay for every message they process](../../concepts/cycles.md): including messages from attackers. Anyone on the internet can send update calls to your canister, and each call burns cycles even if your code ultimately rejects it. Left unmitigated, this lets an attacker drain your cycle balance by flooding your canister with messages.

This guide covers the patterns that protect against denial-of-service (DoS) attacks: early message filtering, rate limiting, resource allocation, and cycle monitoring.

## Checklist

- [ ] Use `canister_inspect_message` to drop obviously invalid messages before Candid decoding
- [ ] Reject the anonymous principal in every endpoint that requires authentication
- [ ] Enforce per-caller rate limits or concurrency locks for expensive operations
- [ ] Set a conservative freezing threshold (90–180 days)
- [ ] Set explicit `wasm_memory_limit` to guard against memory exhaustion
- [ ] Set `wasm_memory_threshold` to receive an `on_low_wasm_memory` hook notification before the limit is hit
- [ ] Monitor cycle balances and alert on unusual consumption spikes
- [ ] Reserve compute or memory allocation for high-traffic canisters

## Cycle drain attacks

Every ingress message (external call to your canister) costs cycles. The cost includes:

- A base execution fee of 5M cycles per update message (13-node subnet), plus an ingress reception fee of ~1.2M cycles and 2,000 cycles per byte received
- Per-instruction fees for all code executed before a trap or rejection
- Candid decoding, which runs before your method body

This means an attacker can drain your cycles simply by sending many messages. The canister pays for Candid decoding and early checks even when it rejects the call. See [Cycles costs](../../reference/cycles-costs.md) for exact figures.

### Use inspect_message as a first-pass filter

`canister_inspect_message` runs on a **single replica** before a message enters consensus. Code in this hook does not burn cycles, so it is an efficient place to drop messages that are obviously invalid: for example, calls from the anonymous principal to authenticated endpoints.

**Critical limitation:** `canister_inspect_message` is not a security boundary. It runs on one node and can be bypassed by a malicious boundary node. It is also never called for inter-canister calls, query calls, or management canister calls. Always duplicate real access control inside each update method. See [Access management](access-management.md) for the full access control pattern.

`inspect_message` has a budget of **200 million instructions**: do not perform expensive work here. Use it only to short-circuit calls that are structurally invalid (wrong caller type, missing required data).

**Motoko: inspect_message:**

```motoko
import Principal "mo:core/Principal";

// Inside the persistent actor { ... }

system func inspect(
  {
    caller : Principal;
    msg : {
      #adminAction : () -> ();
      #publicAction : () -> ();
      #expensiveOperation : () -> ();
    }
  }
) : Bool {
  switch (msg) {
    // Admin and expensive methods: reject anonymous callers before Candid decoding
    case (#adminAction _) { not Principal.isAnonymous(caller) };
    case (#expensiveOperation _) { not Principal.isAnonymous(caller) };
    // Public methods: accept all
    case (_) { true };
  };
};
```

**Rust: inspect_message:**

```rust
use ic_cdk::api::{accept_message, msg_caller, msg_method_name};
use candid::Principal;

/// Pre-filter to reduce cycle waste from spam.
/// Runs on ONE node. Can be bypassed. NOT a security check.
/// Always duplicate real access control inside each method.
#[ic_cdk::inspect_message]
fn inspect_message() {
    let method = msg_method_name();
    match method.as_str() {
        // Admin and expensive methods: reject anonymous callers
        "admin_action" | "expensive_operation" => {
            if msg_caller() != Principal::anonymous() {
                accept_message();
            }
            // Silently reject anonymous: saves cycles on Candid decoding
        }
        // Public methods: accept all
        _ => accept_message(),
    }
}
```

### Rate limiting and per-caller locking

For expensive operations (chain-key signing, HTTPS outcalls, large state writes), enforce per-caller concurrency limits. Allowing the same caller to queue up many concurrent requests multiplies the cost of any single caller's flood.

The CallerGuard pattern prevents concurrent calls from the same principal. While the guard is held, any second call from the same caller is rejected immediately: before any expensive work runs.

**Motoko: per-caller concurrency lock:**

```motoko
import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Result "mo:core/Result";

// Inside the persistent actor { ... }

let pendingRequests = Map.empty<Principal, Bool>();

func acquireGuard(principal : Principal) : Result.Result<(), Text> {
  if (Map.get(pendingRequests, Principal.compare, principal) != null) {
    return #err("already processing a request for this caller");
  };
  Map.add(pendingRequests, Principal.compare, principal, true);
  #ok;
};

func releaseGuard(principal : Principal) {
  ignore Map.delete(pendingRequests, Principal.compare, principal);
};

public shared ({ caller }) func expensiveOperation() : async Result.Result<Text, Text> {
  // 1. Reject anonymous
  if (Principal.isAnonymous(caller)) {
    return #err("anonymous principal not allowed");
  };

  // 2. Acquire per-caller lock: rejects concurrent calls from same principal
  switch (acquireGuard(caller)) {
    case (#err(msg)) { return #err(msg) };
    case (#ok) {};
  };

  // 3. Do expensive work (async calls, etc.)
  try {
    let result = await someExpensiveCall();
    #ok(result)
  } catch _ {
    #err("operation failed")
  } finally {
    // Released in cleanup context: runs even if the callback traps
    releaseGuard(caller);
  };
};
```

**Rust: per-caller concurrency lock (CallerGuard):**

```rust
use std::cell::RefCell;
use std::collections::BTreeSet;
use candid::Principal;
use ic_cdk::update;
use ic_cdk::api::msg_caller;

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
async fn expensive_operation() -> Result<String, String> {
    let caller = msg_caller();
    if caller == Principal::anonymous() {
        return Err("anonymous principal not allowed".to_string());
    }

    // Acquire per-caller lock: Drop releases it even if the callback traps
    let _guard = CallerGuard::new(caller)?;

    // Do expensive work: use Call::bounded_wait for inter-canister calls
    // to avoid unbounded waits that would block canister upgrades
    let result = do_expensive_work().await?;
    Ok(result)
    // _guard dropped here -> lock released
}
```

The guard releases automatically when it goes out of scope: including when an inter-canister call callback traps. Never use `let _ = CallerGuard::new(caller)?` (this drops the guard immediately, making locking ineffective). Always bind to a named variable (`let _guard`).

### Proof-of-work and captchas for public endpoints

For endpoints that must accept anonymous or unauthenticated callers: for example, a public registration flow. The per-caller lock pattern cannot apply. Instead, require the caller to prove they spent computational resources:

- **Captcha:** Require solving a captcha before calling an expensive endpoint. Use a library-based captcha (not a cloud service) to keep the solution onchain and avoid HTTPS outcalls.
- **Proof of work:** Require the client to include a nonce that satisfies a hash challenge. The canister verifies the nonce in `inspect_message` before accepting the message. This imposes CPU cost on the caller proportional to the difficulty parameter.

[Internet Identity](https://github.com/dfinity/internet-identity)'s [captcha implementation](https://github.com/dfinity/internet-identity/blob/2bf92dc16371428a3dcc1115580a691842ec76df/src/internet_identity/src/main.rs#L517) provides a working example.

## Resource limit awareness

The IC enforces hard limits on message execution. If your canister frequently approaches these limits, a flood of requests can make it unable to serve legitimate users:

| Limit | Value |
|-------|-------|
| Instructions per update call | 40 billion |
| Instructions per query call | 5 billion |
| Instructions per `inspect_message` | 200 million |
| Max ingress message payload | 2 MiB |
| Wasm heap memory | 4 GiB (wasm32) |
| Wasm stable memory | 500 GiB |

Source: [Cycles costs reference](../../reference/cycles-costs.md).

### Prevent memory exhaustion

If users can store data without limits, an attacker can fill the 4 GiB Wasm heap or stable memory, causing allocation failures that corrupt canister state. Mitigations:

- **Enforce per-user storage quotas**: track bytes stored per principal and reject requests that exceed the limit.
- **Validate input sizes**: check the size of user-provided blobs, text, or arrays before storing them.
- **Set a `wasm_memory_limit`**: configures a soft ceiling below the 4 GiB hard limit. When exceeded, new update calls trap instead of corrupting state. See [Canister settings](../canister-management/settings.md).

```yaml
# icp.yaml: memory protection (settings nested under canister name)
canisters:
  - name: backend
    settings:
      wasm_memory_limit: 3gib
      wasm_memory_threshold: 512mib  # triggers on_low_wasm_memory hook
```

### Paginate large queries

Data queries that return unbounded result sets can exhaust the instruction limit for a single call. An attacker can exploit this by requesting a query that processes all stored data:

- **Always paginate**: accept an optional cursor or offset and return at most a fixed number of results per call.
- **Avoid unbounded iteration**: do not iterate entire data structures in a single call unless the data set is provably bounded.

## Freezing threshold as a safety net

The `freezing_threshold` setting defines the minimum number of seconds the canister should be able to survive on its current cycle balance. When the balance drops below this reserve, the canister **freezes**: update calls are rejected. A frozen canister does not execute code, but it continues to pay for storage and compute allocation.

The default threshold is 30 days. For production canisters holding valuable state, increase it to 90–180 days:

```bash
# Set freezing threshold to 90 days
icp canister settings update backend --freezing-threshold 7776000 -e ic
```

Or via `icp.yaml`:

```yaml
# icp.yaml: settings nested under canister name
canisters:
  - name: backend
    settings:
      freezing_threshold: 90d
```

A conservative freezing threshold gives you time to detect and respond to a cycle drain attack before the canister is uninstalled. If cycles reach zero and the threshold expires, the canister is uninstalled: code and data are deleted permanently. See [Canister settings](../canister-management/settings.md) for full configuration details.

## Noisy neighbor protection

Multiple canisters share the same subnet. If a neighboring canister consumes excessive compute or memory, it can slow your canister's response times. You can reserve resources to protect against this:

### Compute allocation

Setting `compute_allocation` guarantees your canister a percentage of an execution core and ensures scheduled execution even when the subnet is busy:

```yaml
# icp.yaml: settings nested under canister name
canisters:
  - name: backend
    settings:
      compute_allocation: 10  # Guaranteed 10% of one execution core
```

A value of `10` means the canister is scheduled at least every 10 consensus rounds. Compute allocation incurs an ongoing rental fee (10M cycles per percentage point per second on a 13-node subnet). Only set it if you need guaranteed throughput under load. See [Cycles costs](../../reference/cycles-costs.md).

### Memory allocation

Setting `memory_allocation` reserves a fixed pool of memory for your canister, preventing other canisters from consuming the subnet's available memory:

```yaml
# icp.yaml: settings nested under canister name
canisters:
  - name: backend
    settings:
      memory_allocation: 4gib
```

Memory allocation is charged as if the full allocated amount were in use. Monitor actual memory usage to avoid paying for unused allocation.

## Monitoring cycle consumption

Cycle drain attacks appear as unusual spikes in consumption. Set up monitoring before deploying to mainnet:

```bash
# Check current cycle balance
icp canister status backend -e ic

# Check balance of a specific canister by ID
icp canister status <canister-id> -e ic
```

Key metrics to monitor:

- **Balance**: alert when balance drops below a safe threshold (e.g., 2x the freezing threshold reserve)
- **Burn rate**: track cycles per day; a sudden spike indicates unexpected activity
- **Memory usage**: track growth over time; sudden jumps suggest user-driven data accumulation

For production canister monitoring, consider automating balance checks with a heartbeat or timer canister that sends an alert notification when the balance approaches the freezing threshold.

## Handling expensive operations safely

Chain-key signing (threshold ECDSA/Schnorr), HTTPS outcalls, and Bitcoin API calls are significantly more expensive than standard update calls. These make attractive targets for attackers:

- **Require authentication**: never allow anonymous callers to trigger expensive operations.
- **Apply per-caller locking**: use the CallerGuard pattern to prevent the same caller from queuing multiple expensive calls.
- **Charge callers**: for canister-to-canister calls, require the calling canister to attach cycles to cover the cost. The called canister accepts the cycles using `ic0.msg_cycles_accept` (Rust: `ic_cdk::api::msg_cycles_accept(max_amount: u128)`).
- **Differentiate update vs. query**: move expensive computations to update calls and use query calls for cheap reads. Check whether a method is running as a query or update with `ic0.in_replicated_execution()` (Rust: `ic_cdk::api::in_replicated_execution()`).

## Next steps

- [Access management](access-management.md): caller checks, anonymous principal rejection, and role-based guards
- [Inter-canister call safety](inter-canister-calls.md): TOCTOU vulnerabilities and the CallerGuard pattern
- [Canister settings](../canister-management/settings.md): freezing threshold, memory allocation, and compute allocation
- [Cycles costs](../../reference/cycles-costs.md): exact cost tables and resource limits
- [Security model](../../concepts/security.md): IC trust boundaries and threat model overview

<!-- Upstream: informed by dfinity/portal docs/building-apps/security/dos.mdx; icskills: canister-security -->
