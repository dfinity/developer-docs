# Proposal: Transform-free Motoko docs sync

**Context:** `docs.internetcomputer.org` syncs Motoko language documentation from
`caffeinelabs/motoko` as a git submodule. Currently a 200-line bash script
(`sync-motoko.sh`) plus a 300-line Node.js post-processor (`postprocess-motoko.mjs`)
are needed on every release to: flatten numbered directories, strip numeric prefixes,
convert Docusaurus-specific syntax to Starlight syntax, rewrite relative links to
match the flattened structure, and expand file-embed code blocks.

The goal is to reach a state where syncing is just a file copy: no structural
transformation, no syntax conversion, no link rewriting needed.

---

## Problems with the current setup

### 1. Numbered directories and files

```
fundamentals/
  1-basic-syntax/
    1-defining-an-actor.md
    8-functions.md        ← same slug as types/3-functions.md after stripping
  3-types/
    3-functions.md        ← collision! both flatten to "functions.md"
```

Numeric prefixes encode ordering in Docusaurus (which uses `_category_.yml`).
Starlight uses `sidebar: { order: N }` frontmatter instead, so the prefix
serves no purpose once the files are in Starlight. Removing the prefixes and
using frontmatter order avoids the collision problem and removes the need to
strip prefixes during sync.

### 2. Docusaurus-specific frontmatter

```yaml
sidebar_position: 8   # Docusaurus
```

Starlight uses:

```yaml
sidebar:
  order: 8
```

`sidebar_position` is silently ignored by Starlight, leaving all pages in
undefined (alphabetical) order until the consuming site explicitly enumerates
them in its sidebar config.

### 3. Docusaurus file-embed syntax

````
```motoko file=../examples/counter.mo#L1-L30
```
````

This site has a `remark-include-file` plugin that runs at build time and handles
`file=<path>` syntax. Both historical gaps have been resolved on the developer-docs
side:

- **Line-range slicing**: the plugin now supports `#L<start>-L<end>` suffixes. Of
  the file-embed blocks in the Motoko source, roughly 9 use line ranges and 38
  embed whole files — both forms now work.
- **Path incompatibility**: synced files land in `docs/languages/motoko/...` while
  examples stay in `.sources/motoko/doc/md/examples/`. The `<motokoExamples>`
  placeholder bridges this: `postprocess-motoko.mjs` rewrites `../examples/` →
  `<motokoExamples>/` at sync time, and `remark-include-file` resolves the
  placeholder to the examples directory inside the pinned submodule at build time.

The upstream change (Proposed Change §3 below) makes this bridge permanent by
adopting `<motokoExamples>` paths directly in the source, after which the sync-time
rewrite becomes a no-op.

### 4. Links to retired portal URLs

Many files reference `internetcomputer.org/docs/...`, which is the retired
DFINITY portal. The sync post-processor maintains a rewrite table to map these
to internal developer-docs paths, but that table needs manual updates with
every Motoko release.

### 5. `base/` and `core/` library links

Several files link to `./base/<Module>.md` or `./core/<Module>.md` — both
excluded sections. These are post-processed to `https://mops.one/core/docs/<Module>`
because `mo:base` is deprecated in favour of `mo:core`. Using the mops.one URL
directly in the source removes the need for this rewrite.

The `core/` directory (49 files: `Array.md`, `Map.md`, etc.) is auto-generated
from `caffeinelabs/motoko-core` using `mo-doc` as a separate CI step in the
motoko repo. Once all `./core/<Module>.md` links are replaced with mops.one
URLs, the generated `doc/md/core/` directory is no longer needed in the docs
tree and the CI generation step can be dropped from the motoko repo.

### 6. Docusaurus-specific aside types

```
:::info             ← ~21 occurrences in synced sections (60+ across full doc/md tree)
:::warn             ← 1 occurrence in synced sections
:::info [Link](url) ← link in aside title (Starlight titles are plain text)
```

Starlight supports `:::note`, `:::tip`, `:::caution`, `:::danger`, and
`:::warning` (the full word). It does NOT support `:::info` (renders as plain
text) or `:::warn` (the shortened form — also renders as plain text). The
post-processor maps `:::info` → `:::note` and `:::warn` → `:::caution`. Aside
titles that are markdown links (`:::info [Iter](url)`) are also rewritten to
strip the URL (Starlight titles cannot contain links).

**Important distinction:** `:::warning` (full word) IS a valid Starlight type
(rendered as `:::caution`). Only `:::warn` (three-letter shorthand) is invalid
in Starlight. The source currently uses both — `:::warn` appears once
(`fundamentals/3-types/12-advanced-types.md:235`) and `:::warning` appears twice
(`fundamentals/3-types/9-mutable-arrays.md:89`, `12-base-core-migration.md:31`).
Only `:::warn` needs to be replaced; `:::warning` is already valid.

Docusaurus supports all four Starlight types natively, so switching `:::info` →
`:::note` and `:::warn` → `:::caution` in the upstream source is a safe change
with no effect on the Docusaurus site.

### 7. Docusaurus REPL meta flags

The old DFINITY developer portal (`internetcomputer.org/docs`) wrapped Docusaurus's
`CodeBlock` component with a custom React component that embedded the `moc`
interpreter in the browser. It added the following code-fence meta flags:

| Flag | Docusaurus behaviour |
|---|---|
| `` ```motoko `` (bare, no flag) | Syntax highlighting + **Run** button; output shown on click |
| `` ```motoko run `` | Same as bare but auto-runs on page load |
| `` ```motoko no-repl `` | Syntax highlighting only; no button |
| `` ```motoko name=X `` | Saves block as `X.mo` so other blocks can `include=X` it |
| `` ```motoko include=X,Y `` | Runs `X.mo`, `Y.mo` as context before executing this block |
| `` ```motoko _include=X `` | Like `include=X` but the included code is not shown |

