---
title: "Quickstart"
description: "Install icp-cli, create a project, and deploy your first canister in under 10 minutes"
sidebar:
  order: 1
---

Deploy a fullstack app to a local Internet Computer network in under 10 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) LTS (v22+)

> **Windows users:** You also need [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/). Run all commands inside WSL.

## Install the tools

```bash
npm install -g @icp-sdk/icp-cli @icp-sdk/ic-wasm
```

This installs:

- **icp-cli**: builds and deploys [canisters](../concepts/canisters.md) on the Internet Computer
- **ic-wasm**: optimizes WebAssembly modules for deployment to the network

For Motoko projects, also install the Motoko package manager:

```bash
npm install -g ic-mops
```

Verify everything is installed:

```bash
icp --version
ic-wasm --version
```

> **Alternative methods:** [Homebrew, shell scripts, and other options](https://cli.internetcomputer.org/0.2/guides/installation) are also available.

## Create a project

```bash
icp new hello-icp --subfolder hello-world --silent && cd hello-icp
```

This creates a fullstack project from the [`hello-world` template](https://github.com/dfinity/icp-cli-templates/tree/main/hello-world) with a Motoko backend and React frontend. `--silent` skips the interactive prompt and applies the template's default values. To use different values, add `--define <placeholder>=<value>` (for example, `--define backend_type=rust`). See the [template placeholders](https://github.com/dfinity/icp-cli-templates/blob/main/hello-world/cargo-generate.toml) for all available options.

> **Prefer Rust?** Add `--define backend_type=rust` to the command. You'll also need Rust installed with the WASM target: `rustup target add wasm32-unknown-unknown`.

> **Backend only?** Use a language-specific template instead: `--subfolder rust` or `--subfolder motoko`. These templates have no frontend.

Your new project contains:

| Path | Description |
|------|-------------|
| `icp.yaml` | Project configuration: lists your canisters |
| `backend/` | Motoko source code with a `greet` function |
| `frontend/` | React app that calls the backend |

## Start a local network

```bash
icp network start -d
```

This starts a local Internet Computer replica in the background. The local network comes pre-funded. You can deploy immediately without setting up a wallet or acquiring [cycles](../concepts/cycles.md).

## Deploy

```bash
icp deploy
```

This single command builds your Motoko code into WebAssembly, compiles the React frontend, creates canisters on the local network, and installs your code. When it finishes, you'll see output like:

```
Deployed canisters:
  backend (Candid UI): http://...localhost:8000/?id=...
  frontend: http://...localhost:8000
```

Open the **frontend URL** in your browser to see your app running. The **Candid UI URL** opens a web interface where you can test backend methods directly. Try calling `greet` with your name.

## Call your canister

You can also interact with your backend from the terminal:

```bash
icp canister call backend greet '("World")'
```

Output: `("Hello, World!")`

The argument `'("World")'` uses [Candid](../references/candid-spec.md) syntax (the interface description language for the Internet Computer). The outer single quotes are shell quoting; the Candid value itself is `("World")`. You can also omit the argument and `icp canister call` will prompt you interactively.

## Stop the network

When you're done developing:

```bash
icp network stop
```

## What's happening under the hood

The hello-world template deploys two [canisters](../concepts/canisters.md) that run on the Internet Computer:

1. **Backend canister**: Your Motoko code compiled to WebAssembly. It exposes a `greet` function through a [Candid](../references/candid-spec.md) interface, making it callable from any client.

2. **Frontend canister**: An asset canister that serves your React app. It automatically provides the backend's canister ID to your frontend code via a cookie, so the two canisters can communicate without manual configuration.

The `icp.yaml` file ties everything together:

```yaml
canisters:
  - backend
  - frontend
```

Each canister name maps to a directory containing its own `canister.yaml` with build configuration (recipe, source files, etc.). icp-cli handles the rest: compiling, optimizing, deploying, and wiring up canister-to-canister discovery.

## Next steps

- [Project structure](project-structure.md): understand how icp-cli projects are organized
- [Choose your path](choose-your-path.md): pick a development path based on what you want to build
- [Concepts: Canisters](../concepts/canisters.md): learn what canisters are and how they work
- [AI coding agents](../guides/ai-coding-agents.md): use ICP skills to build on the Internet Computer with AI
- [icp-cli documentation](https://cli.internetcomputer.org/0.2/): full CLI reference and guides

<!-- Upstream: informed by dfinity/icp-cli docs/quickstart.md, docs/tutorial.md -->
