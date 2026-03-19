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

**Prerequisites** (install before running setup):

| Tool | Install | Purpose |
|------|---------|---------|
| Node.js ≥ 20 | https://nodejs.org or `nvm install 20` | Astro build, npm packages |
| Dolt | `brew install dolt` (macOS) or https://github.com/dolthub/dolt/releases | Version-controlled SQL database for task state |
| Beads (`bd`) | `npm install -g @beads/bd` | Task tracking CLI that uses Dolt |

**SSH access required:** Beads syncs task state via `refs/dolt/data` using the git remote. This requires SSH access to `github.com:dfinity/developer-docs.git`. If you cloned via HTTPS, ensure `git fetch origin refs/dolt/data` works — if not, add an SSH key or configure `gh auth setup-git`.

Then run:
```bash
./scripts/setup.sh    # submodules, npm deps, Beads task DB, Dolt server, build check
```

The script will:
1. Initialize git submodules (`.sources/` — upstream reference repos)
2. Install npm dependencies
3. Bootstrap the Beads/Dolt database from the git remote (or sync if already present)
4. Start the Dolt server and verify the database is accessible
5. Run a build check

After setup, verify: `bd ready` should list ~47 open tasks.

Without `bd`/`dolt` you can still write docs — check `.docs-plan/migration-plan.md` for tasks manually.

### Parallel agents (worktrees)

For batch operations like addressing PR feedback across multiple PRs, Claude Code can launch background agents in isolated git worktrees. Each agent works on a separate branch without conflicts.

**Prerequisites:**
- `.claude/settings.json` (committed to git) pre-approves tools that agents need (Bash, Edit, Read, etc.). Without this, background agents block waiting for interactive permission approval that never comes.
- `.claude/settings.local.json` and `.claude/worktrees/` are gitignored (local-only).

**How it works:**
1. The parent agent claims tasks in Beads, then launches one background agent per PR/task using `isolation: "worktree"`
2. Each agent gets its own git worktree (isolated copy of the repo), checks out its branch, makes edits, and commits
3. **Each worktree agent must initialize submodules as its first step** (see "Submodule initialization in worktrees" below)
4. The parent agent collects results, pushes branches from worktrees (`git -C <worktree-path> push`), and posts feedback-addressed comments
5. The parent agent cleans up worktrees after all work is done:
   ```bash
   git worktree remove --force <path>           # for each worktree (--force needed due to submodules)
   git worktree prune                           # clean up stale references
   git branch -D $(git branch | grep worktree-agent)  # delete backing branches
   ```

**Submodule initialization in worktrees:** Git worktrees do NOT automatically initialize submodules. A freshly created worktree has empty `.sources/` directories, which means all skill symlinks (`.claude/skills/` → `.agents/skills/` → `.sources/`) are broken and source material is inaccessible. **Every worktree agent must run this as its very first command before any other work:**
```bash
git submodule update --init --depth 1
```
This takes ~30 seconds and uses ~336MB of disk per worktree (shallow clones). The disk space is reclaimed when the worktree is removed. Without this step, the agent cannot load skills, read source material from `.sources/`, or verify code snippets — it will produce lower quality content or fail entirely. The parent agent must include this instruction in every worktree agent's prompt.

**If agents fail with permission errors:** Check that `.claude/settings.json` exists and includes all required tools. The shared settings file is the authoritative source — per-user `~/.claude/projects/` settings don't apply to worktree agents (different path). **Important:** Permission patterns use prefix matching, so chained commands like `git stash && git rebase` won't match a `git stash*` pattern — the `&&` makes it a single shell string. Worktree agents should run git commands as **separate sequential tool calls**, not chained with `&&`.

**Beads safety:** Worktree agents share the parent's `.beads/` directory and Dolt server. Concurrent `bd` commands can corrupt the Dolt journal.
- **Only the parent agent** may run `bd` commands (claim, update, push, pull)
- **Worktree agents must NEVER run `bd`** — they only write content, build, and commit
- **Serialize all `bd` calls** — never run `bd update` for multiple tasks in parallel; always wait for one to complete before starting the next
- Auto-backup is enabled (`.beads/config.yaml`) — JSONL snapshots go to `.beads/backup/` every 15 min as a local safety net
- **NEVER run `bd init --force`** without explicit user confirmation — this can destroy the database
- **NEVER run `bd dolt push` after a re-init** without verifying the local DB has the correct data — pushing an empty or corrupted DB overwrites the remote
- **NEVER delete `refs/dolt/data`** — this is the only remote copy of all task state. Do not run `git push origin --delete refs/dolt/data` or any command that modifies this ref directly.

