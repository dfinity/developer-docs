# Submodule bumping

Only the project maintainer bumps submodule refs. Reference this file when asked to bump a submodule.

## Step 0 — Determine the new ref

- **Release-pinned repos:** `git ls-remote --tags origin` — pin to the highest version tag's commit.
- **main/master repos:** fetch and checkout `origin/main` or `origin/master`.

## General checklist (all submodules)

1. Identify changes: `git -C .sources/<repo> log --oneline <old-ref>..<new-ref>`
2. Grep docs pages for content derived from that submodule; update affected pages
3. Check open PRs — post a bump-notice comment if the bump may affect pages under review (format below)
4. Update `.sources/VERSIONS` for release-pinned repos
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

## Per-submodule additional checks

| Submodule | Extra checks on bump |
|---|---|
| `motoko` | **Automated** — `.github/workflows/sync-motoko.yml` opens a PR with the bump, synced docs, and VERSIONS update already committed. Review the content diff and merge. Also grep all Motoko code blocks for changed/removed API signatures. |
| `motoko-core` | Grep all Motoko code blocks for changed/removed API signatures |
| `cdk-rs` | Check `ic-cdk`, `ic-cdk-timers`, `ic-cdk-macros` API changes — grep all Rust code blocks |
| `icp-cli` | Grep all CLI examples for changed/removed commands or flags. If the release introduces a new minor version (e.g. `v0.3.x`), update all CLI doc link slugs — see "Link adaptation for icp-cli" below. |
| `icskills` | Check for changed canister IDs or code patterns |
| `examples` | Verify linked files still exist at the same path |
| `icp-cli-recipes` | Check for renamed or removed recipes referenced in docs |
| `icp-cli-templates` | Check for renamed or restructured templates |
| `icp-js-sdk-docs` | Unzip and compare API signatures; check `versions.json` for new releases |
| `candid` | Check for spec changes affecting the Candid reference or type-mapping examples |
| `response-verification` | Check for API changes affecting certified variables patterns |
| `dotskills` | Check if the `technical-documentation` skill changed in ways that affect review criteria |
| `internetidentity` | Run `npm run sync:ii-spec` — syncs `ii-spec.mdx` → `docs/references/internet-identity-spec.md` and `vc-spec.md` → `docs/references/verifiable-credentials-spec.md`. If the script exits with a warning about unhandled links, add the new pattern to `linkMap` (ii-spec) or `vcLinkMap` (vc-spec) in `scripts/sync-ii-spec.mjs`. Pin to the latest `release-YYYY-MM-DD` tag. The **Sync II spec** workflow (`.github/workflows/sync-ii-spec.yml`) runs automatically; trigger manually for early sync. |
| `chain-fusion-signer` | Check for changed canister IDs, API methods, or key derivation patterns |
| `papi` | Check for changed payment interface or cycle cost model |
| `ic-pub-key` | Check for changed CLI flags or commands |

## Link adaptation for `icp-cli`

All CLI docs links use a versioned slug (e.g. `https://cli.internetcomputer.org/0.2/...`). When bumped to a new minor version:

1. Read the new slug: `cat .sources/icp-cli/docs-site/versions.json` — use the `"version"` marked `"latest": true`.
2. Verify all linked paths still exist in the new submodule before replacing:
   ```bash
   grep -roh "cli\.internetcomputer\.org/[0-9][.0-9]*/[^\"' )#]*" docs/ --include="*.md" --include="*.mdx" \
     | sed 's|cli\.internetcomputer\.org/[0-9][.0-9]*/||' | sort -u | grep -v "^$" \
     | while read p; do
         [ -f ".sources/icp-cli/docs/${p}.md" ] || echo "MISSING: $p"
       done
   ```
   Resolve any MISSING paths manually before proceeding.
3. Replace the slug across all files:
   ```bash
   old=0.2; new=0.3
   find docs/ \( -name "*.md" -o -name "*.mdx" \) | xargs sed -i "s|cli.internetcomputer.org/${old}/|cli.internetcomputer.org/${new}/|g"
   ```
4. Run `npm run build` to confirm no broken links.

## Link adaptation for `internet-identity-spec.md` and `verifiable-credentials-spec.md`

Both are handled automatically by `npm run sync:ii-spec`. If a new unhandled link pattern appears, the script exits with a warning — add it to `linkMap` (ii-spec) or `vcLinkMap` (vc-spec) in `scripts/sync-ii-spec.mjs`, then re-run. Use `grep -r "{#<anchor>}" docs/references/ic-interface-spec/` to find which file owns a given anchor.

## Shallow clone resolution

If a shallow clone can't resolve a pinned commit:
```bash
git -C .sources/<repo> fetch --unshallow
git -C .sources/<repo> checkout <commit>
```
