# Migration Plan

> This file is the **execution playbook** — it tells you _how_ to do each task (dependencies, source material, effort, skills). For _what to do next_, check `progress.md`.

Generated 2026-03-11. Covers all 81 content pages + infrastructure tasks (excluding synced Motoko pages).

## How to use this file

1. Open `progress.md` and find your next task (highest-priority `stub` or `pending`)
2. Come here to look up that task's details: dependencies, source material, effort estimate
3. Do the work following `AGENTS.md` rules
4. Go back to `progress.md` and update the status

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

---

## Phase 1: P0 Pages (38 pages) -- Highest Developer Impact

These pages form the critical path for any developer building on ICP. Ship these first.

### Sprint 1: Foundation (8 pages)

The absolute minimum for a functional docs site. A developer can go from zero to deployed canister.

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 1 | `index.md` | M | None | Portal home.mdx | original |
| 2 | `getting-started/quickstart.md` | L | index.md | Portal quickstart, icp-cli quickstart, installation guide, hello-world template | sync, rewrite |
| 3 | `getting-started/project-structure.md` | M | quickstart | icp-cli project-model, recipes, binding-generation | sync |
| 4 | `getting-started/agentic-development.md` | M | quickstart | icskills README, all 17 skills, llm_chatbot examples | original |
| 5 | `getting-started/what-next.md` | S | All guides stubs | Developer journey analysis | original |
| 6 | `concepts/canisters.md` | M | None | Portal essentials/canisters.mdx, message-execution.mdx | rewrite |
| 7 | `concepts/network-overview.md` | M | None | Portal essentials/network-overview.mdx | rewrite |
| 8 | `concepts/app-architecture.md` | M | canisters, network-overview | Portal app-architecture.mdx, application-architectures.mdx | rewrite |

### Sprint 2: Core Backend Development (10 pages)

A developer can write canister logic, handle persistence, make HTTP calls, use timers, and call other canisters.

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 9 | `guides/backends/data-persistence.md` | L | concepts/canisters | Portal storage.mdx, idempotency.mdx; icskills: stable-memory | rewrite |
| 10 | `guides/backends/https-outcalls.md` | L | concepts/canisters | Portal https-outcalls/ (5 files); icskills: https-outcalls | rewrite |
| 11 | `guides/backends/timers.md` | M | concepts/canisters | Portal periodic-tasks.mdx | rewrite |
| 12 | `guides/inter-canister/calls.md` | L | concepts/canisters | Portal advanced-calls.mdx, icp-cli canister-discovery; icskills: multi-canister | rewrite, sync |
| 13 | `guides/inter-canister/candid.md` | M | inter-canister/calls | Portal Candid sections, generating-candid.mdx | rewrite |
| 14 | `concepts/https-outcalls.md` | M | concepts/canisters | Portal https-outcalls overview | rewrite |
| 15 | `concepts/reverse-gas-model.md` | M | concepts/canisters | Portal gas-cost.mdx, tokens-and-cycles.mdx | rewrite |
| 16 | `concepts/orthogonal-persistence.md` | M | concepts/canisters | Portal persistence sections | rewrite |
| 17 | `concepts/chain-key-cryptography.md` | M | concepts/network-overview | Portal chain-key sections | rewrite |
| 18 | `concepts/chain-fusion.md` | M | chain-key-cryptography | Portal chain-fusion/overview.mdx, supported-chains.mdx | rewrite |

### Sprint 3: Frontend, Auth, and Production (11 pages)