**Dolt recovery:** If the Dolt journal becomes corrupted (symptoms: `circuit breaker is open`, `corrupted journal`, `invalid journal record length`), or the local DB is stale after another agent updated the remote, use the clean recovery procedure in "Session start" below.

**Dolt restart after worktree work:** If you need to restart the Dolt server while worktrees exist, always ensure your working directory is the **main repo root** before running `bd dolt start`. If you restart from a worktree path, `bd` will serve the worktree's `.beads/` directory (which has no database), causing "database not found" errors.

### Session start

```bash
bd dolt start   # ensure Dolt server is running (no-op if already up)
bd dolt pull    # sync task state from remote
```

**Verify the pull worked:** Another agent may have updated task state from a different environment since your last session. After pulling, cross-reference Beads against GitHub to catch stale local state:
```bash
bd list --status draft --limit 0    # should match open PRs
gh pr list --state open --json number,title
```
If open PRs exist but no corresponding `draft` tasks appear (or tasks that should be `draft` still show `open`), the local DB is stale and the pull did not merge correctly. **Do not make any `bd update` calls against a stale DB** — this will cause merge conflicts on push. Instead, do a clean recovery:
```bash
pkill -9 -f dolt
rm -rf .beads/dolt
bd dolt start
bd init --force --prefix developer-docs   # safe: only destroys local, pulls from remote
# restart server after init (init may not reconnect automatically)
pkill -9 -f dolt
bd dolt start
bd dolt pull
bd list --limit 5                          # verify data is correct
```
Only after verifying correct state should you proceed with updates. **Do NOT `bd dolt push` until you have confirmed the local DB matches expected state.**

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
For each PR with comments, check **all three** feedback sources (these are separate API endpoints):
```bash
# 1. Review body (text attached to the review decision — often contains high-level feedback)
gh api repos/{owner}/{repo}/pulls/<PR#>/reviews --jq '.[] | {user: .user.login, state: .state, body: .body}'

# 2. Top-level PR comments (includes feedback-addressed markers)
gh pr view <PR#> --json comments --jq '.comments[] | {author: .author.login, created: .createdAt, body: .body}'

# 3. Inline review comments (file-level feedback — NOT included in the above two)
gh api repos/{owner}/{repo}/pulls/<PR#>/comments --jq '.[] | {user: .user.login, created_at: .created_at, path: .path, body: .body}'
```

**How to tell if feedback needs attention:** You must compare timestamps across both comment streams. A `<!-- feedback-addressed -->` marker only appears as a top-level comment — it does NOT cover inline review comments posted after it.

Concrete procedure:
1. Find the timestamp of the most recent `<!-- feedback-addressed -->` top-level comment (if any)
2. Check if ANY top-level comments or inline review comments were posted **after** that timestamp
3. If yes → there is unaddressed feedback. If no such marker exists → all feedback is unaddressed.

**Common mistakes:** (1) Missing the review body — the text attached to a "changes requested" review decision often contains feedback that doesn't appear in either comment stream. (2) Only checking top-level comments and seeing `<!-- feedback-addressed -->` as the last one. Inline review comments live in a separate API endpoint and are often posted later (by reviewers or bots like Copilot). You MUST check all three sources.

If unaddressed feedback exists, treat it the same as a formal "changes requested" review.

**Automated reviewer feedback (Copilot, bots):** Treat automated review comments (e.g., GitHub Copilot) as suggestions worth investigating, not as authoritative. Do NOT blindly accept or blindly ignore them. For each automated comment:
1. **Verify the claim** — check `.sources/`, the codebase, or upstream docs. Is the comment factually correct?
2. **Assess the impact** — even if technically correct, is the suggestion meaningful? Pedantic or stylistic nitpicks can be skipped.
3. **Include in your feedback summary** — present automated feedback alongside human feedback when summarizing for the user, clearly labeled as automated. Let the user decide.

