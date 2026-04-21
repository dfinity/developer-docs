# ICP Developer Docs — Agent & Contributor Instructions

ICP developer documentation built with Astro + Starlight.
Content is `.md` by default. Pages that need interactive components (e.g., language-synced tabs) use `.mdx` — see `.docs-plan/decisions.md` for the policy.
Goal: get developers (human and AI) building on the IC as fast as possible.

This file is the single source of truth for all agents (Claude Code, Codex, Cursor, etc.) and contributors. `CLAUDE.md` symlinks here.

## Quick orientation

1. Read this file for rules and boundaries
2. Run `./scripts/setup.sh` — initializes submodules and npm deps
3. Check `.docs-plan/decisions.md` before making any structural changes
4. Pick a task from [GitHub Issues](https://github.com/dfinity/developer-docs/issues) — content pages use the `documentation` label; infra tasks use `enhancement`
5. Look up the page in `.docs-plan/migration-plan.md` for source material and effort
6. Do the work following the rules below
7. Record any structural decisions in `.docs-plan/decisions.md`

## Branch naming

- Content pages: `docs/<slug>` (e.g., `docs/concepts-vetkeys`, `docs/guides-security-encryption`)
- Infrastructure tasks: `infra/<slug>` (e.g., `infra/validation-scripts`, `infra/ci-workflows`)

## Starting a task

```bash
git fetch origin
git ls-remote origin docs/<slug>   # branch exists?
gh pr list --head docs/<slug>      # PR exists?
```

Three outcomes:
- **Branch + PR exist** → "changes requested" pickup. `git checkout docs/<slug> && git pull origin docs/<slug>`
- **Branch exists, no PR** → stale. Delete remote branch, start fresh from `main`
- **Neither exists** → fresh work. `git checkout -b docs/<slug> origin/main`

## Doing the work

**Content pages:** Follow `.docs-plan/content-authoring.md` before writing. Every content page must:
- Include an `<!-- Upstream: -->` comment at the bottom listing every `.sources/` repo used
- Load the relevant icskill before writing (see "Skills" section below)
- Load `technical-documentation` skill before writing

**PR feedback:** Check all three feedback sources before fixing anything:
```bash
# 1. Review body (attached to the review decision)
gh api repos/{owner}/{repo}/pulls/<PR#>/reviews --jq '.[] | {user: .user.login, state: .state, body: .body}'

# 2. Top-level PR comments
gh pr view <PR#> --json comments --jq '.comments[] | {author: .author.login, created: .createdAt, body: .body}'

# 3. Inline review comments (separate endpoint — do NOT skip this)
gh api repos/{owner}/{repo}/pulls/<PR#>/comments --jq '.[] | {user: .user.login, created_at: .created_at, path: .path, body: .body}'
```

A `<!-- feedback-addressed -->` top-level comment only covers feedback up to that timestamp. Check for inline comments posted after it. For each feedback item: cross-check against `.sources/` before applying. Skip items that conflict with AGENTS.md rules or source material — record why.

**Automated reviewer feedback (Copilot, bots):** Verify each claim against `.sources/` before acting. Copilot is often right on factual errors (wrong API names, incorrect behavior); often wrong on style preferences and project-convention conflicts.

**PR reviews:** Only when explicitly asked. Load `technical-documentation` skill and the relevant icskill first. See `.docs-plan/review-guidelines.md` for the full checklist.

## Submitting

**Fresh page:**
```bash
npm run build                         # must pass
git rebase origin/main
git push -u origin docs/<slug>
gh pr create --title "docs: <page title>" --body "$(cat <<'EOF'
## Summary
<bullet list of what the page covers>

## Sync recommendation
<one of: `hand-written`, `sync from <repo> <path>`, or `informed by <repo> — <files>`>
EOF
)"
git checkout main
```

**After addressing feedback:**
```bash
npm run build                         # must pass
git push
gh pr comment <PR#> --body "$(cat <<'EOF'
<!-- feedback-addressed -->
Feedback addressed:
- <bullet list of what was fixed>
EOF
)"
git checkout main
```

**Rebase approved PR with merge conflicts:**
```bash
git fetch origin && git checkout <branch>
git rebase origin/main
git push --force-with-lease
git checkout main
```

## Merge conflict policy

- **Fresh PRs** — rebase on `main` before first push
- **Feedback fixes** — commit and push only. Do NOT rebase unless there are actual merge conflicts.
- **Approved PRs with conflicts** — rebase + `git push --force-with-lease`. Only case where force-push is justified.
- **Never force-push a PR under active review**

## Always (do these without asking)

- Read `.docs-plan/decisions.md` before proposing structural changes
- **Load skills before writing** — `technical-documentation` + the relevant icskill. Run `git submodule update --init --depth 1` if skills appear as broken symlinks.
- Use `icp` CLI commands in all examples — never `dfx`
- Use `mo:core` for all Motoko standard library imports — never `mo:base`. See `.sources/motoko/doc/md/12-base-core-migration.md` for the full mapping.
- Use `.md` by default; `.mdx` only for interactive components (e.g. `<Tabs syncKey="lang">`). Tab order: Motoko → Rust → others.
- Include complete frontmatter (title + description required — see schema below)
- Record structural decisions in `.docs-plan/decisions.md` immediately — new files, path changes, config changes, any choice a future agent needs to understand
- **Every non-stub content page must end with an `<!-- Upstream: -->` comment** listing every `.sources/` repo used
- **Every PR must include a `## Sync recommendation` section** in the description

## Ask first (confirm with the user before doing these)

- Creating new top-level sections (getting-started, guides, concepts, languages, reference)
- Adding new pages not in the migration plan
- Removing existing pages from the structure
- Changing a page's sync recommendation from hand-written to synced (or vice versa)
- Changing the frontmatter schema
- Modifying the sidebar configuration in `astro.config.mjs`
- Changing decisions recorded in `.docs-plan/decisions.md`
- Adding new external doc sources to the linking rules
- Adding a new entry to `.sources/` (new submodule)

## Never (do not do these under any circumstances)

- Reference `dfx` — it is deprecated and banned
- Use `mo:base` imports in Motoko code examples — use `mo:core` instead. Critical replacements: `Buffer` → `List`, `HashMap`/`TrieMap`/`Trie`/`RBTree` → `Map`, `Deque` → `Queue`, `OrderedMap` → `pure/Map`, `OrderedSet` → `pure/Set`
- Create `.mdx` files without a clear need for interactive components — default to `.md`
- Duplicate content that lives in external docs (icp-cli, JS SDK, icskills, Learn Hub)
- Edit synced files directly (`docs/languages/motoko/`, `docs/guides/tools/migrating-from-dfx.md`)
- Nest sidebar items more than 3 levels deep
- Skip reading source material before writing a page
- Write code snippets from memory — find and adapt from actual upstream code in `.sources/`
- Modify the rationale or context of existing decisions in `.docs-plan/decisions.md` — you may remove entries that are fully reflected in the current codebase but never alter reasoning behind active decisions
- Add `Co-Authored-By` or any AI attribution to commits or PR descriptions
- Link to `internetcomputer.org/docs/` or `docs.internetcomputer.org` — those URLs will break. Link to pages in this site (relative paths), Learn Hub, or explain inline.
- Link to internal pages that don't exist — every `[text](path.md)` must resolve to an actual file. Run `ls <target>` before linking. Links to `.mdx` pages use `.md` extension (Astro resolves both).
- Link externally when an internal page exists — check `docs/` before using an external URL
- Offer, suggest, or perform PR reviews unless a human explicitly asks

## Key directories

- `docs/` — All documentation (`.md` only). `src/content/docs/` symlinks here for Astro.
- `docs/languages/motoko/` — Auto-synced from `caffeinelabs/motoko` (do not edit directly). Bumps are fully automated: a weekly workflow (`.github/workflows/sync-motoko.yml`) detects new releases, runs `npm run sync:motoko`, and opens a PR with the synced content already committed. No manual sync step needed — just review and merge the PR.
- `docs/guides/tools/migrating-from-dfx.md` — Synced from `dfinity/icp-cli` (do not edit directly)
- `.docs-plan/` — Planning artifacts, decisions, authoring workflow, review guidelines
- `.sources/` — **Pinned submodules of upstream source repos** (see "Source material repos" below)
- `.agents/skills/` — Agent skills (symlinks into `.sources/`). Run `git submodule update --init --depth 1` if broken.
- `.claude/skills/` — Symlinks to `.agents/skills/` for Claude Code
- `plugins/` — Astro build plugins (rehype/remark transforms and the agent-docs integration)
- `icp.yaml` — icp-cli project config (asset canister recipe)
- `.icp/data/` — Canister ID mappings (committed to git)

## Project structure

```
docs/                       # All documentation (.md only) — src/content/docs/ symlinks here
├── index.mdx               # Landing page
├── getting-started/        # Tutorials
├── guides/                 # How-to guides
│   ├── backends/           # Backend development patterns
│   ├── canister-calls/     # Candid interfaces, bindings, onchain and offchain calls
│   ├── frontends/          # Frontend development
│   ├── authentication/     # Auth integration
│   ├── testing/            # Testing strategies
│   ├── canister-management/ # Lifecycle, settings, cycles, optimization, deployment
│   ├── security/           # Security best practices
│   ├── chain-fusion/       # Cross-chain integration
│   ├── defi/               # Token and DeFi guides
│   ├── governance/         # SNS and DAO guides
│   └── tools/              # Developer tools
├── concepts/               # Explanations
├── languages/              # Language-specific (Motoko synced, Rust hand-written)
└── reference/              # Specifications and reference
```

## Source material repos (`.sources/`)

All upstream source repos are pinned as **git submodules** under `.sources/`. This ensures every agent reads the exact same content, regardless of when they run.

**Two pinning strategies:**
- **Track latest release** — repos that publish versioned releases users install. Pin to the latest release tag.
- **Track main/master** — content repos where the default branch *is* the canonical source.

For current release hashes, see `.sources/VERSIONS`.

| Submodule | Repo | Pinned to | What it provides |
|-----------|------|-----------|-----------------|
| `.sources/portal` | `dfinity/portal` | `master` | Old docs content referenced in stub `<!-- Source Material -->` comments |
| `.sources/icp-cli` | `dfinity/icp-cli` | latest release | CLI reference, command syntax verification |
| `.sources/icp-cli-recipes` | `dfinity/icp-cli-recipes` | `main` | Recipe examples for CLI guides |
| `.sources/icp-cli-templates` | `dfinity/icp-cli-templates` | `main` | Project templates for getting-started |
| `.sources/icskills` | `dfinity/icskills` | `main` | Skill files with canister IDs and code patterns |
| `.sources/examples` | `dfinity/examples` | `master` | Code examples (link to for >30 line snippets) |
| `.sources/icp-js-sdk-docs` | `dfinity/icp-js-sdk-docs` | `main` | JS SDK docs — content in zip archives: `unzip -p .sources/icp-js-sdk-docs/public/<lib>/latest.zip <file>`. Libraries: `@icp-sdk/core` (`core/`), `@icp-sdk/auth` (`auth/`), `@icp-sdk/canisters` (`canisters/`), `@icp-sdk/signer` (`signer/`), `@icp-sdk/bindgen` (`bindgen/`), `@dfinity/pic` (`pic-js/`) |
| `.sources/motoko` | `caffeinelabs/motoko` | latest release | Motoko compiler — language spec, system function names, syntax verification |
| `.sources/motoko-core` | `caffeinelabs/motoko-core` | latest release | Motoko core library (`mo:core`) — API signatures, module docs |
| `.sources/cdk-rs` | `dfinity/cdk-rs` | latest release | Rust CDK (`ic-cdk`, `ic-cdk-timers`, `ic-cdk-macros`) — API signatures |
| `.sources/candid` | `dfinity/candid` | latest release | Candid spec, type system, `didc` tool source |
| `.sources/response-verification` | `dfinity/response-verification` | latest release | Response verification, certified variables, certificate trees |
| `.sources/chain-fusion-signer` | `dfinity/chain-fusion-signer` | latest release | Chain Fusion Signer — API, key derivation, address generation, ICRC-2 payment model |
| `.sources/papi` | `dfinity/papi` | latest release | PAPI (payment API) — cycle payment interface used by the Chain Fusion Signer |
| `.sources/ic-pub-key` | `dfinity/ic-pub-key` | latest release | `@dfinity/ic-pub-key` CLI tool for deriving public keys via the Chain Fusion Signer |
| `.sources/dotskills` | `vincentkoc/dotskills` | `main` | Technical documentation skill (AGPL-3.0 — kept as submodule to avoid license mixing) |
| `.sources/internetidentity` | `dfinity/internet-identity` | `main` | Internet Identity spec (`docs/ii-spec.mdx`), Candid interface (`src/internet_identity/internet_identity.did`) |

### Submodule initialization

```bash
git submodule update --init --depth 1   # sufficient for all docs work
```

**Do NOT use `--recursive`** — pulls many GB of unnecessary nested submodule data.

If a shallow clone can't resolve a pinned commit:
```bash
git -C .sources/<repo> fetch --unshallow
git -C .sources/<repo> checkout <commit>
```

### Rules for agents

- **Always read source material from `.sources/`** — never from local clones, `gh api`, or training data
- **Stub shorthand mapping:** `Portal: building-apps/foo.mdx` → `.sources/portal/docs/building-apps/foo.mdx`
- **Consult relevant repos when writing or reviewing:**
  - **Motoko code** → `motoko-core` (API signatures) + `motoko` (compiler: system function names, keywords)
  - **Rust code** → `cdk-rs` (`ic-cdk`, `ic-cdk-timers`, management canister types)
  - **Candid** → `candid` (spec, type system, `didc` behavior)
  - **Certified data / query verification** → `response-verification`
  - **CLI commands** → `icp-cli` (never guess flags or syntax)
  - **JavaScript / TypeScript** → `icp-js-sdk-docs` (unzip archives before reading; never guess JS SDK API)
  - **Code examples** → `examples` (link to for snippets >30 lines)
- **Do not modify `.sources/`** — read-only. Edits go to the upstream repos.
- **Portal `file=` references:** Resolve `file=../../../../submodules/samples/...` paths via `.sources/examples` instead.

### Bumping submodules

Only the project maintainer bumps submodule refs. When bumped:

**Step 0 — Determine the new ref:**
- **Latest release repos:** Use `git ls-remote --tags origin` to find the highest version tag. Pin to that tag's commit.
- **main/master repos:** Fetch and checkout `origin/main` or `origin/master`.

**General checklist (all submodules):**
1. Identify changes: `git -C .sources/<repo> log --oneline <old-ref>..<new-ref>`
2. Grep docs pages for content derived from that submodule; update affected pages
3. Check open PRs — post a comment if the bump may affect pages under review (format below)
4. **For release-pinned repos:** update `.sources/VERSIONS`
5. Note the bump in the PR description

**PR comment format:**
```bash
gh pr comment <PR#> --body "$(cat <<'EOF'
<!-- submodule-bump-notice -->
`<repo>` was bumped to `<new-ref>`. The following content on this PR may be outdated:
- [specific item and why]

Please review before merging.
EOF
)"
```

**Per-submodule additional checks:**

| Submodule | Extra checks on bump |
|---|---|
| `portal` | Follow the `ic.did` checklist in "Synced files from submodules" below |
| `motoko` | **Automated** — `.github/workflows/sync-motoko.yml` opens a PR with the submodule bump, synced docs, and VERSIONS update already committed. Review the content diff and merge. Also check for changed/removed API signatures — grep all Motoko code blocks in docs. |
| `motoko-core` | Check for changed/removed API signatures — grep all Motoko code blocks in docs |
| `cdk-rs` | Check `ic-cdk`, `ic-cdk-timers`, `ic-cdk-macros` API changes — grep all Rust code blocks |
| `icp-cli` | Check for changed/removed commands or flags — grep all CLI examples |
| `icskills` | Check for changed canister IDs or code patterns |
| `examples` | Verify linked files still exist at the same path |
| `icp-cli-recipes` | Check for renamed or removed recipes referenced in docs |
| `icp-cli-templates` | Check for renamed or restructured templates |
| `icp-js-sdk-docs` | Unzip and compare API signatures; check `versions.json` for new releases |
| `candid` | Check for spec changes affecting the Candid reference or type-mapping examples |
| `response-verification` | Check for API changes affecting certified variables patterns |
| `dotskills` | Check if the `technical-documentation` skill changed in ways that affect review criteria |
| `internetidentity` | Check for spec changes in `docs/ii-spec.mdx`; re-sync `internet-identity-spec.md`. Re-copy Candid interface from `src/internet_identity/internet_identity.did` if changed |
| `chain-fusion-signer` | Check for changed canister IDs, API methods, or key derivation patterns |
| `papi` | Check for changed payment interface or cycle cost model |
| `ic-pub-key` | Check for changed CLI flags or commands |

### Synced files from submodules

| Local file | Source | Affects |
|-----------|--------|---------|
| `public/reference/ic.did` | `.sources/portal/docs/references/_attachments/ic.did` | Management canister reference — new/changed methods require updating `docs/reference/management-canister.md` |

**Portal bump checklist for `ic.did`:**
1. `diff public/reference/ic.did .sources/portal/docs/references/_attachments/ic.did`
2. If changed: `cp .sources/portal/docs/references/_attachments/ic.did public/reference/ic.did`
3. Review diff for new/changed/removed methods
4. Update `docs/reference/management-canister.md` and any affected guides

## Planning artifacts (`.docs-plan/`)

| File | What it answers |
|------|-----------------|
| `decisions.md` | "Has this been decided already?" — append-only decision log |
| `migration-plan.md` | "How do I execute this task?" — source material and effort per page |
| `content-authoring.md` | "How do I write a page?" — full authoring workflow |
| `review-guidelines.md` | "How do I review a PR?" — full review checklist |

Additional context files (less frequently needed): `synthesis.md`, `developer-journey.md`, `jssdk-skills-mapping.md`, `icp-cli-examples-inventory.md`.

## Content authoring workflow

Read `.docs-plan/content-authoring.md` before writing any page. It covers: reading stubs and source material, writing content, code snippet verification, sync recommendations, linking rules, and external docs.

## Skills (required)

Skills are a **hard prerequisite** — do not start content work, review, or any ICP-related task without them. Run `git submodule update --init --depth 1` if skills appear as broken symlinks.

Verify at session start:
```bash
ls .agents/skills/icp-cli/SKILL.md .agents/skills/technical-documentation/SKILL.md
```

- **`technical-documentation`** — Load before drafting or reviewing any docs page
- **icskills** — Load the skill matching the page topic:

| Page topic | icskill |
|---|---|
| Bitcoin / ckBTC | `ckbtc` |
| Ethereum / EVM chains | `evm-rpc` |
| Certified variables / certified data | `certified-variables` |
| HTTPS outcalls | `https-outcalls` |
| SNS / governance | `sns-launch` |
| Identity / authentication | `internet-identity` |
| Multi-canister / architecture | `multi-canister` |
| ICRC tokens / ledger | `icrc-ledger` |
| CLI / tooling | `icp-cli` |
| Frontend / asset canister | `asset-canister` |
| Cycles / billing | `cycles-management` |
| Stable memory / data persistence | `stable-memory` |
| Security | `canister-security` |
| Wallet / DeFi integration | `wallet-integration` |
| vetKD / encryption | `vetkd` |

If no skill matches, use `technical-documentation` only. Topics with no dedicated icskill yet: on-chain AI, randomness/VRF, timers, Candid, chain-key tokens.

## Frontmatter schema

```yaml
---
title: "Page Title"                           # Required
description: "One-line description"           # Required
sidebar:
  order: 1                                    # Optional: only where reading order matters
---
```

## Portal tracking

The old portal (`dfinity/portal`) is still live during the transition period.
- **Ignore:** dfx-only changes, JSX/component changes, release notes, NNS dapp guides
- **Flag for rewrite:** Content updates to topics we cover
- **Evaluate:** New content — does it belong in the new docs?

## Commands

- `npm run dev` — Local dev server
- `npm run build` — Production build
- `npm run preview` — Preview production build

## Agent-friendly documentation

The site implements the [Agent-Friendly Documentation Spec](https://agentdocsspec.com). The `agentDocs()` integration (`plugins/astro-agent-docs.mjs`) generates `/llms.txt` and `.md` endpoints at build time.

**Build output:**
- `/llms.txt` — discovery index listing all pages with links to `.md` endpoints
- `/<path>.md` — clean markdown for every page (frontmatter, HTML comments, MDX artifacts stripped)

**SECTIONS array:** The `SECTIONS` array in `plugins/astro-agent-docs.mjs` maps directory prefixes to section labels in `llms.txt`. Update it when adding or renaming sidebar sections in `astro.config.mjs`.

## Previous work

Branch `restructuring-attempt-1` preserves the previous attempt with 124 pages, CI workflows, sync scripts, and `DOCS_RESTRUCTURING_PROPOSAL.md`.
