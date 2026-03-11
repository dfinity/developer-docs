---
title: "Candid Specification"
description: "Candid interface description language for the Internet Computer"
sidebar:
  order: 3
doc_type: reference
level: intermediate
last_verified: 2026-03-10
---

Candid is the interface description language (IDL) used on the Internet Computer. Every canister exposes its API through a Candid interface, enabling type-safe communication between canisters written in different languages and between canisters and external clients.

## Type system

Candid provides a rich type system that maps to types in Motoko, Rust, JavaScript, and other languages.

### Primitive types

| Candid type | Description | Motoko | Rust |
|-------------|-------------|--------|------|
| `nat` | Unbounded natural number | `Nat` | `candid::Nat` |
| `int` | Unbounded integer | `Int` | `candid::Int` |
| `nat8`..`nat64` | Fixed-width unsigned | `Nat8`..`Nat64` | `u8`..`u64` |
| `int8`..`int64` | Fixed-width signed | `Int8`..`Int64` | `i8`..`i64` |
| `float32`, `float64` | IEEE 754 floats | `Float` | `f32`, `f64` |
| `bool` | Boolean | `Bool` | `bool` |
| `text` | UTF-8 string | `Text` | `String` |
| `blob` | Byte sequence | `Blob` | `Vec<u8>` |
| `null` | Null value | `Null` | `()` |
| `principal` | IC principal | `Principal` | `candid::Principal` |

### Compound types

| Candid type | Description | Example |
|-------------|-------------|---------|
| `opt T` | Optional value | `opt nat` |
| `vec T` | Sequence | `vec text` |
| `record { ... }` | Named fields | `record { name: text; age: nat }` |
| `variant { ... }` | Tagged union | `variant { ok: nat; err: text }` |

### Service types

```candid
service : {
  greet : (text) -> (text) query;
  set_greeting : (text) -> ();
}
```

Method annotations:
- `query` — read-only, no consensus needed, fast
- `oneway` — fire-and-forget, no response
- (none) — update call, goes through consensus

## Subtyping and safe upgrades

Candid's subtyping rules ensure backward-compatible canister upgrades:

- **Adding** optional fields to records is safe
- **Removing** fields from records is safe (old clients just ignore them)
- **Widening** return types is safe (e.g., `nat8` to `nat`)
- **Narrowing** parameter types is safe

## .did files

Every canister should include a `.did` file describing its interface. This file is used by:

- `icp canister call` for argument encoding
- Client libraries for type-safe bindings
- The Candid UI for interactive testing
- Other canisters for inter-canister calls

## Tools

- **didc** — Candid CLI for checking, subtype testing, and binding generation
- **Candid UI** — Web-based tool for interacting with any canister by its Candid interface. Access at `https://a4gq6-oaaaa-aaaab-qaa4q-cai.raw.icp0.io`

## Canonical source

The full Candid specification is maintained at [github.com/dfinity/candid](https://github.com/dfinity/candid/blob/master/spec/Candid.md). It covers the binary encoding format, the complete subtyping algorithm, and advanced features like type imports and recursive types.

## Related pages

- [Inter-Canister Calls: Candid](/guides/inter-canister/candid/) — Using Candid in practice
- [IC Interface Specification](/reference/ic-interface-spec/) — How Candid is used in the IC protocol
