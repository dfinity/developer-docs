---
title: "Developer Tools"
description: "Overview of the ICP developer toolchain: icp-cli, CDKs, JS SDK, PocketIC, and more"
sidebar:
  hidden: true
---

Developer tools are used to create, manage, and interact with canisters. ICP provides tooling across several categories: command-line tools, canister development kits (CDKs), client libraries, testing tools, browser-based IDEs, and Candid tooling.

## Command-line tools

### icp-cli

`icp-cli` is the primary tool for building and deploying applications on the Internet Computer. It manages the full development lifecycle: creating projects, building canisters, deploying to local or mainnet environments, managing identities, and handling cycles and ICP tokens.

Key features:
- **Recipes**: reusable, versioned build templates for Rust, Motoko, and asset canisters
- **Environments**: named deployment targets that combine a network, canister set, and settings (e.g., local, staging, production)
- **Project scaffolding**: `icp new` bootstraps new projects from official templates

For installation, see the [Quickstart](../getting-started/quickstart.md) or the [full CLI documentation](https://cli.internetcomputer.org/0.2/).

Advanced: [creating recipes](https://cli.internetcomputer.org/0.2/guides/creating-recipes) and [creating templates](https://cli.internetcomputer.org/0.2/guides/creating-templates) are documented on the CLI docs site.

icp-cli collects anonymous usage telemetry. Opt out with `icp settings telemetry false` or `DO_NOT_TRACK=1`.

Coming from dfx? See the [migration guide](https://cli.internetcomputer.org/0.2/migration/from-dfx).

### ic-wasm

`ic-wasm` is a Wasm post-processing tool required by the official Rust and Motoko recipes. It shrinks binary size, embeds Candid metadata, and strips unused sections. Install it alongside icp-cli. See the [Quickstart](../getting-started/quickstart.md) for setup. You only need to invoke it directly when writing custom build steps.

Resources:
- [ic-wasm GitHub repo](https://github.com/dfinity/ic-wasm)

### Quill

Quill is a minimalistic, offline-first CLI for signing and sending governance messages (NNS and SNS proposals, neuron management) from air-gapped machines. Unlike `icp-cli`, Quill is designed for cold wallet workflows: you generate signed messages on an offline device, then submit them from a networked machine.

Quill is suited for:
- Submitting NNS governance proposals
- Managing SNS neurons from a hardware wallet or cold key

Resources:
- [Quill GitHub repo](https://github.com/dfinity/quill)

## Canister development kits (CDKs)

A canister development kit (CDK) provides a programming language with the libraries and toolchain support needed to compile code to WebAssembly and interact with the ICP system API.

### Motoko

Motoko is ICP's native programming language, designed around the actor model, orthogonal persistence, and asynchronous message passing. It compiles directly to WebAssembly and includes a standard library (`mo:core`) with modules for common data structures, cryptography, and system interaction.

Third-party Motoko libraries are distributed through [Mops](https://mops.one), the Motoko package manager. Use `mops add <package>` to add a dependency to your project.

For language documentation, see [languages/motoko](../languages/motoko/index.md).

### Rust CDK (`ic-cdk`)

The Rust CDK (`ic-cdk`) is the official DFINITY-maintained library for building canisters in Rust. It exposes the ICP system API as safe Rust abstractions, including:
- `ic_cdk::api`: system calls (time, caller, stable memory, management canister)
- `ic_cdk_timers`: periodic timers and one-shot timers
- `ic_cdk_macros`: `#[update]`, `#[query]`, `#[init]`, and other attribute macros

API reference: [docs.rs/ic-cdk](https://docs.rs/ic-cdk/latest/ic_cdk/)

For Rust-specific guides, see [languages/rust](../languages/rust/index.md).

### Community CDKs

Several community-maintained CDKs extend ICP to other languages:

| Language | CDK | Resources |
|----------|-----|-----------|
| TypeScript / JavaScript | [Azle](https://github.com/demergent-labs/azle) | [Documentation](https://demergent-labs.github.io/azle/azle.html) |
| Python | [Kybra](https://github.com/demergent-labs/kybra) | [Documentation](https://demergent-labs.github.io/kybra) |
| C++ | [icpp-pro](https://github.com/icppWorld/icpp-pro) | [Documentation](https://docs.icpp.world) |
| MoonBit | [moonbit-ic-cdk](https://github.com/eliezhao/moonbit-ic-cdk) | GitHub repo |

Community CDKs are maintained independently of DFINITY. Check each project's documentation for current support status.

## Client libraries

Client libraries handle the protocol details of calling canisters from outside the network: constructing and signing ingress messages, encoding Candid, and verifying responses. For setup and usage patterns, see [Calling from clients](../guides/canister-calls/calling-from-clients.md).

### JavaScript / TypeScript

The `@icp-sdk` package provides the agent and companion libraries for browser and Node.js applications. Full documentation at [js.icp.build](https://js.icp.build).

| Package | Purpose |
|---------|---------|
| `@icp-sdk/core/agent` | Send update and query calls to canisters; manage actors |
| `@icp-sdk/core/candid` | Encode and decode Candid values |
| `@icp-sdk/core/principal` | Work with canister and user principal identifiers |
| `@icp-sdk/core/identity` | Manage signing identities |
| `@icp-sdk/auth` | Authentication client for Internet Identity |
| `@icp-sdk/bindgen` | Generate TypeScript bindings from a Candid interface file |

`@icp-sdk/bindgen` is also available as a Vite plugin and a standalone CLI tool. The official project templates wire it up automatically: generated bindings appear in `src/declarations/` after each build.

### Rust

[`ic-agent`](https://docs.rs/ic-agent/latest/ic_agent/) is the official Rust library for building applications and scripts that interact with ICP.

### Other languages

Community-maintained client libraries are available for additional languages:

| Language | Package |
|----------|---------|
| Go | [`agent-go` by Aviate Labs](https://github.com/aviate-labs/agent-go) |
| Java / Android | [`ic4j-agent` by IC4J](https://github.com/ic4j/ic4j-agent) |
| Dart / Flutter | [`agent_dart` by AstroX](https://github.com/AstroxNetwork/agent_dart) |
| .NET | [`ICP.NET` by Gekctek](https://github.com/Gekctek/ICP.NET) |
| Elixir | [`icp_agent`](https://github.com/diodechain/icp_agent) |
| C | [`agent-c` by Zondax](https://github.com/Zondax/icp-client-cpp) |

Community libraries are maintained independently of DFINITY. Check each repository for current status and security review history before using in production.

## Testing tools

### PocketIC

[PocketIC](../guides/testing/pocket-ic.md) is a lightweight, deterministic testing library for canister integration tests. It runs an in-process IC replica: no daemon, no ports, no Docker required. Tests execute synchronously, making them fast and fully reproducible. The `icp-cli` local development network uses PocketIC under the hood.

| Language | Package | Install |
|----------|---------|---------|
| Rust | [`pocket-ic`](https://crates.io/crates/pocket-ic) | Add to `[dev-dependencies]` in `Cargo.toml` |
| JavaScript / TypeScript | [`@dfinity/pic`](https://www.npmjs.com/package/@dfinity/pic) | `npm install --save-dev @dfinity/pic` |
| Python | [`pocket-ic`](https://pypi.org/project/pocket-ic/) | `pip install pocket-ic` |

For usage patterns and examples, see the [PocketIC guide](../guides/testing/pocket-ic.md).

## Browser-based IDE

### ICP Ninja

[ICP Ninja](https://icp.ninja) is a web-based IDE for writing and deploying ICP canisters directly from a browser. No local toolchain required. It provides a gallery of example projects (Motoko and Rust backends, React frontends) that you can browse, edit, and deploy to the mainnet in one click.

Deployed canisters remain live for 20 minutes. You can redeploy to reset the timer, or download the project files to continue development locally with icp-cli.

Limitations:
- Projects are limited to 5 MB and 2 canisters
- ICP Ninja is not a replacement for icp-cli for production workflows

## Editor tooling

### Motoko VS Code extension

The [Motoko extension for VS Code](https://github.com/dfinity/vscode-motoko) (`dfinity/vscode-motoko`) adds Motoko language support to VS Code: syntax highlighting, type checking, auto-completion, and inline diagnostics.

Install by searching for "Motoko" in the VS Code extensions panel, or visit the [vscode-motoko repository](https://github.com/dfinity/vscode-motoko) for details.

## Candid tools

### didc

`didc` is the Candid command-line tool for working with Candid interfaces: encoding and decoding values, checking `.did` files, generating bindings, and testing Candid compatibility.

Install: download a prebuilt binary from the [releases page](https://github.com/dfinity/candid/releases).

Resources:
- [Candid GitHub repo](https://github.com/dfinity/candid)
- Candid specification: [candid-spec.md](candid-spec.md)

## Next steps

- **Start building:** [Quickstart](../getting-started/quickstart.md): deploy your first canister with icp-cli
- **Rust development:** [Rust language guide](../languages/rust/index.md)
- **Motoko development:** [Motoko language guide](../languages/motoko/index.md)

<!-- Upstream: informed by dfinity/portal — docs/building-apps/developer-tools/dev-tools-overview.mdx, docs/building-apps/developer-tools/icp-ninja.mdx, docs/building-apps/developer-tools/cdks/index.mdx, docs/tutorials/developer-liftoff/level-1/1.2-dev-env.mdx; dfinity/icp-cli — docs/telemetry.md, docs/guides/installation.md, docs/guides/creating-recipes.md, docs/guides/creating-templates.md; dfinity/candid — README.md; dfinity/icp-js-sdk-docs — core/latest.zip (agent, candid, principal, identity), auth/latest.zip, bindgen/latest.zip, pic-js/latest.zip -->
