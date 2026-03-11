---
title: "Quickstart"
description: "Install icp-cli and deploy your first canister in under 5 minutes"
sidebar:
  order: 1
doc_type: tutorial
level: beginner
last_verified: 2026-03-10
---

## Prerequisites

- [Node.js](https://nodejs.org/) (LTS)
- **Windows users:** Install [WSL](https://learn.microsoft.com/en-us/windows/wsl/install) and [Docker Desktop](https://docs.docker.com/desktop/setup/install/windows-install/), then run all commands inside WSL.

## 1. Install icp-cli

```bash
npm install -g @icp-sdk/icp-cli @icp-sdk/ic-wasm
```

For Motoko projects, also install the Mops package manager:

```bash
npm install -g ic-mops
```

For Rust projects, ensure you have Rust installed with the Wasm target:

```bash
rustup target add wasm32-unknown-unknown
```

Verify the installation:

```bash
icp --version
```

> See the [icp-cli installation guide](https://dfinity.github.io/icp-cli/guides/installation/) for Homebrew, shell script, and other install methods.

## 2. Create a project

```bash
icp new my-project --subfolder hello-world \
  --define backend_type=motoko \
  --define frontend_type=react \
  --define network_type=Default
cd my-project
```

This scaffolds a full-stack project with a Motoko backend and a React frontend.

## 3. Deploy locally

```bash
icp network start -d
icp deploy
```

The output shows the local URLs for your backend and frontend canisters. Open the frontend URL in your browser to see the app.

## 4. Call your canister

```bash
icp canister call backend greet '("World")'
```

You should see `("Hello, World!")`.

## 5. Deploy to mainnet

When you are ready to go live:

```bash
icp deploy --environment ic
```

This deploys to the Internet Computer mainnet. You will need cycles to pay for canister computation and storage. See the [icp-cli mainnet deployment guide](https://dfinity.github.io/icp-cli/guides/deploying-to-mainnet/) for details on acquiring cycles and managing identities.

## Clean up

```bash
icp network stop
```

## Next steps

- [Project structure](/getting-started/project-structure/) -- understand what was generated
- [Agentic development](/getting-started/agentic-development/) -- use AI agents for ICP development
- [icp-cli CLI reference](https://dfinity.github.io/icp-cli/reference/cli/) -- all available commands
