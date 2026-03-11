# Design Decisions Log

Append new decisions at the bottom. Never modify existing entries.

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

## 2026-03-11: New guides/backends/ section
**Context:** Biggest gap in existing docs — no task-oriented guides for ICP backend patterns
**Decision:** Create guides/backends/ with pages for: data-persistence, https-outcalls, timers, randomness, certified-variables, large-wasm, parallel-calls
**Rationale:** Every canister developer needs these. Currently only concept explanations exist, not "how to do it" guides with code.
**Alternatives considered:** Put under guides/canisters/ (too crowded, mixing management with development patterns)

## 2026-03-11: New guides/production/ section
**Context:** No home for "going to mainnet" topics like subnet selection, cycles management, canister discovery
**Decision:** Create guides/production/ for topics that bridge local development to production deployment
**Rationale:** These don't fit under canisters/ (which is about management) or tools/ (which is about CLI). They're about production readiness.
**Alternatives considered:** Under guides/canisters/ (conflates management with deployment), separate "deployment" section (too narrow)

## 2026-03-11: Clean slate approach
**Context:** Existing 124 pages were written for v3.1 structure which we're reconsidering
**Decision:** Wipe src/content/docs/ and create uniform stubs for ALL pages. Remove CI workflows. Keep minimal Astro infrastructure.
**Rationale:** Uniform stubs are better than a mix of full content (possibly misaligned) and empty pages. Previous work preserved on `restructuring-attempt-1` branch.
**Alternatives considered:** Keep existing content + add stubs for new pages only (inconsistent, may not align with new structure)

## 2026-03-11: .docs-plan/ as coordination directory
**Context:** Need durable artifacts that future agents can discover and use
**Decision:** All analysis, decisions, and progress tracking in `.docs-plan/` (committed to repo, not gitignored)
**Rationale:** Files in the repo survive across clones, CI, and agent sessions. Hidden directory keeps it out of the docs site.
**Alternatives considered:** .analysis/ (less descriptive), planning/ (visible, clutters root), .meta/ (too generic)

## 2026-03-11: AGENTS.md as canonical agent policy
**Context:** AGENTS.md was just a stub alias to CLAUDE.md
**Decision:** AGENTS.md becomes the canonical cross-agent instruction file with explicit Always/Ask first/Never boundaries. CLAUDE.md remains primary for Claude Code (auto-loaded).
**Rationale:** Per agents.md spec, AGENTS.md should be substantive for all agent platforms (Codex, Cursor, etc.), not just Claude.
**Alternatives considered:** Keep CLAUDE.md as sole source (excludes non-Claude agents)

## 2026-03-11: Code examples — inline vs link to examples repo
**Context:** Need a consistent strategy for code in docs
**Decision:** Inline code for snippets under ~30 lines. Link to dfinity/examples repo for anything larger.
**Rationale:** Short snippets aid reading flow. Long examples are better maintained in a dedicated repo with tests.
**Alternatives considered:** Always inline (maintenance burden), always link (poor reading experience)

## 2026-03-11: icp-cli content — link, don't duplicate
**Context:** icp-cli has its own comprehensive docs at dfinity.github.io/icp-cli/
**Decision:** Link to icp-cli docs. Inline icp-cli commands in guides where they aid reading flow. Don't duplicate guides.
**Rationale:** Single source of truth. The migration guide is the only exception (synced).
**Alternatives considered:** Sync more content (maintenance burden), duplicate quickstart (violates single-source principle)

## 2026-03-11: Remove DOCS_RESTRUCTURING_PROPOSAL.md
**Context:** v3.1 proposal has stale paths and structure that doesn't match the new analysis
**Decision:** Remove from restructuring-attempt-2 branch. .docs-plan/synthesis.md is the new source of truth.
**Rationale:** Having two competing "truth" documents confuses agents. Original preserved on restructuring-attempt-1.
**Alternatives considered:** Update in place (synthesis.md is more detailed and structured for agent consumption)

## 2026-03-11: CLAUDE.md symlinks to AGENTS.md
**Context:** Having both CLAUDE.md and AGENTS.md with overlapping but different content creates maintenance risk and confusion
**Decision:** Consolidate all agent/contributor instructions into AGENTS.md. CLAUDE.md is a symlink (`CLAUDE.md → AGENTS.md`).
**Rationale:** Single source of truth. AGENTS.md is the cross-agent standard (works for Claude, Codex, Cursor, etc.). The symlink ensures Claude Code auto-loads the same content. If the file grows too large, create referenced sub-files rather than splitting the primary instruction file.
**Alternatives considered:** Keep both files in sync (drift risk), AGENTS.md symlinks to CLAUDE.md (AGENTS.md is the more universal name)

