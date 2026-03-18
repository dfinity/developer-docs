# Design Decisions Log

Record decisions that constrain future work — things an agent needs to know that aren't obvious from the code. Remove entries that are fully reflected in the current codebase (renames, file moves, cleanup).

---

## 2026-03-11: Diataxis framework with 5 top-level sections
**Context:** Need a clear information architecture for the new developer docs
**Decision:** Use Diataxis with 5 sections: Getting Started (tutorials), Guides (how-to), Concepts (explanations), Languages (synced + hand-written), Reference (information)
**Rationale:** Diataxis is proven, maps cleanly to developer intent ("how do I" vs "what is" vs "exact params"). Languages gets its own section due to volume (52+ synced Motoko pages).
**Alternatives considered:** 10-section structure (too many groups), single guides section (too flat), capabilities as top-level (not a Diataxis quadrant)

## 2026-03-11: No separate capabilities section
**Context:** IC capabilities (chain-key, VetKeys, HTTPS outcalls, timers, randomness) are the platform's biggest differentiators
**Decision:** Keep capabilities in concepts/ (explanation) with companion how-to guides in guides/backends/ (task-oriented)
**Rationale:** A "capabilities" section is marketing-oriented, not Diataxis-aligned. Developers find content by intent: "what is chain-key" → concepts/, "how to make HTTPS outcalls" → guides/backends/
**Alternatives considered:** Top-level capabilities section (violates Diataxis), capabilities under guides only (loses explanatory depth)

## 2026-03-11: Code examples — inline vs link to examples repo
**Context:** Need a consistent strategy for code in docs
**Decision:** Inline code for snippets under ~30 lines. Link to dfinity/examples repo for anything larger. Prefer linking when possible — examples repo has CI, tests, and versioning. Only inline when the `technical-documentation` skill determines it's essential for the page.
**Rationale:** Short snippets aid reading flow. Long examples are better maintained in a dedicated repo with tests. Inline code rots.
**Alternatives considered:** Always inline (maintenance burden), always link (poor reading experience)

## 2026-03-11: icp-cli content — link, don't duplicate
**Context:** icp-cli has its own comprehensive docs at dfinity.github.io/icp-cli/
**Decision:** Link to icp-cli docs. Inline icp-cli commands in guides where they aid reading flow. Don't duplicate guides.
**Rationale:** Single source of truth. The migration guide is the only exception (synced).
**Alternatives considered:** Sync more content (maintenance burden), duplicate quickstart (violates single-source principle)

## 2026-03-11: docs/ is the canonical content directory
**Context:** Astro/Starlight expects content at `src/content/docs/`, but `docs/` at root is the natural location for documentation
**Decision:** Real files live in `docs/` (project root). `src/content/docs/` is a symlink pointing to `../../docs`. All agent instructions and documentation reference `docs/` as the canonical path.
**Rationale:** `docs/` is shorter, more discoverable, and the standard convention. Astro follows the symlink transparently — builds work unchanged.
**Alternatives considered:** Keep files in `src/content/docs/` (forces long paths), no symlink (agents navigate three levels deep)

## 2026-03-11: Motoko sidebar pre-configured, no stubs for synced content
**Context:** Motoko docs (~60 files across fundamentals/, icp-features/, reference/) are synced from `caffeinelabs/motoko` via a sync script on `restructuring-attempt-1`
**Decision:** Keep the sidebar config with `autogenerate` directives for the three Motoko subdirectories. Do not create stub files — they would be overwritten by the sync. Only the hand-written `index.md` (overview) exists as a stub.
**Rationale:** `autogenerate` picks up files automatically once the sync runs. Creating 60 stubs adds no value and creates merge noise.
**Alternatives considered:** Create stubs for all 60 pages (would be overwritten), wait to configure sidebar until sync is restored (risks forgetting the structure)

## 2026-03-11: Image/asset strategy — `src/assets/images/` with section-based organization
**Context:** Portal has hand-drawn diagrams worth carrying over. No image strategy existed for the new docs.
**Decision:** Images live in `src/assets/images/`, organized by docs section (concepts/, guides/canister-management/, etc.). Carry over portal images case-by-case during content writing — not bulk-imported upfront. Keep the existing hand-drawn visual style. Use descriptive kebab-case filenames.
**Rationale:** `src/assets/` enables Astro image optimization (Sharp). Section-based organization mirrors the docs structure.
**Alternatives considered:** `public/images/` (no optimization), co-located images next to .md files (clutters docs/), bulk import all portal images (wasteful)

## 2026-03-11: Use relative paths with `.md` extension for internal links
**Context:** Absolute paths like `/getting-started/quickstart/` broke on GitHub
**Decision:** All internal links must use relative paths with `.md` extension (e.g., `[Quickstart](getting-started/quickstart.md)`). A remark plugin (`plugins/remark-strip-md-extension.mjs`) strips `.md` at build time.
**Rationale:** Works on GitHub natively and on the Astro site after the plugin strips extensions.
**Alternatives considered:** Absolute paths (break on GitHub), paths without extension (break on GitHub)

