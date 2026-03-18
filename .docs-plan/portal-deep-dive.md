# Portal Deep Dive

## Summary

- **Total portal docs files (excluding _attachments, tests, release notes):** 269 content files
- **Total including release notes:** 291 files (22 release notes)
- **Plus:** 1 home.mdx, 1 updates index
- **File format:** All `.mdx` (JSX-heavy, must be rewritten as plain `.md`)
- **Sections:** build-on-btc (14), building-apps (166), defi (43), references (23), tutorials (71), other (23)
- **Key finding:** ~60% of portal content maps to our planned structure. ~25% is end-user/NNS dapp content we should DROP. ~15% needs EVALUATE for partial extraction.
- **Flagged topics found:** HTTPS outcalls (5 files), timers (1), randomness (1), reproducible builds (1), canister snapshots (2), subnet types (1), binding generation (1 partial), canister discovery (0 explicit), cycles management (3), verifiable credentials (4), composite queries (in advanced-calls), certified variables (in advanced-calls + tutorial), SIMD (1), large Wasm (0 explicit, covered in compile.mdx)

---

## Triage Table

### build-on-btc/ (14 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| build-on-btc/index.mdx | explanation | ALREADY-PLANNED | guides/chain-fusion/bitcoin.md | high | Overview of BTC integration |
| build-on-btc/btc-api.mdx | reference | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | high | Bitcoin API reference content |
| build-on-btc/btc-dev-env.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | medium | Local BTC dev setup |
| build-on-btc/btc-dev-workflow.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | high | Core dev workflow |
| build-on-btc/btc-transactions/create-transactions.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | high | Creating BTC transactions |
| build-on-btc/btc-transactions/generate-addresses.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | high | Generating BTC addresses |
| build-on-btc/btc-transactions/sign-transactions.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | high | Signing BTC transactions |
| build-on-btc/btc-transactions/submit-transactions.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | high | Submitting BTC transactions |
| build-on-btc/read-state.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | medium | Reading BTC state |
| build-on-btc/using-regtest.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/bitcoin.md | medium | Local regtest setup |
| build-on-btc/brc-20.mdx | how-to | EVALUATE | guides/chain-fusion/bitcoin.md | low | BRC-20 token standard (niche) |
| build-on-btc/brc20.mdx | how-to | DROP | N/A | low | Duplicate of brc-20.mdx |
| build-on-btc/ordinals.mdx | how-to | EVALUATE | guides/chain-fusion/bitcoin.md | low | Ordinals integration (niche) |
| build-on-btc/runes.mdx | how-to | EVALUATE | guides/chain-fusion/bitcoin.md | low | Runes integration (niche) |

### building-apps/advanced/ (6 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/advanced/benchmarking.mdx | how-to | KEEP-REWRITE | guides/testing/strategies.md | medium | Performance benchmarking |
| building-apps/advanced/canister-access-logs.mdx | how-to | KEEP-REWRITE | guides/canister-management/logs.md | medium | Access logs for canisters |
| building-apps/advanced/canister-migration.mdx | how-to | KEEP-REWRITE | guides/canister-management/lifecycle.md | medium | Migrating canisters between subnets |
| building-apps/advanced/optimize/motoko.mdx | how-to | KEEP-REWRITE | guides/canister-management/optimization.md | medium | Motoko optimization |
| building-apps/advanced/optimize/rust.mdx | how-to | KEEP-REWRITE | guides/canister-management/optimization.md | medium | Rust optimization |
| building-apps/advanced/using-third-party-canisters.mdx | how-to | KEEP-REWRITE | guides/canister-calls/onchain-calls.md | medium | Third-party canister integration |

### building-apps/authentication/ (5 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/authentication/overview.mdx | explanation | ALREADY-PLANNED | guides/authentication/internet-identity.md | high | Auth overview |
| building-apps/authentication/integrate-internet-identity.mdx | how-to | KEEP-REWRITE | guides/authentication/internet-identity.md | high | II integration guide |
| building-apps/authentication/integrate-misc-wallets.mdx | how-to | KEEP-REWRITE | guides/defi/wallet-integration.md | medium | NFID, Plug, etc. |
| building-apps/authentication/alternative-origins.mdx | how-to | KEEP-REWRITE | guides/authentication/internet-identity.md | medium | Alternative origins for II |
| building-apps/authentication/independently-verifying-ic-signatures.mdx | reference | KEEP-REWRITE | guides/security/data-integrity.md | low | Signature verification |

### building-apps/best-practices/ (7 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/best-practices/general.mdx | how-to | KEEP-REWRITE | guides/security/access-management.md (partial) | medium | General best practices, split across guides |
| building-apps/best-practices/reproducible-builds.mdx | how-to | KEEP-REWRITE | guides/canister-management/reproducible-builds.md | high | **FLAGGED** Reproducible builds |
| building-apps/best-practices/application-architectures.mdx | explanation | ALREADY-PLANNED | concepts/app-architecture.md | medium | App architecture patterns |
| building-apps/best-practices/idempotency.mdx | explanation | KEEP-REWRITE | guides/backends/data-persistence.md | medium | Idempotent operations |
| building-apps/best-practices/storage.mdx | how-to | KEEP-REWRITE | guides/backends/data-persistence.md | medium | Storage best practices |
| building-apps/best-practices/troubleshooting.mdx | how-to | LINK-EXTERNAL | icp-cli docs | low | CLI troubleshooting, mostly dfx-specific |
| building-apps/best-practices/trust-in-canisters.mdx | explanation | KEEP-REWRITE | concepts/security.md | medium | Canister trust model |

### building-apps/canister-management/ (14 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/canister-management/control.mdx | how-to | KEEP-REWRITE | guides/canister-management/settings.md | high | Controller management |
| building-apps/canister-management/settings.mdx | reference | KEEP-REWRITE | guides/canister-management/settings.md | high | Canister settings |
| building-apps/canister-management/snapshots.mdx | how-to | KEEP-REWRITE | guides/canister-management/snapshots.md | medium | **FLAGGED** Canister snapshots |
| building-apps/canister-management/upgrade.mdx | how-to | KEEP-REWRITE | guides/canister-management/lifecycle.md | high | Canister upgrades |
| building-apps/canister-management/state.mdx | explanation | KEEP-REWRITE | guides/canister-management/lifecycle.md | medium | Canister state management |
| building-apps/canister-management/storage.mdx | how-to | KEEP-REWRITE | guides/backends/data-persistence.md | high | Storage management |
| building-apps/canister-management/logs.mdx | how-to | KEEP-REWRITE | guides/canister-management/logs.md | medium | Canister logging |
| building-apps/canister-management/backtraces.mdx | how-to | KEEP-REWRITE | guides/canister-management/logs.md | low | Backtrace debugging |
| building-apps/canister-management/topping-up.mdx | how-to | KEEP-REWRITE | guides/canister-management/cycles-management.md | high | **FLAGGED** Cycles top-up |
| building-apps/canister-management/cycles-wallet.mdx | deprecated | DROP | N/A | low | Cycles wallet is deprecated |
| building-apps/canister-management/delete.mdx | how-to | KEEP-REWRITE | guides/canister-management/lifecycle.md | low | Deleting canisters |
| building-apps/canister-management/history.mdx | how-to | KEEP-REWRITE | guides/canister-management/lifecycle.md | low | Canister history |
| building-apps/canister-management/resource-limits.mdx | reference | KEEP-REWRITE | reference/cycles-costs.md | medium | Resource limits |
| building-apps/canister-management/trapping.mdx | explanation | KEEP-REWRITE | guides/canister-management/lifecycle.md | low | Trap handling |

