# Content authoring workflow

> **Task coordination:** Follow the "Multi-agent workflow" section in AGENTS.md for claiming tasks, branch creation, and PR submission. The steps below cover the content writing process itself.

When drafting a new docs page:

1. Read the stub page — it contains content brief, source material, and cross-links
2. Read source material from `.sources/`. Stub references use shorthand — resolve them per the mapping in "Source material repos" above (e.g., `Portal: building-apps/foo.mdx` → `.sources/portal/docs/building-apps/foo.mdx`).
   > **If source material is unavailable at the expected path:** (1) search `.sources/portal/` for the content under a different path, (2) if truly unavailable, write from the content brief + icskills + your training knowledge, and add `<!-- Source unavailable: [path] — written from content brief -->` so future contributors know to verify.
3. Read any related icskills skill file from `.sources/icskills/` for accurate canister IDs and code patterns. If delegating writing to a sub-agent, include key details from the skill file in the sub-agent's prompt (sub-agents cannot load skills themselves).
4. Write the content:
   - Follow the content brief in the stub
   - Use icp-cli commands (never dfx)
   - **Verify all CLI commands and flags** against `.sources/icp-cli/docs/reference/cli.md` — never guess command syntax
   - **Verify all code snippets against upstream source** — never write code examples from memory. Adapt from the source material you read in step 2, or grep `.sources/` for the specific function/API you're using. Ensure return types are handled correctly (e.g., unwrap Motoko `?Text` with `switch`/`case`, wrap raw strings with `Principal::from_text` where needed). For recipe versions, check `.sources/icp-cli-recipes` tags.
   - **Safe code adaptation** — when adapting code from `.sources/` into a shorter snippet, preserve all imports, error handling, and type conversions that affect correctness. If you must omit setup code, use `// ...` to indicate elided lines — never silently drop lines. Do not invent variable names or types that aren't in the source. If the source context (test harness, full app) is significantly different from a standalone snippet, note what you changed.
   - **Never invent command output** — if a page shows expected CLI output or canister responses, copy from actual output in `.sources/` (READMEs, test fixtures, example logs). If no actual output exists, write `<!-- TODO: verify output -->` instead of guessing. Do not fabricate canister IDs, cycle counts, error messages, or version strings.
   - **Flag uncertainty** — if after checking `.sources/` you are not confident a code snippet, API behavior, or technical claim is correct, add `<!-- Needs human verification: [reason] -->` as an HTML comment next to the uncertain content. This tells reviewers where to focus. It is always better to flag than to silently guess.
   - **Verify all internal links** — every `[text](path.md)` must point to a file that exists. Run `ls <target-path>` before submitting. If the target page doesn't exist, either link to an existing page that covers the topic, or file a page proposal issue and note the missing link in your PR description. Never link to a path that doesn't exist.
   - **Verify all external URLs** — use the linking rules table in AGENTS.md for known resources. For any URL not in the table (crate docs, npm packages, GitHub repos), verify it is correct. Do not guess or generalize from similar URLs (e.g., `docs.rs/ic-cdk` is NOT the same as `docs.rs/ic-stable-structures`).
   - **Self-consistency check** — before submitting, re-read your frontmatter description and body opening paragraph. They must not contradict each other (e.g., different time estimates, different scope claims).
   - Use plain markdown (never JSX/MDX)
   - Ensure complete frontmatter (see CONTRIBUTING.md)
   - Code examples: <30 lines inline, >30 lines link to `dfinity/examples`
   - Link to external docs per linking rules in AGENTS.md
5. **Sync recommendation:** After reading source material, decide whether this page should be:
   - **Hand-written** — original content, no upstream equivalent
   - **Synced** — upstream repo has authoritative content that should be auto-synced (like Motoko docs)
   - **Upstream-informed** — hand-written but closely tracks an upstream source that should be monitored for changes
   Record your recommendation as an HTML comment at the bottom of the page:
   ```markdown
   <!-- Upstream: hand-written -->
   <!-- Upstream: sync from dfinity/icp-cli docs/guides/canister-migration.md -->
   <!-- Upstream: informed by dfinity/portal docs/building-apps/canister-management/settings.mdx -->
   ```
   Consider syncing when the upstream content is comprehensive, well-maintained, and a close fit. Prefer hand-writing when the page synthesizes multiple sources or serves a different audience than the upstream.
   **This must appear in two places:** (1) as an HTML comment in the page file, and (2) as a "Sync recommendation" section in the PR body (see the PR template in "Submitting" in AGENTS.md). Both are required.