This site uses Astro + Starlight with the Expressive Code syntax highlighter.
**No REPL or interpreter exists on this site.** Expressive Code silently ignores
all unrecognised meta flags. This has been verified in the built HTML output:
the `figcaption` for a `name=int` block is empty, no Run button is injected, and
the code renders as plain syntax-highlighted Motoko — indistinguishable from a
`no-repl` block.

**Distribution in the sections this site syncs** (counted against the source):

| Section | `no-repl` | bare `motoko` | `name=X` | `_include=X` | `run` / `include=` |
|---|---|---|---|---|---|
| `fundamentals/` | 216 | 97 | ~15 (8 files) | ~5 (2 files) | 0 |
| `icp-features/` | 20 | 8 | 0 | 0 | 0 |
| `language-manual.md` | 1 | 19 | 0 | 0 | 0 |
| **Total synced** | **237** | **124** | **~15** | **~5** | **0** |

The `run` and `include=` (without underscore) flags — the most REPL-intensive — do
not appear in any of the synced sections. They exist only in `core/` (35 files),
`base/` (25 files), and `old/` — all of which are deliberately excluded from sync.

**The `name=` blocks that appear in `fundamentals/`** are standalone, complete
examples that each make sense on their own. The `name=` label was only meaningful
to the REPL cross-reference mechanism; on this site it does nothing. Examples:
`name=int` labels the `Int.toText` snippet, `name=List` labels a recursive list
type definition, `name=max` labels a generic max function.

**The `_include=X no-repl` blocks** show a usage example of a named block without
re-executing it. The `_include=` part is a no-op without the REPL; `no-repl` is
already the correct flag for this site.

**The bare `` ```motoko `` blocks** (97 in `fundamentals/`, 8 in `icp-features/`,
19 in `language-manual.md`) implicitly had a Run button in the portal. On this
site they render identically to `no-repl` blocks — Expressive Code ignores the
missing flag. However, they signal intent incorrectly to anyone reading the source.

### 8. Internal relative links use numeric-prefixed paths

Every relative cross-reference in the source uses the current numeric-prefixed
directory and file names. For example, from `fundamentals/3-types/14-subtyping.md`:

```markdown
[immutable arrays (`[T]`)](../3-types/8-immutable-arrays.md)
[mutable arrays](../3-types/9-mutable-arrays.md)
[functions](../3-types/3-functions.md)
```

And from top-level fundamentals files like `0-hello-world.md`:

```markdown
[actor](../fundamentals/2-actors/1-actors-async.md)
[stable variable](../fundamentals/3-types/13-stable-types.md)
```

After the directory and file renames in Proposed Change §1, all of these paths
become invalid. The consuming site's post-processor (`postprocess-motoko.mjs`)
currently rewrites every relative link by stripping numeric prefixes and doing a
slug-index lookup. For a transform-free sync, the upstream must update all
relative links to reflect the post-rename paths.

In the sections this site syncs, **~146 relative links across ~20 files** use
numeric-prefixed paths. The affected files are concentrated in `fundamentals/`
(subdirs `types/`, `actors/`, `declarations/`, `control-flow/`, `basic-syntax/`
and top-level standalone files) and `reference/1-error-codes.md`.

**Content quality issue to fix during this pass:** `fundamentals/1-basic-syntax/3-printing-values.md`
links to `../3-types/3-functions.md` (post-rename: `types/function-types.md`) using
the link text "pure functions". However, `function-types.md` has no heading or
anchor for "pure functions" — the concept is only implicit in the "## Local functions"
section. When updating this link's path in Change §8, also fix the link destination:
either add a `{#pure-functions}` anchor inside `function-types.md` (preferred — makes
the concept explicit) or point to `function-types.md#local-functions` and adjust the
link text to "local functions". Without this fix, readers who click "pure functions"
land at the top of `function-types.md` with no indication where the concept is.

### 9. `changelog.mdx` contains a Docusaurus `md reference` block

`doc/md/reference/3-changelog.mdx` contains:

````
```md reference
https://github.com/dfinity/motoko/blob/master/Changelog.md
```
````

This is a Docusaurus-specific directive that fetches the content of
`Changelog.md` from GitHub at build time. It has no equivalent in Starlight or
standard Markdown — the page renders blank on this site (except for the title)
unless the post-processor inlines the content at sync time.

The post-processor currently reads `Changelog.md` from the pinned submodule
(`./sources/motoko/Changelog.md`) and inlines it. This works but creates a
dependency on postprocess-motoko.mjs for what should be a simple file copy.

`Changelog.md` is 2474 lines and grows with every release. The consumer site
is pinned to a specific submodule commit. If the changelog content lived
directly in `doc/md/reference/changelog.md` at the same commit, there can be
no drift: the file always reflects exactly the entries up to that release.

### 10. `motoko-tooling` links in `comments.md`

`doc/md/fundamentals/1-basic-syntax/10-comments.md` links to the `motoko-tooling/`
section (excluded from sync) via two relative paths:

```markdown
[mo-doc](../../motoko-tooling/3-mo-doc.md)
```

The `motoko-tooling/` section covers: Canpack, dev containers, mo-doc, and the
Motoko VS Code extension. It is excluded from sync because it uses `dfx` commands
(banned in developer-docs) and contains Docusaurus JSX (`import Tabs`).

The post-processor currently rewrites these links to `https://docs.motoko.org`,
which does not exist and produces a broken link.

---

## Proposed changes to `caffeinelabs/motoko`

### 1. Remove numeric prefixes from all directories and files

Change the directory structure from:

