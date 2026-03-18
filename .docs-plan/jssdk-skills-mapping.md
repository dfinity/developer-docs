# JS SDK + icskills Mapping

## icskills Inventory

17 published skills (16 unique source skills + `wallet` alias of `cycles-management` in dist):

| # | Skill | Category | Summary |
|---|-------|----------|---------|
| 1 | `asset-canister` | Frontend | Deploy frontend assets, certified assets, SPA routing, custom domains, programmatic uploads |
| 2 | `canister-security` | Security | Access control, anonymous principal rejection, reentrancy (CallerGuard), async safety (saga), callback traps, cycle drain protection, upgrade safety |
| 3 | `certified-variables` | Security | Merkle trees, certified data API, witness generation, frontend certificate validation |
| 4 | `ckbtc` | DeFi | BTC deposit/withdrawal via minter, ckBTC transfers, subaccount derivation, UTXO management |
| 5 | `cycles-management` | Infrastructure | Cycle balances, top-ups, freezing thresholds, canister creation, ICP-to-cycles via CMC |
| 6 | `evm-rpc` | Integration | JSON-RPC calls to Ethereum/EVM chains, multi-provider consensus, ERC-20 reads, signed tx submission |
| 7 | `https-outcalls` | Integration | HTTP requests from canisters, transform functions, cycle costs, response limits, idempotency |
| 8 | `ic-dashboard` | Integration | REST APIs for dashboard.internetcomputer.org (canister metadata, ICRC ledger, SNS, ICP ledger, metrics) |
| 9 | `icp-cli` | Infrastructure | Project config (icp.yaml), recipes, environments, canister lifecycle, identity management |
| 10 | `icrc-ledger` | Tokens | ICRC-1/ICRC-2 token standard, transfers, balances, approve/transferFrom, fee handling, local test ledger |
| 11 | `internet-identity` | Auth | Passkey and OpenID login, delegation handling, principal-per-app isolation |
| 12 | `multi-canister` | Architecture | Inter-canister calls, canister factory, async messaging, bounded/unbounded wait, 2MB limits |
| 13 | `sns-launch` | Governance | Token economics, governance params, testflight, NNS proposal, decentralization swap |
| 14 | `stable-memory` | Architecture | StableBTreeMap (Rust), persistent actor (Motoko), MemoryManager, upgrade hooks |
| 15 | `vetkd` | Security | Onchain encryption, IBE, transport keys, key derivation, access control for secrets |
| 16 | `wallet-integration` | Wallet | ICRC signer standards (21/25/27/29/49), popup wallet model, consent messages, OISY signer |
| 17 | `wallet` (alias) | Infrastructure | Published alias of `cycles-management` in dist |

## JS SDK Inventory

5 projects at https://js.icp.build:

| # | Project | Package | Type | Summary |
|---|---------|---------|------|---------|
| 1 | Core | `@icp-sdk/core` | Library | Base library: agent, identity, principal, HttpAgent, certificate verification |
| 2 | Auth | `@icp-sdk/auth` | Library | Authentication: AuthClient, Internet Identity integration, delegation identity |
| 3 | Canisters | `@icp-sdk/canisters` | Library | Canister interaction: asset manager, ledger/governance actor factories |
| 4 | Pic JS | `pic-js` | Tool | Canister testing framework for JS/TS (PocketIC-based) |
| 5 | Bindgen | `@icp-sdk/bindgen` | Tool | Generate JS/TS bindings from Candid |

---

## icskills to Docs Pages Mapping

