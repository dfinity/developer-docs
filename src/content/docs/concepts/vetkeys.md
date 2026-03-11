---
title: "VetKeys"
description: "Verifiable encrypted threshold key derivation for on-chain encryption and key management"
sidebar:
  order: 3
doc_type: explanation
level: intermediate
features: [vetkeys]
icskills: [vetkd]
last_verified: 2026-03-10
---

VetKeys (verifiably encrypted threshold keys) enable on-chain encryption on ICP. They solve a fundamental problem: how can a public blockchain work with secret data? With vetKeys, canisters can derive cryptographic keys on demand, encrypted so that no individual node -- and not even the network itself -- ever sees the plaintext key.

## How it works

VetKeys are powered by the vetKD (verifiable encrypted threshold key derivation) protocol:

1. A user generates a **transport key pair** on their device.
2. The user's canister calls the management canister's `vetkd_derive_key` method, passing the transport public key.
3. Subnet nodes collaboratively derive the requested key, each contributing a share. The result is encrypted under the user's transport public key.
4. The encrypted key is returned to the canister and then to the user.
5. Only the user can decrypt the key using their transport private key.

The key derivation is **deterministic**: the same inputs always produce the same key. This means users can reliably retrieve their keys on demand without storing them anywhere.

### Why "vet"?

- **Verifiable** -- users can verify that the derived key is correct and untampered
- **Encrypted** -- the key is encrypted under a user-provided transport key during transit
- **Threshold** -- derivation requires a threshold of subnet nodes; no single node sees the key

## Use cases

### Encrypted on-chain storage

Generate encryption keys to protect data stored in canisters. Keys can be shared across devices and between users, enabling private storage, end-to-end encrypted messaging, password managers, and collaborative applications on confidential data.

### Distributed key management (DKMS)

Let users generate, retrieve, and share cryptographic keys across devices without a central key server. Because key derivation is deterministic, keys can be retrieved on demand rather than stored.

### Identity-based encryption (IBE)

Encrypt data directly to an identity -- a principal, an email address, or an Ethereum address. The recipient retrieves their decryption key by authenticating with the dapp. Data can be encrypted for a user even before they have ever interacted with the application.

### Timelock encryption

Encrypt to a timestamp. The ciphertext can only be decrypted after a specific time has passed. This enables secret-bid auctions, delayed-reveal NFTs, and MEV protection by keeping transaction details confidential until after block inclusion.

### Threshold BLS signatures

VetKeys extend chain-key cryptography with BLS signatures, which are compact and efficiently aggregatable -- useful for advanced multi-chain protocols.

### Verifiable random function (VRF)

VetKeys can produce randomness that is not only unpredictable but also publicly verifiable, enabling trustless lotteries, fair gaming, and provably random NFT trait assignment.

## API overview

The management canister exposes two methods:

```candid
vetkd_derive_key : (record {
    input : blob;
    context : blob;
    transport_public_key : blob;
    key_id : record { curve : vetkd_curve; name : text };
}) -> (record { encrypted_key : blob; });

vetkd_public_key : (record {
    canister_id : opt canister_id;
    context : blob;
    key_id : record { curve : vetkd_curve; name : text };
}) -> (record { public_key : blob; });
```

- `input` -- arbitrary bytes that act as a key identifier; different inputs produce different keys
- `context` -- a domain separator to prevent key collisions between applications
- `transport_public_key` -- the recipient's public key for encrypting the derived key
- `key_id` -- the master key to derive from (curve `bls12_381_g2`, name `key_1` or `test_key_1`)

### Available keys

| Key name | Environment |
|---|---|
| `dfx_test_key` | Local development only |
| `test_key_1` | ICP mainnet (testing, 13-node subnet) |
| `key_1` | ICP mainnet (production, 34-node subnet) |

## Code example

### Backend canister

**Motoko**