Common patterns where Copilot is often right: factual inaccuracies (wrong API names, incorrect behavior descriptions), internal inconsistencies within a page, misleading implications. Common patterns where Copilot is often wrong or unhelpful: style preferences, over-qualifying already-clear statements, suggesting changes that conflict with project conventions.

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

**Claiming multiple tasks (for parallel agents):** When claiming several tasks before launching worktree agents, claim them **sequentially** — wait for each `bd update && bd dolt push` to finish before starting the next. Never run `bd` calls in parallel; this can corrupt the Dolt journal.

### Pre-flight check

```bash
git fetch origin                      # always fetch latest state first
git ls-remote origin docs/<slug>      # branch exists?
gh pr list --head docs/<slug>         # PR exists?
```

Three outcomes:
- **Branch + PR exist** → "changes requested" pickup. `git checkout docs/<slug> && git pull origin docs/<slug>`
- **Branch exists, no PR** → stale from a crashed agent. Delete remote branch, start fresh from `main`
- **Neither exists** → fresh work. `git checkout -b docs/<slug> origin/main`

### Branch naming

- Content pages: `docs/<slug>` (e.g., `docs/concepts-canisters`, `docs/guides-backends-timers`)
- Infrastructure tasks: `infra/<slug>` (e.g., `infra/validation-scripts`, `infra/ci-workflows`)

### Doing the work

- **Fresh task:** Follow the "Content authoring workflow" below (for content pages) or task-specific instructions in `migration-plan.md` (for infrastructure). Every content page must include an `<!-- Upstream: -->` comment (see "Always" section) and the PR must include a `## Sync recommendation` section.
- **PR feedback (formal reviews or comments):**
  1. **Claim the task(s)** — set Beads status from `draft` to `in_progress` and push. This prevents other agents from picking up the same feedback. **When handling multiple PRs:** claim ALL tasks sequentially (see "Claiming multiple tasks" above) before launching any worktree agents or starting any fixes.
     ```bash
     bd update <id> --status in_progress && bd dolt push
     bd show <id> --json | jq -r .status   # MUST print "in_progress"
     ```
  2. Read all feedback from **all three sources** (see Priority A above): review body, top-level comments, and inline review comments. Do not start fixing until you have read all three.
  3. **Evaluate each feedback item** — cross-check claims against `.sources/`. Is the reviewer's suggestion technically correct? Does the proposed fix actually improve the page? Flag any feedback you disagree with and explain why.
  4. **Present a summary of the feedback to the user** — list each actionable item with your assessment: agree (with proposed fix), partially agree (with alternative), or disagree (with reasoning). The user makes the final call.
  5. **Wait for the user to confirm** which changes to make. Do not apply changes autonomously.
  6. After confirmation, check out the branch and apply the fixes. **When fixing multiple PRs:** launch parallel worktree agents with specific instructions per PR (the parent has already done the analysis and gotten user confirmation — agents just execute).
  7. **Post-fix verification** — before pushing:
     1. Re-read the full page — does it still flow and make sense as a whole?
     2. `ls` any new or changed link targets to confirm they exist
     3. If the fix moves content elsewhere, confirm the target page covers it (or flag with `<!-- TODO -->`)
     4. **Update the `<!-- Upstream: -->` comment** if new source material was referenced — every `.sources/` repo or upstream doc used must be listed. This comment is checked by CI.
  8. Push to the existing branch
  9. **Update the PR description** to reflect the current state of the page. The description is used as the squash-merge commit message, so it must accurately describe what the PR delivers — not what the original draft contained. Update **both** the "Summary" (to reflect new/changed content) **and** "Sync recommendation" (to match the in-page `<!-- Upstream: -->` comment). Use `gh pr edit <PR#> --body "..."` to update it.
  10. Submit using the "Changes requested fix" flow in "Submitting" below (build, push, post feedback-addressed comment, return task to `draft`).

### Reviewing PRs

