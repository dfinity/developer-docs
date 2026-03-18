# Synthesis: Final Documentation Structure

> Generated 2026-03-11. This is the canonical structure definition for the ICP developer docs restructuring. Every page listed here has a corresponding stub in `docs/`.

## Design Principles

1. **Diataxis-aligned** -- Getting Started (tutorials), Guides (how-to), Concepts (explanations), Reference (information)
2. **Developer-journey ordered** -- Sidebar follows build -> ship -> scale progression
3. **Agent-friendly** -- Predictable paths: "how to X" = `guides/{category}/X.md`, "what is X" = `concepts/X.md`
4. **No duplication** -- Link to icp-cli docs, JS SDK, Learn Hub, mops.one, docs.rs for external content
5. **icskills-integrated** -- Every relevant guide has `icskills` frontmatter for AI agent discovery

---

## Pages by Section

### Landing Page (1 page)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 1 | `index.md` | ICP Developer Docs | landing | beginner | Compelling landing page highlighting the zero-to-production developer journey. Surfaces IC capabilities (chain-key, chain fusion, orthogonal persistence, reverse gas). Links to all five sections and external resources. | Portal home.mdx, DOCS_RESTRUCTURING_PROPOSAL.md | All section index pages | P0 |

### Getting Started (4 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 2 | `getting-started/quickstart.md` | Quickstart | tutorial | beginner | Install icp-cli, scaffold a project with `icp new`, start local network, deploy, call canister, view frontend. Under 10 minutes. Single linear path, no forks. | Portal building-apps/getting-started/quickstart.mdx, icp-cli quickstart.md, icp-cli guides/installation.md, hello-world template | project-structure, what-next, concepts/canisters | P0 |
| 3 | `getting-started/project-structure.md` | Project Structure | tutorial | beginner | Explain icp.yaml, .icp/ directory, canister discovery, recipes, and binding generation. Walk through the hello-world template output. | icp-cli concepts/project-model.md, concepts/recipes.md, concepts/binding-generation.md, hello-world template | quickstart, guides/canister-calls/binding-generation, guides/frontends/asset-canister | P0 |
| 4 | `guides/tools/agentic-development.md` | Agentic Development | how-to | beginner | Set up AI-assisted ICP development. Install icskills, configure your AI agent (Claude, Cursor, Copilot), use skills for code generation. References llm_chatbot examples as demo. | icskills README, all 17 skills, llm_chatbot examples (Rust/Motoko) | quickstart, guides/tools/overview | P1 |
| 5 | `getting-started/what-next.md` | What Next? | tutorial | beginner | Critical routing page. Presents 4-5 paths based on developer goals: backend-only, full-stack, chain fusion, DeFi, governance. Each path has 2-3 sentences and direct links to the relevant guides section. | Developer journey analysis, all guides/ sections | All guides/ section entry pages | P0 |

### Guides -- Backends (7 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 6 | `guides/backends/data-persistence.md` | Data Persistence | how-to | intermediate | Store and retrieve data in canisters. Covers stable structures (Rust), persistent actors (Motoko), MemoryManager, upgrade hooks. Idempotency patterns. | Portal building-apps/canister-management/storage.mdx, best-practices/storage.mdx, best-practices/idempotency.mdx; icskills: stable-memory; examples: daily_planner, superheroes, photo_gallery | concepts/orthogonal-persistence, guides/canister-management/lifecycle, languages/rust/stable-structures | P0 |
| 7 | `guides/backends/https-outcalls.md` | HTTPS Outcalls | how-to | intermediate | Make HTTP GET/POST requests from canisters to external APIs. Transform functions, cycle costs, response size limits, idempotency. Inline GET example (~20 lines each language). | Portal building-apps/integrations/https-outcalls/ (5 files); icskills: https-outcalls; examples: send_http_get, send_http_post, exchange-rates | concepts/https-outcalls, guides/chain-fusion/ethereum | P0 |
| 8 | `guides/backends/timers.md` | Timers | how-to | intermediate | Set up one-shot and periodic timers in canisters. Timer API for Rust and Motoko. Heartbeat migration. Common patterns: periodic cleanup, scheduled tasks. | Portal building-apps/integrations/periodic-tasks.mdx; examples: periodic_tasks (Rust) | concepts/timers, guides/canister-management/lifecycle | P0 |
| 9 | `guides/backends/randomness.md` | Onchain Randomness | how-to | intermediate | Generate unpredictable random numbers using the management canister's raw_rand API. Use cases: games, lotteries, fair selection. Security considerations. | Portal building-apps/integrations/randomness.mdx; examples: random_maze (Motoko) | concepts/onchain-randomness, guides/security/data-integrity | P1 |
| 10 | `guides/backends/certified-variables.md` | Certified Variables | how-to | advanced | Implement certified data for query responses. Merkle trees, witness generation, the certified data API. Frontend verification of certified responses. | Portal building-apps/integrations/advanced-calls.mdx (certified variables section); icskills: certified-variables; examples: cert-var (Motoko) | concepts/security, guides/frontends/certification | P1 |
| 11 | `guides/canister-management/large-wasm.md` | Large Wasm Modules | how-to | advanced | Deploy canisters exceeding the 2MB Wasm limit. Wasm chunk store, gzip compression, ic-wasm tool. Wasm64 support. | Portal building-apps/developing-canisters/compile.mdx (large Wasm section); examples: backend_wasm64 (Rust) | guides/canister-management/optimization, reference/execution-errors | P2 |
| 12 | `guides/canister-calls/parallel-calls.md` | Parallel Calls | how-to | advanced | Execute multiple inter-canister calls concurrently. Futures in Rust, async in Motoko. Error handling for partial failures. Performance benefits. | Portal building-apps/integrations/advanced-calls.mdx (composite queries section); icskills: multi-canister; examples: parallel_calls (both), composite_query (both) | guides/canister-calls/onchain-calls, guides/canister-management/optimization | P2 |

