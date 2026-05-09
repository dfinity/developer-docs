---
title: "Principals"
description: "What principals are on ICP: the five principal classes and how caller identity works in practice"
---

A **principal** is any entity that can authenticate with the Internet Computer and be identified when calling a canister. Principals are the building block of identity and access control on ICP: canisters use them to identify callers, enforce permissions, and determine which entities have control over which resources.

## Principal classes

ICP defines five principal classes, though one (derived IDs) has never been implemented:

**1. Management canister principal (`aaaaa-aa`):** The IC management canister is a virtual system API that canisters call to perform operations like creating other canisters or changing settings. It does not run at a real canister address; it uses the fixed principal `aaaaa-aa`. Canisters call it with `ic_cdk::management_canister::*` (Rust) or via actor references in Motoko.

**2. Canister IDs:** Each canister on ICP has a unique principal derived when the canister is created. Canister principals look like `ryjl3-tyaaa-aaaaa-aaaba-cai`. When a canister makes a call to another canister, the callee sees the calling canister's canister ID as the caller principal.

**3. Self-authenticating IDs:** User identities are derived from public keys using a domain-separated hash. Anyone holding the corresponding private key can authenticate and call canisters under that principal. Self-authenticating principals look like `o2ivq-5dsbb-hhfso-w2o5v-7qiaq-g4fbm-6qhhb-xbj6w-szpxa-lflfa-mae` for Ed25519 keys or similar for ECDSA keys. The [Internet Identity](https://identity.ic0.app/) service manages key-backed identities for end users.

**4. Anonymous principal (`2vxsx-fae`):** Messages that are not signed use the anonymous principal as their caller identity. Any canister can check whether a caller is anonymous and decide how to handle unsigned requests (for example, allowing public reads but rejecting state changes from anonymous callers).

**5. Derived IDs:** Reserved in the specification but never implemented.

## How principals are used in practice

When a user calls a canister, the Internet Computer authenticates the user's signature and passes the corresponding principal as the `caller` to the canister's message handler. Canisters can then make authorization decisions based on the caller:

```
Caller is user → self-authenticating principal (derived from their public key)
Caller is another canister → that canister's canister ID
Unsigned request → 2vxsx-fae (anonymous principal)
```

This means that from a canister's perspective, all callers are principals. There is no separate "user object" or session token: the principal is the identity.

## Next steps

- [Canisters](canisters.md): how canisters work, controllers, lifecycle, and message types
- [Authentication](../guides/authentication/internet-identity.md): integrating Internet Identity and other authentication providers
- [IC Interface Specification: Principals](../references/ic-interface-spec/index.md#principal): the formal specification

<!-- Upstream: informed by Learn Hub article "What is a Principal?" (migrated, source retired) -->
