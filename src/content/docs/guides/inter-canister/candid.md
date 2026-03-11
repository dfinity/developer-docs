---
title: "Candid"
description: "Define canister interfaces using the Candid interface description language."
sidebar:
  order: 2
doc_type: how-to
level: intermediate
features: []
icskills: []
last_verified: 2026-03-10
---

Candid is the interface description language (IDL) for ICP. It defines the public API of a canister in a language-agnostic way, enabling interoperability between canisters written in different languages and between canisters and frontend code.

## Service definitions

A Candid `.did` file describes a canister's public interface. Each method specifies its argument types, return types, and optional annotations:

```candid
service : {
  get : () -> (nat) query;
  set : (nat) -> ();
  increment : () -> (nat);
}
```

- `query` annotation marks read-only methods that skip consensus.
- `composite_query` marks composite query methods.
- Methods without annotations are update calls.

## Candid types

Candid has a rich type system. Here are the most commonly used types:

| Candid type | Motoko | Rust | Description |
|-------------|--------|------|-------------|
| `nat` | `Nat` | `u128` or `candid::Nat` | Unbounded natural number |
| `int` | `Int` | `i128` or `candid::Int` | Unbounded integer |
| `nat64` | `Nat64` | `u64` | 64-bit natural |
| `text` | `Text` | `String` | UTF-8 string |
| `bool` | `Bool` | `bool` | Boolean |
| `blob` | `Blob` | `Vec<u8>` | Binary data |
| `principal` | `Principal` | `candid::Principal` | Identity |
| `opt T` | `?T` | `Option<T>` | Optional value |
| `vec T` | `[T]` | `Vec<T>` | Variable-length array |
| `record {...}` | Object | Struct | Named fields |
| `variant {...}` | Variant | Enum | Tagged union |

## Writing .did files

### Manual definition

For Rust canisters and other languages, write the `.did` file manually:

```candid
type Account = record {
  owner : principal;
  subaccount : opt blob;
};

type TransferArgs = record {
  to : Account;
  amount : nat;
  memo : opt blob;
};

type TransferResult = variant {
  Ok : nat;
  Err : TransferError;
};

type TransferError = variant {
  InsufficientFunds : record { balance : nat };
  InvalidAccount;
};

service : {
  transfer : (TransferArgs) -> (TransferResult);
  balance_of : (Account) -> (nat) query;
}
```

### Auto-generated from Motoko

The Motoko compiler automatically generates a `.did` file from your actor definition. After building, find it at `.icp/local/canisters/<name>/<name>.did`. Do not edit auto-generated files -- they are overwritten on each build.

### Auto-generated from Rust

For Rust canisters using `ic-cdk` 0.11.0+, the Candid extractor tool can generate `.did` files from your code annotations.

## Service init arguments

A service can require initialization arguments:

```candid
type InitArgs = record {
  admin : principal;
  name : text;
};

service : (InitArgs) -> {
  get_name : () -> (text) query;
}
```

Pass init args when installing the canister:

```bash
icp canister install my_canister --argument '(record { admin = principal "..."; name = "My Service" })'
```

## Type reuse

Name complex types and reuse them across methods:

```candid
type Address = record {
  street : text;
  city : text;
  zip : nat;
};

service : {
  set_address : (text, Address) -> ();
  get_address : (text) -> (opt Address) query;
}
```

Type names are structural aliases -- two types with the same structure are interchangeable regardless of their names.

## Service evolution

Candid supports safe interface evolution. You can:

- **Add new methods** without breaking existing clients.
- **Add return values** to existing methods (old clients ignore extras).
- **Add optional parameters** (`opt T`) to existing methods (old clients send `null`).
- **Remove parameters** from the end of argument lists (old clients' extra args are ignored).

These rules ensure backward compatibility as your canister evolves.

## Deprecating fields

Mark a field as unused with `opt empty`, or use `reserved` to prevent reuse:

```candid
type User = record {
  name : text;
  legacy_field : reserved;  // prevents accidental reuse
  email : text;
};
```

## Interacting with Candid

### From the CLI

```bash
# Call with Candid arguments
icp canister call my_canister transfer '(record { to = record { owner = principal "..."; subaccount = null }; amount = 1000; memo = null })'

# Read a canister's Candid interface
icp canister metadata my_canister candid:service
```

### From the Candid UI

After deploying a canister, access the Candid UI at:

```
http://127.0.0.1:4943/?canisterId=<candid-ui-id>&id=<your-canister-id>  # local
https://a4gq6-oaaaa-aaaab-qaa4q-cai.icp0.io/?id=<your-canister-id>      # mainnet
```

The Candid UI reads the canister's interface and generates a web form for calling each method.

### Making Candid metadata private

By default, the `candid:service` metadata is public. To restrict it to controllers:

```json
{
  "canisters": {
    "my_canister": {
      "metadata": [
        {
          "name": "candid:service",
          "visibility": "private"
        }
      ]
    }
  }
}
```

## Next steps

- [Inter-canister calls](/guides/inter-canister/calls/) -- call methods across canisters
- [Candid reference](https://internetcomputer.org/docs/references/candid-ref) -- full type reference
- [Candid specification](https://github.com/dfinity/candid/blob/master/spec/Candid.md) -- formal spec
