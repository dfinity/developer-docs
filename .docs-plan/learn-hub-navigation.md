# Learn Hub Migration: Navigation Map

This file is the authoritative mapping from every Learn Hub article to its target location in the docs site. It drives the batch PR sequencing.

Source staging: `.migration/learn-hub/<category>/<section>/<slug>.md`
Scope decision: `.docs-plan/decisions.md` — "2026-05-06: Learn Hub migration"

---

## How to read this table

| Column | Meaning |
|---|---|
| **Learn Hub article** | Original article title and staging path |
| **Target** | Where the content lands in `docs/` |
| **Action** | `new` = create a new file; `expand` = add depth to an existing page; `reference` = goes to `docs/references/` |
| **Batch** | Which content PR handles this (see Batch plan below) |

---

## In-scope articles

### Batch 1 — Protocol stack (`docs/concepts-protocol-stack`)

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| How does ICP work? (intro) | `how-does-icp-work/introduction/how-does-icp-work.md` | — | **skip** (redundant with existing `docs/concepts/index.md`; kept for manual review in final cleanup PR) |
| Blockchain Protocol (overview) | `how-does-icp-work/blockchain-protocol/blockchain-protocol.md` | `docs/concepts/protocol/index.md` | new |
| Consensus | `how-does-icp-work/blockchain-protocol/consensus.md` | `docs/concepts/protocol/consensus.md` | new |
| Peer-to-peer | `how-does-icp-work/blockchain-protocol/peer-to-peer.md` | `docs/concepts/protocol/peer-to-peer.md` | new |
| Message Routing | `how-does-icp-work/blockchain-protocol/message-routing.md` | `docs/concepts/protocol/message-routing.md` | new |
| Execution Layer | `how-does-icp-work/blockchain-protocol/execution-layer.md` | `docs/concepts/protocol/execution.md` | new |
| State Synchronization | `how-does-icp-work/blockchain-protocol/state-synchronization.md` | `docs/concepts/protocol/state-synchronization.md` | new |

Cross-link updates after this batch:
- `docs/concepts/network-overview.md` — replace Learn Hub link with `concepts/protocol/index.md`
- `docs/references/glossary.md` — update entries for consensus, peer-to-peer, message-routing

---

### Batch 2 — Node infrastructure (`docs/concepts-node-infrastructure`)

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| Node Infrastructure (overview) | `how-does-icp-work/node-infrastructure/overview.md` | `docs/concepts/node-infrastructure.md` | new |
| Trusted Execution Environments | `how-does-icp-work/node-infrastructure/trusted-execution-environments.md` | `docs/concepts/node-infrastructure.md` | new (same file, dedicated section) |

Cross-link updates after this batch:
- `docs/concepts/https-outcalls.md` — replace Learn Hub TEE link with `concepts/node-infrastructure.md#trusted-execution-environments`

---

