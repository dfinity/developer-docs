---
title: "Large Wasm modules"
description: "Deploy canisters that exceed the 2 MiB Wasm limit using chunk store and compression"
sidebar:
  order: 8
---

ICP enforces a 2 MiB message size limit that applies to Wasm modules uploaded via `install_code`. Canisters with complex business logic, embedded ML models, or large dependency trees often exceed this threshold. There are two complementary approaches: reduce the module size with compression and dead-code stripping, or bypass the limit entirely by uploading the module in chunks.

This guide covers both approaches, explains Wasm64 for canisters that need extended memory, and introduces WebAssembly SIMD for computationally intensive workloads.

## Why Wasm modules grow large

A compiled Wasm binary grows for several reasons:

- **Dense dependency trees**: Rust canisters that pull in many crates accumulate dead code that the compiler cannot always eliminate.
- **Embedded data**: ML model weights, large lookup tables, or static assets compiled into the binary.
- **Complex business logic**: feature-rich canisters with many update and query methods.
- **Debug symbols**: by default, Rust release builds include name sections and other debug metadata.

Before reaching for the chunk store, consider whether [canister optimization](optimization.md) can reduce the binary enough to fit under 2 MiB.

## Approach 1: gzip compression

ICP's management canister understands gzip-compressed Wasm modules. When the `wasm_module` field of `install_code` starts with the gzip magic bytes `[0x1f, 0x8b, 0x08]`, the system decompresses it automatically before installation.

Gzip compression typically reduces Wasm binary size significantly, which is often enough to bring a large module under the 2 MiB threshold.

### Using a recipe

The Rust and prebuilt recipes expose a `compress` flag that gzip-compresses the output as the final build step:

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/rust@v3.2.0"
      configuration:
        package: backend
        shrink: true
        compress: true
```

Setting `shrink: true` first removes unused functions and debug info while preserving function names for readable backtraces, then `compress: true` gzip-compresses the result. Using both together gives the largest size reduction.

### Using a custom build script

If you are not using a recipe, you can compress manually in your build steps:

```yaml
canisters:
  - name: backend
    build:
      steps:
        - type: script
          commands:
            - cargo build --target wasm32-unknown-unknown --release
            - cp target/wasm32-unknown-unknown/release/backend.wasm "$ICP_WASM_OUTPUT_PATH"
            - ic-wasm "$ICP_WASM_OUTPUT_PATH" -o "$ICP_WASM_OUTPUT_PATH" shrink --keep-name-section
            - gzip --no-name "$ICP_WASM_OUTPUT_PATH"
            - mv "${ICP_WASM_OUTPUT_PATH}.gz" "$ICP_WASM_OUTPUT_PATH"
```

The `--keep-name-section` flag preserves function names for readable backtraces while still removing dead code. Omit it if you do not need stack traces.

## Approach 2: the Wasm chunk store

When compression alone is not enough, the Wasm chunk store lets you upload modules larger than 2 MiB by splitting them into chunks, then assembling and installing them in one atomic operation.

### How the chunk store works

1. **Upload chunks**: Call `upload_chunk` on the management canister to store up to 1 MiB chunks in the target canister's chunk store. Each call returns the SHA-256 hash of the stored chunk.
2. **Assemble and install**: Call `install_chunked_code` with the ordered list of chunk hashes. The system concatenates the chunks, verifies the aggregate hash matches `wasm_module_hash`, and installs the result as if you had called `install_code` directly.

The chunk store is bounded: each chunk is at most 1 MiB, and there is a maximum number of chunks per store (`CHUNK_STORE_SIZE`, defined in the IC interface spec: see the [management canister reference](../../references/management-canister.md) for the exact value). You can inspect stored chunks with `stored_chunks` and clear the store with `clear_chunk_store`.

### icp-cli handles this automatically

When you run `icp deploy` or `icp canister install` with a Wasm module larger than 2 MiB, icp-cli automatically uses the chunk store. No configuration required. The tool splits the module, uploads each chunk, and calls `install_chunked_code` behind the scenes. <!-- TODO: verify automatic chunking behavior against icp-cli release notes -->

```bash
icp deploy
```

### Combining compression with the chunk store

You can combine gzip compression with the chunk store. A compressed module that is still larger than 2 MiB will still be split into chunks, but fewer chunks are needed: which means fewer upload calls and lower cycle costs. Enable both `shrink` and `compress` in your recipe, and let icp-cli decide whether chunking is needed.

### Cycle costs

Storing each chunk costs [cycles](../../concepts/cycles.md) proportional to 1 MiB of storage (even if the chunk is smaller). Chunks are temporary storage: they are consumed during `install_chunked_code` and do not accumulate after installation. If an installation attempt fails or is interrupted, call `clear_chunk_store` to reclaim the storage cycles before retrying.

## Wasm64: 64-bit memory addressing

Standard ICP canisters use the `wasm32-unknown-unknown` target, which limits addressable memory to 4 GiB. For canisters that need more (for example, those holding large in-memory datasets or running inference on large models) ICP supports the `wasm64-unknown-unknown` target with up to 6 GiB of addressable heap memory (an ICP platform limit).

Wasm64 is a separate concern from the chunk store. You might use one, the other, or both: the chunk store addresses the 2 MiB upload limit, while Wasm64 addresses the runtime memory limit.

### Building a Wasm64 canister

Wasm64 requires the Rust nightly toolchain and the `build-std` unstable feature, because the standard library must be compiled for the `wasm64-unknown-unknown` target rather than pulled from a precompiled artifact.

Create a `build.sh` script in your project directory:

```bash
#!/bin/bash

# Ensure nightly toolchain and rust-src are available
rustup toolchain install nightly
rustup component add rust-src --toolchain nightly