**Only review PRs when explicitly asked by a human.** See `.docs-plan/review-guidelines.md` for the full review checklist (mechanical checks, content quality, post format). Key points: load the `technical-documentation` skill and relevant icskill first.

**Parallel reviews use worktrees** — reviews need to check out the PR branch (to read the full page, verify links with `ls`, run `npm run build`). For parallel reviews, launch worktree agents the same way as for content writing. Each agent must run `git submodule update --init --depth 1` first (see "Submodule initialization in worktrees" above) to access skills and `.sources/`.

**Presenting and posting review results:** When a subagent completes a review, the parent agent must:
1. Present the **full detailed findings** to the user — not a condensed summary. The user needs the complete review (must-fix issues, suggestions, verified items) to make informed decisions.
2. **Post the review as a PR comment** (`gh pr comment`) before any fixes are attempted. This ensures the review is visible on the PR even if the agent session ends or the dev wants to fix issues manually.

For non-review subagents (content writing, infrastructure), a brief summary is sufficient since the user can inspect the PR/diff directly.

### Submitting

**Fresh task:**
```bash
npm run build                         # must pass before submitting
git rebase origin/main                # prevent merge conflicts
git push -u origin docs/<slug>
gh pr create --title "docs: <page title>" --body "$(cat <<'EOF'
## Summary
<bullet list of what the page covers and key decisions>

## Sync recommendation
<one of: `hand-written`, `sync from <repo> <path>`, or `informed by <repo> — <files>`>
EOF
)"
bd update <id> --status draft --notes "PR #<number>" && bd dolt push
bd show <id> --json | jq -r .status   # MUST print "draft" — do not proceed until verified
git checkout main                     # return to main so the workspace is clean for the next task
```

**Changes requested fix** (also used after PR feedback fixes)**:**
```bash
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

- **Fresh PRs** — rebase on `main` before the first push (ensures a clean start, no force-push needed)
- **Feedback fixes** — just commit and push. Do NOT rebase unless the branch has merge conflicts with `main`. Unnecessary rebases cause force-pushes, which rewrite history and can lose work.
- **Approved PRs with merge conflicts** (Priority B) — rebase + `git push --force-with-lease`. This is the only case where force-push is justified.
- **Never force-push a PR that is under active review** — it changes the diff the reviewer is looking at

### After PR merge

**Never close a task unless its PR is merged.** Always verify first:
```bash
gh pr view <PR#> --json state --jq .state   # MUST print "MERGED"
bd update <id> --status closed && bd dolt push
bd show <id> --json | jq -r .status         # MUST print "closed"
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
- **Ensure all required skills are accessible** before starting any work (see "Skills (required)" section). Skills are pre-installed as symlinks — if they appear broken, run `git submodule update --init --depth 1`. Do not start content or review work if skills are inaccessible.
- Use icp-cli commands in all CLI examples — never `dfx`
- Write plain `.md` files only — never `.mdx` or JSX
- Include complete frontmatter (see CONTRIBUTING.md for schema)
- Make code examples self-contained and copy-pasteable
- Flag uncertainty with `<!-- Needs human verification: [reason] -->` rather than guessing — it is always better to flag than to be silently wrong
- Link to external docs instead of duplicating content (see linking rules below)
- Read the stub page's `<!-- Source Material -->` and `<!-- Content Brief -->` comments before writing content
- Sync Beads before and after work: `bd dolt pull` at session start, `bd dolt push` after every status change
- Update task status in Beads immediately — claim before working, set `draft` after PR creation, set `closed` after merge
- Record structural decisions in `.docs-plan/decisions.md` immediately when making them — don't wait to be asked. This includes: new files/symlinks, path changes, config changes, cleanup of stale references, and any choice that a future agent would need to understand.
- **Every non-stub content page must end with an `<!-- Upstream: -->` comment** — this is enforced by CI (`check-upstream-notes` workflow). Use exactly one of these formats:
  - `<!-- Upstream: hand-written -->` — original content, not derived from another repo
  - `<!-- Upstream: sync from <repo> <path> -->` — auto-synced, do not edit directly
  - `<!-- Upstream: informed by <repo> — <files> -->` — rewritten from upstream sources
  List **every** `.sources/` repo used — including icskills when they informed the content. Example: `<!-- Upstream: informed by dfinity/portal — ...; dfinity/icskills — skills/icrc-ledger/SKILL.md -->`.
  Do NOT use `<!-- Sync recommendation: -->` or any other format — only `<!-- Upstream: -->` passes CI.
