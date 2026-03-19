---
title: "Canister Optimization"
description: "Reduce Wasm size and improve canister performance with ic-wasm, SIMD, and memory tuning"
sidebar:
  order: 4
---

TODO: Write content for this page.

<!-- Content Brief -->
Reduce Wasm binary size and improve canister performance. Cover ic-wasm for stripping and shrinking, SIMD operations for compute-heavy tasks, performance counters for profiling, memory management best practices, and low-Wasm-memory hooks. Language-specific tips for both Rust (lto, opt-level, wasm-opt) and Motoko (compacting-gc).

<!-- Source Material -->
- Portal: building-apps/advanced/optimize/rust.mdx, motoko.mdx
- Examples: low_wasm_memory (both), performance_counters (Rust), simd (Rust), face-recognition (Rust), image-classification (Rust)

<!-- Cross-Links -->
- guides/canister-management/large-wasm -- when optimization is not enough
- reference/cycles-costs -- smaller Wasm = fewer cycles
- guides/canister-management/lifecycle -- optimized builds in recipes
