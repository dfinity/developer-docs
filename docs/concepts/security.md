---
title: "Security model"
description: "The IC security model: canister isolation, trust boundaries, and the threat model for app developers"
sidebar:
  order: 13
---

The Internet Computer provides strong security guarantees at the protocol level: replicated execution, threshold cryptography, and deterministic state machines. But the protocol cannot prevent bugs in your code. Understanding where the platform's guarantees end and your responsibilities begin is essential for building secure apps.

This page explains the IC security model from a developer's perspective: what the platform protects, what it does not, and what you need to handle yourself.

## Execution model

Canisters execute in two modes, each with different trust properties:

**Update calls** go through consensus. Every node on the subnet executes the same code against the same state and must agree on the result. This makes update calls tamper-proof: a single malicious node cannot alter the outcome. The tradeoff is latency (~2 seconds).

**Query calls** run on a single replica. They are fast (~200ms) but the responding replica can return incorrect or fabricated results. Replica-signed queries provide partial mitigation (the replica signs its response), but for data that must be trustworthy, use [certified variables](../guides/backends/certified-variables.md) or update calls. Certified variables work by letting the canister set data that the subnet signs as part of the state tree: clients then verify the subnet's signature to confirm the response hasn't been tampered with. See [Certified data](certified-data.md) for how this mechanism works.

This distinction is the most important security boundary on the IC. Any data returned by a query call that is not backed by a certificate should be treated as unverified.

## Canister isolation

Each canister runs in its own WebAssembly sandbox with its own memory. Canisters cannot read or write each other's state: they can only communicate through explicit async messages. This isolation is enforced by the protocol, not by the canister code.

However, isolation does not mean independence. When a canister makes an inter-canister call, the call is an asynchronous message. Between sending the request and receiving the response, the canister can process other messages, and its state may change. This creates a class of vulnerabilities known as TOCTOU (time-of-check-time-of-use): where a condition verified before an `await` is no longer true after it. See [Inter-canister call safety](../guides/security/inter-canister-calls.md) for patterns that mitigate this.

## Trust boundaries

As an app developer, you should understand who trusts whom in the IC stack:

### What the protocol guarantees

- **Replicated execution.** Update calls are executed by all nodes on a subnet and must reach consensus. On a standard 13-node application subnet, this tolerates up to 4 faulty nodes.
- **State integrity.** Canister state is replicated and persists across rounds. A single node cannot corrupt state.
- **Message authenticity.** The caller principal attached to every message is verified by the protocol. You can trust that `msg.caller` (Motoko) or `ic_cdk::api::msg_caller()` (Rust) is authentic.
- **Canister isolation.** Canisters cannot access each other's memory. Communication happens only through the message-passing API.

### What the protocol does NOT guarantee

- **Query call integrity.** A single replica responds to query calls. Without certified data, the response is not verified by consensus.
- **Canister code correctness.** The protocol executes whatever code you deploy. If your code has bugs, the protocol faithfully executes the buggy code.
- **Access control.** There is no built-in permission system. Every update method is callable by anyone on the internet unless your code explicitly checks the caller.
- **Memory confidentiality on application subnets.** Node operators on standard application subnets can read canister memory. The network is gradually rolling out SEV-SNP (hardware-level memory encryption) to mitigate this, but until full deployment, do not store secrets (private keys, API tokens, passwords) in canister state. For secret management on the network, see [VetKeys](vetkeys.md).

### Boundary nodes

Boundary nodes are the HTTP entry point to the IC. They route requests to the correct subnet but are not part of the trust model for update calls. The response is verified by the client against the subnet's public key regardless of which boundary node served it.

For query calls, the situation is different. A malicious boundary node could return a fabricated response to a query call. This is another reason to use certified data for any query response that users depend on for security-critical decisions.

### canister_inspect_message

