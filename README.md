# ICP Developer Docs

> **Work in progress.** This is a complete rewrite of the ICP developer documentation. Most pages are content-complete; a small number remain as stubs. The existing production docs live at [internetcomputer.org/docs](https://internetcomputer.org/docs) (source: [dfinity/portal](https://github.com/dfinity/portal)).

**Live preview:** [beta-docs.internetcomputer.org](https://beta-docs.internetcomputer.org) — deployed automatically on every push to `main`.

Developer documentation for the [Internet Computer](https://internetcomputer.org), built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## Quick start

```bash
npm install
npm run dev      # Dev server at localhost:4321
npm run build    # Production build
```

## Project layout

```
docs/                   # All documentation (.md only)
├── getting-started/    # Tutorials
├── guides/             # How-to guides
├── concepts/           # Explanations
├── languages/          # Motoko (synced) + Rust
└── reference/          # Specs and reference
.sources/               # Pinned upstream repos (read-only source material for agents)
├── VERSIONS            # Current pinned release versions for versioned submodules
└── ...                 # portal, icp-cli, motoko, cdk-rs, icskills, examples, ...
.docs-plan/             # Planning artifacts and progress tracking
AGENTS.md               # Agent and contributor instructions
CONTRIBUTING.md         # Contribution guidelines
```

Documentation lives in `docs/` at the project root. Astro reads it via a symlink at `src/content/docs/`.

`.sources/` contains pinned git submodules that agents use as ground truth when writing and verifying content — CLI references, API signatures, skill files, code examples. **Do not edit files in `.sources/` directly.** See `.sources/VERSIONS` for current pinned release versions and `AGENTS.md` for the bump procedure.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for content format, frontmatter schema, and review ownership.

## Working with agents

This project uses AI agents (Claude Code, Codex, etc.) to write documentation pages. Agents follow the workflow in [AGENTS.md](AGENTS.md). Human developers direct agents and review their output.

### Workflow at a glance

```
Developer: "check for PR feedback"
    │
    ├─ Agent reads all comments (human + Copilot)
    ├─ Agent evaluates each item, presents summary
    ├─ Developer confirms which fixes to make
    └─ Agent applies fixes, pushes, comments on PR
```

```
Developer: "write the vetkeys page"
    │
    ├─ Agent picks up GitHub Issue, checks out a branch
    ├─ Reads source material from .sources/
    ├─ Writes content, verifies links and code
    ├─ Builds, pushes, opens PR
    └─ Developer reviews and merges
```

### Things you can ask an agent to do

- Check open PRs for unaddressed feedback
- Write a specific page (link to the GitHub Issue)
- Address feedback on a specific PR
- Review a PR (checks links, code, CLI commands, technical accuracy against `.sources/`)
- Rebase a PR on main

Agent reviews complement but don't replace human review — use them to catch mechanical issues before you review the content yourself.

### Task coordination

Open tasks are tracked as [GitHub Issues](https://github.com/dfinity/developer-docs/issues). Content pages use the `documentation` label; infra tasks use `enhancement`.

**Merging PRs:** Use **squash and merge** (keeps `main` history clean — one commit per page). Branches are auto-deleted after merge.

### What agents handle vs. what developers handle

| Agents | Developers |
|--------|-----------|
| Draft content from source material | Review content for accuracy |
| Review PRs (links, code, technical claims) | Final approval and merge |
| Fix PR feedback | Decide which feedback to accept |
| Verify links, code snippets, CLI commands | Bump source submodules |
| Open PRs | Make structural decisions |

### Setup

```bash
./scripts/setup.sh    # submodules + npm install
```

Then open Claude Code (or your preferred agent tool) in the repo root. The agent reads `AGENTS.md` automatically.

## For AI agents

The site is built to be agent-friendly per the [Agent-Friendly Documentation Spec](https://agentdocsspec.com):

- **`/llms.txt`** — discovery index listing all pages with descriptions
- **`/<path>.md`** — clean markdown endpoint for every page (e.g., `/concepts/canisters.md`)
- **Agent signaling** — hidden blockquote after `<body>` pointing to `/llms.txt` (per agentdocsspec), plus `<link rel="llms">` in `<head>`

See [AGENTS.md](AGENTS.md) for the full workflow: orientation, rules, content authoring, and planning artifacts. `CLAUDE.md` symlinks to `AGENTS.md`.

## Related resources

| Resource | URL |
|----------|-----|
| icp-cli docs | https://cli.internetcomputer.org/ |
| JS SDK docs | https://js.icp.build |
| icskills | https://skills.internetcomputer.org |
| Learn Hub | https://learn.internetcomputer.org |
| Motoko libraries | https://mops.one/core/docs |
| Rust CDK API | https://docs.rs/ic-cdk/latest/ic_cdk/ |

## License

See [LICENSE](LICENSE).
