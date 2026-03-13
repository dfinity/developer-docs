---
title: "Application Architecture"
description: "How ICP applications are structured: canisters, frontends, and inter-canister communication"
sidebar:
  order: 2
icskills: [multi-canister]
---

An application on the Internet Computer typically consists of one or more [canisters](canisters.md) that handle backend logic, store data, and optionally serve a web frontend — all without external servers, databases, or CDNs. This page explains how these pieces fit together and what architectural patterns are available as your application grows.

## The default two-canister model

Most ICP applications start with two canisters:

- **Backend canister** — contains your application logic and data. You write it in Motoko, Rust, TypeScript, or Python, and the network compiles and runs it as WebAssembly.
- **Frontend (asset) canister** — serves your web UI. It is a special system-provided canister that hosts static files (HTML, CSS, JavaScript, images) and delivers them over HTTP.

When a user opens your application in a browser:

1. The browser sends an HTTPS request to a [boundary node](network-overview.md).
2. The boundary node routes the request to the frontend canister, which returns the HTML and JavaScript.
3. The JavaScript uses an agent library (like `@dfinity/agent`) to send messages to the backend canister.
4. The backend canister processes the message, updates its state if needed, and returns a response.
5. The frontend renders the result.

This flow replaces the traditional web stack. There is no separate web server, application server, or database — the backend canister handles all three roles, and the frontend canister replaces your CDN.

## How ICP compares to traditional architectures

| Concern | Traditional web app | ICP application |
|---------|-------------------|-----------------|
| **Compute** | Application server (Node, Django, etc.) | Backend canister (Wasm) |
| **Storage** | Database (Postgres, MongoDB, etc.) | Canister stable memory (up to 500 GiB) |
| **Frontend hosting** | CDN + static file server | Asset canister |
| **Authentication** | OAuth provider or custom auth | [Internet Identity](../guides/authentication/internet-identity.md) (passkey-based) |
| **Scheduled tasks** | Cron jobs, worker queues | Canister timers |
| **External API calls** | Server-side HTTP requests | [HTTPS outcalls](https-outcalls.md) |
| **Infrastructure management** | You manage servers, scaling, uptime | The network handles replication and availability |

The key difference: ICP applications are self-contained. You deploy code and data to canisters, and the network provides compute, storage, and serving. There is no infrastructure to provision or maintain.

## Coming from Ethereum

If you have built on Ethereum or other EVM chains, here is how ICP concepts map:

| Ethereum | ICP | Key difference |
|----------|-----|----------------|
| Smart contract | [Canister](canisters.md) | Canisters hold GiBs of state, serve HTTP, run Wasm |
| EVM bytecode | WebAssembly | Wasm runs general-purpose code at near-native speed |
| Solidity / Vyper | Motoko, Rust, TypeScript, Python | Multiple language options, full standard libraries |
| Block time (~12s) | Finality (~1–2s) | Update calls finalize in 1–2 seconds |
| Gas (user pays) | [Cycles](reverse-gas-model.md) (canister pays) | Users interact for free; developers fund computation |
| No HTTP serving | Built-in HTTP serving | Canisters serve web pages directly |
| Off-chain storage (IPFS, etc.) | On-chain stable memory | Up to 500 GiB per canister, no external storage needed |
| Bridges / oracles | [Chain-key signing](chain-fusion.md) | Canisters sign transactions on other chains natively |
| Immutable by default | Upgradeable by default | Canisters can be upgraded while preserving state |

The biggest shift: on Ethereum, smart contracts are minimal programs that rely on off-chain infrastructure for anything beyond basic state transitions. On ICP, a canister can be an entire application — frontend, backend, database, and scheduled jobs — all on-chain.

## Architectural patterns

As your application grows, you can choose from several patterns. Start simple and evolve as needed — over-architecting from the start is a common mistake.

### Single canister

Everything — assets, logic, and data — lives in one canister. This is the simplest architecture and works well for applications serving up to thousands of users.

**When to use:** prototypes, personal tools, simple dapps, or applications where data and compute fit comfortably within a single canister's limits.

