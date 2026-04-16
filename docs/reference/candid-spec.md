---
title: "Candid Specification"
description: "The Candid interface description language: type system, binary encoding, subtyping rules, and language mappings"
sidebar:
  order: 11
---

Candid is the interface description language (IDL) for the Internet Computer. It provides a language-agnostic way to describe canister public APIs so that services written in Motoko, Rust, JavaScript, and other languages can interoperate without manual serialization code.

This page is a developer-oriented reference covering the type system, encoding format, subtyping rules, and the `didc` tool. For practical usage — writing `.did` files, generating bindings, calling canisters — see [Candid Interface](../guides/canister-calls/candid.md).

The normative specification lives in the [dfinity/candid](https://github.com/dfinity/candid) repository. This page summarizes the most important concepts and points to the right sections.

## Type system

Candid defines three categories of types: primitive, constructed, and reference.

### Primitive types

| Type | Description | Motoko | Rust | JavaScript |
|------|-------------|--------|------|------------|
| `bool` | Boolean: `true` or `false` | `Bool` | `bool` | `boolean` |
| `nat` | Unbounded natural number (LEB128-encoded) | `Nat` | `candid::Nat` or `u128` | `BigInt` |
| `int` | Unbounded integer (SLEB128-encoded) | `Int` | `candid::Int` or `i128` | `BigInt` |
| `nat8` / `nat16` / `nat32` / `nat64` | Fixed-width unsigned integers | `NatN` | `u8` / `u16` / `u32` / `u64` | `number` (8/16/32) or `BigInt` (64) |
| `int8` / `int16` / `int32` / `int64` | Fixed-width signed integers | `IntN` | `i8` / `i16` / `i32` / `i64` | `number` (8/16/32) or `BigInt` (64) |
| `float32` / `float64` | IEEE 754 floating-point | `Float` (64-bit only) | `f32` / `f64` | `number` |
| `text` | Unicode text string | `Text` | `String` or `&str` | `string` |
| `blob` | Arbitrary byte sequence (shorthand for `vec nat8`) | `Blob` | `Vec<u8>` or `&[u8]` | `Uint8Array` |
| `null` | The null value; subtype of all `opt t` types | `Null` | `()` | `null` |
| `reserved` | Supertype of all types; used to deprecate fields | `Any` | `candid::Reserved` | any value |
| `empty` | Subtype of all types; marks unreachable variants | `None` | `candid::Empty` | (no values) |
| `principal` | Identity of a canister or user | `Principal` | `candid::Principal` | `Principal` |

**Notes on special primitive types:**

`nat` is more space-efficient than `nat64` for small values because it uses variable-length LEB128 encoding. For values that typically stay small (counters, IDs in limited ranges), prefer `nat` or `nat32` over `nat64`.

`text` is distinct from `vec nat8`. The `text` type must be valid Unicode and bindings can map it directly to a native string type. Use `blob` or `vec nat8` for arbitrary binary data.

`null` is the idiomatic payload type for variant tags that carry no data:

```candid
type status = variant { active; suspended; deleted }
// equivalent to:
type status = variant { active : null; suspended : null; deleted : null }
```

`reserved` occupies a field ID in a record or parameter position so that future callers do not accidentally reuse it. Use it when deprecating an argument:

```candid
// Before
service : { foo : (first : text, middle : text, last : text) -> () }

// After — middle is deprecated but its position is reserved
service : { foo : (first : text, middle : reserved, last : text) -> () }
```

`empty` marks a variant tag or function result as unreachable:

```candid
service : { always_fails : () -> (empty) }
```

### Constructed types

#### `opt t`

An optional value of type `t`, or `null`. Wrapping a variant in `opt` enables forward-compatible evolution by letting old clients treat unknown new tags as `null`.

```candid
opt text               // optional text
opt opt nat            // doubly optional nat
```

`opt` plays a special role in subtyping (see [Subtyping rules](#subtyping-rules)). In Motoko, `opt t` maps to `?T`; in Rust, to `Option<T>`; in JavaScript, `null` maps to `[]` and `opt 8` maps to `[8]`.

#### `vec t`

A homogeneous sequence of zero or more values of type `t`.

```candid
vec nat8               // equivalent to blob
vec text               // list of strings
vec record { text; nat } // list of pairs
```

In Motoko, `vec t` maps to `[T]`; in Rust, to `Vec<T>` or `&[T]`. Rust also allows `BTreeSet`, `HashSet`, and — for `vec record { KeyType; ValueType }` — `BTreeMap` or `HashMap`.

#### `record { f : t; … }`

A heterogeneous collection of named fields. Field names are syntactic sugar for 32-bit numeric IDs derived by hashing the name:

```
hash(id) = (Sum_i utf8(id)[i] * 223^(k-i)) mod 2^32  where k = |utf8(id)| - 1
```

Field order in the type declaration is immaterial — fields are identified by their numeric ID, not position.

```candid
type address = record {
  street  : text;
  city    : text;
  zip     : nat;
  country : text;
};
```

If field labels are omitted, Candid assigns sequential IDs starting from 0:

```candid
record { text; text; opt bool }   // same as record { 0 : text; 1 : text; 2 : opt bool }
```

In Motoko, records map to Motoko record types (`{ first_name : Text; … }`), or to tuples when labels are sequential from 0. In Rust, records map to user-defined structs with `#[derive(CandidType, Deserialize)]`.

#### `variant { tag : t; … }`

A tagged union: a value is exactly one of the listed cases.

```candid
type result = variant {
  ok  : nat;
  err : text;
};

type color = variant { red; green; blue };  // tags with null payloads
```

Variant tags, like record fields, are hashed to numeric IDs. In Motoko, variants map to Motoko variant types. In Rust, to user-defined `enum` with `#[derive(CandidType, Deserialize)]`.

### Reference types

#### `func (…) -> (…)`

A first-class reference to a function with a given signature. Supports `query`, `composite_query`, and `oneway` annotations.

```candid
func () -> (nat) query                // read-only query
func (text) -> () oneway              // fire-and-forget
func (func (int) -> ()) -> ()         // higher-order: takes a callback
```

**Annotations:**
- `query` — the function does not modify state; can be called cheaply without consensus.
- `composite_query` — a `query` that can call other `query` or `composite_query` functions. Cannot be called from `query` or `update` functions, and cannot cross subnets; but can be called by external users (ingress messages).
- `oneway` — no response is returned; the result list must be empty.

Parameter and result names are purely documentary and have no semantic effect. Callers match by position, not by name.

In Motoko, `func (text) -> (text) query` maps to `shared query Text -> async Text`. In Rust, to `candid::IDLValue::Func(Principal, String)`. In JavaScript, to `[Principal.fromText("..."), "method_name"]`.

#### `service { name : functype; … }`

A first-class reference to a service (actor) with a declared interface. Enables passing service references as arguments.

```candid
type counter = service {
  inc  : () -> ();
  read : () -> (nat) query;
};
```

In Motoko, service types map directly to `actor` types. In JavaScript, service references are `Principal` values.

### Type definitions

Types can be named and are mutually recursive. Every cycle must be productive (go through a non-identifier type expression):

```candid
type list = opt record { head : nat; tail : list };  // valid: cycle through record

type A = B;
type B = A;  // error: vacuous cycle
```

### Imports

`.did` files can split definitions across files:

```candid
import "common_types.did";          // imports type definitions only
import service "service_a.did";     // imports types and merges service definition
```

The imported file's service methods must not duplicate method names in the importing file.

## Service description grammar

A complete Candid service description:

```
<prog>      ::= <def>* <actor>?
<def>       ::= type <id> = <datatype> | import service? <text>
<actor>     ::= service <id>? : (<tuptype> ->)? (<actortype> | <id>) ;?
<actortype> ::= { <methtype>;* }
<methtype>  ::= <name> : (<functype> | <id>)
<functype>  ::= <tuptype> -> <tuptype> <funcann>*
<funcann>   ::= oneway | query | composite_query
<tuptype>   ::= ( <argtype>,* )
<argtype>   ::= <datatype>                       // or <name> : <datatype> (shorthand; name has no semantic effect)
```

A service constructor (with `InitArgs`) is used for canisters that require initialization parameters:

```candid
type InitArgs = record { owner : principal; fee : nat };

service : (InitArgs) -> {
  transfer : (to : principal, amount : nat) -> (bool);
};
```

## Subtyping rules

Candid uses structural subtyping to validate safe interface evolution. A service is upgradable from type `T` to `T'` when `T'` is a subtype of `T` (written `T' <: T`).

**Direction matters:** Outbound data (return values) can be replaced with a *subtype* (more specific). Inbound data (arguments) can be replaced with a *supertype* (more general). This corresponds to covariance and contravariance.

### Primitive subtyping

Most primitive types are only subtypes of themselves. Exception: `nat <: int`.

The special types form the top and bottom of the lattice:

```
empty <: any type
any type <: reserved
```

### Option subtyping

Options are covariant in their content type:
```
t <: t'  =>  opt t <: opt t'
```

`null` and `reserved` are subtypes of any `opt t`:
```
null <: opt t
reserved <: opt t
```

A non-optional type `t` is a subtype of `opt t'` when `t` is not itself `null`, `opt …`, or `reserved`:
```
t <: t'  (where t is not null/opt/reserved)  =>  t <: opt t'
```

Additionally, for transitivity, if `t` and `t'` are incompatible option types, `opt t <: opt t'` still holds by yielding `null`. This rule exists to ensure upgrades remain valid across multiple steps without breaking clients that skipped intermediate versions.

### Record subtyping

Records are subtypes when fields are added or existing field types are specialized:

```
record { x : nat; y : opt text } <: record { x : nat }
// adding field y is valid; callers unaware of y treat it as null
```

Optional fields may be removed from inbound records (they decode as `null` for callers that still send them).

### Variant subtyping

Variants are subtypes when tags are removed or tag types are specialized:

```
variant { ok : nat } <: variant { ok : nat; err : text }
// fewer tags = subtype
```

To add tags to a variant in a backward-compatible way, wrap it in `opt`:

```candid
// Instead of:
service : { status : () -> (variant { active; expired }) }

// Use this to allow adding tags later:
service : { status : () -> (opt variant { active; expired }) }
```

Old clients receive `null` for tags they do not recognize.

### Function subtyping

Function types are contravariant in arguments and covariant in results:

- Arguments can be *generalized* (replaced with supertypes).
- Results can be *specialized* (replaced with subtypes).
- Argument list may be shortened; result list may be extended.
- Optional arguments may be appended.
- Function annotations (`query`, `composite_query`, `oneway`) must be the same set on both sides — changing a method's annotation (e.g., `query` → update) is never a valid subtype.

### Service subtyping

Services are subtypes when methods are added or existing method types are specialized (by the function subtyping rules above). This is the same as record subtyping over functions.

### Safe upgrade patterns

| Change | Safe? | Notes |
|--------|-------|-------|
| Add optional field to result record | Yes | Old callers ignore the field |
| Add optional field to argument record | Yes | Old callers send `null` for the field |
| Add new method | Yes | Old clients don't know it exists |
| Remove optional field from argument record | Yes | Old callers still send it; service ignores it |
| Remove a variant tag from results | Yes | Fewer tags is a subtype; callers depending on the removed tag will fail to match it |
| Add a new variant tag to results | Only safe if wrapped in `opt` | Old clients receive `null` for unrecognized tags when the variant is wrapped in `opt` |
| Change `nat` to `int` in a result | Yes | `nat <: int` |
| Change `int` to `nat` in a result | No | `int` is not a subtype of `nat` |
| Remove a non-optional field from results | No | Breaks clients that read the field |
| Change a method's result type incompatibly | No | Breaks clients |

## Binary encoding

All Candid values are serialized into a triple `(T, M, R)`:

- **T** (type section): byte sequence encoding the type of the values.
- **M** (memory section): byte sequence encoding the actual values.
- **R** (references): opaque system references (omitted if empty).

Every Candid message begins with the magic bytes `DIDL` (`0x4449444c`), followed by the type table and the encoded values.

Type opcodes use negative SLEB128-encoded values:

| Type | Opcode |
|------|--------|
| `null` | `0x7f` |
| `bool` | `0x7e` |
| `nat` | `0x7d` |
| `int` | `0x7c` |
| `nat8` | `0x7b` |
| `nat16` | `0x7a` |
| `nat32` | `0x79` |
| `nat64` | `0x78` |
| `int8` | `0x77` |
| `int16` | `0x76` |
| `int32` | `0x75` |
| `int64` | `0x74` |
| `float32` | `0x73` |
| `float64` | `0x72` |
| `text` | `0x71` |
| `reserved` | `0x70` |
| `empty` | `0x6f` |
| `opt` | `0x6e` |
| `vec` | `0x6d` |
| `record` | `0x6c` |
| `variant` | `0x6b` |
| `func` | `0x6a` |
| `service` | `0x69` |
| `principal` | `0x68` |

Numbers use LEB128 (unsigned) or SLEB128 (signed) encoding. `text` values use UTF-8. `bool` uses a single byte (`0x00` or `0x01`).

The binary format is self-describing: the type table is always included in the message, so a receiver can decode the value even without knowing the expected type in advance.

## Language type mappings

The table below summarizes idiomatic mappings for all Candid types across Motoko, Rust, and JavaScript. Detailed rules (including handling of reserved keywords, hash-based field names, and edge cases) are covered in the full specification.

| Candid | Motoko | Rust | JavaScript |
|--------|--------|------|------------|
| `bool` | `Bool` | `bool` | `boolean` |
| `nat` | `Nat` | `candid::Nat` or `u128` | `bigint` |
| `int` | `Int` | `candid::Int` or `i128` | `bigint` |
| `nat8`…`nat64` | `Nat8`…`Nat64` | `u8`…`u64` | `number` / `bigint` |
| `int8`…`int64` | `Int8`…`Int64` | `i8`…`i64` | `number` / `bigint` |
| `float32` | (no mapping) | `f32` | `number` |
| `float64` | `Float` | `f64` | `number` |
| `text` | `Text` | `String` | `string` |
| `blob` | `Blob` | `Vec<u8>` | `Uint8Array` |
| `null` | `Null` | `()` | `null` |
| `reserved` | `Any` | `candid::Reserved` | any |
| `empty` | `None` | `candid::Empty` | (no values) |
| `principal` | `Principal` | `candid::Principal` | `Principal` |
| `opt t` | `?T` | `Option<T>` | `[] \| [T]` |
| `vec t` | `[T]` | `Vec<T>` | `T[]` |
| `record { … }` | record type or tuple | `struct` with derive | object or array |
| `variant { … }` | variant type | `enum` with derive | `{ tag: value }` |
| `func …` | `shared` function type | `(Principal, String)` | `[Principal, string]` |
| `service { … }` | `actor` type | `Principal` | `Principal` |

**Motoko notes:**

- `float32` has no representation in Motoko. Candid interfaces using `float32` cannot be served from or called from Motoko.
- Record fields with reserved Motoko keywords get an underscore appended: `record { if : bool }` → `{ if_ : Bool }`.
- Numeric field IDs that have no human-readable preimage use the hash directly: `{ _11272781_ : Bool }`.
- Tuple records (consecutive IDs from 0) map to Motoko tuples: `record { text; nat }` → `(Text, Nat)`.

**Rust notes:**

- Use `#[serde(rename = "FieldName")]` to map Candid field names to differently-named Rust fields.
- `vec record { KeyType; ValueType }` can be deserialized into `BTreeMap` or `HashMap`.

## The `didc` tool

`didc` is the Candid command-line tool. Download prebuilt binaries from the [Candid releases page](https://github.com/dfinity/candid/releases).

### Common commands

**Check a `.did` file for syntax and type errors:**

```bash
didc check service.did
```

**Generate language bindings from a `.did` file:**

```bash
didc bind service.did -t js        # JavaScript
didc bind service.did -t ts        # TypeScript
didc bind service.did -t rs        # Rust
didc bind service.did -t rs-agent  # Rust agent-style bindings
didc bind service.did -t rs-stub   # Rust stub bindings
didc bind service.did -t mo        # Motoko
didc bind service.did -t did       # Candid (pretty-printed)
```

**Encode a Candid value to binary:**

```bash
didc encode '(42, vec {1;2;-3})'
# 4449444c016d7c027c002a0301027d
```

**Decode Candid binary:**

```bash
didc decode '4449444c016d7c027c002a0301027d'
# (42, vec { 1; 2; -3; })
```

**Check subtyping between two types:**

```bash
didc subtype nat int
# outputs nothing on success, error on failure
```

**Compute the hash of a field name:**

```bash
didc hash "first_name"
# 1224700491
```

**Encode arguments for a specific method:**

```bash
didc encode '("hello")' -d service.did -m greet
```

## Further reading

- [Candid Interface](../guides/canister-calls/candid.md) — practical guide to writing `.did` files and using Candid in canisters
- [IC Interface Specification](ic-interface-spec.md) — how Candid is used in the broader IC protocol
- [Candid Rust crate](https://docs.rs/candid/latest/candid/) — `candid` crate API reference
- Full specification: [dfinity/candid — spec/Candid.md](https://github.com/dfinity/candid/blob/master/spec/Candid.md)

## Next steps

- Write or review your canister's `.did` file using [Candid Interface](../guides/canister-calls/candid.md).
- Generate language bindings with `didc bind` or the icp-cli build pipeline.
- Verify safe upgrades using `didc subtype` before deploying a new interface version.

<!-- Upstream: informed by dfinity/candid — spec/Candid.md; dfinity/portal — docs/references/candid-ref.mdx, docs/building-apps/interact-with-canisters/candid/candid-concepts.mdx -->
