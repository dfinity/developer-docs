# ICP Developer Documentation Restructuring Proposal

> **Date:** 2026-03-10 (v3.1 — open questions resolved)
> **Status:** Draft
> **Author:** Documentation Architecture Review (Claude Code analysis)
> **Scope:** Full audit of `dfinity/portal` docs + external sources; restructuring plan for a lean, agent-first developer-docs portal

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Audit of Current Portal](#2-audit-of-current-portal)
3. [External Source Analysis](#3-external-source-analysis)
4. [Key Decisions](#4-key-decisions)
5. [New Docs Portal: Architecture](#5-new-docs-portal-architecture)
6. [Content Structure](#6-content-structure)
7. [Content Sourcing & Sync Strategy](#7-content-sourcing--sync-strategy)
8. [Parallel Operation: Portal Tracking](#8-parallel-operation-portal-tracking)
9. [Agent-Friendly Documentation Design](#9-agent-friendly-documentation-design)
10. [Automation & CI/CD](#10-automation--cicd)
11. [Implementation Roadmap](#11-implementation-roadmap)
12. [Resolved Decisions](#12-resolved-decisions)
13. [Content Authoring Strategy](#13-content-authoring-strategy)
14. [Remaining Open Questions](#14-remaining-open-questions)

---

## 1. Executive Summary

The current ICP developer documentation (`dfinity/portal`) is a Docusaurus 2 site with ~350+ files, 6 git submodules, and 1,307 references to the deprecated `dfx` CLI across 137 files. It mixes developer docs with end-user guides, buries the IC's most compelling capabilities deep in navigation, and relies on custom JSX components that are opaque to AI agents.

**What we're building:** A lean, agent-first developer portal using **Astro + Starlight** with **plain `.md` files only**. The goal is simple: **get a developer (human or AI) building successfully on the IC as fast as possible.**

Core principles:

1. **Lean over comprehensive** — ~80-100 hand-written pages (+ synced language docs). No filler. Every page earns its place
2. **IC capabilities front and center** — Chain-key cryptography, VetKeys, HTTPS outcalls, timers, reverse gas model, randomness are the IC's superpowers. They deserve top-level prominence, not buried 4 levels deep
3. **Agentic development first** — Integrate with [icskills](https://github.com/dfinity/icskills) for agent-consumable skill files. Serve `llms.txt` and `llms-full.txt`. Structure everything for both human and AI readers
4. **Start from scratch** — Don't port the old portal. Write fresh content using icp-cli, linking to standalone docs where they exist
5. **Always latest** — No versioned docs. Sync language docs (Motoko, Rust CDK) on release
6. **Zero `dfx` references** — CI-enforced. The migration guide is the only exception
7. **Run in parallel** — The old portal stays live during transition. An agent tracks portal updates and flags content that needs reflecting in the new docs

---

## 2. Audit of Current Portal

### 2.1 What's Good

- **Comprehensive topic coverage:** Full developer journey from install to production
- **Code snippet sourcing** from actual source files via submodules or GitHub URLs
- **Style guide** with clear writing conventions
- **Deploy previews** on PRs, CODEOWNERS for review routing
- **SEO keywords** in frontmatter (~95% coverage)
- **Redirect system** with ~80+ managed redirects

### 2.2 What's Bad

**Critical:**
- **1,307 `dfx` references across 137 files** — pervasive, not patchable
- **~40-45 files directly replaced** by icp-cli's own docs
- **Custom JSX/MDX lock-in:** `<MarkdownChipRow>`, `<GlossaryTooltip>`, `<AdornedTabs>` — opaque to agents, non-portable, not renderable on GitHub
- **6 submodules** with painful maintenance

**Structural:**
- **IC capabilities buried:** Chain-key signatures, VetKeys, HTTPS outcalls, randomness — the IC's most differentiated features — are nested 3-4 levels deep under "Building Apps > Network Features". A developer landing on the docs has no idea these superpowers exist
- **950-line sidebar** with 4-5 levels of nesting
- **No canisters directory** — system canisters, protocol canisters, application canisters and their IDs are scattered or missing. Developers need a single reference to find canister IDs and Candid interfaces
- **No CLAUDE.md, AGENTS.md, or CONTRIBUTING.md** at root
- **No `llms.txt`** — agents can't efficiently discover or consume the docs

### 2.3 Content That Should NOT Be Carried Forward

#### DROP — Not Developer Content
| Content | Why |
|---------|-----|
| **NNS dapp usage guides** (12 files) | End-user content ("how to stake", "how to vote"). Belongs on NNS dapp help or Learn Hub |
| **Cycles wallet docs** | Self-deprecated. Cycles ledger replaces it |
| **dfxvm docs** (7 files) | dfx version manager dies with dfx |
| **Release notes** (19 files) | Historical archive. Link to GitHub releases |
| **Developer Liftoff** (Motoko + Rust, ~53 files) | Duplicate tutorial tracks with ~60% copy-pasted content. Replaced by lean getting-started + icskills |
| **Hackathon prep course** (10 files) | Overlaps with tutorials. Not needed in a lean portal |
| **"Best practices: General"** | Generic platitudes ("write clean code"). Not ICP-specific |
| **WSL troubleshooting** | Too niche. A note in prerequisites at most |

#### DROP — Replaced by icp-cli Docs
| Content | Replaced By |
|---------|------------|
| **All dfx command reference** (30+ files) | icp-cli CLI reference |
| **dfx.json reference** | icp-cli configuration reference |
| **Install/quickstart** (dfx-focused) | icp-cli install + quickstart |
| **Identity, cycles, tokens, deploy** workflows | icp-cli guides |

#### KEEP — Rewrite Fresh
| Content | Notes |
|---------|-------|
| **Building apps** (canisters, frontends, auth, inter-canister, testing) | Core how-tos. Rewrite with icp-cli |
| **Chain Fusion** (Bitcoin, Ethereum, Solana, Dogecoin) | Unique value prop. Unify under capabilities |
| **Security best practices** (12 files) | Critical. Keep all |
| **System canisters + management canister** | Essential reference. Improve with canister IDs table |
| **SNS/governance** (developer-facing) | Keep, trim to essentials |
| **DeFi** (tokens, ledgers, chain-key tokens) | Keep, update CLI references |

**Net result:** ~80-100 hand-written pages + ~50 synced language docs = **~130-150 total** (down from ~350+).

---

## 3. External Source Analysis

### 3.1 Source Relationship Summary

| Source | Has Standalone Docs? | Portal Role |
|--------|---------------------|-------------|
| **icp-cli** | Yes (dfinity.github.io/icp-cli/) | Link to it. Don't duplicate |
| **JS SDK** | Yes (js.icp.build) | Link to it. Don't duplicate |
| **icskills** | Yes (skills.internetcomputer.org) | **First-class integration.** Link prominently + serve as companion |
| **Motoko** | **No** standalone deployment | Portal IS the home. Sync on release |
| **Rust CDK** | **No** standalone deployment | Portal IS the home. Sync on release |
| **Learn Hub** | Yes (learn.internetcomputer.org) | Link for "how IC works" explainers |

### 3.2 icskills — Agent Skill Files

[dfinity/icskills](https://github.com/dfinity/icskills) is a collection of **agent-readable skill files** for ICP development. Each skill is a single Markdown file with YAML frontmatter, covering a specific topic (ckBTC, Internet Identity, HTTPS outcalls, etc.) with:
- Exact canister IDs
- Common pitfalls (each one = a hallucination prevented)
- Tested code examples
- Prerequisites and verification steps

**16 skills available today:** asset-canister, canister-security, certified-variables, ckbtc, evm-rpc, https-outcalls, ic-dashboard, icp-cli, icrc-ledger, internet-identity, multi-canister, sns-launch, stable-memory, vetkd, wallet-integration, wallet.

**Three consumption methods:**
1. `npx skills add dfinity/icskills` — works with 40+ AI agents
2. Raw fetch from GitHub
3. `llms.txt` / `llms-full.txt` / `.well-known/skills/index.json` endpoints

**Integration with the docs portal:**
- The docs portal explains **what** and **why**. icskills provides **agent-optimized implementation details**
- Every relevant docs page should link to its corresponding icskills skill file
- The portal's Getting Started section should prominently feature icskills setup
- The portal's `llms.txt` should reference icskills endpoints for agents

### 3.3 learn.internetcomputer.org (Learn Hub)
- **Purpose:** Higher-level educational content, "how it works" explainers
- **Recommendation:** Link for concepts. The developer portal should focus on "how to build", not "how the protocol works internally". When a developer needs to understand subnet consensus or node architecture, link to Learn Hub

### 3.4 caffeinelabs/motoko (Motoko Language Docs)
- **Canonical repo:** `caffeinelabs/motoko` (moved from `dfinity/motoko`)
- **Format:** Mix of `.md` and `.mdx` with Docusaurus conventions
- **Recommendation:** Sync language fundamentals and ICP features into portal on release. Convert `.mdx` → `.md` (strip JSX)
- **Base/core library:** Link to [mops.one/base](https://mops.one/base/docs) and [mops.one/core](https://mops.one/core/docs) rather than syncing. Note: `core` replaces `base` — a migration guide exists at `docs.internetcomputer.org/motoko/base-core-migration`
- **Related repos:** `caffeinelabs/motoko-base`, `caffeinelabs/motoko-core`

### 3.5 Rust CDK
- **No standalone docs deployment.** Best reference is [docs.rs/ic-cdk](https://docs.rs/ic-cdk/latest/ic_cdk/index.html)
- **Recommendation:** The portal provides how-to guides for Rust development on ICP. For API reference, link to docs.rs. Do not sync — write Rust CDK content directly in the portal

### 3.6 dfinity/icp-cli
- **Deployed at:** dfinity.github.io/icp-cli/ (Astro/Starlight, plain `.md`)
- **Recommendation:** Link prominently. Sync only the migration guide. Inline icp-cli commands in portal guides where it helps reading flow (see section 4.7)

### 3.7 dfinity/icp-js-sdk-docs
- **Deployed at:** js.icp.build (Astro/Starlight)
- **Recommendation:** Link prominently. Don't sync

---

## 4. Key Decisions

### 4.1 Framework: Astro + Starlight

**Decision:** Use Astro + Starlight, not Docusaurus.

- icp-cli, JS SDK, and icskills already use Astro — ecosystem alignment
- Faster builds, native TypeScript, better content collections
- Works great with plain `.md` files

### 4.2 Plain Markdown Only — No MDX

**Decision:** All content in `.md` files. No `.mdx`, no JSX.

- **GitHub-readable:** Contributors and agents can read docs without building the site
- **No framework lock-in:** Content is portable if we ever switch frameworks
- **Agent-friendly:** AI agents parse plain markdown perfectly; JSX is opaque
- **icp-cli already does this** and it works well

What replaces current JSX components:
| Current JSX | Replacement |
|-------------|------------|
| `<MarkdownChipRow labels={["Beginner"]} />` | Frontmatter: `level: beginner` |
| `<AdornedTabs groupId="language">` | Starlight built-in tabs or separate code blocks |
| `<GlossaryTooltip>canister</GlossaryTooltip>` | Standard link: `[canister](/references/glossary#canister)` |
| `import` statements | Nothing needed |

### 4.3 No Versioned Docs

**Decision:** Always show latest. No version switcher.

- Versioned docs multiply maintenance burden
- Tool-specific versioning lives in tool docs (icp-cli, JS SDK)
- Git history is the archive

### 4.4 Portal as Navigation Hub

Content the portal **hosts directly:** Getting started, building apps, IC capabilities, security, canisters reference, DeFi, governance, Motoko (synced), Rust CDK (synced), specs.

Content the portal **links to:** icp-cli, JS SDK, icskills, Learn Hub.

### 4.5 Release-Triggered Sync

Sync content from dependency repos on new releases via GitHub Actions → PR → CI validation → auto-merge.

| Source | Trigger | What Gets Synced |
|--------|---------|-----------------|
| `caffeinelabs/motoko` | New release tag | `doc/md/` → `content/languages/motoko/` (fundamentals + ICP features only, not base/core library) |
| icp-cli repo | New release tag | `docs/migration/` → `content/tools/migrating-from-dfx/` |

### 4.6 icp-cli Command Embedding

**Decision:** Inline icp-cli commands in portal guides where they help reading flow. Use existing icp-cli guides as the source of truth.

Rules for embedding:
- **If the guide is CLI-focused** (install, deploy, identity management) → it belongs in the icp-cli docs. Link to it from the portal
- **If the guide is concept-focused** (e.g., "how to deploy a canister to mainnet") → inline the relevant `icp` commands in the portal guide, but link to the full icp-cli guide for details
- **If an icp-cli guide is missing** for something we need → create it in the icp-cli repo, not in the portal. Then link or inline from the portal
- This means icp-cli docs remain the single source of truth for CLI usage, while the portal provides the conceptual wrapper

### 4.7 Agentic Development as Core Theme

The docs should guide developers toward using AI agents effectively on ICP:

- **icskills** is prominently featured in getting started and throughout
- Every capability page links to its icskills skill file when one exists
- `llms.txt` and `llms-full.txt` are generated on every build
- The docs-manifest and frontmatter schema are optimized for agent consumption
- Code examples are self-contained and copy-pasteable (agents need this)

### 4.8 Diátaxis Framework

**Decision:** Structure the docs following the [Diátaxis framework](https://diataxis.fr/) with strict separation of content types.

- **Getting Started** — tutorials (learning-oriented)
- **Guides** — how-to guides (task-oriented), grouped by topic
- **Concepts** — explanations (understanding-oriented)
- **Reference** — reference material (information-oriented)
- **Languages** — kept as a 5th section due to volume (55 pages) and upstream sync

This reduces the sidebar from 10 top-level sections to 5. Each page belongs to exactly one Diátaxis quadrant. The directory structure mirrors the navigation — files physically live under their section.

---

## 5. New Docs Portal: Architecture

### 5.1 Repository Structure

```
developer-docs/
├── .github/
│   └── workflows/
│       ├── sync-motoko.yml             # Triggered on caffeinelabs/motoko release
│       ├── sync-migration-guide.yml    # Triggered on icp-cli release
│       ├── track-portal-updates.yml    # Daily: check portal for changes
│       ├── freshness-check.yml         # Weekly stale content detection
│       └── build-and-deploy.yml        # Build, validate, deploy
├── src/
│   └── content/
│       └── docs/                       # All documentation (plain .md)
│           ├── getting-started/        # TUTORIALS
│           ├── guides/                 # HOW-TO GUIDES (Diátaxis)
│           │   ├── canisters/          # Lifecycle, settings, logs, optimization
│           │   ├── frontends/          # Asset canister, certification, custom domains
│           │   ├── authentication/     # Internet Identity, wallet integration
│           │   ├── inter-canister/     # Calls, Candid
│           │   ├── testing/            # Strategies, PocketIC
│           │   ├── chain-fusion/       # Bitcoin, Ethereum, Solana, Dogecoin
│           │   ├── defi/               # Token ledgers, chain-key tokens, Rosetta
│           │   ├── governance/         # Launching, managing, testing SNS
│           │   ├── security/           # Access, upgrades, DoS, integrity
│           │   └── tools/              # icp-cli overview, migration guide
│           ├── concepts/               # EXPLANATIONS (Diátaxis)
│           ├── languages/
│           │   ├── motoko/             # Synced from motoko repo
│           │   └── rust/               # Hand-written Rust CDK guide
│           └── reference/              # REFERENCE (Diátaxis)
├── scripts/
│   ├── sync-motoko.sh
│   ├── track-portal.sh                # Compare portal changes
│   ├── validate-frontmatter.ts
│   ├── validate-no-dfx.sh
│   ├── generate-manifest.ts
│   └── generate-llms-txt.ts           # Generate llms.txt + llms-full.txt
├── CLAUDE.md
├── AGENTS.md
├── CONTRIBUTING.md
├── astro.config.mjs
└── package.json
```

### 5.2 Key Differences from Current Portal

| Aspect | Current Portal | New Portal |
|--------|---------------|------------|
| Framework | Docusaurus 2 | Astro + Starlight |
| File format | `.mdx` (JSX required) | `.md` (plain markdown only) |
| Submodules | 6 submodules | 0 submodules (CI sync pipelines) |
| IC capabilities | Buried 3-4 levels deep | **Top-level section** |
| Canisters directory | Scattered | **Dedicated section with IDs and interfaces** |
| CLI docs | 30+ dfx command files | Link to dfinity.github.io/icp-cli/ |
| Agent integration | None | icskills links, `llms.txt`, `llms-full.txt` |
| Tutorial courses | 63 files (Liftoff + hackathon) | 4-page getting started + icskills |
| Content scope | ~350+ files (mixed) | ~80-100 hand-written + ~50 synced |
| Agent files | None | CLAUDE.md + AGENTS.md + CONTRIBUTING.md |
| Broken links | Warn only | Build failure |

---

## 6. Content Structure (Diátaxis)

The docs follow the [Diátaxis framework](https://diataxis.fr/) with 5 top-level sections. Each page belongs to exactly one content type. The directory structure mirrors the sidebar navigation.

### 6.1 Site Map

```
/docs
├── /getting-started                    # TUTORIALS: Learning-oriented
│   ├── quickstart                     # Install icp-cli, deploy hello world
│   ├── project-structure              # What icp-cli generated, how it works
│   ├── agentic-development            # Set up icskills, use AI agents on ICP
│   └── what-next                      # Choose your path
│
├── /guides                             # HOW-TO: Task-oriented guides
│   ├── /canisters
│   │   ├── lifecycle                  # Create, deploy, upgrade, delete
│   │   ├── settings                   # Controllers, memory, compute allocation
│   │   ├── logs                       # Monitoring and debugging
│   │   └── optimization               # Wasm size, cycle efficiency
│   ├── /frontends
│   │   ├── asset-canister             # Serving web assets
│   │   ├── custom-domains             # DNS setup
│   │   └── certification              # Response verification
│   ├── /authentication
│   │   ├── internet-identity
│   │   └── wallet-integration
│   ├── /inter-canister
│   │   ├── calls                      # Query vs update, composite queries
│   │   └── candid                     # Interface description language
│   ├── /testing
│   │   ├── pocket-ic
│   │   └── strategies                 # Unit, integration, e2e
│   ├── /chain-fusion
│   │   ├── bitcoin                    # ckBTC, threshold ECDSA signing
│   │   ├── ethereum                   # ckETH, EVM RPC
│   │   ├── solana                     # Threshold Schnorr
│   │   └── dogecoin                   # ckDOGE
│   ├── /defi
│   │   ├── token-ledgers              # ICP and ICRC ledger setup/usage
│   │   ├── chain-key-tokens           # ckBTC, ckETH, ckERC20
│   │   └── rosetta                    # Rosetta API integration
│   ├── /governance
│   │   ├── launching                  # SNS launch walkthrough
│   │   ├── managing                   # Post-launch operations
│   │   └── testing                    # Pre-launch validation
│   ├── /security
│   │   ├── access-management
│   │   ├── canister-upgrades
│   │   ├── data-integrity
│   │   ├── dos-prevention
│   │   └── inter-canister-calls
│   └── /tools
│       ├── overview                   # icp-cli, JS SDK, agents, community tools
│       └── migrating-from-dfx        # Synced from icp-cli
│
├── /concepts                           # EXPLANATION: Understanding-oriented
│   ├── network-overview               # Subnets, nodes, boundary nodes, consensus
│   ├── app-architecture               # Frontend + backend pattern, request flow
│   ├── canister-types                 # System vs protocol vs application canisters
│   ├── chain-key-cryptography         # Threshold ECDSA, Schnorr, chain-key signatures
│   ├── vetkeys                        # Verifiable encrypted threshold keys
│   ├── https-outcalls                 # Call any Web2 API from a canister
│   ├── onchain-randomness             # Verifiable random function
│   ├── timers                         # Autonomous canister execution
│   ├── reverse-gas-model              # Canisters pay, users don't
│   ├── orthogonal-persistence         # Stable memory, upgrades, snapshots
│   ├── chain-fusion                   # Multi-chain overview
│   ├── governance                     # SNS architecture and lifecycle
│   └── security                       # Threat model and security areas
│
├── /languages                          # Language-specific content
│   ├── /motoko                        # Synced from caffeinelabs/motoko on release
│   │   ├── fundamentals/             # Language basics (43 pages)
│   │   ├── icp-features/             # ICP-specific features (6 pages)
│   │   └── reference/                # Grammar, error codes, changelog (3 pages)
│   └── /rust                          # Hand-written Rust CDK guide
│
└── /reference                          # REFERENCE: Information-oriented
    ├── management-canister            # aaaaa-aa API reference
    ├── system-canisters               # NNS canister IDs and operations
    ├── protocol-canisters             # Bitcoin, II, cycles ledger, etc.
    ├── application-canisters          # EVM RPC, exchange rate, etc.
    ├── token-standards                # ICRC-1, ICRC-2, ICRC-7, ICRC-37
    ├── cycles-costs                   # Cycle pricing for all operations
    ├── execution-errors               # Common error codes and solutions
    ├── ic-interface-spec              # IC protocol specification
    ├── http-gateway-spec              # HTTP gateway protocol
    ├── candid-spec                    # Candid IDL specification
    ├── internet-identity-spec         # II protocol specification
    └── glossary                       # ICP terminology
```

### 6.2 Design Rationale

**Diátaxis separation:** Each top-level section maps to one Diátaxis quadrant. Tutorials (Getting Started), how-to guides (Guides), explanations (Concepts), and reference (Reference). A developer always knows where to look: "How do I do X?" → Guides. "What is X?" → Concepts. "What are the exact parameters?" → Reference.

**5 sections, not 10:** The previous structure had 10 top-level sections (Getting Started, IC Capabilities, Building Apps, Canisters, DeFi, Governance, Security, Languages, Tools, References). Feedback from DFINITY engineers flagged this as "too many arbitrary groupings." The Diátaxis model consolidates to 5.

**Guides sub-groups:** The Guides section uses topic sub-groups (Canisters, Frontends, Chain Fusion, DeFi, Security, etc.) to keep 38 pages navigable. Each sub-group is self-contained — a developer working on DeFi sees all DeFi how-tos together.

**Languages as a 5th section:** With 55 pages (53 Motoko + 2 Rust) and an automated sync pipeline, language docs earn their own section rather than being split across Concepts and Reference.

**No tutorial courses:** The Developer Liftoff (53 files) and hackathon prep (10 files) are replaced by a 4-page getting started + icskills for hands-on learning.

### 6.3 Page Count

| Section | Pages |
|---------|-------|
| Getting Started | 4 |
| Guides | 38 |
| Concepts | 13 |
| Languages (Motoko synced + Rust) | 55 |
| Reference | 12 |
| **Total** | **122** |

### 6.4 Canister Reference Content

The `/reference/` section includes dedicated pages for canister types with IDs, Candid interfaces, and common operations. See §6.1 for the full list. Key canister IDs:

| Canister | ID |
|----------|-----|
| Management Canister | `aaaaa-aa` |
| ICP Ledger | `ryjl3-tyaaa-aaaaa-aaaba-cai` |
| NNS Governance | `rrkah-fqaaa-aaaaa-aaaaq-cai` |
| Internet Identity | `rdmx6-jaaaa-aaaaa-aaadq-cai` |
| Bitcoin Mainnet | `ghsi2-tqaaa-aaaan-aaaca-cai` |
| Cycles Ledger | `um5iw-rqaaa-aaaaq-qaaba-cai` |
| EVM RPC | `7hfb6-caaaa-aaaar-qadga-cai` |

### 6.5 What's NOT in This Structure

- **No CLI command reference** — lives at dfinity.github.io/icp-cli/
- **No JS SDK API reference** — lives at js.icp.build
- **No tutorial courses** (Developer Liftoff, hackathon prep) — replaced by lean getting started + icskills
- **No NNS dapp usage guides** — end-user content
- **No cycles wallet / dfxvm docs** — deprecated
- **No release notes** — link to GitHub releases
- **No generic best practices** — only ICP-specific guidance

---

## 7. Content Sourcing & Sync Strategy

### 7.1 Sync Architecture

```
Source Repo                    developer-docs
┌─────────────────┐           ┌─────────────────────────┐
│ caffeinelabs/    │  release  │                         │
│ motoko           │─────────→│ sync-motoko.yml          │
│  └─ doc/md/      │  trigger  │  → scripts/sync-motoko  │
└─────────────────┘           │  → PR → CI → auto-merge │
                              │                         │
┌─────────────────┐           │                         │
│ dfinity/         │  release  │                         │
│ icp-cli          │─────────→│ sync-migration-guide.yml │
│  └─ docs/        │  trigger  │  → PR → CI → auto-merge │
└─────────────────┘           │                         │
                              │                         │
┌─────────────────┐  daily    │                         │
│ dfinity/portal   │─────────→│ track-portal-updates.yml │
│ (old docs)       │  diff     │  → issue if changes     │
└─────────────────┘           └─────────────────────────┘
```

Note: Rust CDK is **not synced** — Rust how-tos are hand-written in the portal, API reference links to [docs.rs/ic-cdk](https://docs.rs/ic-cdk/latest/ic_cdk/index.html).

### 7.2 Sync Transform Rules

**Motoko docs** (`.mdx` → `.md`):
1. Sync only `fundamentals/`, `icp-features/`, and `reference/` — NOT base/core library
2. Strip `import` statements and JSX components
3. Convert `<Tabs>` to Starlight tab syntax or separate code blocks
4. Add `source_repo` and `source_ref` frontmatter
5. Rewrite relative links; add links to [mops.one/core](https://mops.one/core/docs) for library references
6. Validate: links, frontmatter schema, no orphans

**icp-cli migration guide** (`.md` → `.md`):
1. Copy `docs/migration/` → `content/tools/migrating-from-dfx/`
2. Add portal-specific frontmatter

---

## 8. Parallel Operation: Portal Tracking

During the transition period, `dfinity/portal` remains the live documentation site. The new `developer-docs` repository must track changes in the portal to ensure no important updates are lost.

### 8.1 Strategy

A **daily GitHub Actions workflow** in `developer-docs` monitors the portal for changes:

```yaml
# .github/workflows/track-portal-updates.yml
name: Track Portal Updates
on:
  schedule:
    - cron: '0 8 * * *'  # Daily at 8am UTC
  workflow_dispatch:

jobs:
  track:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Check portal for recent changes
        run: |
          # Clone portal, get commits since last check
          git clone --shallow-since="2 days ago" https://github.com/dfinity/portal.git /tmp/portal
          cd /tmp/portal

          # Get changed doc files
          git log --since="1 day ago" --name-only --pretty=format:"" -- docs/ \
            | sort -u | grep -v '^$' > /tmp/changed-files.txt

          # If changes found, create/update tracking issue
          if [ -s /tmp/changed-files.txt ]; then
            echo "Portal docs changed in the last 24h:"
            cat /tmp/changed-files.txt
            # Create GitHub issue with changed files list
          fi
```

### 8.2 Agent Instructions for Portal Tracking

The `CLAUDE.md` file includes instructions for agents to handle portal updates:

```markdown
## Portal tracking

The old portal (dfinity/portal) is still live during transition. When a GitHub issue
is created by the `track-portal-updates` workflow:

1. Read the changed files listed in the issue
2. Determine if the change is relevant to the new docs:
   - Content updates to topics we cover → flag for rewrite
   - New content → evaluate if it belongs in the new portal
   - dfx-only changes → ignore (we use icp-cli)
   - JSX/component changes → ignore (we use plain .md)
3. If relevant: create a task issue with the content to update
4. If not relevant: close the tracking issue with a note
```

### 8.3 Transition Criteria

The old portal can be retired when:
- [ ] All "KEEP" content has been rewritten in the new portal
- [ ] Language docs sync pipelines are running
- [ ] Redirects from old URLs are in place
- [ ] Search indexes the new site
- [ ] No portal tracking issues have been relevant for 2+ weeks

---

## 9. Agent-Friendly Documentation Design

### 9.1 The Agent Stack

The ICP developer ecosystem now has three layers of agent-consumable content:

```
┌─────────────────────────────────────────┐
│  llms.txt / llms-full.txt               │  ← Site-level: curated index
│  (generated on every docs build)         │     for agents to discover content
├─────────────────────────────────────────┤
│  Developer Docs (.md files)              │  ← Content-level: human + agent
│  + docs-manifest.json                    │     readable documentation
├─────────────────────────────────────────┤
│  icskills (SKILL.md files)               │  ← Implementation-level: agent-optimized
│  skills.internetcomputer.org             │     skill files with tested code,
│  npx skills add dfinity/icskills         │     canister IDs, pitfall warnings
└─────────────────────────────────────────┘
```

**These complement each other:**
- An agent reads `llms.txt` to understand what docs exist and fetch relevant pages
- The docs explain concepts, architecture, and workflows (for humans + agents)
- icskills provides implementation-ready code and prevents hallucinations (for agents primarily)

### 9.2 llms.txt

**Yes, we need `llms.txt`.** It's an emerging standard adopted by Anthropic, Cloudflare, Vercel, Next.js, Hugging Face, and 1,400+ other sites. It provides a curated Markdown index at `/llms.txt` that helps LLMs efficiently discover and consume site content.

Generated on every build:

```markdown
# ICP Developer Documentation

> Build on the Internet Computer — the world's fastest and most powerful blockchain.
> Canisters (smart contracts) run WebAssembly, pay their own gas (reverse gas model),
> and can natively sign transactions on Bitcoin, Ethereum, and other chains via
> chain-key cryptography. Use icp-cli to develop and deploy.

## Getting Started
- [Quickstart](/getting-started/quickstart.md): Install icp-cli and deploy your first canister
- [Agentic Development](/getting-started/agentic-development.md): Set up icskills for AI-assisted ICP development

## IC Capabilities
- [Chain-Key Cryptography](/capabilities/chain-key-cryptography.md): Threshold ECDSA and Schnorr signatures
- [VetKeys](/capabilities/vetkeys.md): Verifiable encrypted threshold key derivation
- [HTTPS Outcalls](/capabilities/https-outcalls.md): Call any Web2 API from a canister
- [On-Chain Randomness](/capabilities/onchain-randomness.md): Verifiable random function
- [Timers](/capabilities/timers.md): Autonomous canister execution
- [Reverse Gas Model](/capabilities/reverse-gas-model.md): Canisters pay, users don't
- [Chain Fusion](/capabilities/chain-fusion/overview.md): Multi-chain integration

## Building Apps
- [Canister Lifecycle](/building-apps/canisters/lifecycle.md): Create, deploy, upgrade, delete
- [Internet Identity](/building-apps/authentication/internet-identity.md): User authentication
- [Inter-Canister Calls](/building-apps/inter-canister/calls.md): Cross-canister communication

## Canisters
- [Management Canister](/canisters/management-canister.md): aaaaa-aa — the API for canister operations
- [System Canisters](/canisters/system-canisters.md): ICP ledger, NNS governance, cycles minting
- [Protocol Canisters](/canisters/protocol-canisters.md): Internet Identity, Bitcoin, exchange rate

## Security
- [Security Overview](/security/overview.md): Secure canister development

## References
- [IC Interface Spec](/references/ic-interface-spec.md): The protocol specification
- [Candid Spec](/references/candid-spec.md): Interface description language
- [Cycles Costs](/references/cycles-costs.md): Pricing reference

## External Resources
- [icp-cli Documentation](https://dfinity.github.io/icp-cli/): CLI tool for ICP development
- [JavaScript SDK](https://js.icp.build): JS/TS libraries for ICP
- [icskills](https://skills.internetcomputer.org): Agent skill files for ICP development
- [Learn Hub](https://learn.internetcomputer.org): How the Internet Computer works

## Optional
- [Glossary](/references/glossary.md)
- [Execution Errors](/references/execution-errors.md)
```

Additionally, `llms-full.txt` concatenates all doc content into a single file for complete context injection.

### 9.3 Frontmatter Schema

```yaml
---
title: "Chain-Key Cryptography"
description: "Sign transactions on Bitcoin, Ethereum, and other chains using threshold signatures"
doc_type: explanation       # tutorial | how-to | reference | explanation
level: intermediate         # beginner | intermediate | advanced
features: [chain-key, threshold-ecdsa, threshold-schnorr]
icskills: [ckbtc, evm-rpc]  # Related icskills skill files
last_verified: 2026-03-01
source_repo: null            # If synced, source repo URL
source_ref: null             # If synced, git ref
---
```

The `icskills` frontmatter field links docs pages to their corresponding skill files. On the rendered page, this shows as: "Agent skills: [ckBTC](https://skills.internetcomputer.org/skills/ckbtc/) | [EVM RPC](https://skills.internetcomputer.org/skills/evm-rpc/)"

### 9.4 docs-manifest.json

Auto-generated on every build:

```json
{
  "version": "1.0.0",
  "last_updated": "2026-03-10T00:00:00Z",
  "base_url": "https://docs.internetcomputer.org",
  "llms_txt": "/llms.txt",
  "llms_full_txt": "/llms-full.txt",
  "external_docs": {
    "icp-cli": "https://dfinity.github.io/icp-cli/",
    "js-sdk": "https://js.icp.build",
    "icskills": "https://skills.internetcomputer.org",
    "learn-hub": "https://learn.internetcomputer.org"
  },
  "pages": [...]
}
```

### 9.5 CLAUDE.md

```markdown
# ICP Developer Docs

## What this repo is
ICP developer documentation built with Astro + Starlight.
All content is plain .md files. Goal: get developers building on IC fast.

## Key directories
- `src/content/docs/` — All documentation (.md only)
- `src/content/docs/languages/` — Auto-synced from language repos (do not edit directly)
- `src/content/docs/tools/migrating-from-dfx/` — Auto-synced from icp-cli repo
- `scripts/` — Sync and validation scripts

## Rules
- NEVER reference `dfx` (deprecated). Use icp-cli. CI rejects dfx references.
- All docs must have complete frontmatter (see CONTRIBUTING.md)
- Synced content (`source_repo` in frontmatter) — edits go to source repo
- Max sidebar nesting: 3 levels
- All code examples must be self-contained and copy-pasteable
- No .mdx files. No JSX. Plain markdown only.
- Link to dfinity.github.io/icp-cli/ for CLI details
- Link to icskills (skills.internetcomputer.org) for agent skill files

## Agent development
- icskills repo: https://github.com/dfinity/icskills
- Install skills: `npx skills add dfinity/icskills`
- Skills site: https://skills.internetcomputer.org

## External docs (don't duplicate)
- icp-cli: https://dfinity.github.io/icp-cli/
- JS SDK: https://js.icp.build
- icskills: https://skills.internetcomputer.org
- Learn Hub: https://learn.internetcomputer.org

## Portal tracking
The old portal (dfinity/portal) is still live. A daily workflow tracks changes.
When reviewing tracking issues: ignore dfx-only and JSX changes, flag content updates.

## Commands
- `npm run dev` — Local dev server
- `npm run build` — Production build (also generates llms.txt, llms-full.txt, manifest)
- `npm run validate` — All validation checks
- `npm run sync:motoko` — Sync Motoko docs from caffeinelabs/motoko
```

---

## 10. Automation & CI/CD

### 10.1 PR Checks (every PR)

| Check | Fails Build? |
|-------|-------------|
| `astro build` succeeds | Yes |
| No broken internal links | Yes |
| No `dfx` references (except migration guide) | Yes |
| Frontmatter schema valid | Yes |
| Max 3 sidebar levels | Yes |
| No `.mdx` files | Yes |
| `llms.txt` generated successfully | Yes |

### 10.2 Automated Syncs (event-driven)

| Source | Trigger | Pipeline |
|--------|---------|----------|
| `caffeinelabs/motoko` | New release tag | Clone → transform `.mdx` → `.md` (fundamentals + ICP features only) → PR |
| `dfinity/icp-cli` | New release tag | Clone `docs/migration/` → PR |

### 10.3 Scheduled Jobs

| Job | Schedule | Action |
|-----|----------|--------|
| Portal tracking | Daily | Diff portal changes → issue if relevant |
| Freshness check | Weekly | Flag docs with `last_verified` > 90 days → issue |
| External link check | Weekly | Check all external URLs for 404s |

### 10.4 Build Outputs

Every deploy generates:
- Static site (Astro build)
- `/llms.txt` — curated index for LLMs
- `/llms-full.txt` — all content concatenated
- `/docs-manifest.json` — machine-readable site map
- `/sitemap.xml` — standard sitemap

---

## 11. Implementation Roadmap

### Phase 1: Foundation (Week 1)
- [ ] Initialize Astro + Starlight project
- [ ] Create CLAUDE.md, AGENTS.md, CONTRIBUTING.md
- [ ] Set up CI (build, link check, dfx guard, frontmatter validation, llms.txt generation)
- [ ] Write Getting Started (4 pages: quickstart, project structure, agentic dev, what-next)
- [ ] Set up portal tracking workflow

### Phase 2: Capabilities & Core (Weeks 2-4)
- [ ] Write IC Capabilities section (14-16 pages — the "wow" factor)
- [ ] Write Building Apps how-tos (14-16 pages, fresh with icp-cli)
- [ ] Write Canisters directory (5 pages with all IDs and interfaces)
- [ ] Write Security section (6 pages)

### Phase 3: Specialized Content + Sync (Weeks 5-7)
- [ ] Write DeFi section (4-6 pages)
- [ ] Write Governance/SNS section (4 pages)
- [ ] Write Rust CDK how-tos (5-8 pages, linking to docs.rs for API reference)
- [ ] Build Motoko sync pipeline (`caffeinelabs/motoko` → fundamentals + ICP features) + initial sync
- [ ] Build icp-cli migration sync pipeline

### Phase 4: References & Launch (Weeks 8-10)
- [ ] Write References section (specs, costs, glossary)
- [ ] Set up redirects from old portal URLs
- [ ] Full link audit
- [ ] Test `llms.txt` with actual agents (Claude, Cursor, etc.)
- [ ] Soft launch (both portals live)
- [ ] Retire old portal when transition criteria met

---

## 12. Resolved Decisions

Previously open questions, now resolved:

| Question | Decision |
|----------|----------|
| **Motoko canonical repo** | `caffeinelabs/motoko` (moved from `dfinity/motoko`) |
| **Rust CDK docs** | Hand-written how-tos in portal. API reference links to [docs.rs/ic-cdk](https://docs.rs/ic-cdk/latest/ic_cdk/index.html). No sync pipeline needed |
| **Motoko base/core library** | Link to [mops.one/core](https://mops.one/core/docs) and [mops.one/base](https://mops.one/base/docs). `core` replaces `base` — migration guide at `docs.internetcomputer.org/motoko/base-core-migration`. Source repos: `caffeinelabs/motoko-core`, `caffeinelabs/motoko-base` |
| **Domain** | `docs.internetcomputer.org` (already deployed). Marketing site is separate — no conflict |
| **Search** | Keep **Kapa.ai** for AI-powered Q&A. **Drop the custom search canister** (`5qden-jqaaa-aaaam-abfpa-cai`) — adds deployment complexity without clear advantage over Kapa. Kapa should index the new portal + linked external docs (icp-cli, JS SDK, icskills) |
| **icskills mapping** | No forced 1:1 coverage. Link to icskills where relevant. The `icskills` frontmatter field is optional |
| **NNS dapp guides** | Not carried forward. End-user content (12 files: staking, voting, neuron management) |
| **Ecosystem/community pages** | Already deprecated and redirected. Not carried forward |
| **CLI command embedding** | Inline icp-cli commands where they help reading flow. icp-cli docs remain the source of truth. Missing guides → create in icp-cli first, then link from portal (see section 4.6) |

---

## 13. Content Authoring Strategy

### 13.1 Who Writes

**Agents draft, humans review.** The ~60-80 hand-written pages are drafted by AI agents using the current portal content as source material. Each page must be:

1. **Verified against current portal content** — extract and rewrite, don't invent
2. **Written with icp-cli commands** — no dfx references (CI-enforced)
3. **Cross-referenced with icskills** — link to skill files where they exist
4. **Validated by the relevant team** before publish

### 13.2 Review Ownership

Based on the current portal's CODEOWNERS, review routing for the new docs:

| Section | Review Team |
|---------|------------|
| All docs (default) | `@dfinity/editorial` |
| `/security/` | `@dfinity/product-security` + `@dfinity/editorial` |
| `/defi/`, `/defi/chain-key-tokens/` | `@dfinity/defi` + `@dfinity/editorial` |
| `/capabilities/chain-fusion/` | `@dfinity/defi` + `@dfinity/editorial` |
| `/capabilities/timers`, execution-related | `@dfinity/team-dsm` + `@dfinity/editorial` |
| `/building-apps/frontends/custom-domains/` | `@dfinity/boundary-node` + `@dfinity/editorial` |
| `/building-apps/frontends/certification` | `@dfinity/trust` + `@dfinity/editorial` |
| `/references/ic-interface-spec`, `/references/http-gateway-spec` | `@dfinity/interface-spec` + `@dfinity/team-dsm` + `@dfinity/consensus` |
| `/languages/motoko/` (synced) | `@dfinity/languages` |
| `/tools/` (CLI-related) | `@dfinity/dx` + `@dfinity/editorial` |

### 13.3 Agent Instructions for Content Drafting

Each content page should be drafted with this workflow:

```
Agent workflow for drafting a docs page:

1. Read the corresponding page(s) from the old portal (dfinity/portal/docs/)
2. Read any related icskills skill file for accurate canister IDs and code patterns
3. Rewrite the content:
   - Use icp-cli commands (never dfx)
   - Use plain markdown (never JSX/MDX components)
   - Add complete frontmatter (title, description, doc_type, level, features, icskills)
   - Ensure code examples are self-contained and copy-pasteable
   - Link to icp-cli docs for detailed CLI workflows
   - Link to mops.one for Motoko library references
   - Link to docs.rs for Rust CDK API reference
   - Link to Learn Hub for protocol internals
4. Validate: no dfx references, valid frontmatter, no broken links
5. Submit for review by the relevant team (see CODEOWNERS)
```

---

## 14. Remaining Open Questions

1. **Kapa.ai multi-site indexing:** Can Kapa index the portal + icp-cli + JS SDK + icskills as a unified knowledge base? Or does each site need separate config?

2. **Motoko sync scope:** Which specific directories in `caffeinelabs/motoko/doc/md/` contain "fundamentals" and "ICP features" vs "base/core library"? Need exact include/exclude paths for the sync script.

3. **Redirect mapping:** The old portal has ~80+ redirects. How many old URLs need redirects to the new site? Full audit needed before launch.

---

## Appendix A: icskills Integration Map

Mapping between docs pages and icskills skill files:

| Docs Page | icskills Skill |
|-----------|---------------|
| `/capabilities/chain-key-cryptography` | `ckbtc`, `evm-rpc` |
| `/capabilities/vetkeys` | `vetkd` |
| `/capabilities/https-outcalls` | `https-outcalls` |
| `/building-apps/authentication/internet-identity` | `internet-identity` |
| `/building-apps/authentication/wallet-integration` | `wallet-integration`, `wallet` |
| `/building-apps/frontends/asset-canister` | `asset-canister` |
| `/building-apps/canisters/lifecycle` | `stable-memory`, `multi-canister` |
| `/defi/token-ledgers` | `icrc-ledger` |
| `/defi/chain-key-tokens` | `ckbtc` |
| `/governance/launching` | `sns-launch` |
| `/security/overview` | `canister-security`, `certified-variables` |
| `/tools/overview` | `icp-cli`, `ic-dashboard` |

## Appendix B: Current Portal dfx Reference Density

| Area | Files | dfx Mentions |
|------|-------|-------------|
| Tutorials | 53 | ~400 |
| Building Apps | 74 | ~600 |
| DeFi | 11 | ~70 |
| References | 11 | ~60 |
| Release Notes | 19 | ~100 |
| Build on BTC | 3 | ~30 |
| **Total** | **137** | **~1,307** |

## Appendix C: IC Capabilities — Current vs New Visibility

| Capability | Current Portal Location (clicks from root) | New Portal Location |
|-----------|-------------------------------------------|-------------------|
| Threshold ECDSA | Building Apps > Network Features > Signatures > t-ECDSA (4) | `/capabilities/chain-key-cryptography` (1) |
| VetKeys | Building Apps > Network Features > VetKeys > Introduction (4) | `/capabilities/vetkeys` (1) |
| HTTPS Outcalls | Building Apps > Network Features > Using HTTP > HTTPS Outcalls > Overview (5) | `/capabilities/https-outcalls` (1) |
| Randomness | Building Apps > Network Features > Randomness (3) | `/capabilities/onchain-randomness` (1) |
| Timers | Building Apps > Network Features > Periodic Tasks (3) | `/capabilities/timers` (1) |
| Reverse Gas | Building Apps > Essentials > Gas Cost (3) | `/capabilities/reverse-gas-model` (1) |
| Chain Fusion | Building Apps > Chain Fusion > Overview (3) | `/capabilities/chain-fusion/overview` (2) |