# Build for wasm64
cargo +nightly build \
  -Z build-std=std,panic_abort \
  --target wasm64-unknown-unknown \
  --release \
  -p backend

cp target/wasm64-unknown-unknown/release/backend.wasm target/backend.wasm
candid-extractor target/backend.wasm > backend/backend.did
```

Then reference the script in `icp.yaml`:

```yaml
canisters:
  - name: backend
    build:
      steps:
        - type: script
          commands:
            - ./build.sh
            - cp target/backend.wasm "$ICP_WASM_OUTPUT_PATH"
            - ic-wasm "$ICP_WASM_OUTPUT_PATH" -o "${ICP_WASM_OUTPUT_PATH}" metadata "candid:service" -f 'backend/backend.did' -v public --keep-name-section
```

The canister code itself does not require changes. The same Rust CDK code works on both `wasm32` and `wasm64`:

```rust
#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}

ic_cdk::export_candid!();
```

See the [backend_wasm64 example](https://github.com/dfinity/examples/tree/master/rust/backend_wasm64) for a complete working project.

### Memory limits and Wasm64

Wasm64 canisters benefit from the `wasm_memory_limit` canister setting to cap WebAssembly heap usage, preventing runaway allocations:

```yaml
canisters:
  - name: backend
    build:
      steps:
        - type: script
          commands:
            - ./build.sh
            - cp target/backend.wasm "$ICP_WASM_OUTPUT_PATH"
    settings:
      wasm_memory_limit: 4gib
```

## WebAssembly SIMD

WebAssembly SIMD (Single Instruction, Multiple Data) is a set of more than 200 vector instructions defined in the WebAssembly core specification. SIMD allows a single instruction to operate on multiple data elements in parallel, which significantly accelerates compute-heavy workloads.

SIMD is available on every ICP node and does not require any special canister configuration beyond enabling the target feature in your build.

### When SIMD helps

SIMD provides the largest gains for workloads with regular, data-parallel structure:

- **AI/ML inference**: matrix multiplications, activation functions, convolutions
- **Image processing**: pixel transforms, filtering, encoding/decoding
- **Cryptographic operations**: hash computation, field arithmetic
- **Scientific computing**: numerical simulations, signal processing

For "classical" canister operations: reward distribution, token accounting, query logic. The gains are smaller but still measurable.

### Loop auto-vectorization

The simplest way to benefit from SIMD is to enable the `simd128` target feature and let the Rust compiler auto-vectorize loops. This is a one-line change that often provides significant speedup without rewriting any code.

Enable SIMD globally for your entire workspace by creating `.cargo/config.toml`:

```toml
[build]
target = ["wasm32-unknown-unknown"]

[target.wasm32-unknown-unknown]
rustflags = ["-C", "target-feature=+simd128"]
```

Or enable it only for a specific function:

```rust
#[target_feature(enable = "simd128")]
#[ic_cdk::query]
fn compute_heavy_operation() -> u64 {
    // The compiler auto-vectorizes eligible loops in this function
    // ...
    0
}
```

Auto-vectorization works best with tight numeric loops over contiguous arrays. The actual speedup depends on the algorithm, the compiler, and the input data.

### SIMD intrinsics

For maximum performance, you can use SIMD intrinsics directly. This gives full control over which vector instructions execute, at the cost of writing more complex code.

The `wasm32` platform exposes SIMD intrinsics through the `core::arch::wasm32` module (available when `simd128` is enabled). For a complete working example comparing naive, optimized, auto-vectorized, and SIMD intrinsic implementations of matrix multiplication, see the [WebAssembly SIMD example](https://github.com/dfinity/examples/tree/master/rust/simd) in the examples repository.

### Measuring SIMD performance

Use the `ic0.performance_counter` system API to count Wasm instructions before and after a computation:

```rust
#[ic_cdk::query]
fn benchmark_operation() -> u64 {
    let before = ic_cdk::api::instruction_counter();
    // ... your computation ...
    ic_cdk::api::instruction_counter() - before
}
```

Compare instruction counts with and without SIMD to measure the speedup. Lower instruction counts mean lower cycle costs and faster execution. The [`canbench`](https://github.com/dfinity/canbench) framework provides a more structured benchmarking workflow for tracking performance over time.

## Troubleshooting

**"Wasm module too large" error during install**: The module exceeds 2 MiB. Verify that icp-cli is up to date (automatic chunk store support was added in v0.2.x). If using a manual install flow, switch to the `install_chunked_code` management canister API.

**"Wasm chunk store error" during install**: The canister may lack sufficient cycles to store chunks (each 1 MiB chunk incurs a storage cost). Top up the canister's cycles balance before retrying. If chunks from a previous failed attempt are occupying the store, call `clear_chunk_store` first.

**Wasm64 build fails with missing target**: The `nightly` toolchain and `rust-src` component must both be installed. Run:

```bash
rustup toolchain install nightly
rustup component add rust-src --toolchain nightly
```

**SIMD instructions have no measurable effect**: Some loops cannot be auto-vectorized. Check that the loop body is tight, operates on a contiguous slice, and does not contain branches or function calls that prevent vectorization. Profile with `ic_cdk::api::instruction_counter` to confirm the function is a bottleneck before investing in SIMD intrinsics.

## Next steps

- [Canister optimization](optimization.md): reduce Wasm size before reaching for the chunk store
- [Execution errors reference](../../references/execution-errors.md): Wasm size and chunk store error codes
- [Canister lifecycle](lifecycle.md): deployment modes and install options

<!-- Upstream: informed by dfinity/portal docs/building-apps/developing-canisters/compile.mdx; dfinity/portal docs/building-apps/network-features/simd.mdx; dfinity/examples rust/backend_wasm64; dfinity/portal docs/references/ic-interface-spec.md -->