### Guides -- Canisters (6 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 13 | `guides/canister-management/lifecycle.md` | Canister Lifecycle | how-to | intermediate | Create, install, upgrade, and delete canisters. Pre/post-upgrade hooks, state management, canister factory pattern. Migration between subnets. | Portal building-apps/canister-management/upgrade.mdx, state.mdx, developing-canisters/create.mdx, compile.mdx, install.mdx, deploy.mdx, delete.mdx, history.mdx, trapping.mdx, advanced/canister-migration.mdx; icp-cli concepts/build-deploy-sync.md; icskills: cycles-management, stable-memory; examples: canister_factory, classes, canister-info | concepts/canisters, guides/backends/data-persistence, guides/canister-management/cycles-management | P0 |
| 14 | `guides/canister-management/settings.md` | Canister Settings | how-to | intermediate | Configure controllers, memory limits, freezing threshold, compute allocation, and log visibility. Environment-specific settings. | Portal building-apps/canister-management/control.mdx, settings.mdx; icp-cli reference/canister-settings.md, concepts/environments.md; icskills: cycles-management | guides/canister-management/lifecycle, guides/canister-management/cycles-management, reference/cycles-costs | P0 |
| 15 | `guides/canister-management/logs.md` | Canister Logs | how-to | intermediate | Debug canisters using the logging API. Log levels, structured logging, query statistics. Access logs for monitoring. | Portal building-apps/canister-management/logs.mdx, backtraces.mdx, advanced/canister-access-logs.mdx; examples: canister_logs (both), query_stats (both) | guides/testing/strategies, guides/canister-management/lifecycle | P1 |
| 16 | `guides/canister-management/optimization.md` | Canister Optimization | how-to | advanced | Reduce Wasm size and improve canister performance. ic-wasm shrinking, SIMD, performance counters, memory management. Language-specific tips. | Portal building-apps/advanced/optimize/rust.mdx, motoko.mdx; examples: low_wasm_memory (both), performance_counters, simd, face-recognition, image-classification | guides/canister-management/large-wasm, reference/cycles-costs | P1 |
| 17 | `guides/canister-management/snapshots.md` | Canister Snapshots | how-to | intermediate | Create, list, restore, and delete canister snapshots for backup and recovery. Programmatic snapshots via management canister API. | Portal building-apps/canister-management/snapshots.mdx; icp-cli guides/canister-snapshots.md; examples: canister-snapshots, canister-snapshot-download (Rust) | guides/canister-management/lifecycle, guides/security/canister-upgrades | P1 |
| 18 | `guides/canister-management/reproducible-builds.md` | Reproducible Builds | how-to | advanced | Verify canister Wasm matches source code. Docker-based builds, sha256 verification, the prebuilt recipe. Trust and transparency for users. | Portal building-apps/best-practices/reproducible-builds.mdx; @dfinity/prebuilt recipe | guides/canister-management/lifecycle, concepts/security, guides/canister-management/cycles-management | P0 |

