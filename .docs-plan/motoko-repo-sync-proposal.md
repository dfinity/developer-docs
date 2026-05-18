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
`file=<path>` syntax. However, two gaps prevent a drop-in replacement:

- The plugin does not support line-range slicing (`#L1-L30`). Of the 47 file-embed
  blocks in the Motoko source, 9 use line ranges and 38 embed whole files.
- After sync, the source files land in `docs/languages/motoko/fundamentals/...`
  while the example files stay in `.sources/motoko/doc/md/examples/`. A relative
  path from the synced location would be 6 directories deep and would break
  whenever the sync layout changes.

Inlining the code directly in the source is the cleanest solution: it makes the
documentation self-contained, works in both Docusaurus and Starlight without any
plugin, and removes the dependency on the examples directory structure. For examples
longer than ~30 lines, link to the `dfinity/examples` repository instead.

### 4. Links to retired portal URLs

Many files reference `internetcomputer.org/docs/...`, which is the retired
DFINITY portal. The sync post-processor maintains a rewrite table to map these
to internal developer-docs paths, but that table needs manual updates with
every Motoko release.

### 5. `base/` library links

Several files link to `./base/<Module>.md`, which is an excluded section. These
are post-processed to `mops.one/core/docs/<Module>` because `mo:base` is
deprecated in favour of `mo:core`. Using `https://mops.one/core/docs/<Module>`
links directly in the source removes the need for this rewrite.

### 6. Docusaurus-specific aside types

```
:::info             ← 60 occurrences in source
:::warn             ← 1 occurrence in source
:::info [Link](url) ← link in aside title (Starlight titles are plain text)
```

Starlight supports `:::note`, `:::tip`, `:::caution`, and `:::danger`. It does
not natively support `:::info` or `:::warn`. The post-processor currently maps
`:::info` → `:::note` and `:::warn` → `:::caution`. Aside titles that are
markdown links (`:::info [Iter](url)`) are also rewritten to strip the URL
(Starlight titles cannot contain links).

Docusaurus supports all four Starlight types natively, so switching `:::info` →
`:::note` and `:::warn` → `:::caution` in the upstream source is a safe change
with no effect on the Docusaurus site.

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

This means the consuming site can use `autogenerate: { directory: "..." }` in
its Starlight sidebar config and get the correct order without maintaining an
explicit page list.

Note: a few files in `2-actors/` have duplicate `sidebar_position` values (e.g.
both `4-compatibility.md` and `5-messaging.md` carry `sidebar_position: 4`). Fix
these so values are unique and match the numeric filename order.

### 3. Inline file-embed examples

Replace Docusaurus file-embed blocks:

````
```motoko file=../examples/counter.mo#L1-L30
```
````

with the actual inline code. This removes the `file=` attribute processing step
and makes the documentation self-contained. For longer examples (>30 lines),
link to the `dfinity/examples` repository rather than embedding.

### 4. Use `mops.one` for `mo:core` links

Replace links to `./base/<Module>.md` and `./core/<Module>.md` with direct
links to `https://mops.one/core/docs/<Module>`. This is more durable (no
relative path that changes with directory restructuring) and points to the
authoritative documentation for the `mo:core` library.

### 5. Use `docs.internetcomputer.org` internal paths

Replace all `internetcomputer.org/docs/...` links with the canonical
developer-docs paths (relative or absolute using `docs.internetcomputer.org`).
The mapping for common links:

| Old portal URL | Current developer-docs path |
|---|---|
| `building-apps/essentials/canisters` | `/concepts/canisters` |
| `building-apps/canister-management/upgrade` | `/guides/canister-management/lifecycle` |
| `building-apps/canister-management/logs` | `/guides/canister-management/logs` |
| `building-apps/canister-management/snapshots` | `/guides/canister-management/snapshots` |
| `building-apps/canister-management/storage` | `/concepts/orthogonal-persistence` |
| `building-apps/interact-with-canisters/candid/candid-concepts` | `/guides/canister-calls/candid` |
| `building-apps/network-features/periodic-tasks-timers` | `/guides/backends/timers` |
| `building-apps/network-features/randomness` | `/guides/backends/randomness` |
| `building-apps/security/iam/` | `/guides/security/identity-and-access-management` |
| `references/ic-interface-spec` | `/references/ic-interface-spec/` |
| `references/candid-ref` | `/references/candid-spec` |
| `references/system-canisters/management-canister` | `/references/management-canister` |

### 6. Use Starlight-native aside types

Replace Docusaurus-only aside types with their Starlight equivalents:

- `:::info` → `:::note` (both are supported by Docusaurus; no effect on the Docusaurus site)
- `:::warn` → `:::caution` (same: Docusaurus supports both)
- `:::info [LinkText](url)` → `:::note[LinkText]` (strip URL from title; link text becomes plain-text title)

---

## What the sync becomes after these changes

With the above changes in place, `sync-motoko.sh` reduces to:

```bash
rsync -r --delete \
  --exclude='_category_.yml' --exclude='index.md' \
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
have no meaning in Starlight. The `--exclude='index.md'` flag drops Docusaurus
section index pages that Starlight doesn't use.

`postprocess-motoko.mjs` can be deleted entirely.

`sidebar.mjs` can switch every `items: [{ slug: "..." }, ...]` list inside the
Motoko section to `autogenerate: { directory: "..." }`, since `sidebar.order`
in frontmatter will provide the correct sort order automatically.

---

## Migration path

1. Open a PR in `caffeinelabs/motoko` with the structural changes above.
2. Once merged and released, update the `.sources/motoko` submodule pin.
3. Simplify `sync-motoko.sh` and delete `postprocess-motoko.mjs`.
4. Update `sidebar.mjs` to use `autogenerate: { directory: "..." }` for all
   Motoko subsections (fundamentals, icp-features, reference, and each
   fundamentals subgroup), since `sidebar.order` will be correct in frontmatter.

The Docusaurus site in `caffeinelabs/motoko` is unaffected: Docusaurus ignores
`sidebar.order` and continues to use `_category_.yml` position values.
Both `sidebar_position` and `sidebar.order` can coexist in the same frontmatter
during the transition period.