- **Every PR description must include a `## Sync recommendation` section** — this mirrors the in-page `<!-- Upstream: -->` comment in human-readable form and becomes the squash-merge commit message. See the PR template in "Submitting".

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

- Offer, suggest, or perform PR reviews unless a human explicitly asks — reviews are a developer decision, not an agent initiative
- Reference `dfx` — it is deprecated and banned
- Create `.mdx` files or use JSX components
- Duplicate content that lives in external docs (icp-cli, JS SDK, icskills, Learn Hub)
- Edit synced files directly (`docs/languages/motoko/`, `docs/guides/tools/migrating-from-dfx.md`)
- Nest sidebar items more than 3 levels deep
- Skip reading source material before writing a page
- Write code snippets from memory — find and adapt from actual upstream code in `.sources/` (see "Verify all code snippets" in the content authoring workflow)
- Modify the rationale or context of existing decisions in `.docs-plan/decisions.md` — you may remove entries that are fully reflected in the current codebase (renames, file moves, cleanup) but never alter the reasoning behind active decisions
- Add `Co-Authored-By` or any AI attribution to commits or PR descriptions
- Link to `internetcomputer.org/docs/` or `docs.internetcomputer.org` — the old docs site is being replaced by this project and those URLs will break. Link to pages in this site (relative paths, even stubs), Learn Hub, or explain inline. If a needed topic has no page, create a page proposal issue.
- Link to internal pages that don't exist — every `[text](path.md)` must resolve to an actual file. Agents have repeatedly linked to plausible-sounding paths (e.g., `reference/certified-variables.md`, `guides/backends/stable-memory.md`) that don't exist. Always `ls` the target before linking. If the page doesn't exist, find the correct existing page or file a page proposal issue.
- Link externally when an internal page exists — before using an external URL (Learn Hub, GitHub, docs.rs), check if the topic has a page in `docs/`. Prefer internal relative links over external URLs. For example, link to `reference/ic-interface-spec.md` instead of the Learn Hub or `internetcomputer.org/spec/`.
- Close a Beads task unless its PR is verified as merged (`gh pr view <PR#> --json state --jq .state` must print `MERGED`). A closed task means "done and shipped" — never close for any other reason.
- Delete or force-push `refs/dolt/data` — this ref is the sole remote copy of all Beads task state. Never run `git push origin --delete refs/dolt/data` or any git command that modifies this ref directly.
- Run `bd init --force` without explicit user confirmation — a forced re-init destroys the local database and a subsequent `bd dolt push` would wipe the remote.

## Key directories