## 2026-03-11: Motoko core library is the standard; base is legacy
**Context:** The Motoko `core` library (`mops.one/core`) supersedes `base`
**Decision:** Always recommend `core` over `base` in all docs. Link to `mops.one/core/docs` as the standard library reference. The base→core migration guide is synced from `caffeinelabs/motoko` — do not edit directly.
**Rationale:** `core` is actively developed with AI-friendly design, consistent naming, and stable memory support. `base` is legacy.
**Alternatives considered:** List both as equal options (confusing, encourages legacy use)

## 2026-03-11: Use "onchain" and "offchain" — no hyphens
**Context:** Inconsistent usage across docs (on-chain vs onchain, off-chain vs offchain)
**Decision:** Always use "onchain" and "offchain" (no hyphens) in all docs content. Never "on-chain", "off-chain", "on chain", or "off chain".
**Rationale:** "Onchain" is the prevailing convention in ICP ecosystem. "Offchain" follows the same pattern for consistency.

## 2026-03-13: Use "icp-cli" not "`icp` CLI" in prose
**Context:** Inconsistent references to the CLI tool — some pages say "the `icp` CLI", others say "icp-cli"
**Decision:** Always use "icp-cli" when referring to the tool/project in prose. Use `icp` (code-formatted) only when showing the literal command the user types (e.g., `icp deploy`). Never write "the `icp` CLI" or "the icp command-line tool".
**Rationale:** "icp-cli" is the official project name and is consistent with how the tool is referenced in its own docs and repo. Using the project name avoids ambiguity.

## 2026-03-11: Content writing pacing — batch per sprint
**Context:** Need a review strategy for content pages
**Decision:** Write all pages in a sprint as a batch, then review together. After each sprint, do a cross-reference verification pass.
**Rationale:** Batching allows cross-referencing between pages in the same sprint. Post-sprint verification catches broken links early.
**Alternatives considered:** One page at a time with review (too slow), no verification pass (broken links accumulate)

## 2026-03-11: Content writing before infrastructure restoration
**Context:** P0 infrastructure tasks (validation scripts, sync scripts) are pending alongside P0 content.
**Decision:** Start content writing before restoring validation/sync scripts. Infra is not blocking content work.
**Rationale:** Validation scripts catch issues but don't prevent writing. Content is the primary deliverable.
**Alternatives considered:** Infra first (delays content), in parallel (splits focus)

## 2026-03-11: CI deployment to IC asset canister
**Context:** Docs needed automated deployment to the Internet Computer for live preview.
**Decision:** Deploy to asset canister `2akpg-uqaaa-aaaal-qv5ha-cai` on every push to `main` via GitHub Actions + icp-cli. Custom domain: `beta-docs.internetcomputer.org`. Asset canister configured with `.ic-assets.json5` (no raw access, standard security headers, immutable caching for hashed `_astro/` assets). Canister ID stored in `.icp/data/mappings/ic.ids.json` (committed). Deployer identity imported from `DFX_IDENTITY_DESIGN_TEAM` secret in `IC mainnet` GitHub environment.
**Rationale:** Matches the pattern used by icskills repo. icp-cli is the standard deployment tool. Raw access disabled for security.
**Alternatives considered:** Deploy via dfx (deprecated), manual deployment (error-prone)

## 2026-03-12: Corrected dependency layers and execution order for content writing
**Context:** Analysis of stub page cross-links revealed dependency errors in the original sprint ordering.
**Decision:** (1) Reordered Sprint 1 to write Layer 0 concept pages before getting-started pages. (2) Swapped candid before onchain-calls in Sprint 2. (3) Added `orthogonal-persistence` as explicit dependency for `data-persistence`. (4) Moved `what-next.md` to end of Sprint 1. (5) Added Layer column and "Dependency Layers" section to `migration-plan.md`.
**Rationale:** Correcting the dependency order ensures agents don't start pages before their prerequisites exist. The critical path is 6 layers deep.
**Alternatives considered:** Keep original ordering with "soft" dependencies (risks broken cross-links)

