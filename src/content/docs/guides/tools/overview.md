---
title: "Developer Tools"
description: "Overview of icp-cli, JS SDK, icskills, and community tools for ICP development"
sidebar:
  order: 1
doc_type: reference
level: beginner
icskills: [icp-cli, ic-dashboard]
last_verified: 2026-03-10
---

This page catalogs the primary tools for building on ICP.

## icp-cli

The main command-line interface for ICP development. It handles project creation, canister building, deployment, and management.

```bash
# Install (npm)
npm install -g @icp-sdk/icp-cli @icp-sdk/ic-wasm

# Common commands
icp new my_project          # Create a new project
icp network start -d        # Start local network
icp deploy                  # Build and deploy canisters
icp canister call           # Call canister methods
icp identity principal      # Show current identity
```

`icp-cli` replaces the deprecated `dfx` tool. See [Migrating from dfx](/guides/tools/migrating-from-dfx/) for details.

**Docs:** [icp-cli documentation](https://github.com/dfinity/icp-cli)

## JavaScript / TypeScript SDK

The ICP SDK (`@icp-sdk/*`) provides libraries for building frontends and Node.js services that interact with ICP canisters. It replaces the legacy `@dfinity/*` packages.

| Package | Purpose |
|---------|---------|
| `@icp-sdk/core` | Core agent, Candid encoding, principals |
| `@icp-sdk/auth` | Internet Identity integration |
| `@icp-sdk/bindgen` | TypeScript binding generation from `.did` files |
| `@icp-sdk/canisters` | Pre-built clients for system canisters (ledgers, ckBTC minter, etc.) |

```bash
npm install @icp-sdk/core @icp-sdk/auth @icp-sdk/canisters
```

**Docs:** [js.icp.build](https://js.icp.build)

## icskills

AI-powered development assistance for ICP. icskills provides contextual help, code generation, and debugging support integrated into your development workflow.

**Docs:** [icskills documentation](https://github.com/anthropics/icskills)

## Candid UI

An auto-generated web interface for testing canister methods. When you deploy a canister locally, `icp-cli` outputs a Candid UI URL where you can call any method interactively.

Access it at: `http://127.0.0.1:8000/?canisterId=<CANDID_UI_CANISTER_ID>&id=<YOUR_CANISTER_ID>`

## IC Dashboard

The [ICP Dashboard](https://dashboard.internetcomputer.org/) provides a web interface for monitoring:

- Canister status, cycles balance, and controllers.
- Subnet health and capacity.
- NNS proposals and governance activity.
- Token ledger transactions.

## Mops

The package manager for Motoko. Browse and install community packages.

```bash
mops add base       # Add a package
mops install        # Install all dependencies
mops test           # Run tests
```

**Docs:** [mops.one](https://mops.one/)

## Cargo + ic-wasm

Rust canisters use standard Cargo for building and dependency management. The [ic-wasm](https://github.com/dfinity/ic-wasm) tool optimizes Wasm modules:

```bash
cargo build --release --target wasm32-unknown-unknown
ic-wasm target/wasm32-unknown-unknown/release/my_canister.wasm -o optimized.wasm shrink
```

`icp-cli` runs `ic-wasm` optimizations automatically during deployment.

**Docs:** [ic-wasm on GitHub](https://github.com/dfinity/ic-wasm)

## quill

A minimalist ledger and governance toolkit for cold wallets and airgapped environments. Useful for submitting NNS/SNS proposals and managing neurons offline.

```bash
quill transfer --to <ACCOUNT> --amount 1.0
quill sns make-proposal ...
```

**Docs:** [quill on GitHub](https://github.com/dfinity/quill)

## pic.js / pocket-ic

Testing frameworks for running canister integration tests without a full replica.

- **[PocketIC](https://github.com/dfinity/ic/tree/master/packages/pocket-ic)** -- Lightweight IC test environment for Rust.
- **[pic.js](https://github.com/hadronous/pic-js)** -- JavaScript/TypeScript bindings for PocketIC.

## Agents

Agent libraries connect off-chain code (browsers, Node.js, CLI tools) to ICP canisters. They handle Candid serialization, request signing, and routing through boundary nodes.

| Library | Language | Install |
|---------|----------|---------|
| [ICP JS SDK](https://js.icp.build) | JavaScript / TypeScript | `npm install @icp-sdk/core` |
| [ic-agent](https://docs.rs/ic-agent) | Rust | `cargo add ic-agent` |

Use `@icp-sdk/core` for frontend apps and Node.js services. Use `ic-agent` for Rust-based off-chain tooling and testing.

See [App Architecture](/concepts/app-architecture/#agents-connecting-off-chain-clients) for how agents fit into the overall application model.

## Further reading

- [Migrating from dfx](/guides/tools/migrating-from-dfx/) -- Migration guide for existing projects.
- [Rust CDK](/languages/rust/) -- Rust development on ICP.
- [Motoko](/languages/motoko/) -- Motoko language overview.
