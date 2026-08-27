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

- Verify CLI commands, API signatures, and technical claims against the source material for that topic (see "Source material" below). Never verify from memory.
- **CLI commands:** verify every flag against `docs/reference/cli.md` in `dfinity/icp-cli` at the ref pinned in `.sources/upstream.json` — never guess syntax:
  ```bash
  curl -sL https://raw.githubusercontent.com/dfinity/icp-cli/<pinned>/docs/reference/cli.md
  ```
- **Internal links:** run `ls <target>` before adding any link. Always use `.md` extension, even for `.mdx` targets.
- **External URLs:** use the "Linking rules" table below. Verify any URL not in the table — do not guess.
- **Flag uncertainty:** add `<!-- Needs human verification: [reason] -->` next to any claim you can't verify against a pinned source. Never silently guess.
- **Do not invent command output** — copy from an upstream README or test fixture, or write `<!-- TODO: verify output -->`.
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
3. **CLI commands** — verify against `docs/reference/cli.md` in `dfinity/icp-cli` at the pinned ref (see "Source material").
4. **Frontmatter** — title and description present and consistent with body.
5. **Rules compliance** — no `dfx`, no `.mdx` without interactive components, relative `.md` links, `mo:core` not `mo:base`.

*Quality checks:*
6. **Reader test** — does the opening deliver on the title's promise and stand alone without assumed prior context?
7. **Funnel** — orient → explain/instruct → next steps. Flag buried leads and pages that end without direction.
8. **Scanability** — can a developer get the gist from headings and bold text alone?
9. **Accuracy** — cross-check technical claims against the pinned source material. Flag anything wrong or outdated.
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
- Duplicate content that lives in external docs (icp-cli site, JS SDK docs, the IC skills)
- Edit synced files directly (`docs/languages/motoko/`, `docs/references/internet-identity-spec.md`, `docs/references/verifiable-credentials-spec.md`)
- Nest sidebar items more than 3 levels deep
- Add `Co-Authored-By` or any AI attribution to commits or PR descriptions
- Link to `internetcomputer.org/docs/` (retired) or `learn.internetcomputer.org` (content is now in this repo under `docs/concepts/`)
- Link to internal pages that don't exist — run `ls <target>` before linking. Links to `.mdx` files use `.md` extension.
- Link to an internal page without checking for a relevant section anchor — read the target page to find the most specific section that fits, then derive the anchor slug from its heading (lowercase, spaces → `-`, special chars stripped).
- Link to `https://cli.internetcomputer.org/` bare root — use the versioned path. Current slug: `1.3`. It is the `major.minor` of the latest icp-cli release, and the docs always track the latest. Do not read it from the repo's `docs-site/versions.json`: at a release tag that file still lists the *previous* slug, because the docs-site version bump lands as a follow-up commit after the tag. Confirm the live slug at the docs-site root (it redirects to the latest version), and see `.agents/upstream-tracking.md` for the full slug-bump procedure.
- Link externally when an internal page exists — check `docs/` first
- Write em-dashes (`—`) or use `--` as prose punctuation — use colon, semicolon, or parentheses instead. (`--` is fine inside code blocks as a CLI flag or comment.)
- Rename Candid field names, management canister API identifiers, or example repo names — these are protocol-level identifiers
- Remove domain-specific terms that are standard vocabulary in context: "DeFi"/"smart contract" in DeFi guides, "DAO"/"decentralized autonomous organization" in governance guides
- Offer, suggest, or perform PR reviews unless explicitly asked

## Key directories

- `docs/` — All documentation (`.md` by default). `src/content/docs/` symlinks here.
- `docs/languages/motoko/` — Auto-synced from `caffeinelabs/motoko` (do not edit directly)
- `docs/references/internet-identity-spec.md`, `docs/references/verifiable-credentials-spec.md` — Synced from `dfinity/internet-identity` (do not edit directly)
- `.sources/` — Vendored submodules, read-only, plus `upstream.json` (watched repos) and `VERSIONS` (submodule pins)
- `.claude/skills/` — Skills. IC skills are mirrored by `.claude/sync-ic-skills.sh` and not committed; `icp-brand-design`, `icp-brand-voice`, and `technical-documentation` are maintained here
- `.agents/upstream-tracking.md` — How upstreams are tracked and bumped (maintainer use)

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

Upstream repos are tracked two ways. Which one decides where you read from.

**Vendored as submodules** — three repos, because the build opens their files.
Read them from disk; do not edit them.

```bash
git submodule update --init --depth 1   # do NOT use --recursive
```

| Topic | Submodule |
|-------|-----------|
| Motoko compiler / syntax, synced Motoko pages | `.sources/motoko/` |
| Internet Identity and VC specs | `.sources/internetidentity/` |
| Code examples (`snippet=`, `<CodeExample>`) | `.sources/examples/` |

Pinned versions: [`.sources/VERSIONS`](.sources/VERSIONS). `motoko` and
`internetidentity` are release-checked and synced by their own workflows;
`examples` tracks a branch and is checked by the weekly **Upstream release
check**. Canister IDs and code patterns are in the skills (see "Skills").

**Watched** are the repos where a release can silently invalidate a lot of what
is published, so [`.sources/upstream.json`](.sources/upstream.json) records the
ref the docs are verified against and a weekly workflow opens an issue when one
moves. Read the file you need at that **pinned ref**:

```bash
curl -sL https://raw.githubusercontent.com/<repo>/<pinned-ref>/<path>
```

