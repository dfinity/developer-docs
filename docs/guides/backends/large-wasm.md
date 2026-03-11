---
title: "Large Wasm Modules"
description: "Deploy canisters that exceed the 2MB Wasm limit using chunk store and compression"
sidebar:
  order: 6
icskills: []
---

TODO: Write content for this page.

<!-- Content Brief -->
Deploy canisters with Wasm modules larger than the 2MB limit. Cover the Wasm chunk store for splitting large modules, gzip compression for reducing size, the ic-wasm tool for stripping and optimizing, and Wasm64 support for 64-bit memory. Explain when and why you might need large modules (ML models, complex business logic). Include a section on WebAssembly SIMD — 200+ vector instructions for parallel computation that accelerate AI/ML inference, image processing, cryptographic operations, and other math-heavy workloads. SIMD is available on every ICP node.

<!-- Source Material -->
- Portal: building-apps/developing-canisters/compile.mdx (large Wasm section)
- Examples: backend_wasm64 (Rust)
- icp-cli: --wasm-chunk-store flag

<!-- Cross-Links -->
- guides/canisters/optimization -- reducing Wasm size to avoid this entirely
- reference/execution-errors -- Wasm size errors
- guides/canisters/lifecycle -- deployment with chunk store
