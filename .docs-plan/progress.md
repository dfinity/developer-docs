# Progress Tracker

Two tables: **project-level** (infrastructure, research, tooling) and **content** (80 content pages in priority order, plus the landing page, 1 synced page, and 4 section index pages).

Pick the highest row with status `stub` or `pending`. For execution details (dependencies, source material, effort), see `migration-plan.md`.

## Status key

- `pending` — Not started (infrastructure/tooling tasks)
- `stub` — Stub page exists with frontmatter + content brief
- `in-progress` — Being worked on (add your name)
- `draft` — Content written, not yet reviewed
- `review` — Under review by relevant team
- `done` — Published and verified

---

## Project-level tasks

| Priority | Task | Status | Agent/Author | Date | Notes |
|----------|------|--------|-------------|------|-------|
| done | Portal deep dive (346 files triaged) | done | agent | 2026-03-11 | `.docs-plan/portal-deep-dive.md` |
| done | JS SDK + icskills mapping | done | agent | 2026-03-11 | `.docs-plan/jssdk-skills-mapping.md` |
| done | icp-cli + examples inventory | done | agent | 2026-03-11 | `.docs-plan/icp-cli-examples-inventory.md` |
| done | Developer journey mapping | done | agent | 2026-03-11 | `.docs-plan/developer-journey.md` |
| done | Learn Hub inventory (86 articles) | done | agent | 2026-03-11 | `.docs-plan/learn-hub-inventory.md` |
| done | Structure synthesis (79 pages) | done | agent | 2026-03-11 | `.docs-plan/synthesis.md` |
| done | Migration plan (10 sprints) | done | agent | 2026-03-11 | `.docs-plan/migration-plan.md` |
| done | 79 stub pages created | done | agent | 2026-03-11 | All in `docs/` |
| done | Landing page written | done | agent | 2026-03-11 | `docs/index.md` |
| done | Sidebar config updated | done | agent | 2026-03-11 | `astro.config.mjs` |
| done | Stubs updated with Learn Hub URLs | done | agent | 2026-03-11 | 25 files updated |
| done | AGENTS.md consolidated | done | agent | 2026-03-11 | CLAUDE.md symlinks here |
| done | CONTRIBUTING.md updated | done | agent | 2026-03-11 | |
| done | CODEOWNERS updated | done | agent | 2026-03-11 | |
| done | package.json cleaned | done | agent | 2026-03-11 | Broken scripts removed |
| done | Design decisions recorded | done | agent | 2026-03-11 | 12 entries |
| done | Section index pages created | done | agent | 2026-03-11 | guides/, concepts/, languages/, reference/ — landing page links updated |
| P0 | Restore validation scripts | pending | | | From `restructuring-attempt-1`: frontmatter, no-dfx, no-mdx |
| P0 | Restore sync scripts | pending | | | Motoko sync, icp-cli version sync |
| P1 | Set up CI workflows | pending | | | From `restructuring-attempt-1` |
| P1 | Restore build generators | pending | | | llms.txt, manifest generation |
| P1 | Custom styling / theming | pending | | | Starlight default; styling TBD |

---

## Content pages (in priority order)

Pages are listed in execution order from `migration-plan.md`. Work top-to-bottom. Check `migration-plan.md` for dependencies and source material before starting a page.

### P0 — Sprint 1: Foundation

**Execution order:** Layer 0 concepts first (can parallelize all 3), then Layer 1-2 getting-started pages.

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 1 | — | index.md | done | agent | 2026-03-11 |
| 2 | 0 | concepts/canisters.md | stub | | |
| 3 | 0 | concepts/network-overview.md | stub | | |
| 4 | 1 | concepts/app-architecture.md | stub | | |
| 5 | 1 | getting-started/quickstart.md | stub | | |
| 6 | 2 | getting-started/project-structure.md | stub | | |
| 7 | 2 | getting-started/what-next.md | stub | | |

### P0 — Sprint 2: Core Backend Development

**Execution order:** Layer 0 (chain-key-crypto), then Layer 1 concepts + guides in parallel, then Layer 2 pages.

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 8 | 0 | concepts/chain-key-cryptography.md | stub | | |
| 9 | 1 | concepts/orthogonal-persistence.md | stub | | |
| 10 | 1 | concepts/https-outcalls.md | stub | | |
| 11 | 1 | concepts/reverse-gas-model.md | stub | | |
| 12 | 1 | concepts/chain-fusion.md | stub | | |
| 13 | 1 | guides/canister-calls/candid.md | stub | | |
| 14 | 1 | guides/backends/https-outcalls.md | stub | | |
| 15 | 1 | guides/backends/timers.md | stub | | |
| 16 | 2 | guides/backends/data-persistence.md | stub | | |
| 17 | 2 | guides/canister-calls/onchain-calls.md | stub | | |

### P0 — Sprint 3: Frontend, Auth, Production

