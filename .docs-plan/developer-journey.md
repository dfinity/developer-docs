# Developer Journey: Zero to Production

## Journey Map

### Stage 1: Discovery — "What is ICP? Why should I build here?"

**Developer mindset:** Evaluating the platform. Wants to understand differentiators quickly.

| Need | Docs page(s) | External docs | icskills |
|------|-------------|---------------|----------|
| Platform overview | concepts/network-overview.md | [Learn Hub](https://learn.internetcomputer.org) | — |
| Architecture model | concepts/app-architecture.md | Learn Hub | — |
| What are canisters? | concepts/canisters.md | Learn Hub | — |
| Unique capabilities at a glance | concepts/chain-key-cryptography.md, concepts/orthogonal-persistence.md, concepts/reverse-gas-model.md | Learn Hub | — |
| Cross-chain story | concepts/chain-fusion.md | Learn Hub | — |

**Key insight:** A developer in discovery mode reads 1-3 concept pages and decides whether to try the quickstart. The concepts/ section must have strong opening paragraphs that answer "why should I care?" within 30 seconds.

---

### Stage 2: Setup — Install tools, scaffold first project

**Developer mindset:** Committed to trying ICP. Wants to go from zero to running code in < 10 minutes.

| Need | Docs page(s) | External docs | icskills |
|------|-------------|---------------|----------|
| Install icp-cli, scaffold project | getting-started/quickstart.md | [icp-cli docs](https://dfinity.github.io/icp-cli/) | — |
| Understand project files | getting-started/project-structure.md | icp-cli docs (project structure) | — |
| AI-assisted development | guides/tools/agentic-development.md | [icskills](https://skills.internetcomputer.org) | All 17 skills |
| Choose next steps | getting-started/what-next.md | — | — |

**Templates used:** `hello-world` (default), potentially `bitcoin-starter` for chain-fusion interest.

**Recipes relevant:** Rust recipe, Motoko recipe (depending on language choice).

**Key insight:** The quickstart must use a single icp-cli template and get the developer to a deployed local canister with a working frontend. No forks, no decisions. The "what-next" page is the critical routing page that sends developers into guides/ based on their goal.

---

### Stage 3: Backend Development — Write canister code

**Developer mindset:** Building their first real feature. Needs patterns, not concepts.

| Need | Docs page(s) | External docs | icskills |
|------|-------------|---------------|----------|
| Data storage patterns | guides/backends/data-persistence.md | — | `icp-canister-data-storage` |
| HTTP requests from canisters | guides/backends/https-outcalls.md | — | `icp-https-outcalls` |
| Scheduled tasks | guides/backends/timers.md | — | `icp-timers` |
| Randomness | guides/backends/randomness.md | — | `icp-randomness` |
| Certified responses | guides/backends/certified-variables.md | — | `icp-certified-variables` |
| Calling other canisters | guides/canister-calls/onchain-calls.md, guides/canister-calls/candid.md | — | `icp-inter-canister-calls` |
| Language reference | languages/motoko/ or languages/rust/ | [Motoko core](https://mops.one/core/docs), [Rust CDK](https://docs.rs/ic-cdk/latest/ic_cdk/) | — |

**Key insight:** This is where developers spend 80% of their time. Every guide must have copy-pasteable code for both Rust and Motoko. Link to the relevant icskill at the top of each guide so AI agents can assist.

---

### Stage 4: Frontend Development — Build UI, connect to canister

**Developer mindset:** Has a working backend, wants to wire up a UI.

| Need | Docs page(s) | External docs | icskills |
|------|-------------|---------------|----------|
| Calling canisters from apps | guides/canister-calls/offchain-calls.md | [JS SDK](https://js.icp.build), [Rust agent](https://docs.rs/ic-agent) | — |
| Asset canister setup | guides/frontends/asset-canister.md | icp-cli docs | `icp-asset-canister` |
| Framework integration | guides/frontends/frameworks.md | [JS SDK](https://js.icp.build) | — |
| Custom domains | guides/frontends/custom-domains.md | — | — |
| User login | guides/authentication/internet-identity.md | — | `icp-internet-identity` |
| Wallet connection | guides/defi/wallet-integration.md | — | — |
| Response verification | guides/frontends/certification.md | — | — |

**Templates used:** `react-starter`, `vanilla-js-starter`.

**Key insight:** Not all developers need this stage (backend-only developers skip it). The asset canister page is the entry point; it should link clearly to authentication as the natural next step after "I have a UI."

---

### Stage 5: Testing — Validate before deployment

**Developer mindset:** Code works locally, wants confidence before spending cycles on mainnet.

| Need | Docs page(s) | External docs | icskills |
|------|-------------|---------------|----------|
| Testing approaches | guides/testing/strategies.md | — | — |
| PocketIC integration tests | guides/testing/pocket-ic.md | — | `icp-pocket-ic-testing` |
| Canister logs (debugging) | guides/canister-management/logs.md | icp-cli docs | — |

**Key insight:** Testing is often skipped by developers in a rush. The strategies page should make a strong case for why testing matters on ICP (upgrades are irreversible, cycles cost money). PocketIC is the primary testing tool and needs thorough coverage.

---

### Stage 6: Deployment — Ship to mainnet

**Developer mindset:** Ready to go live. Needs to understand cycles, subnets, and the deployment command.

| Need | Docs page(s) | External docs | icskills |
|------|-------------|---------------|----------|
| Cycles acquisition + management | guides/canister-management/cycles-management.md | icp-cli docs | `icp-cycles-management` |
| Subnet selection | guides/canister-management/subnet-selection.md | — | — |
| Canister settings for prod | guides/canister-management/settings.md | icp-cli docs | — |
| Reproducible builds | guides/canister-management/reproducible-builds.md | — | — |
| Canister lifecycle (install, upgrade) | guides/canister-management/lifecycle.md | icp-cli docs | `icp-canister-lifecycle` |

**Key insight:** This is the highest-anxiety stage. Developers worry about costs, irreversible mistakes, and configuration errors. The cycles-management page is the single most important page here -- it must answer "how much will this cost me?" directly.

---

### Stage 7: Production — Monitor, manage, secure

**Developer mindset:** Live on mainnet. Needs operational guides.

| Need | Docs page(s) | External docs | icskills |
|------|-------------|---------------|----------|
| Security hardening | guides/security/ (all 5 pages) | — | `icp-canister-security` |
| Wasm optimization | guides/canister-management/optimization.md | — | — |
| Canister snapshots / backup | guides/canister-management/snapshots.md | — | — |
| Monitoring via logs | guides/canister-management/logs.md | icp-cli docs | — |

**Key insight:** Security guides should be written as checklists, not essays. A developer going to production wants "did I forget anything?" not "here is the theory of access control."

---

### Stage 8: Advanced — Chain fusion, DeFi, governance

**Developer mindset:** Experienced ICP developer exploring platform-specific capabilities.

| Need | Docs page(s) | External docs | icskills |
|------|-------------|---------------|----------|
| Bitcoin integration | guides/chain-fusion/bitcoin.md | — | `icp-bitcoin-integration` |
| Ethereum integration | guides/chain-fusion/ethereum.md | — | `icp-evm-rpc` |
| Solana integration | guides/chain-fusion/solana.md | — | — |
| Token ledgers | guides/defi/token-ledgers.md | — | `icp-icrc-ledger` |
| Chain-key tokens | guides/defi/chain-key-tokens.md | — | — |
| SNS governance | guides/governance/ (all 3 pages) | — | `icp-sns-governance` |

**Key insight:** These are destination sections, not sequential. A DeFi developer may jump straight here after Stage 3. The "what-next" page and sidebar must make these discoverable without forcing a linear path.

---

## Sidebar Order Recommendation

The guides/ sub-groups should follow the natural development sequence. A developer scrolling the sidebar should see the order they would actually build things in.

### Recommended sidebar order for guides/:

```
guides/
  backends/          # 1. Write your canister logic
  canister-calls/    # 2. Call other canisters
  frontends/         # 3. Build a UI
  authentication/    # 4. Add user login
  testing/           # 5. Test before deploying
  canister-management/  # 6. Configure and manage canisters
  production/        # 7. Deploy and operate on mainnet
  security/          # 8. Harden for production
  chain-fusion/      # 9. Integrate with other chains
  defi/              # 10. Build financial applications
  governance/        # 11. Decentralize with SNS
  tools/             # 12. Tooling reference (always last)
```

**Rationale:**
- Groups 1-4 follow the build sequence (backend -> cross-canister -> frontend -> auth)
- Groups 5-8 follow the ship sequence (test -> configure -> deploy -> secure)
- Groups 9-11 are advanced/domain-specific (no assumed order)
- Group 12 is reference-like (tools overview, migration guide) and belongs at the end

### Recommended top-level sidebar order:

```
Getting Started     # Always first
Guides              # Bulk of content, follows journey
Concepts            # Deeper understanding (read when needed)
Languages           # Language-specific reference
Reference           # Specs, costs, errors (lookup when needed)
```

---

## Structure Alternatives

### Variant A: Current Proposal (Diataxis Pure)

```
getting-started/          (4 tutorials)
guides/
  backends/               (7 how-to)
  canister-management/    (6 how-to)
  frontends/              (4 how-to)
  authentication/         (2 how-to)
  canister-calls/(3 how-to)
  testing/                (2 how-to)
  production/             (3 how-to)
  chain-fusion/           (4 how-to)
  defi/                   (3 how-to)
  governance/             (3 how-to)
  security/               (5 how-to)
  tools/                  (2 how-to)
concepts/                 (13 explanations)
languages/                (Motoko synced + Rust)
reference/                (13 reference pages)
```

**Pros:**
- Clean Diataxis alignment (each section = one quadrant)
- Flat top-level (5 sections) is easy to scan
- Guides sub-groups can be reordered without structural changes
- AI agents can reliably predict where content lives based on type (how-to vs. concept vs. reference)
- 12 sub-groups in guides/ keeps each group small (2-7 pages)

**Cons:**
- 12 sub-groups in guides/ is a lot to scan in the sidebar
- Concept/guide pairs are separated (e.g., concepts/chain-fusion.md vs guides/chain-fusion/bitcoin.md) -- developer must navigate between sections
- "backends/" may not be immediately clear to ICP newcomers

**Journey fit:** Good for stages 2-7 (linear journey). Weaker for stage 1 (discovery) and stage 8 (advanced) where developers browse by topic rather than task sequence.

---

### Variant B: Journey-Oriented (Build, Ship, Scale)

```
getting-started/          (4 tutorials)
build/
  backends/               (7 how-to)
  canister-calls/(3 how-to)
  frontends/              (4 how-to)
  authentication/         (2 how-to)
  testing/                (2 how-to)
ship/
  canister-management/    (6 how-to)
  production/             (3 how-to)
  security/               (5 how-to)
scale/
  chain-fusion/           (4 how-to)
  defi/                   (3 how-to)
  governance/             (3 how-to)
concepts/                 (13 explanations)
languages/                (Motoko synced + Rust)
reference/                (13 reference pages)
tools/                    (2 pages, promoted to top-level)
```

**Pros:**
- Maps directly to the developer journey (build -> ship -> scale)
- Each top-level section tells you where you are in the journey
- Fewer sub-groups per section (5 under build, 3 under ship, 3 under scale)
- "Tools" as top-level makes it easy to find migration guide and tooling overview

**Cons:**
- 8 top-level sections is more than the recommended 5-7 for sidebar scannability
- Breaks Diataxis purity (build/ship/scale are journey stages, not information types)
- Developers who know what they want (e.g., "HTTPS outcalls guide") must first figure out which journey stage it belongs to
- "Scale" is a misnomer -- chain fusion and DeFi are not about scaling, they are domain capabilities
- AI agents have a harder time predicting content location (is security in "ship" or "build"?)

**Journey fit:** Excellent for the linear first-time journey (stages 2-7). Poor for experienced developers who return to docs for specific tasks, and for AI agents that need predictable paths.

---

### Variant C: Hybrid (Guides + Capabilities)

```
getting-started/          (4 tutorials)
guides/
  backends/               (7 how-to)
  canister-calls/(3 how-to)
  frontends/              (4 how-to)
  authentication/         (2 how-to)
  testing/                (2 how-to)
  canister-management/    (6 how-to)
  production/             (3 how-to)
  security/               (5 how-to)
capabilities/
  chain-fusion/           (4 how-to + concepts merged)
  defi/                   (3 how-to + concepts merged)
  governance/             (3 how-to + concepts merged)
concepts/                 (10 explanations, minus the 3 moved to capabilities)
languages/                (Motoko synced + Rust)
reference/                (13 reference pages)
```

**Pros:**
- Separates "core development guides" from "platform capability deep-dives"
- Chain fusion, DeFi, and governance get their own home with concept + how-to co-located
- Reduces guides/ sub-group count from 12 to 8
- Capabilities section is a natural landing zone for Ethereum migrants and DeFi developers

**Cons:**
- Breaks Diataxis by mixing concepts and how-to in capabilities/
- Creates ambiguity: is "HTTPS outcalls" a capability or a backend guide? (It could be either)
- Where does a new capability go? The decision boundary between guides/ and capabilities/ is fuzzy
- 6 top-level sections, borderline for sidebar scannability
- Concept/how-to co-location means some concept pages live in concepts/ and others in capabilities/ -- inconsistent

**Journey fit:** Good for discovery (capabilities section is browsable by topic) and for advanced stages (8). Weaker for the linear journey because the developer must understand the guides/capabilities split.

---

## Recommended Structure

**Recommendation: Variant A (Current Proposal / Diataxis Pure) with sidebar ordering improvements.**

### Rationale

1. **Diataxis consistency is the strongest signal for both humans and AI agents.** When every how-to is under guides/, every concept is under concepts/, and every spec is under reference/, there is zero ambiguity about where to find or place content. This matters enormously for a docs site that will be maintained by multiple agents and human contributors.

2. **The 12 sub-groups concern is manageable.** With the recommended sidebar ordering (above), the guides/ section reads as a natural journey. Starlight supports collapsible sidebar groups, so developers can collapse sections they have moved past.

3. **Variant B's journey framing is better solved by the "what-next" page.** Rather than encoding the journey into the URL structure (which creates friction for returning developers), the getting-started/what-next.md page can route developers to the right guides/ sub-group based on their goal. This preserves the journey without sacrificing findability.

4. **Variant C's capabilities separation creates more problems than it solves.** The decision already recorded in decisions.md (2026-03-11: "No separate capabilities section") is correct. Capabilities are best expressed as concept + guide pairs linked to each other, not co-located.

5. **AI agent ergonomics favor Variant A.** An agent given a task like "help the user make HTTPS outcalls" can predictably look for guides/backends/https-outcalls.md. With Variant B, the agent must reason about journey stages. With Variant C, the agent must reason about the guides/capabilities boundary.

### Adjustments to Variant A

Two refinements to the current proposal:

1. **Rename `guides/canister-management/` to `guides/canister-management/`** to disambiguate from "canister development" (which is what backends/ covers). This makes the distinction clear: backends/ = writing canister code, canister-management/ = configuring, upgrading, and operating canisters.

2. **Add a `guides/tools/` entry for `dev-environments.md`** (or similar) to cover Gitpod, GitHub Codespaces, and local dev setup beyond the quickstart. This fills a gap for developers who want to set up CI or team environments.

### Final structure

```
getting-started/
  quickstart.md
  project-structure.md
  what-next.md

guides/
  backends/                   # Write canister logic
    data-persistence.md
    https-outcalls.md
    timers.md
    randomness.md
    certified-variables.md
  canister-calls/             # Call other canisters
    onchain-calls.md
    candid.md
    binding-generation.md
    parallel-calls.md
  frontends/                  # Build a UI
    asset-canister.md
    custom-domains.md
    certification.md
    frameworks.md
  authentication/             # Add user login
    internet-identity.md
    wallet-integration.md  (moved to guides/defi/)
  testing/                    # Test before deploying
    strategies.md
    pocket-ic.md
  canister-management/        # Configure and manage (renamed)
    lifecycle.md
    settings.md
    logs.md
    optimization.md
    large-wasm.md
    snapshots.md
    reproducible-builds.md
  production/                 # Deploy and operate
    subnet-selection.md
    cycles-management.md
    canister-discovery.md
  security/                   # Harden for production
    access-management.md
    canister-upgrades.md
    data-integrity.md
    dos-prevention.md
    inter-canister-calls.md
  chain-fusion/               # Integrate with other chains
    bitcoin.md
    ethereum.md
    solana.md
    dogecoin.md
  defi/                       # Build financial applications
    token-ledgers.md
    chain-key-tokens.md
    rosetta.md
  governance/                 # Decentralize with SNS
    launching.md
    managing.md
    testing.md
  tools/                      # Tooling
    overview.md
    migrating-from-dfx.md

concepts/
  network-overview.md
  app-architecture.md
  canisters.md
  chain-key-cryptography.md
  vetkeys.md
  https-outcalls.md
  onchain-randomness.md
  timers.md
  reverse-gas-model.md
  orthogonal-persistence.md
  chain-fusion.md
  governance.md
  security.md

languages/
  motoko/                     # Synced from caffeinelabs/motoko
  rust/
    index.md
    stable-structures.md
    testing.md

reference/
  management-canister.md
  system-canisters.md
  protocol-canisters.md
  application-canisters.md
  token-standards.md
  cycles-costs.md
  subnet-selection.md
  execution-errors.md
  ic-interface-spec.md
  http-gateway-spec.md
  candid-spec.md
  internet-identity-spec.md
  glossary.md
```

---

## Edge Case Analysis

### 1. Backend-only developer (no frontend)

**Journey:** Discovery -> Setup -> Backend Development -> Testing -> Deployment -> Production

**Navigation path:**
- getting-started/quickstart.md (uses hello-world template, ignores frontend)
- getting-started/what-next.md -> routes to guides/backends/
- Works through relevant backend guides
- Skips frontends/ and authentication/ entirely
- Goes to guides/testing/ -> guides/canister-management/ -> guides/canister-management/

**Does the structure work?** Yes. Frontends and authentication are clearly separate sub-groups that backend-only developers can skip without confusion. The sidebar ordering places backends/ first, so the developer sees their content immediately.

**Gap to address:** The quickstart should note that the frontend is optional and can be removed from the project template, or offer a backend-only template variant.

### 2. Developer migrating from Ethereum

**Journey:** Discovery (focused on differences) -> Setup -> Chain Fusion + Backend -> Deployment

**Navigation path:**
- concepts/app-architecture.md (ICP vs Ethereum architecture)
- concepts/reverse-gas-model.md (biggest paradigm shift)
- concepts/chain-fusion.md (how ICP connects to Ethereum)
- getting-started/quickstart.md
- guides/chain-fusion/ethereum.md (their primary interest)
- guides/backends/ (ICP-specific patterns)
- guides/canister-management/cycles-management.md (cycles vs gas)

**Does the structure work?** Mostly. The concepts section handles the "what's different" question well. The chain-fusion section is discoverable in the sidebar.

**Gap to address:** Consider a "Coming from Ethereum" callout or section in concepts/app-architecture.md that maps Ethereum concepts to ICP equivalents (contract = canister, gas = cycles, Solidity = Motoko/Rust, etc.). This is a paragraph, not a whole page -- keep it in the concept page.

### 3. AI agent looking for implementation guidance

**Journey:** Direct lookup by task -> Read guide -> Read icskill -> Generate code

**Navigation path:**
- Agent receives task like "add HTTPS outcalls to my canister"
- Looks up guides/backends/https-outcalls.md (predictable path)
- Reads linked icskill `icp-https-outcalls` for code patterns
- References languages/rust/ or languages/motoko/ for syntax details
- Checks reference/ for API specifics if needed

**Does the structure work?** Yes, and this is Variant A's strongest advantage. The path from task description to docs page is deterministic: "how to X" -> guides/{category}/X.md. AI agents do not benefit from journey-oriented structures (Variant B) because they do not follow linear journeys.

**Gap to address:** Every guide page should have a machine-readable frontmatter field linking to the relevant icskill(s) and examples repo path. This enables agents to discover related resources programmatically.

### 4. DeFi developer

**Journey:** Discovery -> Setup -> Backend + DeFi + Chain Fusion -> Testing -> Deployment

**Navigation path:**
- concepts/network-overview.md (quick platform overview)
- getting-started/quickstart.md
- guides/defi/token-ledgers.md (core of their work)
- guides/defi/chain-key-tokens.md
- guides/chain-fusion/bitcoin.md or ethereum.md (for cross-chain tokens)
- guides/canister-calls/onchain-calls.md (ledger interaction is inter-canister)
- guides/security/ (financial applications need all security guides)
- guides/canister-management/cycles-management.md

**Does the structure work?** Yes. The DeFi developer has a clear home in guides/defi/ and naturally branches into chain-fusion/ and security/. The separation of these three sub-groups works well because DeFi developers need all three but in different proportions depending on their specific project.

**Gap to address:** The guides/defi/ section should have an index page or the token-ledgers.md page should open with a "building DeFi on ICP" overview that maps common DeFi patterns (DEX, lending, staking) to the relevant guide pages across sections.

### 5. Developer deploying to production for the first time

**Journey:** Has working local project -> Deployment -> Production -> Security

**Navigation path:**
- guides/canister-management/cycles-management.md (first question: "how much does this cost?")
- guides/canister-management/subnet-selection.md (where to deploy)
- guides/canister-management/settings.md (production settings: controllers, memory limits)
- guides/canister-management/reproducible-builds.md (verify your build)
- guides/canister-management/lifecycle.md (install vs upgrade)
- guides/security/ (pre-launch security checklist)
- reference/cycles-costs.md (exact cost lookup)

**Does the structure work?** Yes, but the path crosses three sub-groups (production/, canister-management/, security/). This is acceptable because each sub-group has a distinct concern, and the pages should cross-link.

**Gap to address:** Consider a "Production checklist" callout in guides/canister-management/cycles-management.md (the likely entry point) that links to the 5-6 pages a first-time deployer must read. This acts as a mini-journey within the guides section without requiring a separate "deployment tutorial" (which would overlap with the how-to guides).

---

## Cross-Cutting Recommendations

1. **Concept-Guide linking:** Every concept page should end with a "Hands-on" section linking to the corresponding guide(s). Every guide page should have a "Background" link to the relevant concept. This bridges the Diataxis quadrants without co-locating content.

2. **icskill links in frontmatter:** Add an `icskills` frontmatter field (array of skill IDs) to every guide page. This enables agents to discover skills programmatically and enables a future "Try with AI" button on each page.

3. **The "what-next" page is critical routing infrastructure.** It should present 3-4 paths (backend focus, full-stack, chain fusion, DeFi) with 2-3 sentences each and direct links. This is the single page that makes the linear journey work within a non-linear structure.

4. **Sidebar annotations:** Use Starlight's badge feature to mark sub-groups as "Core" (backends, frontends, testing, canister-management, production) vs "Advanced" (chain-fusion, defi, governance). This helps new developers focus and experienced developers browse.

5. **examples repo mapping:** Each guide page should link to 1-2 relevant examples from the 97 in the examples repo. This provides the "full working project" complement to the guide's focused snippets.
