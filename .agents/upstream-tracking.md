# Upstream tracking

How this repo stays current with the projects it documents.

Upstream repos fall into three groups, and the group decides the procedure.

| | Vendored (submodule) | Watched | Reference |
|---|---|---|---|
| Which | `motoko`, `internetidentity`, `examples` | the `watched` array in `.sources/upstream.json` | the `reference` array |
| Why | the build opens their files | a release can silently invalidate a lot of published content | drawn on too lightly for a weekly issue |
| Pin | the gitlink | `pinned` in `upstream.json` | none; verify against the latest release |
| Notified | yes | yes | no |

Deciding between the last two is a judgment about blast radius, and the `why`
field on each `reference` entry records the footprint that decided it. Promote an
entry to `watched` if its footprint grows.

`motoko` and `internetidentity` have their own weekly sync workflows that open
the bump PR directly. `examples` and the `watched` repos are covered by the
weekly **Upstream release check**, which opens an issue. `reference` repos are
not checked at all.

## Why only three are vendored

A submodule is justified only when the repo's content is resolved during the
build, because then it has to be on disk at a known ref:

- `motoko` — synced into `docs/languages/motoko/` **and** resolved at build time
  by 52 `<motokoExamples>` file includes.
- `internetidentity` — `scripts/sync-ii-spec.mjs` generates two reference pages
  from it.
- `examples` — `plugins/remark-snippet.mjs` extracts `snippet=` code at build
  time.

Everything else is read to check a fact, which needs a pinned ref rather than a
copy, or is a skill, which the session-start sync mirrors from
[skills.internetcomputer.org](https://skills.internetcomputer.org) (see AGENTS.md
"Skills"). Add a submodule only if the build has to open its files.

Third-party content that is copied in rather than referenced must carry its
license with it: the license text alongside the files, and an entry in
[`NOTICE`](../NOTICE). A license that forbids that is a reason to reference the
upstream instead of copying it.

## Watched repos

### Verifying a fact against a watched repo

Read the file at the **pinned** ref, not at `main`:

```bash
# The pinned ref for each repo is in .sources/upstream.json
curl -sL https://raw.githubusercontent.com/dfinity/icp-cli/v1.1.0/docs/reference/cli.md
```

Use `raw.githubusercontent.com`, not `gh api .../contents/...`: the API returns
base64 that gets truncated by the CLI wrapper, and a truncated flag reference is
worse than none because it looks complete.

Verify against the pinned ref rather than `main` for two reasons. A review stays
reproducible, and a page cannot end up documenting a flag from a release whose
doc links have not been adapted yet.

Many of these repos also publish authoritative docs (the `reference` field in
`upstream.json`: mops.one, docs.rs, js.icp.build, cli.internetcomputer.org).
Those are the right thing to *link* readers to. For verifying a claim, prefer the
pinned source file, because a published site always shows "latest".

### When an upstream moves

`.github/workflows/upstream-releases.yml` runs weekly and opens one issue per
repo that has moved past its pin. Every issue carries `upstream-sync`, so they
are findable as a class, plus a per-upstream label so a later run can supersede
its own issue: `upstream-dfinity-<repo>` for a watched repo and
`upstream-submodule-<name>` for a vendored one. The issue
carries the ref delta, a compare link, a summary of what changed in the repo's
`verify` file when one is configured, and the `affects` note saying which pages
to re-check.

To close one:

1. Review the changes against the pages named in the issue.
2. Update those pages if anything they state has changed.
3. Set `pinned` to the new ref in `.sources/upstream.json`, in the same PR.

If nothing in the docs is affected, bump the pin alone and say so in the PR. The
pin means "the docs were checked against this ref", so it should not move
without someone having looked.

Run it locally at any time:

```bash
node scripts/check-upstream-releases.mjs                      # all repos
node scripts/check-upstream-releases.mjs --repo dfinity/icp-cli
```

Exit code 0 means nothing moved, 1 means at least one did (bodies are written to
`.upstream-checks/`), 2 means a check errored.

### Adding a repo to the watch list

Add an entry to `.sources/upstream.json`, declaring where its releases actually
appear:

| `track` | Latest ref comes from | Use it when |
|---|---|---|
| `release` | git tags matching `tagPattern` | tags are the release identity |
| `crate` | crates.io `newest_version` for `crate` | the repo publishes without tagging |
| `npm` | the npm registry `latest` for `package` | same, for a JS package |
| `commit` | the default branch head | the repo has no releases at all |

Two traps this has already hit:

- **`tagPattern` must be anchored and specific.** Several of these repos tag per
  crate or per recipe, so a loose pattern picks the wrong series and reports a
  version from a different artifact.
- **A `release` pin must be a real tag.** A pin that no tag can overtake makes
  the repo report "current" for ever. The script fails loudly on this rather than
  going quiet, which is how `cdk-rs` was caught pinned to a crate version that
  its tags were two minors behind.