```
doc/md/
  12-base-core-migration.md
  14-style.md
  15-compiler-ref.md
  16-language-manual.md
  fundamentals/
    0-hello-world.md
    1-basic-syntax/
      1-defining-an-actor.md
      8-functions.md
    3-types/
      3-functions.md        ← rename to function-types.md to resolve slug collision
    ...
```

to:

```
doc/md/
  base-core-migration.md
  style-guide.md            ← also rename style.md → style-guide.md for clarity
  compiler-ref.md
  language-manual.md
  fundamentals/
    hello-world.md
    basic-syntax/
      defining-an-actor.md
      functions.md
    types/
      function-types.md     ← renamed to avoid collision with basic-syntax/functions.md
    ...
```

Files that currently share a basename after prefix-stripping need distinct names
(the one collision today is `types/functions.md` vs `basic-syntax/functions.md`;
proposed rename: `types/function-types.md`).

`fundamentals/2-actors/6-orthogonal-persistence/index.md` must be renamed to
`overview.md` (not just stripped of its prefix). The simple sync uses
`--exclude='index.md'` to drop Docusaurus section-index pages, which would
inadvertently exclude this file. It contains real overview content comparing both
persistence modes and must be preserved.

### 2. Replace `sidebar_position` with Starlight-native `sidebar.order`

In every file, replace:

```yaml
---
sidebar_position: 8
---
```

with:

```yaml
---
sidebar:
  order: 8
---
```

This allows `icp-features/` and `reference/` to use Starlight `autogenerate`.
`fundamentals/` must stay as an explicitly listed sidebar (see below for why).

**Section-specific notes:**

`icp-features/` — flat structure, autogenerate works. `sidebar_position` maps
directly to `sidebar.order` 1–1. `icp-features/7-view-queries.md` has no
`sidebar_position`; add `sidebar: { order: 7 }` to fix.

`reference/` — after the rename, all six files share one directory but come from
two different legacy position namespaces (reference/ subdir had 1–3; top-level
files had 14–16). Mechanical substitution gives the wrong order. The six files
must be renumbered to match the desired display order:

| File (post-rename) | Old `sidebar_position` | Correct `sidebar.order` |
|---|---|---|
| `language-manual.md` | 16 | 1 |
| `error-codes.md` | 1 | 2 |
| `motoko-grammar.md` | 2 | 3 |
| `style-guide.md` | 14 | 4 |
| `compiler-ref.md` | 15 | 5 |
| `changelog.md` | 3 | 6 |

`fundamentals/` — **cannot use autogenerate** without additional upstream
changes. After removing numeric prefixes, subdirectory names sort alphabetically:
`actors`, `basic-syntax`, `control-flow`, `declarations`, `types` — but the
desired display order is `basic-syntax`, `actors`, `types`, `declarations`,
`control-flow`. Starlight overrides alphabetical directory order only via
`sidebar.order` in a directory's `index.md`. The rsync uses `--exclude='index.md'`
to drop Docusaurus section-index files, which would drop these too. Options:
- Keep the explicit `sidebar.mjs` enumeration for `fundamentals/` (simplest —
  it is already maintained there, and the structure is complex enough that an
  explicit list is easier to read than autogenerate would be).
- Alternatively: upstream adds a minimal `index.md` to each `fundamentals/`
  subdirectory containing only `sidebar: { order: N }` frontmatter; the rsync
  exclusion becomes `--exclude='index.md' --include='*/index.md'` (or a targeted
  script). This is more upstream work for limited gain.

**Recommendation:** keep `fundamentals/` explicitly listed in `sidebar.mjs` and
only switch `icp-features/` and `reference/` to `autogenerate`.

`actors/` duplicate values — both `4-compatibility.md` and `5-messaging.md`
carry `sidebar_position: 4`. Fix so values are unique and match the numeric
filename order.

Three files have no frontmatter at all and will receive a generated title from the
sync script as a fallback. Adding explicit frontmatter upstream is preferred:

- `fundamentals/2-actors/7-mixins.md` — add `title`, `description`, and `sidebar_position: 7`
- `fundamentals/10-contextual-dot.md` — add `title`, `description`, and `sidebar_position`
- `fundamentals/11-implicit-parameters.md` — add `title`, `description`, and `sidebar_position`

### 3. Use `<motokoExamples>` paths for file-embed blocks

Replace Docusaurus-relative paths in file-embed blocks:

````
```motoko file=../examples/counter.mo
```motoko file=../../examples/todo-error.mo#L49-L58
```
````

with the `<motokoExamples>` placeholder:

````
```motoko file=<motokoExamples>/counter.mo
```motoko file=<motokoExamples>/todo-error.mo#L49-L58
```
````

`<motokoExamples>` is a path placeholder recognised by the `remark-include-file`
build plugin on `docs.internetcomputer.org`. It resolves to
`.sources/motoko/doc/md/examples/` — the examples directory inside the pinned
`caffeinelabs/motoko` submodule — at Astro build time. This means:

- Examples are always live: the plugin reads from the pinned submodule at build
  time, so a submodule bump automatically picks up updated examples.
- No sync-time processing: the path rewrite that `postprocess-motoko.mjs`
  currently performs (`../examples/` → `<motokoExamples>/`) will become a
  no-op once the upstream source uses `<motokoExamples>` paths directly, and
  can then be removed from the postprocess script.
- `#L<start>-L<end>` line-range suffixes are supported as-is; the plugin slices
  the specified lines and raises a hard build error if the range is out of bounds.

This is a mechanical search-and-replace in the upstream source:
```bash
# In caffeinelabs/motoko — replace all relative example paths
find doc/md -name '*.md' -o -name '*.mdx' | \
  xargs sed -i 's|file=\(\.\./\)*examples/|file=<motokoExamples>/|g'
```

