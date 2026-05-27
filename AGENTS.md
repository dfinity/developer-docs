# ICP Developer Docs

```bash
./scripts/setup.sh   # run this first — initializes submodules (.sources/) and npm deps
```

Tasks come on-demand — no GitHub issue required unless proposing a structural change.

## Branch naming

- Content: `docs/<slug>` (e.g., `docs/guides-security-encryption`)
- Infrastructure: `infra/<slug>` (e.g., `infra/ci-workflows`)

## Writing or updating content

Load `technical-documentation`, `icp-brand-voice`, and the relevant icskill before writing (see "Skills" for the topic-to-skill mapping). Then:

- Read relevant source material from `.sources/` to verify CLI commands, API signatures, and technical claims (see "Source material" below for what to consult per topic).
- **CLI commands:** verify every flag against `.sources/icp-cli/docs/reference/cli.md` — never guess syntax.
- **Internal links:** run `ls <target>` before adding any link. Always use `.md` extension, even for `.mdx` targets.
- **External URLs:** use the "Linking rules" table below. Verify any URL not in the table — do not guess.
- **Flag uncertainty:** add `<!-- Needs human verification: [reason] -->` next to any claim you can't verify from `.sources/`. Never silently guess.
- **Do not invent command output** — copy from `.sources/` READMEs or test fixtures, or write `<!-- TODO: verify output -->`.
- **`.md` → `.mdx` conversion:** if a page needs multi-language tabs, rename `.md` → `.mdx`, add `import { Tabs, TabItem } from '@astrojs/starlight/components';` after the frontmatter, and convert `<!-- -->` comments to `{/* */}`. Astro resolves `.md` links to `.mdx` files — no link updates needed.
- For pages that closely track a specific upstream file, add at the bottom: `<!-- Upstream: informed by <repo> <path> -->`. Skip for pages that draw from multiple sources or are fully original.
- Follow the "Content rules" section below.

## Adding or updating code snippets

Check `.sources/examples` for existing examples with `#region` markers first:

```bash
grep -r "#region" .sources/examples/<lang>/<example>/
```

- **Markers found:** use the `<CodeExample>` component (requires `.mdx`). Paths in `snippet=` are relative to `.sources/examples/<lang>/`. A missing region is a build error — verify it exists.
- **No markers:** write inline if <30 lines; link to the GitHub file if longer.

Code examples are maintained in `dfinity/examples` — when that repo is updated, docs are updated alongside it.

## Reviewing a PR

Only when explicitly asked. Load `technical-documentation` and the relevant icskill first. Never offer or initiate a review unprompted.

### Initial review

*Mechanical checks:*
1. **Internal links** — `ls` every `[text](path.md)` target. Flag as broken only if neither `.md` nor `.mdx` exists.
2. **External URLs** — verify against the linking rules table below.
3. **CLI commands** — verify against `.sources/icp-cli/docs/reference/cli.md`.
4. **Frontmatter** — title and description present and consistent with body.
5. **Rules compliance** — no `dfx`, no `.mdx` without interactive components, relative `.md` links, `mo:core` not `mo:base`.

*Quality checks:*
6. **Reader test** — does the opening deliver on the title's promise and stand alone without assumed prior context?
7. **Funnel** — orient → explain/instruct → next steps. Flag buried leads and pages that end without direction.
8. **Scanability** — can a developer get the gist from headings and bold text alone?
9. **Accuracy** — cross-check technical claims against `.sources/`. Flag anything wrong or outdated.
10. **Developer empathy** — does it address what a developer will actually struggle with?

Post using this format:
```markdown
## Review: <page title>

### Must fix
- **<issue>**: <fix>

### Suggestions
- **<issue>**: <description>

### Verified
- <what was checked>
```
Omit empty sections. Always include "Verified."

### Follow-up review

Do NOT re-run the full checklist. Only check what was requested:
1. Verify each requested change was made correctly.
2. Check that fixes didn't introduce new issues (dangling links, broken frontmatter).

Post using this format:
```markdown
## Follow-up review: <page title>

### Fixed
- <confirmed correct>

### Still needs work
- <not addressed or addressed incorrectly>
```
Omit "Still needs work" if everything looks good.

## Addressing PR feedback

Read all three feedback sources before making any changes:

```bash
# Review body
gh api repos/{owner}/{repo}/pulls/<PR#>/reviews --jq '.[] | {user: .user.login, state: .state, body: .body}'
# Top-level comments
gh pr view <PR#> --json comments --jq '.comments[] | {author: .author.login, created: .createdAt, body: .body}'
# Inline comments (do not skip)
gh api repos/{owner}/{repo}/pulls/<PR#>/comments --jq '.[] | {user: .user.login, created_at: .created_at, path: .path, body: .body}'
```