### building-apps/chain-fusion/ (16 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/chain-fusion/overview.mdx | explanation | ALREADY-PLANNED | concepts/chain-fusion.md | high | Chain Fusion overview |
| building-apps/chain-fusion/supported-chains.mdx | reference | KEEP-REWRITE | concepts/chain-fusion.md | high | Supported chains list |
| building-apps/chain-fusion/examples.mdx | reference | KEEP-REWRITE | guides/chain-fusion/bitcoin.md (partial) | medium | Examples listing |
| building-apps/chain-fusion/ethereum/overview.mdx | explanation | ALREADY-PLANNED | guides/chain-fusion/ethereum.md | high | Ethereum overview |
| building-apps/chain-fusion/ethereum/using-eth/eth-comparison.mdx | explanation | KEEP-REWRITE | guides/chain-fusion/ethereum.md | medium | ETH vs ICP comparison |
| building-apps/chain-fusion/ethereum/using-eth/eth-dev-workflow.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/ethereum.md | high | ETH dev workflow |
| building-apps/chain-fusion/ethereum/using-eth/generating-addresses.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/ethereum.md | high | Generate ETH addresses |
| building-apps/chain-fusion/ethereum/using-eth/signing-transactions.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/ethereum.md | high | Sign ETH transactions |
| building-apps/chain-fusion/ethereum/using-eth/submit-transactions.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/ethereum.md | high | Submit ETH transactions |
| building-apps/chain-fusion/ethereum/evm-rpc/overview.mdx | explanation | KEEP-REWRITE | guides/chain-fusion/ethereum.md | high | EVM RPC overview, canister ID 7hfb6-caaaa-aaaar-qadga-cai |
| building-apps/chain-fusion/ethereum/evm-rpc/evm-rpc-canister.mdx | how-to | KEEP-REWRITE | guides/chain-fusion/ethereum.md | high | Using EVM RPC canister |
| building-apps/chain-fusion/ethereum/evm-rpc/how-it-works.mdx | explanation | KEEP-REWRITE | concepts/chain-fusion.md | medium | EVM RPC internals |
| building-apps/chain-fusion/ethereum/evm-rpc/costs.mdx | reference | KEEP-REWRITE | guides/chain-fusion/ethereum.md | medium | EVM RPC costs |
| building-apps/chain-fusion/solana/overview.mdx | explanation | ALREADY-PLANNED | guides/chain-fusion/solana.md | medium | Solana integration |
| building-apps/chain-fusion/dogecoin/overview.mdx | explanation | ALREADY-PLANNED | guides/chain-fusion/dogecoin.md | low | Dogecoin integration |

### building-apps/developer-tools/ (12 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/developer-tools/dev-tools-overview.mdx | explanation | ALREADY-PLANNED | guides/tools/overview.md | medium | Tools overview |
| building-apps/developer-tools/dfx-json.mdx | reference | LINK-EXTERNAL | icp-cli docs | medium | icp.json config (was dfx.json) |
| building-apps/developer-tools/dfx-json-reference.mdx | reference | LINK-EXTERNAL | icp-cli docs | medium | Full dfx.json reference |
| building-apps/developer-tools/icp-ninja.mdx | how-to | KEEP-REWRITE | guides/tools/overview.md | medium | icp.ninja playground |
| building-apps/developer-tools/advanced-dfx/check-chunk-store.mdx | how-to | LINK-EXTERNAL | icp-cli docs | low | Chunk store checking |
| building-apps/developer-tools/advanced-dfx/dfx-migration.mdx | how-to | ALREADY-PLANNED | guides/tools/migrating-from-dfx.md | high | dfx migration guide (synced) |
| building-apps/developer-tools/advanced-dfx/specifying-replica-version.mdx | how-to | LINK-EXTERNAL | icp-cli docs | low | Replica version selection |
| building-apps/developer-tools/cdks/index.mdx | explanation | KEEP-REWRITE | guides/tools/overview.md | medium | CDK overview |
| building-apps/developer-tools/cdks/rust/intro-to-rust.mdx | tutorial | KEEP-REWRITE | languages/rust/index.md | high | Rust CDK intro |
| building-apps/developer-tools/cdks/rust/canister-state.mdx | how-to | KEEP-REWRITE | languages/rust/stable-structures.md | medium | Rust canister state |
| building-apps/developer-tools/cdks/rust/generating-candid.mdx | how-to | KEEP-REWRITE | guides/canister-calls/binding-generation.md | medium | **FLAGGED** Candid generation |
| building-apps/developer-tools/cdks/rust/intercanister.mdx | how-to | KEEP-REWRITE | guides/canister-calls/onchain-calls.md | medium | Rust inter-canister calls |
| building-apps/developer-tools/cdks/rust/message-inspect.mdx | how-to | KEEP-REWRITE | languages/rust/index.md | low | Message inspect |
| building-apps/developer-tools/cdks/rust/rust-limitations.mdx | reference | KEEP-REWRITE | languages/rust/index.md | low | Rust CDK limitations |
| building-apps/developer-tools/cdks/rust/stable-structures.mdx | how-to | KEEP-REWRITE | languages/rust/stable-structures.md | high | Stable structures |
| building-apps/developer-tools/cdks/rust/upgrading.mdx | how-to | KEEP-REWRITE | languages/rust/index.md | medium | Upgrading Rust canisters |

### building-apps/developing-canisters/ (7 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/developing-canisters/write.mdx | tutorial | ALREADY-PLANNED | getting-started/quickstart.md | high | Writing canister code |
| building-apps/developing-canisters/create.mdx | how-to | KEEP-REWRITE | guides/canister-management/lifecycle.md | high | Creating canisters |
| building-apps/developing-canisters/compile.mdx | how-to | KEEP-REWRITE | guides/canister-management/lifecycle.md | medium | Compiling canisters, mentions large Wasm |
| building-apps/developing-canisters/install.mdx | how-to | KEEP-REWRITE | guides/canister-management/lifecycle.md | medium | Installing code |
| building-apps/developing-canisters/deploy.mdx | how-to | KEEP-REWRITE | guides/canister-management/lifecycle.md | high | Deploying canisters |
| building-apps/developing-canisters/deploy-specific-subnet.mdx | how-to | KEEP-REWRITE | guides/canister-management/subnet-selection.md | medium | **FLAGGED** Deploy to specific subnet |
| building-apps/developing-canisters/custom-networks.mdx | how-to | LINK-EXTERNAL | icp-cli docs | low | Custom network config |

### building-apps/essentials/ (4 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/essentials/canisters.mdx | explanation | ALREADY-PLANNED | concepts/canisters.md | high | Core canister concepts |
| building-apps/essentials/gas-cost.mdx | explanation | ALREADY-PLANNED | concepts/reverse-gas-model.md | high | Cycles/gas model |
| building-apps/essentials/message-execution.mdx | explanation | KEEP-REWRITE | concepts/canisters.md | high | Message execution model |
| building-apps/essentials/network-overview.mdx | explanation | ALREADY-PLANNED | concepts/network-overview.md | high | Network overview |