### 4. Use `mops.one` for `mo:core` links

Replace links to `./base/<Module>.md` and `./core/<Module>.md` with direct
links to `https://mops.one/core/docs/<Module>`. This is more durable (no
relative path that changes with directory restructuring) and points to the
authoritative documentation for the `mo:core` library.

The mops.one URL pattern uses the exact module name: `https://mops.one/core/docs/Map`,
`https://mops.one/core/docs/List`, etc. The module name matches the source file
name in `caffeinelabs/motoko-core/src/<Module>.mo` exactly, so the mapping is
mechanical and stable across releases.

As a consequence: once all `./core/<Module>.md` links are replaced, the
auto-generated `doc/md/core/` directory is no longer needed and can be removed.
The CI step in the motoko repo that runs `mo-doc` to generate those files from
`caffeinelabs/motoko-core` can then be dropped.

### 5. Use `docs.internetcomputer.org` internal paths

Replace all `internetcomputer.org/docs/...` links with the canonical
developer-docs paths (relative or absolute using `docs.internetcomputer.org`).
The mapping for common links:

All `internetcomputer.org/docs/...` URLs currently in the synced source files
(verified against source at time of writing), with specific section anchors
wherever the target page has a matching section:

| Old portal URL | Current developer-docs path |
|---|---|
| `building-apps/essentials/canisters` | `/concepts/canisters` |
| `building-apps/essentials/message-execution` | `/references/message-execution-properties` |
| `building-apps/interact-with-canisters/update-calls` | `/concepts/canisters#update-calls` |
| `building-apps/interact-with-canisters/query-calls` | `/concepts/canisters#query-calls` |
| `building-apps/interact-with-canisters/query-calls#composite-queries` | `/concepts/canisters#composite-queries` |
| `building-apps/interact-with-canisters/candid/candid-concepts` | `/guides/canister-calls/candid` |
| `building-apps/interact-with-canisters/candid/using-candid` | `/guides/canister-calls/candid` |
| `building-apps/interact-with-canisters/agents/overview` | `/guides/canister-calls/calling-from-clients` |
| `building-apps/canister-management/upgrade` | `/guides/canister-management/lifecycle#upgrade-a-canister` |
| `building-apps/canister-management/snapshots` | `/guides/canister-management/snapshots` |
| `building-apps/canister-management/storage` | `/concepts/orthogonal-persistence` |
| `building-apps/canister-management/storage#heap-memory` | `/concepts/orthogonal-persistence#heap-wasm-linear-memory` |
| `building-apps/canister-management/storage#stable-memory` | `/concepts/orthogonal-persistence#stable-memory` |
| `building-apps/canister-management/resource-limits` | `/guides/canister-management/large-wasm` |
| `building-apps/network-features/periodic-tasks-timers` | `/guides/backends/timers` |
| `building-apps/network-features/periodic-tasks-timers#timers` | `/guides/backends/timers#recurring-timers` |
| `building-apps/network-features/randomness` | `/guides/backends/randomness` |
| `references/async-code` | `/references/message-execution-properties` |
| `references/ic-interface-spec` | `/references/ic-interface-spec/` |
| `references/ic-interface-spec#ic-raw_rand` | `/references/ic-interface-spec/management-canister#ic-raw_rand` |
| `references/ic-interface-spec#global-timer` | `/references/ic-interface-spec/canister-interface#global-timer` |
| `references/ic-interface-spec#system-api-inspect-message` | `/references/ic-interface-spec/canister-interface#system-api-inspect-message` |
| `references/ic-interface-spec#heartbeat` | `/references/ic-interface-spec/canister-interface#heartbeat` |
| `references/candid-ref` | `/references/candid-spec` |
| `references/system-canisters/management-canister` | `/references/management-canister` |

Notes on anchored entries:
- The ic-interface-spec is split across multiple pages on developer-docs. Old
  portal anchors map to specific sub-files. `#heartbeat` has no explicit
  `{#heartbeat}` attribute in `canister-interface.md` — Starlight auto-generates
  the slug `heartbeat` from the `#### Heartbeat` heading, so the link resolves.
- `building-apps/canister-management/storage` (with and without fragments) maps
  to `/concepts/orthogonal-persistence`. The old portal page had `#heap-memory`
  and `#stable-memory`; the developer-docs page has `#heap-wasm-linear-memory`
  and `#stable-memory` (exact match for stable; different slug for heap).
- `building-apps/canister-management/logs` and `building-apps/security/iam/`
  appeared in an earlier version of the source but are no longer present. No
  action needed for those two.

### 6. Use Starlight-native aside types

Replace Docusaurus-only aside types with their Starlight equivalents:

- `:::info` → `:::note` (both are supported by Docusaurus; no effect on the Docusaurus site)
- `:::warn` → `:::caution` (same: Docusaurus supports both). **Do not change `:::warning`** (full word) — it is already a valid Starlight type and renders correctly on both sites.
- `:::info [LinkText](url)` → `:::note[LinkText]` (strip URL from title; link text becomes plain-text title)

### 7. Normalize REPL meta flags to `no-repl`

The REPL meta flags are Docusaurus-specific and have no effect on this site (see
Problem §7). Cleaning them up makes the source readable without assuming any
REPL infrastructure:

- **Bare `` ```motoko ``** → `` ```motoko no-repl ``: the implicit Run button
  no longer exists; `no-repl` makes the intent explicit. Scope: all files in the
  sections this site syncs (`fundamentals/`, `icp-features/`, `language-manual.md`).
  This is safe for the Docusaurus site too — Docusaurus renders bare `motoko`
  and `no-repl` identically when no REPL component is mounted.

