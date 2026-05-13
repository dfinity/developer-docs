# ICP Developer Docs: Agent & Contributor Instructions

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

**Any time commits are pushed to a PR branch** — check whether the PR description still accurately reflects the complete set of changes on the branch. If new commits introduce changes not covered by the existing summary, update the description immediately:
```bash
gh pr edit <PR#> --body "$(cat <<'EOF'
<updated full description>
EOF
)"
```
Do not leave a PR description that no longer matches the branch. The description is the reviewer's first read; a stale summary wastes review time and creates confusion.

**PR body formatting rule (applies to `gh pr create`, `gh pr edit`, and `gh pr comment`)** — always pass the body through a single-quoted heredoc (`<<'EOF'`). Single-quoted heredocs suppress all shell expansion, so backticks and other special characters are passed through literally. Never manually escape backticks with `\`` inside the heredoc: the backslash will appear verbatim in the rendered output.

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
- **Load skills before writing** — `technical-documentation` + the relevant icskill + `icp-brand-voice` + `icp-brand-design`. Run `git submodule update --init --depth 1` if skills appear as broken symlinks.
- Use `icp` CLI commands in all examples — never `dfx`
- Use `mo:core` for all Motoko standard library imports — never `mo:base`. See `.sources/motoko/doc/md/12-base-core-migration.md` for the full mapping.
- Use `.md` by default; `.mdx` only for interactive components (e.g. `<Tabs syncKey="lang">`). Tab order: Motoko → Rust → others.
- Include complete frontmatter (title + description required — see schema below)
- Record structural decisions in `.docs-plan/decisions.md` immediately — new files, path changes, config changes, any choice a future agent needs to understand
- **Every non-stub content page must end with an `<!-- Upstream: -->` comment** listing every `.sources/` repo used
- **Every PR must include a `## Sync recommendation` section** in the description

## Ask first (confirm with the user before doing these)

