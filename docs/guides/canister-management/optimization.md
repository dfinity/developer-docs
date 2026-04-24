---
title: "Canister Optimization"
description: "Reduce Wasm binary size and improve canister performance with ic-wasm, SIMD, performance counters, and memory tuning"
sidebar:
  order: 4
---

Canister Wasm binaries compiled from Rust or Motoko are often larger than necessary and may execute more instructions than needed. Smaller binaries install faster, consume fewer [cycles](../../concepts/cycles.md) on deployment, and leave more room within the per-canister Wasm memory limit. Better runtime efficiency directly reduces the cycles charged per call.

This guide covers the main tools and techniques available:

- **`ic-wasm shrink`**: strip unused functions and debug info from the compiled Wasm
- **Rust `Cargo.toml` profile settings**: link-time optimization and compiler tuning
- **Motoko GC configuration**: selecting the right garbage collector for your workload
- **WebAssembly SIMD**: accelerate compute-heavy workloads (Rust only)
- **Performance counters**: measure actual instruction usage to find bottlenecks
- **Low Wasm memory hook**: react before the canister runs out of Wasm memory

## Reducing binary size with `ic-wasm shrink`

`ic-wasm` is included when you install `icp-cli`. Its `shrink` command removes unreachable functions, dead code, and debug sections from your compiled Wasm module.

**Using the official Rust recipe**: enable the `shrink` option in `icp.yaml`:

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/rust@v3.2.0"
      configuration:
        package: backend
        shrink: true
```

**Using the official Motoko recipe:**

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/motoko@<version>"
      configuration:
        main: src/main.mo
        shrink: true
```

**Running `ic-wasm` directly**: if you have a custom build pipeline:

```bash
ic-wasm backend.wasm -o backend.wasm shrink --keep-name-section
```

The `--keep-name-section` flag preserves human-readable function names, which makes stack traces and debug output easier to read. Omit it if you want the smallest possible output.

> **Complexity limit:** In rare cases, aggressive optimization can increase the complexity of individual Wasm functions enough that the replica rejects the module. If deployment fails with a complexity error, use a less aggressive approach or skip `shrink` for the affected canister.

## Rust: Cargo release profile tuning

In addition to `ic-wasm`, Rust offers compiler-level optimizations through the `[profile.release]` section in your workspace `Cargo.toml`.

```toml
[profile.release]
lto = true           # Link-time optimization: merges crates for better dead code removal
opt-level = 3        # Maximum optimization (default is 3 for release)
codegen-units = 1    # Single codegen unit enables more aggressive cross-function optimization
```

`lto = true` and `opt-level = 3` are used by the SIMD example in `dfinity/examples` (`rust/simd/Cargo.toml`). Adding `codegen-units = 1` further enables cross-function optimization and is a good default for production canisters. Trade-off: `lto = true` and `codegen-units = 1` significantly increase compile time.

For binary size over speed, use `opt-level = "z"` (optimize for size, disabling some loop unrolling) or `opt-level = "s"` (balanced size/speed). These are equivalent to the `Oz` and `Os` levels in `wasm-opt`.

## Motoko: Garbage collector options

The Motoko compiler uses the **incremental GC** by default starting with Motoko 0.15 and enhanced orthogonal persistence. You cannot choose a different GC when enhanced orthogonal persistence is active. The GC is fixed.

For projects using legacy persistence (without enhanced orthogonal persistence), you can select an alternative GC by passing compiler arguments through the Motoko recipe:

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/motoko@<version>"
      configuration:
        main: src/main.mo
        args: --incremental-gc
```

> **New projects:** If you are using enhanced orthogonal persistence (the current default), no `args` configuration is needed. The incremental GC is already selected automatically. The `args` field only becomes relevant when selecting an alternative GC under `--legacy-persistence`.

The incremental GC is designed to scale for large heap sizes and is more efficient on average than the older copying or compacting collectors. It is the recommended choice for most workloads.

For legacy-persistence projects: if `--legacy-persistence` is specified, you can use `--copying-gc`, `--compacting-gc`, or `--generational-gc`. The compacting GC supports larger heap sizes than the default 2-space copying collector, while the generational GC performs well when most heap data has a short lifetime.

## WebAssembly SIMD (Rust only)

ICP supports WebAssembly SIMD (Single Instruction, Multiple Data) instructions, which allow a single instruction to operate on multiple data values simultaneously. This is useful for numeric-heavy workloads like image processing, matrix multiplication, and machine learning inference.

SIMD is a **Rust-only feature**: the Motoko compiler does not expose SIMD controls.

### Enabling SIMD globally

Add a `.cargo/config.toml` file to your project and set the `simd128` target feature:

```toml
[target.wasm32-unknown-unknown]
rustflags = ["-C", "target-feature=+simd128"]
```

This enables SIMD for the entire workspace, including all dependencies. The Rust compiler's loop auto-vectorization will apply SIMD automatically where it can.

### Enabling SIMD for specific functions

To benchmark the difference or selectively enable SIMD, annotate individual functions:

```rust
#[target_feature(enable = "simd128")]
#[ic_cdk_macros::query]
fn process_matrix() -> u64 {
    // SIMD instructions are enabled for this function only
    let instructions_before = ic_cdk::api::instruction_counter();
    // ... compute-heavy work ...
    ic_cdk::api::instruction_counter() - instructions_before
}
```

The `dfinity/examples` repository contains a complete SIMD benchmarking example (`rust/simd`) that compares naive, auto-vectorized, and SIMD-intrinsic matrix multiplication approaches and measures the instruction savings for each.

## Profiling with performance counters

Before optimizing, measure where cycles are actually spent. ICP exposes two performance counters via `ic_cdk::api`:

**`instruction_counter()`**: instructions executed since the last entry point. Resets at each `await` point (each `await` creates a new entry point).

**`call_context_instruction_counter()`**: cumulative instructions across the entire call context, including across `await` points. Use this to measure the total cost of an async flow.

```rust
use ic_cdk::api::{instruction_counter, call_context_instruction_counter};