| Skill | Docs Pages (add `icskills` frontmatter) | Notes |
|-------|----------------------------------------|-------|
| `asset-canister` | `guides/frontends/asset-canister`, `guides/frontends/custom-domains`, `guides/frontends/certification`, `guides/frontends/frameworks` | Primary target is asset-canister page; custom-domains and certification are also covered by this skill |
| `canister-security` | `guides/security/access-management`, `guides/security/canister-upgrades`, `guides/security/data-integrity`, `guides/security/dos-prevention`, `guides/security/inter-canister-calls`, `concepts/security` | Broad skill; map to all security guide pages plus concepts/security |
| `certified-variables` | `guides/backends/certified-variables`, `guides/frontends/certification`, `concepts/security` | Primary is backends/certified-variables; also relevant for frontend cert verification |
| `ckbtc` | `guides/chain-fusion/bitcoin`, `guides/defi/chain-key-tokens`, `guides/defi/token-ledgers` | Primary is bitcoin chain-fusion; also relevant for chain-key tokens overview |
| `cycles-management` | `guides/canister-management/cycles-management`, `guides/canister-management/lifecycle`, `guides/canister-management/settings`, `concepts/reverse-gas-model` | Primary is cycles-management; lifecycle and settings pages reference cycle operations |
| `evm-rpc` | `guides/chain-fusion/ethereum`, `concepts/chain-fusion` | Primary is ethereum chain-fusion page |
| `https-outcalls` | `guides/backends/https-outcalls`, `concepts/https-outcalls` | Both the guide and concept page |
| `ic-dashboard` | `guides/canister-management/canister-discovery`, `reference/system-canisters` | Dashboard APIs are for off-chain discovery; reference for system canister metadata |
| `icp-cli` | `getting-started/quickstart`, `getting-started/project-structure`, `guides/tools/overview`, `guides/tools/migrating-from-dfx` | Foundational skill; referenced from getting-started and tools sections |
| `icrc-ledger` | `guides/defi/token-ledgers`, `reference/token-standards`, `guides/defi/chain-key-tokens` | Primary is token-ledgers; also token-standards reference |
| `internet-identity` | `guides/authentication/internet-identity`, `reference/internet-identity-spec` | Primary is the II guide page |
| `multi-canister` | `guides/canister-calls/onchain-calls`, `guides/canister-calls/candid`, `guides/canister-calls/parallel-calls`, `concepts/app-architecture` | Primary is canister-calls/onchain-calls; also relevant for parallel calls and app architecture |
| `sns-launch` | `guides/governance/launching`, `guides/governance/managing`, `guides/governance/testing`, `concepts/governance` | Maps to all three governance guide pages |
| `stable-memory` | `guides/backends/data-persistence`, `guides/canister-management/lifecycle`, `concepts/orthogonal-persistence` | Primary is data-persistence; lifecycle covers upgrade patterns |
| `vetkd` | `concepts/vetkeys`, `guides/security/data-integrity` | Primary is concepts/vetkeys; security/data-integrity for encryption use cases |
| `wallet-integration` | `guides/defi/wallet-integration` | Direct 1:1 mapping |
| `wallet` (alias) | (same as `cycles-management`) | Not a separate mapping needed |

## JS SDK to Docs Pages Mapping

| JS SDK Project | Docs Pages (should link to js.icp.build) | Where in page |
|---------------|----------------------------------------|---------------|
| **Core** (`@icp-sdk/core`) | `getting-started/quickstart` | "Install dependencies" section; link to https://js.icp.build/core |
| | `guides/tools/agentic-development` | Agent setup section; link to Core docs for HttpAgent |
| | `guides/frontends/frameworks` | JS framework integration; Core is the base dependency |
| | `guides/frontends/certification` | Client-side certificate verification uses Core |
| | `guides/canister-calls/candid` | Agent/actor creation from JS side |
| | `concepts/app-architecture` | Frontend-to-canister communication overview |
| **Auth** (`@icp-sdk/auth`) | `guides/authentication/internet-identity` | "Frontend integration" section; link to https://js.icp.build/auth |
| | `guides/defi/wallet-integration` | Auth prerequisites section |
| | `guides/frontends/frameworks` | Auth setup in React/Svelte/Vue apps |
| **Canisters** (`@icp-sdk/canisters`) | `guides/frontends/asset-canister` | "Programmatic uploads" section; link to https://js.icp.build/canisters |
| | `guides/defi/token-ledgers` | JS ledger actor usage examples |
| | `guides/defi/chain-key-tokens` | JS interaction with ckBTC/ckETH ledgers |
| | `guides/governance/managing` | JS governance actor for SNS management |
| **Pic JS** | `guides/testing/strategies` | "JavaScript testing" section; link to https://js.icp.build/pic-js |
| | `guides/testing/pocket-ic` | Pic JS is the JS wrapper for PocketIC |
| | `guides/governance/testing` | SNS testflight with Pic JS |
| **Bindgen** (`@icp-sdk/bindgen`) | `guides/canister-calls/binding-generation` | Primary page; link to https://js.icp.build/bindgen |
| | `guides/canister-calls/candid` | "Generating JS bindings" subsection |
| | `getting-started/project-structure` | Mention bindgen in project scaffolding |

## Gaps

### Skills with no direct docs page

| Skill | Gap | Recommendation |
|-------|-----|----------------|
| `ic-dashboard` | No dedicated docs page for dashboard APIs | Map to `guides/canister-management/canister-discovery` and mention in `reference/system-canisters`. Consider a short "Dashboard APIs" section in canister-discovery page. |
| `canister-security` | Covers many topics spread across 5+ pages | No single landing page. Consider linking from a `guides/security/` index or overview callout. |

