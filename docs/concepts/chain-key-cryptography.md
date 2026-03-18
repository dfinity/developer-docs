---
title: "Chain-Key Cryptography"
description: "Threshold signatures that enable cross-chain integration, fast finality, and chain evolution"
sidebar:
  order: 9
icskills: []
---

Chain-key cryptography is a set of threshold cryptographic protocols that underpin the Internet Computer. Instead of any single node holding a private key, keys are split into shares distributed across the nodes of a [subnet](network-overview.md). Nodes collaboratively sign messages without ever reconstructing the full key — and this single capability enables everything from fast response verification to canisters signing transactions on Bitcoin, Ethereum, and dozens of other blockchains.

## Why threshold cryptography matters

On most blockchains, verifying state requires replaying transactions or trusting a full node. On ICP, verifying a response means checking **one signature against one public key** — regardless of how many nodes produced it. This is possible because each subnet holds a threshold BLS key: any sufficiently large subset of nodes can produce a valid signature, but no smaller group can forge one.

This design has several consequences for developers:

- **Fast verification.** Clients verify subnet responses with a single public key check. There is no need to download block headers or maintain a light client.
- **Certified data.** Canisters can set certified variables that the subnet signs at each block. Query responses that include these certificates are cryptographically authenticated, bridging the gap between fast queries and trusted updates. See [Certified variables](../guides/backends/certified-variables.md).
- **Onchain randomness.** The threshold BLS scheme produces unique signatures — for a given message and key, only one valid signature exists. ICP exploits this property to generate unpredictable, unbiased random numbers that canisters can consume. See [Onchain randomness](onchain-randomness.md).
- **Cross-chain signing.** Canisters can request threshold ECDSA, Schnorr, and EdDSA signatures, giving them the ability to control addresses and sign transactions on external blockchains. This is the foundation of [Chain Fusion](chain-fusion.md).

## Core protocols

Chain-key cryptography is not a single algorithm but a protocol suite. The main components are:

### Distributed key generation (DKG)

Before a subnet can sign anything, its nodes must collectively generate a key whose shares are distributed among them. ICP uses a novel DKG protocol that works over an **asynchronous network** and tolerates up to one-third of nodes being faulty. The same protocol handles **key resharing** — transferring key material to a new set of nodes when subnet membership changes — without ever reconstructing the private key.

### Threshold BLS signatures

BLS is the signature scheme used for ICP's internal operations: consensus, response certification, cross-subnet messaging, and randomness generation.

BLS was chosen for two properties:

1. **Non-interactive signing.** A node holding a key share can independently produce a signature share. Shares are combined into a full signature with no further communication between nodes.
2. **Unique signatures.** For a given public key and message, exactly one valid BLS signature exists. This uniqueness is what makes onchain randomness unbiasable — no coalition of nodes can influence the output.

### Chain-key signatures (threshold ECDSA, Schnorr, EdDSA)

Chain-key signatures extend threshold cryptography beyond ICP's internal operations. They let canisters hold keys for external signature schemes and sign arbitrary messages, which means canisters can control accounts on other blockchains.

Three signature schemes are supported:

| Scheme | Algorithm | Key ID examples | Use cases |
|--------|-----------|-----------------|-----------|
| Threshold ECDSA | `secp256k1` | `key_1`, `test_key_1` | Bitcoin (legacy/SegWit), Ethereum, EVM chains, Filecoin |
| Threshold Schnorr (BIP340) | `bip340secp256k1` | `key_1`, `test_key_1` | Bitcoin Taproot, Ordinals |
| Threshold Schnorr (Ed25519) | `ed25519` | `key_1`, `test_key_1` | Solana, TON, Cardano, Polkadot, NEAR |

Each scheme is backed by a pair of management canister methods:

- **Public key retrieval** (`ecdsa_public_key`, `schnorr_public_key`) — returns a canister's public key for a given derivation path.
- **Signing** (`sign_with_ecdsa`, `sign_with_schnorr`) — computes a threshold signature using the canister's derived key.

See the [Management canister reference](../reference/management-canister.md) for the full API, and the [IC interface specification](../reference/ic-interface-spec.md) for the authoritative protocol-level details.

### Key derivation

A small number of **master keys** are deployed across the network — one per signature scheme. From each master key, the protocol derives a unique **canister root key** for every canister using the canister's principal as input. From the root key, canisters can derive an unlimited number of child keys by providing a `derivation_path` in API calls.

