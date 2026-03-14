---
title: "Candid Interface"
description: "Define and use Candid interfaces for type-safe canister communication"
sidebar:
  order: 1
icskills: []
---

Candid is the interface description language for the Internet Computer. Every canister exposes its public API through a Candid `.did` file that describes which methods it offers, what arguments they accept, and what they return. Because Candid is language-agnostic, a Motoko canister, a Rust canister, and a JavaScript frontend can all communicate through the same interface without any manual serialization code.

Candid handles the binary encoding and decoding transparently. You work with native types in your language — `String` in Rust, `Text` in Motoko, `string` in JavaScript — and Candid maps them to a common type system for transport.

## The `.did` file

A Candid service description defines the public interface of a canister. Here is a minimal example:

```candid
service : {
  greet : (text) -> (text) query;
}
```

This declares a service with one method, `greet`, that takes a `text` argument, returns `text`, and can be called as a query (no consensus required). The `query` annotation tells the network this method only reads state — see [Canisters: Query calls](../../concepts/canisters.md#query-calls) for details.

A more complete example with multiple methods:

```candid
service counter : {
  inc : () -> ();
  read : () -> (nat) query;
  write : (nat) -> ();
}
```

### Named types

When multiple methods share the same complex type, define it once and reuse it:

```candid
type Address = record {
  street : text;
  city : text;
  zip_code : nat;
  country : text;
};

service address_book : {
  set_address : (name : text, addr : Address) -> ();
  get_address : (name : text) -> (opt Address) query;
}
```

Candid uses **structural typing** — two type definitions with different names but the same structure are interchangeable. The named alias is purely for readability.

### Init arguments

A service definition can require initialization arguments:

```candid
type InitArgs = record {
  admin : principal;
  token_name : text;
};

service : (InitArgs) -> {
  get_name : () -> (text) query;
}
```

These arguments must be supplied when the canister is first deployed. They configure the canister's initial state.

## Type system

Candid has a fixed set of types that map to native types in each supported language. The table below shows the most commonly used types:

| Candid type | Motoko | Rust | JavaScript |
|-------------|--------|------|------------|
| `bool` | `Bool` | `bool` | `boolean` |
| `nat` | `Nat` | `candid::Nat` or `u128` | `BigInt` |
| `int` | `Int` | `candid::Int` or `i128` | `BigInt` |
| `nat8` | `Nat8` | `u8` | `number` |
| `nat64` | `Nat64` | `u64` | `BigInt` |
| `int32` | `Int32` | `i32` | `number` |
| `float64` | `Float` | `f64` | `number` |
| `text` | `Text` | `String` | `string` |
| `blob` | `Blob` | `Vec<u8>` | `Uint8Array` |
| `null` | `Null` | `()` | `null` |
| `principal` | `Principal` | `candid::Principal` | `Principal` |
| `opt T` | `?T` | `Option<T>` | `[value] \| []` |
| `vec T` | `[T]` | `Vec<T>` | `Array` |
| `record { ... }` | `{ field : T; ... }` | `struct` (with `CandidType` derive) | `Object` |
| `variant { ... }` | `{ #tag : T; ... }` | `enum` (with `CandidType` derive) | `{ tag: value }` |

For the complete type reference, including subtyping rules, see the [Candid specification](../../reference/candid-spec.md).

## Generating `.did` files

### Motoko

The Motoko compiler generates Candid descriptions automatically from your actor's type signature. When you build with icp-cli, the `.did` file is placed in the build output directory. You do not need to write or maintain a `.did` file by hand for Motoko canisters.

### Rust

Rust canisters require a `.did` file, but you can generate it from your code instead of writing it manually. Add the `export_candid!` macro at the end of your `lib.rs`:

```rust
use ic_cdk::query;
use ic_cdk::update;

#[query]
fn hello(name: String) -> String {
    format!("Hello, {}!", name)
}

#[update]
fn world(name: String) -> String {
    format!("World, {}!", name)
}

// Enable Candid export
ic_cdk::export_candid!();
```

Then extract the Candid interface using `candid-extractor`:

```bash
# Install the extractor (one-time)
cargo install candid-extractor

# Build to Wasm
cargo build --release --target wasm32-unknown-unknown --package my_canister

# Extract the .did file
candid-extractor target/wasm32-unknown-unknown/release/my_canister.wasm > my_canister.did
```

Alternatively, the [`generate-did`](https://crates.io/crates/generate-did) tool combines the build and extraction into a single command:

```bash
cargo install generate-did
generate-did my_canister
```

Reference the generated `.did` file in your `icp.yaml`:

```yaml
canisters:
  - name: my_canister
    recipe:
      type: "@dfinity/rust@v3.2.0"
      configuration:
        package: my_canister
        candid: src/my_canister/my_canister.did
```

## Type mapping in practice

### Records

Candid records map to structs in Rust and object-like types in Motoko:

**Candid:**

```candid
type UserProfile = record {
  name : text;
  age : nat32;
  email : opt text;
};
```

**Motoko:**

```motoko no-repl
type UserProfile = {
  name : Text;
  age : Nat32;
  email : ?Text;
};
```

**Rust:**

```rust
use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
struct UserProfile {
    name: String,
    age: u32,
    email: Option<String>,
}
```

### Variants

Candid variants model enumerations or tagged unions:

**Candid:**

```candid
type Result = variant {
  ok : text;
  err : text;
};
```

**Motoko:**

```motoko no-repl
type Result = {
  #ok : Text;
  #err : Text;
};
```

**Rust:**

```rust
use candid::CandidType;
use serde::Deserialize;

#[derive(CandidType, Deserialize)]
enum MyResult {
    #[serde(rename = "ok")]
    Ok(String),
    #[serde(rename = "err")]
    Err(String),
}
```

## Interacting with canister interfaces

### From the command line

Use `icp canister call` to invoke methods using Candid textual syntax:

```bash
# Call a query method
icp canister call my_canister greet '("World")'

# Call an update method with a record argument
icp canister call my_canister set_address '("Alice", record { street = "123 Main St"; city = "Zurich"; zip_code = 8000; country = "CH" })'
```

### From JavaScript

The [JS SDK](https://js.icp.build) translates Candid types into native JavaScript values. A canister's generated declarations export a `createActor` function and an `idlFactory` that describes the interface:

```javascript
import { createActor } from "./declarations/my_canister";

const canister = createActor(canisterId, { agentOptions: { host } });

// Call a method — arguments and return values are native JS types
const greeting = await canister.greet("World");
console.log(greeting); // "Hello, World!"
```

The `idlFactory` is generated from the `.did` file during the build process. You can also generate JavaScript bindings manually using the `didc` CLI:

```bash
didc bind my_canister.did -t js
```

### From another canister

When one canister calls another, Candid handles the argument encoding and response decoding transparently. See [Onchain calls](onchain-calls.md) for how to make inter-canister calls in Motoko and Rust.

## Safe interface upgrades

Candid defines subtyping rules that let you evolve a service's interface without breaking existing clients. The safe changes are:

- **Add new methods.** Existing clients simply don't call them.
- **Add return values.** Extend the result sequence — old clients ignore the extra values.
- **Remove trailing parameters.** Shorten the parameter list — old clients still send the extra arguments, which are silently ignored.
- **Add optional parameters.** Extend the parameter list with `opt` types — old clients that don't send them get `null` by default.
- **Widen parameter types.** Change a parameter to a supertype of its previous type (for example, `nat` to `int`).
- **Narrow return types.** Change a result to a subtype of its previous type (for example, `int` to `nat`).

### Example upgrade

This initial interface:

```candid
service counter : {
  add : (nat) -> ();
  subtract : (nat) -> ();
  get : () -> (int) query;
}
```

Can safely evolve to:

```candid
type Timestamp = nat;

service counter : {
  set : (nat) -> ();
  add : (int) -> (new_val : nat);
  subtract : (nat, trap_on_underflow : opt bool) -> (new_val : nat);
  get : () -> (nat, last_change : Timestamp) query;
}
```

This upgrade is safe because:

- `set` is a new method (safe to add).
- `add` widens its parameter from `nat` to `int` (supertype) and adds a return value (safe to extend).
- `subtract` adds an optional parameter (safe with `opt`).
- `get` narrows its return type from `int` to `nat` (subtype) and adds a second return value.

### Deprecating fields

To deprecate a record field without breaking existing clients, change its type to `opt empty` or `reserved`:

```candid
type UserProfile = record {
  name : text;
  middle_name : reserved;  // Deprecated — ignored by current code
  email : text;
};
```

Using `reserved` prevents future developers from accidentally reusing the field's hash for a different purpose.

## Candid tools

**`didc`** — the Candid CLI for checking `.did` files, generating language bindings, encoding/decoding values, and testing subtype compatibility. Download from the [Candid releases page](https://github.com/dfinity/candid/releases).

| Command | What it does |
|---------|-------------|
| `didc check service.did` | Validate a `.did` file |
| `didc bind service.did -t js` | Generate JavaScript bindings |
| `didc bind service.did -t rs` | Generate Rust bindings |
| `didc encode '(42, "hello")'` | Encode a Candid value to hex |
| `didc decode <hex>` | Decode binary Candid back to text |
| `didc subtype new.did old.did` | Check that `new` is a safe upgrade from `old` |

**Candid UI** — a web interface for calling canister methods directly from a browser, generated automatically for every deployed canister. Useful for testing and debugging without writing frontend code. Access it at `https://a4gq6-oaaaa-aaaab-qaa4q-cai.icp0.io/?id=<canister-id>` for mainnet canisters.

## Next steps

- [Onchain calls](onchain-calls.md) — make inter-canister calls using Candid interfaces
- [Offchain calls](offchain-calls.md) — call canisters from JavaScript frontends and agents
- [Binding generation](binding-generation.md) — auto-generate typed clients from `.did` files
- [Candid specification](../../reference/candid-spec.md) — full type reference and subtyping rules

<!-- Upstream: informed by dfinity/portal docs/building-apps/interact-with-canisters/candid/ (3 files) and docs/building-apps/developer-tools/cdks/rust/generating-candid.mdx -->
