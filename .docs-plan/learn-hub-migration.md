# Learn Hub Migration: Agent Instructions

`learn.internetcomputer.org` is being retired. This file tells you exactly how to execute one batch PR. Read it completely before touching any file.

Related files:
- `.docs-plan/learn-hub-navigation.md` — article-to-target mapping for all 9 batches
- `.docs-plan/migration-plan.md` — batch table with branch names and effort estimates
- `.docs-plan/decisions.md` — structural decisions (entry dated 2026-05-06)

---

## Step 0 — Skills (required before writing anything)

```bash
ls .agents/skills/technical-documentation/SKILL.md .agents/skills/icp-brand-voice/SKILL.md
# If broken symlinks: git submodule update --init --depth 1
```

Load before writing:
- `technical-documentation` — doc structure, quality criteria, review checklist
- `icp-brand-voice` — **critical for migration work.** Learn Hub articles were written for a broad audience and routinely use terms the brand voice rules ban or require reframing: "smart contracts", "blockchain", "Web3", "decentralized application", and similar. Migrating without applying these rules imports the jargon wholesale. Every sentence adapted from a staging file must pass the brand voice filter.

Do **not** load icskills. The icskills provide implementation patterns: canister IDs, SDK API signatures, code examples. Learn Hub content is pure concept and explanation — no code, no canister calls, no SDK usage. The staging file is the source; icskills add nothing here.

One exception: if a page mentions a specific system canister by name (exchange rate canister, ckBTC minter, etc.), verify its canister ID against `docs/references/chain-key-canister-ids.md` directly — no need to load the full skill for a single lookup.

---

## Step 1 — Claim your batch

Find your batch in `.docs-plan/learn-hub-navigation.md`. Each batch has a name (e.g. "Batch 1 — Protocol stack") and a branch name (e.g. `docs/concepts-protocol-stack`).

All batch PRs target `infra/learn-hub-migration-prep`, not `main`. The prep branch accumulates all migration content so the full result can be previewed before anything merges to `main`.

```bash
git fetch origin
git ls-remote origin docs/<slug>   # if output is empty, branch doesn't exist yet
git checkout -b docs/<slug> origin/infra/learn-hub-migration-prep
```

---

## Step 2 — Read all staging files for the batch

The `.migration/learn-hub/` directory is the source of truth. Every article is stored at:

```
.migration/learn-hub/how-does-icp-work/<section>/<slug>.md
```

With frontmatter:
```yaml
---
learn_hub_id: <id>
learn_hub_url: <original URL>
learn_hub_title: <title>
learn_hub_section: <section name>
learn_hub_category: "How does ICP work?"
migrated: false
---
```

**Read every staging file listed for your batch before writing a single line of content.** Use the navigation map to find the file paths. Treat staging files exactly as you treat `.sources/` content — do not write from memory or training data.

**Staging files contain raw HTML-converted Markdown.** Watch for and clean up:
- `&amp;`, `&nbsp;`, `<br>` — replace or remove
- Three or more consecutive blank lines — collapse to one
- `[undefined]` link text — drop the link, keep the text
- Internal Learn Hub links of the form `[text](https://learn.internetcomputer.org/hc/en-us/articles/<id>-<slug>)` — replace with the internal docs path from the navigation map. If the target doesn't exist yet (later batch), convert to plain prose without a link.

---

## Step 3 — Write the docs pages

The navigation map specifies one of four actions for each article:

### Action: `new` — create a new page

Template for a new concept page:

```markdown
---
title: "Page Title"
description: "One-line description for search and cards."
---

One paragraph orienting the developer: what this is and why it matters for building on ICP.

## First major section

Content here.

## Second major section

Content here.

## Further reading

- [Related guide](../guides/<relevant-guide>.md)
- [Related concept](../<related-concept>.md)

<!-- Upstream: informed by Learn Hub article "<title>" (migrated, source retired) -->
```

Template for a new reference page:

```markdown
---
title: "Page Title"
description: "One-line description."
---

Brief intro (one paragraph) explaining what this reference covers and who uses it.

## <Category A>

| Parameter | Type | Description |
|---|---|---|
| ... | ... | ... |

## <Category B>

...

<!-- Upstream: informed by Learn Hub article "<title>" (migrated, source retired) -->
```