- `docs/` — All documentation (`.md` only). This is the real directory; `src/content/docs/` is a symlink for Astro.
- `docs/languages/motoko/` — Auto-synced from `caffeinelabs/motoko` (do not edit directly)
- `docs/guides/tools/migrating-from-dfx.md` — Synced from `dfinity/icp-cli` (do not edit directly)
- `.docs-plan/` — Analysis artifacts, decisions, and progress tracking (see `.docs-plan/README.md`)
- `.sources/` — **Pinned submodules of upstream source repos** (see "Source material repos" below)
- `.agents/skills/` — Shared agent skills. All entries are symlinks: `technical-documentation` → `.sources/dotskills/skills/technical-documentation`, icskills → `.sources/icskills/skills/`. Requires submodules to be initialized (`git submodule update --init --depth 1`).
- `.claude/skills/` — Symlinks to `.agents/skills/` for Claude Code. Same skills, Claude-specific path.
- `.claude/settings.json` — Shared Claude Code permissions (committed to git). Ensures worktree/background agents can run without interactive approval.
- `plugins/` — Astro build plugins (rehype/remark transforms and the agent-docs integration)
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
| `.sources/icp-cli` | `dfinity/icp-cli` | `v0.2.1` (latest release) | CLI reference, command syntax verification |
| `.sources/icp-cli-recipes` | `dfinity/icp-cli-recipes` | `main` | Recipe examples for CLI guides |
| `.sources/icp-cli-templates` | `dfinity/icp-cli-templates` | `main` | Project templates for getting-started |
| `.sources/icskills` | `dfinity/icskills` | `main` | Skill files with canister IDs and code patterns |
| `.sources/examples` | `dfinity/examples` | `master` | Code examples (link to for >30 line snippets) |
| `.sources/icp-js-sdk-docs` | `dfinity/icp-js-sdk-docs` | `main` | JS SDK documentation |
| `.sources/motoko` | `caffeinelabs/motoko` | `v1.3.0` (latest release) | Motoko compiler — language spec, system function names, syntax verification |
| `.sources/motoko-core` | `caffeinelabs/motoko-core` | `v2.2.0` (latest release) | Motoko core library (`mo:core`) — API signatures, module docs |
| `.sources/cdk-rs` | `dfinity/cdk-rs` | `timers-1.0.0` / `executor-2.0.0` | Rust CDK (`ic-cdk`, `ic-cdk-timers`, `ic-cdk-macros`) — API signatures, management canister types |
| `.sources/candid` | `dfinity/candid` | `2025-12-18` | Candid spec, type system, `didc` tool source |
| `.sources/response-verification` | `dfinity/response-verification` | `v3.1.0` (latest release) | Response verification, certified variables, certificate trees |
| `.sources/dotskills` | `vincentkoc/dotskills` | `main` | Technical documentation skill (AGPL-3.0 — kept as submodule to avoid license mixing) |

### Submodule initialization

Some submodules (`portal`, `examples`) contain **nested submodules** of their own (e.g., portal pulls in `dfinity/sdk`, `dfinity/motoko`, `dfinity/internet-identity`). These nested submodules are used for the upstream project's build — **you do not need them for docs work**.

- **Standard init (sufficient for all docs work):**
  ```bash
  git submodule update --init --depth 1
  ```
  This fetches only the top-level `.sources/` submodules. Fast and lightweight.

- **Do NOT use `--recursive`** unless you specifically need a nested submodule's content. Recursive init pulls many GB of unnecessary data (portal alone has 6 nested submodules).

- **Portal `file=` references:** Some portal `.mdx` files contain `file=../../../../submodules/samples/...` paths that inline code from portal's nested submodules. You do not need to init these — the same code is available in our top-level submodules (e.g., `submodules/samples` → `.sources/examples`). When you see a `file=` path in portal source, resolve it to the corresponding top-level submodule instead.

- **If a shallow clone can't resolve a pinned commit** (e.g., the tag wasn't on the default branch tip), fetch the full history for that submodule only:
  ```bash
  git -C .sources/<repo> fetch --unshallow
  git -C .sources/<repo> checkout <commit>
  ```

### Rules for agents

- **Always read source material from `.sources/`** — never from local clones, `gh api`, or your training data
- **Stub shorthand mapping:** `Portal: building-apps/foo.mdx` → `.sources/portal/docs/building-apps/foo.mdx`, `icp-cli: guides/bar.md` → `.sources/icp-cli/docs/guides/bar.md`
- **Consult relevant repos when writing or reviewing** — these are the ground truth for both creating content and verifying PR claims. The stub's `<!-- Source Material -->` lists portal pages, but also check the upstream source repos for your page's topic:
  - **Motoko code** → `motoko-core` (API signatures, module docs) + `motoko` (compiler: system function names, keywords)
  - **Rust code** → `cdk-rs` (`ic-cdk`, `ic-cdk-timers`, management canister types)
  - **Candid** → `candid` (spec, type system, `didc` behavior)
  - **Certified data / query verification** → `response-verification` (certificate trees, verification patterns)
  - **CLI commands** → `icp-cli` (command reference — do not guess flags or syntax)
  - **Code examples** → `examples` (link to for snippets >30 lines)
- **Do not modify `.sources/`** — these are read-only references. Edits go to the upstream repos.

### Bumping submodules

Only the project maintainer bumps submodule refs. When bumped:

1. Check what changed: `git -C .sources/<repo> log --oneline <old-ref>..<new-ref>`
2. Review if any existing docs pages are affected by the upstream changes
3. Update affected pages and note the bump in the PR description

