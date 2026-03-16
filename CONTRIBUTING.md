# Contributing to ICP Developer Docs

## Quick start

```bash
npm install
npm run dev      # Start dev server at localhost:4321
npm run build    # Production build
```

> **Important:** This file covers content format and contribution mechanics. For boundary rules — what always applies, what needs approval, and what is prohibited — see [AGENTS.md](AGENTS.md). Those rules apply to all contributors, not just AI agents.

## Content format

All documentation is plain Markdown (`.md`). No `.mdx` files. No JSX components.

Files live in `docs/` (project root) and follow the site map defined in `astro.config.mjs`. Astro reads them via a symlink at `src/content/docs/`.

## Frontmatter schema

Every `.md` file in `docs/` must have this frontmatter:

```yaml
---
title: "Page Title"                           # Required
description: "One-line description"           # Required
sidebar:
  order: 1                                    # Optional: only where reading order matters
icskills: [ckbtc, evm-rpc]                    # Optional: related icskills skill files
---
```

### Field reference

| Field | Required | Values | Notes |
|-------|----------|--------|-------|
| `title` | Yes | string | Page title |
| `description` | Yes | string | Used in search, llms.txt, and meta tags |
| `icskills` | No | string array | Related skill files from github.com/dfinity/icskills |
| `sidebar.order` | No | number | Controls position within auto-generated sidebar sections. Only set where reading order matters (e.g., getting-started tutorials). Omit to use alphabetical order. |

## Writing guidelines

### Content types (Diataxis)

Each top-level section has a specific purpose. Match your content accordingly:

| Section | Type | Purpose | CLI commands? |
|---------|------|---------|---------------|
| `concepts/` | Explanation | What it is, how it works, why it matters | No — link to guides |
| `getting-started/` | Tutorial | Step-by-step learning path | Yes — complete and linear |
| `guides/` | How-to | Task-oriented instructions | Yes — where relevant |
| `reference/` | Reference | Lookup information | Sparingly — for syntax examples only |

### Do
- Write in plain, direct language
- Use icp-cli commands for all CLI examples
- Make code examples self-contained and copy-pasteable
- Link to external docs for tool-specific details (see AGENTS.md linking rules)
- Link to icskills skill files where they provide implementation details
- Use standard markdown features (code blocks, tables, links, headings)
- Use relative paths with `.md` extension for internal links (e.g., `[Quickstart](../getting-started/quickstart.md)`) — works on both the Astro site and GitHub

### Don't
- Reference `dfx` — it is deprecated. CI will reject it.
- Use `.mdx` files or JSX components
- Duplicate content that lives in external docs (icp-cli, JS SDK, icskills)
- Nest sidebar items more than 3 levels deep
- Add images without alt text
- Write for a specific framework version — always describe "latest"

### icp-cli command embedding

- **CLI-focused guides** (install, deploy, identity) → belong in icp-cli docs, link from here
- **Concept-focused guides** → inline relevant `icp` commands, link to full icp-cli guide
- **Missing icp-cli guide** → create in icp-cli repo first, then link from here

## Images

Images live in `src/assets/images/`, organized by docs section:

```
src/assets/images/
├── concepts/          # Concept diagrams
├── getting-started/   # Tutorial visuals
├── guides/            # Guide diagrams, organized by subsection
│   ├── canisters/
│   ├── frontends/
│   └── ...
└── reference/         # Reference diagrams
```

**Rules:**
- Use descriptive kebab-case filenames (e.g., `canister-internals.png`, `create-canister-flow.png`)
- Always include alt text: `![Canister internals](../../assets/images/concepts/canister-internals.png)`
- Prefer SVG for diagrams (scalable, smaller). Use PNG for hand-drawn illustrations and screenshots.
- When carrying over portal images, keep the existing hand-drawn visual style
- Decide case-by-case during content writing whether a portal image is worth carrying over
- Portal images are in `portal/static/img/docs/` — copy and rename to match the new structure

## Agent-friendly documentation

The build generates `/llms.txt` and per-page `.md` endpoints from your content. This is automatic — no extra work needed when writing pages. However:

- **Frontmatter `description`** is used as the page summary in `llms.txt` — write clear, useful descriptions
- **Adding a new sidebar section** in `astro.config.mjs` requires updating the `SECTIONS` array in `plugins/astro-agent-docs.mjs` to match, otherwise pages in that section won't appear in `llms.txt`

## Synced content

Some files are auto-synced from other repositories.
**Do not edit these files directly.** Changes must go to the source repo.

Currently synced:
- `docs/languages/motoko/` — from `caffeinelabs/motoko`
- `docs/guides/tools/migrating-from-dfx.md` — from `dfinity/icp-cli`

## Review ownership

| Section | Review Team |
|---------|------------|
| All docs (default) | `@dfinity/editorial` |
| `/guides/security/` | `@dfinity/product-security` + `@dfinity/editorial` |
| `/guides/defi/` | `@dfinity/defi` + `@dfinity/editorial` |
| `/guides/chain-fusion/` | `@dfinity/defi` + `@dfinity/editorial` |
| `/guides/backends/timers` | `@dfinity/team-dsm` + `@dfinity/editorial` |
| `/guides/frontends/custom-domains` | `@dfinity/boundary-node` + `@dfinity/editorial` |
| `/guides/frontends/certification` | `@dfinity/trust` + `@dfinity/editorial` |
| `/reference/ic-interface-spec`, `/reference/http-gateway-spec` | `@dfinity/interface-spec` + `@dfinity/team-dsm` + `@dfinity/consensus` |
| `/languages/motoko/` (synced) | `@dfinity/languages` |
| `/guides/tools/` | `@dfinity/dx` + `@dfinity/editorial` |

## Validation

Before submitting a PR, manually verify:

1. **No dfx references** — `dfx` is banned (except in `guides/tools/migrating-from-dfx.md`)
2. **No .mdx files** — only `.md` allowed
3. **Valid frontmatter** — required fields present, valid values
4. **`npm run build`** — Site builds without errors

> **Note:** Validation scripts are not yet set up on this branch. They are preserved on `restructuring-attempt-1` and will be restored when the docs are ready for production. CI deployment to the IC asset canister runs on every push to `main` (see `.github/workflows/deploy-ic.yml`).

## Draft completeness checklist

Before setting a task to `draft` status in Beads, verify:

1. Content brief from the stub is fully addressed
2. All code examples are tested and copy-pasteable
3. icp-cli commands verified against [CLI reference](https://dfinity.github.io/icp-cli/)
4. Cross-links from `<!-- Cross-Links -->` converted to actual markdown links
5. Source material HTML comments removed from the final content
6. `npm run build` passes

## Progress tracking

All tasks are tracked in [Beads](https://github.com/steveyegge/beads) (`bd`). See `AGENTS.md` → "Multi-agent workflow" for the full coordination protocol.

Key commands:
- `bd ready` — show tasks you can work on (no unresolved blockers)
- `bd update <id> --status draft --notes "PR #X"` — mark task as draft after PR creation
- `bd list --limit 0` — see all tasks (default caps at 50)

See `.docs-plan/README.md` for analysis artifacts and `.docs-plan/migration-plan.md` for execution details.