### Guides -- Frontends (4 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 19 | `guides/frontends/asset-canister.md` | Asset Canister | how-to | intermediate | Deploy frontend assets to ICP. The @dfinity/asset-canister recipe, build configuration, SPA routing, programmatic uploads via JS SDK. | Portal building-apps/frontends/using-an-asset-canister.mdx, uploading-serving-assets.mdx; icp-cli concepts/canister-discovery.md; icskills: asset-canister; examples: static-website, photo-storage, my_crypto_blog; JS SDK: @icp-sdk/canisters; static-website template | getting-started/project-structure, guides/frontends/custom-domains, guides/frontends/certification | P0 |
| 20 | `guides/frontends/custom-domains.md` | Custom Domains | how-to | intermediate | Point a custom domain to your ICP-hosted frontend. DNS configuration, boundary node registration, SSL certificates. | Portal building-apps/frontends/custom-domains/using-custom-domains.mdx, dns-setup.mdx; icskills: asset-canister | guides/frontends/asset-canister, guides/canister-management/cycles-management | P1 |
| 21 | `guides/frontends/certification.md` | Response Certification | how-to | advanced | Verify that query responses come from the IC and have not been tampered with. Client-side certificate verification, the service worker approach. | Portal building-apps/frontends/asset-security.mdx; icskills: certified-variables; JS SDK: @icp-sdk/core (certificate verification) | guides/backends/certified-variables, concepts/security | P1 |
| 22 | `guides/frontends/frameworks.md` | Frontend Frameworks | how-to | intermediate | Integrate React, Svelte, Vue, or other frameworks with ICP. Vite plugin setup, agent configuration, framework starters. Also covers Unity, Godot for game hosting. | Portal building-apps/frontends/existing-frontend.mdx; JS SDK: @icp-sdk/core, @icp-sdk/auth; examples: hosting/react, svelte-motoko-starter, sveltekit-starter, godot-html5-template, unity-webgl-template | guides/frontends/asset-canister, guides/authentication/internet-identity | P2 |

### Guides -- Authentication (2 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 23 | `guides/authentication/internet-identity.md` | Internet Identity | how-to | intermediate | Integrate passkey-based authentication. Frontend setup with @icp-sdk/auth, delegation handling, principal-per-app isolation, alternative origins. Unity native app integration. | Portal building-apps/authentication/overview.mdx, integrate-internet-identity.mdx, alternative-origins.mdx; icskills: internet-identity; JS SDK: @icp-sdk/auth; examples: internet_identity_integration (Motoko), encrypted-notes-dapp-vetkd (both), unity native-apps | concepts/security, guides/frontends/frameworks, reference/internet-identity-spec | P0 |
| 24 | `guides/defi/wallet-integration.md` | Wallet Integration | how-to | advanced | Connect ICRC signer-standard wallets (OISY, Plug, NFID). ICRC-21/25/27/29/49 standards, popup wallet model, consent messages. | Portal building-apps/authentication/integrate-misc-wallets.mdx; icskills: wallet-integration; examples: oisy-signer-demo; icp-cli guides/managing-identities.md | guides/authentication/internet-identity, reference/token-standards | P1 |

### Guides -- Canister Calls (3 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 25 | `guides/canister-calls/onchain-calls.md` | Onchain Calls | how-to | intermediate | Call functions on other canisters. Canister discovery (env vars, ic_env cookie), update vs query calls, error handling, third-party canister integration. | Portal building-apps/integrations/advanced-calls.mdx, advanced/using-third-party-canisters.mdx, developer-tools/cdks/rust/intercanister.mdx; icp-cli concepts/canister-discovery.md; icskills: multi-canister; examples: inter-canister-calls (Rust), pub-sub (Motoko) | concepts/canisters, guides/canister-calls/candid, guides/canister-calls/parallel-calls | P0 |
| 26 | `guides/canister-calls/candid.md` | Candid Interface | how-to | intermediate | Define and use Candid interfaces for canister communication. Type mapping between Rust/Motoko/JS, service definitions, type generation. | Portal building-apps/developing-canisters/ (Candid sections), developer-tools/cdks/rust/generating-candid.mdx; examples: candid_type_generation (Rust); JS SDK: @icp-sdk/core | guides/canister-calls/onchain-calls, guides/canister-calls/binding-generation, reference/candid-spec | P0 |
| 27 | `guides/canister-calls/binding-generation.md` | Binding Generation | how-to | intermediate | Generate type-safe bindings from Candid files. @icp-sdk/bindgen for JS/TS, didc for Rust, icp-cli automatic generation. Vite plugin integration. | icp-cli concepts/binding-generation.md; icskills: multi-canister; JS SDK: @icp-sdk/bindgen; examples: hello-world template (shows Vite plugin) | guides/canister-calls/candid, getting-started/project-structure | P1 |
| 27b | `guides/canister-calls/offchain-calls.md` | Offchain Calls | how-to | intermediate | Call canister functions from JS/TS frontends, scripts, and agents. Agent creation, canister discovery, query vs update calls, authentication context, error handling. | JS SDK: @icp-sdk/core, @icp-sdk/canisters; icp-cli concepts/canister-discovery.md; hello-world template | guides/canister-calls/candid, guides/canister-calls/binding-generation, guides/canister-calls/onchain-calls, guides/frontends/asset-canister, guides/authentication/internet-identity | P1 |