### building-apps/frontends/ (6 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/frontends/using-an-asset-canister.mdx | how-to | ALREADY-PLANNED | guides/frontends/asset-canister.md | high | Asset canister usage |
| building-apps/frontends/uploading-serving-assets.mdx | how-to | KEEP-REWRITE | guides/frontends/asset-canister.md | medium | Asset upload/serving |
| building-apps/frontends/asset-security.mdx | how-to | KEEP-REWRITE | guides/frontends/certification.md | medium | Asset certification/security |
| building-apps/frontends/existing-frontend.mdx | how-to | KEEP-REWRITE | guides/frontends/frameworks.md | medium | Integrating existing frontends |
| building-apps/frontends/custom-domains/using-custom-domains.mdx | how-to | ALREADY-PLANNED | guides/frontends/custom-domains.md | medium | Custom domain setup |
| building-apps/frontends/custom-domains/dns-setup.mdx | how-to | KEEP-REWRITE | guides/frontends/custom-domains.md | medium | DNS configuration |

### building-apps/getting-started/ (7 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/getting-started/install.mdx | tutorial | LINK-EXTERNAL | icp-cli docs | high | SDK installation (now icp-cli) |
| building-apps/getting-started/quickstart.mdx | tutorial | ALREADY-PLANNED | getting-started/quickstart.md | high | Quickstart tutorial |
| building-apps/getting-started/app-architecture.mdx | explanation | ALREADY-PLANNED | concepts/app-architecture.md | medium | App architecture |
| building-apps/getting-started/identities.mdx | how-to | LINK-EXTERNAL | icp-cli docs | medium | Identity management (CLI) |
| building-apps/getting-started/tokens-and-cycles.mdx | explanation | ALREADY-PLANNED | concepts/reverse-gas-model.md | medium | Tokens and cycles |
| building-apps/getting-started/troubleshooting.mdx | how-to | LINK-EXTERNAL | icp-cli docs | low | CLI troubleshooting |
| building-apps/getting-started/wsl-troubleshoot.mdx | how-to | LINK-EXTERNAL | icp-cli docs | low | WSL troubleshooting |

### building-apps/governing-apps/ (19 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/governing-apps/launching/index.mdx | how-to | ALREADY-PLANNED | guides/governance/launching.md | medium | SNS launch overview |
| building-apps/governing-apps/launching/integrating.mdx | how-to | KEEP-REWRITE | guides/governance/launching.md | medium | SNS integration |
| building-apps/governing-apps/launching/launch-steps-1proposal.mdx | how-to | KEEP-REWRITE | guides/governance/launching.md | medium | Launch steps |
| building-apps/governing-apps/launching/launch-summary-1proposal.mdx | how-to | KEEP-REWRITE | guides/governance/launching.md | medium | Launch summary |
| building-apps/governing-apps/managing/manage-sns-intro.mdx | how-to | ALREADY-PLANNED | guides/governance/managing.md | medium | Managing SNS |
| building-apps/governing-apps/managing/making-proposals.mdx | how-to | KEEP-REWRITE | guides/governance/managing.md | medium | Making proposals |
| building-apps/governing-apps/managing/cycles-usage.mdx | how-to | KEEP-REWRITE | guides/governance/managing.md | low | SNS cycles usage |
| building-apps/governing-apps/managing/sns-asset-canister.mdx | how-to | KEEP-REWRITE | guides/governance/managing.md | low | SNS asset canister |
| building-apps/governing-apps/testing/testing-before-launch.mdx | how-to | ALREADY-PLANNED | guides/governance/testing.md | medium | Pre-launch testing |
| building-apps/governing-apps/testing/testing-locally.mdx | how-to | KEEP-REWRITE | guides/governance/testing.md | medium | Local SNS testing |
| building-apps/governing-apps/testing/testing-on-mainnet.mdx | how-to | KEEP-REWRITE | guides/governance/testing.md | medium | Mainnet SNS testing |
| building-apps/governing-apps/tokenomics/index.mdx | explanation | KEEP-REWRITE | concepts/governance.md | medium | Tokenomics overview |
| building-apps/governing-apps/tokenomics/predeployment-considerations.mdx | how-to | KEEP-REWRITE | guides/governance/launching.md | medium | Pre-deployment considerations |
| building-apps/governing-apps/tokenomics/preparation.mdx | how-to | KEEP-REWRITE | guides/governance/launching.md | medium | Tokenomics preparation |
| building-apps/governing-apps/tokenomics/sns-checklist.mdx | how-to | KEEP-REWRITE | guides/governance/launching.md | medium | SNS checklist |
| building-apps/governing-apps/nns/concepts/proposal-requirements.mdx | explanation | LINK-EXTERNAL | Learn Hub | low | NNS proposal requirements |
| building-apps/governing-apps/nns/concepts/neurons/becoming-a-known-neuron.mdx | end-user | DROP | N/A | low | End-user NNS guide |
| building-apps/governing-apps/nns/concepts/proposals/proposal-submit.mdx | how-to | EVALUATE | guides/governance/managing.md | low | Submit NNS proposals |
| building-apps/governing-apps/nns/concepts/proposals/verify-proposals.mdx | how-to | EVALUATE | guides/governance/managing.md | low | Verify NNS proposals |

### building-apps/governing-apps/nns/using-the-nns-dapp/ (12 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-app-quickstart.mdx | end-user | DROP | N/A | low | NNS dapp quickstart |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-additional-features.mdx | end-user | DROP | N/A | low | NNS dapp features |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-advanced-neuron-operations.mdx | end-user | DROP | N/A | low | Neuron operations |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-confirm-following.mdx | end-user | DROP | N/A | low | Confirm following |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-following-other-neurons.mdx | end-user | DROP | N/A | low | Following neurons |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-importing-tokens.mdx | end-user | DROP | N/A | low | Importing tokens |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-making-neurons-public.mdx | end-user | DROP | N/A | low | Making neurons public |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-manage-quill-neurons.mdx | end-user | DROP | N/A | low | Quill neuron management |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-send-and-receive-tokens.mdx | end-user | DROP | N/A | low | Send/receive tokens |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-sns-topic-following.mdx | end-user | DROP | N/A | low | SNS topic following |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-staking-a-neuron.mdx | end-user | DROP | N/A | low | Staking neurons |
| building-apps/governing-apps/nns/using-the-nns-dapp/nns-dapp-voting-on-proposals.mdx | end-user | DROP | N/A | low | Voting on proposals |