### Canister-per-service (default)

Separate canisters handle distinct responsibilities. The default two-canister setup (frontend + backend) is the simplest form. You can add more canisters as responsibilities grow: one for user data, one for content, one for payments.

**When to use:** most production applications. This is the recommended starting point.

**Things to know:**
- Inter-canister calls are asynchronous. Code before and after an `await` executes in separate message rounds — this affects atomicity.
- Request and response payloads are limited to 2 MiB per call.
- Cross-subnet calls add one consensus round of latency compared to same-subnet calls.

For implementation details and common pitfalls, see [Onchain calls](../guides/canister-calls/onchain-calls.md).

### Canister-per-subnet

For maximum throughput, distribute canisters across multiple [subnets](network-overview.md). Each subnet processes messages independently, so spreading load across subnets lets your application scale horizontally.

**When to use:** high-throughput applications that exceed what a single subnet can handle (thousands of concurrent users, heavy computation).

**Trade-offs:** cross-subnet calls have higher latency and bandwidth limits. You need to design data partitioning carefully.

### Canister-per-user

Each user gets their own canister, giving them direct control over their data. A factory canister creates and manages individual user canisters.

**When to use:** applications where users need full sovereignty over their data and compute. This is the most complex pattern and is still an emerging area.

**Trade-offs:** managing thousands of canisters requires careful cycle management and upgrade coordination. The factory canister must provision enough cycles for each new canister.

## Data storage

Canisters store data in [stable memory](../guides/backends/stable-memory.md) — there is no external database. Libraries provide familiar data-structure abstractions on top of raw stable memory:

- **Motoko:** the [`core` standard library](https://mops.one/core/docs) includes persistent data structures that survive upgrades automatically.
- **Rust:** [`ic-stable-structures`](https://docs.rs/ic-cdk/latest/ic_cdk/) provides `StableBTreeMap` and other structures for stable memory.

For small to medium datasets, stable memory is straightforward. For applications with large data volumes (hundreds of GiB), see the [canister-per-service](#canister-per-service-default) or [canister-per-subnet](#canister-per-subnet) patterns to distribute storage across canisters.

## Frontend options

Not every ICP application needs the default asset canister. Your options:

- **Asset canister** — the standard approach. Deploy your built frontend (React, Svelte, vanilla JS, etc.) to an asset canister that serves it over HTTP. See [Asset canister](../guides/frontends/asset-canister.md).
- **Framework-specific canister** — use a framework like Juno that provides a more opinionated hosting solution on ICP.
- **Off-chain frontend** — host your frontend on traditional infrastructure (Vercel, Netlify, etc.) and call ICP canisters from JavaScript using `@dfinity/agent`. Useful during migration or when you need features that asset canisters don't support.
- **No frontend** — backend-only canisters that expose a Candid API for other canisters or CLI tools to call.

## Choosing an architecture

| Question | If yes | If no |
|----------|--------|-------|
| Is this a prototype or simple tool? | [Single canister](#single-canister) | Keep reading |
| Does the app have a web UI? | Add an [asset canister](#the-default-two-canister-model) | Backend-only canister |
| Do you need to separate concerns (auth, storage, compute)? | [Canister-per-service](#canister-per-service-default) | Stick with two canisters |
| Do you need to scale beyond one subnet? | [Canister-per-subnet](#canister-per-subnet) | Stay on one subnet |
| Do users need sovereignty over their data? | [Canister-per-user](#canister-per-user) | Use shared canisters |

Start with the simplest architecture that meets your requirements. You can always split a canister into multiple canisters later — it is much harder to merge canisters that were split prematurely.

## What's next

- [Quickstart](../getting-started/quickstart.md) — deploy your first application
- [Onchain calls](../guides/canister-calls/onchain-calls.md) — inter-canister communication patterns
- [Asset canister](../guides/frontends/asset-canister.md) — frontend deployment
- [Canisters](canisters.md) — canister internals

<!-- Upstream: informed by dfinity/portal docs/building-apps/best-practices/application-architectures.mdx, docs/building-apps/getting-started/app-architecture.mdx -->
