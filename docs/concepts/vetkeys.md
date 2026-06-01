---
title: "VetKeys"
description: "Verifiable encrypted threshold key derivation for encryption and secret management on ICP"
sidebar:
  order: 12
---

VetKeys (verifiably encrypted threshold keys) give canisters the ability to derive secret key material on demand, without any node or canister ever seeing the raw key. The protocol that underpins this capability is called vetKD: verifiable encrypted threshold key derivation.

The core problem vetKeys solve: encrypting data and storing it on the network is easy when the secret key stays on one device. The difficulty arises when a user needs to access that data from another device, share it with someone else, or let a canister participate in encryption workflows. Transmitting key material over public channels or storing it in a canister exposes it. VetKeys eliminate that exposure by making keys derivable from the network itself, encrypted for delivery, and verifiable by the recipient.

## The vetKD properties

The name describes how keys are derived:

- **Verifiable.** Recipients can verify that the key they received is correct and has not been tampered with. No trust in any individual node is required.
- **Encrypted.** Each derived key is encrypted under a client-supplied transport public key before it leaves the subnet. No node or canister ever sees the raw derived key.
- **Threshold.** Key derivation requires a quorum of subnet nodes to cooperate. No single node can derive the key on its own.
- **Keys.** The output is raw cryptographic key material that can be used for symmetric encryption, identity-based encryption, BLS signatures, or further key derivation.

## How the protocol works

Every canister that uses vetKeys interacts with the subnet's threshold key derivation infrastructure through two management canister methods: `vetkd_public_key` and `vetkd_derive_key`.

A key is derived from three inputs:

- **Canister ID.** Keys are scoped per canister. A key derived by one canister cannot be used as a key derived by another.
- **Context.** A developer-chosen domain separator (for example, `b"my_app_v1"`). Context isolates subkeys per feature or use case within the same canister.
- **Input.** An application-defined identifier for the specific key (for example, a user's principal, a document ID, or a room ID).

The derivation is **deterministic**: the same (canister, context, input) triple always produces the same key. Keys do not need to be stored anywhere; they can be retrieved on demand by any client that can authenticate to the canister.

When a canister calls `vetkd_derive_key`:

![vetKD protocol flow: user generates transport key pair, canister authenticates and routes the request, subnet nodes threshold-derive and encrypt the key, client decrypts with transport secret key](/concepts/vetkeys/vetkd_diagram.png)

1. The canister passes the `input`, `context`, `transport_public_key`, and `key_id` to the management canister.
2. A threshold of subnet nodes cooperates to derive the key and encrypt it under the supplied transport public key.
3. The encrypted key is returned to the canister, which forwards it to the client.
4. The client decrypts the key using its transport secret key, obtaining the raw vetKey locally.

The client's transport key pair is ephemeral: generated fresh for each session and discarded after use. No node, no subnet, and no canister ever holds the client's raw derived key.

Keys are structured hierarchically. The subnet's vetKD master key is used to derive a unique canister-level key for each canister, which in turn derives per-context and per-input subkeys:

![vetKD public key derivation hierarchy: subnet master key → canister master key (via canister ID) → subkeys (via context and input)](/concepts/vetkeys/vetkd_derivation.png)

## API overview

The vetKD API is exposed through two management canister methods:

```candid
vetkd_public_key : (record {
  canister_id : opt canister_id;
  context     : blob;
  key_id      : record { curve : vetkd_curve; name : text };
}) -> (record { public_key : blob });

vetkd_derive_key : (record {
  input                : blob;
  context              : blob;
  transport_public_key : blob;
  key_id               : record { curve : vetkd_curve; name : text };
}) -> (record { encrypted_key : blob });
```

The only supported curve is `bls12_381_g2`. Two key names are available:

| Key name | Environment | Purpose | Cycle cost (approx.) |
|----------|-------------|---------|----------------------|
| `test_key_1` | Local + mainnet | Development and testing | 10,000,000,000 |
| `key_1` | Mainnet only | Production | 26,153,846,153 |

`vetkd_public_key` carries no cycle cost. `vetkd_derive_key` consumes cycles at the rates above. If a canister may be blackholed or called by other canisters, send more cycles than the advertised cost: unused cycles are refunded, and this ensures calls succeed if the subnet grows in size. See [Cycle costs](../references/cycle-costs.md#vetkd) for USD equivalents and full details.

## Use cases

### Encrypted storage

A canister derives a symmetric encryption key for each user or resource using a unique input (a principal or document ID). The client encrypts data with this key before storing it in the canister. Only the client, and anyone the canister grants access to, can later obtain the decryption key. The `EncryptedMaps` library in `ic-vetkeys` and `@dfinity/vetkeys` provides a ready-to-use implementation of this pattern.

### Distributed key management (DKMS)

Because key derivation is deterministic, a user can retrieve the same key from any device by authenticating to the canister. Canisters can grant access to other users by updating an access control list, enabling collaborative encrypted storage without peer-to-peer key exchange.

### Identity-based encryption (IBE)

Anyone can encrypt a message to a principal without the recipient being online or having pre-registered a key. The sender derives the recipient's public key from the canister's master public key and the recipient's principal. The recipient later authenticates to obtain their corresponding vetKey and decrypts. IBE is an asymmetric scheme: any party can encrypt to an identity, but only the holder of that identity can decrypt.

### Timelock encryption

A variant of IBE where the canister controls when a decryption key becomes available. A sender encrypts to a future timestamp or batch identifier; the canister releases the corresponding vetKey only after the specified time or condition is met. Applications include secret-bid auctions, delayed-reveal content, and protection against maximal extractable value (MEV) on decentralized exchanges.

### Threshold BLS signatures

VetKeys introduce threshold BLS signatures to canisters. BLS signatures are compact and support efficient aggregation, making them well-suited for multi-chain protocols and applications that need to verify many signatures efficiently.

### Verifiable randomness

VetKeys can function as a verifiable random function (VRF): each (canister, context, input) triple produces a unique, unpredictable value that anyone can verify was correctly derived. This is useful for lotteries, games, and NFT trait assignment where outcomes must be demonstrably fair.

## Current status

The vetKD management canister API is live on mainnet. The `ic-vetkeys` Rust crate (`v0.6`) and `@dfinity/vetkeys` npm package (`v0.4.0`) provide higher-level abstractions over the raw API. Pin your dependency versions and consult the [DFINITY forum](https://forum.dfinity.org/t/threshold-key-derivation-privacy-on-the-ic/16560) for any migration guides after upgrades.

## Next steps

- [Chain-Key Cryptography](chain-key-cryptography.md): the threshold cryptographic foundation that vetKeys build on
- [Security model](security.md#what-the-protocol-does-not-guarantee): canister memory confidentiality and why vetKeys help

<!-- Upstream: informed by dfinity/portal docs/building-apps/network-features/vetkeys/introduction.mdx, dfinity/portal docs/building-apps/network-features/vetkeys/api.mdx; dfinity/icskills vetkd -->
