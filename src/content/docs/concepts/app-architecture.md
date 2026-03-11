---
title: "App Architecture"
description: "How ICP applications are structured: frontend and backend canisters, request flow, and common patterns"
sidebar:
  order: 2
doc_type: explanation
level: beginner
last_verified: 2026-03-10
---

An ICP application typically consists of one or more canisters working together. This page explains the common architectural patterns and how the pieces fit together.

## The basic pattern

Most ICP apps have two parts:

- A **backend canister** that holds business logic and state.
- A **frontend canister** (asset canister) that serves the web UI.

```
┌─────────────┐      HTTPS       ┌──────────────────┐
│   Browser   │ ───────────────▶ │  Boundary Node   │
└─────────────┘                  └────────┬─────────┘
                                          │
                          ┌───────────────┼───────────────┐
                          │               │               │
                  ┌───────▼──────┐ ┌──────▼───────┐       │
                  │   Frontend   │ │   Backend    │       │
                  │  (assets)    │ │  (logic +    │       │
                  │              │ │   state)     │       │
                  └──────────────┘ └──────────────┘       │
                          │           Subnet              │
                          └───────────────────────────────┘
```

1. The browser loads the frontend from the asset canister (HTML, CSS, JS).
2. The frontend JavaScript uses an agent library (`@icp-sdk/core`) to make calls to the backend canister.
3. The backend canister processes the request and returns a response.

## Frontend canisters

The **asset canister** is a system-provided canister that serves static files over HTTP. When you deploy a frontend with `icp deploy`, `icp-cli` uploads your build output (e.g., from Vite, Next.js, or plain HTML) into the asset canister.

Key features:

- Serves files at `https://<canister-id>.icp0.io`.
- Supports custom domains.
- Provides **asset certification** — cryptographic proof that the content hasn't been tampered with.

See [Asset Canister](/guides/frontends/asset-canister/) for details.

## Backend canisters

Backend canisters are written in Rust, Motoko, or any language that compiles to WebAssembly. They expose two types of entry points:

| Entry point | Description |
|-------------|-------------|
| **Query** | Read-only, fast (no consensus), not certified by default |
| **Update** | Can modify state, goes through consensus, ~1-2s finality |

A backend canister holds both its code and its data in a single unit. There is no separate database — the canister's heap and stable memory *are* the database.

## Multi-canister applications

Larger applications split functionality across multiple canisters:

- **Horizontal scaling** — distribute users or data across multiple canisters of the same type when a single canister's memory (up to 400 GiB stable memory) or throughput isn't enough.
- **Separation of concerns** — a DeFi app might have separate canisters for the ledger, the swap logic, and the governance system.
- **Shared services** — canisters can call protocol canisters (Internet Identity, ICP Ledger) and other application canisters through inter-canister calls.

## Inter-canister calls

Canisters communicate through asynchronous message passing:

```rust
let (balance,): (Nat,) = call(
    ledger_canister_id,
    "icrc1_balance_of",
    (account,),
).await?;
```

Calls work the same whether the target canister is on the same subnet or a different one — the protocol handles routing transparently.

See [Inter-Canister Calls](/guides/inter-canister/calls/) for patterns and best practices.

## Agents: connecting off-chain clients

**Agent libraries** are the bridge between off-chain code (browsers, servers, scripts) and ICP canisters. They handle:

- Candid serialization/deserialization.
- Request signing with the caller's identity.
- Routing requests through boundary nodes.
- Polling for update call results.

| Library | Language | Package |
|---------|----------|---------|
| [ICP JS SDK](https://js.icp.build) | JavaScript / TypeScript | `@icp-sdk/core` |
| [ic-agent](https://docs.rs/ic-agent) | Rust | `ic-agent` |

## Common patterns

### Single-canister app

One backend canister, one frontend canister. Suitable for most small-to-medium applications.

```
icp new my-app --subfolder motoko
```

### Canister per user / per resource

Each user or resource gets its own canister, created dynamically by a "manager" canister. Used when you need isolation or per-user storage guarantees.

### Hub and spoke

A central orchestrator canister manages a fleet of worker canisters. The orchestrator routes requests and handles canister lifecycle (creation, upgrades).

## Further reading

- [Network Overview](/concepts/network-overview/) — subnets, nodes, and consensus
- [Canister Types](/concepts/canister-types/) — system, protocol, and application canisters
- [Canister Lifecycle](/guides/canisters/lifecycle/) — deploying and upgrading canisters
