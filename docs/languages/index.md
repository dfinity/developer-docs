---
title: "Overview"
description: "Languages and CDKs for building ICP canisters"
sidebar:
  order: 0
icskills: []
---

ICP canisters compile to WebAssembly, so any language that targets Wasm can be used. These docs cover the two officially supported languages in depth, plus community CDKs for additional languages.

## Official CDKs

### [Motoko](motoko/index.md)

Purpose-built for the Internet Computer. Built-in actor model, orthogonal persistence, and async/await for inter-canister calls. Compiles directly to Wasm with no external toolchain.

### [Rust](rust/index.md)

Use the `ic-cdk` canister development kit with the full Rust ecosystem -- any crate that compiles to `wasm32-unknown-unknown` works. Ideal when leveraging existing Rust libraries or integrating with Rust-based tooling.

## Community CDKs

These CDKs are built and maintained by the community. They enable ICP development in additional languages.

| Language | CDK | Repository |
|----------|-----|------------|
| TypeScript | Azle | [demergent-labs/azle](https://github.com/demergent-labs/azle) |
| Python | Kybra | [demergent-labs/kybra](https://github.com/demergent-labs/kybra) |
| C++ | icpp-pro | [icppWorld/icpp-pro](https://github.com/icppWorld/icpp-pro) |
| MoonBit | moonbit-ic-cdk | [eliezhao/moonbit-ic-cdk](https://github.com/eliezhao/moonbit-ic-cdk) |
