# ICP Developer Docs — Agent & Contributor Instructions

ICP developer documentation built with Astro + Starlight.
Content is `.md` by default. Pages that need interactive components (e.g., language-synced tabs) use `.mdx` — see `.docs-plan/decisions.md` for the policy.
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

**Prerequisites:** Node.js ≥ 20, Dolt, Beads (`bd`). See README.md for install instructions.

**SSH access required:** Beads syncs via `refs/dolt/data` — requires SSH access to the git remote. If `git fetch origin refs/dolt/data` fails, add an SSH key or run `gh auth setup-git`.

```bash
./scripts/setup.sh    # submodules, npm deps, Beads task DB, Dolt server, build check
```

> **Running from Claude Code:** `./scripts/setup.sh` is pre-approved in `.claude/settings.json` and runs without user prompts. It handles TCP port binding for Dolt and all `bd` calls internally. **Most `git` commands work within the sandbox and do NOT need `dangerouslyDisableSandbox: true`.** Exception: `git worktree` and `git -C` on `.claude/worktrees/` paths need bypass (OS restricts `.claude/` modifications) — see "Session start" for the full list. See "Session start" for the full procedure.

Without `bd`/`dolt` you can still write docs — check `.docs-plan/migration-plan.md` for tasks manually.

### Parallel agents (worktrees)

For batch operations like addressing PR feedback across multiple PRs, Claude Code can launch background agents in isolated git worktrees. Each agent works on a separate branch without conflicts.

**Prerequisites:**
- `.claude/settings.json` (committed to git) enables the sandbox and pre-approves tools. The sandbox runs agents with OS-level filesystem isolation. Sandboxed Bash commands are auto-approved via `autoAllowBashIfSandboxed` — no per-command permission prompts in worktrees. Worktree agents never run `gh` or `bd`; those stay in the parent session.
- `.claude/settings.local.json` and `.claude/worktrees/` are gitignored (local-only).

**How it works:**
1. The parent agent claims tasks in Beads, then launches one background agent per PR/task using `isolation: "worktree"`. **Immediately after launching all worktrees, run `git checkout main` in the parent session** — the worktree setup switches the main repo's HEAD to the backing branch of the last worktree created; returning to `main` prevents parent session commits from landing on the wrong branch.
2. Each agent gets its own git worktree (isolated copy of the repo), checks out its branch, makes edits, and commits. **The parent pushes each branch** using `git -C <worktree-path> push -u origin <branch>` with `dangerouslyDisableSandbox: true` — worktree agents must never run `git push` because `~/.ssh` is in `denyRead` (SSH keys are blocked in the sandbox)
3. **Each worktree agent must initialize submodules as its first step** (see "Submodule initialization in worktrees" below)
4. The parent agent collects results and handles all `gh` and `bd` operations: creates PRs (`gh pr create`), posts comments (`gh pr comment`), and updates Beads (`bd update`). Worktrees never run `gh` or `bd`.
5. The parent agent cleans up worktrees after all work is done:
   ```bash
   git worktree remove --force <path>           # for each worktree (--force needed due to submodules)
   git worktree prune                           # clean up stale references
   git branch -D $(git branch | grep worktree-agent)  # delete backing branches
   ```

**Submodule initialization in worktrees:** Worktrees do NOT automatically initialize submodules — `.sources/` will be empty and skills inaccessible. **Every worktree agent must run this first:**
```bash
git submodule update --init --depth 1
```
The parent agent must include this as the mandatory first step in every worktree agent's prompt. This command is pre-approved in `.claude/settings.json` and runs automatically without user prompts in worktrees (`.git/` is sandbox-protected by design — the pre-approval is required and intentional).

**Worktree agent prompt structure:** Pass only minimal task context — worktree agents do their own full research using skills. **Do not pre-gather or summarize source material in the parent.** Passing summaries bypasses the skill research workflow and reduces content quality; agents must read primary sources directly.

For **content creation**, every worktree prompt must include:
1. `git submodule update --init --depth 1` as the first command
2. Branch name (`docs/<slug>`) and page path (`docs/<slug>.md`)
3. The specific icskill to load — the **parent must determine this before launching** (see "Mapping tasks to icskills" below) and pass it as e.g. `"load .agents/skills/timers/SKILL.md"`
4. Instruction to read `.docs-plan/content-authoring.md` before writing anything
5. Instruction to read `.docs-plan/migration-plan.md` for the task entry — dependencies, effort, source material pointers
6. Instruction to read the stub file at `docs/<path>` — it contains `<!-- Source Material -->` comments listing exact portal pages and files to read
7. Instruction to load the `technical-documentation` skill: `.agents/skills/technical-documentation/SKILL.md`
8. Instruction to follow all rules in `CLAUDE.md`
9. Instruction to run `npm run build` to verify the page builds, then **commit the branch** — this is where the worktree's work ends. **Do NOT run `git push`** — SSH private key access is blocked in the sandbox; the parent handles the push. Return the branch name to the parent.
10. **Never run `git push`** — parent pushes all branches using `git -C <worktree-path> push -u origin <branch>`
11. **Never run `gh` commands** — parent handles `gh pr create` and all GitHub API calls
12. **Never run `bd` commands** — parent handles all Beads operations