`canister_inspect_message` is a hook that runs on a **single replica** before an update call enters consensus. It can reject messages early to save cycles (for example, dropping calls from the anonymous principal before Candid decoding). But it is not a security boundary: a malicious boundary node can bypass it, and it is never called for inter-canister calls, query calls, or management canister calls. Always enforce access control inside each method.

## Threat model for app developers

The following threats are your responsibility to mitigate:

### Missing access control

Every update method is publicly callable. If you do not check the caller, anyone can invoke admin functions, drain funds, or corrupt state. The anonymous principal (`2vxsx-fae`) is a particularly common gap: it must be explicitly rejected in any authenticated endpoint, because otherwise it acts as a shared identity that anyone can use.

See [Access management](../guides/security/identity-and-access-management.md#reject-anonymous-callers) for implementation patterns.

### Reentrancy and async interleaving

The async messaging model means that between an `await` and its callback, other messages can execute and mutate your canister's state. This is the most critical source of exploits in IC DeFi applications. The standard mitigation is per-caller locking (the CallerGuard pattern), and for financial operations, the saga pattern (deduct before `await`, compensate on failure).

See [Inter-canister call safety](../guides/security/inter-canister-calls.md) for detailed patterns.

### Callback traps and partial rollback

If a message execution traps, all its state changes are rolled back. But for inter-canister calls, the first execution (before `await`) and the callback (after `await`) are separate messages. A trap in the callback only rolls back the callback's changes: mutations from the first execution persist. This means cleanup logic (like releasing locks or completing state transitions) must go in a cleanup context (`finally` in Motoko, `Drop` in Rust), not in regular callback code.

### Cycle drain attacks

Anyone on the internet can send update calls to your canister, and each call consumes cycles for Candid decoding and execution: even if the call is ultimately rejected by your code. An attacker can drain your cycles by flooding the canister with messages. Mitigations include using `canister_inspect_message` as a first-pass filter (cheap rejection before decoding), monitoring cycle balances, and setting a conservative freezing threshold.

See [DoS prevention](../guides/security/dos-prevention.md) for mitigation strategies.

### Unsafe upgrades

If `pre_upgrade` traps (for example, because serializing heap data exceeds the instruction limit), the canister becomes permanently non-upgradeable. This is an irreversible failure. In Rust, use `ic-stable-structures` for direct stable memory access. In Motoko, use `persistent actor` declarations that store variables automatically in stable memory.

See [Upgrade safety](../guides/security/canister-upgrades.md) for patterns that avoid this.

### Controller risk

Canister controllers can change the code, extract funds, or delete the canister at any time. If a single person or team controls a canister that holds user assets, users must trust that entity completely. For applications where this trust is unacceptable, control can be transferred to an [SNS](../guides/governance/launching.md) or the canister can be made immutable by removing all controllers.

Users can verify a canister's controllers through the IC dashboard or by querying the canister's information via a `read_state` request.

### Unverified builds

Users have no way to verify that a canister's running code matches its published source unless the developer provides reproducible builds. Without reproducibility, the source code could say one thing while the deployed Wasm does another. Developers building trust-sensitive applications should ensure their builds are reproducible so that anyone can verify the deployed code. See [Reproducible builds](../guides/canister-management/reproducible-builds.md) for how to set this up.

## What's next

- [Access management](../guides/security/identity-and-access-management.md): caller checks, guards, and role-based access control
- [Upgrade safety](../guides/security/canister-upgrades.md): safe upgrade patterns
- [Inter-canister call safety](../guides/security/inter-canister-calls.md): async pitfalls and mitigations
- [DoS prevention](../guides/security/dos-prevention.md): cycle drain protection
- [Data integrity](../guides/security/data-integrity-and-authenticity.md): input validation and storage safety
- [Response certification](../guides/frontends/certification.md): certified variables for query responses

<!-- Upstream: informed by dfinity/portal docs/building-apps/best-practices/trust-in-canisters.mdx, docs/building-apps/best-practices/general.mdx; icskills: canister-security -->
