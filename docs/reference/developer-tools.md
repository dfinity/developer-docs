---
title: "Developer Tools"
description: "Overview of the ICP developer toolchain: icp-cli, CDKs, JS SDK, PocketIC, and more"
sidebar:
  order: 0
---

Developer tools are used to create, manage, and interact with canisters. ICP provides tooling across several categories: command-line tools, canister development kits (CDKs), client libraries, testing tools, browser-based IDEs, and Candid tooling.

## Command-line tools

### icp-cli

`icp-cli` is the primary tool for building and deploying applications on the Internet Computer ([full documentation](https://cli.internetcomputer.org/)). It manages the full development lifecycle: creating projects, building canisters, deploying to local or mainnet environments, managing identities, and handling cycles and ICP tokens.

Key features:
- **Recipes**: reusable, versioned build templates for Rust, Motoko, and asset canisters
- **Environments**: named deployment targets that combine a network, canister set, and settings (e.g., local, staging, production)
- **Project scaffolding**: `icp new` bootstraps new projects from official templates

Install via npm (requires Node.js LTS):

```bash
npm install -g @icp-sdk/icp-cli @icp-sdk/ic-wasm
```

Or via Homebrew:

```bash
brew install icp-cli
brew install ic-wasm
```

Both install `ic-wasm` alongside `icp-cli`. `ic-wasm` optimizes and annotates Wasm modules: it shrinks binary size, embeds Candid metadata, and strips unused sections. The official Rust and Motoko recipes run it automatically — you only need to invoke it directly when writing custom build steps.

Verify:

```bash
icp --version
```

For advanced users, icp-cli supports authoring custom recipes and project templates:
- [Creating recipes](https://cli.internetcomputer.org/guides/creating-recipes): encode build conventions as reusable Handlebars templates
- [Creating templates](https://cli.internetcomputer.org/guides/creating-templates): scaffold new projects with `icp new`

Coming from dfx? See the [migration guide](https://cli.internetcomputer.org/0.2/migration/from-dfx) on the CLI docs.

#### Telemetry opt-out

`icp` collects anonymous usage data (command names, platform, version, success/failure) to help prioritize features. No personally identifiable information, project names, file paths, or canister IDs are collected.

To opt out:

```bash
icp settings telemetry false
```

Or set `DO_NOT_TRACK=1` in your environment. Telemetry is automatically disabled in CI when the `CI` environment variable is set.

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

The ICP JavaScript SDK (`@icp-sdk`) provides TypeScript and JavaScript libraries for building frontends and scripts that interact with canisters. Full documentation is at [js.icp.build](https://js.icp.build).

| Package | Purpose |
|---------|---------|
| `@icp-sdk/core/agent` | Send update and query calls to canisters; manage actors |
| `@icp-sdk/core/candid` | Encode and decode Candid values |
| `@icp-sdk/core/principal` | Work with canister and user principal identifiers |
| `@icp-sdk/core/identity` | Manage signing identities |
| `@icp-sdk/auth` | Authentication client for Internet Identity |
| `@icp-sdk/bindgen` | Generate TypeScript bindings from a Candid interface file |

Install:

```bash
npm install @icp-sdk/core
```

`@icp-sdk/bindgen` is also available as a Vite plugin and a standalone CLI tool. The official project templates wire it up automatically: generated bindings appear in `src/declarations/` after each build.

## Testing tools

### PocketIC

[PocketIC](../guides/testing/pocket-ic.md) is a lightweight, deterministic testing library for canister integration tests. It runs an in-process IC replica: no daemon, no ports, no Docker required. Tests execute synchronously, making them fast and fully reproducible. The `icp-cli` local development network uses PocketIC under the hood.

Client libraries:

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