### Guides -- Testing (2 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 28 | `guides/testing/strategies.md` | Testing Strategies | how-to | intermediate | Overview of testing approaches: unit tests, integration tests with PocketIC, benchmarking, Docker-based test networks. Why testing matters on ICP (irreversible upgrades, cycle costs). | Portal building-apps/advanced/benchmarking.mdx; icp-cli guides/containerized-networks.md; examples: unit_testable_rust_canister; JS SDK: pic-js | guides/testing/pocket-ic, guides/canister-management/lifecycle | P0 |
| 29 | `guides/testing/pocket-ic.md` | PocketIC | how-to | intermediate | Run integration tests against a lightweight IC replica. Rust PocketIC library, Pic JS for JavaScript, multi-subnet testing, time travel. | icskills: (none yet); JS SDK: pic-js; icp-cli guides/containerized-networks.md; examples: (none standalone, linked from pic-js docs) | guides/testing/strategies, guides/governance/testing | P0 |

### Guides -- Production (3 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 30 | `guides/canister-management/subnet-selection.md` | Subnet Selection | how-to | intermediate | Choose the right subnet for deployment. Application vs system subnets, European subnet, fiduciary subnet, colocation. Deploy to specific subnet with icp-cli. | Portal building-apps/developing-canisters/deploy-specific-subnet.mdx; icp-cli guides/deploying-to-specific-subnets.md; reference/subnet-types | concepts/network-overview, guides/canister-management/cycles-management, reference/subnet-types | P1 |
| 31 | `guides/canister-management/cycles-management.md` | Cycles Management | how-to | intermediate | Acquire cycles and manage canister budgets. ICP-to-cycles conversion via CMC, top-ups, freezing thresholds, monitoring balance, multi-environment deployment. Production checklist. | Portal building-apps/canister-management/topping-up.mdx, building-apps/getting-started/tokens-and-cycles.mdx; icp-cli guides/deploying-to-mainnet.md, guides/tokens-and-cycles.md, guides/managing-environments.md; icskills: cycles-management; examples: hello_cycles (Motoko); proxy template | concepts/reverse-gas-model, guides/canister-management/settings, reference/cycles-costs | P0 |
| 32 | `guides/canister-management/canister-discovery.md` | Canister Discovery | how-to | intermediate | Make your canister findable on the IC dashboard. Metadata, ICRC-1 compliance for token discovery, dashboard REST APIs. | icskills: ic-dashboard; reference/system-canisters | guides/canister-management/settings, reference/system-canisters | P2 |

### Guides -- Chain Fusion (4 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 33 | `guides/chain-fusion/bitcoin.md` | Bitcoin Integration | how-to | advanced | Send and receive BTC from canisters. Address generation (ECDSA + Schnorr), transaction creation/signing/submission, UTXO management, local regtest setup. ckBTC overview. | Portal build-on-btc/ (14 files); icskills: ckbtc; examples: basic_bitcoin (both), threshold-ecdsa (both), threshold-schnorr (both); bitcoin-starter template | concepts/chain-fusion, concepts/chain-key-cryptography, guides/defi/chain-key-tokens | P0 |
| 34 | `guides/chain-fusion/ethereum.md` | Ethereum Integration | how-to | advanced | Interact with Ethereum from canisters. EVM RPC canister (7hfb6-caaaa-aaaar-qadga-cai), address generation, transaction signing/submission, ERC-20 reads. | Portal building-apps/chain-fusion/ethereum/ (10 files); icskills: evm-rpc; examples: basic_ethereum, evm_block_explorer (both), threshold-ecdsa (both) | concepts/chain-fusion, guides/backends/https-outcalls, guides/defi/chain-key-tokens | P0 |
| 35 | `guides/chain-fusion/solana.md` | Solana Integration | how-to | advanced | Interact with Solana from canisters. Sol RPC canister, transaction signing, SPL token reads. Current status and limitations. | Portal building-apps/chain-fusion/solana/overview.mdx; examples: basic_solana (redirects to sol-rpc-canister repo) | concepts/chain-fusion, guides/chain-fusion/ethereum | P2 |
| 36 | `guides/chain-fusion/dogecoin.md` | Dogecoin Integration | how-to | advanced | Send and receive DOGE from canisters. Dogecoin canister integration, address generation, transaction workflow. | Portal building-apps/chain-fusion/dogecoin/overview.mdx; examples: basic_dogecoin (redirects to dogecoin-canister repo) | concepts/chain-fusion, guides/chain-fusion/bitcoin | P2 |