Rules:
- `.md` extension always (never `.mdx` unless interactive `<Tabs>` are needed — concept pages never need tabs)
- `title` and `description` frontmatter are required
- No `sidebar.order` needed unless the page must appear before or after a specific sibling — if needed, use integer values (lower = earlier)
- No CLI commands on concept pages (Diataxis rule: concepts explain *what* and *why*)
- No code examples unless derived from `.sources/` — Learn Hub has no code; do not invent examples
- **Intra-batch cross-links are allowed.** When your batch creates several pages that reference each other (e.g. Batch 1's six protocol pages), link freely between them — they will all exist by the time the PR merges. Use the standard relative-path format with `.md` extension.
- **Verify technical claims for protocol-layer content.** For pages in batches 1, 2, 4, and 6 (protocol stack, node infrastructure, evolution & scaling, cryptography), cross-check factual claims against `.sources/portal` before publishing — Learn Hub prose is not always precise. Specifically: look up the relevant section in `.sources/portal/docs/references/ic-interface-spec.md` for consensus, execution, message routing, and state sync details. For TEE/IC-OS: `.sources/portal` may not cover this — publish what the staging file says and mark uncertain claims with a `<!-- TODO: verify -->` comment for human review.

### Action: `expand` — add depth to an existing page

1. Read the existing page first: `Read docs/<target>.md`
2. Identify where the new content fits — add a new `##` section at the end of the main content, before any "Further reading" or "See also" section
3. Do not restructure existing content; only append
4. Add the staging article's title to the existing `<!-- Upstream: -->` comment (create one if missing):
   ```
   <!-- Upstream: <existing sources>, informed by Learn Hub article "<title>" (migrated, source retired) -->
   ```

### Action: `reference` — create a reference page

Same as `new`, but the file goes in `docs/references/`. Use tables for taxonomies and parameter lists. Avoid prose-heavy sections — reference pages are for lookup, not explanation. Link to the conceptual counterpart (e.g. `references/nns-proposal-types.md` links to `concepts/governance.md`).

### Action: `skip` — do not migrate

Three articles in the in-scope staging directory are marked `skip` in the navigation map. The full list is in the "Skip articles" section of `learn-hub-navigation.md`. For each of them:

- Do **not** create a docs page
- Do **not** delete the staging file — it stays in the repo until the final cleanup PR, where a human reviews it and decides whether to discard or migrate
- The file being present in a staging directory you're reading is not an invitation to migrate it — always check the navigation map row for your article first

A quick way to identify skips before you start writing: for every staging file in your batch, look up its row in the navigation map. If the "Action" column says `skip`, move on.

---

## Step 4 — Handle sidebar config

`concepts` uses `autogenerate: { directory: "concepts" }` in `sidebar.mjs`. **You do not need to edit `sidebar.mjs` for any batch PR.** Starlight automatically groups subdirectories as collapsible sections.

The only exception: if you create `docs/concepts/protocol/` as a new subdirectory (Batch 1), Starlight will generate the group label "Protocol" from the directory name automatically. If the auto-generated label is wrong, add an `_` prefixed `index.md` with a custom title — but in practice the directory names chosen for this migration all produce correct labels.

Nesting limit: never go deeper than `concepts/<subdir>/<file>.md` (2 levels). That is the maximum — no further nesting.

---

## Step 5 — Update cross-links

The navigation map lists required cross-link updates for each batch under "Cross-link updates after this batch." Do all of them in the same PR.

**For each cross-link update:**
1. Read the file being updated: `Read docs/<file>.md`
2. Find the Learn Hub link with: `grep -n "learn.internetcomputer.org" docs/<file>.md`
3. Replace with the internal path
4. Verify the target exists: `ls docs/<new-target>.md`

After all edits, confirm no Learn Hub links remain in files you touched:
```bash
grep -rn "learn.internetcomputer.org" docs/ --include="*.md" --include="*.mdx"
```
Hits in files *outside your batch scope* are acceptable — later batches handle those. Hits in files your PR touched are not.

---

## Step 6 — Delete staging files

In the same commit as the content, delete every staging file your batch consumed. Check the "Action" column in the navigation map:

- `new` → delete the staging file(s) used to write the new page
- `expand` → delete the staging file(s) merged into the existing page
- `reference` → delete the staging file(s)
- `skip` → **do not delete** (leave for final cleanup PR)

```bash
git rm .migration/learn-hub/how-does-icp-work/<section>/<slug>.md
# repeat for each staging file in your batch
```

If a batch uses multiple staging files to produce one page (e.g. Batch 5 uses three Bitcoin articles to write `concepts/chain-fusion/bitcoin.md`), delete all three.

---

## Step 7 — Build check

```bash
npm run build
```

Must pass with zero errors before pushing. Fix any broken links surfaced by the build.

---

## Step 8 — Commit and push

Use conventional commits:

```bash
git add docs/<new-or-modified-files>
git rm .migration/learn-hub/<staged-files>   # already staged by git rm above
git commit -m "docs: <short description of batch content>"
```

Examples:
- `docs: add protocol stack concept pages (consensus, P2P, message routing, execution, state sync)`
- `docs: add node infrastructure and TEE concept page`
- `docs: expand chain-key-cryptography with subnet keys and certified communication`

---

## Step 9 — Open the PR

```bash
git push -u origin docs/<slug>
gh pr create \
  --base infra/learn-hub-migration-prep \
  --title "docs: <descriptive title>" \
  --body "$(cat <<'EOF'
## Summary
- <bullet: what pages were created or expanded>
- <bullet: what cross-links were updated>

## Staging files deleted
- `.migration/learn-hub/<path>` → `docs/<target>`

## Sync recommendation
hand-written

<!-- Upstream: informed by Learn Hub articles "<titles>" (migrated, source retired) -->
EOF
)"
```

---

## Checking overall migration progress

```bash
# How many in-scope staging files remain?
find .migration/learn-hub/how-does-icp-work -name "*.md" | wc -l

# Any remaining Learn Hub links in the whole docs tree?
grep -rn "learn.internetcomputer.org" docs/ --include="*.md" --include="*.mdx"
```

When `find` returns only the three `skip` files (see "Skip articles" in `learn-hub-navigation.md`), **stop and flag for human review** — do not delete them autonomously. Open a PR with just the migrated-article deletions and a comment listing the skip files for a human to decide:

```bash
gh pr comment <PR#> --body "$(cat <<'EOF'
<!-- skip-files-review -->
All batch migrations are complete. The following staging files were marked `skip` and need a human decision before the final cleanup PR:

- `.migration/learn-hub/how-does-icp-work/introduction/how-does-icp-work.md` — redundant with concepts/index.md?
- `.migration/learn-hub/how-does-icp-work/icp-and-the-internet/https-outcalls.md` — already covered in concepts/https-outcalls.md?
- `.migration/learn-hub/how-does-icp-work/sns/how-to-inspect-an-sns-and-its-dapp-canisters.md` — user-facing; discard or move elsewhere?

Please review each and confirm whether to discard, migrate, or redirect.
EOF
)"
```

Once a human approves disposal, open the final cleanup PR (also targeting `infra/learn-hub-migration-prep`):
1. Delete `.migration/learn-hub/` entirely (including the reviewed skip files)
2. In CLAUDE.md: remove the "Learn Hub is being retired" note from the `internetcomputer.org/docs/` rule (replace with just "explain inline or link to `docs/concepts/`")
3. In `.docs-plan/decisions.md`: mark the 2026-05-06 entry as fully reflected, then remove it
4. Run `npm run build` and push

After the final cleanup PR merges into `infra/learn-hub-migration-prep`, a maintainer:
1. Rebases `infra/learn-hub-migration-prep` on `main` to pick up any drift
2. Marks PR #208 ready for review
3. Merges to `main`

**Keeping the prep branch in sync with main:** If `main` receives commits during the migration window (e.g. guide updates, bug fixes), periodically rebase or merge `main` into `infra/learn-hub-migration-prep` to avoid a large conflict at the end. This is a maintainer task — batch PR authors do not need to worry about it.

---

## Batch dependency order

| Batch | Depends on |
|---|---|
| 1 Protocol stack | none |
| 2 Node infrastructure | none |
| 3 Edge infrastructure | none |
| 4 Evolution & scaling | none |
| 5 Chain Fusion deep dives | none (but links to guides already in main) |
| 6 Cryptography deep dives | none |
| 7 Governance deep dives | Batch 8 (governance.md links to tokenomics.md) — do 8 first, or defer the link |
| 8 Tokens & ledgers | none |
| 9 Canister concept fillers | none |

Batches 1–4 and 5–9 have no mutual dependencies. All can run in parallel except 7 after 8.

---

## Hard rules (never do these)

- Do not write content from memory — always derive from the staging file
- Do not add NNS dapp UI steps, wallet flows, or end-user instructions
- Do not create `.mdx` unless you need `<Tabs syncKey="lang">` (concept pages never do)
- Do not link to `learn.internetcomputer.org` — every such link is a bug
- Do not edit `sidebar.mjs` — `autogenerate` handles everything
- Do not nest deeper than `concepts/<subdir>/<file>.md`
- Do not use em-dashes in prose (banned in all content)
- Do not reference `dfx` or `mo:base`
- Do not link to a page that does not yet exist
- Do not delete `skip` articles from `.migration/learn-hub/` — they stay for human review in the final cleanup PR