Set `verify` when a single file carries the surface we check against; its diff
becomes the issue's review payload, and a changelog is usually the best choice
because it names what changed instead of leaving "check every signature" as the
task. It only applies to `release` and `commit` tracks, since a registry version
is not a ref git can resolve.

### `icp-cli`: link slug adaptation

All CLI docs links use a versioned slug (`https://cli.internetcomputer.org/1.3/...`).
When `icp-cli` moves to a new minor:

1. The slug is the `major.minor` of the release (`v1.3.0` → `1.3`). Confirm it is
   live by opening the docs-site root, which redirects to the latest version.
2. Verify every linked path and anchor resolves at the new slug **before**
   replacing. Check the live site, not a repo tree: that validates the published
   URL, its trailing-slash behaviour, and the anchor.
   ```bash
   grep -roh "cli\.internetcomputer\.org/[0-9][.0-9]*/[^\"' )#]*" docs/ \
     | sed 's|cli\.internetcomputer\.org/[0-9][.0-9]*/||' | sort -u | grep -v "^$" \
     | while read -r p; do
         code=$(curl -sSL -o /dev/null -w "%{http_code}" "https://cli.internetcomputer.org/<new>/$p")
         [ "$code" = "200" ] || echo "MISSING ($code): $p"
       done
   ```
   For deep links, also confirm the anchor exists:
   ```bash
   curl -sL "https://cli.internetcomputer.org/<new>/reference/cli/" | grep -o 'id="icp-cycles"'
   ```
3. Replace the slug across all files (per-file loop, because GNU and BSD `sed`
   disagree on `-i`):
   ```bash
   old=1.1; new=1.3
   grep -rl "cli.internetcomputer.org/${old}/" docs/ | while IFS= read -r f; do
     sed -i.bak "s|cli.internetcomputer.org/${old}/|cli.internetcomputer.org/${new}/|g" "$f" && rm -f "$f.bak"
   done
   ```
4. Update the slug named in the AGENTS.md linking rule.
5. Run `npm run build`.

## Vendored submodules

Only the project maintainer bumps submodule refs.

`examples` tracks a branch and is checked by the same **Upstream release check**
workflow, which opens an issue when the gitlink falls behind that branch. Its pin
lives in git, so `upstream.json` records only the branch to compare against and
what a bump affects.

`motoko` and `internetidentity` are not in `upstream.json`: `sync-motoko.yml` and
`sync-ii-spec.yml` already check for a new release, run the sync, and open the
bump PR with the result.

### Determine the new ref

- **Release-pinned** (`motoko`, `internetidentity`): `git ls-remote --tags origin`,
  pin to the highest version tag's commit.
- **Branch-tracking** (`examples`): fetch and check out `origin/master`.

### Checklist

1. Identify changes: `git -C .sources/<repo> log --oneline <old-ref>..<new-ref>`
2. Grep `docs/` for content derived from that submodule; update affected pages
3. Check open PRs — post a bump notice if the bump may affect pages under review
4. Update `.sources/VERSIONS` for the release-pinned ones
5. Note the bump in the PR description

**Bump-notice PR comment:**
```bash
gh pr comment <PR#> --body "$(cat <<'EOF'
<!-- submodule-bump-notice -->
`<repo>` was bumped to `<new-ref>`. The following content on this PR may be outdated:
- [specific item and why]

Please review before merging.
EOF
)"
```

### Per-submodule extra checks

| Submodule | Extra checks on bump |
|---|---|
| `motoko` | **Automated** — `.github/workflows/sync-motoko.yml` opens a PR with the bump, the synced docs, and the VERSIONS update already committed. Review the content diff and merge. Also grep Motoko code blocks for changed API signatures. |
| `internetidentity` | Run `npm run sync:ii-spec`. If it warns about an unhandled link, add the pattern to `linkMap` (ii-spec) or `vcLinkMap` (vc-spec) in `scripts/sync-ii-spec.mjs`. Pin to the latest `release-YYYY-MM-DD` tag. `.github/workflows/sync-ii-spec.yml` runs this automatically; trigger it manually for an early sync. |
| `examples` | Verify every `snippet=` path and `#region` marker still resolves — a missing region is a build error. |

### Link adaptation for the synced specs

`internet-identity-spec.md` and `verifiable-credentials-spec.md` are handled by
`npm run sync:ii-spec`. If a new unhandled link pattern appears the script exits
with a warning; add it to `linkMap` or `vcLinkMap` in `scripts/sync-ii-spec.mjs`
and re-run. Use `grep -r "{#<anchor>}" docs/references/ic-interface-spec/` to
find which file owns an anchor.

### Shallow clone resolution

If a shallow clone cannot resolve a pinned commit:

```bash
git -C .sources/<repo> fetch --unshallow
git -C .sources/<repo> checkout <commit>
```
