---
title: "Chain-key cryptography"
description: "Threshold signatures that enable crosschain integration, fast verification, and chain evolution"
sidebar:
  order: 9
---

Chain-key cryptography is a set of threshold cryptographic protocols that underpin the Internet Computer. Instead of any single node holding a private key, keys are split into shares distributed across the nodes of a [subnet](network-overview.md). Nodes collaboratively sign messages without ever reconstructing the full key: and this single capability enables everything from fast response verification to canisters signing transactions on Bitcoin, Ethereum, and dozens of other chains.

## Why threshold cryptography matters

On traditional distributed networks, verifying state requires replaying transactions or trusting a full node. On ICP, verifying a response means checking **one signature against one public key**: regardless of how many nodes produced it. This is possible because each subnet holds a threshold BLS key: any sufficiently large subset of nodes can produce a valid signature, but no smaller group can forge one.

This design has several consequences for developers:

- **Fast verification.** Clients verify subnet responses with a single public key check. There is no need to download block headers or maintain a light client.
- **Certified data.** Canisters can set certified variables that the subnet signs at each block. Query responses that include these certificates are cryptographically authenticated, bridging the gap between fast queries and trusted updates. See [Certified data](certified-data.md) for the conceptual explanation and [Certified variables](../guides/backends/certified-variables.md) for the implementation guide.
- **Verifiable randomness.** The threshold BLS scheme produces unique signatures: for a given message and key, only one valid signature exists. ICP exploits this property to generate unpredictable, unbiased random numbers that canisters can consume. See [Verifiable randomness](verifiable-randomness.md).
- **Crosschain signing.** Canisters can request threshold ECDSA and Schnorr signatures, giving them the ability to control addresses and sign transactions on external chains. This is the foundation of [Chain Fusion](chain-fusion/index.md).
- **Encryption.** VetKeys extend threshold cryptography to enable canisters to derive encryption keys on behalf of users, making encryption by network canisters practical. See [VetKeys](vetkeys.md).

## Core protocols

Chain-key cryptography is not a single algorithm but a protocol suite. The main components are:

### Distributed key generation (DKG)