**Mapping tasks to icskills** — the parent must identify the right skill before launching each worktree. Run `ls .agents/skills/` to see all available skills. Quick topic map:

| Page topic | icskill to load |
|---|---|
| Bitcoin / ckBTC | `ckbtc` |
| Ethereum / ckETH | `cketh` |
| Chain-key tokens (general) | `chain-key-tokens` |
| Timers | `timers` |
| Randomness / VRF | `randomness` |
| Certified variables / certified data | `certified-variables` |
| HTTP outcalls | `http-outcalls` |
| On-chain AI / AI inference | `on-chain-ai` |
| SNS / governance | `sns` |
| Identity / authentication | `internet-identity` |
| Multi-canister / architecture | `multi-canister` |
| ICP ledger / tokens | `icp-ledger` |
| CLI / tooling | `icp-cli` |
| Frontend / asset canister | `asset-canister` |
| Candid | `candid` |

If no skill exactly matches, load the closest one and `technical-documentation` is always required in addition.

For **PR reviews**, every worktree prompt must include:
1. `git submodule update --init --depth 1` as the first command
2. PR number and branch name to check out
3. The specific icskill to load — **parent determines this** from the PR's page topic (see "Mapping tasks to icskills" above) and passes it explicitly
4. Instruction to read `.docs-plan/review-guidelines.md` for the full checklist before starting
5. Instruction to load the `technical-documentation` skill: `.agents/skills/technical-documentation/SKILL.md`
6. Instruction to check out the PR branch, read the full page at `docs/<path>`, and work through every item in the review checklist from `review-guidelines.md` — do not skip sections
7. Instruction to write findings to `$(pwd)/.review-output/pr-<PR#>.md` using `mkdir -p .review-output`, following the output format in `review-guidelines.md`, then **return the absolute file path** to the parent — do not return findings inline
8. **Never run `bd` commands**
9. **Never run `gh` commands** — `gh` requires macOS Security framework for TLS; blocked in sandbox background agents

**Batch limit for reviews: 8–10 per wave** — same as content. Review findings go to disk (not inline results), so per-worktree context cost is the same ~5–7k tokens. Use the same wave state file pattern as content batches (see above) for compaction-safe resumption between waves.

**GitHub API in worktrees:** Worktree agents cannot use `gh` (Go binary, macOS Security framework required for TLS — blocked in sandbox). Worktrees write output to files; the parent reads them and calls `gh` in the main session. Review findings go to `<worktree-absolute-path>/.review-output/pr-<PR#>.md`; the worktree returns the absolute path, and the parent posts with:
```bash
gh pr comment <PR#> --body-file <absolute-path-returned-by-worktree>
rm <absolute-path-returned-by-worktree>   # clean up after posting
```
This keeps review content off the parent's context entirely (no context bloat), and is robust to compaction — the file survives even if earlier messages are compressed.

**If agents fail with permission errors:** Check that `.claude/settings.json` exists and the sandbox is active (run `/sandbox` in a session to verify). The shared settings file is the authoritative source — per-user `~/.claude/projects/` settings don't apply to worktree agents (different path). With the sandbox active, all sandboxed Bash commands are auto-approved via `autoAllowBashIfSandboxed`. `git submodule update --init` is additionally pre-approved for sandbox bypass. `bd dolt *` and `gh *` commands require OS sandbox bypass — worktree agents must never run these; only the parent runs `bd` and `gh`.

**Beads safety:** Worktree agents share the parent's `.beads/` directory and Dolt server. Concurrent `bd` commands can corrupt the Dolt journal.
- **Only the parent agent** may run `bd` commands (claim, update, push, pull)
- **Worktree agents must NEVER run `bd`** — they only write content, build, commit, and push
- **Serialize all `bd` calls** — never run `bd update` for multiple tasks in parallel; always wait for one to complete before starting the next
- Auto-backup is enabled (`.beads/config.yaml`) — JSONL snapshots go to `.beads/backup/` every 15 min as a local safety net
- **NEVER run `bd init --force`** without explicit user confirmation — this can destroy the database
- **NEVER run `bd dolt push` after a re-init** without verifying the local DB has the correct data — pushing an empty or corrupted DB overwrites the remote
- **NEVER delete `refs/dolt/data`** — this is the only remote copy of all task state. Do not run `git push origin --delete refs/dolt/data` or any command that modifies this ref directly.

**Dolt recovery:** If the Dolt journal becomes corrupted (symptoms: `circuit breaker is open`, `corrupted journal`, `invalid journal record length`), or the local DB is stale after another agent updated the remote, use the clean recovery procedure in "Session start" below.

