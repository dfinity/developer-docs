---
title: "Security Model"
description: "Security best practices for canister developers on the Internet Computer"
sidebar:
  order: 1
doc_type: explanation
level: intermediate
icskills: [canister-security]
last_verified: 2026-03-10
---

Building secure canisters on ICP requires understanding a threat model that differs from both traditional web applications and other blockchains. This page introduces the key security areas and links to detailed guidance for each.

## How ICP security differs

**From traditional web apps:**

- Canister code is public and verifiable. Anyone can inspect the Wasm module hash.
- There is no traditional server-side firewall or network perimeter. Access control must be implemented in code.
- State persists across calls without a database layer, meaning bugs in state management directly affect data integrity.

**From other blockchains:**

- ICP uses an asynchronous messaging model. Inter-canister calls involve multiple messages, and state can change between the call and its callback.
- The reverse gas model means canisters pay for computation, not users. This inverts the DoS attack surface.
- Query calls are fast but answered by a single replica, making them unsuitable for security-critical operations without certification.

## Threat model for canister applications

The primary threats to consider when building on ICP:

| Threat | Description |
|--------|-------------|
| **Reentrancy** | State changes between an inter-canister call and its callback can lead to inconsistent state or double-spending. |
| **Unauthorized access** | Missing or incorrect caller validation allows attackers to invoke privileged operations. |
| **Uncertified data** | Query responses from a single replica can be tampered with by a malicious node or boundary node. |
| **Upgrade failures** | Traps in `pre_upgrade` hooks can permanently brick a canister. |
| **Cycle drainage** | Attackers can trigger expensive operations to drain a canister's cycles balance. |
| **Memory exhaustion** | Unbounded data structures can be grown by attackers until the canister runs out of memory. |

## Security areas

### Inter-canister calls

The async callback model creates subtle risks around reentrancy, TOCTOU (time-of-check-time-of-use), and message ordering. Locking patterns and journaling help prevent inconsistent state.

See [Securing Inter-Canister Calls](/guides/security/inter-canister-calls/).

### Access control

Every canister call has a caller principal. Failing to validate the caller, or allowing the anonymous principal in authenticated endpoints, opens the door to unauthorized actions.

See [Access Control Patterns](/guides/security/access-management/).

### Data integrity

Query calls are fast but unsigned. Certified variables and response certification let you prove query results are authentic without the cost of update calls.

See [Data Integrity and Certification](/guides/security/data-integrity/).

### Safe upgrades

Canister upgrades replace the Wasm module while preserving stable memory. Traps during upgrade hooks, missing timer reinstantiation, or serialization failures can cause data loss or permanently block upgrades.

See [Safe Upgrade Patterns](/guides/security/canister-upgrades/).

### DoS prevention

The reverse gas model means your canister pays for every call it processes. Without rate limiting and resource management, attackers can drain cycles or exhaust memory at your expense.

See [Denial of Service Prevention](/guides/security/dos-prevention/).

## Security audit checklist

Before deploying to mainnet, verify:

- [ ] All authenticated endpoints reject the anonymous principal
- [ ] Controller-only operations check `ic_cdk::caller()` against the controller list
- [ ] Inter-canister calls use locking to prevent reentrancy
- [ ] Callbacks handle traps and rejects gracefully
- [ ] `pre_upgrade` does not contain logic that can trap
- [ ] Timers are reinstantiated in `post_upgrade`
- [ ] Security-critical query responses use certified variables
- [ ] Data structures have bounded sizes to prevent memory exhaustion
- [ ] Expensive operations require authentication or proof of work
- [ ] The freezing threshold is set to a reasonable value (default 30 days)
- [ ] Asset serving goes through `icp0.io` (not `raw.icp0.io`)

## Further reading

- [How to audit an ICP canister](https://www.joachim-breitner.de/blog/788-How_to_audit_an_Internet_Computer_canister)
- [Effective Rust canisters](https://mmapped.blog/posts/01-effective-rust-canisters.html)
- [ICP security best practices video](https://www.youtube.com/watch?v=PneRzDmf_Xw&list=PLuhDt1vhGcrez-f3I0_hvbwGZHZzkZ7Ng&index=2)