### Guides -- DeFi (3 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 37 | `guides/defi/token-ledgers.md` | Token Ledgers | how-to | intermediate | Transfer ICP and ICRC-1/ICRC-2 tokens from canisters. Ledger canister interaction, approve/transferFrom, fee handling, local test ledger setup. | Portal defi/tokens/ (multiple files); icskills: icrc-ledger; JS SDK: @icp-sdk/canisters; examples: icp_transfer, token_transfer, token_transfer_from (both), icrc2-swap, receiving-icp, ic-pos, nft-creator, tokenmania | reference/token-standards, guides/defi/chain-key-tokens, guides/canister-calls/onchain-calls | P0 |
| 38 | `guides/defi/chain-key-tokens.md` | Chain-Key Tokens | how-to | advanced | Work with ckBTC, ckETH, and other chain-key tokens. Minting, redemption, ledger interaction, subaccount derivation. | Portal defi/chain-key-tokens/ files; icskills: ckbtc; JS SDK: @icp-sdk/canisters; examples: token_transfer (both) | guides/chain-fusion/bitcoin, guides/chain-fusion/ethereum, guides/defi/token-ledgers | P1 |
| 39 | `guides/defi/rosetta.md` | Rosetta API | how-to | advanced | Integrate with the Rosetta API for exchange compatibility. Construction API, Data API, ICP-specific extensions. | Portal defi/rosetta/ files | guides/defi/token-ledgers, reference/token-standards | P2 |

### Guides -- Governance (3 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 40 | `guides/governance/launching.md` | Launching an SNS | how-to | advanced | Decentralize your dapp with an SNS. Token economics configuration, governance parameters, integration checklist, NNS proposal submission. | Portal building-apps/governing-apps/launching/ (4 files), tokenomics/ (4 files); icskills: sns-launch; examples: sns-adaptor (Rust) | concepts/governance, guides/governance/testing, guides/governance/managing | P1 |
| 41 | `guides/governance/managing.md` | Managing an SNS | how-to | advanced | Operate a live SNS. Making proposals, cycles management, asset canister updates, neuron staking from CLI. | Portal building-apps/governing-apps/managing/ (4 files); icskills: sns-launch; JS SDK: @icp-sdk/canisters; examples: stake_neuron_from_cli (Rust) | guides/governance/launching, concepts/governance | P1 |
| 42 | `guides/governance/testing.md` | Testing SNS Governance | how-to | advanced | Test your SNS before mainnet launch. Local testing with PocketIC, testflight on mainnet, pre-launch verification checklist. | Portal building-apps/governing-apps/testing/ (3 files); icskills: sns-launch; JS SDK: pic-js | guides/governance/launching, guides/testing/pocket-ic | P1 |

### Guides -- Security (5 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 43 | `guides/security/access-management.md` | Access Management | how-to | intermediate | Control who can call your canister. Controller-only functions, caller checking, anonymous principal rejection, Rust guards. | Portal building-apps/best-practices/general.mdx (access control sections); icskills: canister-security; examples: guards (Rust), who_am_i (both, inline ~10 lines) | concepts/security, guides/canister-management/settings | P0 |
| 44 | `guides/security/canister-upgrades.md` | Secure Upgrades | how-to | intermediate | Upgrade canisters safely. Pre/post-upgrade hooks, stable memory migration, rollback strategies, snapshot-based recovery. | icskills: canister-security; portal building-apps/canister-management/upgrade.mdx | guides/canister-management/lifecycle, guides/canister-management/snapshots, guides/backends/data-persistence | P0 |
| 45 | `guides/security/data-integrity.md` | Data Integrity | how-to | advanced | Protect data confidentiality and integrity. VetKeys for onchain encryption, X.509 certificates, signature verification, IBE patterns. | Portal building-apps/authentication/independently-verifying-ic-signatures.mdx; icskills: canister-security, vetkd, certified-variables; examples: vetkd, vetkeys (both), encrypted-notes-dapp-vetkd (both), x509 (Rust), filevault (Motoko) | concepts/vetkeys, concepts/security, guides/backends/certified-variables | P1 |
| 46 | `guides/security/dos-prevention.md` | DoS Prevention | how-to | intermediate | Protect canisters from denial-of-service attacks. Rate limiting, cycle drain protection, ingress message filtering, resource limits. | icskills: canister-security; portal building-apps/best-practices/general.mdx (DoS sections) | concepts/security, guides/canister-management/settings, reference/cycles-costs | P1 |
| 47 | `guides/security/inter-canister-calls.md` | Inter-Canister Call Safety | how-to | advanced | Handle the security pitfalls of async inter-canister calls. Reentrancy (CallerGuard), saga pattern, callback traps, bounded/unbounded wait. | icskills: canister-security, multi-canister | guides/canister-calls/onchain-calls, guides/canister-calls/parallel-calls, concepts/security | P1 |

### Guides -- Tools (2 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 48 | `guides/tools/overview.md` | Developer Tools | how-to | beginner | Overview of the ICP developer toolchain. icp-cli, CDKs (Rust CDK, Motoko), icp.ninja playground, VS Code extensions, ic-wasm. Links to all external tool docs. | Portal building-apps/developer-tools/dev-tools-overview.mdx, cdks/index.mdx, icp-ninja.mdx; icskills: icp-cli | getting-started/quickstart, guides/tools/migrating-from-dfx | P1 |
| 49 | `guides/tools/migrating-from-dfx.md` | Migrating from dfx | how-to | intermediate | Synced from icp-cli repo. Command mapping, config migration, breaking changes. | icp-cli migration/from-dfx.md (auto-synced) | guides/tools/overview | P0 |