A `<!-- feedback-addressed -->` comment covers feedback only up to its timestamp — check for inline comments posted after it.

After fixing, run `npm run build`, then:
```bash
git push
gh pr comment <PR#> --body "$(cat <<'EOF'
<!-- feedback-addressed -->
Feedback addressed:
- <what was fixed>
EOF
)"
```

**Automated reviewer feedback (Copilot, bots):** verify each claim against `.sources/` before acting. Often right on factual errors; often wrong on style preferences.

## Submitting

```bash
npm run build
git rebase origin/main
git push -u origin <branch>
gh pr create --title "<type>: <title>" --body "$(cat <<'EOF'
## Summary
<bullets>
EOF
)"
```

**PR body rule:** always use a single-quoted heredoc (`<<'EOF'`). Backticks and special characters pass through literally — never escape them manually inside the heredoc.

**Keep descriptions current:** if new commits change the scope of a PR, update the description immediately with `gh pr edit`.

**Merge conflicts:**
- Fresh PRs: rebase before first push
- Feedback fixes: commit and push only — do not rebase
- Approved PRs with conflicts: `git rebase origin/main && git push --force-with-lease`
- Never force-push a PR under active review

## Always

- Load relevant skills before writing (see "Skills" below)
- Use `icp` CLI commands — never `dfx`
- Use `mo:core` for Motoko imports — never `mo:base`. See `.sources/motoko/doc/md/base-core-migration.md` for the full mapping.
- Default to `.md`; use `.mdx` only for interactive components. Tab order: Motoko → Rust → others.
- Complete frontmatter on every page (title + description required)
- Document structural decisions in the PR description

## Ask first

- Creating or removing top-level sections
- Removing existing pages
- Changing the frontmatter schema
- Modifying sidebar configuration (`astro.config.mjs`)
- Adding a new `.sources/` submodule

## Never

- Reference `dfx` — it is deprecated and banned
- Use `mo:base` — use `mo:core` instead. Critical replacements: `Buffer` → `List`, `HashMap`/`TrieMap`/`Trie`/`RBTree` → `Map`, `Deque` → `Queue`, `OrderedMap` → `pure/Map`, `OrderedSet` → `pure/Set`
- Create `.mdx` without a clear need for interactive components
- Duplicate content that lives in external docs (icp-cli site, JS SDK docs, icskills)
- Edit synced files directly (`docs/languages/motoko/`, `docs/guides/tools/migrating-from-dfx.md`)
- Nest sidebar items more than 3 levels deep
- Add `Co-Authored-By` or any AI attribution to commits or PR descriptions
- Link to `internetcomputer.org/docs/` (retired) or `learn.internetcomputer.org` (content is now in this repo under `docs/concepts/`)
- Link to internal pages that don't exist — run `ls <target>` before linking. Links to `.mdx` files use `.md` extension.
- Link to an internal page without checking for a relevant section anchor — read the target page to find the most specific section that fits, then derive the anchor slug from its heading (lowercase, spaces → `-`, special chars stripped).
- Link to `https://cli.internetcomputer.org/` bare root — use the versioned path. Current slug: `0.2`; verify with `cat .sources/icp-cli/docs-site/versions.json`.
- Link externally when an internal page exists — check `docs/` first
- Write em-dashes (`—`) or use `--` as prose punctuation — use colon, semicolon, or parentheses instead. (`--` is fine inside code blocks as a CLI flag or comment.)
- Rename Candid field names, management canister API identifiers, or example repo names — these are protocol-level identifiers
- Remove domain-specific terms that are standard vocabulary in context: "DeFi"/"smart contract" in DeFi guides, "DAO"/"decentralized autonomous organization" in governance guides
- Offer, suggest, or perform PR reviews unless explicitly asked

## Key directories

- `docs/` — All documentation (`.md` by default). `src/content/docs/` symlinks here.
- `docs/languages/motoko/` — Auto-synced from `caffeinelabs/motoko` (do not edit directly)
- `docs/guides/tools/migrating-from-dfx.md` — Synced from `dfinity/icp-cli` (do not edit directly)
- `.sources/` — Pinned source submodules (read-only)
- `.agents/skills/` — Agent skill files. Run `git submodule update --init --depth 1` if broken.
- `.agents/submodule-bumping.md` — Procedures for bumping source submodules (maintainer use)

## Project structure

```
docs/
├── getting-started/        # Tutorials
├── guides/
│   ├── backends/
│   ├── canister-calls/
│   ├── canister-management/
│   ├── authentication/
│   ├── frontends/
│   ├── testing/
│   ├── security/
│   ├── chain-fusion/
│   ├── digital-assets/
│   └── governance/
├── concepts/               # Explanations
├── languages/              # Motoko (synced), Rust (hand-written)
└── references/             # Specifications and reference
```