Use `raw.githubusercontent.com`, not `gh api .../contents/...`: the API returns
base64 that gets truncated, and a truncated reference is worse than none because
it looks complete. Read the pinned ref rather than `main`, so a review is
reproducible and a page cannot document something from a release whose links we
have not adapted yet.

| Topic | Repo | Verify against |
|-------|------|----------------|
| CLI commands and flags | `dfinity/icp-cli` | `docs/reference/cli.md` |
| Recipe versions in `icp.yaml` | `dfinity/icp-cli-recipes` | `recipes/<name>/` |
| Motoko APIs (`mo:core`) | `dfinity/motoko-core` | `src/`, `Changelog.md` |
| Rust CDK (`ic-cdk`) | `dfinity/cdk-rs` | `ic-cdk/src/`, `ic-cdk/CHANGELOG.md` |
| JS SDK core (`@icp-sdk/core`) | `dfinity/icp-js-core` | `src/`, `CHANGELOG.md` |
| JS SDK canisters (`@icp-sdk/canisters`) | `dfinity/icp-js-canisters` | `src/`, `CHANGELOG.md` |

**Reference** repos are drawn on too lightly to be worth a weekly issue, so they
carry no pin. Verify against the **latest** release on demand; the surface is
small enough that the next edit to those pages catches any drift.

| Topic | Repo | Verify against |
|-------|------|----------------|
| Project templates | `dfinity/icp-cli-templates` | the template's `icp.yaml` |
| Candid spec | `dfinity/candid` | `spec/Candid.md` |
| Certified variables | `dfinity/response-verification` | `packages/<pkg>/README.md` |
| Chain Fusion Signer | `dfinity/chain-fusion-signer` | the canister's `.did` |
| PAPI (payment API) | `dfinity/papi` | `README.md` |
| `@dfinity/ic-pub-key` CLI | `dfinity/ic-pub-key` | `README.md` |

Several of these also publish authoritative docs (the `reference` field in
`upstream.json`). Those are what to **link readers to**; for verifying a claim,
prefer the source file, since a published site always shows "latest".

For the tracking and bump procedures, see
[`.agents/upstream-tracking.md`](.agents/upstream-tracking.md).

## Skills

Load skills matching the task before starting any content work.

Skills live in `.claude/skills/` and come from two places.

**The IC skills** are mirrored from
[skills.internetcomputer.org](https://skills.internetcomputer.org) by
`.claude/sync-ic-skills.sh`, which runs on session start, re-downloads only what
changed, and keeps whatever is on disk when the registry is unreachable. They are
**not committed**, so a skill changing upstream leaves nothing to review.

**Three skills are maintained in this repo** and are committed:
`icp-brand-design`, `icp-brand-voice`, and `technical-documentation`. None of
them is on the registry. The sync only prunes skills it installed itself, so it
never touches them.

Read a skill's `SKILL.md` from `.claude/skills/<name>/` at any point; the files
are plain markdown with frontmatter and nothing about them is Claude-specific.

### Skills outside Claude Code

The session-start hook is Claude Code only, and automatic skill loading is
specific to every harness, so nothing loads skills automatically elsewhere. What
is portable is where to get them:

- **The IC skills:** fetch `https://skills.internetcomputer.org/.well-known/skills/index.json`
  once, then fetch the matching skill's `SKILL.md` before writing. No repo state
  is involved, and it is always current. This is the path to use in Cursor,
  Copilot, Codex, and anything else that is not Claude Code. Do not read the IC
  skills from `.claude/skills/` outside Claude Code: they are gitignored, so a
  fresh clone has none of them until a sync has run.
- **The three repo-maintained skills:** read them from `.claude/skills/<name>/`.
  They are in git, so they are present in every clone.

To force a refresh in a running Claude Code session, or to populate the
directory by hand, run `bash .claude/sync-ic-skills.sh`.

If one of the three repo-maintained names is ever published to the registry, the
sync replaces the local copy with the published one. That is the right outcome
when we publish a skill deliberately, so delete the local copy in the same change
rather than working around it.

Always load for content writing:
- **`technical-documentation`** — quality and structure
- **`icp-brand-voice`** — vocabulary, banned terms, voice

Load the skill matching the page topic:

| Topic | Skill |
|-------|-------|
| Bitcoin / ckBTC | `ckbtc` |
| Ethereum / EVM | `evm-rpc` |
| Certified variables | `certified-variables` |
| HTTPS outcalls | `https-outcalls` |
| SNS / governance | `sns-launch` |
| Identity / auth | `internet-identity` |
| Agent sign-in / web identity | `agent-web-identity` |
| Multi-canister | `multi-canister` |
| ICRC tokens / ledger | `icrc-ledger` |
| CLI / tooling | `icp-cli` |
| Motoko package management | `mops-cli` |
| Motoko language | `writing-motoko`, `migrating-motoko-actors` |
| Frontend / static site hosting | `static-site` |
| Custom domains | `custom-domains` |
| Agent discoverability | `service-discoverability` |
| Cycles / billing | `cycles-management` |
| Stable memory | `stable-memory` |
| Security | `canister-security` |
| Wallet / DeFi | `wallet-integration` |
| vetKeys / encryption | `vetkeys`, `encrypted-maps` |
| Dashboard APIs | `ic-dashboard` |

Topics with no dedicated skill: on-chain AI, randomness/VRF, timers, Candid,
chain-key tokens.

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