### Concepts (13 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 50 | `concepts/network-overview.md` | Network Overview | explanation | beginner | What is the Internet Computer? Subnets, nodes, consensus, boundary nodes. Developer-focused: what does the network architecture mean for your app? | Portal building-apps/essentials/network-overview.mdx; Learn Hub: consensus, subnets | concepts/canisters, concepts/app-architecture, reference/subnet-types | P0 |
| 51 | `concepts/app-architecture.md` | Application Architecture | explanation | beginner | How ICP apps are structured. Canister as backend + frontend, inter-canister communication, frontend-to-canister flow. Comparison with traditional web apps and Ethereum. | Portal building-apps/best-practices/application-architectures.mdx, getting-started/app-architecture.mdx | concepts/canisters, guides/frontends/asset-canister, guides/canister-calls/onchain-calls | P0 |
| 52 | `concepts/canisters.md` | Canisters | explanation | beginner | What are canisters? Smart contracts that run WebAssembly, hold state, serve HTTP, and pay for their own compute. Execution model, message types, memory model. | Portal building-apps/essentials/canisters.mdx, message-execution.mdx; Learn Hub: canister execution | concepts/app-architecture, guides/canister-management/lifecycle, concepts/reverse-gas-model | P0 |
| 53 | `concepts/chain-key-cryptography.md` | Chain-Key Cryptography | explanation | intermediate | Threshold signatures that enable the IC's unique capabilities. ECDSA, Schnorr, BLS, key management, chain evolution technology. | Portal (chain-key sections scattered); Learn Hub: threshold signatures | concepts/chain-fusion, guides/chain-fusion/bitcoin, guides/chain-fusion/ethereum | P0 |
| 54 | `concepts/vetkeys.md` | VetKeys | explanation | advanced | Verifiable encrypted threshold key derivation. Onchain encryption, identity-based encryption, transport keys. Current status and roadmap. | Portal (vetkeys sections); Learn Hub: VetKeys; icskills: vetkd | guides/security/data-integrity, concepts/chain-key-cryptography | P1 |
| 55 | `concepts/https-outcalls.md` | HTTPS Outcalls | explanation | intermediate | How canisters make HTTP requests to the outside world. Consensus on responses, transform functions, cycle pricing, limitations. | Portal building-apps/integrations/https-outcalls/ (overview files); Learn Hub: HTTPS outcalls consensus | guides/backends/https-outcalls, guides/chain-fusion/ethereum | P0 |
| 56 | `concepts/onchain-randomness.md` | Onchain Randomness | explanation | intermediate | How ICP generates unpredictable random numbers. VRF-based randomness from the management canister, security guarantees, use cases. | Portal building-apps/integrations/randomness.mdx (conceptual parts); Learn Hub: VRF | guides/backends/randomness, concepts/security | P1 |
| 57 | `concepts/timers.md` | Timers | explanation | intermediate | The global timer mechanism. How the IC schedules periodic and one-shot tasks. Comparison with heartbeats (deprecated). | Portal building-apps/integrations/periodic-tasks.mdx (conceptual parts); Learn Hub: timers | guides/backends/timers, concepts/canisters | P1 |
| 58 | `concepts/reverse-gas-model.md` | Reverse Gas Model | explanation | beginner | Why users do not pay gas on ICP. Canisters pay cycles for compute, storage, and bandwidth. ICP-to-cycles conversion. Cost predictability. | Portal building-apps/essentials/gas-cost.mdx, getting-started/tokens-and-cycles.mdx; Learn Hub: cycles economics | guides/canister-management/cycles-management, reference/cycles-costs, concepts/canisters | P0 |
| 59 | `concepts/orthogonal-persistence.md` | Orthogonal Persistence | explanation | intermediate | How canister memory survives across executions and upgrades. Stable memory, heap persistence in Motoko, stable structures in Rust. | Portal (persistence sections); Learn Hub: orthogonal persistence | guides/backends/data-persistence, languages/rust/stable-structures, guides/canister-management/lifecycle | P0 |
| 60 | `concepts/chain-fusion.md` | Chain Fusion | explanation | intermediate | How ICP connects to Bitcoin, Ethereum, Solana, and other chains. Chain-key signatures, threshold ECDSA/Schnorr, HTTP outcalls to other chains, chain-key tokens. | Portal building-apps/chain-fusion/overview.mdx, supported-chains.mdx, evm-rpc/how-it-works.mdx; Learn Hub: chain-key tokens | guides/chain-fusion/bitcoin, guides/chain-fusion/ethereum, concepts/chain-key-cryptography | P0 |
| 61 | `concepts/governance.md` | Governance | explanation | intermediate | How ICP is governed. The NNS, SNS for dapp governance, neuron staking, proposals, tokenomics basics. | Portal building-apps/governing-apps/tokenomics/index.mdx; Learn Hub: NNS | guides/governance/launching, guides/governance/managing | P1 |
| 62 | `concepts/security.md` | Security Model | explanation | intermediate | The IC security model. Canister isolation, trust boundaries, certified variables, the role of boundary nodes. Threat model for dapp developers. | Portal building-apps/best-practices/trust-in-canisters.mdx; icskills: canister-security; Learn Hub: security model | guides/security/access-management, guides/security/canister-upgrades, guides/frontends/certification | P0 |

