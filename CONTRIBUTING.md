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

### Do
- Write in plain, direct language
- Use icp-cli commands for all CLI examples
- Make code examples self-contained and copy-pasteable
- Link to external docs for tool-specific details (see AGENTS.md linking rules)
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

> **Note:** Validation scripts and CI workflows are not yet set up on this branch. They are preserved on `restructuring-attempt-1` and will be restored when the docs are ready for production.

## Draft completeness checklist

Before marking a page as `draft` in `progress.md`, verify:

1. Content brief from the stub is fully addressed
2. All code examples are tested and copy-pasteable
3. icp-cli commands verified against [CLI reference](https://dfinity.github.io/icp-cli/)
4. Cross-links from `<!-- Cross-Links -->` converted to actual markdown links
5. Source material HTML comments removed from the final content
6. `npm run build` passes

## Progress tracking

After completing work on any page, update `.docs-plan/progress.md`:
- Set the page status to `draft` and add your name/agent and the date
- For non-page tasks (research, tooling), add a row to the project-level table at the top

See `.docs-plan/README.md` for the full workflow and all analysis artifacts.
