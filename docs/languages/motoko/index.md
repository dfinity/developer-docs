---
title: "Motoko"
description: "A language designed for the Internet Computer with built-in actor model and orthogonal persistence"
sidebar:
  order: 1
icskills: []
---

Motoko is a high-level programming language designed specifically for building canisters on the Internet Computer. It combines a familiar syntax (drawing from JavaScript, Rust, Swift, and Java) with features that map directly to how ICP works: an actor-based programming model, orthogonal persistence, async/await for inter-canister messaging, and compilation to WebAssembly.

If you want a language where ICP concepts are first-class citizens rather than library abstractions, Motoko is a strong choice.

## Key features

**Actor model.** Every Motoko canister is an actor — an isolated unit of state and behavior that communicates with other actors through asynchronous messages. This maps directly to how canisters work on ICP: each canister has private state and a public interface.

**Orthogonal persistence.** Variables declared in a `persistent actor` survive canister upgrades automatically. There is no database layer, no serialization code, and no pre/post-upgrade hooks needed for most use cases. See [Orthogonal persistence](../../concepts/orthogonal-persistence.md) for how this works at the platform level.

**Async/await messaging.** Inter-canister calls use `async`/`await`, making sequential message flows read like synchronous code. The compiler and runtime handle the underlying callback mechanics.

**Strong typing.** Motoko has a sound type system with generics, variant types, pattern matching, and option types (`?T`) that prevent null-pointer errors at compile time.

**WebAssembly compilation.** Motoko compiles to Wasm, the execution format for all ICP canisters. The compiler handles ICP-specific concerns (Candid serialization, system API bindings, memory management) so you don't have to.

## Quick example

A minimal Motoko canister with a query method and an update method:

```motoko
persistent actor Counter {
  var count : Nat = 0;

  public query func get() : async Nat {
    return count;
  };

  public func increment() : async () {
    count += 1;
  };
};
```

The `persistent actor` declaration means `count` survives canister upgrades. The `query` keyword marks `get` as a fast, read-only call. The `increment` function is an update call that modifies state and goes through consensus.

## Getting started

Create a new Motoko project with icp-cli:

```bash
icp project new my-project --template motoko
```

This generates a project with an `icp.yaml` build configuration and a Motoko source file. The build configuration uses the Motoko recipe:

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/motoko@<version>"
      configuration:
        main: src/main.mo
        shrink: true
```

Build and deploy locally:

```bash
icp build
icp deploy --local
```

For a guided walkthrough, see the [Quickstart](../../getting-started/quickstart.md).

## Standard library: `core`

The **`core`** package ([mops.one/core](https://mops.one/core)) is the standard library for Motoko. It supersedes the older `base` library with a cleaner API, consistent naming conventions, and data structures that work directly with stable memory.

Add it to your project's `mops.toml`:

```toml
[dependencies]
core = "0.0.0" # Check the latest version at https://mops.one/core
```

Then import modules:

```motoko
import Map "mo:core/Map";
import Text "mo:core/Text";
import List "mo:core/List";
```

Key improvements in `core` over `base`:

- All data structures can be stored in stable memory without pre/post-upgrade hooks
- Clear separation between mutable (`Map`, `Set`, `List`) and immutable (`pure/Map`, `pure/Set`, `pure/List`) data structures
- Hash-based collections removed in favor of ordered maps and sets (better security against collision attacks)
- Consistent naming: `values()` instead of `vals()`, `flatMap()` instead of `chain()`

If you have an existing project using `base`, you can migrate incrementally — both libraries can coexist in the same project. See the [base to core migration guide](https://mops.one/core/docs/migration) for detailed instructions.

## Package management with Mops

[Mops](https://mops.one) is the package manager for Motoko. It handles dependency resolution, compiler toolchain management, and publishing.

```bash
mops add core          # Add the core standard library
mops install           # Install all dependencies
```

Browse community packages at [mops.one](https://mops.one).

## Documentation sections

The Motoko documentation is organized into three sections that will be available here as they are synced from the upstream [Motoko repository](https://github.com/caffeinelabs/motoko):

**Fundamentals** covers language basics: syntax, types, declarations, control flow, actors, async messaging, modules and imports, data persistence, pattern matching, and error handling. Start here if you are new to Motoko.

**ICP Features** covers Motoko APIs for ICP-specific capabilities: randomness, timers, caller identification, Candid serialization, stable memory regions, and system functions.

**Reference** includes error codes, the language grammar, and the changelog.

In the meantime, the full Motoko documentation is available at the [Motoko documentation site](https://docs.motoko.org).

## Related pages

- [Quickstart](../../getting-started/quickstart.md) — Create and deploy your first Motoko canister
- [Data persistence](../../guides/backends/data-persistence.md) — Persistence patterns for Motoko and Rust canisters
- [Orthogonal persistence](../../concepts/orthogonal-persistence.md) — How ICP preserves canister state across upgrades
- [Rust](../rust/index.md) — Alternative language for ICP development using the Rust CDK

## External resources

- [Motoko documentation](https://docs.motoko.org) — Full language documentation
- [core library API docs](https://mops.one/core/docs) — Standard library reference
- [Mops package registry](https://mops.one) — Community packages for Motoko
- [Motoko GitHub](https://github.com/caffeinelabs/motoko) — Compiler source and issue tracker

<!-- Upstream: hand-written -->