## 2026-03-11: docs/ is the canonical content directory
**Context:** Astro/Starlight expects content at `src/content/docs/`, but `docs/` at root is the natural location for documentation
**Decision:** Real files live in `docs/` (project root). `src/content/docs/` is a symlink pointing to `../../docs`. All agent instructions and documentation reference `docs/` as the canonical path.
**Rationale:** `docs/` is shorter, more discoverable, and the standard convention. Astro follows the symlink transparently — builds work unchanged. Agents and contributors use `docs/` exclusively; the symlink is an implementation detail.
**Alternatives considered:** Keep files in `src/content/docs/` with symlink the other way (forces agents to use long paths), no symlink (agents must always navigate three levels deep)

## 2026-03-11: Clean up stale CODEOWNERS, package.json, CONTRIBUTING.md
**Context:** After restructuring, several files referenced old paths or deleted scripts
**Decision:** Updated CODEOWNERS paths to new structure, removed 10 broken scripts from package.json (validate, generate, sync), fixed stale references in CONTRIBUTING.md.
**Rationale:** Stale references confuse both agents and CI. Scripts will be restored from `restructuring-attempt-1` when docs are production-ready.
**Alternatives considered:** Leave as-is with TODO comments (agents would try to run broken commands)

## 2026-03-11: Motoko sidebar pre-configured, no stubs for synced content
**Context:** Motoko docs (~60 files across fundamentals/, icp-features/, reference/) are synced from `caffeinelabs/motoko` via a sync script on `restructuring-attempt-1`
**Decision:** Keep the sidebar config with `autogenerate` directives for the three Motoko subdirectories. Do not create stub files — they would be overwritten by the sync. Only the hand-written `index.md` (overview) exists as a stub.
**Rationale:** `autogenerate` picks up files automatically once the sync runs. The sync script flattens nested dirs, injects frontmatter, and rewrites links. Creating 60 stubs adds no value and creates merge noise.
**Alternatives considered:** Create stubs for all 60 pages (would be overwritten), wait to configure sidebar until sync is restored (risks forgetting the structure)

## 2026-03-11: Remove `features` frontmatter field
**Context:** Every stub had a `features` array with free-form kebab-case tags (~50 unique values across 79 pages). Nothing consumed this field.
**Decision:** Remove `features` from the frontmatter schema and all stub pages.
**Rationale:** Directory structure already serves as taxonomy, `icskills` covers AI agent discovery, and cross-links cover related pages. For llms.txt generation, page titles + descriptions + directory paths are sufficient. No prominent developer docs site uses feature tags for taxonomy — they organize by intent (which Diataxis already handles). Re-add when a concrete consumer exists.
**Alternatives considered:** Keep as-is (aspirational metadata), standardize with a canonical list (maintenance burden without a consumer)

## 2026-03-11: Remove `last_verified` frontmatter field
**Context:** Every stub had `last_verified: 2026-03-11`. No verification process existed.
**Decision:** Remove `last_verified` from the frontmatter schema and all stub pages.
**Rationale:** The date is meaningless on stub pages with no real content. Maintaining it adds overhead with no payoff — there's no periodic verification workflow. Re-add when a verification process is established.
**Alternatives considered:** Keep as required (establishes habit but meaningless on stubs), make optional (still no process to enforce it)

## 2026-03-11: Remove `source_repo` and `source_ref` frontmatter fields
**Context:** Every stub had `source_repo: null` and `source_ref: null`. Only 2 pages (Motoko index, migrating-from-dfx) would ever use non-null values.
**Decision:** Remove both fields from the frontmatter schema and all stub pages. Synced content protection is enforced by path-based rules in AGENTS.md ("Never edit synced files") and CONTRIBUTING.md ("Synced content" section) — not by frontmatter metadata.
**Rationale:** Having `source_repo: null` on 77 non-synced pages is noise. The sync script can inject a comment (`<!-- Synced from repo — do not edit -->`) if file-level marking is needed. Path-based rules are the actual enforcement mechanism.
**Alternatives considered:** Keep on synced pages only (still redundant with path rules), keep as optional (agents would still see null values in schema examples)

