# PR review guidelines

**Only review PRs when explicitly asked by a human.** Agents must never offer, suggest, or perform PR reviews on their own initiative. Reviews are a developer decision. The agent's focus is: (1) manage tasks, (2) create content PRs, (3) fix content based on existing reviews/comments.

When asked to review a PR, load the `technical-documentation` skill and the relevant icskill for the page topic first.

**When delegating to sub-agents:** Worktree agents have full access to skills and `.sources/` after running `git submodule update --init --depth 1` (see "Submodule initialization in worktrees" in CLAUDE.md). The parent agent must include this command as a mandatory first step in every worktree agent's prompt. Once submodules are initialized, agents can load skills and verify code against `.sources/` directly.

## Initial review (first time reviewing a page)

*Mechanical checks:*
1. **Internal links** — `ls` every `[text](path.md)` target. Flag any that don't resolve to an existing file.
2. **External URLs** — verify against the linking rules table in AGENTS.md. Flag any guessed or wrong URLs (especially `docs.rs` crate links).
3. **CLI commands** — verify all `icp` commands and flags against `.sources/icp-cli/docs/reference/cli.md`.
4. **Frontmatter** — complete and consistent with the body (no contradictions in descriptions, time estimates, scope).
5. **Content rules compliance** — no `dfx` references, no `.mdx`/JSX, code examples <30 lines inline, relative links with `.md` extension, `core` not `base` for Motoko, Diataxis content type respected.
6. **Code snippet verification** — for every code example, verify function names, import paths, and return type handling against `.sources/`. Search efficiently: start with the most likely submodule (JS → `icp-js-sdk-docs/` or `examples/`, Rust/Motoko → `icp-cli-templates/` or `examples/`, CLI → `icp-cli/docs/`), then broaden only if the function isn't found. Flag snippets that leave the reader with an unusable intermediate value (e.g., unhandled optionals, raw strings where a `Principal` is needed). For recipe versions, check `.sources/icp-cli-recipes` tags.
7. **Verification flags** — search the page for `<!-- TODO: verify output -->` and `<!-- Needs human verification:` comments. These are not failures — they are signals that the author flagged uncertainty. Ensure each flag has a clear reason. If you can resolve the uncertainty from `.sources/`, do so and remove the flag. Otherwise, call it out in the review so a human reviewer addresses it.

*Content quality checks (the unique value of review — mechanical checks above are a safety net for authoring, but these assess things the writing agent can't self-check):*
8. **Reader test** — read the page title, then the first two paragraphs. Does the opening deliver on the title's promise? Does it assume the reader came from a specific page or completed prior steps? (Pages must stand on their own — link to prerequisites, don't assume them.) Would a developer scanning search results keep reading, or bounce? Flag pages that open with background or history instead of what the reader came for.
9. **Funnel check** — does the page follow: orient (what is this, who is it for) → explain/instruct → what's next? Flag pages that bury the lede, put prerequisites after the main content, or end without a clear next step.
10. **Scanability** — can a developer skimming headings and bold text get the gist without reading every paragraph? Flag walls of text, headings that don't differentiate (e.g., "Overview" → "Details" → "More Details"), and important information buried mid-paragraph.
11. **Content brief coverage** — read the stub's `<!-- Content Brief -->` and `<!-- Source Material -->` comments. Does the page address every point in the brief? Was the source material actually consulted? Flag significant gaps or divergences.
12. **Accuracy** — cross-check technical claims (memory limits, latency numbers, API behavior) against `.sources/` material. Search across ALL relevant submodules, not just one. Flag anything that looks wrong or outdated.
13. **Developer empathy** — does the page anticipate what a developer would actually struggle with? Flag pages that explain obvious things at length while glossing over the hard parts. For concept pages: does it answer "why should I care?" For guides: does it handle the error cases a developer will actually hit?

*Post using this format:*

```markdown
## Review: <page title>

### Must fix
- **<issue>**: <description and suggested fix>

### Suggestions
- **<issue>**: <description>

### Verified
- <what checked out> (e.g., "All CLI commands verified against .sources/icp-cli/docs/reference/cli.md")
```

Omit any section that has no items. Every initial review must include the "Verified" section to show what was actually checked.

## Follow-up review (after feedback was addressed)

Only run this when reviewing a PR that already had an initial review. Do NOT re-run the full checklist.

1. Read the previous review comment(s) to understand what was requested.
2. Verify each requested change was made correctly.
3. Check that fixes didn't introduce new issues (e.g., dangling links from removed sections, broken frontmatter from removed fields).
4. Skip re-verifying items that were already signed off in the initial review, unless the fix directly touches them.

*Post using this format:*

```markdown
## Follow-up review: <page title>

### Fixed
- <what was fixed and confirmed correct>

### Still needs work
- <what wasn't addressed or was addressed incorrectly>
```

Omit "Still needs work" if everything looks good.