## 2026-03-12: Adopt Beads for multi-agent task coordination
**Context:** Multiple developers will run agents in parallel. `progress.md` on `main` can't reflect in-flight work on unmerged branches.
**Decision:** Use [Beads](https://github.com/steveyegge/beads) (`bd`) as the coordination layer for all migration work. Key design choices:

- **Scope:** All tasks in `migration-plan.md` — content pages, infrastructure, and any future tasks.
- **Task states:** `open` → `in_progress` (claimed) → `draft` (PR opened) → `closed` (PR merged)
- **Soft dependencies:** A task is "unblocked" when all its dependencies are at least `draft`.
- **Stale claim timeout:** 1 hour.
- **Agent priority order:** (A) Fix "changes requested" PRs → (B) Rebase approved PRs with merge conflicts → (C) Pick new work via `bd ready`
- **Branch naming:** `docs/<slug>` for content, `infra/<slug>` for infrastructure tasks
- **PR-based review:** Any agent can pick up "changes requested" PRs, not just the original author.
- **Merge conflict policy:** Always rebase before pushing. Don't rebase PRs under review. Do rebase approved PRs blocked by conflicts.
- **`progress.md` deletion:** Once all tasks are imported into Beads, delete `progress.md`. Do not initialize Beads tasks until the migration plan is finalized.

**Rationale:** Beads uses Dolt (version-controlled SQL) that syncs via `refs/dolt/data` — independent of content branches. Solves the branch-isolation problem.
**Alternatives considered:** GitHub Issues (no dependency graph), `progress.md` with merge-to-main cadence (agents blocked on merges), Linear/Jira (external dependency)

## 2026-03-12: Per-page sync recommendations and content lifecycle preparation
**Context:** 80 pages will be written by agents, but we don't know upfront which should be synced from upstream repos vs. hand-written.
**Decision:** Three changes:
1. **Sync recommendation per page:** Every content PR must include an `<!-- Upstream: ... -->` HTML comment classifying the page as `hand-written`, `sync from <repo> <path>`, or `informed by <repo> <path>`.
2. **Page proposals via GitHub Issues:** When agents discover uncovered topics, create a GitHub Issue with `page-proposal` label. Reference the issue in the PR.
3. **Content lifecycle strategy deferred to P2:** After Sprint 3-4, review sync recommendations, design upstream change detection, assign freshness ownership, and triage `page-proposal` issues.
**Rationale:** Collecting sync signals during writing is cheap and provides data for the lifecycle strategy later. GitHub Issues are the natural forum for humans to discuss page proposals.
**Alternatives considered:** Decide sync/hand-written upfront (premature), skip sync tracking (lose data)

## 2026-03-12: Source material repos as pinned git submodules

**Context:** Agents need to read source material from 7 upstream repos (portal, icp-cli, icp-cli-recipes, icp-cli-templates, icskills, examples, icp-js-sdk-docs). Without pinned refs, different agents could read different states of these repos, leading to inconsistent content.
**Decision:** Add all 7 source repos as shallow git submodules under `.sources/`. Pin each to a specific branch or tag:
- `portal` → `master`, `icp-cli` → `v0.2.0` (latest release tag), all others → `main`/`master` (their default branch)
- Agents must always read from `.sources/`, never from local clones, `gh api`, or training data
- Only the project maintainer bumps submodule refs
- When bumped, agents review upstream changes and update affected docs pages
**Rationale:** Submodules pin exact commits, ensuring reproducible reads across agents and sessions. Bumps are explicit and reviewable in PRs.
**Alternatives considered:** Document branch names only (agents still read different commits), local clones with documented paths (not portable), `gh api` fetches (slow, rate-limited, not reproducible)

## 2026-03-13: Diataxis content-type rules — no CLI commands in concept pages

**Context:** PR #2 (canisters concept page) included 6 `icp` CLI command blocks in the lifecycle section. Concept pages should explain *what* and *why*, not provide step-by-step procedures. The other concept pages (network-overview, app-architecture) correctly contained zero CLI commands, but the rule was implicit.
**Decision:** Added explicit Diataxis content-type rules to both CLAUDE.md ("Content rules") and CONTRIBUTING.md ("Content types (Diataxis)"). `concepts/` pages must not contain CLI commands or step-by-step procedures — link to the relevant guide instead. `getting-started/` and `guides/` pages may include CLI commands. `reference/` pages use them sparingly for syntax examples only.
**Rationale:** Making the rule explicit prevents future agents from mixing procedural content into explanatory pages. The Diataxis framework is already a stated design choice but the per-section implications for CLI command usage were not spelled out.

## 2026-03-13: Never link to internetcomputer.org/docs — it's being replaced

**Context:** The quickstart page linked to `internetcomputer.org/docs/building-apps/...` for Candid concepts. These URLs come from icp-cli source material which references the old portal docs.
**Decision:** Never link to `internetcomputer.org/docs/` or `docs.internetcomputer.org` — these are the old docs being replaced by this project. Instead: (1) link to a page in this docs site using relative paths, even if it's still a stub, or (2) link to Learn Hub (`learn.internetcomputer.org`) for protocol internals, or (3) explain the concept inline if no suitable page exists yet.
**Rationale:** Old docs URLs will break once the new site replaces the old one. Linking to stubs is fine — they'll have content by the time the site launches. If a topic has no planned page, flag it as a page proposal.
**Alternatives considered:** Keep old links with a TODO to update later (easy to forget, broken links at launch)

## 2026-03-13: Shared Claude Code permissions for parallel worktree agents

**Context:** Background agents launched in git worktrees need Bash, Edit, Read, etc. but block waiting for interactive permission approval that never comes. Per-user settings at `~/.claude/projects/<path>/settings.json` don't apply to worktree agents because the worktree has a different filesystem path.
**Decision:** Commit `.claude/settings.json` to the repo with pre-approved tools (git, npm, bd, gh, Edit, Write, Read, Grep, Glob). Deny destructive operations (force push, rm -rf). Gitignore `.claude/settings.local.json` and `.claude/worktrees/` (local-only).
**Rationale:** Shared settings travel with the repo and apply to all agents regardless of working directory. Every developer gets the same permission baseline without manual configuration.
**Alternatives considered:** Per-user project settings (doesn't apply to worktrees), fully permissive mode (too broad), manual approval (blocks background agents)

## 2026-03-13: No Beads git hooks — manual sync only

**Context:** `bd doctor` recommends installing git hooks (`pre-commit`, `post-merge`, `pre-push`) that auto-sync Beads state on git operations. During Sprint 1, the Dolt journal corrupted when the parent agent ran parallel `bd` commands while worktree agents were active.
**Decision:** Do not install Beads git hooks. All `bd dolt pull`/`push` calls must be manual and serialized. Only the parent agent may run `bd` commands — worktree agents must never touch Beads.
**Rationale:** Git hooks fire automatically on git operations (push, pull, checkout). Worktree agents perform these git operations concurrently, so hooks would trigger concurrent `bd` calls against the shared Dolt server, risking journal corruption. Manual serialized calls give the parent full control over when Beads is accessed.
**Alternatives considered:** Install hooks only on the main worktree (hooks still fire on parent git ops during agent runs), install hooks with a lock file (Dolt doesn't support external locking), use `--sandbox` mode for agents (still shares the server)

## 2026-03-13: Squash-merge only, auto-delete branches

**Context:** Agent PRs accumulate multiple commits (draft, feedback fixes, rebases) that aren't meaningful individually.
**Decision:** Enforce squash-merge as the only merge method on GitHub. Auto-delete branches after merge. Squash commit uses PR title and PR body.
**Rationale:** Keeps `git log` on `main` clean (one commit per page/feature). PR history is always available on GitHub. Auto-delete prevents stale `docs/<slug>` branches from accumulating.
**Alternatives considered:** Merge commits (noisy history), rebase merge (preserves individual commits nobody needs)

## 2026-03-17: Merge binding-generation page into Candid interface guide

**Context:** The planned `guides/canister-calls/binding-generation.md` had significant overlap with the existing Candid interface guide, which already covered `.did` generation and JS binding usage. The two dedicated binding tools are `@icp-sdk/bindgen` (JS/TS) and `ic-cdk-bindgen` (Rust) — `didc bind` should not be advertised for binding generation.
**Decision:** (1) Merged all binding-generation content into `candid.md` as a "Binding generation" section. (2) Removed the `binding-generation.md` stub. (3) Updated `didc` tool table to focus on validation/encoding (removed `didc bind` rows). (4) Documented both auto-generated and hand-written `.did` file paths for Motoko. (5) Updated `onchain-calls.md` canister discovery section with a cross-link to the new bindings section. (6) Removed Beads task and updated migration plan dependencies.
**Rationale:** The developer flow is linear: define interface → generate `.did` → generate bindings → use them. Splitting bindings into a separate page creates an artificial seam. The Candid guide is the natural home for the full flow.
**Alternatives considered:** Keep separate page (creates overlap and navigation friction), move all `.did` generation to the bindings page (splits related content)

## 2026-03-18: Move wallet-integration from authentication to DeFi section

**Context:** The wallet-integration page covers ICRC signer standards (ICRC-21/25/27/29/49) for transaction approval, not authentication. The wallet-integration icskill itself distinguishes wallet signers (transaction approval) from Internet Identity (authentication/login). Under `guides/authentication/`, the page was grouped with II and verifiable credentials — a different concern.
**Decision:** Move `guides/authentication/wallet-integration.md` → `guides/defi/wallet-integration.md`. Update cross-links in `what-next.md`, `internet-identity.md`, and `token-standards.md`. Update Beads task title. No sidebar config change needed (both directories use `autogenerate`).
**Rationale:** Transaction signing is closer to the DeFi/token workflow than to authentication. Developers looking for wallet transaction approval would look in DeFi, not Authentication. Discussed in PR #23 and filed as GitHub issue #25.
**Alternatives considered:** Keep in authentication (misleading grouping), create a new "Wallets" subsection (over-engineering for one page)