**Dolt restart after worktree work:** If you need to restart the Dolt server while worktrees exist, always ensure your working directory is the **main repo root** before running `bd dolt start`. If you restart from a worktree path, `bd` will serve the worktree's `.beads/` directory (which has no database), causing "database not found" errors.

### Session start

> **Sandbox note:** The following commands require `dangerouslyDisableSandbox: true` and are auto-approved **without user prompts** via a `PermissionRequest` hook in `.claude/settings.json`:
> - `bd` — connects to Dolt via TCP on localhost (OS sandbox blocks this)
> - `gh` — needs the macOS Security framework for TLS/keychain; **always fails with x509 error when run sandboxed** — always set `dangerouslyDisableSandbox: true` on the first call, never attempt sandboxed first
> - `./scripts/setup.sh` — internally calls `bd` and `gh`
> - `pkill*dolt*` — process management
> - `git worktree add/remove` on `.claude/worktrees/` paths — OS restricts `.claude/` modifications
> - `git -C .claude/worktrees/...` (e.g. parent pushing a worktree branch) — same `.claude/` restriction
> - `rm` on `.claude/worktrees/` paths — same `.claude/` restriction
>
> All other `git` commands (fetch, push from main repo, checkout, rebase, ls-remote, `git submodule update`, etc.) **work within the sandbox** and do NOT need `dangerouslyDisableSandbox: true`. `git submodule update` runs sandboxed via `autoAllowBashIfSandboxed: true` — no bypass needed.
>
> **The allow list alone does not suppress sandbox bypass prompts** — the `PermissionRequest` hook is what makes them silent. **Critical:** hook patterns only match when the Bash command starts with the approved prefix. Complex scripts starting with variable assignments (`DOLT_OUT=$(...)`, `EXISTING_PORT=...`), control flow (`if [`, `for`, `while`), or grouping constructs (`(`, `{`) do **not** match and **will prompt the user**. For multi-target operations (e.g. checking several PRs), issue each as a separate parallel Bash call — each starts with `gh`/`bd` and is auto-approved. Always use pre-approved simple commands or scripts (`./scripts/setup.sh`) rather than inline multi-line shell scripts.
>
> **Glob caveat for native tools (Write/Edit/Read):** `Write(**)` and `Edit(**)` in the `allow` list do **not** match hidden directories (paths starting with `.`, e.g. `.claude/wave-state.json`). For `.claude/` writes, explicit rules like `Write(.claude/**)` are required — these are already in `settings.json`. The `PermissionRequest` hook is only relevant for Bash sandbox-bypass (`dangerouslyDisableSandbox: true`) — it never fires for native tool (Write/Edit) permission checks.

**Step 0 — Navigate to main repo root and verify environment:**

First, ensure your working directory is the main repo root — not a leftover worktree from a prior session. After compaction, the shell CWD may still be a worktree path. Always run this first:

```bash
cd "$(git worktree list | head -1 | awk '{print $1}')"
```

`git worktree list` always lists the main worktree first, so this navigates to the main repo root regardless of where you currently are (even from within a nested worktree).

Then check whether the environment needs setup using only filesystem reads — no `bd` call required:

```bash
ls -d .beads/dolt/.bd-dolt-ok .agents/skills/icp-cli/SKILL.md 2>/dev/null | wc -l
```

- **Output `2`** → environment is OK (sentinel present, skills initialized), proceed to Step 1B.
- **Output < `2`** → environment needs setup, proceed to Step 1A.

This check uses `ls -d` (checks for existence, not directory contents) and detects the two most reliable indicators: whether the DB was bootstrapped at all (`.bd-dolt-ok`) and whether submodules are initialized (skills). Corrupted-but-present DBs are handled by `./scripts/setup.sh` itself (it verifies DB accessibility after starting Dolt). This check requires no `dangerouslyDisableSandbox` and never prompts.

**Step 1A — Environment needs setup:**

Run the setup script — it handles submodules, Beads bootstrap, Dolt start, and port capture in one call. Pre-approved in `settings.json`, no user prompt:

```bash
./scripts/setup.sh
```

Setup handles both fresh clones (bootstraps from remote) and broken DBs (detects missing noms data and re-bootstraps). When done, skip to Step 2.

**Step 1B — Environment is OK, start Dolt for this session:**

```bash
./scripts/setup.sh --skip-build
```

This starts Dolt with port capture and pulls the latest task state, skipping the slow build check. Pre-approved in `settings.json`.

**Step 2 — Verify GitHub access:**

```bash
gh auth status 2>/dev/null
```

`gh` is pre-approved in `settings.json`. If this prompts, the session is the first to use `gh` — approve once and it won't prompt again this session.

**Step 3 — Verify skills:**

```bash
ls .agents/skills/icp-cli/SKILL.md .agents/skills/technical-documentation/SKILL.md
```
If either is missing: Step 0 should have caught this and routed through `./scripts/setup.sh`. If you're here with missing skills anyway, run `./scripts/setup.sh --skip-build` (pre-approved). Do not start any content or review work until skills resolve.

