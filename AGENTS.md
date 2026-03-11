# ICP Developer Docs — Agent & Contributor Instructions

ICP developer documentation built with Astro + Starlight.
All content is plain `.md` files. No `.mdx`. No JSX.
Goal: get developers (human and AI) building on the IC as fast as possible.

This file is the single source of truth for all agents (Claude Code, Codex, Cursor, etc.) and contributors. `CLAUDE.md` symlinks here.

**Current state:** All content is stub pages. Content writing starts with Sprint 1 (see `.docs-plan/progress.md`).

## Quick orientation

1. Read this file for rules and boundaries
2. Check `.docs-plan/decisions.md` before making any structural changes
3. Open `.docs-plan/progress.md` — find the highest-priority task with status `stub` or `pending`
4. Look up that task in `.docs-plan/migration-plan.md` for dependencies, source material, and effort
5. Do the work following the rules below
6. Update `.docs-plan/progress.md` — change status, add your name and date
7. Record any structural decisions in `.docs-plan/decisions.md`

For research artifacts (portal triage, Learn Hub mapping, examples inventory), see `.docs-plan/README.md`.

## Always (do these without asking)

- Read `.docs-plan/decisions.md` before proposing structural changes
- Use relevant icskills when writing feature pages (`npx skills add dfinity/icskills`)
- Use the `technical-documentation` skill when drafting or reviewing docs (if available)
- Use icp-cli commands in all CLI examples — never `dfx`
- Write plain `.md` files only — never `.mdx` or JSX
- Include complete frontmatter (see CONTRIBUTING.md for schema)
- Make code examples self-contained and copy-pasteable
- Link to external docs instead of duplicating content (see linking rules below)
- Read the stub page's `<!-- Source Material -->` and `<!-- Content Brief -->` comments before writing content
- Update `.docs-plan/progress.md` after completing work — both the project-level table (for research, tooling, infrastructure tasks) and the page-level tables (for content writing)
- Record structural decisions in `.docs-plan/decisions.md` immediately when making them — don't wait to be asked. This includes: new files/symlinks, path changes, config changes, cleanup of stale references, and any choice that a future agent would need to understand.

## Ask first (confirm with the user before doing these)

- Creating new top-level sections (getting-started, guides, concepts, languages, reference)
- Removing existing pages from the structure
- Changing the frontmatter schema
- Modifying the sidebar configuration in `astro.config.mjs`
- Changing decisions recorded in `.docs-plan/decisions.md`
- Adding new external doc sources to the linking rules

## Never (do not do these under any circumstances)

- Reference `dfx` — it is deprecated and banned
- Create `.mdx` files or use JSX components
- Duplicate content that lives in external docs (icp-cli, JS SDK, icskills, Learn Hub)
- Edit synced files directly (`docs/languages/motoko/`, `docs/guides/tools/migrating-from-dfx.md`)
- Nest sidebar items more than 3 levels deep
- Skip reading source material before writing a page
- Remove or modify existing entries in `.docs-plan/decisions.md` (append-only)

## Key directories

- `docs/` — All documentation (`.md` only). This is the real directory; `src/content/docs/` is a symlink for Astro.
- `docs/languages/motoko/` — Auto-synced from `caffeinelabs/motoko` (do not edit directly)
- `docs/guides/tools/migrating-from-dfx.md` — Synced from `dfinity/icp-cli` (do not edit directly)
- `.docs-plan/` — Analysis artifacts, decisions, and progress tracking (see `.docs-plan/README.md`)

## Project structure

```
docs/                       # All documentation (.md only) — src/content/docs/ symlinks here
├── index.md                # Landing page
├── getting-started/        # Tutorials (4 pages)
├── guides/                 # How-to guides (44 pages across 12 subsections)
│   ├── backends/           # Backend development patterns
│   ├── canisters/          # Canister management
│   ├── frontends/          # Frontend development
│   ├── authentication/     # Auth integration
│   ├── inter-canister/     # Cross-canister communication
│   ├── testing/            # Testing strategies
│   ├── production/         # Going to mainnet
│   ├── chain-fusion/       # Cross-chain integration
│   ├── defi/               # Token and DeFi guides
│   ├── governance/         # SNS and DAO guides
│   ├── security/           # Security best practices
│   └── tools/              # Developer tools
├── concepts/               # Explanations (13 pages)
├── languages/              # Language-specific (Motoko synced, Rust hand-written)
└── reference/              # Specifications and reference (13 pages)
```

## Planning artifacts (`.docs-plan/`)

Check these every session:

| File | What it answers |
|------|-----------------|
| `decisions.md` | "Has this been decided already?" — append-only decision log |
| `progress.md` | "What's done? What's next?" — single status tracker, pages in priority order |
| `migration-plan.md` | "How do I execute this task?" — dependencies, source material, effort per page |

Read these when writing specific pages:

