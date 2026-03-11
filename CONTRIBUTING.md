# Contributing to ICP Developer Docs

## Quick start

```bash
npm install
npm run dev      # Start dev server at localhost:4321
npm run build    # Production build
npm run validate # Run all checks
```

## Content format

All documentation is plain Markdown (`.md`). No `.mdx` files. No JSX components.

Files live in `src/content/docs/` and follow the site map defined in `astro.config.mjs`.

## Frontmatter schema

Every `.md` file in `src/content/docs/` must have this frontmatter:

```yaml
---
title: "Page Title"                           # Required
description: "One-line description"           # Required
sidebar:
  order: 1                                    # Optional: controls sidebar ordering
doc_type: how-to                              # Required: tutorial | how-to | reference | explanation
level: intermediate                           # Required: beginner | intermediate | advanced
features: [chain-key, threshold-ecdsa]        # Optional: ICP features covered
icskills: [ckbtc, evm-rpc]                    # Optional: related icskills skill files
last_verified: 2026-03-10                     # Required: last date content was verified
source_repo: null                             # Set if synced from another repo
source_ref: null                              # Git ref if synced
---
```

### Field reference

| Field | Required | Values | Notes |
|-------|----------|--------|-------|
| `title` | Yes | string | Page title |
| `description` | Yes | string | Used in search, llms.txt, and meta tags |
| `doc_type` | Yes | `tutorial`, `how-to`, `reference`, `explanation` | Diataxis classification |
| `level` | Yes | `beginner`, `intermediate`, `advanced` | Target audience |
| `features` | No | string array | ICP features: `chain-key`, `vetkeys`, `https-outcalls`, `randomness`, `timers`, `reverse-gas`, `chain-fusion`, `persistence` |
| `icskills` | No | string array | Related skill files from github.com/dfinity/icskills |
| `last_verified` | Yes | `YYYY-MM-DD` | Last date the content was verified as accurate |
| `source_repo` | No | URL or null | If this file is synced from another repo |
| `source_ref` | No | string or null | Git tag/commit if synced |
| `sidebar.order` | No | number | Controls position in auto-generated sidebar |

## Writing guidelines

### Do
- Write in plain, direct language
- Use icp-cli commands for all CLI examples
- Make code examples self-contained and copy-pasteable
- Link to external docs for tool-specific details (see CLAUDE.md linking rules)
- Link to icskills skill files where they provide implementation details
- Use standard markdown features (code blocks, tables, links, headings)

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

## Synced content

Files with `source_repo` in frontmatter are auto-synced from other repositories.
**Do not edit these files directly.** Changes must go to the source repo.

Currently synced:
- `src/content/docs/languages/motoko/` — from `caffeinelabs/motoko`
- `src/content/docs/tools/migrating-from-dfx/` — from `dfinity/icp-cli`

## Review ownership

| Section | Review Team |
|---------|------------|
| All docs (default) | `@dfinity/editorial` |
| `/security/` | `@dfinity/product-security` + `@dfinity/editorial` |
| `/defi/`, `/defi/chain-key-tokens/` | `@dfinity/defi` + `@dfinity/editorial` |
| `/capabilities/chain-fusion/` | `@dfinity/defi` + `@dfinity/editorial` |
| `/capabilities/timers` | `@dfinity/team-dsm` + `@dfinity/editorial` |
| `/building-apps/frontends/custom-domains/` | `@dfinity/boundary-node` + `@dfinity/editorial` |
| `/building-apps/frontends/certification` | `@dfinity/trust` + `@dfinity/editorial` |
| `/references/ic-interface-spec`, `/references/http-gateway-spec` | `@dfinity/interface-spec` + `@dfinity/team-dsm` + `@dfinity/consensus` |
| `/languages/motoko/` (synced) | `@dfinity/languages` |
| `/tools/` | `@dfinity/dx` + `@dfinity/editorial` |

## Validation

Run `npm run validate` before submitting a PR. This checks:

1. **No dfx references** — `dfx` is banned (except in `tools/migrating-from-dfx/`)
2. **No .mdx files** — only `.md` allowed
3. **Valid frontmatter** — required fields present, valid values

CI runs these same checks on every PR and will block merge on failure.
