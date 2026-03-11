---
title: "Motoko Overview"
description: "Motoko programming language overview for Internet Computer development"
sidebar:
  order: 1
  label: "Overview"
doc_type: explanation
level: beginner
source_repo: https://github.com/caffeinelabs/motoko
source_ref: null
last_verified: 2026-03-10
---

Motoko is a programming language designed specifically for building canisters on ICP. It integrates natively with ICP's features -- actors, async messaging, orthogonal persistence, and Candid -- so you can focus on application logic rather than platform plumbing.

> Detailed language documentation is synced from the [Motoko repository](https://github.com/caffeinelabs/motoko). This page provides a high-level overview.

## Why Motoko?

- **Purpose-built for ICP** -- Motoko's type system and runtime map directly to ICP's execution model.
- **Orthogonal persistence** -- Canister state is automatically persisted across upgrades. No manual serialization or stable memory management required.
- **Actor model** -- Each canister is an actor with isolated state and asynchronous message passing.
- **Type safety** -- A strong static type system catches errors at compile time, including Candid interface mismatches.
- **Async/await** -- Inter-canister calls use familiar async/await syntax.
- **Garbage collection** -- Automatic memory management simplifies development.

## Key language features

### Actors

Every Motoko canister is an actor. Public functions become the canister's API:

```motoko
actor Counter {
  var count : Nat = 0;

  public func increment() : async Nat {
    count += 1;
    count;
  };

  public query func get() : async Nat {
    count;
  };
};
```

### Stable variables

Variables marked `stable` survive canister upgrades:

```motoko
actor {
  stable var totalUsers : Nat = 0;
};
```

With enhanced orthogonal persistence (the default in recent Motoko versions), all variables persist automatically without the `stable` keyword.

### Async/await

Inter-canister calls use `async`/`await`:

```motoko
let result = await OtherCanister.someMethod(arg);
```

### Pattern matching

```motoko
switch (optionalValue) {
  case (?value) { /* handle value */ };
  case null { /* handle null */ };
};
```

### Candid integration

Motoko types map directly to Candid types. The compiler generates `.did` files automatically from your actor's public interface.

## Standard libraries

- **[Base library](https://mops.one/base)** -- Core data structures and utilities (Array, HashMap, Text, Nat, etc.). This is the original standard library.
- **[Core library](https://mops.one/core)** -- The next-generation standard library with improved APIs and performance.

Use [Mops](https://mops.one/) to manage Motoko packages:

```bash
mops add base
```

## Getting started

Create a new Motoko project:

```bash
icp new my-project --subfolder motoko
cd my-project
icp network start -d
icp deploy
```

## When to choose Motoko vs Rust

| Factor | Motoko | Rust |
|--------|--------|------|
| Learning curve | Lower -- purpose-built, simpler syntax | Steeper -- general-purpose, ownership model |
| Persistence | Orthogonal persistence built in | Manual stable memory management |
| Ecosystem | ICP-specific packages on Mops | Large general-purpose ecosystem on crates.io |
| Performance | Good for most use cases | Better for compute-intensive workloads |
| Wasm size | Smaller modules | Larger modules (mitigated with ic-wasm) |

Choose Motoko when productivity and simplicity matter most. Choose Rust when you need maximum performance, existing Rust libraries, or fine-grained memory control.

## Further reading

- [Base library reference](https://mops.one/base)
- [Core library reference](https://mops.one/core)
- [Mops package manager](https://mops.one/)
- [Motoko GitHub repository](https://github.com/caffeinelabs/motoko)
- [Rust CDK overview](/languages/rust/)
