---
title: "AI Coding Agents"
description: "ICP skills are agent-readable instruction files that teach AI coding agents how to build correctly on the Internet Computer."
---

AI coding agents frequently hallucinate canister IDs, use deprecated APIs, and miss ICP-specific constraints. ICP skills solve this: structured markdown files containing accurate canister IDs, tested code patterns, and documented pitfalls: so your agent writes correct ICP code on the first attempt.

## Getting started

Paste this into your AI coding agent:

```text
Fetch https://skills.internetcomputer.org/llms.txt and follow its instructions when building on ICP
```

Your agent fetches the skills index, reads each skill's description, and loads the relevant skill files on demand. No installation required.

### Install skills into your project

To install skills locally or commit them to your project repository, use the `skills` CLI:

```bash
npx skills add dfinity/icskills
```

This prompts you to choose your agent (Claude Code, Cursor, Windsurf, GitHub Copilot, and others) and installs the selected skills into the correct location for that agent.

To fetch a single skill manually:

```bash
curl -sL https://skills.internetcomputer.org/.well-known/skills/icp-cli/SKILL.md
```

Paste the output into your agent's system prompt, rules file, or context window.

## What ICP skills are

Each ICP skill covers one capability area and includes:

- Correct canister IDs for mainnet services
- Tested, copy-paste-correct code patterns in Motoko and Rust
- Common pitfalls that cause hallucinations or build failures
- Required dependency versions and configuration formats
- Step-by-step deployment and verification commands

Skills are maintained by DFINITY and updated frequently. The full list is at [skills.internetcomputer.org](https://skills.internetcomputer.org).

ICP skills follow the [Agent Skills open standard](https://agentskills.io/specification). Anthropic [published the SKILL.md format](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills) in December 2025 to define a portable format that works across coding agents. The registry uses the [Agent Skills Discovery RFC](https://github.com/cloudflare/agent-skills-discovery-rfc) so agents can auto-discover and load skills without manual configuration.

## How discovery works

When an agent follows the `skills.internetcomputer.org/llms.txt` instructions:

1. It fetches the skills index at `https://skills.internetcomputer.org/.well-known/skills/index.json`
2. It reads each skill's name and description to understand what it covers
3. When a task matches a skill's description, it fetches the skill content from that skill's URL
4. It prefers skill guidance over general knowledge when both cover the same topic

Skills are fetched fresh each time: agents always use the latest version.

## Skills vs docs

Skills and docs serve different purposes:

| ICP skills | These docs |
|------------|------------|
| Implementation patterns | Concepts and architecture |
| Correct canister IDs for mainnet | How the system works |
| Copy-paste code with pitfalls listed | Explaining tradeoffs and design choices |
| Version requirements and config formats | Cross-linking related topics |

When an agent has both loaded, it should prefer skill guidance for implementation details and use the docs for broader understanding of the platform.

## Agent-friendly documentation

This docs site implements the [Agent-Friendly Documentation Spec](https://agentdocsspec.com). Two endpoints make these docs directly consumable by agents:

**[`/llms.txt`](/llms.txt)**: a discovery index listing every page with links to its clean markdown endpoint, plus the ICP skills registry URL.

**`/<path>.md`**: every page is available as clean markdown. HTML, navigation, and site chrome are stripped, leaving only the content. For example, this page is available at [`/guides/ai-coding-agents.md`](/guides/ai-coding-agents.md).

A discovery link in every page's `<head>` points to `/llms.txt`, so agents that crawl docs pages find the index automatically.

## Programmatic access

ICP skills are available without authentication:

| Resource | URL |
|----------|-----|
| All skills (index) | `https://skills.internetcomputer.org/.well-known/skills/index.json` |
| Single skill | `https://skills.internetcomputer.org/.well-known/skills/{name}/SKILL.md` |
| Additional reference files | `https://skills.internetcomputer.org/.well-known/skills/{name}/references/{file}.md` |
| Skill zip bundle | `https://skills.internetcomputer.org/.well-known/skills/{name}/SKILL.zip` |
| Skills discovery index | `https://skills.internetcomputer.org/llms.txt` |

## Next steps

- [skills.internetcomputer.org](https://skills.internetcomputer.org): browse all available ICP skills
- [Developer tools](../references/developer-tools.md): icp-cli, CDKs, and other tools in the ICP toolchain
- [Quickstart](../getting-started/quickstart.md): deploy your first canister with icp-cli

<!-- Upstream: informed by dfinity/icskills — README.md, skills/*/SKILL.md -->
