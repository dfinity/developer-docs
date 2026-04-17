# ICP Developer Docs — Planning Artifacts

This directory contains analysis, design decisions, and workflow references for the ICP developer documentation.

## I'm an agent. What do I do?

1. **Read `AGENTS.md`** (project root) — rules, boundaries, content guidelines
2. **Read `decisions.md`** — understand past structural decisions before proposing new ones
3. **Find your next task** in [GitHub Issues](https://github.com/dfinity/developer-docs/issues) — content pages use the `documentation` label; infra tasks use `enhancement`
4. **Get execution details** — read the stub file itself (has content brief, source material, cross-links in HTML comments), then check `migration-plan.md` for dependencies, effort estimate, and skills needed
5. **Do the work** following `AGENTS.md` rules
6. **Record decisions in `decisions.md`** if you made any structural choices

## Files

### Living documents (check these every session)

| File | What it answers |
|------|-----------------|
| `decisions.md` | "Has this been decided already?" — append-only decision log |
| `migration-plan.md` | "How do I execute this task?" — dependencies, source material, effort, skills per page |

### Agent workflow references

| File | What it answers |
|------|-----------------|
| `content-authoring.md` | "How do I write a page?" — full content workflow, content rules, linking rules, external docs |
| `review-guidelines.md` | "How do I review a PR?" — mechanical checks, content quality checks, post format |

### Context files (read when writing specific pages)

| File | What it answers |
|------|-----------------|
| `synthesis.md` | "Why is the structure this way?" — full structure proposal with rationale |
| `jssdk-skills-mapping.md` | "Which icskills and JS SDK docs are relevant?" — 17 skills + 5 SDK projects |
| `icp-cli-examples-inventory.md` | "Which CLI docs, recipes, templates, examples to reference?" — full ecosystem |
| `developer-journey.md` | "How does this page fit the developer journey?" — Zero-to-Production stages |

## Source repos

All source repos are pinned as git submodules under `.sources/` — see `AGENTS.md` → "Source material repos" for the full mapping and rules.

## Previous work

Branch `restructuring-attempt-1` contains the previous restructuring attempt with:
- Full Astro+Starlight infrastructure
- 124 docs pages (52 Motoko synced + 70 hand-written)
- CI workflows, sync scripts, validation scripts
- `DOCS_RESTRUCTURING_PROPOSAL.md` (v3.1)