**Step 4 — Resume interrupted wave (if applicable):**

Check for `wave-state.json` at the repo root. If it exists, a previous wave was interrupted by compaction or a crash. Read the file and complete any unfinished steps for each task before proceeding to the Priority scan:
- `done` → skip
- `pr_created` → `bd update --status draft && bd dolt push`
- `pushed` → `gh pr create` + `bd update` (verify branch exists first: `git ls-remote origin <branch>`)
- `launched` → check `git ls-remote origin <branch>`: if present treat as `pushed`; if not, re-launch the worktree

After all tasks are resolved, delete `wave-state.json`.

**Step 5 — Verify Beads state:**
```bash
bd list --status draft --limit 0    # should match open PRs
gh pr list --state open --json number,title
```
If open PRs exist but no corresponding `draft` tasks appear, the local DB is stale. Do not make any `bd update` calls against a stale DB. Run recovery:
```bash
pkill -9 -f dolt
rm -rf .beads/dolt/.dolt
./scripts/setup.sh --skip-build
```
`setup.sh --skip-build` detects the empty noms directory, bootstraps from the remote, starts Dolt with port capture, and pulls. All three commands are pre-approved in `settings.json` — no user prompts. Verify after:
```bash
bd list --limit 5
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

*Undefer infra tasks when content is complete:* All infra tasks are deferred until content sprints 3–10 are done. Check once per session:
```bash
OPEN_CONTENT=$(bd list --status open --json 2>/dev/null | jq '[.[] | select(.issue_type == "epic" and (.title | test("Sprint [3-9]|Sprint 10")))] | length')
[ "$OPEN_CONTENT" -eq 0 ] && bd list --status deferred --limit 0 --json | jq -r '.[] | .id + " " + .title'
```
If the query prints deferred tasks, all content sprints are closed — re-open each one with `bd update <id> --status open && bd dolt push` and proceed to work on them.

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
- **Batch content creation (multiple unblocked tasks):** Use parallel worktree agents — one per task. Claim all tasks sequentially first (see "Claiming multiple tasks"), then launch all worktrees in parallel. **Batch limit: 8–10 content worktrees per wave.** Process each worktree result as it arrives (run `gh pr create` + `bd update` + worktree cleanup immediately) rather than collecting all results first — if automatic compaction fires mid-wave, only the in-flight result is at risk, not the entire batch.

  **Compaction safety — write a wave state file.** Each completed wave leaves ~60–70k tokens of dead context. Automatic compaction will eventually fire mid-session, potentially mid-wave. Rather than asking the user to `/compact` (that breaks autonomous operation), make the parent resumable after compaction by persisting wave state to disk:

  - **Before launching a wave:** write `wave-state.json` at the repo root with the task IDs, branch names, and per-task progress for that wave
  - **After each step per task:** update the status field (`launched` → `pushed` → `pr_created` → `done`) — write after each step so the file is always current
  - **After the wave fully completes** (all tasks `done`): delete the file
  - **On any session start or post-compaction resume:** check for `wave-state.json` at the repo root. If it exists, resume: for each task, check its status field, verify against Beads + `git ls-remote origin <branch>`, and complete any unfinished steps. Only then proceed to the next wave.

  Example wave state file:
  ```json
  {
    "wave": 2,
    "tasks": [
      {"id": "developer-docs-4kj.10", "branch": "docs/guides-testing-pocket-ic", "status": "done"},
      {"id": "developer-docs-4kj.11", "branch": "docs/guides-cycles-management", "status": "pushed"},
      {"id": "developer-docs-4kj.7",  "branch": "docs/guides-reproducible-builds", "status": "launched"}
    ]
  }
  ```
  Status meanings: `launched` = worktree started; `pushed` = branch on remote, worktree done; `pr_created` = PR exists, `bd update` pending; `done` = PR created and Beads updated.

  Recovery logic after compaction: `done` → skip; `pr_created` → just `bd update`; `pushed` → `gh pr create` + `bd update`; `launched` → check `git ls-remote origin <branch>`: if branch exists, treat as `pushed`; if not, re-launch the worktree.

  See "Worktree agent prompt structure" in the "Parallel agents" section for exactly what each worktree prompt must contain. Do not do the content research in the parent — each worktree does its own full research.
- **PR feedback (formal reviews or comments):**
  1. **Claim the task(s)** — set Beads status from `draft` to `in_progress` and push. This prevents other agents from picking up the same feedback. **When handling multiple PRs:** claim ALL tasks sequentially (see "Claiming multiple tasks" above) before launching any worktree agents or starting any fixes.
     ```bash
     bd update <id> --status in_progress && bd dolt push
     bd show <id> --json | jq -r .status   # MUST print "in_progress"
     ```
  2. Read all feedback from **all three sources** (see Priority A above): review body, top-level comments, and inline review comments. Do not start fixing until you have read all three.
  3. **Evaluate and apply autonomously** — cross-check every claim against `.sources/` and the current page:
     - **Apply** items that are factually correct and improve the page
     - **Skip** items that conflict with CLAUDE.md rules, source material, or project conventions — add an `<!-- agent-note: skipped "<quote>" because <reason> -->` HTML comment in the PR comment so reviewers know why
     - **Apply your best judgment** on style/wording suggestions — you don't need permission for these
  4. Apply the fixes:
     - **Single PR:** check out the branch and apply directly in the main session (proceed to steps 7–10 below)
     - **Multiple PRs:** launch parallel worktree agents — one per PR — with specific fix instructions. Each worktree agent does steps 7–8 only (verify, build, commit, push) then returns a summary. The parent does steps 9–10 for each PR after collecting results.
  7. **Post-fix verification** — before pushing (done by the worktree agent if using worktrees, otherwise by the parent):
     1. Re-read the full page — does it still flow and make sense as a whole?
     2. `ls` any new or changed link targets to confirm they exist
     3. If the fix moves content elsewhere, confirm the target page covers it (or flag with `<!-- TODO -->`)
     4. **Update the `<!-- Upstream: -->` comment** if new source material was referenced
     5. Run `npm run build` — must pass before pushing
  8. Commit and push to the existing branch (worktree agents stop here and return to parent)
  9. **Update the PR description** — done by the parent (requires `gh`, blocked in worktrees). Use `gh pr edit <PR#> --body "..."` to update both the Summary and Sync recommendation to reflect the current state of the page.
  10. **Submit** — done by the parent only (requires `gh` and `bd`):
      ```bash
      gh pr comment <PR#> --body "$(cat <<'EOF'
      <!-- feedback-addressed -->
      Feedback addressed:
      - <bullet list of what was fixed>
      EOF
      )"
      bd update <id> --status draft && bd dolt push
      bd show <id> --json | jq -r .status   # MUST print "draft"
      ```