### Synced files from submodules

Some files are copied from `.sources/` into the docs repo because they need to be served or referenced directly. When bumping the source submodule, these files must be diffed and re-copied if changed.

| Local file | Source | Affects |
|-----------|--------|---------|
| `public/reference/ic.did` | `.sources/portal/docs/references/_attachments/ic.did` | Management canister reference — new/changed methods require updating `docs/reference/management-canister.md` and any guides that reference affected methods |

**Portal bump checklist for `ic.did`:**
1. Diff: `diff public/reference/ic.did .sources/portal/docs/references/_attachments/ic.did`
2. If changed, copy: `cp .sources/portal/docs/references/_attachments/ic.did public/reference/ic.did`
3. Review the diff for new methods, changed signatures, or removed methods
4. Update `docs/reference/management-canister.md` to reflect any interface changes
5. Check guides that reference affected methods (chain-fusion, canister-management, backends)

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

Read `.docs-plan/content-authoring.md` before writing any page. It covers the full workflow: reading stubs and source material, writing content, code snippet verification, sync recommendations, linking rules, and external docs. The Always/Never rules above also apply to all content work.

## Skills (required)

Skills are a **hard prerequisite** — do not start any content work, review, or ICP-related task without them. All skills are pre-installed in the repo:

- `.agents/skills/` — agent-agnostic location (canonical)
- `.claude/skills/` — symlinks to `.agents/skills/` for Claude Code

**Prerequisite:** All skills are symlinks into `.sources/` submodules (icskills → `.sources/icskills/skills/`, technical-documentation → `.sources/dotskills/skills/technical-documentation`). Run `git submodule update --init --depth 1` if skills appear as broken symlinks.

At session start, verify skills are accessible:
```bash
ls .agents/skills/icp-cli/SKILL.md .agents/skills/technical-documentation/SKILL.md
# Both should resolve (not "No such file"). If broken, run: git submodule update --init --depth 1
```

- **`technical-documentation`** — Load before drafting or reviewing any docs page
- **icskills** (16 skills) — Load the relevant skill before writing any feature-specific content. Use the skill that matches the page topic (e.g., `ckbtc` for Bitcoin guides, `multi-canister` for architecture pages, `icp-cli` for CLI guides).

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

## Agent-friendly documentation

The site implements the [Agent-Friendly Documentation Spec](https://agentdocsspec.com) so AI agents can consume docs as clean markdown. The `agentDocs()` integration (`plugins/astro-agent-docs.mjs`) generates `/llms.txt` and `.md` endpoints at build time. A `<link rel="help">` in `<head>` (configured in `astro.config.mjs`) points crawlers to `/llms.txt` early in the page.

**Build output:**
- `/llms.txt` — discovery index listing all pages with links to `.md` endpoints, plus the IC skills registry URL
- `/<path>.md` — clean markdown for every page (frontmatter and HTML comments stripped)

### SECTIONS array (keep in sync)

The `SECTIONS` array in `plugins/astro-agent-docs.mjs` maps directory prefixes to section labels in `llms.txt`. **When adding or renaming sidebar sections in `astro.config.mjs`, update the `SECTIONS` array to match.** Pages in directories not covered by `SECTIONS` will be silently excluded from `llms.txt`.

### Asset canister headers

`public/.ic-assets.json5` sets `Content-Type: text/markdown; charset=utf-8` for `.md` files, `text/plain; charset=utf-8` for `llms.txt`, and `Cache-Control: public, max-age=300` for both.

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
2. **Clean up worktrees** — remove any worktrees created during the session:
   ```bash
   git worktree list                    # check for leftover worktrees
   git worktree remove <path>           # remove each one
   git worktree prune                   # clean up stale references
   ```
3. **File issues** for discovered work with `bd create`
4. **Beads is synced** — every status change was followed by `bd dolt push` and verified
5. **On `main`** — you should already be on `main` from the submit step. If not: `git checkout main`

Work is NOT complete until all changes are pushed and Beads is synced. Never stop before pushing — that leaves work stranded locally.
<!-- END BEADS INTEGRATION -->