### building-apps/interact-with-canisters/ (10 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/interact-with-canisters/query-calls.mdx | explanation | ALREADY-PLANNED | concepts/canisters.md | high | Query calls |
| building-apps/interact-with-canisters/update-calls.mdx | explanation | ALREADY-PLANNED | concepts/canisters.md | high | Update calls |
| building-apps/interact-with-canisters/advanced-calls.mdx | explanation | KEEP-REWRITE | guides/canister-calls/onchain-calls.md | high | **FLAGGED** Composite queries, certified queries |
| building-apps/interact-with-canisters/agents/overview.mdx | explanation | LINK-EXTERNAL | JS SDK docs | medium | Agent overview |
| building-apps/interact-with-canisters/agents/javascript-agent.mdx | how-to | LINK-EXTERNAL | JS SDK docs (js.icp.build) | medium | JS agent |
| building-apps/interact-with-canisters/agents/nodejs.mdx | how-to | LINK-EXTERNAL | JS SDK docs | medium | Node.js agent |
| building-apps/interact-with-canisters/agents/rust-agent.mdx | how-to | KEEP-REWRITE | languages/rust/index.md | medium | Rust agent |
| building-apps/interact-with-canisters/candid/candid-concepts.mdx | explanation | ALREADY-PLANNED | guides/canister-calls/candid.md | medium | Candid concepts |
| building-apps/interact-with-canisters/candid/using-candid.mdx | how-to | KEEP-REWRITE | guides/canister-calls/candid.md | medium | Using Candid |
| building-apps/interact-with-canisters/candid/candid-tools.mdx | reference | KEEP-REWRITE | guides/canister-calls/binding-generation.md | medium | **FLAGGED** Candid tools/binding generation |

### building-apps/network-features/ (19 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/network-features/periodic-tasks-timers.mdx | how-to | KEEP-REWRITE | guides/backends/timers.md + concepts/timers.md | high | **FLAGGED** Timers |
| building-apps/network-features/randomness.mdx | how-to | KEEP-REWRITE | guides/backends/randomness.md + concepts/onchain-randomness.md | high | **FLAGGED** Randomness |
| building-apps/network-features/simd.mdx | explanation | KEEP-REWRITE | guides/canister-management/large-wasm.md (partial) | medium | **FLAGGED** SIMD instructions |
| building-apps/network-features/time-and-timestamps.mdx | reference | KEEP-REWRITE | guides/backends/timers.md | low | Time/timestamps |
| building-apps/network-features/signatures/t-ecdsa.mdx | how-to | KEEP-REWRITE | concepts/chain-key-cryptography.md + guides/chain-fusion/bitcoin.md | high | Threshold ECDSA |
| building-apps/network-features/signatures/t-schnorr.mdx | how-to | KEEP-REWRITE | concepts/chain-key-cryptography.md + guides/chain-fusion/bitcoin.md | medium | Threshold Schnorr |
| building-apps/network-features/using-http/https-outcalls/overview.mdx | explanation | KEEP-REWRITE | concepts/https-outcalls.md + guides/backends/https-outcalls.md | high | **FLAGGED** HTTPS outcalls overview |
| building-apps/network-features/using-http/https-outcalls/get.mdx | how-to | KEEP-REWRITE | guides/backends/https-outcalls.md | high | **FLAGGED** HTTPS outcalls GET |
| building-apps/network-features/using-http/https-outcalls/post.mdx | how-to | KEEP-REWRITE | guides/backends/https-outcalls.md | high | **FLAGGED** HTTPS outcalls POST |
| building-apps/network-features/using-http/gateways.mdx | explanation | KEEP-REWRITE | reference/http-gateway-spec.md | low | HTTP gateways |
| building-apps/network-features/using-http/http-certification/ | how-to | KEEP-REWRITE | guides/frontends/certification.md | medium | HTTP certification (directory, files unknown) |
| building-apps/network-features/verifiable-credentials/overview.mdx | explanation | KEEP-REWRITE | concepts/security.md (partial) | medium | **FLAGGED** Verifiable credentials overview |
| building-apps/network-features/verifiable-credentials/how-it-works.mdx | explanation | KEEP-REWRITE | concepts/security.md (partial) | medium | **FLAGGED** VC how-it-works |
| building-apps/network-features/verifiable-credentials/issuer.mdx | how-to | KEEP-REWRITE | guides/authentication/internet-identity.md (partial) | medium | **FLAGGED** VC issuer |
| building-apps/network-features/verifiable-credentials/relying-party.mdx | how-to | KEEP-REWRITE | guides/authentication/internet-identity.md (partial) | medium | **FLAGGED** VC relying party |
| building-apps/network-features/vetkeys/introduction.mdx | explanation | ALREADY-PLANNED | concepts/vetkeys.md | medium | VetKeys intro |
| building-apps/network-features/vetkeys/api.mdx | reference | KEEP-REWRITE | concepts/vetkeys.md | medium | VetKeys API |
| building-apps/network-features/vetkeys/bls-signatures.mdx | explanation | KEEP-REWRITE | concepts/vetkeys.md | low | BLS signatures |
| building-apps/network-features/vetkeys/dkms.mdx | explanation | KEEP-REWRITE | concepts/vetkeys.md | low | Decentralized key management |
| building-apps/network-features/vetkeys/encrypted-onchain-storage.mdx | how-to | KEEP-REWRITE | concepts/vetkeys.md | medium | Encrypted storage |
| building-apps/network-features/vetkeys/identity-based-encryption.mdx | explanation | KEEP-REWRITE | concepts/vetkeys.md | low | IBE |
| building-apps/network-features/vetkeys/timelock-encryption.mdx | explanation | KEEP-REWRITE | concepts/vetkeys.md | low | Timelock encryption |
| building-apps/network-features/vetkeys/verifiable-random-function.mdx | explanation | KEEP-REWRITE | concepts/vetkeys.md | low | VRF |
| building-apps/network-features/vetkeys/demos/send_file_to_eth.mdx | tutorial | EVALUATE | concepts/vetkeys.md | low | VetKeys demo |

### building-apps/security/ (14 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/security/overview.mdx | explanation | ALREADY-PLANNED | concepts/security.md | high | Security overview |
| building-apps/security/iam.mdx | how-to | ALREADY-PLANNED | guides/security/access-management.md | high | Identity & access management |
| building-apps/security/canister-upgrades.mdx | how-to | ALREADY-PLANNED | guides/security/canister-upgrades.md | high | Upgrade security |
| building-apps/security/data-integrity-and-authenticity.mdx | how-to | ALREADY-PLANNED | guides/security/data-integrity.md | high | Data integrity |
| building-apps/security/dos.mdx | how-to | ALREADY-PLANNED | guides/security/dos-prevention.md | medium | DoS prevention |
| building-apps/security/inter-canister-calls.mdx | how-to | ALREADY-PLANNED | guides/security/inter-canister-calls.md | medium | Inter-canister call security |
| building-apps/security/data-storage.mdx | how-to | KEEP-REWRITE | guides/security/data-integrity.md | medium | Data storage security |
| building-apps/security/https-outcalls.mdx | how-to | KEEP-REWRITE | guides/security/data-integrity.md | medium | **FLAGGED** HTTPS outcalls security |
| building-apps/security/decentralization.mdx | explanation | KEEP-REWRITE | concepts/security.md | medium | Decentralization security |
| building-apps/security/formal-verification.mdx | how-to | KEEP-REWRITE | guides/testing/strategies.md | low | Formal verification |
| building-apps/security/misc.mdx | how-to | KEEP-REWRITE | guides/security/access-management.md | low | Misc security tips |
| building-apps/security/observability-and-monitoring.mdx | how-to | KEEP-REWRITE | guides/canister-management/logs.md | medium | Monitoring |
| building-apps/security/resources.mdx | reference | KEEP-REWRITE | concepts/security.md | low | Security resources |

### building-apps/test/ (2 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| building-apps/test/overview.mdx | explanation | ALREADY-PLANNED | guides/testing/strategies.md | high | Testing overview |
| building-apps/test/pocket-ic.mdx | how-to | ALREADY-PLANNED | guides/testing/pocket-ic.md | high | PocketIC testing |