```motoko
import ManagementCanister "mo:ic-vetkeys/ManagementCanister";
import Blob "mo:base/Blob";
import Text "mo:base/Text";
import Principal "mo:base/Principal";
import Array "mo:base/Array";
import Nat8 "mo:base/Nat8";

actor {
    let DOMAIN_SEPARATOR = Blob.toArray(Text.encodeUtf8("my-dapp"));

    public shared ({ caller }) func vetkd_derive_key(
        transportKey : Blob, input : Blob
    ) : async Blob {
        await ManagementCanister.vetKdDeriveKey(
            input, context(caller), testKeyId(), transportKey
        )
    };

    public shared ({ caller }) func vetkd_public_key() : async Blob {
        await ManagementCanister.vetKdPublicKey(
            null, context(caller), testKeyId()
        )
    };

    func testKeyId() : ManagementCanister.VetKdKeyid {
        { curve = #bls12_381_g2; name = "test_key_1" }
    };

    func context(principal : Principal) : Blob {
        let pb = Blob.toArray(Principal.toBlob(principal));
        Blob.fromArray(
            Array.flatten([
                [Nat8.fromNat(DOMAIN_SEPARATOR.size())],
                DOMAIN_SEPARATOR,
                pb,
            ])
        )
    };
};
```

**Rust**

```rust
use candid::Principal;
use ic_cdk::management_canister::{
    VetKDCurve, VetKDDeriveKeyArgs, VetKDKeyId, VetKDPublicKeyArgs,
};
use ic_cdk::update;

const DOMAIN_SEPARATOR: &[u8] = b"my-dapp";

#[update]
async fn vetkd_derive_key(transport_public_key: Vec<u8>, input: Vec<u8>) -> Vec<u8> {
    let caller = ic_cdk::api::msg_caller();
    let request = VetKDDeriveKeyArgs {
        input,
        context: build_context(caller),
        transport_public_key,
        key_id: VetKDKeyId {
            curve: VetKDCurve::Bls12_381_G2,
            name: "test_key_1".to_string(),
        },
    };
    let reply = ic_cdk::management_canister::vetkd_derive_key(&request)
        .await
        .expect("vetkd_derive_key failed");
    reply.encrypted_key
}

fn build_context(principal: Principal) -> Vec<u8> {
    [DOMAIN_SEPARATOR.len() as u8]
        .into_iter()
        .chain(DOMAIN_SEPARATOR.iter().copied())
        .chain(principal.as_slice().iter().copied())
        .collect()
}
```

### Frontend (TypeScript)

```typescript
import { TransportSecretKey, EncryptedVetKey, DerivedPublicKey } from "@dfinity/vetkeys";

// Step 1: Generate a transport key pair
const transportSecretKey = TransportSecretKey.random();

// Step 2: Request the encrypted vetKey from the backend
const input = new Uint8Array(0);
const encryptedKeyBytes = await backend.vetkd_derive_key(
    transportSecretKey.publicKeyBytes(), input
);
const encryptedVetKey = EncryptedVetKey(encryptedKeyBytes);

// Step 3: Retrieve the public key and decrypt
const publicKeyBytes = await backend.vetkd_public_key();
const publicKey = DerivedPublicKey.deserialize(publicKeyBytes);
const vetKey = encryptedVetKey.decryptAndVerify(transportSecretKey, publicKey, input);
```

## Resources

- [vetKeys code libraries](https://github.com/dfinity/vetkeys)
- [Example dapps](https://github.com/dfinity/vetkeys/tree/main/examples)
- [Showcase dapp on mainnet](https://ddnbn-miaaa-aaaal-qsl3q-cai.icp0.io/)
- [vetKeys reference](https://internetcomputer.org/docs/building-apps/network-features/vetkeys/overview)
- [Research paper](https://eprint.iacr.org/2023/616.pdf)
- icskills: [vetkd](https://github.com/dfinity/icskills/blob/main/skills/vetkd/SKILL.md)