A developer can build a full-stack app with auth and deploy to mainnet.

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 19 | `guides/frontends/asset-canister.md` | L | project-structure | Portal frontends/using-an-asset-canister.mdx; icskills: asset-canister | rewrite |
| 20 | `guides/authentication/internet-identity.md` | L | asset-canister | Portal authentication/ (3 files); icskills: internet-identity | rewrite |
| 21 | `guides/canisters/lifecycle.md` | XL | concepts/canisters, data-persistence | Portal canister-management/ (8 files); icp-cli build-deploy-sync | rewrite, sync |
| 22 | `guides/canisters/settings.md` | M | lifecycle | Portal control.mdx, settings.mdx; icp-cli canister-settings | rewrite, sync |
| 23 | `guides/canisters/reproducible-builds.md` | M | lifecycle | Portal reproducible-builds.mdx; @dfinity/prebuilt recipe | rewrite |
| 24 | `guides/testing/strategies.md` | M | lifecycle | Portal benchmarking.mdx; icp-cli containerized-networks | rewrite |
| 25 | `guides/testing/pocket-ic.md` | M | strategies | JS SDK: pic-js docs | original |
| 26 | `guides/production/cycles-management.md` | L | lifecycle, settings | Portal topping-up.mdx; icp-cli deploying-to-mainnet; icskills: cycles-management | rewrite, sync |
| 27 | `guides/security/access-management.md` | M | concepts/canisters | Portal general.mdx (access sections); icskills: canister-security | rewrite |
| 28 | `guides/security/canister-upgrades.md` | M | lifecycle, data-persistence | icskills: canister-security | original |
| 29 | `concepts/security.md` | M | concepts/canisters | Portal trust-in-canisters.mdx | rewrite |

### Sprint 4: Chain Fusion, DeFi, and Key Reference (8 pages)

A developer can integrate with Bitcoin/Ethereum and work with tokens.

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 30 | `guides/chain-fusion/bitcoin.md` | XL | chain-key-cryptography, chain-fusion concept | Portal build-on-btc/ (14 files); icskills: ckbtc | rewrite |
| 31 | `guides/chain-fusion/ethereum.md` | XL | chain-key-cryptography, chain-fusion concept | Portal chain-fusion/ethereum/ (10 files); icskills: evm-rpc | rewrite |
| 32 | `guides/defi/token-ledgers.md` | L | inter-canister/calls | Portal defi/tokens/; icskills: icrc-ledger | rewrite |
| 33 | `guides/tools/migrating-from-dfx.md` | S | None | Auto-synced from icp-cli repo | sync |
| 34 | `languages/motoko/index.md` | S | None | Synced content landing page | original |
| 35 | `languages/rust/index.md` | L | concepts/canisters | Portal Rust CDK intro, limitations, upgrading | rewrite |
| 36 | `reference/management-canister.md` | L | concepts/canisters | IC interface spec (management canister section) | reference |
| 37 | `reference/token-standards.md` | M | None | Portal token-standards files; icskills: icrc-ledger | reference |
| 38 | `reference/cycles-costs.md` | M | None | Portal resource-limits.mdx, cost tables | reference |

---

## Phase 2: P1 Pages (29 pages) -- Important but Non-Blocking

These pages fill out the docs site with important secondary content.

### Sprint 5: Backend and Canister Guides (8 pages)

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 39 | `guides/backends/randomness.md` | M | concepts/canisters | Portal randomness.mdx | rewrite |
| 40 | `guides/backends/certified-variables.md` | M | concepts/security | Portal advanced-calls.mdx (certified vars); icskills: certified-variables | rewrite |
| 41 | `guides/canisters/logs.md` | M | lifecycle | Portal logs.mdx, backtraces.mdx, access-logs.mdx | rewrite |
| 42 | `guides/canisters/optimization.md` | M | lifecycle | Portal optimize/rust.mdx, motoko.mdx | rewrite |
| 43 | `guides/canisters/snapshots.md` | M | lifecycle | Portal snapshots.mdx; icp-cli canister-snapshots | rewrite, sync |
| 44 | `guides/frontends/custom-domains.md` | M | asset-canister | Portal custom-domains/ (2 files) | rewrite |
| 45 | `guides/frontends/certification.md` | M | asset-canister, certified-variables | Portal asset-security.mdx | rewrite |
| 46 | `guides/authentication/wallet-integration.md` | M | internet-identity | Portal integrate-misc-wallets.mdx; icskills: wallet-integration | rewrite |