Before a subnet can sign anything, its nodes must collectively generate a key whose shares are distributed among them. ICP uses a [novel DKG protocol](https://eprint.iacr.org/2021/339) that works over an **asynchronous network** and tolerates up to one-third of nodes being faulty. The same protocol handles **key resharing**: transferring key material to a new set of nodes when subnet membership changes (for example, during node rotation), without ever reconstructing the private key. Resharing ensures that shares held by removed nodes become useless, so the subnet's signing ability is preserved across membership changes while old shares cannot be exploited.

### Threshold BLS signatures

BLS is the signature scheme used for ICP's internal operations: consensus, response certification, cross-subnet messaging, and randomness generation.

BLS was chosen for two properties:

1. **Non-interactive signing.** A node holding a key share can independently produce a signature share. Shares are combined into a full signature with no further communication between nodes.
2. **Unique signatures.** For a given public key and message, exactly one valid BLS signature exists. This uniqueness is what makes the verifiable randomness unbiasable. No coalition of nodes can influence the output.

### Chain-key signatures (threshold ECDSA and Schnorr)

Chain-key signatures extend threshold cryptography beyond ICP's internal operations. They let canisters hold keys for external signature schemes and sign arbitrary messages, which means canisters can control accounts on other chains.

Two signature schemes are supported, with the Schnorr API offering two algorithm variants:

| Scheme | Algorithm | Key ID examples | Use cases |
|--------|-----------|-----------------|-----------|
| Threshold ECDSA | `secp256k1` | `key_1`, `test_key_1` | Bitcoin (legacy/SegWit), Ethereum, EVM chains, Filecoin |
| Threshold Schnorr | `bip340secp256k1` | `key_1`, `test_key_1` | Bitcoin Taproot, Ordinals |
| Threshold Schnorr | `ed25519` | `key_1`, `test_key_1` | Solana, TON, Polkadot, Cardano, NEAR |

Each scheme is backed by a pair of management canister methods:

- **Public key retrieval** (`ecdsa_public_key`, `schnorr_public_key`): returns a canister's public key for a given derivation path.
- **Signing** (`sign_with_ecdsa`, `sign_with_schnorr`): computes a threshold signature using the canister's derived key.

See the [Management canister reference](../references/management-canister.md#chain-key-signing) for the full API, and the [IC interface specification](../references/ic-interface-spec/index.md) for the authoritative protocol-level details.

#### Why threshold ECDSA is harder than threshold BLS

Threshold signing for BLS is straightforward because BLS signature shares can be combined non-interactively: each node signs independently and the shares are aggregated with no further communication. ECDSA has no such property; producing a threshold ECDSA signature requires a multi-round interactive protocol among the signing nodes.

Existing threshold ECDSA protocols in academic literature all assume either a synchronous network (messages must arrive within a bounded time) or offer no robustness against node crashes. Neither assumption is acceptable for ICP: security and liveness must hold over an asynchronous network with up to one-third of nodes faulty. ICP implements a novel threshold ECDSA protocol that is both asynchronous and robust, with formal security proofs published in [protocol design](https://eprint.iacr.org/2022/506) and [security analysis](https://eprint.iacr.org/2021/1330) papers.

Threshold Schnorr (including Ed25519) protocols are simplified variants of the ECDSA signing protocol. They inherit the same asynchronous-network and robustness properties.

### Key derivation

A small number of **master keys** are deployed across the network: one per signature scheme. From each master key, the protocol derives a unique **canister root key** for every canister using the canister's principal as input. From the root key, canisters can derive an unlimited number of child keys by providing a `derivation_path` in API calls.

For ECDSA and BIP340, key derivation uses a generalized form of [BIP-32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki), which means derived keys are compatible with standard Bitcoin and Ethereum HD wallet tooling. Ed25519 uses a custom hierarchical derivation mechanism designed for this use case.

Derivation is transparent: it happens inside the protocol as part of the signing and public-key-retrieval APIs. You provide a derivation path and the protocol handles the rest.

![Key derivation hierarchy: subnet master key → canister root key → child keys via BIP-32-style derivation path](/concepts/chain-key-cryptography/key_derivation.png)

Because the derivation algorithm is deterministic and uses only public parameters (the master public key, the canister principal, and the derivation path), public key derivation can also be performed **offline**: no management canister call or network connection required. This is useful for building explorers, dashboards, or address-derivation tools that need a canister's public key or network address without a live ICP connection. See the [offline key derivation guide](../guides/chain-fusion/offline-key-derivation.md) for TypeScript and Rust libraries.

<!-- ic-pub-key: the missing .d.ts issue (dfinity/ic-pub-key#197) is closed and fixed. Package may still move to the @icp-sdk/ namespace in a future release; update all references when that happens. -->

### Pre-signatures

Signing is split into two phases for performance. An expensive **pre-signature computation** runs asynchronously in the background, producing pre-computed values that are consumed by individual signing requests. This means the latency you experience when calling `sign_with_ecdsa` or `sign_with_schnorr` is dominated by a single consensus round, not the full multi-party computation.

Under high load, pre-signatures may be temporarily exhausted and signing requests can time out. If this happens, retry after a brief delay.

## Deployed keys

The following master keys are deployed at the time of writing. The Network Nervous System (NNS) can add new keys or change subnet assignments via proposals, so consult the [IC dashboard](https://dashboard.internetcomputer.org) for the current state.

| Key ID | Scheme | Purpose | Signing subnet |
|--------|--------|---------|----------------|
| `(secp256k1, test_key_1)` | ECDSA | Development and testing | 13-node subnet |
| `(secp256k1, key_1)` | ECDSA | Production | High-replication subnet |
| `(bip340secp256k1, test_key_1)` | Schnorr | Development and testing | 13-node subnet |
| `(bip340secp256k1, key_1)` | Schnorr | Production | High-replication subnet |
| `(ed25519, test_key_1)` | Schnorr (Ed25519) | Development and testing | 13-node subnet |
| `(ed25519, key_1)` | Schnorr (Ed25519) | Production | High-replication subnet |

Test keys are available for development and run on smaller subnets with lower signing costs. They should not be used for anything of value. Production keys run on high-replication subnets (34+ nodes) for stronger security guarantees. Each key is also reshared to a backup subnet for availability: if the signing subnet fails, the backup can take over without generating a new key.

For signing costs, see [Cycle costs](../references/cycle-costs.md#threshold-ecdsa-and-schnorr-signing).

## Supported chains

Any chain whose transaction authentication uses ECDSA (secp256k1) or Schnorr signatures (BIP340 over secp256k1, or Ed25519) can be integrated with ICP through chain-key signatures. For the full list of supported chains with integration methods and chain-key tokens, see [Chain Fusion: Supported chains](chain-fusion/index.md#supported-chains).

## Chain evolution

The same threshold cryptographic infrastructure that enables signing also enables ICP to upgrade itself without downtime or forks. When a subnet's membership changes (nodes are added, removed, or replaced), the DKG protocol **reshares** the existing keys to the new set of nodes. The subnet's public key stays the same, but the underlying shares change: meaning old shares held by removed nodes become useless.

Combined with the NNS governance system, this enables **autonomous protocol upgrades**: the NNS approves an upgrade, the orchestrator on each node downloads the new replica software, and the subnet transitions at the next epoch boundary: all while preserving canister state and maintaining the same public key.

For more on how upgrades work at the protocol level, see [Chain evolution](evolution-scaling.md#chain-evolution).

## Next steps

- [Chain Fusion](chain-fusion/index.md): how canisters use chain-key signatures to interact with other chains
- [Certified data](certified-data.md): how the subnet's threshold BLS key enables certified query responses
- [Ethereum integration](../guides/chain-fusion/ethereum.md): using threshold ECDSA with Ethereum and EVM chains
- [VetKeys](vetkeys.md): a related cryptographic primitive for network-enforced encryption
- [Management canister reference](../references/management-canister.md): the threshold signing API

<!-- Upstream: informed by dfinity/portal (docs/references/t-sigs-how-it-works.mdx, docs/building-apps/chain-fusion/overview.mdx, docs/building-apps/chain-fusion/supported-chains.mdx); informed by Learn Hub articles "Chain-Key Cryptography", "Subnet Keys and Subnet Signatures", "Chain-Key Signatures" (migrated, source retired) -->