- **`` ```motoko name=X ``** → `` ```motoko no-repl ``: the `name` label has no
  purpose without the REPL. The code itself is a self-contained example and
  should render as a static block. Applies to all `name=X` blocks in the synced
  sections (~15 occurrences in 8 files under `fundamentals/`).

- **`` ```motoko name=X no-repl ``** → `` ```motoko no-repl ``: strip the unused
  `name=X` attribute, keep `no-repl`.

- **`` ```motoko _include=X no-repl ``** → `` ```motoko no-repl ``: strip the
  `_include=X` attribute (it was a no-op display hint for the REPL; the block
  already carries `no-repl`). Applies to ~5 occurrences in `fundamentals/`.

- **`` ```motoko run ``**: not present in any synced section — no action needed.
  Only appears in `core/` and `base/` which are excluded from sync.

- **`` ```motoko include=X ``** (without underscore): not present in any synced
  section — no action needed.

**Important:** a significant portion of code fences in the source use
`` ``` motoko `` (with a space between the backticks and the language name),
not `` ```motoko ``. This space variant must be normalised first, otherwise
the subsequent `sed` commands that anchor to `^```motoko` will miss those blocks.

This cleanup can be done with the following targeted commands, scoped to the
sections this site syncs:

```bash
# In caffeinelabs/motoko — scoped to synced sections only
# (do NOT apply to core/, base/, old/ — they have active REPL usage)

SYNCED_DIRS="doc/md/fundamentals doc/md/icp-features doc/md/reference"
SYNCED_TOP="doc/md/16-language-manual.md doc/md/14-style.md doc/md/15-compiler-ref.md doc/md/12-base-core-migration.md"

# Step 1: normalise the space-before-language variant (``` motoko → ```motoko)
# This is required first so the patterns below can match consistently.
for dir in $SYNCED_DIRS; do
  find "$dir" \( -name '*.md' -o -name '*.mdx' \) \
    | xargs sed -i 's/^``` motoko/```motoko/g'
done
sed -i 's/^``` motoko/```motoko/g' $SYNCED_TOP

# Step 2: bare ```motoko → ```motoko no-repl
for dir in $SYNCED_DIRS; do
  find "$dir" \( -name '*.md' -o -name '*.mdx' \) \
    | xargs sed -i 's/^```motoko$/```motoko no-repl/'
done
sed -i 's/^```motoko$/```motoko no-repl/' $SYNCED_TOP

# Step 3: strip name=X attribute (with or without no-repl)
for dir in $SYNCED_DIRS; do
  find "$dir" \( -name '*.md' -o -name '*.mdx' \) \
    | xargs sed -i 's/^```motoko\(.*\) name=[^ ]*/```motoko\1/g'
done

# Step 4: strip _include=X attribute (always paired with no-repl)
for dir in $SYNCED_DIRS; do
  find "$dir" \( -name '*.md' -o -name '*.mdx' \) \
    | xargs sed -i 's/ _include=[^ ]*//g'
done
```

`no-repl` is already recognised by both Docusaurus (disables the Run button) and
this site (syntax highlighting only). The cleanup is a safe no-op for the
Docusaurus site.

### 8. Update all internal relative links to use post-rename paths

After the directory and file renames in Change §1, every relative cross-reference
in the source that uses numeric-prefixed path components must be updated. This
applies to ~146 links across ~20 files in the synced sections.

The pattern is mechanical: strip the numeric prefix from each path component in
relative links, and apply the special renames from Change §1 (`3-functions.md` →
`function-types.md`, `index.md` → `overview.md`, `14-style.md` → `style-guide.md`).

Examples of required rewrites:

| Before | After |
|---|---|
| `../3-types/8-immutable-arrays.md` | `../types/immutable-arrays.md` |
| `../2-actors/1-actors-async.md` | `../actors/actors-async.md` |
| `../fundamentals/3-types/13-stable-types.md` | `./types/stable-types.md` |
| `../fundamentals/2-actors/6-orthogonal-persistence/enhanced.md` | `./actors/orthogonal-persistence/enhanced.md` |
| `../5-control-flow/5-switch.md` | `../control-flow/switch.md` |

This step **must be completed alongside Change §1** — the renames and link
updates form one atomic change. A broken intermediate state (files renamed but
links not yet updated) would prevent the Docusaurus site from building.

There is no single `sed` command for this — the correct replacement depends on
each link's context (depth in the tree, target file, special renames). The
recommended approach is to run the renames first, then use a link-checker to
enumerate broken links, and update each one. The consuming site's
`postprocess-motoko.mjs` contains the full mapping table in `syncRenames` and
the slug index logic, which can serve as a reference for the expected post-rename
paths.

### 9. Replace the `changelog.mdx` Docusaurus `md reference` block

`doc/md/reference/3-changelog.mdx` (after prefix removal: `reference/changelog.mdx`)
contains the following Docusaurus-specific directive that has no standard Markdown
equivalent:

````
```md reference
https://github.com/dfinity/motoko/blob/master/Changelog.md
```
````

Docusaurus fetches the content of `Changelog.md` from GitHub and renders it
inline. Starlight and standard Markdown processors ignore this block entirely,
leaving the changelog page blank except for the frontmatter title.

The post-processor currently handles this by reading `Changelog.md` from the
pinned submodule (`.sources/motoko/Changelog.md`) and inlining its full contents.

There is no need to copy `Changelog.md` — it already exists at exactly the right
version in the submodule root at the pinned commit. The fix has two parts:

**developer-docs side (already done with this PR):** `remark-include-file` now
supports inline markdown inclusion. A code fence with language `md` and a `file=`
attribute is replaced with the parsed AST of the referenced file, so the content
renders as prose (headings, lists, etc.), not as a code block. The new
`<motokoRoot>` placeholder resolves to `.sources/motoko/` at build time.

**Upstream fix:** replace the `md reference` block with a single inline include
directive and rename the file from `changelog.mdx` to `changelog.md`:

```markdown
---
title: "Changelog"
description: "Motoko compiler changelog"
sidebar:
  order: 3
