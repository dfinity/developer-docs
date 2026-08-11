# Contributing to ICP Developer Docs

## Quick start

```bash
npm install
npm run dev      # Start dev server at localhost:4321
npm run build    # Production build
```

> **Important:** This file covers content format and contribution mechanics. For boundary rules — what always applies, what needs approval, and what is prohibited — see [AGENTS.md](AGENTS.md). Those rules apply to all contributors, not just AI agents.

## Content format

Documentation is Markdown (`.md`) by default. Pages that need interactive components — such as `<Tabs syncKey="lang">` for multi-language sections — use `.mdx`.

Files live in `docs/` (project root) and follow the site map defined in `astro.config.mjs`. Astro reads them via a symlink at `src/content/docs/`.

## Frontmatter schema

Every `.md` file in `docs/` must have this frontmatter:

```yaml
---
title: "Page Title"                           # Required
description: "One-line description"           # Required
sidebar:
  order: 1                                    # Optional: only where reading order matters
---
```

### Field reference

| Field | Required | Values | Notes |
|-------|----------|--------|-------|
| `title` | Yes | string | Page title |
| `description` | Yes | string | Used in search, llms.txt, and meta tags |
| `sidebar.order` | No | number | Controls position within auto-generated sidebar sections. Only set where reading order matters (e.g., getting-started tutorials). Omit to use alphabetical order. |

## Writing guidelines

### Content types (Diataxis)

Each top-level section has a specific purpose. Match your content accordingly:

| Section | Type | Purpose | CLI commands? |
|---------|------|---------|---------------|
| `concepts/` | Explanation | What it is, how it works, why it matters | No — link to guides |
| `getting-started/` | Tutorial | Step-by-step learning path | Yes — complete and linear |
| `guides/` | How-to | Task-oriented instructions | Yes — where relevant |
| `references/` | Reference | Lookup information | Sparingly — for syntax examples only |

### Do
- Write in plain, direct language
- Use icp-cli commands for all CLI examples
- Make code examples self-contained and copy-pasteable
- Link to external docs for tool-specific details (see AGENTS.md linking rules)
- Use standard markdown features (code blocks, tables, links, headings)
- Use relative paths with `.md` extension for internal links (e.g., `[Quickstart](../getting-started/quickstart.md)`) — works on both the Astro site and GitHub

### Don't
- Reference `dfx` — it is deprecated. CI will reject it.
- Use `.mdx` without a clear need for interactive components (default to `.md`)
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
- Keep the hand-drawn visual style consistent with existing images

## Agent-friendly documentation

The build generates `/llms.txt` and per-page `.md` endpoints from your content. This is automatic — no extra work needed when writing pages. However:

- **Frontmatter `description`** is used as the page summary in `llms.txt` — write clear, useful descriptions
- **Adding a new sidebar section** in `astro.config.mjs` requires updating the `SECTIONS` array in `plugins/astro-agent-docs.mjs` to match, otherwise pages in that section won't appear in `llms.txt`

## Source material

`.sources/` contains pinned git submodules that agents use as ground truth when writing and reviewing content — CLI references, API signatures, skill files, and code examples.

**Do not edit files in `.sources/` directly.** They are read-only references; changes go to the upstream repos.

Current pinned release versions are in [`.sources/VERSIONS`](.sources/VERSIONS). Bumping a submodule is a maintainer task — follow [`.agents/submodule-bumping.md`](.agents/submodule-bumping.md) for the full procedure.

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
2. **`.mdx` only where needed** — default to `.md`; use `.mdx` only for interactive components (tabs)
3. **Valid frontmatter** — required fields present, valid values
4. **`npm run build`** — Site builds without errors

See [AGENTS.md](AGENTS.md) for the full authoring workflow and content rules.
