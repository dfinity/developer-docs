---
title: "Principals"
description: "What principals are on ICP: the identity model, principal classes, canister control, and how authentication works"
---

A **principal** is any entity that can authenticate with the Internet Computer and be identified when calling a canister. Principals are the building block of identity and access control on ICP: canisters use them to identify callers, enforce permissions, and determine which entities have control over which resources.

## Principal classes

There are four classes of principals on ICP:

**1. Management canister principal (`aaaaa-aa`):** The IC management canister is a virtual system API that canisters call to perform operations like creating other canisters or changing settings. It does not run at a real canister address; it uses the fixed principal `aaaaa-aa`. Canisters call it with `ic_cdk::management_canister::*` (Rust) or via actor references in Motoko.

**2. Canister IDs:** Each canister on ICP has a unique principal derived when the canister is created. Canister principals look like `ryjl3-tyaaa-aaaaa-aaaba-cai`. When a canister makes a call to another canister, the callee sees the calling canister's canister ID as the caller principal.

**3. Self-authenticating IDs:** User identities are derived from public keys using a domain-separated hash. Anyone holding the corresponding private key can authenticate and call canisters under that principal. Self-authenticating principals look like `o2ivq-5dsbb-hhfso-w2o5v-7qiaq-g4fbm-6qhhb-xbj6w-szpxa-lflfa-mae` for Ed25519 keys or similar for ECDSA keys. The [Internet Identity](https://identity.ic0.app/) service manages key-backed identities for end users.

**4. Anonymous principal (`2vxsx-fae`):** Messages that are not signed use the anonymous principal as their caller identity. Any canister can check whether a caller is anonymous and decide how to handle unsigned requests (for example, allowing public reads but rejecting state changes from anonymous callers).

A fifth class, **derived IDs**, was reserved in the specification but has never been implemented.

## How principals are used in practice

When a user calls a canister, the Internet Computer authenticates the user's signature and passes the corresponding principal as the `caller` to the canister's message handler. Canisters can then make authorization decisions based on the caller:

```
Caller is user → self-authenticating principal (derived from their public key)
Caller is another canister → that canister's canister ID
Unsigned request → 2vxsx-fae (anonymous principal)
```

This means that from a canister's perspective, all callers are principals. There is no separate "user object" or session token: the principal is the identity.

## Canister control

Canisters are managed by their **controllers**: a list of principals (users, other canisters, or DAOs) that have permission to perform management operations on the canister. Controllers can:

- Upgrade the canister's Wasm module.
- Change canister settings (compute allocation, memory allocation, freezing threshold).
- Start or stop the canister.
- Delete the canister and claim its remaining cycles.
- Add or remove other controllers.

The control structure can take several forms:

| Control structure | Who is the controller | Effect |
|---|---|---|
| Centralized | A single developer's principal | Full developer control; standard for development |
| Multi-signature | A multi-signer wallet like [Orbit](https://orbitwallet.io/) | Requires multiple keys to approve changes |
| DAO-governed | An SNS governance canister | Upgrades require a governance proposal |
| No controller | Empty controller list | Immutable canister; code can never be changed |

When a canister has no controllers, it is **immutable**: no one can modify its code or settings. Users who want to trust that a canister's behavior will never change can verify this on the [ICP Dashboard](https://dashboard.internetcomputer.org).

## Canister upgrades and stable memory

When a controller upgrades a canister, the new Wasm module replaces the old one. By default, Wasm heap memory is cleared on upgrade because the new module may have a different memory layout. However, **stable memory is always preserved** across upgrades: it is explicitly managed by the canister (via system API calls) and designed to survive code changes.

The runtime runs upgrade hooks atomically around the code swap:
1. `pre_upgrade` (or `system func preupgrade` in Motoko): save any heap data to stable memory.
2. New Wasm module is installed.
3. `post_upgrade` (or `system func postupgrade`): read data back from stable memory into the new heap layout.

If the `pre_upgrade` hook traps, the upgrade is aborted and the canister continues running the old code. If `post_upgrade` traps, the new code is installed but the canister is left in a failed state.

## Next steps

- [Canisters](canisters.md): how canisters work, lifecycle, and message types
- [Authentication](../guides/authentication/internet-identity.md): integrating Internet Identity and other authentication providers
- [IC Interface Specification: Principals](../references/ic-interface-spec/index.md#principal): the formal specification

<!-- Upstream: informed by Learn Hub articles "What is a Principal?", "Canister Control" (migrated, source retired) -->