6. **Propose missing pages:** If source material reveals topics that aren't covered by any existing page in the plan (e.g., a canister migration guide in icp-cli with no corresponding docs page), create a GitHub Issue with the `page-proposal` label. Include: what the page would cover, where it would live in the structure, and which upstream source it would draw from. Reference the issue in your PR description. Do not create the page — just flag it for human discussion.
7. Submit: push branch, create PR, update Beads status to `draft` (see "Multi-agent workflow" in AGENTS.md)
8. Review by the relevant team (see `.github/CODEOWNERS` and CONTRIBUTING.md review ownership table)

## Content rules

- **NEVER reference `dfx`** — it is deprecated. Use icp-cli instead.
- **Spelling rules:** "onchain" and "offchain" (no hyphens, ever). Use "icp-cli" in prose (not "the `icp` CLI"); use `icp` only in code blocks for the literal command.
- All docs must have complete frontmatter (see CONTRIBUTING.md for schema)
- Synced content must not be edited directly — edits must go to the source repo
- All code examples must be self-contained and copy-pasteable
- Code examples: <30 lines inline, >30 lines link to `dfinity/examples`
- No `.mdx` files. No JSX. Plain markdown only.
- Use relative paths with `.md` extension for internal links (e.g., `[Quickstart](../getting-started/quickstart.md)`). Never use absolute paths like `/getting-started/quickstart/` — they break on GitHub.
- Max sidebar nesting: 3 levels
- Images go in `src/assets/images/` organized by section (see CONTRIBUTING.md for details)
- When writing a page, decide case-by-case whether portal images are worth carrying over. Keep the existing hand-drawn visual style.
- **Motoko standard library:** Always use `core` (`mops.one/core`), never `base`. The `core` library supersedes `base`. Link to the synced base→core migration guide for developers still on `base`.
- **Diataxis content types** — match content to its section:
  - `concepts/` — Explanations only. Describe *what* and *why*. No CLI commands, no step-by-step procedures. Link to the relevant guide for practical steps.
  - `getting-started/` — Tutorials. Step-by-step with CLI commands. Linear, opinionated, complete.
  - `guides/` — How-to guides. Task-oriented with CLI commands where relevant. May reference concepts for background.
  - `reference/` — Specifications and lookups. Precise, complete, no tutorials.
- **End-of-page navigation:** End every page with a `## Next steps` section linking to related pages. Always use the heading "Next steps" — never "What's next" or other variants.

## Linking rules

| Content type | Link to |
|-------------|---------|
| CLI commands | https://cli.internetcomputer.org/ |
| Motoko standard library | https://mops.one/core/docs (core supersedes base) |
| Rust CDK API (`ic-cdk`) | https://docs.rs/ic-cdk/latest/ic_cdk/ |
| Rust stable structures (`ic-stable-structures`) | https://docs.rs/ic-stable-structures/latest/ic_stable_structures/ |
| Rust Candid (`candid`) | https://docs.rs/candid/latest/candid/ |
| JS SDK | https://js.icp.build |
| Protocol internals | https://learn.internetcomputer.org |
| Agent skill files | https://skills.internetcomputer.org |

> **Important:** Each Rust crate has its own `docs.rs` URL. Do NOT substitute one crate URL for another — `docs.rs/ic-cdk` is NOT the same as `docs.rs/ic-stable-structures`. If you need to link a crate not in this table, construct the URL as `https://docs.rs/<crate-name>/latest/<crate_name>/` (note: hyphens in crate name become underscores in the path).

## External docs (don't duplicate these)

| Resource | URL |
|----------|-----|
| icp-cli | https://cli.internetcomputer.org/ |
| JS SDK | https://js.icp.build |
| icskills | https://skills.internetcomputer.org |
| Learn Hub | https://learn.internetcomputer.org |
| Motoko core library | https://mops.one/core/docs (supersedes base; migration guide is synced from Motoko repo) |
| Rust CDK API (`ic-cdk`) | https://docs.rs/ic-cdk/latest/ic_cdk/ |
| Rust stable structures (`ic-stable-structures`) | https://docs.rs/ic-stable-structures/latest/ic_stable_structures/ |