---

```md file=<motokoRoot>/Changelog.md
```
```

(The `<motokoRoot>` placeholder is developer-docs-specific and is a no-op on
the Docusaurus site — Docusaurus ignores unknown code fence attributes and will
render this as an empty fenced block. The Docusaurus site can keep its `md reference`
block separately, or the two directives can coexist in the same file since only one
will be processed at a time depending on the build environment.)

The post-processor's changelog inlining step can be removed once the upstream
adopts this. The `changelog.mdx` file can be renamed `changelog.md` at the same
time (the MDX extension was only needed for the `md reference` directive).

### 10. Replace `motoko-tooling` links with a valid external URL

`doc/md/fundamentals/1-basic-syntax/10-comments.md` (after rename:
`fundamentals/basic-syntax/comments.md`) contains two links to the
`motoko-tooling/` section, which is excluded from sync:

```markdown
[mo-doc](../../motoko-tooling/3-mo-doc.md)
```

These appear twice: once inline in the text (line 17) and once in a "See also"
list (line 49).

The post-processor currently rewrites these to `https://docs.motoko.org`, which
does not exist.

**Upstream fix:** replace both occurrences with the GitHub releases page, where
the `mo-doc` binary is distributed:

```markdown
[mo-doc](https://github.com/dfinity/motoko/releases)
```

**developer-docs side:** the `motoko-tooling/` section covers Canpack, dev
containers, mo-doc, and the Motoko VS Code extension. These are currently excluded
from sync because they contain `dfx` commands (banned) and Docusaurus JSX. Rather
than linking to an external URL, consider adding a hand-written `mo-doc` guide
under `docs/guides/tools/` (separate from this sync work). The `developer-tools`
reference page (`docs/references/developer-tools.md`) already covers the Motoko
toolchain at a high level and could link to a future `mo-doc` guide. If Docusaurus
is dropped from the upstream, mo-doc and the VS Code extension pages could
potentially be synced directly once their `dfx` references are replaced with `icp`.

---

## What the sync becomes after these changes

With the above changes in place, `sync-motoko.sh` reduces to:

```bash
rsync -r --delete \
  --exclude='_category_.yml' --exclude='/index.md' \
  .sources/motoko/doc/md/fundamentals/ docs/languages/motoko/fundamentals/
rsync -r --delete \
  --exclude='_category_.yml' --exclude='index.md' \
  .sources/motoko/doc/md/icp-features/  docs/languages/motoko/icp-features/
rsync -r --delete \
  --exclude='_category_.yml' --exclude='index.md' \
  .sources/motoko/doc/md/reference/     docs/languages/motoko/reference/
cp .sources/motoko/doc/md/language-manual.md  docs/languages/motoko/reference/language-manual.md
cp .sources/motoko/doc/md/style-guide.md      docs/languages/motoko/reference/style-guide.md
cp .sources/motoko/doc/md/compiler-ref.md     docs/languages/motoko/reference/compiler-ref.md
cp .sources/motoko/doc/md/base-core-migration.md docs/languages/motoko/base-core-migration.md
```

The `--exclude='_category_.yml'` flag drops Docusaurus category files that
have no meaning in Starlight.

For `fundamentals/`, the exclude uses `--exclude='/index.md'` (leading slash
anchors the pattern to the transfer root). This drops only the top-level
`fundamentals/index.md` (a Docusaurus section landing page with a navigation
list) while **keeping** subdirectory `index.md` files such as
`fundamentals/basic-syntax/index.md` and `fundamentals/actors/index.md`. Those
are the Starlight ordering stubs added by Change §11 — Starlight needs them to
override alphabetical subdirectory order. Using a global
`--exclude='index.md'` (without `/`) would incorrectly exclude those stubs too.

For `icp-features/` and `reference/`, the global `--exclude='index.md'` is
correct: neither section has subdirectory ordering stubs to preserve.

`postprocess-motoko.mjs` can be deleted entirely. The `remark-include-file`
build plugin already handles `<motokoExamples>` paths at build time — no
sync-time file expansion is needed.

`sidebar.mjs` changes after the upstream PR:
- `icp-features/` — switch to `autogenerate: { directory: "languages/motoko/icp-features" }`.
  Already autogenerated today; no change to this block.
- `reference/` — switch to `autogenerate: { directory: "languages/motoko/reference" }`.
  Correct because all six files will have sequential `sidebar.order` 1–6.
- `fundamentals/` — **keep the explicit items list**. Subdirectory order cannot
  be derived automatically after numeric prefixes are removed (alphabetical sort
  does not match desired display order and there are no index.md files to override
  it). The explicit list in `sidebar.mjs` stays as-is; only the `sidebar_position`
  in each file's frontmatter can be removed since it is already unused there.

---

## Migration path

**developer-docs side (already done):**
- `remark-include-file` supports `<motokoExamples>` and `#L<n>-L<m>` ranges.
- `postprocess-motoko.mjs` rewrites `../examples/` → `<motokoExamples>/` at
  sync time as a bridge until the upstream adopts the placeholder directly.

**upstream side (one PR in `caffeinelabs/motoko`):**