## Source material

All source repos are pinned as git submodules under `.sources/`. Always read from `.sources/` — never from local clones, `gh api`, or training data. Do not modify `.sources/` — it is read-only.

```bash
git submodule update --init --depth 1   # do NOT use --recursive
```

Consult the relevant submodule when writing or reviewing:

| Topic | Submodule |
|-------|-----------|
| CLI commands and flags | `.sources/icp-cli/` — verify against `.sources/icp-cli/docs/reference/cli.md` |
| Motoko APIs (`mo:core`) | `.sources/motoko-core/` |
| Motoko compiler / syntax | `.sources/motoko/` |
| Rust CDK (`ic-cdk`, `ic-cdk-timers`) | `.sources/cdk-rs/` |
| JavaScript / TypeScript SDK | `.sources/icp-js-sdk-docs/` — unzip: `unzip -p .sources/icp-js-sdk-docs/public/<lib>/latest.zip <file>` |
| Code examples | `.sources/examples/` |
| CLI recipes | `.sources/icp-cli-recipes/` |
| Project templates | `.sources/icp-cli-templates/` |
| Canister IDs and skill files | `.sources/icskills/` |
| Candid spec | `.sources/candid/` |
| Certified variables | `.sources/response-verification/` |
| Chain Fusion Signer | `.sources/chain-fusion-signer/` |
| PAPI (payment API) | `.sources/papi/` |
| `@dfinity/ic-pub-key` CLI | `.sources/ic-pub-key/` |
| Internet Identity spec | `.sources/internetidentity/` |
| Technical documentation skill | `.sources/dotskills/` |

For current pinned versions, see `.sources/VERSIONS`.

For submodule bump procedures, see [`.agents/submodule-bumping.md`](.agents/submodule-bumping.md).

## Skills

Load skills matching the task before starting any content work. Run `git submodule update --init --depth 1` if skills appear as broken symlinks.

Always load for content writing:
- **`technical-documentation`** — quality and structure
- **`icp-brand-voice`** — vocabulary, banned terms, voice

Load the icskill matching the page topic:

| Topic | icskill |
|-------|---------|
| Bitcoin / ckBTC | `ckbtc` |
| Ethereum / EVM | `evm-rpc` |
| Certified variables | `certified-variables` |
| HTTPS outcalls | `https-outcalls` |
| SNS / governance | `sns-launch` |
| Identity / auth | `internet-identity` |
| Multi-canister | `multi-canister` |
| ICRC tokens / ledger | `icrc-ledger` |
| CLI / tooling | `icp-cli` |
| Frontend / asset canister | `asset-canister` |
| Cycles / billing | `cycles-management` |
| Stable memory | `stable-memory` |
| Security | `canister-security` |
| Wallet / DeFi | `wallet-integration` |
| vetKD / encryption | `vetkd` |

Topics without a dedicated icskill: on-chain AI, randomness/VRF, timers, Candid, chain-key tokens.

For design work (CSS, UI, marketing copy), also load `icp-brand-design`.

## Content rules

- **Spelling:** "onchain" and "offchain" (no hyphens). "icp-cli" in prose; `icp` in code blocks only.
- **Internal links:** `.md` extension always, even for `.mdx` targets. Relative paths only — never absolute like `/getting-started/quickstart/`.
- **No headings inside `<TabItem>` blocks** — use **bold text** instead.
- **Motoko:** use `mo:core` (`mops.one/core`), never `mo:base`.
- **Diataxis content types:**
  - `concepts/` — what and why; no CLI commands or step-by-step
  - `getting-started/` — linear tutorials with CLI commands
  - `guides/` — task-oriented how-to
  - `references/` — precise lookups, no tutorials
- End every page with a `## Next steps` section.

## Linking rules

| Resource | URL |
|----------|-----|
| CLI docs | https://cli.internetcomputer.org/ (versioned path required — see Never section) |
| Motoko core library | https://mops.one/core/docs |
| Rust CDK (`ic-cdk`) | https://docs.rs/ic-cdk/latest/ic_cdk/ |
| Rust stable structures | https://docs.rs/ic-stable-structures/latest/ic_stable_structures/ |
| Rust Candid | https://docs.rs/candid/latest/candid/ |
| JS SDK | https://js.icp.build |
| Agent skill files | https://skills.internetcomputer.org |

> Each Rust crate has its own URL — do not substitute. For crates not listed, use `https://docs.rs/<crate-name>/latest/<crate_name>/` (hyphens → underscores in the path).

## Frontmatter schema

```yaml
---
title: "Page Title"          # Required
description: "One-liner"     # Required
sidebar:
  order: 1                   # Optional — only where reading order matters
---
```

## Commands

- `npm run build` — production build (must pass before any push)
- `npm run dev` — local dev server
