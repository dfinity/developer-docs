---
title: "Project Structure"
description: "Understand what icp-cli generated and how an ICP project is organized"
sidebar:
  order: 2
doc_type: explanation
level: beginner
last_verified: 2026-03-10
---

After running `icp new`, you get a ready-to-deploy project. This page explains what each file and directory does.

## Directory layout

A typical project created with `icp new` looks like this:

```
my-project/
├── icp.yaml                  # Project configuration (the central file)
├── src/
│   └── canisters/
│       ├── backend/
│       │   ├── canister.yaml # Canister-specific config
│       │   └── main.mo       # Backend source code (Motoko)
│       └── frontend/
│           ├── canister.yaml # Canister-specific config
│           ├── src/          # Frontend application code
│           └── package.json
├── environments/             # Optional environment configs
│   ├── dev.yaml
│   └── production.yaml
└── networks/                 # Optional network configs
```

## icp.yaml

This is the root configuration file. It defines your canisters, networks, and environments.

A minimal `icp.yaml` using a recipe:

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/rust@v3.2.0"
      configuration:
        package: backend
```

In generated projects, canisters are typically referenced by directory rather than defined inline:

```yaml
canisters:
  - canisters/*    # discovers canister.yaml files in src/canisters/
```

Each canister directory contains a `canister.yaml` that defines its build steps, dependencies, and configuration.

### Key sections

| Section | Purpose |
|---------|---------|
| `canisters` | What to build and deploy. Can be inline definitions, file references, or glob patterns. |
| `networks` | Where to deploy. Two implicit networks exist: `local` (managed local replica) and `ic` (mainnet). |
| `environments` | Named deployment targets that map to networks. Defaults: `local` and `ic`. |

## Motoko vs. Rust projects

The project structure is the same for both languages. The difference is in the backend canister:

**Motoko project:**
- Source file: `main.mo`
- Package manager: [Mops](https://mops.one/) (`mops.toml` for dependencies)
- Build: handled by the `@dfinity/motoko` recipe

**Rust project:**
- Source file: `lib.rs` inside a standard Cargo project
- Package manager: Cargo (`Cargo.toml` for dependencies)
- Build: `cargo build --target wasm32-unknown-unknown --release`
- Requires the `wasm32-unknown-unknown` target (`rustup target add wasm32-unknown-unknown`)

Both use `ic-wasm` for post-processing the compiled Wasm (optimization, metadata injection, size reduction).

## The .icp directory

After building and deploying, icp-cli creates a `.icp/` directory:

```
.icp/
├── cache/              # Safe to delete; recreated automatically
│   ├── artifacts/      # Built Wasm files
│   ├── mappings/       # Canister IDs for local networks
│   └── networks/       # Local network state
└── data/
    └── mappings/       # Canister IDs for connected networks (mainnet)
```

**Important:** Do not delete `.icp/data/`. It contains your mainnet canister ID mappings. If lost, you will need to manually look up your canister IDs on the [IC dashboard](https://dashboard.internetcomputer.org/).

Add this to your `.gitignore`:

```
.icp/cache/
```

Consider tracking `.icp/data/` in version control to preserve mainnet canister ID mappings across your team.

## Inspecting effective configuration

To see the fully resolved configuration (after all file references, globs, and defaults are merged):

```bash
icp project show
```

## Further reading

- [icp-cli project model](https://dfinity.github.io/icp-cli/concepts/project-model/) -- full details on configuration, discovery, and consolidation
- [icp-cli configuration reference](https://dfinity.github.io/icp-cli/reference/configuration/) -- all configuration options