1. Remove numeric prefixes from all directories and files (including top-level
   `14-style.md` → `style-guide.md`, `15-compiler-ref.md` → `compiler-ref.md`,
   `16-language-manual.md` → `language-manual.md`,
   `12-base-core-migration.md` → `base-core-migration.md`).
   Rename `fundamentals/2-actors/6-orthogonal-persistence/index.md` →
   `overview.md` (so the simple rsync `--exclude='index.md'` does not drop it).
2. Replace `sidebar_position: N` with `sidebar: { order: N }` in every file.
   Fix duplicate `sidebar_position` values in `2-actors/`. Add `sidebar_position`
   to `icp-features/7-view-queries.md` (currently missing). Add complete
   frontmatter (`title`, `description`, `sidebar_position`) to `7-mixins.md`,
   `10-contextual-dot.md`, and `11-implicit-parameters.md` (currently have none).
3. Replace `file=../examples/` (and `file=../../examples/`) with
   `file=<motokoExamples>/` throughout — one `sed` command covers all cases.
4. Replace `./base/<Module>.md` and `./core/<Module>.md` links with
   `https://mops.one/core/docs/<Module>`.
5. Replace `internetcomputer.org/docs/...` links using the mapping table above.
6. Replace `:::info` → `:::note` and `:::warn` → `:::caution` throughout.
   Do NOT change `:::warning` (full word) — it is already valid in Starlight.
   Strip URLs from aside titles that use a markdown link as the title
   (`:::info [LinkText](url)` → `:::note[LinkText]`).
7. Normalize REPL meta flags in `fundamentals/`, `icp-features/`, `reference/`,
   and the four top-level synced files: normalise space variant
   (`` ``` motoko `` → `` ```motoko ``); bare `` ```motoko `` → `` ```motoko no-repl ``;
   strip `name=X` and `_include=X` attributes (use `no-repl` instead).
8. Update all ~146 internal relative links to use the post-rename paths (no
   numeric prefixes, apply the special renames from step 1). Do this atomically
   with the renames — the Docusaurus site must not have broken links at any
   intermediate commit.
9. Replace the `md reference` block in `reference/changelog.mdx` with
   `` ```md file=<motokoRoot>/Changelog.md ``` `` plus frontmatter.
   Rename `changelog.mdx` → `changelog.md` (MDX was only needed for the
   Docusaurus directive). No release automation needed — the file is a static
   stub; `Changelog.md` at the same commit is always the correct version.
10. Replace the two `../../motoko-tooling/3-mo-doc.md` links in
    `fundamentals/basic-syntax/comments.md` with
    `https://github.com/dfinity/motoko/releases`.
11. Replace the `index.md` files in each `fundamentals/` subdirectory with a
    metadata-only version containing just `sidebar.order` and `sidebar.label`
    frontmatter (no content). Also add a new `fundamentals/actors/index.md`
    which currently does not exist. Add `sidebar: { hidden: true }` to
    `base-core-migration.md`. These three changes are what allow developer-docs
    to switch `fundamentals/` from an explicit sidebar list to `autogenerate`.
    See the table below. Without this step, developer-docs must maintain an
    explicit fundamentals page list in `sidebar-motoko.mjs` and update it
    manually every time a fundamentals page is added or removed.

    | Subdir | Action | `sidebar.order` |
    |---|---|---|
    | `fundamentals/basic-syntax/` | replace `index.md` with metadata stub | 1 |
    | `fundamentals/actors/` | add new `index.md` (currently missing) | 2 |
    | `fundamentals/types/` | replace `index.md` with metadata stub | 3 |
    | `fundamentals/declarations/` | replace `index.md` with metadata stub | 4 |
    | `fundamentals/control-flow/` | replace `index.md` with metadata stub | 5 |
    | `base-core-migration.md` | add `sidebar: { hidden: true }` | n/a |

    The metadata stub format:
    ```yaml
    ---
    sidebar:
      order: 1
      label: "Basic syntax"
    ---
    ```

    The `fundamentals/index.md` (top-level section landing page) is still
    excluded by the sync — only subdir `index.md` files are kept.

**developer-docs side (done in PR 261 — `docs/motoko-sync-fixes`):**
- `remark-include-file` supports `<motokoRoot>` placeholder and inline markdown
  inclusion (`md` language code fence → rendered prose, not a code block).
- `remark-include-file` supports `<motokoExamples>` and `#L<n>-L<m>` ranges.
- `postprocess-motoko.mjs` rewrites `../examples/` → `<motokoExamples>/` at
  sync time as a bridge until the upstream adopts the placeholder directly.
- `sidebar-motoko.mjs` contains the explicit Motoko sidebar as a transitional
  file. It is deleted in the step below once step 11 above lands.

**developer-docs side (separate PR — do after upstream PR merges):**

The following changes must NOT be merged until the upstream reorganization PR
has landed and the submodule has been bumped. Merging them early permanently
breaks the automated weekly sync CI (`sync-motoko.yml` runs `npm run sync:motoko`
weekly; it would fail on the structure guard with every new Motoko release until
the upstream changes are in place).

1. Replace `sync-motoko.sh` with the simplified rsync version shown above. Add a
   structure guard at the top: if `$SOURCE_DIR/fundamentals/1-basic-syntax` still
   exists (old numeric-prefix layout), exit with a clear error. Use
   `--exclude='/index.md'` (anchored) for the `fundamentals/` rsync so subdir
   ordering stubs are kept; use `--exclude='index.md'` (global) for `icp-features/`
   and `reference/` which have no ordering stubs. Remove the postprocess call.
2. Delete `postprocess-motoko.mjs`.
3. Delete `sidebar-motoko.mjs`. Replace its import in `sidebar.mjs` with:
   ```js
   export const motokoSidebar = {
     label: "Motoko",
     collapsed: true,
     autogenerate: { directory: "languages/motoko" },
   };
   ```
   New pages in any section appear automatically. No sidebar config to maintain.