## 2026-03-11: Remove `doc_type` and `level` frontmatter fields
**Context:** Every stub had `doc_type` (tutorial/how-to/reference/explanation) and `level` (beginner/intermediate/advanced). Neither field had a consumer.
**Decision:** Remove both fields from the frontmatter schema and all stub pages. Directory structure already implies Diataxis type: `getting-started/` = tutorial, `guides/` = how-to, `concepts/` = explanation, `reference/` = reference. Page content conveys difficulty level.
**Rationale:** Same principle as previous removals — no consumer means no value. The Diataxis directory structure IS the type classification. Maintaining redundant metadata on 79 pages adds noise. Re-add if a filtering UI, badge display, or llms.txt grouping requires it.
**Alternatives considered:** Keep doc_type only (still redundant with directories), keep level for future filtering (no filtering UI planned)

## 2026-03-11: Image/asset strategy — `src/assets/images/` with section-based organization
**Context:** Portal has hand-drawn diagrams (canister internals, app architecture, create/install flows) worth carrying over. No image strategy existed for the new docs.
**Decision:** Images live in `src/assets/images/`, organized by docs section (concepts/, guides/canisters/, etc.). Carry over portal images case-by-case during content writing — not bulk-imported upfront. Keep the existing hand-drawn visual style for consistency. Use descriptive kebab-case filenames.
**Rationale:** `src/assets/` enables Astro image optimization (Sharp). Section-based organization mirrors the docs structure. Case-by-case approach avoids importing images for pages that may not need them or may need different visuals.
**Alternatives considered:** `public/images/` (no optimization), co-located images next to .md files (clutters docs/), bulk import all portal images (wasteful, many won't be used)

## 2026-03-11: Use relative paths with `.md` extension for internal links
**Context:** Landing page links like `/getting-started/quickstart/` worked on the Astro site but broke on GitHub (files live at `docs/getting-started/quickstart.md`).
**Decision:** All internal links must use relative paths with `.md` extension (e.g., `[Quickstart](getting-started/quickstart.md)`). Never use absolute URL paths.
**Rationale:** Relative paths with `.md` work on GitHub natively. A remark plugin (`plugins/remark-strip-md-extension.mjs`) strips `.md` extensions at build time for Astro/Starlight. This ensures docs are readable and navigable wherever they're viewed — no pre-build scripts or temp directories needed.
**Alternatives considered:** Absolute paths (break on GitHub), paths without extension (break on GitHub), pre-build sed script like icp-cli repo (fragile, adds build complexity)

## 2026-03-11: Motoko core library is the standard; base is legacy
**Context:** The Motoko `core` library (`mops.one/core`) supersedes the `base` library (`mops.one/base`). A migration guide exists in the Motoko repo (`doc/md/12-base-core-migration.md`) and is synced to the docs site.
**Decision:** Always recommend `core` over `base` in all docs. Link to `mops.one/core/docs` as the standard library reference. Do not link to `mops.one/base/docs` as an equal alternative. The base→core migration guide is synced from `caffeinelabs/motoko` and should not be edited directly.
**Rationale:** `core` is the actively developed standard library with AI-friendly design, consistent naming, and stable memory support. `base` is legacy. Docs should guide developers to the current standard.
**Alternatives considered:** List both as equal options (confusing, encourages continued use of legacy library)

## 2026-03-11: Add encryption and verifiable credentials guides
**Context:** Portal crawl revealed 9 VetKeys pages and 4 Verifiable Credentials pages with no proper home in the 79-page plan. VetKeys how-to content was crammed into `concepts/vetkeys.md` (an explanation page). VC content was split as "partial" across internet-identity.md and concepts/security.md.
**Decision:** Add `guides/security/encryption.md` (VetKeys how-to: encrypted storage, DKMS, IBE, timelock) and `guides/authentication/verifiable-credentials.md` (VC issuer/relying party patterns). Both P1, Sprint 6. Also update `guides/backends/large-wasm.md` stub to cover SIMD as a section, and `guides/defi/token-ledgers.md` stub to cover ICRC-7/NFTs as a section. Total pages: 79 → 81.
**Rationale:** Encryption guide placed in security/ because the developer intent is "how do I handle privacy/encryption on ICP" — VetKeys is the answer, spanning backend and frontend. VC guide placed in authentication/ because VCs are an authentication/identity pattern built on Internet Identity. SIMD and NFTs don't warrant dedicated pages but need explicit coverage in existing stubs.
**Alternatives considered:** VetKeys under guides/backends/ (undersells frontend/identity aspects), VCs folded into internet-identity.md (distinct enough for own page), dedicated SIMD page (too niche), dedicated NFT page (can be a section in token-ledgers)
