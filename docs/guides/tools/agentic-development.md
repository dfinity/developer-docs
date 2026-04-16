---
title: "Agentic Development"
description: "Use AI agents with icskills to build ICP applications faster and with fewer errors"
sidebar:
  order: 1
---

AI agents can build, deploy, and interact with Internet Computer applications using the same tools as human developers: `icp` for project management, icskills for implementation patterns, and the `llms.txt` discovery endpoint for navigating these docs programmatically. This page explains how to configure agents for ICP development and what resources are available.

## What icskills are

icskills are structured, agent-readable markdown files that teach AI agents how to build correctly on the Internet Computer. Each skill covers one capability area and includes:

- Correct canister IDs for mainnet services
- Tested, copy-paste-correct code patterns in Motoko and Rust
- Common pitfalls that cause hallucinations or build failures
- Required dependency versions and configuration formats
- Step-by-step deployment and verification commands

Skills exist because LLMs frequently hallucinate canister IDs, use deprecated APIs, and miss IC-specific constraints. A skill loaded into an agent's context prevents these errors by providing accurate ground truth for a specific integration area.

The skills registry is hosted at [skills.internetcomputer.org](https://skills.internetcomputer.org) and follows the [Agent Skills Discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc).

## Available skills

The following integration skills are published in the `dfinity/icskills` registry:

| Skill | What it covers |
|-------|----------------|
| `icp-cli` | icp.yaml config, recipes, environments, canister lifecycle, identity management |
| `asset-canister` | Frontend hosting, certified assets, SPA routing, content encoding |
| `canister-security` | Access control, reentrancy prevention, cycle drain protection, safe upgrades |
| `certified-variables` | Certified data API, Merkle trees, witness generation, frontend certificate validation |
| `ckbtc` | BTC deposit via minter, ckBTC transfers, withdrawal to BTC, subaccount derivation |
| `cycles-management` | Cycle balance checks, top-ups, freezing thresholds, ICP-to-cycles conversion |
| `custom-domains` | DNS configuration, `ic-domains` file, domain registration and validation via the HTTP gateway |
| `evm-rpc` | Ethereum/EVM calls from canisters via the EVM RPC canister |
| `https-outcalls` | HTTPS requests from canisters to external APIs, transform functions |
| `ic-dashboard` | Query the dashboard REST API for canister info, ledger data, network metrics |
| `icrc-ledger` | ICRC-1/ICRC-2 token transfers, balances, approve/transferFrom, ledger deployment |
| `internet-identity` | Passkey and OpenID login, delegation handling, principal-per-app isolation |
| `motoko` | Motoko language pitfalls, stable types, `mo:core` standard library |
| `multi-canister` | Inter-canister calls, canister factory pattern, async messaging pitfalls |
| `sns-launch` | SNS DAO configuration, token economics, governance parameters, testflight |
| `stable-memory` | StableBTreeMap, MemoryManager, persistent actors, upgrade hook patterns |
| `vetkd` | On-chain encryption with vetKeys, IBE encryption/decryption, transport keys |
| `wallet-integration` | ICRC signer standards (ICRC-21/25/27/29/49), wallet popup flows, consent messages |

The registry also includes tool skills like `canhelp`, which displays a human-readable summary of any mainnet canister's Candid interface. Browse the full list at [skills.internetcomputer.org](https://skills.internetcomputer.org).

Each skill is a self-contained markdown file. Skills can be loaded individually — you only need the skills relevant to your project.

## Installing skills

### CLI installation (recommended)

The `skills` CLI installs skill files directly into your agent's configuration directory:

```bash
npx skills add dfinity/icskills
```

This command prompts you to choose which agent you're configuring (Claude Code, Cursor, Windsurf, GitHub Copilot, and others), then installs the selected skills into the correct location for that agent.

### Manual installation

To fetch a single skill without the CLI:

```bash
curl -sL https://skills.internetcomputer.org/.well-known/skills/icp-cli/SKILL.md
```

Paste the output into your agent's system prompt, rules file, or context window. The files are plain markdown.

### Programmatic access

Skills are available via a machine-readable index:

| Resource | URL |
|----------|-----|
| All skills (index) | `https://skills.internetcomputer.org/.well-known/skills/index.json` |
| Single skill | `https://skills.internetcomputer.org/.well-known/skills/{name}/SKILL.md` |
| Additional reference files | `https://skills.internetcomputer.org/.well-known/skills/{name}/references/{file}.md` |
| Skill zip bundle | `https://skills.internetcomputer.org/.well-known/skills/{name}/SKILL.zip` |
| Skills discovery index for agents | `https://skills.internetcomputer.org/llms.txt` |

The index JSON follows the Agent Skills Discovery RFC format — agents that support this standard can auto-discover and load skills on demand.

## Configuring AI agents

### Claude Code

After running `npx skills add dfinity/icskills`, skill files are installed as `.claude/skills/*.md` in your project. Claude Code automatically reads files in `.claude/skills/` as part of its system context.

To load a skill manually in Claude Code, reference the skill file in a CLAUDE.md or in your session prompt:

```
Load .claude/skills/icp-cli/SKILL.md before generating any icp commands.
```

For batch projects with multiple skill areas, load each relevant skill at session start. The `icp-cli` skill is always useful — load it for every ICP project regardless of other skills.

### Cursor and Windsurf

Skills installed via `npx skills add dfinity/icskills` are placed in your agent's rules directory (`.cursor/rules/` for Cursor) or into Windsurf's Cascade context. The CLI handles placement automatically when you select your agent during installation.

### GitHub Copilot

The `npx skills add` CLI installs skills into the correct location for GitHub Copilot custom instructions automatically when you select Copilot during installation. The exact path depends on your Copilot version and workspace configuration.

## Agent-friendly documentation

This docs site implements the [Agent-Friendly Documentation Spec](https://agentdocsspec.com). Two endpoints make these docs directly consumable by agents:

**`/llms.txt`** — a discovery index listing every page with links to its clean markdown endpoint, plus the skills registry URL. Agents that support `llms.txt` can use this to discover all available documentation.

**`/<path>.md`** — every page in the docs is available as clean markdown at a `.md` URL. HTML, navigation, and site chrome are stripped, leaving only the page content. For example, this page is available at `/guides/tools/agentic-development.md`.

A `<link rel="help">` tag in every page's `<head>` points to `/llms.txt`, so agents that crawl docs pages discover the index automatically without prior knowledge of this endpoint.

To use these endpoints when querying ICP docs:

```bash
# Discover all available pages
curl -sL https://beta-docs.internetcomputer.org/llms.txt

# Fetch any page as clean markdown
curl -sL https://beta-docs.internetcomputer.org/guides/tools/agentic-development.md
```

Skills take priority over docs for implementation-level questions. Use skills for "how do I implement X" and use the docs for "what is X and how does it fit in the architecture."

## When to load which skill

Load skills based on what your project integrates. You do not need every skill — only the ones relevant to your build:

| If you are building... | Load these skills |
|------------------------|-------------------|
| Any IC project | `icp-cli` |
| Frontend dApp | `icp-cli`, `asset-canister`, `internet-identity` |
| Frontend dApp with custom domain | `icp-cli`, `asset-canister`, `custom-domains` |
| Token integration | `icp-cli`, `icrc-ledger` |
| Bitcoin integration | `icp-cli`, `ckbtc` |
| Cross-chain with Ethereum | `icp-cli`, `evm-rpc` |
| Multi-canister architecture | `icp-cli`, `multi-canister` |
| Secure canister | `icp-cli`, `canister-security` |
| DAO / governance | `icp-cli`, `sns-launch` |
| Encrypted data | `icp-cli`, `vetkd`, `certified-variables` |

If in doubt, start with `icp-cli` and add domain-specific skills as you encounter relevant integration points.

## Skills vs docs: how they complement each other

Skills and docs serve different purposes:

| Skills | Docs |
|--------|------|
| Implementation patterns | Concepts and architecture |
| Correct canister IDs for mainnet | How the system works |
| Copy-paste code with pitfalls listed | Explaining tradeoffs and design choices |
| Version requirements and config formats | Cross-linking related topics |

When an agent has both loaded, it should prefer skill guidance for implementation details (exact API names, canister IDs, required config fields) and use the docs for broader understanding (why the system works this way, what to build next).

## Next steps

- [skills.internetcomputer.org](https://skills.internetcomputer.org) — browse all available skills and their descriptions
- [Developer tools overview](overview.md) — icp-cli, CDKs, and other tools in the ICP toolchain
- [Quickstart](../../getting-started/quickstart.md) — deploy your first canister with icp-cli
- [Migrating from dfx](migrating-from-dfx.md) — upgrade an existing project from the legacy dfx tool

<!-- Upstream: informed by dfinity/icskills — README.md, skills/*/SKILL.md -->