The Docusaurus site in `caffeinelabs/motoko` is unaffected: Docusaurus ignores
`sidebar.order` and continues to use `_category_.yml` position values.
Both `sidebar_position` and `sidebar.order` can coexist in the same frontmatter
during the transition period.

---

## Appendix: additional decisions

### If Docusaurus is dropped from the upstream repo

The motoko team is considering moving away from Docusaurus in `caffeinelabs/motoko`.
If that happens, some of the changes above become simpler or can be deferred:

- **§2 (sidebar.order)**: If Docusaurus is dropped, `sidebar_position` can be
  removed entirely rather than migrated. `sidebar.order` in Starlight frontmatter
  remains the right replacement.
- **§6 (aside types)**: Without Docusaurus compatibility to maintain, `:::info` can
  simply become `:::note` with no concern about backward breakage on the docs site.
- **§7 (REPL flags)**: `no-repl` is Docusaurus-specific. Without Docusaurus, REPL
  flags can be removed entirely rather than normalized. Bare `` ```motoko `` is the
  correct form for a static site.
- **§9 (changelog)**: The `md reference` block is Docusaurus-specific and would
  need replacing regardless of which framework replaces it.
- **§1, §3, §4, §5, §8, §10**: Framework-independent — required regardless of
  which docs tool the upstream uses.

In practice: proceed with this plan without waiting for a Docusaurus decision. The
changes are safe whether Docusaurus stays or goes.

### Upstream agent instructions: `_category_.yml` and `index.md`

The upstream `caffeinelabs/motoko` currently uses two Docusaurus-specific
constructs for sidebar navigation that have no equivalent in Starlight. Both
must be replaced as part of the reorganization (or removed if Docusaurus is
dropped).

#### `_category_.yml` files

Each `_category_.yml` defines the label, position, and collapsed state for a
directory in the Docusaurus sidebar. In Starlight, this information goes into
an `index.md` file in the same directory with `sidebar.order` and
`sidebar.label` frontmatter.

**Mapping for all `_category_.yml` files in the synced sections:**

| Directory (post-rename) | `_category_.yml` | Action |
|---|---|---|
| `fundamentals/` | `position: 3, label: 'Fundamentals'` | Delete — label comes from `sidebar.mjs` in developer-docs, not from upstream |
| `fundamentals/basic-syntax/` | `position: 2, label: 'Basic syntax'` | Create `index.md` stub with `sidebar: { order: 1, label: "Basic syntax" }` |
| `fundamentals/actors/` | `position: 3, label: 'Actors'` | Create `index.md` stub with `sidebar: { order: 2, label: "Actors" }` |
| `fundamentals/types/` | `position: 4, label: 'Types'` | Create `index.md` stub with `sidebar: { order: 3, label: "Types" }` |
| `fundamentals/declarations/` | `position: 5, label: 'Declarations'` | Create `index.md` stub with `sidebar: { order: 4, label: "Declarations" }` |
| `fundamentals/control-flow/` | `position: 6, label: 'Control flow'` | Create `index.md` stub with `sidebar: { order: 5, label: "Control flow" }` |
| `icp-features/` | `position: 4, label: 'ICP features'` | Delete — label comes from `sidebar.mjs` |
| `reference/` | `position: 13, label: 'Motoko references'` | Delete — label comes from `sidebar.mjs` |

Note: the Starlight `sidebar.order` values (1–5) for fundamentals subdirs do
not match the Docusaurus `position` values (2–6). The difference is that
Docusaurus counts `hello-world.md` (position 1) as a sibling, while Starlight
uses the subdir `index.md` order only among subdirs. What matters is the
relative order among the five subdirs, not the absolute number.

The metadata stub format:
```yaml
---
sidebar:
  order: 1
  label: "Basic syntax"
---
```
No title, description, or body content. This is a Starlight navigation
control file only.

After creating the `index.md` stubs, delete every `_category_.yml` in the repo
(they have no meaning outside Docusaurus).

#### `index.md` files in `fundamentals/` subdirs

The current `index.md` files in `fundamentals/1-basic-syntax/`,
`fundamentals/3-types/`, `fundamentals/4-declarations/`, and
`fundamentals/5-control-flow/` are Docusaurus section landing pages. Their
content is a numbered list of links to pages in the section — useful in
Docusaurus where the section heading is a clickable link. In Starlight, the
sidebar handles navigation automatically; these pages are not needed.

**Replace** each of these `index.md` files with the metadata stub described
above (matching the `_category_.yml` values for that directory). The existing
list content is Docusaurus navigation scaffold and can be discarded.

`fundamentals/2-actors/` currently has no `index.md`. **Create** one with the
stub for order 2 / label "Actors" (the `_category_.yml` position and label).

**Do NOT touch** `fundamentals/2-actors/6-orthogonal-persistence/index.md` —
this file contains real conceptual content comparing both persistence modes.
It must be **renamed** to `overview.md` (Change §1) so the sync script's
`--exclude='/index.md'` does not drop it.

The top-level `fundamentals/index.md`, `icp-features/index.md`, and
`reference/index.md` section landing pages are excluded from sync entirely.
Delete them or leave them for Docusaurus — they have no effect on the
developer-docs build either way.

### `base-core-migration.md` in the sidebar

`base-core-migration.md` is currently excluded from the sidebar and linked from
the Motoko overview (`docs/languages/motoko/index.md`) only. This is the right
call: `mo:base` has been deprecated for a while and most new developers will never
need the migration guide. Keeping it off the sidebar avoids adding a dead-weight
entry that implies the base library is still relevant. The guide remains fully
discoverable via site search and via the overview link for developers who do need
it. No change recommended.