### Languages -- Motoko (1 page, rest synced)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 63 | `languages/motoko/index.md` | Motoko | explanation | beginner | Landing page for Motoko documentation. Overview of the language, links to synced fundamentals/ICP features/reference sections. Link to mops.one/core (standard library; supersedes base). Note the base→core migration guide (synced). | Synced from caffeinelabs/motoko; Motoko core: https://mops.one/core/docs; base→core migration guide synced from Motoko repo | getting-started/quickstart, guides/backends/data-persistence | P0 |

### Languages -- Rust (3 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 64 | `languages/rust/index.md` | Rust CDK | explanation | intermediate | Getting started with Rust on ICP. ic-cdk overview, project setup with @dfinity/rust recipe, canister macros, message types, inter-canister calls. Limitations and workarounds. | Portal developer-tools/cdks/rust/intro-to-rust.mdx, rust-limitations.mdx, upgrading.mdx, message-inspect.mdx; Rust CDK: https://docs.rs/ic-cdk/latest/ic_cdk/ | getting-started/quickstart, guides/backends/data-persistence, languages/rust/stable-structures | P0 |
| 65 | `languages/rust/stable-structures.md` | Stable Structures | how-to | intermediate | Use StableBTreeMap, StableVec, and other stable data structures in Rust canisters. MemoryManager, upgrade patterns, when to use stable vs heap. | Portal developer-tools/cdks/rust/stable-structures.mdx, canister-state.mdx; icskills: stable-memory; Rust CDK: https://docs.rs/ic-cdk/latest/ic_cdk/ | guides/backends/data-persistence, concepts/orthogonal-persistence, guides/canister-management/lifecycle | P1 |
| 66 | `languages/rust/testing.md` | Testing Rust Canisters | how-to | intermediate | Unit and integration testing for Rust canisters. Mocking ic-cdk calls, PocketIC Rust library, test patterns. | examples: unit_testable_rust_canister; Rust CDK: https://docs.rs/ic-cdk/latest/ic_cdk/ | guides/testing/strategies, guides/testing/pocket-ic | P2 |

### Reference (13 pages)

