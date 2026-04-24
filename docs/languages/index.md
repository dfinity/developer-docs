---
title: "Languages & CDKs"
description: "Languages and CDKs for building ICP canisters"
sidebar:
  order: 0
---

ICP canisters compile to WebAssembly, so any language that targets Wasm can be used. There are two approaches: **Motoko** is a language purpose-built for IC. Its compiler handles system API bindings, Candid serialization, and persistence natively. For other languages, a **Canister Development Kit (CDK)** provides the glue between the language and the IC system API: type-safe bindings for system calls, macros for exposing canister methods, and utilities for stable memory and inter-canister calls.

## Officially supported

### [Motoko](motoko/index.md)

A language purpose-built for the Internet Computer by DFINITY. Built-in actor model, orthogonal persistence, and async/await for inter-canister calls. Compiles directly to Wasm with no external CDK needed.

### [Rust](rust/index.md)

Use the `ic-cdk` canister development kit, maintained by DFINITY, with the full Rust ecosystem. Any crate that compiles to `wasm32-unknown-unknown` works.

## Community-maintained CDKs

These CDKs are built and maintained by the community, enabling ICP development in additional languages.

| Language | CDK | Repository |
|----------|-----|------------|
| TypeScript | Azle | [demergent-labs/azle](https://github.com/demergent-labs/azle) |
| Python | Kybra | [demergent-labs/kybra](https://github.com/demergent-labs/kybra) |
| C++ | icpp-pro | [icppWorld/icpp-pro](https://github.com/icppWorld/icpp-pro) |
| MoonBit | moonbit-ic-cdk | [eliezhao/moonbit-ic-cdk](https://github.com/eliezhao/moonbit-ic-cdk) |