**Execution order:** Layer 1 security pages first, then Layer 2-5 progressively.

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 18 | 1 | concepts/security.md | stub | | |
| 19 | 1 | guides/security/access-management.md | stub | | |
| 20 | 2 | guides/frontends/asset-canister.md | stub | | |
| 21 | 3 | guides/authentication/internet-identity.md | stub | | |
| 22 | 3 | guides/canister-management/lifecycle.md | stub | | |
| 23 | 4 | guides/canister-management/settings.md | stub | | |
| 24 | 4 | guides/canister-management/reproducible-builds.md | stub | | |
| 25 | 4 | guides/testing/strategies.md | stub | | |
| 26 | 4 | guides/security/canister-upgrades.md | stub | | |
| 27 | 5 | guides/testing/pocket-ic.md | stub | | |
| 28 | 5 | guides/canister-management/cycles-management.md | stub | | |

### P0 — Sprint 4: Chain Fusion, DeFi, Key Reference

**Execution order:** Chain fusion guides (Layer 2) + independent reference pages can all run in parallel.

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 29 | 2 | guides/chain-fusion/bitcoin.md | stub | | |
| 30 | 2 | guides/chain-fusion/ethereum.md | stub | | |
| 31 | 3 | guides/defi/token-ledgers.md | stub | | |
| 32 | — | guides/tools/migrating-from-dfx.md | stub | | |
| 33 | — | languages/motoko/index.md | stub | | |
| 34 | 1 | languages/rust/index.md | stub | | |
| 35 | 1 | reference/management-canister.md | stub | | |
| 36 | — | reference/token-standards.md | stub | | |
| 37 | — | reference/cycles-costs.md | stub | | |

### P1 — Sprint 5: Backend and Canister Guides

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 38b | 1 | guides/backends/onchain-ai.md | stub | | |
| 39 | 1 | guides/backends/randomness.md | stub | | |
| 40 | 2 | guides/backends/certified-variables.md | stub | | |
| 41 | 4 | guides/canister-management/logs.md | stub | | |
| 42 | 4 | guides/canister-management/optimization.md | stub | | |
| 43 | 4 | guides/canister-management/snapshots.md | stub | | |
| 44 | 3 | guides/frontends/custom-domains.md | stub | | |
| 45 | 3+ | guides/frontends/certification.md | stub | | |
| 46 | 4 | guides/authentication/wallet-integration.md | stub | | |

### P1 — Sprint 6: Canister Calls, Production, Security

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 47 | 2 | guides/canister-calls/binding-generation.md | stub | | |
| 47b | 3 | guides/canister-calls/offchain-calls.md | stub | | |
| 48 | 5+ | guides/canister-management/subnet-selection.md | stub | | |
| 49 | 2 | guides/security/data-integrity.md | stub | | |
| 50 | 2 | guides/security/dos-prevention.md | stub | | |
| 51 | 3 | guides/security/inter-canister-calls.md | stub | | |
| 52 | 3+ | guides/security/encryption.md | stub | | |
| 53 | 4 | guides/authentication/verifiable-credentials.md | stub | | |
| 54 | — | guides/tools/overview.md | stub | | |
| 54b | 2 | guides/tools/agentic-development.md | stub | | |
| 55 | 4+ | guides/defi/chain-key-tokens.md | stub | | |

### P1 — Sprint 7: Governance, Concepts, Languages

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 56 | 2+ | guides/governance/launching.md | stub | | |
| 57 | 3+ | guides/governance/managing.md | stub | | |
| 58 | 3+ | guides/governance/testing.md | stub | | |
| 59 | 2 | concepts/vetkeys.md | stub | | |
| 60 | — | concepts/onchain-randomness.md | stub | | |
| 61 | — | concepts/timers.md | stub | | |
| 62 | — | concepts/governance.md | stub | | |
| 63 | 2 | languages/rust/stable-structures.md | stub | | |

### P1 — Sprint 8: Reference Pages

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 64 | — | reference/system-canisters.md | stub | | |
| 65 | — | reference/protocol-canisters.md | stub | | |
| 66 | — | reference/subnet-types.md | stub | | |
| 67 | — | reference/execution-errors.md | stub | | |
| 68 | — | reference/ic-interface-spec.md | stub | | |
| 69 | — | reference/candid-spec.md | stub | | |
| 70 | all | reference/glossary.md | stub | | |

### P2 — Sprint 9: Advanced Guides

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 71 | 4 | guides/canister-management/large-wasm.md | stub | | |
| 72 | 3 | guides/canister-calls/parallel-calls.md | stub | | |
| 73 | 3 | guides/frontends/frameworks.md | stub | | |
| 74 | 2 | guides/chain-fusion/solana.md | stub | | |
| 75 | 2 | guides/chain-fusion/dogecoin.md | stub | | |
| 76 | 4 | guides/defi/rosetta.md | stub | | |

### P2 — Sprint 10: Remaining Reference and Languages

| # | Layer | Page | Status | Agent/Author | Date |
|---|-------|------|--------|-------------|------|
| 78 | — | reference/application-canisters.md | stub | | |
| 79 | — | reference/http-gateway-spec.md | stub | | |
| 80 | — | reference/internet-identity-spec.md | stub | | |
| 81 | 5 | languages/rust/testing.md | stub | | |
