# Content authoring workflow

> **Task coordination:** Follow the "Multi-agent workflow" section in AGENTS.md for claiming tasks, branch creation, and PR submission. The steps below cover the content writing process itself.

When drafting a new docs page:

1. Read the stub page — it contains content brief, source material, and cross-links
2. Read source material from `.sources/`. Resolve paths using the "Source material repos" table in AGENTS.md.
   > **If source material is unavailable at the expected path:** write from the content brief + icskills + your training knowledge, and add `<!-- Source unavailable: [path] — written from content brief -->` so future contributors know to verify.
3. Read any related icskills skill file from `.sources/icskills/` for accurate canister IDs and code patterns.
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
   - Use `.md` by default. Use `.mdx` only when the page needs interactive components like `<Tabs syncKey="lang">`. In `.mdx` files, use `{/* */}` for comments instead of `<!-- -->`.
   - **Stub → `.mdx` rename:** All stubs are `.md` files. If your page needs tabs (e.g., Motoko/Rust examples in the same section), rename the stub from `.md` to `.mdx`, delete the old `.md` file, add `import { Tabs, TabItem } from '@astrojs/starlight/components';` after the frontmatter, and convert any `<!-- -->` comments to `{/* */}`. Internal links pointing to `<page>.md` do not need updating — Astro resolves both extensions.
   - Ensure complete frontmatter (see CONTRIBUTING.md)
   - **Code examples — check for snippet pipeline first:** Before writing inline code, check whether the example exists in `.sources/examples` with `#region` markers:
     ```bash
     grep -r "#region" .sources/examples/<lang>/<example>/
     ```
     - **Region markers found** → use `<CodeExample>` (requires `.mdx`):
       ```mdx
       import CodeExample from '../../../src/components/CodeExample.astro';

       <CodeExample example="my_example" lang="rust">
       ```rust snippet="my_example/src/my_example_backend/src/lib.rs#my_region"
       ```
       </CodeExample>
       ```
       Paths in `snippet=` are relative to `.sources/examples/<lang>/`. A missing region is a build error — verify it exists before using it.
     - **No markers found** → inline if <30 lines; link to `dfinity/examples` on GitHub if longer. Note in the PR description: "used inline code for X — no `#region` markers in `.sources/examples` yet."
     - **Example exists but lacks markers for the function you need** → use inline/link as fallback, and comment on [#44](https://github.com/dfinity/developer-docs/issues/44) with the specific file and region name needed. This is the one case worth flagging on #44 — it's a concrete, actionable gap.
   - Link to external docs per linking rules in `content-authoring.md`
5. **Sync recommendation:** After reading source material, decide whether this page should be:
   - **Hand-written** — original content, no upstream equivalent
   - **Synced** — upstream repo has authoritative content that should be auto-synced (like Motoko docs)
   - **Upstream-informed** — hand-written but closely tracks an upstream source that should be monitored for changes
   Record your recommendation as a comment at the bottom of the page. Use `<!-- -->` in `.md` files and `{/* */}` in `.mdx` files:
   ```markdown
   <!-- Upstream: hand-written -->
   <!-- Upstream: sync from dfinity/icp-cli docs/guides/canister-migration.md -->
   <!-- Upstream: informed by dfinity/portal docs/building-apps/canister-management/settings.mdx -->
   ```
   In `.mdx` files, use JSX comment syntax instead:
   ```mdx
   {/* Upstream: hand-written */}
   {/* Upstream: informed by dfinity/portal — ...; dfinity/icskills — ... */}
   ```
   Consider syncing when the upstream content is comprehensive, well-maintained, and a close fit. Prefer hand-writing when the page synthesizes multiple sources or serves a different audience than the upstream.
   **This must appear in two places:** (1) as a comment in the page file, and (2) as a "Sync recommendation" section in the PR body (see the PR template in "Submitting" in AGENTS.md). Both are required.
6. **Propose missing pages:** If source material reveals topics that aren't covered by any existing page in the plan (e.g., a canister migration guide in icp-cli with no corresponding docs page), create a GitHub Issue with the `page-proposal` label. Include: what the page would cover, where it would live in the structure, and which upstream source it would draw from. Reference the issue in your PR description. Do not create the page — just flag it for human discussion.
7. Submit: push branch, create PR (see "Submitting" in AGENTS.md)
8. Review by the relevant team (see `.github/CODEOWNERS` and CONTRIBUTING.md review ownership table)

## Content rules

- **Spelling:** "onchain" and "offchain" (no hyphens). Use "icp-cli" in prose; use `icp` only in code blocks for the literal command.
- **Always use `.md` extension in internal links**, even when linking to a `.mdx` file (e.g., `[Canister lifecycle](lifecycle.md)`). Use relative paths. Never absolute paths like `/getting-started/quickstart/` — they break on GitHub.
- Images go in `src/assets/images/` organized by section (see CONTRIBUTING.md). Carry over portal images case-by-case; keep the hand-drawn visual style.
- **No headings inside `<TabItem>` blocks** — they always appear in the TOC regardless of which tab is active. Use **bold text** instead of `###` for sub-labels inside tabs.
- **Motoko standard library:** Always use `core` (`mops.one/core`), never `base`. Link to the synced base→core migration guide for developers still on `base`.
- **Diataxis content types** — match content to its section:
  - `concepts/` — Explanations only. Describe *what* and *why*. No CLI commands, no step-by-step procedures.
  - `getting-started/` — Tutorials. Step-by-step with CLI commands. Linear, opinionated, complete.
  - `guides/` — How-to guides. Task-oriented with CLI commands where relevant.
  - `reference/` — Specifications and lookups. Precise, complete, no tutorials.
- **End-of-page navigation:** End every page with a `## Next steps` section. Always use "Next steps" — never "What's next" or other variants.

## Linking rules (do not duplicate — link instead)

| Resource | URL | Notes |
|----------|-----|-------|
| CLI commands | https://cli.internetcomputer.org/ | |
| Motoko core library | https://mops.one/core/docs | supersedes `base`; migration guide synced from Motoko repo |
| Rust CDK (`ic-cdk`) | https://docs.rs/ic-cdk/latest/ic_cdk/ | |
| Rust stable structures | https://docs.rs/ic-stable-structures/latest/ic_stable_structures/ | |
| Rust Candid | https://docs.rs/candid/latest/candid/ | |
| JS SDK | https://js.icp.build | |
| Protocol internals / Learn Hub | https://learn.internetcomputer.org | |
| Agent skill files | https://skills.internetcomputer.org | |

> **Rust crate URLs:** Each crate has its own URL — do not substitute. For crates not in this table, use `https://docs.rs/<crate-name>/latest/<crate_name>/` (hyphens → underscores in the path).
