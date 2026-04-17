# Migration Plan

> This file is the **execution playbook** — it tells you _how_ to do each task (dependencies, source material, effort, skills). For _what to do next_, check [GitHub Issues](https://github.com/dfinity/developer-docs/issues).

Covers all 80 content pages + infrastructure tasks (excluding synced Motoko pages, section index pages, and the landing page).

## How to use this file

1. Pick a task from [GitHub Issues](https://github.com/dfinity/developer-docs/issues) — content pages use the `documentation` label; infra tasks use `enhancement`
2. Check the **Dependency Layers** section below to understand what's unblocked
3. Look up that task's details in the sprint tables: dependencies, source material, effort estimate
4. Do the work following `AGENTS.md` rules
5. Submit PR with a `## Sync recommendation` section in the description

## Effort key

- **S** (< 2 hours), **M** (2-4 hours), **L** (4-8 hours), **XL** (8+ hours)
- **Skills**: `rewrite` (rewrite portal content), `original` (write from scratch), `sync` (adapt from icp-cli), `reference` (compile reference data)

---

## Infrastructure Tasks

These are non-content tasks needed to make the docs production-ready. All scripts/workflows are preserved on `restructuring-attempt-1` and need to be adapted to the new structure.

| Priority | Task | Effort | Details |
|----------|------|--------|---------|
| P0 | Restore validation scripts | M | `scripts/validate-frontmatter.mjs`, `scripts/validate-no-dfx.sh`, `scripts/validate-no-mdx.sh` — update paths for new structure, add to `package.json` |
| P0 | Restore sync scripts | M | See details below |

**Restore sync scripts — details:**

Scripts to copy from `restructuring-attempt-1` branch:
- `scripts/sync-motoko.sh` — pulls Motoko docs from `caffeinelabs/motoko`, flattens into `docs/languages/motoko/{fundamentals,icp-features,reference}/`
- `scripts/postprocess-motoko.mjs` — injects frontmatter, rewrites internal links, strips JSX components
- `scripts/sync-icp-cli-version.mjs` — syncs `docs/guides/tools/migrating-from-dfx.md` from `dfinity/icp-cli`

Restoration checklist:
1. Copy scripts from `restructuring-attempt-1`
2. Update all target paths from `src/content/docs/` to `docs/`
3. Update frontmatter injection to match current schema (no `features` or `last_verified` fields)
4. Run sync and verify output files have correct frontmatter
5. Run `npm run build` to confirm Astro picks up synced files
6. Add sync commands to `package.json` scripts
| P1 | Set up CI workflows | M | `.github/workflows/` — restore from attempt-1, update for new structure |
| P1 | Restore build generators | M | `scripts/generate-llms-txt.mjs`, `scripts/generate-manifest.mjs` — update for new page paths |
| P1 | Custom styling / theming | L | Design TBD — currently using Starlight defaults |
| P1 | Content gap analysis | L | Systematic comparison of all upstream sources against written docs. Depends on Sprint 4 completion (all P0 content). See details below. |
| P2 | Configure CODEOWNERS and branch protection | S | Set up CODEOWNERS with team-specific reviewers (security, defi, languages, etc.) and require CODEOWNERS approval on PRs. Depends on content being written (need to know final review ownership per section). |
| P2 | Content lifecycle strategy | M | Define upstream change detection, sync automation, and freshness ownership. Depends on gap analysis + sync recommendations from content PRs. See details below. |

**Content gap analysis — details:**

Run after Sprint 4 (all P0 pages written). Systematic comparison of upstream sources against our docs to catch what individual agents missed:
1. **Portal full diff** — Compare all portal content (`dfinity/portal`) against our 81 pages. Identify uncovered topics, outdated information carried over, and content that exists in portal but was intentionally excluded (document why).
2. **icp-cli docs coverage** — Check all guides and reference pages in `dfinity/icp-cli/docs/` for content we don't reference or cover. Flag guides that should be synced or linked.
3. **Examples repo coverage** — Check `dfinity/examples` for examples with no corresponding docs page or cross-link.
4. **icskills coverage** — Verify every icskill topic has a corresponding guide or concept page that references it.
5. **Page proposal triage** — Review all open GitHub Issues with `page-proposal` label alongside the gap analysis. Prioritize and add approved pages to the plan.
6. **Output** — Prioritized list of: gaps to fill (new pages or sections), content improvements (existing pages missing key information), and upstream sources to add to the sync/monitoring list.

**Content lifecycle strategy — details:**

Deferred until after the gap analysis. Design must answer:
1. **Sync vs. hand-written vs. upstream-informed** — Review `<!-- Upstream: ... -->` comments from content PRs. Decide which pages to auto-sync and which to monitor manually.
2. **Upstream change detection** — How to detect when upstream repos (icp-cli, examples, icskills, portal) ship changes that affect our docs. Options: GitHub Action that diffs upstream weekly, Dependabot-style alerts, or manual review cadence.
3. **Freshness ownership** — Who reviews upstream changes per section. Maps to CODEOWNERS but for content accuracy, not just code review.
4. **New page proposals** — Review remaining open GitHub Issues with `page-proposal` label. Decide which to add to the plan.

---

## Dependency Layers (P0 pages)

Pages are organized into layers based on what they depend on. **All pages within the same layer can be written in parallel.** A page can only start once all its dependencies (in prior layers) are at least in `draft` status.

```
Layer 0 — No dependencies (start immediately, 3 parallel agents)
  ├── concepts/canisters.md            ← hub page, most pages depend on this
  ├── concepts/network-overview.md
  └── concepts/chain-key-cryptography.md

Layer 1 — Depends on Layer 0 (up to 6 parallel agents)
  ├── concepts/app-architecture.md          (needs: canisters, network-overview)
  ├── concepts/reverse-gas-model.md         (needs: canisters)
  ├── concepts/orthogonal-persistence.md    (needs: canisters)
  ├── concepts/https-outcalls.md            (needs: canisters)
  ├── concepts/security.md                  (needs: canisters)
  ├── concepts/chain-fusion.md              (needs: chain-key-cryptography)
  ├── getting-started/quickstart.md         (needs: canisters)
  ├── guides/backends/https-outcalls.md     (needs: canisters)
  ├── guides/backends/timers.md             (needs: canisters)
  ├── guides/canister-calls/candid.md       (needs: canisters)
  └── guides/security/access-management.md  (needs: canisters)

Layer 2 — Depends on Layer 1 (up to 5 parallel agents)
  ├── getting-started/project-structure.md  (needs: quickstart)
  ├── guides/backends/data-persistence.md   (needs: canisters, orthogonal-persistence)
  ├── guides/canister-calls/onchain-calls.md (needs: candid)
  ├── guides/frontends/asset-canister.md    (needs: project-structure)
  ├── guides/chain-fusion/bitcoin.md        (needs: chain-key-cryptography, chain-fusion)
  └── guides/chain-fusion/ethereum.md       (needs: chain-key-cryptography, chain-fusion)

Layer 3 — Depends on Layer 2 (up to 4 parallel agents)
  ├── getting-started/what-next.md          (needs: quickstart, project-structure)
  ├── guides/canister-management/lifecycle.md (needs: canisters, data-persistence)
  ├── guides/authentication/internet-identity.md (needs: asset-canister)
  └── guides/defi/token-ledgers.md          (needs: onchain-calls)

Layer 4 — Depends on Layer 3 (up to 4 parallel agents)
  ├── guides/canister-management/settings.md       (needs: lifecycle)
  ├── guides/canister-management/reproducible-builds.md (needs: lifecycle)
  ├── guides/testing/strategies.md                 (needs: lifecycle)
  ├── guides/security/canister-upgrades.md         (needs: lifecycle, data-persistence)
  └── guides/canister-management/cycles-management.md (needs: lifecycle, settings)

Layer 5 — Depends on Layer 4
  └── guides/testing/pocket-ic.md           (needs: strategies)
```

**Critical path** (longest chain): canisters → orthogonal-persistence → data-persistence → lifecycle → settings → cycles-management (6 layers deep).

**No-dependency pages** (can be written at any time): `migrating-from-dfx.md`, `motoko/index.md`, `reference/token-standards.md`, `reference/cycles-costs.md`.

---

## Phase 1: P0 Pages (38 pages) -- Highest Developer Impact

These pages form the critical path for any developer building on ICP. Ship these first.

### Sprint 1: Foundation (7 pages)

The absolute minimum for a functional docs site. A developer can go from zero to deployed canister.

**Parallelism:** 3 agents can work simultaneously on Layer 0, then transition to Layer 1 pages.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 1 | — | `index.md` | M | None | Portal home.mdx | original |
| 2 | 0 | `concepts/canisters.md` | M | None | Portal essentials/canisters.mdx, message-execution.mdx | rewrite |
| 3 | 0 | `concepts/network-overview.md` | M | None | Portal essentials/network-overview.mdx | rewrite |
| 4 | 1 | `concepts/app-architecture.md` | M | canisters, network-overview | Portal app-architecture.mdx, application-architectures.mdx | rewrite |
| 5 | 1 | `getting-started/quickstart.md` | L | canisters | Portal quickstart, icp-cli quickstart, installation guide, hello-world template | sync, rewrite |
| 6 | 2 | `getting-started/project-structure.md` | M | quickstart | icp-cli project-model, recipes, binding-generation | sync |
| 7 | 2 | `getting-started/what-next.md` | S | quickstart, project-structure | Developer journey analysis | original |

### Sprint 2: Core Backend Development (10 pages)

A developer can write canister logic, handle persistence, make HTTP calls, use timers, and call other canisters.

**Parallelism:** 4 agents can work simultaneously — concepts cluster, backends cluster, canister-calls cluster, and chain-key cluster run in parallel.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 8 | 0 | `concepts/chain-key-cryptography.md` | M | concepts/network-overview | Portal chain-key sections | rewrite |
| 9 | 1 | `concepts/orthogonal-persistence.md` | M | concepts/canisters | Portal persistence sections | rewrite |
| 10 | 1 | `concepts/https-outcalls.md` | M | concepts/canisters | Portal https-outcalls overview | rewrite |
| 11 | 1 | `concepts/reverse-gas-model.md` | M | concepts/canisters | Portal gas-cost.mdx, tokens-and-cycles.mdx | rewrite |
| 12 | 1 | `concepts/chain-fusion.md` | M | chain-key-cryptography | Portal chain-fusion/overview.mdx, supported-chains.mdx | rewrite |
| 13 | 1 | `guides/canister-calls/candid.md` | M | concepts/canisters | Portal Candid sections, generating-candid.mdx | rewrite |
| 14 | 1 | `guides/backends/https-outcalls.md` | L | concepts/canisters | Portal https-outcalls/ (5 files); icskills: https-outcalls | rewrite |
| 15 | 1 | `guides/backends/timers.md` | M | concepts/canisters | Portal periodic-tasks.mdx | rewrite |
| 16 | 2 | `guides/backends/data-persistence.md` | L | canisters, orthogonal-persistence | Portal storage.mdx, idempotency.mdx; icskills: stable-memory | rewrite |
| 17 | 2 | `guides/canister-calls/onchain-calls.md` | L | candid | Portal advanced-calls.mdx, icp-cli canister-discovery; icskills: multi-canister | rewrite, sync |

### Sprint 3: Frontend, Auth, and Production (11 pages)

A developer can build a full-stack app with auth and deploy to mainnet.

**Parallelism:** 3 agents — frontend/auth track, canister-management track, security/testing track.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 18 | 1 | `concepts/security.md` | M | concepts/canisters | Portal trust-in-canisters.mdx | rewrite |
| 19 | 1 | `guides/security/access-management.md` | M | concepts/canisters | Portal general.mdx (access sections); icskills: canister-security | rewrite |
| 20 | 2 | `guides/frontends/asset-canister.md` | L | project-structure | Portal frontends/using-an-asset-canister.mdx; icskills: asset-canister | rewrite |
| 21 | 3 | `guides/authentication/internet-identity.md` | L | asset-canister | Portal authentication/ (3 files); icskills: internet-identity | rewrite |
| 22 | 3 | `guides/canister-management/lifecycle.md` | XL | concepts/canisters, data-persistence | Portal canister-management/ (8 files); icp-cli build-deploy-sync | rewrite, sync |
| 23 | 4 | `guides/canister-management/settings.md` | M | lifecycle | Portal control.mdx, settings.mdx; icp-cli canister-settings | rewrite, sync |
| 24 | 4 | `guides/canister-management/reproducible-builds.md` | M | lifecycle | Portal reproducible-builds.mdx; @dfinity/prebuilt recipe | rewrite |
| 25 | 4 | `guides/testing/strategies.md` | M | lifecycle | Portal benchmarking.mdx; icp-cli containerized-networks | rewrite |
| 26 | 4 | `guides/security/canister-upgrades.md` | M | lifecycle, data-persistence | icskills: canister-security | original |
| 27 | 5 | `guides/testing/pocket-ic.md` | M | strategies | JS SDK: pic-js docs | original |
| 28 | 5 | `guides/canister-management/cycles-management.md` | L | lifecycle, settings | Portal topping-up.mdx; icp-cli deploying-to-mainnet; icskills: cycles-management | rewrite, sync |

### Sprint 4: Chain Fusion, DeFi, and Key Reference (9 pages)

A developer can integrate with Bitcoin/Ethereum and work with tokens.

**Parallelism:** 3 agents — bitcoin/ethereum track (XL, needs dedicated agents), token/defi track, reference/language track (all independent).

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 29 | 2 | `guides/chain-fusion/bitcoin.md` | XL | chain-key-cryptography, chain-fusion | Portal build-on-btc/ (14 files); icskills: ckbtc | rewrite |
| 30 | 2 | `guides/chain-fusion/ethereum.md` | XL | chain-key-cryptography, chain-fusion | Portal chain-fusion/ethereum/ (10 files); icskills: evm-rpc | rewrite |
| 31 | 3 | `guides/defi/token-ledgers.md` | L | canister-calls/onchain-calls | Portal defi/tokens/; icskills: icrc-ledger | rewrite |
| 32 | — | `guides/tools/migrating-from-dfx.md` | S | None | Auto-synced from icp-cli repo | sync |
| 33 | — | `languages/motoko/index.md` | S | None | Synced content landing page | original |
| 34 | 1 | `languages/rust/index.md` | L | concepts/canisters | Portal Rust CDK intro, limitations, upgrading | rewrite |
| 35 | 1 | `reference/management-canister.md` | L | concepts/canisters | IC interface spec (management canister section) | reference |
| 36 | — | `reference/token-standards.md` | M | None | Portal token-standards files; icskills: icrc-ledger | reference |
| 37 | — | `reference/cycles-costs.md` | M | None | Portal resource-limits.mdx, cost tables | reference |

---

## Phase 2: P1 Pages (29 pages) -- Important but Non-Blocking

These pages fill out the docs site with important secondary content.

### Sprint 5: Backend and Canister Guides (9 pages)

**Parallelism:** 3 agents — backends track (all need only concepts/canisters), canister-management track (all need lifecycle), frontends/auth track.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 38b | 1 | `guides/backends/onchain-ai.md` | M | concepts/canisters | Forum post (LLM canister intro), docs.rs/ic-llm, mops.one/llm; examples: llm_chatbot (Rust/Motoko) | original |
| 39 | 1 | `guides/backends/randomness.md` | M | concepts/canisters | Portal randomness.mdx | rewrite |
| 40 | 2 | `guides/backends/certified-variables.md` | M | concepts/security | Portal advanced-calls.mdx (certified vars); icskills: certified-variables | rewrite |
| 41 | 4 | `guides/canister-management/logs.md` | M | lifecycle | Portal logs.mdx, backtraces.mdx, access-logs.mdx | rewrite |
| 42 | 4 | `guides/canister-management/optimization.md` | M | lifecycle | Portal optimize/rust.mdx, motoko.mdx | rewrite |
| 43 | 4 | `guides/canister-management/snapshots.md` | M | lifecycle | Portal snapshots.mdx; icp-cli canister-snapshots | rewrite, sync |
| 44 | 3 | `guides/frontends/custom-domains.md` | M | asset-canister | Portal custom-domains/ (2 files) | rewrite |
| 45 | 3+ | `guides/frontends/certification.md` | M | asset-canister, certified-variables | Portal asset-security.mdx | rewrite |
| 46 | 4 | `guides/defi/wallet-integration.md` | M | internet-identity | Portal integrate-misc-wallets.mdx; icskills: wallet-integration | rewrite |

### Sprint 6: Canister Calls, Production, Security, Tools (11 pages)

**Parallelism:** 4 agents — canister-calls track, security track, tools track (independent), defi track.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| ~~47~~ | — | ~~`guides/canister-calls/binding-generation.md`~~ | — | — | Merged into `candid.md` "Binding generation" section | — |
| 47b | 3 | `guides/canister-calls/offchain-calls.md` | M | candid | JS SDK: @icp-sdk/core, @icp-sdk/canisters; icp-cli canister-discovery; hello-world template | original |
| 48 | 5+ | `guides/canister-management/subnet-selection.md` | M | cycles-management | Portal deploy-specific-subnet.mdx; icp-cli deploying-to-specific-subnets | rewrite, sync |
| 49 | 2 | `guides/security/data-integrity.md` | L | concepts/security | icskills: vetkd, certified-variables; examples: vetkeys, vetkd | rewrite |
| 50 | 2 | `guides/security/dos-prevention.md` | M | concepts/security | icskills: canister-security | original |
| 51 | 3 | `guides/security/inter-canister-calls.md` | M | canister-calls/onchain-calls | icskills: canister-security, multi-canister | original |
| 52 | 3+ | `guides/security/encryption.md` | L | concepts/vetkeys | Portal vetkeys/ (9 files); icskills: vetkd; examples: vetkd, vetkeys, encrypted-notes-dapp-vetkd, filevault | rewrite |
| 53 | 4 | `guides/authentication/verifiable-credentials.md` | M | internet-identity | Portal verifiable-credentials/ (4 files); VC spec | rewrite |
| 54 | — | `guides/tools/overview.md` | M | None | Portal dev-tools-overview.mdx, cdks/index.mdx | rewrite |
| 54b | 2 | `guides/tools/agentic-development.md` | M | quickstart | icskills README, all 17 skills | original |
| 55 | 4+ | `guides/defi/chain-key-tokens.md` | M | token-ledgers, bitcoin, ethereum | Portal chain-key-tokens files; icskills: ckbtc | rewrite |

### Sprint 7: Governance, Concepts, Languages (8 pages)

**Parallelism:** 3 agents — governance track (sequential: governance concept → launching → managing/testing), concepts track (all independent), rust track.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 56 | 2+ | `guides/governance/launching.md` | L | concepts/governance | Portal launching/ (4 files), tokenomics/ (4 files); icskills: sns-launch | rewrite |
| 57 | 3+ | `guides/governance/managing.md` | M | launching | Portal managing/ (4 files); icskills: sns-launch | rewrite |
| 58 | 3+ | `guides/governance/testing.md` | M | launching | Portal testing/ (3 files); icskills: sns-launch | rewrite |
| 59 | 2 | `concepts/vetkeys.md` | M | chain-key-cryptography | Portal VetKeys sections; icskills: vetkd | rewrite |
| 60 | — | `concepts/onchain-randomness.md` | S | None | Portal randomness conceptual parts | rewrite |
| 61 | — | `concepts/timers.md` | S | None | Portal periodic-tasks conceptual parts | rewrite |
| 62 | — | `concepts/governance.md` | M | None | Portal tokenomics/index.mdx | rewrite |
| 63 | 2 | `languages/rust/stable-structures.md` | M | rust/index | Portal stable-structures.mdx, canister-state.mdx | rewrite |

### Sprint 8: Reference Pages (7 pages)

**Parallelism:** All 7 pages can be written in parallel — no inter-dependencies. Only glossary.md benefits from having concept pages done first.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 64 | — | `reference/system-canisters.md` | M | None | Portal system-canisters references | reference |
| 65 | — | `reference/protocol-canisters.md` | M | None | Portal protocol references; icskills: ckbtc, evm-rpc | reference |
| 66 | — | `reference/subnet-types.md` | M | None | Portal deploy-specific-subnet | reference |
| 67 | — | `reference/execution-errors.md` | M | None | Portal trapping.mdx, resource-limits.mdx | reference |
| 68 | — | `reference/ic-interface-spec.md` | S | None | IC interface spec links | reference |
| 69 | — | `reference/candid-spec.md` | S | None | Candid spec links | reference |
| 70 | all | `reference/glossary.md` | L | All concept pages | Portal glossary; all concept pages | reference |

---

## Phase 3: P2 Pages (11 pages) -- Nice to Have

These pages cover niche or advanced topics. Ship after P0 and P1 are complete.

### Sprint 9: Advanced Guides (6 pages)

**Parallelism:** All 6 pages can run in parallel — dependencies are all from earlier sprints.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 71 | 4 | `guides/canister-management/large-wasm.md` | M | lifecycle | Portal compile.mdx (large Wasm), simd.mdx; examples: backend_wasm64 | rewrite |
| 72 | 3 | `guides/canister-calls/parallel-calls.md` | M | canister-calls/onchain-calls | Portal advanced-calls.mdx (composite queries); examples: parallel_calls | rewrite |
| 73 | 3 | `guides/frontends/frameworks.md` | L | asset-canister | Portal existing-frontend.mdx; examples: react, svelte starters | rewrite |
| 74 | 2 | `guides/chain-fusion/solana.md` | M | chain-fusion concept | Portal solana/overview.mdx | rewrite |
| 75 | 2 | `guides/chain-fusion/dogecoin.md` | M | chain-fusion concept | Portal dogecoin/overview.mdx | rewrite |
| 76 | 4 | `guides/defi/rosetta.md` | L | token-ledgers | Portal defi/rosetta/ files | rewrite |
### Sprint 10: Remaining Reference and Languages (4 pages)

**Parallelism:** All 4 pages can run in parallel.

| # | Layer | Page | Effort | Dependencies | Source Material | Skills |
|---|-------|------|--------|-------------|-----------------|--------|
| 78 | — | `reference/application-canisters.md` | M | None | Portal application references | reference |
| 79 | — | `reference/http-gateway-spec.md` | S | None | HTTP gateway spec links | reference |
| 80 | — | `reference/internet-identity-spec.md` | S | None | II spec links | reference |
| 81 | 5 | `languages/rust/testing.md` | M | rust/index, testing/strategies | examples: unit_testable_rust_canister | original |

---

## Effort Summary

| Phase | Pages | S | M | L | XL | Estimated Total Hours |
|-------|-------|---|---|---|----|-----------------------|
| P0 (Sprint 1-4) | 37 | 3 | 18 | 10 | 3 | ~117 hours |
| P1 (Sprint 5-8) | 33 | 3 | 22 | 4 | 0 | ~91 hours |
| P2 (Sprint 9-10) | 11 | 2 | 6 | 3 | 0 | ~30 hours |
| **Total** | **82** | **8** | **46** | **17** | **3** | **~238 hours** |

---

## Dependencies Graph (Critical Path)

Arrows show "is required by" (parent → child means child depends on parent).

```
concepts/canisters.md                          ← HUB: most pages depend on this
  ├── concepts/app-architecture.md             (also needs: network-overview)
  ├── concepts/reverse-gas-model.md
  ├── concepts/orthogonal-persistence.md
  ├── concepts/https-outcalls.md
  ├── concepts/security.md
  │     ├── guides/backends/certified-variables.md
  │     ├── guides/security/data-integrity.md
  │     └── guides/security/dos-prevention.md
  ├── getting-started/quickstart.md
  │     ├── getting-started/project-structure.md
  │     │     └── getting-started/what-next.md
  │     └── guides/tools/agentic-development.md
  ├── guides/canister-calls/candid.md          ← NOTE: candid before onchain-calls
  │     ├── guides/canister-calls/onchain-calls.md
  │     │     ├── guides/defi/token-ledgers.md
  │     │     │     └── guides/defi/chain-key-tokens.md
  │     │     ├── guides/security/inter-canister-calls.md
  │     │     └── guides/canister-calls/parallel-calls.md
  │     └── guides/canister-calls/offchain-calls.md
  ├── guides/backends/data-persistence.md      (also needs: orthogonal-persistence)
  │     └── guides/canister-management/lifecycle.md
  │           ├── guides/canister-management/settings.md
  │           │     └── guides/canister-management/cycles-management.md
  │           │           └── guides/canister-management/subnet-selection.md
  │           ├── guides/canister-management/reproducible-builds.md
  │           ├── guides/canister-management/logs.md
  │           ├── guides/canister-management/optimization.md
  │           ├── guides/canister-management/snapshots.md
  │           ├── guides/testing/strategies.md
  │           │     └── guides/testing/pocket-ic.md
  │           └── guides/security/canister-upgrades.md
  ├── guides/backends/https-outcalls.md
  ├── guides/backends/timers.md
  └── guides/security/access-management.md

concepts/network-overview.md
  └── concepts/chain-key-cryptography.md
        ├── concepts/chain-fusion.md
        │     ├── guides/chain-fusion/bitcoin.md
        │     ├── guides/chain-fusion/ethereum.md
        │     ├── guides/chain-fusion/solana.md
        │     └── guides/chain-fusion/dogecoin.md
        └── concepts/vetkeys.md
              └── guides/security/encryption.md

getting-started/project-structure.md
  └── guides/frontends/asset-canister.md
        ├── guides/authentication/internet-identity.md
        │     ├── guides/defi/wallet-integration.md
        │     └── guides/authentication/verifiable-credentials.md
        ├── guides/frontends/custom-domains.md
        ├── guides/frontends/certification.md  (also needs: certified-variables)
        └── guides/frontends/frameworks.md

concepts/governance.md
  └── guides/governance/launching.md
        ├── guides/governance/managing.md
        └── guides/governance/testing.md

languages/rust/index.md
  ├── languages/rust/stable-structures.md
  └── languages/rust/testing.md               (also needs: testing/strategies)
```

**Critical path** (6 layers deep):
`canisters → orthogonal-persistence → data-persistence → lifecycle → settings → cycles-management → subnet-selection`

**Independent pages** (no dependencies, can be written at any time):
`index.md`, `migrating-from-dfx.md`, `motoko/index.md`, `reference/token-standards.md`, `reference/cycles-costs.md`, `reference/system-canisters.md`, `reference/protocol-canisters.md`, `reference/subnet-types.md`, `reference/execution-errors.md`, `reference/ic-interface-spec.md`, `reference/candid-spec.md`, `concepts/onchain-randomness.md`, `concepts/timers.md`, `concepts/governance.md`, `guides/tools/overview.md`

---

## Notes

- `guides/tools/migrating-from-dfx.md` is auto-synced from the icp-cli repo, so it needs no manual authoring.
- Motoko language pages (~60) are synced from `caffeinelabs/motoko` and are not included in this plan. See `decisions.md` for details.
- Cross-links between concept-guide pairs should be added as content is written.
- **All icp-cli commands, flags, and installation instructions must be verified** against the icp-cli repo source (`dfinity/icp-cli`, `docs/reference/cli.md`). Never guess CLI syntax — fetch with: `gh api repos/dfinity/icp-cli/contents/docs/reference/cli.md --jq '.content' | base64 -d`
- Each stub page contains `<!-- Content Brief -->`, `<!-- Source Material -->`, and `<!-- Cross-Links -->` HTML comments — read these before writing.
- After completing a page, open a PR with a `## Sync recommendation` section and link it to the corresponding GitHub Issue.