### Batch 3 — Edge infrastructure (`docs/concepts-edge-infrastructure`)

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| ICP and the Internet (overview) | `how-does-icp-work/icp-and-the-internet/icp-and-the-internet.md` | `docs/concepts/edge-infrastructure.md` | new |
| ICP Edge Infrastructure | `how-does-icp-work/icp-and-the-internet/icp-edge-infrastructure.md` | `docs/concepts/edge-infrastructure.md` | new (same file, expand) |
| HTTP Gateway Protocol (conceptual) | `how-does-icp-work/icp-and-the-internet/http-gateway-protocol.md` | `docs/concepts/edge-infrastructure.md` | new (same file, section) |
| Asset Certification | `how-does-icp-work/icp-and-the-internet/asset-certification.md` | `docs/concepts/edge-infrastructure.md` | new (same file, section) |
| HTTPS Outcalls | `how-does-icp-work/icp-and-the-internet/https-outcalls.md` | — | **skip** (already well-covered in `docs/concepts/https-outcalls.md` per issue #187; kept for manual review in final cleanup PR) |

Cross-link updates after this batch:
- `docs/references/http-gateway-spec.md` — add "See also: [Edge Infrastructure](../concepts/edge-infrastructure.md)" note at top

---

### Batch 4 — Evolution & scaling (`docs/concepts-evolution-scaling`)

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| Evolution & Scaling (overview) | `how-does-icp-work/evolution-scaling/evolution-scaling.md` | `docs/concepts/evolution-scaling.md` | new |
| Fault Tolerance | `how-does-icp-work/evolution-scaling/fault-tolerance.md` | `docs/concepts/evolution-scaling.md` | new (same file, section) |
| Subnet Creation | `how-does-icp-work/evolution-scaling/subnet-creation.md` | `docs/concepts/evolution-scaling.md` | new (same file, section) |
| Chain Evolution | `how-does-icp-work/evolution-scaling/chain-evolution.md` | `docs/concepts/evolution-scaling.md` | new (same file, section) |

Cross-link updates after this batch:
- `docs/concepts/chain-key-cryptography.md` — replace Learn Hub chain-evolution link with `concepts/evolution-scaling.md#chain-evolution`
- `docs/references/glossary.md` — update fault tolerance entry

---

### Batch 5 — Chain Fusion deep dives (`docs/concepts-chain-fusion-deep-dives`)

Move `docs/concepts/chain-fusion.md` → `docs/concepts/chain-fusion/index.md` in this PR. Merge the staging overview into it.

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| Chain Fusion (overview) | `how-does-icp-work/chain-fusion/chain-fusion.md` | `docs/concepts/chain-fusion/index.md` | expand (merge into existing page being moved here) |
| Bitcoin Integration (architecture) | `how-does-icp-work/chain-fusion/bitcoin-integration.md` | `docs/concepts/chain-fusion/bitcoin.md` | new |
| Bitcoin Checker Canister | `how-does-icp-work/chain-fusion/bitcoin-checker-canister.md` | `docs/concepts/chain-fusion/bitcoin.md` | new (same file, section) |
| Chain-Key Bitcoin (ckBTC mechanics) | `how-does-icp-work/chain-fusion/chain-key-bitcoin.md` | `docs/concepts/chain-fusion/bitcoin.md` | new (same file, section) |
| Ethereum Integration (architecture) | `how-does-icp-work/chain-fusion/ethereum-integration.md` | `docs/concepts/chain-fusion/ethereum.md` | new |
| EVM RPC Canister | `how-does-icp-work/chain-fusion/evm-rpc-canister.md` | `docs/concepts/chain-fusion/ethereum.md` | new (same file, section) |
| SOL RPC Canister | `how-does-icp-work/chain-fusion/sol-rpc-canister.md` | `docs/concepts/chain-fusion/solana.md` | new |
| Dogecoin Integration | `how-does-icp-work/chain-fusion/dogecoin-integration.md` | `docs/concepts/chain-fusion/dogecoin.md` | new |
| Exchange Rate Canister | `how-does-icp-work/chain-fusion/exchange-rate-canister.md` | `docs/concepts/chain-fusion/exchange-rate-canister.md` | new |
| Chain-Key Tokens (mechanics) | `how-does-icp-work/chain-fusion/chain-key-tokens.md` | `docs/concepts/chain-fusion/chain-key-tokens.md` | new |

Cross-link updates after this batch:
- `docs/guides/chain-fusion/bitcoin.mdx` — replace Learn Hub link with `concepts/chain-fusion/bitcoin.md`
- `docs/guides/chain-fusion/dogecoin.md` — update upstream comment
- `docs/guides/digital-assets/chain-key-tokens.mdx` — link to `concepts/chain-fusion/chain-key-tokens.md` for mechanics

---

### Batch 6 — Cryptography deep dives (`docs/concepts-cryptography-deep-dives`)

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| Chain-Key Cryptography (overview) | `how-does-icp-work/chain-key-cryptography/chain-key-cryptography.md` | `docs/concepts/chain-key-cryptography.md` | expand (add depth to intro section) |
| Certified Communication | `how-does-icp-work/chain-key-cryptography/certified-communication.md` | `docs/concepts/certified-data.md` | new |
| Subnet Keys & Subnet Signatures | `how-does-icp-work/chain-key-cryptography/subnet-keys-and-subnet-signatures.md` | `docs/concepts/chain-key-cryptography.md` | expand |
| Chain-Key Signatures (deep) | `how-does-icp-work/chain-key-cryptography/chain-key-signatures.md` | `docs/concepts/chain-key-cryptography.md` | expand |

Cross-link updates after this batch:
- `docs/guides/backends/certified-variables.md` — link to new `concepts/certified-data.md` for conceptual background

---

### Batch 7 — Governance deep dives (`docs/concepts-governance-deep-dives`)

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| NNS Overview | `how-does-icp-work/nns/overview.md` | `docs/concepts/governance.md` | expand |
| NNS Neurons | `how-does-icp-work/nns/neurons.md` | `docs/concepts/governance.md` | expand |
| NNS Proposals | `how-does-icp-work/nns/proposals.md` | `docs/concepts/governance.md` | expand |
| Neuron Attributes | `how-does-icp-work/nns/neuron-attributes.md` | `docs/concepts/governance.md` | expand |
| Neurons' Fund | `how-does-icp-work/nns/neurons-fund-nf.md` | `docs/concepts/governance.md` | expand |
| Voting Rewards | `how-does-icp-work/nns/voting-rewards.md` | `docs/concepts/governance.md` | expand |
| NNS Proposal Topics & Types | `how-does-icp-work/nns/proposal-topics-and-types.md` | `docs/references/nns-proposal-types.md` | new (reference) |
| SNS (overview) | `how-does-icp-work/sns/sns-service-nervous-system.md` | `docs/concepts/sns-framework.md` | new |
| SNS Framework & Architecture | `how-does-icp-work/sns/framework-and-architecture.md` | `docs/concepts/sns-framework.md` | new (same file, section) |
| SNS Launch | `how-does-icp-work/sns/launch.md` | `docs/concepts/sns-framework.md` | new (same file, section) |
| SNS Neurons | `how-does-icp-work/sns/neurons.md` | `docs/concepts/sns-framework.md` | new (same file, section) |
| SNS Proposals | `how-does-icp-work/sns/proposals.md` | `docs/concepts/sns-framework.md` | new (same file, section) |
| SNS Rewards | `how-does-icp-work/sns/rewards.md` | `docs/concepts/sns-framework.md` | new (same file, section) |
| SNS DAO Settings | `how-does-icp-work/sns/dao-settings.md` | `docs/references/sns-dao-settings.md` | new (reference) |
| SNS Inspect (user-facing) | `how-does-icp-work/sns/how-to-inspect-an-sns-and-its-dapp-canisters.md` | — | **skip** (out of scope: user-facing UI guide; dev alternative is programmatic SNS aggregator API) |

Cross-link updates after this batch:
- `docs/guides/governance/managing.md` — replace Learn Hub DAO settings link with `references/sns-dao-settings.md`
- `docs/guides/governance/managing.md` — replace SNS Neurons/Rewards links with `concepts/sns-framework.md`
- `docs/concepts/governance.md` — replace tokenomics Learn Hub link with `concepts/tokenomics.md` (batch 8)
- `docs/references/protocol-canisters.md` — replace SNS Learn Hub link with `concepts/sns-framework.md`
- `docs/references/glossary.md` — update governance entries

---

### Batch 8 — Tokens & ledgers (`docs/concepts-tokens-ledgers`)

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| Tokenomics (NNS) | `how-does-icp-work/tokens-governance/tokenomics.md` | `docs/concepts/tokenomics.md` | new |
| Tokenomics (SNS) | `how-does-icp-work/sns/tokenomics.md` | `docs/concepts/tokenomics.md` | new (same file, SNS section) |
| How Token Ledgers Work | `how-does-icp-work/tokens-governance/how-token-ledgers-work-on-the-internet-computer.md` | `docs/concepts/token-ledgers.md` | new |
| Tokens & Governance (overview) | `how-does-icp-work/tokens-governance/tokens-governance.md` | `docs/concepts/tokenomics.md` | new (same file, intro) |
| Cycles (billing mechanics) | `how-does-icp-work/canister-smart-contracts/cycles.md` | `docs/concepts/cycles.md` | expand (adds charging model depth) |
| Cycles Ledger | `how-does-icp-work/canister-smart-contracts/cycles-ledger.md` | `docs/concepts/cycles.md` | expand (adds ledger transfer semantics) |

Cross-link updates after this batch:
- `docs/concepts/governance.md` — replace Learn Hub tokenomics link with `concepts/tokenomics.md`

---

### Batch 9 — Canister concept fillers (`docs/concepts-canister-fillers`)

| Learn Hub article | Staging path | Target | Action |
|---|---|---|---|
| What is a Principal? | `how-does-icp-work/canister-smart-contracts/what-is-a-principal.md` | `docs/concepts/principals.md` | new |
| Canister Control | `how-does-icp-work/canister-smart-contracts/canister-control.md` | `docs/concepts/principals.md` | new (same file, section) |
| Canister Smart Contracts (conceptual intro) | `how-does-icp-work/canister-smart-contracts/canister-smart-contracts.md` | `docs/concepts/canisters.md` | expand |
| Computational Model | `how-does-icp-work/canister-smart-contracts/computational-model.md` | `docs/concepts/canisters.md` | expand |

Cross-link updates after this batch:
- `docs/concepts/canisters.md` — replace Learn Hub principal link with `concepts/principals.md`
- `docs/references/glossary.md` — update principal entry to link internally

---

## Skip articles (in-scope directory, not migrated)

These files sit inside `.migration/learn-hub/how-does-icp-work/` but are not migrated into docs. Do **not** delete them during batch PRs. They remain in the repo until the final cleanup PR, where a human reviews each one and decides whether to discard or migrate.

| Staging file | Reason skipped |
|---|---|
| `how-does-icp-work/introduction/how-does-icp-work.md` | Redundant with existing `docs/concepts/index.md` |
| `how-does-icp-work/icp-and-the-internet/https-outcalls.md` | Already well-covered in `docs/concepts/https-outcalls.md` (per issue #187) |
| `how-does-icp-work/sns/how-to-inspect-an-sns-and-its-dapp-canisters.md` | User-facing UI guide; developer alternative is the programmatic SNS aggregator API |

---

## Out-of-scope articles (not migrated to dev docs)

These are committed to `.migration/learn-hub/out-of-scope/` for reference during takedown planning only.

| Group | Count | Notes |
|---|---|---|
| What is ICP / Overview | 3 | Vision, history, what is ICP — marketing site |
| What is ICP / Performance | 3 | Performance comparison, benchmarks — marketing site |
| What is ICP / Decentralization | 2 | General audience — marketing site |
| How can I use ICP / Governance | ~14 | NNS dapp UI flows — NNS dapp help |
| How can I use ICP / Tokens & wallets | 4 | Quill/wallet flows — quill repo docs |
| How can I use ICP / Network stats | 3 | Operational stats — IC dashboard help |
| SNS inspection (user-facing) | 1 | Programmatic API alternative exists |

Disposition of these articles (which site each redirects to) is tracked outside this repo.

---

## Known Learn Hub links in the current docs (must all resolve before takedown)

Run this to find remaining links before Phase 3:
```bash
grep -rn "learn.internetcomputer.org" docs/ --include="*.md" --include="*.mdx"
```

Known locations as of 2026-05-06 (from issue #190 analysis):

| File | Current target | Replacement |
|---|---|---|
| `docs/index.mdx` | Learn Hub LinkCard | Remove or link to `concepts/index.md` |
| `docs/guides/chain-fusion/bitcoin.mdx` | Bitcoin integration article | `concepts/chain-fusion/bitcoin.md` |
| `docs/guides/chain-fusion/dogecoin.md` | Upstream comment only | Drop Learn Hub line |
| `docs/concepts/chain-key-cryptography.md` | Chain Evolution article | `concepts/evolution-scaling.md#chain-evolution` |
| `docs/guides/governance/managing.md` | DAO Settings article | `references/sns-dao-settings.md` |
| `docs/guides/governance/managing.md` | SNS Neurons + Rewards | `concepts/sns-framework.md` |
| `docs/concepts/governance.md` | ICP tokenomics overview | `concepts/tokenomics.md` |
| `docs/concepts/network-overview.md` | Learn Hub generic | `concepts/protocol/index.md` |
| `docs/concepts/https-outcalls.md` | TEE-enabled subnets | `concepts/node-infrastructure.md#trusted-execution-environments` |
| `docs/concepts/https-outcalls.md` | HTTPS outcalls article | Drop (well-covered inline) |
| `docs/concepts/canisters.md` | Principal article | `concepts/principals.md` |
| `docs/references/protocol-canisters.md` | SNS article | `concepts/sns-framework.md` |
| `docs/references/glossary.md` | Various protocol entries | Per-batch internal links (see above) |