### defi/ (top-level, 8 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| defi/overview.mdx | explanation | ALREADY-PLANNED | guides/defi/token-ledgers.md (intro) | medium | DeFi overview |
| defi/concepts.mdx | explanation | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | DeFi concepts |
| defi/create.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | Creating tokens |
| defi/defi-best-practices.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | DeFi best practices |
| defi/fetching-exchange-rates.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | Exchange rate canister |
| defi/nft-collections.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | low | NFT collections |
| defi/receiving-icp.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | Receiving ICP |

### defi/chain-key-tokens/ (9 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| defi/chain-key-tokens/overview.mdx | explanation | ALREADY-PLANNED | guides/defi/chain-key-tokens.md | high | Chain-key tokens overview |
| defi/chain-key-tokens/ckbtc/overview.mdx | explanation | KEEP-REWRITE | guides/defi/chain-key-tokens.md | high | ckBTC overview with canister IDs |
| defi/chain-key-tokens/ckbtc/using-ckbtc-in-dapps.mdx | how-to | KEEP-REWRITE | guides/defi/chain-key-tokens.md | high | Using ckBTC |
| defi/chain-key-tokens/cketh/overview.mdx | explanation | KEEP-REWRITE | guides/defi/chain-key-tokens.md | medium | ckETH overview |
| defi/chain-key-tokens/cketh/using-cketh-in-dapps.mdx | how-to | KEEP-REWRITE | guides/defi/chain-key-tokens.md | medium | Using ckETH |
| defi/chain-key-tokens/ckerc20/overview.mdx | explanation | KEEP-REWRITE | guides/defi/chain-key-tokens.md | medium | ckERC20 overview |
| defi/chain-key-tokens/ckerc20/using-ckerc20-in-dapps.mdx | how-to | KEEP-REWRITE | guides/defi/chain-key-tokens.md | medium | Using ckERC20 |
| defi/chain-key-tokens/ckerc20/making-transactions.mdx | how-to | KEEP-REWRITE | guides/defi/chain-key-tokens.md | medium | ckERC20 transactions |
| defi/chain-key-tokens/ckerc20/creating-new-ckerc20.mdx | how-to | KEEP-REWRITE | guides/defi/chain-key-tokens.md | low | Creating new ckERC20 |

### defi/rosetta/ (10 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| defi/rosetta/icp_rosetta/index.mdx | explanation | ALREADY-PLANNED | guides/defi/rosetta.md | medium | ICP Rosetta overview |
| defi/rosetta/icp_rosetta/running-rosetta.mdx | how-to | KEEP-REWRITE | guides/defi/rosetta.md | medium | Running ICP Rosetta |
| defi/rosetta/icp_rosetta/examples.mdx | how-to | KEEP-REWRITE | guides/defi/rosetta.md | medium | ICP Rosetta examples |
| defi/rosetta/icp_rosetta/construction_api/index.mdx | reference | KEEP-REWRITE | guides/defi/rosetta.md | medium | ICP Construction API |
| defi/rosetta/icp_rosetta/construction_api/operations-flow.mdx | reference | KEEP-REWRITE | guides/defi/rosetta.md | low | Operations flow |
| defi/rosetta/icp_rosetta/construction_api/staking.mdx | how-to | KEEP-REWRITE | guides/defi/rosetta.md | low | Staking via Rosetta |
| defi/rosetta/icp_rosetta/construction_api/voting.mdx | how-to | KEEP-REWRITE | guides/defi/rosetta.md | low | Voting via Rosetta |
| defi/rosetta/icp_rosetta/data_api/index.mdx | reference | KEEP-REWRITE | guides/defi/rosetta.md | medium | ICP Data API |
| defi/rosetta/icrc_rosetta/index.mdx | explanation | KEEP-REWRITE | guides/defi/rosetta.md | medium | ICRC Rosetta overview |
| defi/rosetta/icrc_rosetta/running-rosetta.mdx | how-to | KEEP-REWRITE | guides/defi/rosetta.md | medium | Running ICRC Rosetta |
| defi/rosetta/icrc_rosetta/examples.mdx | how-to | KEEP-REWRITE | guides/defi/rosetta.md | low | ICRC Rosetta examples |
| defi/rosetta/icrc_rosetta/construction_api/index.mdx | reference | KEEP-REWRITE | guides/defi/rosetta.md | low | ICRC Construction API |
| defi/rosetta/icrc_rosetta/data_api/index.mdx | reference | KEEP-REWRITE | guides/defi/rosetta.md | low | ICRC Data API |

### defi/token-standards/ (5 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| defi/token-standards/index.mdx | explanation | ALREADY-PLANNED | reference/token-standards.md | high | Token standards overview |
| defi/token-standards/icrc-1.mdx | reference | KEEP-REWRITE | reference/token-standards.md | high | ICRC-1 standard |
| defi/token-standards/icrc-2.mdx | reference | KEEP-REWRITE | reference/token-standards.md | high | ICRC-2 standard |
| defi/token-standards/icrc-7.mdx | reference | KEEP-REWRITE | reference/token-standards.md | medium | ICRC-7 NFT standard |
| defi/token-standards/icrc-37.mdx | reference | KEEP-REWRITE | reference/token-standards.md | low | ICRC-37 approval standard |

### defi/token-ledgers/ (6 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| defi/token-ledgers/cycles-ledger.mdx | how-to | KEEP-REWRITE | guides/canister-management/cycles-management.md | high | **FLAGGED** Cycles ledger |
| defi/token-ledgers/setup/icp_ledger_setup.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | ICP ledger setup |
| defi/token-ledgers/setup/icrc1_ledger_setup.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | ICRC-1 ledger setup |
| defi/token-ledgers/upgrading/icrc1_ledger_upgrade.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | low | ICRC-1 ledger upgrade |
| defi/token-ledgers/usage/icp_ledger_usage.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | ICP ledger usage |
| defi/token-ledgers/usage/icrc1_ledger_usage.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | ICRC-1 ledger usage |

### defi/token-indexes/ and defi/token-integrations/ (2 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| defi/token-indexes/index.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | Token index canisters |
| defi/token-integrations/index.mdx | how-to | KEEP-REWRITE | guides/defi/token-ledgers.md | medium | Token integrations |