### Sprint 6: Inter-Canister, Production, Security (9 pages)

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 47 | `guides/inter-canister/binding-generation.md` | M | candid | icp-cli binding-generation; JS SDK: @icp-sdk/bindgen | sync |
| 48 | `guides/production/subnet-types.md` | M | cycles-management | Portal deploy-specific-subnet.mdx; icp-cli deploying-to-specific-subnets | rewrite, sync |
| 49 | `guides/security/data-integrity.md` | L | concepts/security | icskills: vetkd, certified-variables; examples: vetkeys, vetkd | rewrite |
| 50 | `guides/security/dos-prevention.md` | M | concepts/security | icskills: canister-security | original |
| 51 | `guides/security/inter-canister-calls.md` | M | inter-canister/calls | icskills: canister-security, multi-canister | original |
| 52 | `guides/security/encryption.md` | L | concepts/vetkeys | Portal vetkeys/ (9 files: intro, API, BLS, DKMS, encrypted-storage, IBE, timelock, VRF, demos); icskills: vetkd; examples: vetkd, vetkeys, encrypted-notes-dapp-vetkd, filevault | rewrite |
| 53 | `guides/authentication/verifiable-credentials.md` | M | internet-identity | Portal verifiable-credentials/ (4 files: overview, how-it-works, issuer, relying-party); VC spec: github.com/dfinity/internet-identity/blob/main/docs/vc-spec.md | rewrite |
| 54 | `guides/tools/overview.md` | M | None | Portal dev-tools-overview.mdx, cdks/index.mdx | rewrite |
| 55 | `guides/defi/chain-key-tokens.md` | M | token-ledgers, bitcoin, ethereum | Portal chain-key-tokens files; icskills: ckbtc | rewrite |

### Sprint 7: Governance, Concepts, Languages (8 pages)

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 56 | `guides/governance/launching.md` | L | concepts/governance | Portal launching/ (4 files), tokenomics/ (4 files); icskills: sns-launch | rewrite |
| 57 | `guides/governance/managing.md` | M | launching | Portal managing/ (4 files); icskills: sns-launch | rewrite |
| 58 | `guides/governance/testing.md` | M | launching | Portal testing/ (3 files); icskills: sns-launch | rewrite |
| 59 | `concepts/vetkeys.md` | M | chain-key-cryptography | Portal VetKeys sections; icskills: vetkd | rewrite |
| 60 | `concepts/onchain-randomness.md` | S | None | Portal randomness conceptual parts | rewrite |
| 61 | `concepts/timers.md` | S | None | Portal periodic-tasks conceptual parts | rewrite |
| 62 | `concepts/governance.md` | M | None | Portal tokenomics/index.mdx | rewrite |
| 63 | `languages/rust/stable-structures.md` | M | rust/index | Portal stable-structures.mdx, canister-state.mdx | rewrite |

### Sprint 8: Reference Pages (7 pages)

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 64 | `reference/system-canisters.md` | M | None | Portal system-canisters references | reference |
| 65 | `reference/protocol-canisters.md` | M | None | Portal protocol references; icskills: ckbtc, evm-rpc | reference |
| 66 | `reference/subnet-types.md` | M | None | Portal deploy-specific-subnet | reference |
| 67 | `reference/execution-errors.md` | M | None | Portal trapping.mdx, resource-limits.mdx | reference |
| 68 | `reference/ic-interface-spec.md` | S | None | IC interface spec links | reference |
| 69 | `reference/candid-spec.md` | S | None | Candid spec links | reference |
| 70 | `reference/glossary.md` | L | All concept pages | Portal glossary; all concept pages | reference |

---

## Phase 3: P2 Pages (11 pages) -- Nice to Have

These pages cover niche or advanced topics. Ship after P0 and P1 are complete.