### Docs pages with no skill coverage

| Docs Page | Missing Skill | Recommendation |
|-----------|--------------|----------------|
| `guides/backends/timers` | No `timers` skill | Create a `timers` skill or fold into existing skill. Covered in `concepts/timers` but no agent skill exists. |
| `guides/backends/randomness` | No `randomness` skill | Create a `randomness` skill. Covered in `concepts/onchain-randomness` but no agent skill exists. |
| `guides/canister-management/large-wasm` | No skill | Niche topic; may not need a skill. Document icp-cli `--wasm-chunk-store` flag. |
| `guides/canister-management/logs` | No skill | Could be a section in `icp-cli` skill or a new `canister-observability` skill. |
| `guides/canister-management/optimization` | No skill | Covered partially by `icp-cli` (ic-wasm). Consider adding optimization guidance to `icp-cli` skill. |
| `guides/canister-management/snapshots` | No skill | New IC feature; consider a `canister-snapshots` skill when stable. |
| `guides/canister-management/reproducible-builds` | No skill | Could be a section in `icp-cli` skill. |
| `guides/chain-fusion/solana` | No skill | No Solana integration skill exists. Create when Solana support is ready. |
| `guides/chain-fusion/dogecoin` | No skill | No Dogecoin skill. The `ckbtc` skill covers Bitcoin; Dogecoin may need its own. |
| `guides/defi/rosetta` | No skill | Rosetta API is specialized; consider a `rosetta` skill for exchange integration. |
| `guides/canister-management/subnet-selection` | No skill | Reference/informational page; may not need a skill. |
| `reference/*` (most pages) | No skills | Reference pages are lookups, not how-to guides. Skills are not expected here. |
| `concepts/*` (most pages) | No skills | Concept pages explain architecture; link to skills where relevant but concepts pages themselves do not need `icskills` frontmatter. |

### JS SDK gaps

| JS SDK Project | Gap |
|---------------|-----|
| Core | No dedicated "JS Agent" docs page in developer-docs. Core concepts (HttpAgent, identity, principal) are foundational but have no single page. |
| Auth | Well-covered by `guides/authentication/internet-identity`. No gap. |
| Canisters | No dedicated "JS canister interaction" page. Usage is spread across multiple guides. |
| Pic JS | Well-covered by `guides/testing/` pages. No gap. |
| Bindgen | Well-covered by `guides/canister-calls/binding-generation`. No gap. |

## Recommendations

### 1. Surfacing skills in docs pages

Add an `icskills` field to frontmatter of relevant docs pages:

```yaml
---
title: "Asset Canister"
icskills:
  - asset-canister
---
```

This enables:
- A "Related agent skills" callout box on each page linking to https://skills.internetcomputer.org/asset-canister
- Automated validation that skill references are valid
- AI agents to discover which skill to load for a given docs topic

### 2. JS SDK link placement

For each docs page that references JS SDK, add links in context:
- **Inline in code examples**: When showing JS code, link to the relevant js.icp.build project docs
- **"JS SDK" callout box**: For pages with significant JS content, add a callout linking to the specific project
- **Prerequisites section**: List the npm package and link to js.icp.build for API details

Standard link format per CLAUDE.md rules (link to https://js.icp.build, not versioned):
- `[Core library](https://js.icp.build/core)`
- `[Auth library](https://js.icp.build/auth)`
- `[Canisters library](https://js.icp.build/canisters)`
- `[Pic JS](https://js.icp.build/pic-js)`
- `[Bindgen](https://js.icp.build/bindgen)`

### 3. Priority new skills to create

1. **`timers`** -- Covers periodic and one-shot timers (concepts/timers, guides/backends/timers). High value since timers are common in production canisters.
2. **`randomness`** -- Covers onchain randomness via management canister (concepts/onchain-randomness, guides/backends/randomness). Important for games, lotteries, fair selection.
3. **`rosetta`** -- Covers Rosetta API for exchange integration (guides/defi/rosetta). Specialized but important for DeFi ecosystem.

### 4. Cross-reference pattern

For maximum developer utility, each guides/ page should have:
- `icskills` frontmatter listing relevant skills (for agent discovery)
- Inline links to js.icp.build where JS examples appear (for human developers)
- Links to external docs per CLAUDE.md rules (Rust CDK, Motoko core, icp-cli)

This creates a three-layer reference system:
1. **Agent skills** (icskills) -- for AI-assisted development
2. **JS SDK docs** (js.icp.build) -- for frontend/JS developers
3. **Language CDK docs** (docs.rs, mops.one) -- for backend developers