#[ic_cdk_macros::update]
async fn my_operation(input: String) -> u64 {
    let before = instruction_counter();

    do_expensive_work(&input);
    let mid = instruction_counter();
    ic_cdk::println!("expensive_work used {} instructions", mid - before);

    let result = call_external_canister(input).await.unwrap();
    // instruction_counter() resets after the await above
    let after = instruction_counter();
    ic_cdk::println!("post-await work used {} instructions", after);

    call_context_instruction_counter()  // total for the whole call
}
```

The complete performance counters example is available at `rust/performance_counters` in `dfinity/examples`. It demonstrates how counters behave across nested inter-canister calls and composite queries.

## Low Wasm memory hook

Canisters have a configurable Wasm memory limit (`wasm_memory_limit`) that caps heap usage below the platform maximum. When available Wasm memory falls below the `wasm_memory_threshold`, ICP runs a special callback before the next message execution. You can use this hook to shed state, flush caches, or emit an alert before the canister runs out of memory.

### Configuring the limits

Set limits in `icp.yaml`:

```yaml
canisters:
  - name: backend
    settings:
      wasm_memory_limit: 1gib
      wasm_memory_threshold: 512mib
```

Or update a running canister:

```bash
icp canister settings update backend \
  --wasm-memory-limit 1gib \
  --wasm-memory-threshold 512mib
```

When Wasm heap memory in use exceeds `wasm_memory_limit - wasm_memory_threshold`, the hook fires.

### Implementing the hook in Rust

Use the `#[on_low_wasm_memory]` attribute (re-exported from `ic_cdk`):

```rust
use ic_cdk::on_low_wasm_memory;

#[on_low_wasm_memory]
fn handle_low_memory() {
    // Shed cached state, emit a log entry, or set a flag
    // to reject new requests until memory is reclaimed
    ic_cdk::println!("Low Wasm memory: shedding cache");
    with_state_mut(|s| {
        s.cache.clear();
        s.low_memory_triggered = true;
    });
}
```

### Implementing the hook in Motoko

Declare a `system func lowmemory()` in your actor:

```motoko
persistent actor {
  transient var lowMemoryTriggered : Bool = false;

  system func lowmemory() : async* () {
    lowMemoryTriggered := true;
    // Shed state here
  };
}
```

The `lowmemory` hook is an `async*` function, so it can perform async operations.

A complete Rust example is available at `rust/low_wasm_memory` in `dfinity/examples`. It demonstrates the full lifecycle: setting memory limits via canister settings, watching memory grow through the heartbeat, and observing the hook fire. A `motoko/low_wasm_memory` example also exists, but note that it currently uses the legacy Motoko base library: use the inline snippet above as the reference for `mo:core`-compatible code.

## Combining techniques

Most production canisters benefit from combining several techniques:

1. **Always enable `shrink`** in your recipe: it is low-effort and typically reduces binary size by removing dead code. Pairs well with `lto = true` in Rust.
2. **Set `wasm_memory_limit` and `wasm_memory_threshold`** on any canister that holds large amounts of heap data, and implement the low memory hook.
3. **Profile before optimizing**: use `instruction_counter()` in a staging environment to identify which endpoints are expensive before spending time on SIMD or algorithmic changes.
4. **Consider SIMD for ML/compute workloads**: if you are running inference, image processing, or signal processing in Rust, enabling `simd128` globally is often worth the build-time cost.

## Next steps

- [Large Wasm](large-wasm.md): when binary size exceeds the upload limit
- [Cycles costs](../../reference/cycles-costs.md): how Wasm size and instruction count map to cycle charges
- [Canister lifecycle](lifecycle.md): how optimized builds integrate with the icp-cli deploy workflow

<!-- Upstream: informed by dfinity/portal — docs/building-apps/advanced/optimize/rust.mdx; docs/building-apps/advanced/optimize/motoko.mdx -->
<!-- Upstream: informed by dfinity/examples — rust/performance_counters; rust/low_wasm_memory; motoko/low_wasm_memory; rust/simd -->
<!-- Upstream: informed by dfinity/icp-cli-recipes — recipes/rust/recipe.hbs; recipes/motoko/recipe.hbs -->
<!-- Upstream: informed by dfinity/cdk-rs — ic-cdk/src/api.rs -->
