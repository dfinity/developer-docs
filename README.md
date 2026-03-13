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

### Common commands to give an agent

| What you want | What to tell the agent |
|---------------|----------------------|
| Check for PR feedback | "Check open PRs for unaddressed feedback" |
| Write a new page | "Pick up the next ready task and write it" |
| Fix a specific PR | "Address the feedback on PR #4" |
| Rebase a PR | "Rebase PR #3 on main" |
| Review a PR | "Review PR #5" |
| See what's ready | "Run `bd ready` and show me the options" |

Agent reviews check links, code snippets, CLI commands, frontmatter, content brief coverage, and technical accuracy against `.sources/`. See [AGENTS.md](AGENTS.md) for the full review checklist. Agent reviews complement but don't replace human review — use them to catch mechanical issues and surface potential inaccuracies before you read through the content yourself.

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

See [AGENTS.md](AGENTS.md) for the full workflow: orientation, rules, content authoring, and planning artifacts. `CLAUDE.md` symlinks to `AGENTS.md`.

## Related resources

| Resource | URL |
|----------|-----|
| icp-cli docs | https://dfinity.github.io/icp-cli/ |
| JS SDK docs | https://js.icp.build |
| icskills | https://skills.internetcomputer.org |
| Learn Hub | https://learn.internetcomputer.org |
| Motoko libraries | https://mops.one/core/docs |
| Rust CDK API | https://docs.rs/ic-cdk/latest/ic_cdk/ |

## License

See [LICENSE](LICENSE).