### Reviewing PRs

**Only review PRs when explicitly asked by a human.** See `.docs-plan/review-guidelines.md` for the full review checklist (mechanical checks, content quality, post format). Key points: load the `technical-documentation` skill and relevant icskill first.

**Parallel reviews use worktrees** — reviews need to check out the PR branch (to read the full page, verify links with `ls`, run `npm run build`). For parallel reviews, launch worktree agents the same way as for content writing. Each agent must run `git submodule update --init --depth 1` first (see "Submodule initialization in worktrees" above) to access skills and `.sources/`.

**Posting review results:** Review worktree agents write findings to `<worktree-absolute-path>/.review-output/pr-<PR#>.md` and **return the absolute file path** to the parent. The parent posts using `gh pr comment <PR#> --body-file <absolute-path>` then deletes the file. This keeps review content off the parent's context and is safe under compaction.

### Submitting

> **Worktree agents:** These flows are for a **single agent** running in the main session. Worktree agents stop after `git push` and return to the parent — they never run `gh` or `bd`. The parent then runs the `gh pr create` / `gh pr comment` and `bd update` steps.

**Fresh task (single agent):**
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

**Fresh task (worktree agent — stops here, parent handles the rest):**
```bash
npm run build                         # must pass before committing
git rebase origin/main
git commit ...                        # commit the page
# Do NOT run git push — SSH private key is blocked in sandbox
# Return branch name to parent. Parent runs: git -C <worktree-path> push + gh pr create + bd update
```

**Changes requested fix (single agent):**
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