| # | Path | Title | doc_type | level | Content Brief | Source Material | Cross-Links | Priority |
|---|------|-------|----------|-------|---------------|-----------------|-------------|----------|
| 67 | `reference/management-canister.md` | Management Canister | reference | intermediate | API reference for the IC management canister (aaaaa-aa). All methods: create_canister, install_code, raw_rand, ecdsa_public_key, sign_with_ecdsa, http_request, etc. | Portal references/ic-interface-spec (management canister section); IC interface spec | concepts/canisters, guides/canister-management/lifecycle, guides/backends/randomness | P0 |
| 68 | `reference/system-canisters.md` | System Canisters | reference | intermediate | Inventory of system-level canisters: NNS canisters (governance, ledger, registry, CMC, cycles minting), Internet Identity, ICP ledger with canister IDs. | Portal references/system-canisters; icskills: ic-dashboard | reference/management-canister, concepts/governance | P1 |
| 69 | `reference/protocol-canisters.md` | Protocol Canisters | reference | intermediate | Canisters that implement protocol-level features: Bitcoin canister, EVM RPC canister, exchange rate canister, SNS-W. Canister IDs and interfaces. | Portal references/ (scattered); icskills: ckbtc, evm-rpc | guides/chain-fusion/bitcoin, guides/chain-fusion/ethereum, reference/system-canisters | P1 |
| 70 | `reference/application-canisters.md` | Application Canisters | reference | intermediate | Notable application-layer canisters: asset canister, SNS canisters. Canister IDs, interfaces, versioning. | Portal references/ (scattered); icskills: asset-canister, sns-launch | guides/frontends/asset-canister, guides/governance/launching | P2 |
| 71 | `reference/token-standards.md` | Token Standards | reference | intermediate | ICRC-1 (fungible transfers), ICRC-2 (approve/transferFrom), ICRC-3 (transaction log), ICRC-7 (NFT). Standard interfaces, canister IDs for ledgers. | Portal defi/tokens/token-standards files; icskills: icrc-ledger, wallet-integration | guides/defi/token-ledgers, guides/defi/wallet-integration | P0 |
| 72 | `reference/cycles-costs.md` | Cycles Costs | reference | intermediate | Exact cycle costs for compute, storage, HTTPS outcalls, signing, canister creation. Cost tables, comparison with cloud pricing. Resource limits. | Portal building-apps/canister-management/resource-limits.mdx, defi cost tables; reference/subnet-types for pricing tiers | guides/canister-management/cycles-management, concepts/reverse-gas-model | P0 |
| 73 | `reference/subnet-types.md` | Subnet Types Reference | reference | intermediate | All subnet types: application, system, European, fiduciary, Bitcoin, II. Node counts, replication factors, cycle cost multipliers. | Portal building-apps/developing-canisters/deploy-specific-subnet.mdx; icp-cli guides/deploying-to-specific-subnets.md | guides/canister-management/subnet-selection, reference/cycles-costs | P1 |
| 74 | `reference/execution-errors.md` | Execution Errors | reference | intermediate | Common canister execution errors with explanations and fixes. Trap codes, out-of-cycles, instruction limit exceeded, memory limit, call context errors. | Portal building-apps/canister-management/trapping.mdx, resource-limits.mdx | guides/canister-management/lifecycle, guides/canister-management/optimization, reference/cycles-costs | P1 |
| 75 | `reference/ic-interface-spec.md` | IC Interface Specification | reference | advanced | Summary and links to the IC interface specification. System API, HTTP interface, canister lifecycle, certified data. Links to the full spec. | Portal references/ic-interface-spec.mdx | reference/management-canister, reference/candid-spec | P1 |
| 76 | `reference/http-gateway-spec.md` | HTTP Gateway Specification | reference | advanced | How boundary nodes serve canister HTTP responses. The HTTP gateway protocol, certification, service workers. | Portal references/ (HTTP gateway section); Learn Hub: boundary nodes | guides/frontends/certification, reference/ic-interface-spec | P2 |
| 77 | `reference/candid-spec.md` | Candid Specification | reference | intermediate | The Candid interface description language. Type system, encoding, subtyping rules. Links to the full specification. | Portal references/candid-spec; | guides/canister-calls/candid, reference/ic-interface-spec | P1 |
| 78 | `reference/internet-identity-spec.md` | Internet Identity Specification | reference | advanced | Internet Identity protocol details. Delegation chains, passkey management, canister signatures, alternative origins. | Portal references/ (II section); icskills: internet-identity | guides/authentication/internet-identity, reference/system-canisters | P2 |
| 79 | `reference/glossary.md` | Glossary | reference | beginner | Definitions of ICP-specific terms. Canister, cycle, principal, subnet, replica, boundary node, NNS, SNS, chain-key, etc. | Portal references/glossary; all concept pages | All concept and guide pages | P1 |

---

## Page Count Summary

| Section | Pages | P0 | P1 | P2 |
|---------|-------|----|----|-----|
| Landing | 1 | 1 | 0 | 0 |
| Getting Started | 4 | 4 | 0 | 0 |
| Guides -- Backends | 7 | 3 | 2 | 2 |
| Guides -- Canisters | 6 | 3 | 2 | 0 | (Note: lifecycle, settings, reproducible-builds are P0)
| Guides -- Frontends | 4 | 1 | 2 | 1 |
| Guides -- Authentication | 2 | 1 | 1 | 0 |
| Guides -- Canister Calls | 3 | 2 | 1 | 0 |
| Guides -- Testing | 2 | 2 | 0 | 0 |
| Guides -- Production | 3 | 1 | 1 | 1 |
| Guides -- Chain Fusion | 4 | 2 | 0 | 2 |
| Guides -- DeFi | 3 | 1 | 1 | 1 |
| Guides -- Governance | 3 | 0 | 3 | 0 |
| Guides -- Security | 5 | 2 | 3 | 0 |
| Guides -- Tools | 2 | 1 | 1 | 0 |
| Concepts | 13 | 8 | 4 | 0 | (Note: security is P0)
| Languages -- Motoko | 1 | 1 | 0 | 0 |
| Languages -- Rust | 3 | 1 | 1 | 1 |
| Reference | 13 | 3 | 7 | 3 |
| **Total** | **79** | **37** | **29** | **11** |

Note: Motoko synced pages (~52) are not counted here. The `guides/tools/migrating-from-dfx.md` is auto-synced so it counts as P0 but requires no authoring effort.

---

## icskills Mapping Summary

17 skills mapped to docs pages. See `.docs-plan/jssdk-skills-mapping.md` for the full mapping table.

## JS SDK Mapping Summary

5 JS SDK projects mapped to docs pages. See `.docs-plan/jssdk-skills-mapping.md` for the full mapping table.
