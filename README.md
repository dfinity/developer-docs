# ICP Developer Docs

> **Work in progress.** This is a complete rewrite of the ICP developer documentation. All pages are currently stubs with content briefs — actual content is being written following the plan in `.docs-plan/`. The existing production docs live at [internetcomputer.org/docs](https://internetcomputer.org/docs) (source: [dfinity/portal](https://github.com/dfinity/portal)).

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
.docs-plan/             # Planning artifacts and progress tracking
AGENTS.md               # Agent and contributor instructions
CONTRIBUTING.md         # Contribution guidelines
```

Documentation lives in `docs/` at the project root. Astro reads it via a symlink at `src/content/docs/`.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for content format, frontmatter schema, and review ownership.

## Working with agents

> **Migration-era workflow.** This agent-assisted setup is designed for the docs migration from [dfinity/portal](https://github.com/dfinity/portal). The tooling (Beads task coordination, source submodules, agent instructions) will be simplified or removed once the migration is complete.

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
Developer: "pick up new work"
    │
    ├─ Agent claims a task from Beads
    ├─ Reads source material from .sources/
    ├─ Writes content, verifies links and code
    ├─ Builds, pushes, opens PR
    └─ Developer reviews and merges
```

### Things you can ask an agent to do

- Check open PRs for unaddressed feedback
- Write the next available page
- Address feedback on a specific PR
- Review a PR (checks links, code, CLI commands, technical accuracy against `.sources/`)
- Rebase a PR on main

Agent reviews complement but don't replace human review — use them to catch mechanical issues before you review the content yourself.

### Task coordination (Beads)

Tasks are tracked with [Beads](https://github.com/steveyegge/beads) (`bd`). Useful commands:

```bash
bd list                # all tasks
bd list --status open  # available work
bd ready               # unblocked tasks (dependencies met)
bd show <id>           # task details
```

**Merging PRs:** Always use **squash and merge** (enforced in repo settings). This keeps `main` history clean — one commit per page. Branches are auto-deleted after merge. Agents automatically close the corresponding Beads task during their next session. You can also tell an active agent to close merged tasks immediately, or do it manually: `bd update <id> --status closed && bd dolt push`.

### What agents handle vs. what developers handle

| Agents | Developers |
|--------|-----------|
| Draft content from source material | Review content for accuracy |
| Review PRs (links, code, technical claims) | Final approval and merge |
| Fix PR feedback after confirmation | Decide which feedback to accept |
| Verify links, code snippets, CLI commands | Bump source submodules |
| Track task state in Beads | Make structural decisions |
| Open PRs | |

### Setup

```bash
./scripts/setup.sh    # submodules, deps, Beads, build check
```

Then open Claude Code (or your preferred agent tool) in the repo root. The agent reads `AGENTS.md` automatically.

## For AI agents

The site is built to be agent-friendly per the [Agent-Friendly Documentation Spec](https://agentdocsspec.com):

- **`/llms.txt`** — discovery index listing all pages with descriptions
- **`/<path>.md`** — clean markdown endpoint for every page (e.g., `/concepts/canisters.md`)
- **Agent signaling** — every HTML page includes a `<link rel="help">` in `<head>` pointing to `/llms.txt`

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