- Creating new top-level sections (getting-started, guides, concepts, languages, references)
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
- Duplicate content that lives in external docs (icp-cli, JS SDK, icskills)
- Edit synced files directly (`docs/languages/motoko/`, `docs/guides/tools/migrating-from-dfx.md`)
- Nest sidebar items more than 3 levels deep
- Skip reading source material before writing a page
- Write code snippets from memory — find and adapt from actual upstream code in `.sources/`
- Modify the rationale or context of existing decisions in `.docs-plan/decisions.md` — you may remove entries that are fully reflected in the current codebase but never alter reasoning behind active decisions
- Add `Co-Authored-By` or any AI attribution to commits or PR descriptions
- Link to `internetcomputer.org/docs/` — that site is retired. For internal pages use relative paths, not absolute `docs.internetcomputer.org/...` URLs. Explain inline or link to `docs/concepts/` for protocol-level background; do not link to `learn.internetcomputer.org` (Learn Hub has been retired; its content is now in this site under `docs/concepts/`).
- Link to internal pages that don't exist — every `[text](path.md)` must resolve to an actual file. Run `ls <target>` before linking. Links to `.mdx` pages use `.md` extension (Astro resolves both).
- Link to a page without a section anchor when the surrounding context refers to a specific topic covered by a subsection — always check the target file's headings and include `#anchor` when a more precise destination exists. Verify anchors by grepping headings: `grep "^## \|^### " <target>`. Anchor slugs: lowercase, spaces → `-`, special chars stripped.
- Link to `https://cli.internetcomputer.org/` (bare root) — all CLI doc pages are under a versioned path. Use `https://cli.internetcomputer.org/0.2/<path>` (current slug; verify with `cat .sources/icp-cli/docs-site/versions.json`) and confirm the path exists in `.sources/icp-cli/docs/<path>.md`. For command-specific links add a section anchor from `.sources/icp-cli/docs/reference/cli.md` (e.g. `#icp-canister-logs`, `#icp-canister-settings-update`, `#icp-cycles`). When bumping icp-cli to a new minor version, follow the "Link adaptation for `icp-cli`" checklist in "Bumping submodules".
- Link externally when an internal page exists — check `docs/` before using an external URL
- Offer, suggest, or perform PR reviews unless a human explicitly asks
- Write em-dashes (`—`) or use `--` as an em-dash substitute in prose. These are banned in all content: body text, bullet descriptions, link label text (including "Next steps", "Further reading", and "See also" sections), and inline comments. Use a colon, semicolon, period, comma, or parentheses instead. (`--` is only acceptable inside fenced code blocks as a code comment or CLI flag.)
- Rename Candid field names, management canister API identifiers, or example/repository names to satisfy jargon rules — these are protocol-level identifiers that must match the actual interface (e.g. `dapps`, `RegisterDappCanisters`, `encrypted-notes-dapp-vetkd`)
- Remove domain-specific technical terms that are standard vocabulary in their context: "DeFi" and "smart contract" in DeFi/token guides, "DAO" and "decentralized autonomous organization" in governance guides, "smart contracts on other chains" in chain fusion guides. These terms must stay because the target audience uses them and alternatives would be less precise.

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
└── references/             # Specifications and reference
```

## Source material repos (`.sources/`)

All upstream source repos are pinned as **git submodules** under `.sources/`. This ensures every agent reads the exact same content, regardless of when they run.

**Two pinning strategies:**
- **Track latest release** — repos where the release represents the live/deployed state. Pin to the latest release tag. Spec changes are only accurate once released.
- **Track main/master** — content repos where the default branch *is* the canonical source.

For current release hashes, see `.sources/VERSIONS`.

| Submodule | Repo | Pinned to | What it provides |
|-----------|------|-----------|-----------------|
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
| `.agents/skills/icp-brand-voice` | n/a — lives directly in this repo | n/a | ICP / DFINITY brand voice: positioning, vocabulary, banned terms, voice attributes |
| `.agents/skills/icp-brand-design` | n/a — lives directly in this repo | n/a | ICP / DFINITY brand design: color tokens, typography, layout, components, accessibility |
| `.sources/internetidentity` | `dfinity/internet-identity` | latest release | Internet Identity spec (`docs/ii-spec.mdx`), VC spec (`docs/vc-spec.md`), Candid interface (`src/internet_identity/internet_identity.did`) |

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
- **Consult relevant repos when writing or reviewing:**
  - **Motoko code** → `motoko-core` (API signatures) + `motoko` (compiler: system function names, keywords)
  - **Rust code** → `cdk-rs` (`ic-cdk`, `ic-cdk-timers`, management canister types)
  - **Candid** → `candid` (spec, type system, `didc` behavior)
  - **Certified data / query verification** → `response-verification`
  - **CLI commands** → `icp-cli` (never guess flags or syntax)
  - **JavaScript / TypeScript** → `icp-js-sdk-docs` (unzip archives before reading; never guess JS SDK API)
  - **Code examples** → `examples` (link to for snippets >30 lines)
- **Do not modify `.sources/`** — read-only. Edits go to the upstream repos.

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
| `motoko` | **Automated** — `.github/workflows/sync-motoko.yml` opens a PR with the submodule bump, synced docs, and VERSIONS update already committed. Review the content diff and merge. Also check for changed/removed API signatures — grep all Motoko code blocks in docs. |
| `motoko-core` | Check for changed/removed API signatures — grep all Motoko code blocks in docs |
| `cdk-rs` | Check `ic-cdk`, `ic-cdk-timers`, `ic-cdk-macros` API changes — grep all Rust code blocks |
| `icp-cli` | Check for changed/removed commands or flags — grep all CLI examples. If the release tag introduces a new minor version (e.g. `v0.3.x`), update all CLI doc link slugs — see "Link adaptation for `icp-cli`" below |
| `icskills` | Check for changed canister IDs or code patterns |
| `examples` | Verify linked files still exist at the same path |
| `icp-cli-recipes` | Check for renamed or removed recipes referenced in docs |
| `icp-cli-templates` | Check for renamed or restructured templates |
| `icp-js-sdk-docs` | Unzip and compare API signatures; check `versions.json` for new releases |
| `candid` | Check for spec changes affecting the Candid reference or type-mapping examples |
| `response-verification` | Check for API changes affecting certified variables patterns |
| `dotskills` | Check if the `technical-documentation` skill changed in ways that affect review criteria |
| `internetidentity` | Run `npm run sync:ii-spec` — the script syncs both `ii-spec.mdx` → `docs/references/internet-identity-spec.md` and `vc-spec.md` → `docs/references/verifiable-credentials-spec.md`, handling all link rewrites, Candid inlining, and frontmatter in one pass. If the script exits with a warning about unhandled links, add the new pattern to `linkMap` (ii-spec) or `vcLinkMap` (vc-spec) in `scripts/sync-ii-spec.mjs`. Pin to the latest `release-YYYY-MM-DD` tag — spec changes are only live once the canister is deployed at that release. The **Sync II spec** workflow (`.github/workflows/sync-ii-spec.yml`) checks the latest release tag and only opens a PR when `docs/ii-spec.mdx`, `docs/vc-spec.md`, or `internet_identity.did` actually changed. Trigger manually for early sync. |
| `chain-fusion-signer` | Check for changed canister IDs, API methods, or key derivation patterns |
| `papi` | Check for changed payment interface or cycle cost model |
| `ic-pub-key` | Check for changed CLI flags or commands |

**Link adaptation for `icp-cli`:** All links to the CLI docs site use a versioned path slug (e.g. `https://cli.internetcomputer.org/0.2/...`). The slug must match the current latest release. When the submodule is bumped to a new minor version:

