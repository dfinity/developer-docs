---
title: "Quickstart"
description: "Install icp-cli, create a project, and deploy your first canister in under 10 minutes"
sidebar:
  order: 1
icskills: [icp-cli]
---

Deploy a full-stack app to a local Internet Computer network in under 10 minutes.

## Prerequisites

- [Node.js](https://nodejs.org/) LTS (v22+)

> **Windows users:** You also need [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/). Run all commands inside WSL.

## Install the tools

```bash
npm install -g @icp-sdk/icp-cli @icp-sdk/ic-wasm
```

This installs:

- **icp-cli** — builds and deploys canisters on the Internet Computer
- **ic-wasm** — optimizes WebAssembly modules for onchain deployment

For Motoko projects, also install the Motoko package manager:

```bash
npm install -g ic-mops
```

Verify everything is installed:

```bash
icp --version
ic-wasm --version
```

> **Alternative methods:** [Homebrew, shell scripts, and other options](https://dfinity.github.io/icp-cli/guides/installation/) are also available.

## Create a project

```bash
icp new my-project --subfolder hello-world \
  --define backend_type=motoko \
  --define frontend_type=react \
  --define network_type=Default && cd my-project
```

This creates a full-stack project from the `hello-world` template with a Motoko backend and React frontend. The `--define` flags skip interactive prompts — without them, `icp new` asks you to choose a template, language, and network type.

> **Prefer Rust?** Use `--define backend_type=rust` instead. You'll need Rust installed with the WASM target: `rustup target add wasm32-unknown-unknown`.

> **Backend only?** Use a language-specific template instead: `--subfolder rust` or `--subfolder motoko`. These templates have no frontend.

Your new project contains:

| Path | Description |
|------|-------------|
| `icp.yaml` | Project configuration — lists your canisters |
| `backend/` | Motoko source code with a `greet` function |
| `frontend/` | React app that calls the backend |

## Start a local network

```bash
icp network start -d
```

This starts a local Internet Computer replica in the background. The local network comes pre-funded — you can deploy immediately without setting up a wallet or acquiring cycles.

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

Open the **frontend URL** in your browser to see your app running. The **Candid UI URL** opens a web interface where you can test backend methods directly — try calling `greet` with your name.

## Call your canister

You can also interact with your backend from the terminal:

```bash
icp canister call backend greet '("World")'
```

Output: `("Hello, World!")`

The argument `'("World")'` uses [Candid](../reference/candid-spec.md) syntax — the interface description language for the Internet Computer. The outer single quotes are shell quoting; the Candid value itself is `("World")`. You can also omit the argument and `icp canister call` will prompt you interactively.

## Stop the network

When you're done developing:

```bash
icp network stop
```

## What's happening under the hood

The hello-world template deploys two [canisters](../concepts/canisters.md) — smart contracts that run on the Internet Computer:

1. **Backend canister** — Your Motoko code compiled to WebAssembly. It exposes a `greet` function through a [Candid](../reference/candid-spec.md) interface, making it callable from any client.

2. **Frontend canister** — An asset canister that serves your React app. It automatically provides the backend's canister ID to your frontend code via a cookie, so the two canisters can communicate without manual configuration.

The `icp.yaml` file ties everything together:

```yaml
canisters:
  - backend
  - frontend
```

Each canister name maps to a directory containing its own `canister.yaml` with build configuration (recipe, source files, etc.). icp-cli handles the rest — compiling, optimizing, deploying, and wiring up canister-to-canister discovery.

## Next steps

- [Project structure](project-structure.md) — Understand how icp-cli projects are organized
- [What next?](what-next.md) — Choose your path based on what you want to build
- [Concepts: Canisters](../concepts/canisters.md) — Learn what canisters are and how they work
- [Agentic development](../guides/tools/agentic-development.md) — Use AI agents to build on the Internet Computer
- [icp-cli documentation](https://dfinity.github.io/icp-cli/) — Full CLI reference and guides

<!-- Upstream: informed by dfinity/icp-cli docs/quickstart.md, docs/tutorial.md -->
