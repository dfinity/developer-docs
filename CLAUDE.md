# ICP Developer Docs

## What this repo is

ICP developer documentation built with Astro + Starlight.
All content is plain `.md` files. No `.mdx`. No JSX.
Goal: get developers (human and AI) building on the IC as fast as possible.

## Key directories

- `src/content/docs/` — All documentation (`.md` only)
- `src/content/docs/languages/motoko/` — Auto-synced from `caffeinelabs/motoko` (do not edit directly)
- `src/content/docs/tools/migrating-from-dfx/` — Auto-synced from `dfinity/icp-cli` (do not edit directly)
- `scripts/` — Sync, validation, and generation scripts
- `DOCS_RESTRUCTURING_PROPOSAL.md` — Full architecture proposal and decisions

## Rules

### Content rules
- **NEVER reference `dfx`** — it is deprecated. Use icp-cli instead. CI rejects `dfx` references.
- All docs must have complete frontmatter (see CONTRIBUTING.md for schema)
- Synced content has `source_repo` in frontmatter — edits must go to source repo
- All code examples must be self-contained and copy-pasteable
- No `.mdx` files. No JSX. Plain markdown only.
- Max sidebar nesting: 3 levels

### Linking rules
- For CLI commands → link to https://dfinity.github.io/icp-cli/ (write unversioned — a remark plugin injects the version from `src/versions.json` at build time)
- For Motoko base/core library → link to https://mops.one/core/docs or https://mops.one/base/docs
- For Rust CDK API → link to https://docs.rs/ic-cdk/latest/ic_cdk/
- For JS SDK → link to https://js.icp.build
- For protocol internals → link to https://learn.internetcomputer.org
- For agent skill files → link to https://skills.internetcomputer.org

### Agent development
- icskills repo: https://github.com/dfinity/icskills
- Install skills: `npx skills add dfinity/icskills`
- Skills site: https://skills.internetcomputer.org
- When writing capability or how-to pages, link to relevant icskills skill files

## External docs (don't duplicate these)

| Resource | URL |
|----------|-----|
| icp-cli | https://dfinity.github.io/icp-cli/ |
| JS SDK | https://js.icp.build |
| icskills | https://skills.internetcomputer.org |
| Learn Hub | https://learn.internetcomputer.org |
| Motoko core library | https://mops.one/core/docs |
| Motoko base library | https://mops.one/base/docs |
| Rust CDK API | https://docs.rs/ic-cdk/latest/ic_cdk/ |

## Portal tracking

The old portal (`dfinity/portal`) is still live during the transition period.
A daily workflow tracks changes in the portal and creates issues when relevant.

When reviewing portal tracking issues:
- **Ignore:** dfx-only changes, JSX/component changes, release notes, NNS dapp guides
- **Flag for rewrite:** Content updates to topics we cover
- **Evaluate:** New content — does it belong in the new portal?

## Commands

- `npm run dev` — Local dev server
- `npm run build` — Production build (also generates llms.txt, llms-full.txt, manifest)
- `npm run preview` — Preview production build
- `npm run validate` — Run all validation checks
- `npm run validate:frontmatter` — Check frontmatter schema
- `npm run validate:no-dfx` — Check for dfx references
- `npm run validate:no-mdx` — Check for .mdx files
- `npm run generate:llms-txt` — Generate llms.txt and llms-full.txt
- `npm run generate:manifest` — Generate docs-manifest.json
- `npm run sync:motoko` — Sync Motoko docs from caffeinelabs/motoko
- `npm run sync:icp-cli-version` — Update icp-cli version for doc links from latest release

## Content authoring workflow

When drafting a new docs page:

1. Read the corresponding page(s) from the old portal (`dfinity/portal/docs/`)
2. Read any related icskills skill file for accurate canister IDs and code patterns
3. Rewrite the content:
   - Use icp-cli commands (never dfx)
   - Use plain markdown (never JSX/MDX)
   - Add complete frontmatter (see CONTRIBUTING.md)
   - Ensure code examples are self-contained and copy-pasteable
   - Link to external docs per the linking rules above
4. Run `npm run validate` to check for issues
5. Submit for review by the relevant team (see CODEOWNERS)