### Sprint 9: Advanced Guides (7 pages)

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 71 | `guides/backends/large-wasm.md` | M | lifecycle | Portal compile.mdx (large Wasm), simd.mdx; examples: backend_wasm64 | rewrite |
| 72 | `guides/backends/parallel-calls.md` | M | inter-canister/calls | Portal advanced-calls.mdx (composite queries); examples: parallel_calls | rewrite |
| 73 | `guides/frontends/frameworks.md` | L | asset-canister | Portal existing-frontend.mdx; examples: react, svelte starters | rewrite |
| 74 | `guides/chain-fusion/solana.md` | M | chain-fusion concept | Portal solana/overview.mdx | rewrite |
| 75 | `guides/chain-fusion/dogecoin.md` | M | chain-fusion concept | Portal dogecoin/overview.mdx | rewrite |
| 76 | `guides/defi/rosetta.md` | L | token-ledgers | Portal defi/rosetta/ files | rewrite |
| 77 | `guides/production/canister-discovery.md` | M | settings | icskills: ic-dashboard | original |

### Sprint 10: Remaining Reference and Languages (4 pages)

| # | Page | Effort | Dependencies | Source Material | Skills |
|---|------|--------|-------------|-----------------|--------|
| 78 | `reference/application-canisters.md` | M | None | Portal application references | reference |
| 79 | `reference/http-gateway-spec.md` | S | None | HTTP gateway spec links | reference |
| 80 | `reference/internet-identity-spec.md` | S | None | II spec links | reference |
| 81 | `languages/rust/testing.md` | M | rust/index, testing/strategies | examples: unit_testable_rust_canister | original |

---

## Effort Summary

| Phase | Pages | S | M | L | XL | Estimated Total Hours |
|-------|-------|---|---|---|----|-----------------------|
| P0 (Sprint 1-4) | 38 | 3 | 19 | 10 | 3 | ~120 hours |
| P1 (Sprint 5-8) | 31 | 3 | 20 | 4 | 0 | ~85 hours |
| P2 (Sprint 9-10) | 11 | 2 | 6 | 3 | 0 | ~30 hours |
| **Total** | **81** | **8** | **45** | **17** | **3** | **~235 hours** |

---

## Dependencies Graph (Critical Path)

```
index.md
  └── getting-started/quickstart.md
        └── getting-started/project-structure.md
        └── getting-started/agentic-development.md
        └── getting-started/what-next.md

concepts/canisters.md
  └── concepts/network-overview.md
  └── concepts/app-architecture.md
  └── concepts/reverse-gas-model.md
  └── concepts/security.md
  └── guides/backends/data-persistence.md
        └── guides/canisters/lifecycle.md
              └── guides/canisters/settings.md
              └── guides/canisters/reproducible-builds.md
              └── guides/production/cycles-management.md
  └── guides/backends/https-outcalls.md
  └── guides/backends/timers.md
  └── guides/inter-canister/calls.md
        └── guides/inter-canister/candid.md
        └── guides/defi/token-ledgers.md
  └── guides/security/access-management.md

concepts/chain-key-cryptography.md
  └── concepts/chain-fusion.md
        └── guides/chain-fusion/bitcoin.md
        └── guides/chain-fusion/ethereum.md

concepts/chain-key-cryptography.md
  └── concepts/vetkeys.md
        └── guides/security/encryption.md

guides/frontends/asset-canister.md
  └── guides/authentication/internet-identity.md
        └── guides/authentication/verifiable-credentials.md

guides/testing/strategies.md
  └── guides/testing/pocket-ic.md
```

---

## Notes

- `guides/tools/migrating-from-dfx.md` is auto-synced from the icp-cli repo, so it needs no manual authoring.
- Motoko language pages (~60) are synced from `caffeinelabs/motoko` and are not included in this plan. See `decisions.md` for details.
- Cross-links between concept-guide pairs should be added as content is written.
- **All icp-cli commands, flags, and installation instructions must be verified** against the icp-cli repo source (`dfinity/icp-cli`, `docs/reference/cli.md`). Never guess CLI syntax — fetch with: `gh api repos/dfinity/icp-cli/contents/docs/reference/cli.md --jq '.content' | base64 -d`
- Each stub page contains `<!-- Content Brief -->`, `<!-- Source Material -->`, and `<!-- Cross-Links -->` HTML comments — read these before writing.
- After completing a page, update `progress.md` (status → `draft`, add agent name and date).
