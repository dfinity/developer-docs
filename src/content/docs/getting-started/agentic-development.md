---
title: "Agentic Development"
description: "Set up AI agents for ICP development with icskills"
sidebar:
  order: 3
doc_type: tutorial
level: beginner
icskills: [icp-cli]
last_verified: 2026-03-10
---

AI coding agents can build on the Internet Computer, but they often hallucinate canister IDs, use deprecated APIs, or miss critical pitfalls. **icskills** solves this by giving your agent structured, tested instructions for every IC capability.

## What are icskills?

Each skill is a single Markdown file containing everything an AI agent needs to build correctly: prerequisites, common pitfalls, tested code examples, and deployment steps. When your agent loads a skill, it follows proven patterns instead of guessing.

## Install skills

icskills works with 40+ AI agents including Claude Code, Cursor, Windsurf, and GitHub Copilot.

```bash
npx skills add dfinity/icskills
```

This launches an interactive picker where you select which skills to install and which agent to configure. The CLI places the skill files where your agent expects to find them.

## Available skills

| Skill | What it covers |
|-------|---------------|
| `icp-cli` | Project setup, building, deploying, and managing canisters with icp-cli |
| `internet-identity` | Passkey and OpenID login, delegation handling, principal-per-app isolation |
| `wallet-integration` | Connect wallets (Plug, OISY, etc.) via ICRC-25/ICRC-49 signer standards |
| `icrc-ledger` | ICRC-1/ICRC-2 token transfers, balances, approve/transferFrom, local test ledger |
| `ckbtc` | Chain-key Bitcoin: BTC deposits, ckBTC transfers, BTC withdrawals |
| `evm-rpc` | Call Ethereum/EVM chains from canisters via the EVM RPC canister |
| `https-outcalls` | Make HTTPS requests from canisters to external APIs |
| `stable-memory` | Persist state across upgrades with StableBTreeMap and MemoryManager |
| `multi-canister` | Inter-canister calls, factory pattern, async messaging pitfalls |
| `cycles-management` | Cycle balance checks, top-ups, freezing thresholds, canister creation |
| `canister-security` | Access control, reentrancy prevention, async safety, upgrade patterns |
| `certified-variables` | Serve verified query responses with Merkle trees and BLS signatures |
| `asset-canister` | Deploy frontends, SPA routing, custom domains, certified assets |
| `vetkd` | On-chain encryption with verifiable encrypted threshold key derivation |
| `sns-launch` | Configure and launch an SNS DAO for dapp decentralization |
| `ic-dashboard` | Query the public dashboard REST APIs for canister and network data |

## Using skills with your agent

### Claude Code

After running `npx skills add dfinity/icskills`, skills are installed to your project's `.claude/` directory. Claude Code reads them automatically as part of its context.

### Cursor

Skills are installed to `.cursor/rules/`. Cursor loads these as project-level rules that guide code generation.

### Windsurf

Skills are installed to `.windsurf/rules/`. Windsurf uses them as project context for AI suggestions.

### GitHub Copilot

Skills are installed to `.github/copilot-instructions.md` or the `.github/instructions/` directory, depending on your setup.

### Manual installation

You can also fetch any skill directly:

```bash
curl -sL https://raw.githubusercontent.com/dfinity/icskills/main/skills/ckbtc/SKILL.md
```

Paste the contents into any system prompt, rules file, or context window your agent supports.

## Programmatic access

For tooling integrations, icskills provides machine-readable endpoints:

- **Skill index:** [skills.internetcomputer.org/llms.txt](https://skills.internetcomputer.org/llms.txt)
- **All skills (full text):** [skills.internetcomputer.org/llms-full.txt](https://skills.internetcomputer.org/llms-full.txt)
- **Skills discovery API:** [skills.internetcomputer.org/.well-known/skills/index.json](https://skills.internetcomputer.org/.well-known/skills/index.json)

## Further reading

- [Browse all skills](https://skills.internetcomputer.org) -- interactive skill browser
- [icskills on GitHub](https://github.com/dfinity/icskills) -- source and contribution guide
