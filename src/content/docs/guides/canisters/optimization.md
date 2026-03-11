---
title: "Canister Optimization"
description: "Optimize Wasm binary size and cycle efficiency for canisters."
sidebar:
  order: 4
doc_type: how-to
level: intermediate
features: []
icskills: []
last_verified: 2026-03-10
---

Optimizing your canister reduces cycle costs and speeds up deployments. The two main targets are Wasm binary size and instruction count per call.

## Using wasm-opt

The `wasm-opt` optimizer can be enabled directly in your project configuration:

```json
{
  "canisters": {
    "my_canister": {
      "optimize": "cycles"
    }
  }
}
```

### Optimization levels

**For cycle usage** (recommended default):

| Level | Notes |
|-------|-------|
| `O4` | Most aggressive |
| `O3` | Equivalent to `"cycles"` |
| `O2` | Moderate |
| `O1` | Light |
| `O0` | No optimization |

Expected improvement: ~7% fewer cycles for Rust, ~10% for Motoko.

**For binary size:**

| Level | Notes |
|-------|-------|
| `Oz` | Equivalent to `"size"` |
| `Os` | Moderate size reduction |

Expected improvement: ~16% smaller binaries.

> In rare cases, aggressive optimization can increase function complexity beyond the replica's limits. If you encounter this, use a less aggressive level.

## Using ic-wasm

The [`ic-wasm`](https://github.com/dfinity/ic-wasm) tool provides ICP-specific Wasm transformations:

```bash
# Shrink the binary by stripping unused data
ic-wasm my_canister.wasm -o my_canister_opt.wasm shrink

# Add metadata
ic-wasm my_canister.wasm -o my_canister_opt.wasm metadata candid:service -f my_canister.did -v public
```

Key operations:

- **shrink** -- remove unused functions, custom sections, and debug info
- **metadata** -- add or update ICP metadata sections
- **optimize** -- run wasm-opt passes on the binary

Use `--keep-name-section` if you need to preserve Wasm function names for debugging.

## Profiling cycle consumption

Before optimizing, measure where cycles are spent. Use `instruction_counter` to profile individual endpoints:

### Rust

```rust
#[ic_cdk::update]
fn expensive_operation() -> u64 {
    let start = ic_cdk::api::instruction_counter();
    // ... your logic ...
    let end = ic_cdk::api::instruction_counter();
    let instructions_used = end - start;
    ic_cdk::println!("Instructions used: {}", instructions_used);
    instructions_used
}
```

Note that `instruction_counter` resets at `await` points, so measure synchronous sections separately.

### Motoko

```motoko
import Prim "mo:prim";
import Debug "mo:base/Debug";

actor {
  public func expensiveOperation() : async () {
    let start = Prim.performanceCounter(0);
    // ... your logic ...
    let end = Prim.performanceCounter(0);
    Debug.print("Instructions used: " # debug_show(end - start));
  };
}
```

## Rust-specific optimizations

Add these settings to your `Cargo.toml` for smaller release builds:

```toml
[profile.release]
opt-level = 'z'       # Optimize for size
lto = true             # Link-time optimization
codegen-units = 1      # Single codegen unit for better optimization
strip = true           # Strip debug symbols
```

## Motoko-specific optimizations

The Motoko compiler produces reasonably efficient code by default. The main optimization lever is `wasm-opt` as described above. Motoko's garbage collector choice also affects performance:

- **Copying GC** (default) -- good for most workloads
- **Compacting GC** -- better memory utilization for long-running canisters
- **Generational GC** -- best for workloads with many short-lived allocations

## General tips

- **Minimize stable memory serialization.** Use `ic-stable-structures` (Rust) or `stable` variables (Motoko) to avoid expensive `pre_upgrade`/`post_upgrade` serialization.
- **Batch operations.** Combine multiple small writes into fewer larger ones to reduce per-call overhead.
- **Use queries where possible.** Query calls are free and do not consume cycles.
- **Compress assets.** Enable gzip encoding for asset canisters to reduce storage and transfer costs.

## Next steps

- [Canister lifecycle](/guides/canisters/lifecycle/) -- deployment and upgrade workflows
- [icp-cli CLI reference](https://dfinity.github.io/icp-cli/reference/cli/) -- build and deploy commands