### references/ (23 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| references/ic-interface-spec.md | reference | ALREADY-PLANNED | reference/ic-interface-spec.md | high | IC interface spec (very large) |
| references/http-gateway-protocol-spec.md | reference | ALREADY-PLANNED | reference/http-gateway-spec.md | medium | HTTP gateway spec |
| references/system-canisters/index.mdx | reference | ALREADY-PLANNED | reference/system-canisters.md | high | System canisters registry |
| references/system-canisters/management-canister.mdx | reference | ALREADY-PLANNED | reference/management-canister.md | high | Management canister |
| references/system-canisters/xrc.mdx | reference | KEEP-REWRITE | reference/system-canisters.md | medium | Exchange rate canister |
| references/subnets/subnet-types.mdx | reference | ALREADY-PLANNED | reference/subnet-types.md | medium | **FLAGGED** Subnet types |
| references/cycles-cost-formulas.mdx | reference | ALREADY-PLANNED | reference/cycles-costs.md | high | Cycles cost formulas |
| references/execution-errors.mdx | reference | ALREADY-PLANNED | reference/execution-errors.md | medium | Execution errors |
| references/glossary.mdx | reference | ALREADY-PLANNED | reference/glossary.md | medium | Glossary |
| references/candid-ref.mdx | reference | ALREADY-PLANNED | reference/candid-spec.md | medium | Candid reference |
| references/ledger.mdx | reference | KEEP-REWRITE | reference/system-canisters.md | medium | Ledger reference |
| references/ckbtc-reference.mdx | reference | KEEP-REWRITE | guides/defi/chain-key-tokens.md | medium | ckBTC reference |
| references/dashboard-apis.mdx | reference | KEEP-REWRITE | reference/system-canisters.md | low | Dashboard APIs |
| references/id-encoding-spec.mdx | reference | KEEP-REWRITE | reference/ic-interface-spec.md | low | ID encoding spec |
| references/message-execution-properties.mdx | reference | KEEP-REWRITE | reference/management-canister.md | medium | Message execution properties |
| references/async-code.mdx | explanation | KEEP-REWRITE | guides/canister-calls/onchain-calls.md | medium | Async code patterns |
| references/asset-canister.mdx | reference | KEEP-REWRITE | reference/application-canisters.md | medium | Asset canister spec |
| references/advanced-ingress-messages.mdx | reference | KEEP-REWRITE | reference/ic-interface-spec.md | low | Advanced ingress messages |
| references/bitcoin-how-it-works.mdx | explanation | KEEP-REWRITE | concepts/chain-fusion.md | medium | Bitcoin integration internals |
| references/https-outcalls-how-it-works.mdx | explanation | KEEP-REWRITE | concepts/https-outcalls.md | high | **FLAGGED** HTTPS outcalls internals |
| references/t-sigs-how-it-works.mdx | explanation | KEEP-REWRITE | concepts/chain-key-cryptography.md | high | Threshold signatures internals |
| references/vetkeys-overview.mdx | explanation | ALREADY-PLANNED | concepts/vetkeys.md | medium | VetKeys overview |
| references/using-hsm-with-identities.mdx | how-to | EVALUATE | guides/security/access-management.md | low | HSM for identities |

### tutorials/ (71 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| tutorials/developer-liftoff/index.mdx | tutorial | EVALUATE | getting-started/ | low | Liftoff index (Motoko track) |
| tutorials/developer-liftoff/level-0/*.mdx (7 files) | tutorial | DROP | concepts/ (content absorbed) | low | Overlaps with concepts/ pages |
| tutorials/developer-liftoff/level-1/*.mdx (7 files) | tutorial | DROP | getting-started/ (content absorbed) | low | Overlaps with getting-started + guides |
| tutorials/developer-liftoff/level-2/*.mdx (7 files) | tutorial | EVALUATE | guides/ (partial extraction) | low | Some unique content on storage, calls |
| tutorials/developer-liftoff/level-3/*.mdx (7 files) | tutorial | EVALUATE | guides/ (partial extraction) | medium | HTTPS outcalls tutorial, certified data, agents |
| tutorials/developer-liftoff/level-4/*.mdx (7 files) | tutorial | EVALUATE | guides/defi/ (partial extraction) | low | Ledger, ICRC, ckBTC, NNS tutorials |
| tutorials/developer-liftoff/level-5/*.mdx (7 files) | tutorial | EVALUATE | guides/ (partial extraction) | low | VetKeys, ETH, token swap, NFT, auction |
| tutorials/developer-liftoff-rust/index.mdx | tutorial | EVALUATE | getting-started/ | low | Liftoff Rust index |
| tutorials/developer-liftoff-rust/level-0/*.mdx (7 files) | tutorial | DROP | concepts/ (content absorbed) | low | Same L0 content as Motoko track |
| tutorials/developer-liftoff-rust/level-1/*.mdx (6 files) | tutorial | DROP | getting-started/ (content absorbed) | low | Overlaps with getting-started |
| tutorials/developer-liftoff-rust/level-2/*.mdx (6 files) | tutorial | EVALUATE | guides/ (partial extraction) | low | Rust-specific storage, state, upgrading |
| tutorials/developer-liftoff-rust/level-3/*.mdx (6 files) | tutorial | EVALUATE | guides/ (partial extraction) | medium | **FLAGGED** Canister snapshots tutorial (3.3) |
| tutorials/hackathon-prep-course/index.mdx | tutorial | DROP | N/A | low | Hackathon course index |
| tutorials/hackathon-prep-course/1-hello-world.mdx | tutorial | DROP | getting-started/quickstart.md | low | Overlaps with quickstart |
| tutorials/hackathon-prep-course/2-static-website.mdx | tutorial | DROP | guides/frontends/ | low | Overlaps with frontend guides |
| tutorials/hackathon-prep-course/3-first-fullstack-dapp.mdx | tutorial | EVALUATE | getting-started/ | low | Full-stack tutorial |
| tutorials/hackathon-prep-course/4-evm-block-explorer.mdx | tutorial | EVALUATE | guides/chain-fusion/ethereum.md | low | EVM block explorer |
| tutorials/hackathon-prep-course/5-create-deploy-token.mdx | tutorial | EVALUATE | guides/defi/token-ledgers.md | low | Token creation tutorial |
| tutorials/hackathon-prep-course/6-authentication.mdx | tutorial | DROP | guides/authentication/ | low | Overlaps with auth guides |
| tutorials/hackathon-prep-course/7-setup-dev-env.mdx | tutorial | DROP | icp-cli docs | low | Dev env setup |
| tutorials/hackathon-prep-course/8-managing-canisters.mdx | tutorial | DROP | guides/canister-management/ | low | Overlaps with canister guides |
| tutorials/hackathon-prep-course/9-advanced-features.mdx | tutorial | EVALUATE | guides/ | low | Advanced features |
| tutorials/hackathon-prep-course/10-resources.mdx | reference | DROP | N/A | low | Resource links, stale |

### other/ (23 files)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| other/updates/index.md | deprecated | DROP | N/A | low | Updates index |
| other/updates/release-notes/*.md (22 files) | deprecated | DROP | N/A | low | All dfx release notes, deprecated |

### Root files (1 file)

| Portal Path | Diataxis Type | Triage | New Docs Location | Priority | Notes |
|------------|---------------|--------|-------------------|----------|-------|
| home.mdx | landing | DROP | N/A | low | Landing page, JSX-heavy |

---

## Top 20 Priority Pages

Ranked by developer impact -- these should be written first, extracting content from the listed portal sources.

| Rank | New Docs Page | Portal Sources | Why |
|------|--------------|----------------|-----|
| 1 | guides/backends/https-outcalls.md | building-apps/network-features/using-http/https-outcalls/{overview,get,post}.mdx, references/https-outcalls-how-it-works.mdx, building-apps/security/https-outcalls.mdx | Core ICP differentiator. 5 portal files with rich code examples. |
| 2 | guides/backends/timers.md | building-apps/network-features/periodic-tasks-timers.mdx | Core ICP differentiator. Every backend needs periodic tasks. |
| 3 | guides/canister-management/lifecycle.md | building-apps/developing-canisters/{create,compile,install,deploy}.mdx, building-apps/canister-management/{upgrade,state,delete,history}.mdx | Fundamental canister operations. 8+ portal files to consolidate. |
| 4 | guides/canister-management/reproducible-builds.md | building-apps/best-practices/reproducible-builds.mdx | Trust-critical for production canisters. Well-written source. |
| 5 | guides/canister-management/cycles-management.md | building-apps/canister-management/topping-up.mdx, defi/token-ledgers/cycles-ledger.mdx, building-apps/essentials/gas-cost.mdx | Every developer needs this for mainnet. |
| 6 | concepts/canisters.md | building-apps/essentials/canisters.mdx, building-apps/essentials/message-execution.mdx, building-apps/interact-with-canisters/{query-calls,update-calls,advanced-calls}.mdx | Foundational concept. 5 portal files. |
| 7 | guides/chain-fusion/bitcoin.md | build-on-btc/{index,btc-api,btc-dev-env,btc-dev-workflow}.mdx, build-on-btc/btc-transactions/*.mdx | 14 portal files, major ecosystem feature. |
| 8 | guides/chain-fusion/ethereum.md | building-apps/chain-fusion/ethereum/**/*.mdx | 12 portal files, major ecosystem feature. |
| 9 | guides/backends/randomness.md | building-apps/network-features/randomness.mdx | Core ICP differentiator. Short but critical. |
| 10 | guides/authentication/internet-identity.md | building-apps/authentication/{overview,integrate-internet-identity,alternative-origins}.mdx | Every dapp needs auth. |
| 11 | reference/system-canisters.md | references/system-canisters/{index,xrc}.mdx | Essential reference with all canister IDs. |
| 12 | reference/cycles-costs.md | references/cycles-cost-formulas.mdx, building-apps/canister-management/resource-limits.mdx | Cost planning reference. |
| 13 | guides/testing/pocket-ic.md | building-apps/test/pocket-ic.mdx | Modern testing framework. |
| 14 | concepts/chain-key-cryptography.md | references/t-sigs-how-it-works.mdx, building-apps/network-features/signatures/{t-ecdsa,t-schnorr}.mdx | Core ICP differentiator. |
| 15 | reference/token-standards.md | defi/token-standards/{index,icrc-1,icrc-2,icrc-7,icrc-37}.mdx | Essential for DeFi developers. |
| 16 | guides/defi/chain-key-tokens.md | defi/chain-key-tokens/**/*.mdx | 9 portal files, major DeFi feature. |
| 17 | guides/canister-calls/onchain-calls.md | building-apps/interact-with-canisters/advanced-calls.mdx, references/async-code.mdx | Core development pattern. |
| 18 | guides/canister-management/snapshots.md | building-apps/canister-management/snapshots.mdx, tutorials/developer-liftoff-rust/level-3/3.3-canister-snapshots.mdx | Recovery mechanism, important for production. |
| 19 | guides/security/access-management.md | building-apps/security/{overview,iam}.mdx | Security fundamentals. |
| 20 | guides/canister-management/subnet-selection.md | references/subnets/subnet-types.mdx, building-apps/developing-canisters/deploy-specific-subnet.mdx | Production deployment decisions. |

