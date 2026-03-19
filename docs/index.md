---
title: "ICP Developer Docs"
description: "Build tamperproof full-stack applications on the Internet Computer -- no cloud, no bridges, no external dependencies"
sidebar:
  order: 0
icskills: []
---

# Build on the Internet Computer

Build full-stack applications that run entirely onchain -- frontend, backend, and data -- with no cloud dependencies. The Internet Computer (ICP) is a network of independent nodes that provides tamperproof execution, certified storage, and native cross-chain integration.

Your code runs as **canisters**: smart contracts that serve HTTP responses, hold persistent state, sign transactions for Bitcoin and Ethereum, and pay for their own compute so your users never see a gas fee.

## Get started in under 10 minutes

[Start the quickstart](getting-started/quickstart.md) to install icp-cli, create a project, and deploy your first canister.

## When to build on ICP

ICP is a strong fit when your application needs:

- **Tamperproof execution** -- code runs exactly as deployed, verifiable by anyone
- **Censorship resistance** -- no single entity can take your app offline
- **No vendor lock-in** -- no cloud account, no API keys, no terms of service changes
- **Cross-chain interop** -- native Bitcoin/Ethereum signing without bridges
- **User-friendly onboarding** -- no wallet or gas fees required for end users

## What makes ICP different

### Chain-key cryptography
Canisters can sign transactions for Bitcoin, Ethereum, and other chains using threshold signatures -- no bridges or oracles required. [Learn more](concepts/chain-key-cryptography.md)

### Orthogonal persistence
Canister memory survives across executions and upgrades. No databases, no serialization -- just use variables. [Learn more](concepts/orthogonal-persistence.md)

### Reverse gas model
Users never pay gas. Canisters pay for their own compute, storage, and bandwidth using **cycles**. [Learn more](concepts/reverse-gas-model.md)

### Autonomous execution
Canisters can schedule their own execution with timers -- no external cron jobs, keepers, or off-chain bots. [Learn more](concepts/timers.md)

### Web-native smart contracts
Canisters serve HTTP responses directly. Host full web applications -- frontend and backend -- entirely onchain. [Learn more](concepts/app-architecture.md)

### Chain Fusion
Natively interact with Bitcoin, Ethereum, Solana, and other blockchains from ICP canisters. [Learn more](concepts/chain-fusion.md)

## Documentation sections

### [Getting Started](getting-started/quickstart.md)
Install tools, create your first project, deploy a canister, and choose your path forward.

### [Guides](guides/index.md)
Task-oriented how-to guides organized by development stage: backends, frontends, authentication, testing, production, chain fusion, DeFi, governance, and security.

### [Concepts](concepts/index.md)
Developer-focused explanations of ICP architecture, capabilities, and design decisions.

### [Languages](languages/index.md)
Language-specific guides for Rust and Motoko, including stable structures, testing, and CDK reference.

### [Reference](reference/index.md)
Specifications, canister IDs, token standards, cycle costs, execution errors, and glossary.

## AI-assisted development

ICP has first-class support for AI-assisted development. Install [icskills](https://skills.internetcomputer.org) to give your AI agent deep knowledge of ICP patterns:

```bash
npx skills add dfinity/icskills
```

[Set up agentic development](guides/tools/agentic-development.md)

## External resources

| Resource | Description |
|----------|-------------|
| [icp-cli](https://cli.internetcomputer.org/) | Command-line tool for ICP development |
| [JS SDK](https://js.icp.build) | JavaScript/TypeScript libraries for ICP |
| [icskills](https://skills.internetcomputer.org) | AI agent skill files for ICP development |
| [Learn Hub](https://learn.internetcomputer.org) | Deep protocol-level explanations |
| [Motoko core library](https://mops.one/core/docs) | Motoko core library documentation |
| [Rust CDK](https://docs.rs/ic-cdk/latest/ic_cdk/) | Rust canister development kit API reference |
