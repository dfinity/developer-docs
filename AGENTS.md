# ICP Developer Docs — Agent & Contributor Instructions

ICP developer documentation built with Astro + Starlight.
All content is plain `.md` files. No `.mdx`. No JSX.
Goal: get developers (human and AI) building on the IC as fast as possible.

This file is the single source of truth for all agents (Claude Code, Codex, Cursor, etc.) and contributors. `CLAUDE.md` symlinks here.

**Current state:** All content is stub pages. Task coordination uses [Beads](https://github.com/steveyegge/beads) (`bd`). See "Multi-agent workflow" below.

## Quick orientation

1. Read this file for rules and boundaries
2. Run `./scripts/setup.sh` — initializes submodules, npm deps, Beads task DB, and verifies the build
3. Check `.docs-plan/decisions.md` before making any structural changes
4. Pick a task using the priority order in "Multi-agent workflow" below
5. Look up that task in `.docs-plan/migration-plan.md` for dependencies, source material, and effort
6. Do the work following the rules below
7. Record any structural decisions in `.docs-plan/decisions.md`

For research artifacts (portal triage, Learn Hub mapping, examples inventory), see `.docs-plan/README.md`.

## Multi-agent workflow

All tasks (content pages, infrastructure, tooling) are coordinated through [Beads](https://github.com/steveyegge/beads). Beads uses Dolt (version-controlled SQL) that syncs via `refs/dolt/data` — independent of content branches. Every agent sees the same task state regardless of which branch they're on.

### Task states

`open` → `in_progress` (claimed) → `draft` (PR opened) → `closed` (PR merged)

**Soft dependencies:** A task is "unblocked" when all its dependencies are at least `draft`. This means you can start a page once its dependency's PR exists — you don't need to wait for the merge.

### First-time setup (once per clone)

```bash
./scripts/setup.sh    # submodules, npm deps, Beads task DB, build check
```

If `bd` or `dolt` aren't installed, the script tells you how. Without them you can still write docs — check `.docs-plan/migration-plan.md` for tasks manually.

### Session start

```bash
bd dolt pull    # sync task state from remote
```

Then scan for work in this priority order:

**Priority 0 — Housekeeping** (keeps task state accurate, runs every session)

*Close merged PRs:* PRs may be merged manually without updating Beads. Check for `draft` tasks whose PRs are already merged:
```bash
bd list --status draft --json | jq -r '.[].notes'   # extract PR numbers
gh pr list --state merged --json number,title        # cross-reference
```
For each match, close the task:
```bash
bd update <id> --status closed && bd dolt push
bd show <id> --json | jq -r .status                  # MUST print "closed"
```

*Reclaim stale tasks:* If a task has been `in_progress` for >1 hour, the previous agent likely crashed. Reclaim it:
```bash
bd list --status in_progress --json | jq '.[] | {id, title, notes, updated_at}'
```
For each stale task: check how long it's been `in_progress` (compare `updated_at`). If >1 hour, it's safe to reclaim or reset to `open`. This applies to both fresh tasks and feedback fixes — an agent fixing PR feedback also sets the task to `in_progress`, so the same timeout catches crashed feedback-fix agents.

**Priority A — Address PR feedback** (unblocks reviews, highest value)

Check for PRs with formal "changes requested" reviews OR unresolved comment threads:
```bash
# Formal change requests
gh pr list --search "review:changes_requested" --json number,title,headRefName

# PRs with comments (may contain feedback)
gh pr list --state open --json number,title,headRefName,comments \
  --jq '.[] | select(.comments | length > 0) | {number, title, headRefName}'
```
For each PR with comments, read the timeline to determine if feedback is unaddressed:
```bash
gh pr view <PR#> --comments
```

**How to tell if feedback needs attention:** Read the PR comments chronologically. If the most recent substantive comment is a `<!-- feedback-addressed -->` reply (posted by an agent after fixing feedback), there is no unaddressed feedback — skip this PR. If there are review comments or feedback *after* the last `<!-- feedback-addressed -->` reply (or no such reply exists), there is unaddressed feedback to handle.

If unaddressed feedback exists, treat it the same as a formal "changes requested" review.

Cross-reference with Beads: the task should be in `draft` status. If it's `in_progress`, another agent is already on it — skip.

**Priority B — Rebase approved PRs with merge conflicts** (quick, unblocks merges)
```bash
gh pr list --json number,title,mergeable,reviewDecision \
  --jq '.[] | select(.mergeable == "CONFLICTING" and .reviewDecision == "APPROVED")'
```

**Priority C — New work**
```bash
bd ready    # shows unblocked tasks (deps in draft/closed)
```

### Claiming a task

Before any files are touched:
```bash
bd dolt pull                                          # refresh state — another agent may have claimed this
bd update <id> --status in_progress --claim && bd dolt push
bd show <id> --json | jq -r .status                   # MUST print "in_progress"
```
This is atomic — claim + push happens immediately. The race window for duplicate claims is negligible (sub-second).

### Pre-flight check

```bash
git fetch origin                      # always fetch latest state first
git ls-remote origin docs/<slug>      # branch exists?
gh pr list --head docs/<slug>         # PR exists?
```

Three outcomes:
- **Branch + PR exist** → "changes requested" pickup. `git checkout docs/<slug> && git rebase origin/main`
- **Branch exists, no PR** → stale from a crashed agent. Delete remote branch, start fresh from `main`
- **Neither exists** → fresh work. `git checkout -b docs/<slug> origin/main`

### Branch naming

- Content pages: `docs/<slug>` (e.g., `docs/concepts-canisters`, `docs/guides-backends-timers`)
- Infrastructure tasks: `infra/<slug>` (e.g., `infra/validation-scripts`, `infra/ci-workflows`)

### Doing the work

- **Fresh task:** Follow the "Content authoring workflow" below (for content pages) or task-specific instructions in `migration-plan.md` (for infrastructure)
- **PR feedback (formal reviews or comments):**
  1. **Claim the task** — set Beads status from `draft` to `in_progress` and push. This prevents other agents from picking up the same feedback.
     ```bash
     bd update <id> --status in_progress && bd dolt push
     bd show <id> --json | jq -r .status   # MUST print "in_progress"
     ```
  2. Read all feedback: `gh pr view <PR#> --comments` and `gh api repos/{owner}/{repo}/pulls/<PR#>/reviews --jq '.[] | {state, body}'`
  3. **Present a summary of the feedback to the user** — list each actionable item and your proposed fix
  4. **Wait for the user to confirm** which changes to make. Do not apply changes autonomously.
  5. After confirmation, check out the branch, apply the fixes, and push to the existing branch
  6. **Post a "Feedback addressed" reply** on the PR so future agents know this round of feedback is handled:
     ```bash
     gh pr comment <PR#> --body "$(cat <<'EOF'
     <!-- feedback-addressed -->
     Feedback addressed:
     - <bullet list of what was fixed>
     EOF
     )"
     ```
  7. **Return task to `draft`:**
     ```bash
     bd update <id> --status draft && bd dolt push
     bd show <id> --json | jq -r .status   # MUST print "draft"
     git checkout main
     ```

### Reviewing PRs

When asked to review a PR, load the `technical-documentation` skill and the relevant icskill for the page topic first.

**Mechanical checks:**
1. **Internal links** — `ls` every `[text](path.md)` target. Flag any that don't resolve to an existing file.
2. **External URLs** — verify against the linking rules table. Flag any guessed or wrong URLs (especially `docs.rs` crate links).
3. **CLI commands** — verify all `icp` commands and flags against `.sources/icp-cli/docs/reference/cli.md`.
4. **Frontmatter** — complete and consistent with the body (no contradictions in descriptions, time estimates, scope).
5. **Content rules compliance** — no `dfx` references, no `.mdx`/JSX, code examples <30 lines inline, relative links with `.md` extension, `core` not `base` for Motoko.

**Content quality checks:**
6. **Content brief coverage** — read the stub's `<!-- Content Brief -->` and `<!-- Source Material -->` comments. Does the page address every point in the brief? Was the source material actually consulted? Flag significant gaps or divergences.
7. **Completeness** — would a developer reading this page have enough information to accomplish the task or understand the concept? Flag missing prerequisites, unexplained terms, or logical gaps.
8. **Accuracy** — cross-check technical claims (memory limits, latency numbers, API behavior) against `.sources/` material. Flag anything that looks wrong or outdated.
9. **What's next links** — do they guide the reader to a logical next step? Are they all valid?

**Post a single PR comment** using this format:

```markdown
## Review: <page title>

### Must fix
- **<issue>**: <description and suggested fix>

### Suggestions
- **<issue>**: <description>

### Verified
- <what checked out> (e.g., "All CLI commands verified against .sources/icp-cli/docs/reference/cli.md")
```

Omit any section that has no items. Every review must include the "Verified" section to show what was actually checked.

### Submitting

**Fresh task:**
```bash
npm run build                         # must pass before submitting
git rebase origin/main                # prevent merge conflicts
git push -u origin docs/<slug>
gh pr create --title "docs: <page title>" --body "..."
bd update <id> --status draft --notes "PR #<number>" && bd dolt push
bd show <id> --json | jq -r .status   # MUST print "draft" — do not proceed until verified
git checkout main                     # return to main so the workspace is clean for the next task
```

**Changes requested fix** (also used after PR feedback fixes)**:**
```bash
git fetch origin main && git rebase origin/main    # rebase as part of the fix
npm run build                                      # must pass before pushing
git push
gh pr comment <PR#> --body "$(cat <<'EOF'
<!-- feedback-addressed -->
Feedback addressed:
- <bullet list of what was fixed>
EOF
)"
bd update <id> --status draft && bd dolt push
bd show <id> --json | jq -r .status   # MUST print "draft" — do not proceed until verified
git checkout main
```

**Rebase approved PR (Priority B):**
```bash
git fetch origin && git checkout <branch>
git rebase origin/main
git push --force-with-lease
git checkout main
```

> **CRITICAL — verify status after every `bd update`:**
> Agents have repeatedly failed to update Beads status despite clear instructions. After every `bd update` + `bd dolt push`, you **must** run `bd show <id> --json | jq -r .status` and confirm it prints the expected value (e.g. `draft`). If the status is wrong, fix it immediately. Do NOT move on until verification passes.

### Merge conflict policy

- **Always** rebase on `main` before pushing (both fresh PRs and "changes requested" fixes)
- **Don't** rebase PRs that are under review — force-pushing changes the diff the reviewer is looking at
- **Do** rebase approved PRs that are blocked by merge conflicts
- **Do** rebase as part of "changes requested" fixes

### After PR merge

```bash
bd update <id> --status closed && bd dolt push
bd show <id> --json | jq -r .status   # MUST print "closed"
```

### Agent can't finish

If you hit a blocker (missing source material, unclear requirements):
```bash
bd update <id> --status open --notes "Blocker: <describe>" && bd dolt push
bd show <id> --json | jq -r .status   # MUST print "open"
git checkout main                     # return to main
```
Add enough context in the notes so the next agent (or human) understands the blocker without needing to ask.

## Always (do these without asking)

- Read `.docs-plan/decisions.md` before proposing structural changes
- **Ensure all required skills are loaded** before starting any work (see "Skills (required)" section). This is a hard prerequisite — do not proceed without them.
- Use icp-cli commands in all CLI examples — never `dfx`
- Write plain `.md` files only — never `.mdx` or JSX
- Include complete frontmatter (see CONTRIBUTING.md for schema)
- Make code examples self-contained and copy-pasteable
- Link to external docs instead of duplicating content (see linking rules below)
- Read the stub page's `<!-- Source Material -->` and `<!-- Content Brief -->` comments before writing content
- Sync Beads before and after work: `bd dolt pull` at session start, `bd dolt push` after every status change
- Update task status in Beads immediately — claim before working, set `draft` after PR creation, set `closed` after merge
- Record structural decisions in `.docs-plan/decisions.md` immediately when making them — don't wait to be asked. This includes: new files/symlinks, path changes, config changes, cleanup of stale references, and any choice that a future agent would need to understand.

## Ask first (confirm with the user before doing these)

- Creating new top-level sections (getting-started, guides, concepts, languages, reference)
- Adding new pages not in the migration plan (propose in PR description, don't create)
- Removing existing pages from the structure
- Changing a page's sync recommendation from hand-written to synced (or vice versa)
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
- Modify the rationale or context of existing decisions in `.docs-plan/decisions.md` — you may remove entries that are fully reflected in the current codebase (renames, file moves, cleanup) but never alter the reasoning behind active decisions
- Add `Co-Authored-By` or any AI attribution to commits or PR descriptions
- Link to `internetcomputer.org/docs/` or `docs.internetcomputer.org` — the old docs site is being replaced by this project and those URLs will break. Link to pages in this site (relative paths, even stubs), Learn Hub, or explain inline. If a needed topic has no page, create a page proposal issue.
- Link to internal pages that don't exist — every `[text](path.md)` must resolve to an actual file. Agents have repeatedly linked to plausible-sounding paths (e.g., `reference/certified-variables.md`, `guides/backends/stable-memory.md`) that don't exist. Always `ls` the target before linking. If the page doesn't exist, find the correct existing page or file a page proposal issue.

## Key directories

- `docs/` — All documentation (`.md` only). This is the real directory; `src/content/docs/` is a symlink for Astro.
- `docs/languages/motoko/` — Auto-synced from `caffeinelabs/motoko` (do not edit directly)
- `docs/guides/tools/migrating-from-dfx.md` — Synced from `dfinity/icp-cli` (do not edit directly)
- `.docs-plan/` — Analysis artifacts, decisions, and progress tracking (see `.docs-plan/README.md`)
- `.sources/` — **Pinned submodules of upstream source repos** (see "Source material repos" below)
- `icp.yaml` — icp-cli project config (asset canister recipe)
- `.icp/data/` — Canister ID mappings (committed to git). `.icp/cache/` is gitignored.

## Project structure

```
docs/                       # All documentation (.md only) — src/content/docs/ symlinks here
├── index.md                # Landing page
├── getting-started/        # Tutorials (4 pages)
├── guides/                 # How-to guides (48 pages across 11 subsections)
│   ├── backends/           # Backend development patterns
│   ├── canister-calls/      # Candid interfaces, bindings, onchain and offchain calls
│   ├── frontends/          # Frontend development
│   ├── authentication/     # Auth integration
│   ├── testing/            # Testing strategies
│   ├── canister-management/ # Lifecycle, settings, cycles, optimization, deployment
│   ├── security/           # Security best practices
│   ├── chain-fusion/       # Cross-chain integration
│   ├── defi/               # Token and DeFi guides
│   ├── governance/         # SNS and DAO guides
│   └── tools/              # Developer tools
├── concepts/               # Explanations (13 pages)
├── languages/              # Language-specific (Motoko synced, Rust hand-written)
└── reference/              # Specifications and reference (13 pages)
```

## Source material repos (`.sources/`)

All upstream source repos are pinned as **git submodules** under `.sources/`. This ensures every agent reads the exact same content, regardless of when they run.

| Submodule | Repo | Pinned to | What it provides |
|-----------|------|-----------|-----------------|
| `.sources/portal` | `dfinity/portal` | `master` | Old docs content referenced in stub `<!-- Source Material -->` comments |
| `.sources/icp-cli` | `dfinity/icp-cli` | `v0.2.0` (latest release) | CLI reference, command syntax verification |
| `.sources/icp-cli-recipes` | `dfinity/icp-cli-recipes` | `main` | Recipe examples for CLI guides |
| `.sources/icp-cli-templates` | `dfinity/icp-cli-templates` | `main` | Project templates for getting-started |
| `.sources/icskills` | `dfinity/icskills` | `main` | Skill files with canister IDs and code patterns |
| `.sources/examples` | `dfinity/examples` | `master` | Code examples (link to for >30 line snippets) |
| `.sources/icp-js-sdk-docs` | `dfinity/icp-js-sdk-docs` | `main` | JS SDK documentation |

### Rules for agents

- **Always read source material from `.sources/`** — never from local clones, `gh api`, or your training data
- **Stub shorthand mapping:** `Portal: building-apps/foo.mdx` → `.sources/portal/docs/building-apps/foo.mdx`, `icp-cli: guides/bar.md` → `.sources/icp-cli/docs/guides/bar.md`
- **CLI command verification:** Check `.sources/icp-cli/docs/reference/cli.md` — do not guess flags or syntax
- **Do not modify `.sources/`** — these are read-only references. Edits go to the upstream repos.
- **After cloning this repo:** Run `git submodule update --init --depth 1` to fetch all submodules

### Bumping submodules

Only the project maintainer bumps submodule refs. When bumped:

1. Check what changed: `git -C .sources/<repo> log --oneline <old-ref>..<new-ref>`
2. Review if any existing docs pages are affected by the upstream changes
3. Update affected pages and note the bump in the PR description

## Planning artifacts (`.docs-plan/`)

Check these every session:

| File | What it answers |
|------|-----------------|
| `decisions.md` | "Has this been decided already?" — append-only decision log |
| `migration-plan.md` | "How do I execute this task?" — dependencies, source material, effort per page |

> **Task state** is tracked in Beads (`bd ready`), not in a file. See "Multi-agent workflow" above.

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

> **Task coordination:** Follow the "Multi-agent workflow" section above for claiming tasks, branch creation, and PR submission. The steps below cover the content writing process itself.

When drafting a new docs page:

1. Read the stub page — it contains content brief, source material, and cross-links
2. Read source material from `.sources/`. Stub references use shorthand — resolve them per the mapping in "Source material repos" above (e.g., `Portal: building-apps/foo.mdx` → `.sources/portal/docs/building-apps/foo.mdx`).
   > **If source material is unavailable at the expected path:** (1) search `.sources/portal/` for the content under a different path, (2) if truly unavailable, write from the content brief + icskills + your training knowledge, and add `<!-- Source unavailable: [path] — written from content brief -->` so future contributors know to verify.
3. Read any related icskills skill file from `.sources/icskills/` for accurate canister IDs and code patterns
4. Write the content:
   - Follow the content brief in the stub
   - Use icp-cli commands (never dfx)
   - **Verify all CLI commands and flags** against `.sources/icp-cli/docs/reference/cli.md` — never guess command syntax
   - **Verify all internal links** — every `[text](path.md)` must point to a file that exists. Run `ls <target-path>` before submitting. If the target page doesn't exist, either link to an existing page that covers the topic, or file a page proposal issue and note the missing link in your PR description. Never link to a path that doesn't exist.
   - **Verify all external URLs** — use the linking rules table below for known resources. For any URL not in the table (crate docs, npm packages, GitHub repos), verify it is correct. Do not guess or generalize from similar URLs (e.g., `docs.rs/ic-cdk` is NOT the same as `docs.rs/ic-stable-structures`).
   - **Self-consistency check** — before submitting, re-read your frontmatter description and body opening paragraph. They must not contradict each other (e.g., different time estimates, different scope claims).
   - Use plain markdown (never JSX/MDX)
   - Ensure complete frontmatter (see CONTRIBUTING.md)
   - Code examples: <30 lines inline, >30 lines link to `dfinity/examples`
   - Link to external docs per linking rules below
5. **Sync recommendation:** After reading source material, decide whether this page should be:
   - **Hand-written** — original content, no upstream equivalent
   - **Synced** — upstream repo has authoritative content that should be auto-synced (like Motoko docs)
   - **Upstream-informed** — hand-written but closely tracks an upstream source that should be monitored for changes
   Record your recommendation as an HTML comment at the bottom of the page:
   ```markdown
   <!-- Upstream: hand-written -->
   <!-- Upstream: sync from dfinity/icp-cli docs/guides/canister-migration.md -->
   <!-- Upstream: informed by dfinity/portal docs/building-apps/canister-management/settings.mdx -->
   ```
   Consider syncing when the upstream content is comprehensive, well-maintained, and a close fit. Prefer hand-writing when the page synthesizes multiple sources or serves a different audience than the upstream.
6. **Propose missing pages:** If source material reveals topics that aren't covered by any existing page in the plan (e.g., a canister migration guide in icp-cli with no corresponding docs page), create a GitHub Issue with the `page-proposal` label. Include: what the page would cover, where it would live in the structure, and which upstream source it would draw from. Reference the issue in your PR description. Do not create the page — just flag it for human discussion.
7. Submit: push branch, create PR, update Beads status to `draft` (see "Multi-agent workflow" above)
8. Review by the relevant team (see `.github/CODEOWNERS` and CONTRIBUTING.md review ownership table)

## Content rules

- **NEVER reference `dfx`** — it is deprecated. Use icp-cli instead.
- All docs must have complete frontmatter (see CONTRIBUTING.md for schema)
- Synced content must not be edited directly — edits must go to the source repo
- All code examples must be self-contained and copy-pasteable
- Code examples: <30 lines inline, >30 lines link to `dfinity/examples`
- No `.mdx` files. No JSX. Plain markdown only.
- Use relative paths with `.md` extension for internal links (e.g., `[Quickstart](../getting-started/quickstart.md)`). Never use absolute paths like `/getting-started/quickstart/` — they break on GitHub.
- Max sidebar nesting: 3 levels
- Images go in `src/assets/images/` organized by section (see CONTRIBUTING.md for details)
- When writing a page, decide case-by-case whether portal images are worth carrying over. Keep the existing hand-drawn visual style.
- **Motoko standard library:** Always use `core` (`mops.one/core`), never `base`. The `core` library supersedes `base`. Link to the synced base→core migration guide for developers still on `base`.

## Linking rules

| Content type | Link to |
|-------------|---------|
| CLI commands | https://dfinity.github.io/icp-cli/ |
| Motoko standard library | https://mops.one/core/docs (core supersedes base) |
| Rust CDK API (`ic-cdk`) | https://docs.rs/ic-cdk/latest/ic_cdk/ |
| Rust stable structures (`ic-stable-structures`) | https://docs.rs/ic-stable-structures/latest/ic_stable_structures/ |
| Rust Candid (`candid`) | https://docs.rs/candid/latest/candid/ |
| JS SDK | https://js.icp.build |
| Protocol internals | https://learn.internetcomputer.org |
| Agent skill files | https://skills.internetcomputer.org |

> **Important:** Each Rust crate has its own `docs.rs` URL. Do NOT substitute one crate URL for another — `docs.rs/ic-cdk` is NOT the same as `docs.rs/ic-stable-structures`. If you need to link a crate not in this table, construct the URL as `https://docs.rs/<crate-name>/latest/<crate_name>/` (note: hyphens in crate name become underscores in the path).

## External docs (don't duplicate these)

| Resource | URL |
|----------|-----|
| icp-cli | https://dfinity.github.io/icp-cli/ |
| JS SDK | https://js.icp.build |
| icskills | https://skills.internetcomputer.org |
| Learn Hub | https://learn.internetcomputer.org |
| Motoko core library | https://mops.one/core/docs (supersedes base; migration guide is synced from Motoko repo) |
| Rust CDK API (`ic-cdk`) | https://docs.rs/ic-cdk/latest/ic_cdk/ |
| Rust stable structures (`ic-stable-structures`) | https://docs.rs/ic-stable-structures/latest/ic_stable_structures/ |

## Skills (required)

Skills are a **hard prerequisite** — do not start any content work, review, or ICP-related task without them. At session start, verify skills are loaded. If not, install them:

```bash
# Technical documentation skill (drafting and reviewing docs quality)
npx skills add https://github.com/vincentkoc/dotskills --skill technical-documentation

# ICP development skills (canister IDs, code patterns, common pitfalls)
npx skills add .sources/icskills
```

- **`technical-documentation`** — Load before drafting or reviewing any docs page
- **icskills** (17 skills) — Load the relevant skill before writing any feature-specific content. Skills are in `.sources/icskills/` (pinned submodule). Use the skill that matches the page topic (e.g., `ckbtc` for Bitcoin guides, `multi-canister` for architecture pages, `icp-cli` for CLI guides).

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

> **Tech stack note:** Using Astro 6 + Starlight 0.38. The Zod v4 sitemap override from earlier versions has been removed.

## Previous work

Branch `restructuring-attempt-1` preserves the previous attempt with 124 pages, CI workflows, sync scripts, and `DOCS_RESTRUCTURING_PROPOSAL.md`.

<!-- BEGIN BEADS INTEGRATION -->
## Beads reference

> **Workflow** is covered in the "Multi-agent workflow" section above (session start, claiming, submitting, merge conflicts). This section covers Beads-specific details that agents need.

### Task structure

Tasks are organized as **epics** (sprints + infrastructure) with **child tasks** (individual pages/infra items). `bd list` defaults to 50 items — use `bd list --limit 0` to see all. Use `bd show <epic-id>` to drill into a sprint's children.

### Creating issues

```bash
bd create "Issue title" -d "Detailed context" -t bug|feature|task -p 0-4 --json
bd create "Found bug" -t bug -p 1 --deps discovered-from:<parent-id> --json
```

### Issue types

- `bug` — Something broken
- `feature` — New functionality
- `task` — Work item (tests, docs, refactoring)
- `epic` — Large feature with subtasks
- `chore` — Maintenance (dependencies, tooling)

### Priorities

- `0` — Critical (security, data loss, broken builds)
- `1` — High (major features, important bugs)
- `2` — Medium (default)
- `3` — Low (polish, optimization)
- `4` — Backlog (future ideas)

### Important rules

- Use `bd` for ALL task tracking — do NOT create markdown TODO lists or external trackers
- Always use `--json` flag when parsing output programmatically
- Link discovered work with `discovered-from` dependencies
- Check `bd ready` before asking "what should I work on?"

### Session completion

The "Submitting" section above handles the normal flow (build → push → PR → Beads update → checkout main). This checklist covers anything that may remain at session end:

1. **No uncommitted changes** — `git status` must show a clean working tree. If you have unfinished work, either commit + push it on the task branch, or stash and reset the task to `open` (see "Agent can't finish")
2. **File issues** for discovered work with `bd create`
3. **Beads is synced** — every status change was followed by `bd dolt push` and verified
4. **On `main`** — you should already be on `main` from the submit step. If not: `git checkout main`

Work is NOT complete until all changes are pushed and Beads is synced. Never stop before pushing — that leaves work stranded locally.
<!-- END BEADS INTEGRATION -->