| File | What it answers |
|------|-----------------|
| `synthesis.md` | "Why is the structure this way?" — full rationale |
| `portal-deep-dive.md` | "What portal content maps to this page?" |
| `learn-hub-inventory.md` | "Which Learn Hub articles should I link to?" |
| `jssdk-skills-mapping.md` | "Which icskills and JS SDK docs are relevant?" |
| `icp-cli-examples-inventory.md` | "Which CLI docs, recipes, templates, examples to reference?" |
| `developer-journey.md` | "How does this page fit the developer journey?" |

## Content authoring workflow

When drafting a new docs page:

1. Read the stub page — it contains content brief, source material, and cross-links
2. Read source material from other repos (portal, icp-cli, examples). Stub references use shorthand like `Portal: building-apps/foo.mdx` or `icp-cli: guides/snapshots.md` — these are paths within the respective GitHub repos (see `.docs-plan/README.md` for the full list). Ask the user for the local clone path, or use `gh api` to fetch from GitHub if no local clone is available.
   > **If source material is unavailable:** (1) try `gh api` to fetch from GitHub, (2) check if the content exists under a different path in the portal, (3) if truly unavailable, write from the content brief + icskills + your training knowledge, and add `<!-- Source unavailable: [path] — written from content brief -->` so future contributors know to verify.
3. Read any related icskills skill file for accurate canister IDs and code patterns (`npx skills add dfinity/icskills`)
4. Write the content:
   - Follow the content brief in the stub
   - Use icp-cli commands (never dfx)
   - **Verify all CLI commands and flags** against the icp-cli repo source — never guess command syntax. The CLI reference is at `dfinity/icp-cli`, `docs/reference/cli.md`. Fetch with: `gh api repos/dfinity/icp-cli/contents/docs/reference/cli.md --jq '.content' | base64 -d`
   - Use plain markdown (never JSX/MDX)
   - Ensure complete frontmatter (see CONTRIBUTING.md)
   - Code examples: <30 lines inline, >30 lines link to `dfinity/examples`
   - Link to external docs per linking rules below
5. Update `.docs-plan/progress.md` (status: `draft`, add date)
6. Submit for review by the relevant team (see `.github/CODEOWNERS` and CONTRIBUTING.md review ownership table)

## Content rules

- **NEVER reference `dfx`** — it is deprecated. Use icp-cli instead.
- All docs must have complete frontmatter (see CONTRIBUTING.md for schema)
- Synced content must not be edited directly — edits must go to the source repo
- All code examples must be self-contained and copy-pasteable
- Code examples: <30 lines inline, >30 lines link to `dfinity/examples`
- No `.mdx` files. No JSX. Plain markdown only.
- Max sidebar nesting: 3 levels
- Images go in `src/assets/images/` organized by section (see CONTRIBUTING.md for details)
- When writing a page, decide case-by-case whether portal images are worth carrying over. Keep the existing hand-drawn visual style.

## Linking rules

| Content type | Link to |
|-------------|---------|
| CLI commands | https://dfinity.github.io/icp-cli/ |
| Motoko core/base library | https://mops.one/core/docs or https://mops.one/base/docs |
| Rust CDK API | https://docs.rs/ic-cdk/latest/ic_cdk/ |
| JS SDK | https://js.icp.build |
| Protocol internals | https://learn.internetcomputer.org |
| Agent skill files | https://skills.internetcomputer.org |

## External docs (don't duplicate these)

| Resource | URL |
|----------|-----|
| icp-cli | https://dfinity.github.io/icp-cli/ |
| JS SDK | https://js.icp.build |
| icskills | https://skills.internetcomputer.org |
| Learn Hub | https://learn.internetcomputer.org |
| Motoko core library | https://mops.one/core/docs |
| Motoko base library | https://mops.one/base/docs |
| Rust CDK API | https://docs.rs/ic-cdk/latest/ic_cdk/ |

## Skills

When available, use these skills during docs work:

- **`technical-documentation`** — For drafting and reviewing docs quality
- **icskills** (`npx skills add dfinity/icskills`) — 17 ICP development skills with canister IDs, tested code, and common pitfalls. Use the relevant skill when writing any feature guide.

## Frontmatter schema

```yaml
---
title: "Page Title"                           # Required
description: "One-line description"           # Required
sidebar:
  order: 1                                    # Optional: only where reading order matters
icskills: [ckbtc, evm-rpc]                    # Optional: related icskills
---
```

## Portal tracking

The old portal (`dfinity/portal`) is still live during the transition period.
When reviewing portal tracking issues:
- **Ignore:** dfx-only changes, JSX/component changes, release notes, NNS dapp guides
- **Flag for rewrite:** Content updates to topics we cover
- **Evaluate:** New content — does it belong in the new docs?

## Commands

- `npm run dev` — Local dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build

> **Note:** Validation scripts (`validate`, `generate`, `sync`) were removed during the clean slate. They are preserved on `restructuring-attempt-1` and will be restored when the docs are ready for production.

> **Tech stack note:** Starlight is pinned to 0.37.3 due to a Zod v4 compatibility issue (see `package.json` overrides). Do not upgrade Starlight or Astro without testing the build.

## Previous work

Branch `restructuring-attempt-1` preserves the previous attempt with 124 pages, CI workflows, sync scripts, and `DOCS_RESTRUCTURING_PROPOSAL.md`.
