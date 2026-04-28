# ICP Developer Docs

Developer documentation for the [Internet Computer](https://internetcomputer.org) — built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build), deployed at [docs.internetcomputer.org](https://docs.internetcomputer.org).

## Background

This repo is a ground-up rewrite of the ICP developer docs: a flat Diataxis structure (Getting Started, Guides, Concepts, Languages, Reference), content verified against pinned upstream repos, and a workflow built for both human contributors and AI coding agents from day one. It replaces the previous [dfinity/portal](https://github.com/dfinity/portal) (Docusaurus) site.

## Current state

Most pages are content-complete. A small number of pages remain as stubs (vetkeys, encryption).

## Content areas

| Section | What it covers |
|---------|----------------|
| Getting Started | Tutorials and quickstarts |
| Guides | How-to guides: backends, frontends, authentication, testing, deployment, chain fusion, security |
| Concepts | Developer-focused explanations of ICP architecture and design decisions |
| Languages | Language-specific guides for Rust and Motoko |
| Reference | Specifications, canister IDs, cycle costs, glossary |

## Quick start

```bash
./scripts/setup.sh    # Initialize submodules and install dependencies
npm run dev           # Dev server at localhost:4321
npm run build         # Production build
```

## Project layout

```
docs/                   # All documentation (.md only)
├── getting-started/    # Tutorials
├── guides/             # How-to guides
├── concepts/           # Explanations
├── languages/          # Motoko (synced) + Rust (hand-written)
└── reference/          # Specs and reference
.sources/               # Pinned upstream source repos (read-only)
├── VERSIONS            # Current pinned versions for versioned submodules
└── ...                 # portal, icp-cli, motoko, cdk-rs, icskills, examples, ...
.docs-plan/             # Planning artifacts and authoring workflow
AGENTS.md               # Contributor and agent instructions
```

Documentation lives in `docs/` at the project root. Astro reads it via a symlink at `src/content/docs/`. Pages default to `.md`; `.mdx` is used only when a page needs interactive components (for example, language-synced tabs).

## Contributing

Open tasks are tracked as [GitHub Issues](https://github.com/dfinity/developer-docs/issues). Content pages use the `documentation` label; infrastructure tasks use `enhancement`.

**AGENTS.md** is the single source of truth for contributors and AI agents alike. It covers branch naming, content authoring workflow, code conventions, PR submission, and how to handle feedback. `CLAUDE.md` symlinks to `AGENTS.md`.

Key rules at a glance:

- Use `icp` CLI commands in all examples — never `dfx`
- Use `mo:core` for all Motoko standard library imports — never `mo:base`
- Every content page ends with an `<!-- Upstream: -->` comment listing source repos used
- Every PR includes a `## Sync recommendation` in the description

Use **squash and merge** to keep `main` history clean.

## Working with AI agents

This project treats AI coding agents as first-class contributors. Agents (Claude Code, Codex, Cursor, etc.) write pages from source material in `.sources/`, verify code snippets, and address PR feedback. Human developers direct the work, review the output, and make structural decisions.

`.sources/` contains pinned git submodules — CLI references, API signatures, code examples, skill files — that agents use as ground truth when writing and verifying content. Agents always read from `.sources/` rather than training data.

```bash
./scripts/setup.sh    # Sets up submodules and npm deps
# Then open Claude Code or your preferred agent in the repo root.
# The agent reads AGENTS.md automatically.
```

| Agents handle | Developers handle |
|---------------|-------------------|
| Draft content from source material | Review content for accuracy |
| Verify links, code, CLI commands | Final approval and merge |
| Address PR feedback | Decide which feedback to accept |
| Open PRs | Bump source submodules |
| Review PRs (mechanical checks) | Make structural decisions |

## Agent-friendly documentation

The site is built per the [Agent-Friendly Documentation Spec](https://agentdocsspec.com):

- **`/llms.txt`** — discovery index listing all pages with descriptions
- **`/<path>.md`** — clean markdown endpoint for every page (e.g., `/concepts/canisters.md`)
- **Agent signaling** — hidden element after `<body>` pointing to `/llms.txt`, plus `<link rel="llms">` in `<head>`

These endpoints are generated at build time and updated automatically on every deploy.

## Related resources

| Resource | URL |
|----------|-----|
| ICP CLI docs | https://cli.internetcomputer.org |
| JS SDK docs | https://js.icp.build |
| ICP Skills | https://skills.internetcomputer.org |
| Learn Hub | https://learn.internetcomputer.org |
| Motoko core library | https://mops.one/core/docs |
| Rust CDK API | https://docs.rs/ic-cdk/latest/ic_cdk |

## License

See [LICENSE](LICENSE).