---

## System Canister IDs Found

| Canister | ID | Portal Location |
|----------|-----|----------------|
| Bitcoin mainnet canister | `ghsi2-tqaaa-aaaan-aaaca-cai` | references/system-canisters/index.mdx |
| Bitcoin testnet canister | `g4xu7-jiaaa-aaaan-aaaaq-cai` | references/system-canisters/index.mdx |
| Cycles ledger | `um5iw-rqaaa-aaaaq-qaaba-cai` | references/system-canisters/index.mdx, defi/token-ledgers/cycles-ledger.mdx |
| Cycles ledger index | `ul4oc-4iaaa-aaaaq-qaabq-cai` | references/system-canisters/index.mdx, defi/token-ledgers/cycles-ledger.mdx |
| Cycles minting canister (CMC) | `rkp4c-7iaaa-aaaaa-aaaca-cai` | references/system-canisters/index.mdx |
| Exchange rate canister (XRC) | `uf6dk-hyaaa-aaaaq-qaaaq-cai` | references/system-canisters/index.mdx, references/system-canisters/xrc.mdx |
| Genesis token canister | `renrk-eyaaa-aaaaa-aaada-cai` | references/system-canisters/index.mdx |
| ICP index canister | `qhbym-qaaaa-aaaaa-aaafq-cai` | references/system-canisters/index.mdx, defi/token-indexes/index.mdx |
| ICP ledger canister | `ryjl3-tyaaa-aaaaa-aaaba-cai` | references/system-canisters/index.mdx, defi/token-ledgers/usage/icp_ledger_usage.mdx |
| ICP ledger archive 1 | `qsgjb-riaaa-aaaaa-aaaga-cai` | references/system-canisters/index.mdx |
| ICP ledger archive 2 | `qjdve-lqaaa-aaaaa-aaaeq-cai` | references/system-canisters/index.mdx |
| Internet Identity | `rdmx6-jaaaa-aaaaa-aaadq-cai` | references/system-canisters/index.mdx |
| NNS governance | `rrkah-fqaaa-aaaaa-aaaaq-cai` | references/system-canisters/index.mdx |
| NNS lifeline | `rno2w-sqaaa-aaaaa-aaacq-cai` | references/system-canisters/index.mdx |
| NNS registry | `rwlgt-iiaaa-aaaaa-aaaaa-cai` | references/system-canisters/index.mdx |
| NNS root | `r7inp-6aaaa-aaaaa-aaabq-cai` | references/system-canisters/index.mdx |
| NNS UI | `qoctq-giaaa-aaaaa-aaaea-cai` | references/system-canisters/index.mdx |
| SNS Wasm canister | `qaa6y-5yaaa-aaaaa-aaafa-cai` | references/system-canisters/index.mdx |
| EVM RPC canister | `7hfb6-caaaa-aaaar-qadga-cai` | building-apps/chain-fusion/ethereum/evm-rpc/overview.mdx |
| ckBTC minter (mainnet) | `mqygn-kiaaa-aaaar-qaadq-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC minter (testnet) | `ml52i-qqaaa-aaaar-qaaba-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC checker (mainnet) | `oltsj-fqaaa-aaaar-qal5q-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC checker (testnet) | `o6ude-eyaaa-aaaar-qal6a-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC ledger (mainnet) | `mxzaz-hqaaa-aaaar-qaada-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC ledger (testnet) | `mc6ru-gyaaa-aaaar-qaaaq-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC archive (mainnet) | `nbsys-saaaa-aaaar-qaaga-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC archive (testnet) | `m62lf-ryaaa-aaaar-qaacq-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC index (mainnet) | `n5wcd-faaaa-aaaar-qaaea-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckBTC index (testnet) | `mm444-5iaaa-aaaar-qaabq-cai` | defi/chain-key-tokens/ckbtc/overview.mdx |
| ckETH ledger | `ss2fx-dyaaa-aaaar-qacoq-cai` | defi/chain-key-tokens/cketh/using-cketh-in-dapps.mdx |
| ckETH minter | `sv3dd-oaaaa-aaaar-qacoa-cai` | defi/chain-key-tokens/ckerc20/making-transactions.mdx |
| ckUSDC ledger | `xevnm-gaaaa-aaaar-qafnq-cai` | defi/chain-key-tokens/ckerc20/overview.mdx |
| ckLINK ledger | `g4tto-rqaaa-aaaar-qageq-cai` | defi/chain-key-tokens/ckerc20/overview.mdx |
| Ledger suite orchestrator (ETH) | `vxkom-oyaaa-aaaar-qafda-cai` | defi/chain-key-tokens/ckerc20/making-transactions.mdx |
| ckTestETH | `apia6-jaaaa-aaaar-qabma-cai` | defi/rosetta/icrc_rosetta/running-rosetta.mdx |
| Management canister (virtual) | `aaaaa-aa` | references/system-canisters/management-canister.mdx |

---

## Content Gaps

Portal content that no current new-docs page cleanly covers:

| Gap | Portal Source | Recommendation |
|-----|-------------|----------------|
| **Verifiable credentials** (4 files) | building-apps/network-features/verifiable-credentials/*.mdx | Add guides/authentication/verifiable-credentials.md or fold into internet-identity.md |
| **VetKeys** (8 files) | building-apps/network-features/vetkeys/*.mdx | concepts/vetkeys.md covers explanation; may need guides/backends/vetkeys.md for how-to |
| **NFT collections** | defi/nft-collections.mdx | No explicit NFT guide planned; fold into guides/defi/token-ledgers.md |
| **Async code patterns** | references/async-code.mdx | Important content about Rust/Motoko async; needs home in guides/canister-calls/onchain-calls.md |
| **Application architectures** | building-apps/best-practices/application-architectures.mdx | concepts/app-architecture.md covers this but may need more depth |
| **Agent SDK guides** | building-apps/interact-with-canisters/agents/{overview,javascript-agent,nodejs,rust-agent}.mdx | JS agent content links to JS SDK; Rust agent needs coverage in languages/rust/ |
| **Rosetta API** (13 files) | defi/rosetta/**/*.mdx | guides/defi/rosetta.md is a single page; may need expansion for this volume |
| **Canister discovery** | No explicit portal file | New content needed for guides/canister-management/canister-discovery.md |
| **Binding generation** | building-apps/developer-tools/cdks/rust/generating-candid.mdx, building-apps/interact-with-canisters/candid/candid-tools.mdx | guides/canister-calls/binding-generation.md needs both files |
| **HSM identities** | references/using-hsm-with-identities.mdx | Niche but valuable; evaluate for guides/security/access-management.md |
| **Dashboard APIs** | references/dashboard-apis.mdx | No planned page; consider reference/system-canisters.md |
| **Formal verification** | building-apps/security/formal-verification.mdx | No planned page; fold into guides/testing/strategies.md |
| **SIMD** | building-apps/network-features/simd.mdx | No dedicated page; fold into guides/canister-management/large-wasm.md or create new guide |
| **Idempotency** | building-apps/best-practices/idempotency.mdx | Important pattern; fold into guides/backends/data-persistence.md |

---

## DeFi Content Analysis

**43 DeFi files** (excluding release notes) break into:

| Subcategory | File Count | Triage Recommendation |
|-------------|-----------|----------------------|
| Top-level DeFi (overview, concepts, best practices) | 8 | KEEP-REWRITE into guides/defi/token-ledgers.md |
| Chain-key tokens (ckBTC, ckETH, ckERC20) | 9 | KEEP-REWRITE into guides/defi/chain-key-tokens.md |
| Rosetta APIs (ICP + ICRC) | 13 | KEEP-REWRITE into guides/defi/rosetta.md (single page may be too small for 13 source files; consider splitting) |
| Token standards (ICRC-1, ICRC-2, ICRC-7, ICRC-37) | 5 | KEEP-REWRITE into reference/token-standards.md |
| Token ledgers (setup, usage, upgrade, cycles ledger) | 6 | KEEP-REWRITE into guides/defi/token-ledgers.md |
| Token indexes + integrations | 2 | KEEP-REWRITE into guides/defi/token-ledgers.md |

**Recommendation:** The 3 planned DeFi pages (token-ledgers, chain-key-tokens, rosetta) may be too few for 43 source files. Consider:
1. `guides/defi/token-ledgers.md` -- ledger setup, usage, indexes, integrations, cycles ledger (14 source files)
2. `guides/defi/chain-key-tokens.md` -- ckBTC, ckETH, ckERC20 (9 source files)
3. `guides/defi/rosetta.md` -- Rosetta API reference, may need a second page or heavy summarization (13 source files)
4. `reference/token-standards.md` -- ICRC standards (5 source files)
5. Consider adding: `guides/defi/exchange-rates.md` for the XRC canister usage

---

## Chain Fusion Content Analysis

Chain Fusion content is scattered across three portal sections:

| Section | Files | Content |
|---------|-------|---------|
| build-on-btc/ | 14 | Bitcoin-specific: BTC API, transactions, regtest, ordinals, runes, BRC-20 |
| building-apps/chain-fusion/ | 16 | Cross-chain: overview, Ethereum/EVM RPC, Solana, Dogecoin, examples |
| building-apps/network-features/signatures/ | 2 | Threshold signatures (tECDSA, tSchnorr) |
| references/bitcoin-how-it-works.mdx | 1 | Bitcoin integration internals |
| references/t-sigs-how-it-works.mdx | 1 | Threshold signatures internals |
| defi/chain-key-tokens/ | 9 | ckBTC, ckETH, ckERC20 (DeFi side of chain fusion) |

**Total: 43 files across 3 sections**

**Consolidation plan:**
1. `concepts/chain-fusion.md` -- What chain fusion is, supported chains, how tECDSA/tSchnorr work (from overview + references)
2. `guides/chain-fusion/bitcoin.md` -- BTC API, transactions, dev env, regtest (14 build-on-btc files + reference/bitcoin-how-it-works)
3. `guides/chain-fusion/ethereum.md` -- ETH workflow, addresses, signing, EVM RPC (12 files from chain-fusion/ethereum/)
4. `guides/chain-fusion/solana.md` -- Solana integration (1 file, early stage)
5. `guides/chain-fusion/dogecoin.md` -- Dogecoin integration (1 file, early stage)
6. `guides/defi/chain-key-tokens.md` -- ckBTC/ckETH/ckERC20 usage in dapps (9 files, DeFi-oriented)

**Note:** Ordinals, Runes, and BRC-20 content (3 files) is niche. Recommend EVALUATE -- include as subsections of bitcoin.md only if demand warrants it.

---

## Triage Statistics

| Triage Category | Count | Percentage |
|-----------------|-------|-----------|
| KEEP-REWRITE | 148 | 44% |
| ALREADY-PLANNED | 49 | 15% |
| LINK-EXTERNAL | 14 | 4% |
| DROP | 54 | 16% |
| EVALUATE | 34 | 10% |
| Tutorial (folded into above) | 71 | 21% |

**Breakdown of DROPs:** 12 NNS dapp end-user guides, 22 release notes, 1 home.mdx, 7 hackathon overlap, 1 cycles wallet deprecated, 11 tutorial L0/L1 overlaps, 1 updates index.

**Breakdown of LINK-EXTERNAL:** 8 files to icp-cli docs (install, troubleshooting, identities, dfx.json, custom networks, WSL, advanced dfx), 3 to JS SDK docs (agent overview, JS agent, Node.js), 3 to Learn Hub (NNS concepts).
