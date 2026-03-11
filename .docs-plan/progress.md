# Progress Tracker

Two tables: **project-level** (infrastructure, research, tooling) and **content** (all 81 pages in priority order).

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
| P0 | Restore validation scripts | pending | | | From `restructuring-attempt-1`: frontmatter, no-dfx, no-mdx |
| P0 | Restore sync scripts | pending | | | Motoko sync, icp-cli version sync |
| P1 | Set up CI workflows | pending | | | From `restructuring-attempt-1` |
| P1 | Restore build generators | pending | | | llms.txt, manifest generation |
| P1 | Custom styling / theming | pending | | | Starlight default; styling TBD |

---

## Content pages (in priority order)

Pages are listed in execution order from `migration-plan.md`. Work top-to-bottom. Check `migration-plan.md` for dependencies and source material before starting a page.

### P0 — Sprint 1: Foundation

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 1 | index.md | done | agent | 2026-03-11 |
| 2 | getting-started/quickstart.md | stub | | |
| 3 | getting-started/project-structure.md | stub | | |
| 4 | getting-started/agentic-development.md | stub | | |
| 5 | getting-started/what-next.md | stub | | |
| 6 | concepts/canisters.md | stub | | |
| 7 | concepts/network-overview.md | stub | | |
| 8 | concepts/app-architecture.md | stub | | |

### P0 — Sprint 2: Core Backend Development

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 9 | guides/backends/data-persistence.md | stub | | |
| 10 | guides/backends/https-outcalls.md | stub | | |
| 11 | guides/backends/timers.md | stub | | |
| 12 | guides/inter-canister/calls.md | stub | | |
| 13 | guides/inter-canister/candid.md | stub | | |
| 14 | concepts/https-outcalls.md | stub | | |
| 15 | concepts/reverse-gas-model.md | stub | | |
| 16 | concepts/orthogonal-persistence.md | stub | | |
| 17 | concepts/chain-key-cryptography.md | stub | | |
| 18 | concepts/chain-fusion.md | stub | | |

### P0 — Sprint 3: Frontend, Auth, Production

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 19 | guides/frontends/asset-canister.md | stub | | |
| 20 | guides/authentication/internet-identity.md | stub | | |
| 21 | guides/canisters/lifecycle.md | stub | | |
| 22 | guides/canisters/settings.md | stub | | |
| 23 | guides/canisters/reproducible-builds.md | stub | | |
| 24 | guides/testing/strategies.md | stub | | |
| 25 | guides/testing/pocket-ic.md | stub | | |
| 26 | guides/production/cycles-management.md | stub | | |
| 27 | guides/security/access-management.md | stub | | |
| 28 | guides/security/canister-upgrades.md | stub | | |
| 29 | concepts/security.md | stub | | |

### P0 — Sprint 4: Chain Fusion, DeFi, Key Reference

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 30 | guides/chain-fusion/bitcoin.md | stub | | |
| 31 | guides/chain-fusion/ethereum.md | stub | | |
| 32 | guides/defi/token-ledgers.md | stub | | |
| 33 | guides/tools/migrating-from-dfx.md | stub | | |
| 34 | languages/motoko/index.md | stub | | |
| 35 | languages/rust/index.md | stub | | |
| 36 | reference/management-canister.md | stub | | |
| 37 | reference/token-standards.md | stub | | |
| 38 | reference/cycles-costs.md | stub | | |

### P1 — Sprint 5: Backend and Canister Guides

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 39 | guides/backends/randomness.md | stub | | |
| 40 | guides/backends/certified-variables.md | stub | | |
| 41 | guides/canisters/logs.md | stub | | |
| 42 | guides/canisters/optimization.md | stub | | |
| 43 | guides/canisters/snapshots.md | stub | | |
| 44 | guides/frontends/custom-domains.md | stub | | |
| 45 | guides/frontends/certification.md | stub | | |
| 46 | guides/authentication/wallet-integration.md | stub | | |

### P1 — Sprint 6: Inter-Canister, Production, Security

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 47 | guides/inter-canister/binding-generation.md | stub | | |
| 48 | guides/production/subnet-types.md | stub | | |
| 49 | guides/security/data-integrity.md | stub | | |
| 50 | guides/security/dos-prevention.md | stub | | |
| 51 | guides/security/inter-canister-calls.md | stub | | |
| 52 | guides/security/encryption.md | stub | | |
| 53 | guides/authentication/verifiable-credentials.md | stub | | |
| 54 | guides/tools/overview.md | stub | | |
| 55 | guides/defi/chain-key-tokens.md | stub | | |

### P1 — Sprint 7: Governance, Concepts, Languages

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 56 | guides/governance/launching.md | stub | | |
| 57 | guides/governance/managing.md | stub | | |
| 58 | guides/governance/testing.md | stub | | |
| 59 | concepts/vetkeys.md | stub | | |
| 60 | concepts/onchain-randomness.md | stub | | |
| 61 | concepts/timers.md | stub | | |
| 62 | concepts/governance.md | stub | | |
| 63 | languages/rust/stable-structures.md | stub | | |

### P1 — Sprint 8: Reference Pages

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 64 | reference/system-canisters.md | stub | | |
| 65 | reference/protocol-canisters.md | stub | | |
| 66 | reference/subnet-types.md | stub | | |
| 67 | reference/execution-errors.md | stub | | |
| 68 | reference/ic-interface-spec.md | stub | | |
| 69 | reference/candid-spec.md | stub | | |
| 70 | reference/glossary.md | stub | | |

### P2 — Sprint 9: Advanced Guides

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 71 | guides/backends/large-wasm.md | stub | | |
| 72 | guides/backends/parallel-calls.md | stub | | |
| 73 | guides/frontends/frameworks.md | stub | | |
| 74 | guides/chain-fusion/solana.md | stub | | |
| 75 | guides/chain-fusion/dogecoin.md | stub | | |
| 76 | guides/defi/rosetta.md | stub | | |
| 77 | guides/production/canister-discovery.md | stub | | |

### P2 — Sprint 10: Remaining Reference and Languages

| # | Page | Status | Agent/Author | Date |
|---|------|--------|-------------|------|
| 78 | reference/application-canisters.md | stub | | |
| 79 | reference/http-gateway-spec.md | stub | | |
| 80 | reference/internet-identity-spec.md | stub | | |
| 81 | languages/rust/testing.md | stub | | |