1. Read the new slug from the submodule: `cat .sources/icp-cli/docs-site/versions.json` — use the `"version"` value marked `"latest": true`.
2. Extract every unique path currently linked and verify each one still exists in the new submodule **before** doing any replacements:
   ```bash
   grep -roh "cli\.internetcomputer\.org/[0-9][.0-9]*/[^\"' )#]*" docs/ --include="*.md" --include="*.mdx" \
     | sed 's|cli\.internetcomputer\.org/[0-9][.0-9]*/||' | sort -u | grep -v "^$" \
     | while read p; do
         [ -f ".sources/icp-cli/docs/${p}.md" ] || echo "MISSING: $p"
       done
   ```
   If any path is reported as MISSING, find its replacement in `.sources/icp-cli/docs/` and update that link manually. Do not proceed to step 3 until all paths are accounted for.
3. Replace the old slug with the new one across all files:
   ```bash
   old=0.2   # replace with the old slug
   new=0.3   # replace with the new slug
   find docs/ \( -name "*.md" -o -name "*.mdx" \) | xargs sed -i "s|cli.internetcomputer.org/${old}/|cli.internetcomputer.org/${new}/|g"
   ```
4. Run `npm run build` to confirm no broken links.

**Link adaptation for `internet-identity-spec.md` and `verifiable-credentials-spec.md`:** Both are handled automatically by `npm run sync:ii-spec`. The script rewrites stale `internetcomputer.org` links to internal relative paths using `linkMap` (ii-spec) and `vcLinkMap` (vc-spec) in `scripts/sync-ii-spec.mjs`. If a new unhandled link pattern appears, the script exits with a warning — add it to the appropriate map with the correct relative path (use `grep -r "{#<anchor>}" docs/references/ic-interface-spec/` to find which file owns a given anchor), then re-run. Stale links in `vc-spec.md` are tracked upstream in `dfinity/internet-identity#3889`; once fixed, the rewrites become harmless no-ops (old URL simply no longer appears in the source).

### Directly maintained spec files

The following files are no longer synced from an external submodule — they are maintained directly in this repository. Update them manually when the IC team announces a new version of the relevant specification.

| Local file | What it is | When to update |
|-----------|-----------|---------------|
| `public/references/ic.did` | Candid interface of the IC management canister | New management canister methods or changed types; update `docs/references/management-canister.md` and affected guides alongside |
| `public/references/_attachments/certificates.cddl` | Certificate CDDL schema (linked from `docs/references/ic-interface-spec/certification.md`) | IC certification spec changes |
| `public/references/_attachments/requests.cddl` | Request CDDL schema (linked from `docs/references/ic-interface-spec/https-interface.md`) | IC HTTPS interface spec changes |
| `public/references/_attachments/http-gateway.did` | HTTP Gateway Candid interface (linked from `docs/references/http-gateway-spec.md`) | HTTP Gateway spec changes |
| `docs/references/ic-interface-spec/` | IC Interface Spec split into 7 focused pages | IC spec version bumps — apply changes to the matching file (see section mapping below) |
| `docs/references/http-gateway-spec.md` | HTTP Gateway Protocol Spec | HTTP Gateway spec version bumps |

**IC Interface Spec — section-to-file mapping:**

| File | IC spec section |
|---|---|
| `index.md` | Introduction, Pervasive concepts, The system state tree |
| `https-interface.md` | HTTPS Interface |
| `canister-interface.md` | Canister module format, Canister interface (System API) |
| `management-canister.md` | The IC management canister, The IC Bitcoin API, The IC Provisional API |
| `certification.md` | Certification, The HTTP Gateway protocol |
| `abstract-behavior.md` | Abstract behavior |
| `changelog.md` | IC spec changelog |

**Link adaptation for `http-gateway-spec.md`:** If an update introduces absolute `/references/ic-interface-spec#<anchor>` links, convert them to relative paths using the anchor-to-file mapping at the bottom of `docs/references/http-gateway-spec.md`. If a new anchor is not in that comment, find its file with:
```bash
grep -r "{#<anchor>}" docs/references/ic-interface-spec/
```

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

**For all content writing** — load `icp-brand-voice` alongside `technical-documentation`. It is the authoritative source for banned jargon, preferred framing, and voice rules. For design work (CSS, copy, UI components, docs styling, marketing copy), also load `icp-brand-design`.

## Frontmatter schema

```yaml
---
title: "Page Title"                           # Required
description: "One-line description"           # Required
sidebar:
  order: 1                                    # Optional: only where reading order matters
---
```

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