For ECDSA and BIP340, key derivation uses a generalized form of [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki), which means derived keys are compatible with standard Bitcoin and Ethereum HD wallet tooling. Ed25519 uses a custom hierarchical derivation mechanism designed for this use case.

Derivation is transparent — it happens inside the protocol as part of the signing and public-key-retrieval APIs. You provide a derivation path and the protocol handles the rest.

### Pre-signatures

Signing is split into two phases for performance. An expensive **pre-signature computation** runs asynchronously in the background, producing pre-computed values that are consumed by individual signing requests. This means the latency you experience when calling `sign_with_ecdsa` or `sign_with_schnorr` is dominated by a single consensus round, not the full multi-party computation.

Under high load, pre-signatures may be temporarily exhausted and signing requests can time out. If this happens, retry after a brief delay.

## Deployed keys

Six master keys are currently deployed across two subnets — one for signing and one as a backup for key availability:

| Key ID | Scheme | Purpose | Signing subnet |
|--------|--------|---------|----------------|
| `(secp256k1, test_key_1)` | ECDSA | Development and testing | 13-node subnet |
| `(secp256k1, key_1)` | ECDSA | Production | High-replication subnet |
| `(bip340secp256k1, test_key_1)` | Schnorr | Development and testing | 13-node subnet |
| `(bip340secp256k1, key_1)` | Schnorr | Production | High-replication subnet |
| `(ed25519, test_key_1)` | Schnorr (Ed25519) | Development and testing | 13-node subnet |
| `(ed25519, key_1)` | Schnorr (Ed25519) | Production | High-replication subnet |

Test keys are available for development and run on smaller subnets with lower signing costs. They should not be used for anything of value. Production keys run on high-replication subnets (34+ nodes) for stronger security guarantees.

For signing costs, see [Cycles costs](../reference/cycles-costs.md).

## Supported chains

Any blockchain whose transaction authentication uses ECDSA (secp256k1), Schnorr (BIP340), or EdDSA (Ed25519) can be integrated with ICP through chain-key signatures. The following table lists a selection of supported chains:

| Chain | Signature scheme | Integration method |
|-------|-----------------|-------------------|
| Bitcoin | ECDSA, Schnorr (Taproot) | Direct (Bitcoin adapter) |
| Ethereum | ECDSA | EVM RPC canister |
| EVM chains (Arbitrum, Base, Optimism, etc.) | ECDSA | EVM RPC canister |
| Solana | EdDSA | SOL RPC canister |
| Dogecoin | ECDSA | Direct (Dogecoin canister) |
| Cardano | ECDSA, EdDSA | HTTPS outcalls to RPC |
| Polkadot | ECDSA, EdDSA | HTTPS outcalls to RPC |
| NEAR | EdDSA | HTTPS outcalls to RPC |
| TON | EdDSA | HTTPS outcalls to RPC |
| Cosmos | ECDSA, EdDSA | HTTPS outcalls to RPC |
| Stellar | EdDSA | HTTPS outcalls to RPC |

This is not exhaustive. If a chain uses a supported signature scheme and has RPC providers accessible over IPv6, integration is possible. For chain-specific guides, see the [Chain Fusion guides](../guides/chain-fusion/bitcoin.md).

## Chain evolution

The same threshold cryptographic infrastructure that enables signing also enables ICP to upgrade itself without downtime or forks. When a subnet's membership changes (nodes are added, removed, or replaced), the DKG protocol **reshares** the existing keys to the new set of nodes. The subnet's public key stays the same, but the underlying shares change — meaning old shares held by removed nodes become useless.

This resharing also happens periodically within a subnet as a defense against adaptive attackers who might try to compromise nodes over time. Each resharing invalidates all previously obtained shares.

Combined with the NNS governance system, this enables **autonomous protocol upgrades**: the NNS approves an upgrade, the orchestrator on each node downloads the new replica software, and the subnet transitions at the next epoch boundary — all while preserving canister state and maintaining the same public key.

For more on how upgrades work at the protocol level, see the [Learn Hub](https://learn.internetcomputer.org).

## What's next

- [Chain Fusion](chain-fusion.md) — how canisters use chain-key signatures to interact with other blockchains
- [VetKeys](vetkeys.md) — a related cryptographic primitive for onchain encryption
- [Management canister reference](../reference/management-canister.md) — the threshold signing API

<!-- Upstream: informed by dfinity/portal docs/references/t-sigs-how-it-works.mdx, docs/building-apps/chain-fusion/overview.mdx, docs/building-apps/chain-fusion/supported-chains.mdx -->