**Changes requested fix (worktree agent — stops here, parent handles the rest):**
```bash
npm run build                         # must pass before committing
git commit ...                        # commit the fixes
# Do NOT run git push — SSH private key is blocked in sandbox
# Return summary of fixes to parent. Parent runs: git -C <worktree-path> push + gh pr comment + gh pr edit + bd update
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
- Use `mo:core` for all Motoko standard library imports — never `mo:base`. `mo:base` is the legacy library; `mo:core` is its replacement. See `.sources/motoko/doc/md/12-base-core-migration.md` for the full mapping. Requires Motoko 0.15+ / icp-cli 0.28+.
- Use `.md` by default; `.mdx` only for interactive components (e.g. `<Tabs syncKey="lang">`). Tab order: Motoko → Rust → others; Candid first for type-mapping tabs. See `.docs-plan/decisions.md` and `content-authoring.md` for conversion steps.
- Include complete frontmatter (see CONTRIBUTING.md for schema)
- Link to external docs instead of duplicating content (see `content-authoring.md` linking rules)
- Sync Beads before and after work: `bd dolt pull` at session start, `bd dolt push` after every status change
- Update task status in Beads immediately — claim before working, set `draft` after PR creation, set `closed` after merge
- Record structural decisions in `.docs-plan/decisions.md` immediately when making them — don't wait to be asked. This includes: new files/symlinks, path changes, config changes, cleanup of stale references, and any choice that a future agent would need to understand.
- **Every non-stub content page must end with an `<!-- Upstream: -->` comment** (CI-enforced). List every `.sources/` repo used. Format and examples in `content-authoring.md`.
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
- Adding a new entry to `.sources/` (new submodule) — flag the need and the source repo, don't add it autonomously; also propose which pinning strategy applies (latest release vs. main/master)

## Never (do not do these under any circumstances)

- Diagnose a Beads dependency as "phantom", "missing", or "stale" based solely on it not appearing in `bd list --limit 0` — that query excludes closed tasks. Always check `bd list --status closed --limit 0 --json` before drawing that conclusion (see "Task structure" in the Beads reference)
- Use `dangerouslyDisableSandbox: true` for `git` commands — `git fetch`, `git push`, `git ls-remote`, `git checkout`, `git rebase`, and all other git operations work within the sandbox. **Exception:** `git worktree remove` on paths under `.claude/worktrees/` and `rm -rf` on those same paths need `dangerouslyDisableSandbox: true` because the OS sandbox restricts modifications to `.claude/` even though the JSON config's `allowWrite` includes `"."`. Both `git worktree ` and `rm ` patterns are pre-approved in the PermissionRequest hook so the bypass is silent. Only `bd`, `gh`, `./scripts/setup.sh`, `pkill*dolt*`, `git worktree`, and `rm` need the sandbox bypass; all are covered in `settings.json`
- Write inline multi-line shell scripts for Dolt initialization or recovery — complex scripts (starting with `DOLT_OUT=`, `EXISTING_PORT=`, `if [`, etc.) do not match allow list patterns and prompt the user for each call. If the environment is broken, run `./scripts/setup.sh` (pre-approved, handles all cases). Never improvise manual recovery sequences across multiple Bash calls
- Offer, suggest, or perform PR reviews unless a human explicitly asks — reviews are a developer decision, not an agent initiative
- Use `python3` (or any interpreter) for JSON parsing — use `jq` instead, which is pre-approved in `settings.json`; `python3` is not in the allow list and will prompt the user
- Reference `dfx` — it is deprecated and banned
- Use `mo:base` imports in Motoko code examples — `mo:base` is the legacy library. Use `mo:core` instead. Critical replacements: `Buffer` → `List`, `HashMap`/`TrieMap`/`Trie`/`RBTree` → `Map`, `Deque` → `Queue`, `OrderedMap` → `pure/Map`, `OrderedSet` → `pure/Set`. The `Random` module exists in `mo:core` but has a completely redesigned API (class-based: `Random.crypto()`, `await* random.bool()`, etc.)
- Create `.mdx` files without a clear need for interactive components (tabs, etc.) — default to `.md`
- Duplicate content that lives in external docs (icp-cli, JS SDK, icskills, Learn Hub)
- Edit synced files directly (`docs/languages/motoko/`, `docs/guides/tools/migrating-from-dfx.md`)
- Nest sidebar items more than 3 levels deep
- Skip reading source material before writing a page
- Write code snippets from memory — find and adapt from actual upstream code in `.sources/` (see "Verify all code snippets" in the content authoring workflow)
- Modify the rationale or context of existing decisions in `.docs-plan/decisions.md` — you may remove entries that are fully reflected in the current codebase (renames, file moves, cleanup) but never alter the reasoning behind active decisions
- Add `Co-Authored-By` or any AI attribution to commits or PR descriptions
- Link to `internetcomputer.org/docs/` or `docs.internetcomputer.org` — the old docs site is being replaced by this project and those URLs will break. Link to pages in this site (relative paths, even stubs), Learn Hub, or explain inline. If a needed topic has no page, create a page proposal issue.
- Link to internal pages that don't exist — every `[text](path.md)` must resolve to an actual file. Always `ls` the target before linking. Note: links to `.mdx` pages always use `.md` extension (Astro resolves both) — if `ls path.md` fails, also check `ls path.mdx` before flagging the link as broken. If neither exists, find the correct existing page or file a page proposal issue.
- Link externally when an internal page exists — before using an external URL (Learn Hub, GitHub, docs.rs), check if the topic has a page in `docs/`. Prefer internal relative links over external URLs. For example, link to `reference/ic-interface-spec.md` instead of the Learn Hub or `internetcomputer.org/spec/`.
- Close a Beads task unless its PR is verified as merged (`gh pr view <PR#> --json state --jq .state` must print `MERGED`). A closed task means "done and shipped" — never close for any other reason.
- Delete or force-push `refs/dolt/data` — this ref is the sole remote copy of all Beads task state. Never run `git push origin --delete refs/dolt/data` or any git command that modifies this ref directly.
- Run `bd init --force` carelessly — a forced re-init destroys the local database and a subsequent `bd dolt push` would wipe the remote. It is pre-approved in `settings.json` for recovery use (called internally by `./scripts/setup.sh`), but never call it manually without verifying the DB is genuinely corrupt.

## Key directories

- `docs/` — All documentation (`.md` only). This is the real directory; `src/content/docs/` is a symlink for Astro.
- `docs/languages/motoko/` — Auto-synced from `caffeinelabs/motoko` (do not edit directly)
- `docs/guides/tools/migrating-from-dfx.md` — Synced from `dfinity/icp-cli` (do not edit directly)
- `.docs-plan/` — Analysis artifacts, decisions, and progress tracking (see `.docs-plan/README.md`)
- `.sources/` — **Pinned submodules of upstream source repos** (see "Source material repos" below)
- `.agents/skills/` — Shared agent skills. All entries are symlinks: `technical-documentation` → `.sources/dotskills/skills/technical-documentation`, icskills → `.sources/icskills/skills/`. Requires submodules to be initialized (`git submodule update --init --depth 1`).
- `.claude/skills/` — Symlinks to `.agents/skills/` for Claude Code. Same skills, Claude-specific path.
- `.claude/settings.json` — Shared Claude Code sandbox config and permissions (committed to git). Enables OS-level filesystem isolation and auto-approves Bash for worktree/background agents. Run `/sandbox` in a session to verify the sandbox is active.
- `plugins/` — Astro build plugins (rehype/remark transforms and the agent-docs integration)
- `icp.yaml` — icp-cli project config (asset canister recipe)
- `.icp/data/` — Canister ID mappings (committed to git). `.icp/cache/` is gitignored.

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

**Two pinning strategies** — which one applies determines the bump procedure (see "Bumping submodules"):

- **Track latest release** — repos that publish versioned releases users install. Pin to the latest release tag so docs describe what users actually have, not unreleased development.
- **Track main/master** — content repos and tools where the default branch *is* the canonical source (no user-installed release artifact).

For current release hashes, see `.sources/VERSIONS`.

| Submodule | Repo | Pinned to | What it provides |
|-----------|------|-----------|-----------------|
| `.sources/portal` | `dfinity/portal` | `master` | Old docs content referenced in stub `<!-- Source Material -->` comments |
| `.sources/icp-cli` | `dfinity/icp-cli` | latest release | CLI reference, command syntax verification |
| `.sources/icp-cli-recipes` | `dfinity/icp-cli-recipes` | `main` | Recipe examples for CLI guides |
| `.sources/icp-cli-templates` | `dfinity/icp-cli-templates` | `main` | Project templates for getting-started |
| `.sources/icskills` | `dfinity/icskills` | `main` | Skill files with canister IDs and code patterns (skills site serves main directly) |
| `.sources/examples` | `dfinity/examples` | `master` | Code examples (link to for >30 line snippets) |
| `.sources/icp-js-sdk-docs` | `dfinity/icp-js-sdk-docs` | `main` | JS SDK documentation |
| `.sources/motoko` | `caffeinelabs/motoko` | latest release | Motoko compiler — language spec, system function names, syntax verification |
| `.sources/motoko-core` | `caffeinelabs/motoko-core` | latest release | Motoko core library (`mo:core`) — API signatures, module docs |
| `.sources/cdk-rs` | `dfinity/cdk-rs` | latest release | Rust CDK (`ic-cdk`, `ic-cdk-timers`, `ic-cdk-macros`) — API signatures, management canister types |
| `.sources/candid` | `dfinity/candid` | latest release | Candid spec, type system, `didc` tool source |
| `.sources/response-verification` | `dfinity/response-verification` | latest release | Response verification, certified variables, certificate trees |
| `.sources/dotskills` | `vincentkoc/dotskills` | `main` | Technical documentation skill (AGPL-3.0 — kept as submodule to avoid license mixing) |

### Submodule initialization

Some submodules (`portal`, `examples`) contain **nested submodules** of their own (e.g., portal pulls in `dfinity/sdk`, `dfinity/motoko`, `dfinity/internet-identity`). These nested submodules are used for the upstream project's build — **you do not need them for docs work**.

- **Standard init (sufficient for all docs work):**
  ```bash
  git submodule update --init --depth 1
  ```
  This fetches only the top-level `.sources/` submodules. Fast and lightweight.

- **Do NOT use `--recursive`** — ever. Recursive init pulls many GB of unnecessary data (portal alone has 6 nested submodules). There is no valid reason to use it for docs work.

- **If content from a nested submodule is needed and no top-level `.sources/` entry covers it, stop and flag it.** Propose adding the repo as a direct submodule to the user — do not reach into nested submodules or use `--recursive`. Adding a submodule is a structural change that affects every clone and CI run; it requires a human decision. The general pattern: if `some-submodule` has a nested `foo/bar` whose content you need, propose `git submodule add git@github.com:foo/bar.git .sources/bar` and wait for confirmation.

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

Only the project maintainer bumps submodule refs. When bumped, follow this checklist:

**Step 0 — Determine the new ref (strategy-dependent):**

- **latest release repos:** Find the latest release tag, not the tip of main. Use `git ls-remote --tags origin` to list tags without needing them locally, then identify the highest version. Pin to the commit the tag resolves to (`git -C .sources/<repo> fetch origin refs/tags/<tag> && git -C .sources/<repo> checkout FETCH_HEAD`). Never pin past the latest release — unreleased changes must not appear in docs.
- **main/master repos:** Fetch and checkout `origin/main` or `origin/master` as usual.

**General (all submodules):**
1. Identify what changed: `git -C .sources/<repo> log --oneline <old-ref>..<new-ref>`
2. Grep docs pages for content derived from that submodule (code examples, API references, CLI flags, canister IDs, etc.) and update any affected pages
3. Check open PRs — for each open `docs/*` or `infra/*` PR, check if the pages it touches use content from the bumped submodule. If yes, post a targeted comment flagging what's potentially outdated (see comment format below)
4. **For release-pinned repos:** update `.sources/VERSIONS` — version label, hash, and any crate-version annotations. See the notes in that file for repo-specific guidance (cdk-rs multi-crate, candid version lookup commands, motoko shallow-clone caveat).
5. Note the bump in the PR description

**PR comment format** (targeted, not generic):
```
gh pr comment <PR#> --body "$(cat <<'EOF'
<!-- submodule-bump-notice -->
`<repo>` was bumped to `<new-ref>`. The following content on this PR may be outdated:
- [specific item and why]

Please review before merging.
EOF
)"
```

**Per-submodule additional checks** (run after the general checklist):

> **Keep this table in sync:** when a new submodule is added to `.sources/`, add a row here describing what to check on bump.

| Submodule | Extra checks on bump |
|---|---|
| `portal` | Follow the `ic.did` checklist in "Synced files from submodules" below |
| `motoko` / `motoko-core` | Check for changed/removed API signatures, system function names, and keywords — grep all Motoko code blocks in docs |
| `cdk-rs` | Check `ic-cdk`, `ic-cdk-timers`, `ic-cdk-macros` API changes — grep all Rust code blocks in docs |
| `icp-cli` | Check for changed/removed commands or flags — grep all CLI examples in docs |
| `icskills` | Check for changed canister IDs or code patterns — grep skill-derived content |
| `examples` | Verify that any files linked from docs still exist at the same path in the new ref |
| `icp-cli-recipes` | Check for renamed or removed recipes referenced in docs |
| `icp-cli-templates` | Check for renamed or restructured templates referenced in getting-started pages |
| `icp-js-sdk-docs` | Check for changed JS SDK APIs — grep all JavaScript code blocks in docs |
| `candid` | Check for spec changes that affect the Candid reference page or type-mapping examples |
| `response-verification` | Check for API changes affecting certified variables patterns in docs |
| `dotskills` | Check if the `technical-documentation` skill changed in ways that affect review criteria or authoring rules |

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

**Prerequisite:** Skills are symlinks into `.sources/` submodules. Run `git submodule update --init --depth 1` if they appear as broken symlinks.

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
- `/<path>.md` — clean markdown for every page (frontmatter, HTML comments, and MDX artifacts stripped)

`.mdx` pages are served as clean `.md` for agent consumption (MDX syntax stripped automatically at build time).

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

> **`bd list` excludes closed tasks by default.** Running `bd list --limit 0` (without `--status`) only returns active statuses (open, in_progress, draft, deferred). Closed tasks are invisible. This means a dependency ID that doesn't appear in a plain `bd list` query is **not** necessarily missing — it may simply be closed. Before concluding a dependency ID is "phantom" or "missing", always verify against the closed task list:
> ```bash
> bd list --status closed --limit 0 --json | jq -r '.[] | select(.id == "<suspect-id>") | "\(.id) \(.title)"'
> ```
> If the ID appears there, the dependency is satisfied (the page is done). Only if it is absent from **both** the active list and the closed list is the dependency truly missing.

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
   git worktree remove --force <path>   # remove each one (--force needed due to submodules)
   git worktree prune                   # clean up stale references
   git branch -D $(git branch | grep worktree-agent)  # delete backing branches
   ```
3. **Clean up ephemeral files:**
   ```bash
   rm -f wave-state.json                # delete if session ended cleanly mid-wave
   rm -rf .review-output/               # delete any leftover review files
   ```
4. **File issues** for discovered work with `bd create`
5. **Beads is synced** — every status change was followed by `bd dolt push` and verified
6. **On `main`** — you should already be on `main` from the submit step. If not: `git checkout main`
7. **Stop the Dolt server** — run this if you are intentionally wrapping up and the human may delete or re-clone the repo before the next session:
   ```bash
   bd dolt stop
   ```
   This is a clean signal (no `dangerouslyDisableSandbox` needed). If the session ends abruptly (terminal closed, process killed), this step will not run — that is expected. The next session handles it via `pkill -9 -f dolt` in the orphaned-process recovery path.

Work is NOT complete until all changes are pushed and Beads is synced. Never stop before pushing — that leaves work stranded locally.
<!-- END BEADS INTEGRATION -->
