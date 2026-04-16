---
title: "Data Integrity"
description: "Protect data confidentiality and authenticity in canisters using vetKeys encryption, identity-based encryption, certified variables, and signature verification."
sidebar:
  order: 3
---

Data on the Internet Computer faces two distinct threats: **confidentiality** (unauthorized parties reading data) and **authenticity** (verifying that data hasn't been tampered with). This guide covers the IC mechanisms that address both: vetKeys for onchain encryption, certified variables for cryptographic data authenticity, and signature verification for external data.

For a conceptual overview of how these fit into the IC security model, see [Security model](../../concepts/security.md). For a deeper look at the vetKeys cryptographic protocol, see [vetKeys](../../concepts/vetkeys.md).

## Onchain encryption with vetKeys

Canister state on standard application subnets is readable by node operators. If your application stores private data (notes, messages, files), you must encrypt it before storing. vetKeys (verifiably encrypted threshold keys) give canisters access to cryptographic key material derived by a threshold quorum of subnet nodes — no single node ever holds the raw key.

The core workflow:

1. The client generates an ephemeral **transport key pair**
2. The canister calls `vetkd_derive_key` on the management canister, which derives a key encrypted under the client's transport public key
3. The client decrypts the result with its transport private key to obtain the raw vetKey
4. The client uses the vetKey to encrypt or decrypt data locally

No key material ever leaves the subnet in plaintext. The canister never sees the raw key.

### Prerequisites

**Rust:**

```toml
[dependencies]
ic-cdk = "0.19"
ic-vetkeys = "0.6"
ic-stable-structures = "0.7"
```

**Motoko** (`mops.toml`):

```toml
[dependencies]
core = "2.0.0"
```

**Frontend:**

```bash
npm install @dfinity/vetkeys
```

> **API stability:** The `ic-vetkeys` crate and `@dfinity/vetkeys` package are published but their APIs may still change. Pin the versions above and check the [DFINITY forum](https://forum.dfinity.org) for migration guides before upgrading.

### Key names and environments

| Key name | Environment | Cycle cost (approx.) |
|----------|-------------|----------------------|
| `test_key_1` | Local + mainnet (testing) | ~10B cycles |
| `key_1` | Mainnet (production) | ~26B cycles |

Use `test_key_1` during development and mainnet testing. Switch to `key_1` for production. `vetkd_public_key` does not cost cycles; only `vetkd_derive_key` does.

### Rust implementation

The `ic-vetkeys` crate provides a high-level `KeyManager` that handles access control and stable storage. For simpler use cases, you can also call the management canister directly.

**Using `ic-vetkeys` KeyManager (recommended):**

Initialize the `KeyManager` with stable memory and a key ID in the `init` hook:

```rust
use ic_stable_structures::memory_manager::{MemoryId, MemoryManager};
use ic_stable_structures::DefaultMemoryImpl;
use ic_vetkeys::key_manager::KeyManager;
use ic_vetkeys::types::{AccessRights, VetKDCurve, VetKDKeyId};

thread_local! {
    static MEMORY_MANAGER: std::cell::RefCell<MemoryManager<DefaultMemoryImpl>> =
        std::cell::RefCell::new(MemoryManager::init(DefaultMemoryImpl::default()));
    static KEY_MANAGER: std::cell::RefCell<Option<KeyManager<AccessRights>>> =
        std::cell::RefCell::new(None);
}

#[ic_cdk::init]
fn init() {
    let key_id = VetKDKeyId {
        curve: VetKDCurve::Bls12381G2,
        name: "key_1".to_string(), // "test_key_1" for local + mainnet testing
    };
    MEMORY_MANAGER.with(|mm| {
        KEY_MANAGER.with(|km| {
            *km.borrow_mut() = Some(KeyManager::init(
                "my_app_v1", key_id,
                mm.borrow().get(MemoryId::new(0)),
                mm.borrow().get(MemoryId::new(1)),
                mm.borrow().get(MemoryId::new(2)),
            ));
        });
    });
}
```

Expose the two endpoints callers need — one to retrieve an encrypted key, one to retrieve the verification key:

```rust
use candid::Principal;
use ic_cdk::update;

#[update]
async fn get_encrypted_vetkey(subkey_id: Vec<u8>, transport_public_key: Vec<u8>) -> Vec<u8> {
    let caller = ic_cdk::caller(); // capture BEFORE await
    let future = KEY_MANAGER.with(|km| {
        km.borrow().as_ref().expect("not initialized")
            .get_encrypted_vetkey(caller, subkey_id, transport_public_key)
            .expect("access denied")
    });
    future.await
}

#[update]
async fn get_vetkey_verification_key() -> Vec<u8> {
    let future = KEY_MANAGER.with(|km| {
        km.borrow().as_ref().expect("not initialized")
            .get_vetkey_verification_key()
    });
    future.await
}
```

**Calling management canister directly (lower level):**

Retrieve the public key (no cycles required):

```rust
use ic_cdk::management_canister::{
    VetKDCurve, VetKDKeyId, VetKDPublicKeyArgs,
};

const CONTEXT: &[u8] = b"my_app_v1";

fn key_id() -> VetKDKeyId {
    VetKDKeyId {
        curve: VetKDCurve::Bls12_381_G2,
        name: "key_1".to_string(), // "test_key_1" for testing
    }
}

#[ic_cdk::update]
async fn get_public_key() -> Vec<u8> {
    let response = ic_cdk::management_canister::vetkd_public_key(
        &VetKDPublicKeyArgs { canister_id: None, context: CONTEXT.to_vec(), key_id: key_id() }
    ).await.expect("vetkd_public_key call failed");
    response.public_key
}
```

Derive a key for the authenticated caller (`key_1` costs ~26B cycles; `ic-cdk` attaches them automatically):

```rust
use ic_cdk::management_canister::{VetKDDeriveKeyArgs, VetKDCurve, VetKDKeyId};

#[ic_cdk::update]
async fn derive_key(transport_public_key: Vec<u8>) -> Vec<u8> {
    let caller = ic_cdk::api::msg_caller(); // MUST capture before await
    let response = ic_cdk::management_canister::vetkd_derive_key(
        &VetKDDeriveKeyArgs {
            input: caller.as_slice().to_vec(),
            context: CONTEXT.to_vec(),
            transport_public_key,
            key_id: key_id(),
        }
    ).await.expect("vetkd_derive_key call failed");
    response.encrypted_key
}
```

### Motoko implementation

Motoko uses the management canister directly. Define the request/response types and declare the actor interface:

```motoko
import Blob "mo:core/Blob";
import Principal "mo:core/Principal";
import Text "mo:core/Text";

persistent actor {

  type VetKdCurve = { #bls12_381_g2 };
  type VetKdKeyId = { curve : VetKdCurve; name : Text };
  type VetKdPublicKeyRequest = { canister_id : ?Principal; context : Blob; key_id : VetKdKeyId };
  type VetKdPublicKeyResponse = { public_key : Blob };
  type VetKdDeriveKeyRequest = { input : Blob; context : Blob; transport_public_key : Blob; key_id : VetKdKeyId };
  type VetKdDeriveKeyResponse = { encrypted_key : Blob };

  let managementCanister : actor {
    vetkd_public_key : VetKdPublicKeyRequest -> async VetKdPublicKeyResponse;
    vetkd_derive_key : VetKdDeriveKeyRequest -> async VetKdDeriveKeyResponse;
  } = actor "aaaaa-aa";

  let context : Blob = Text.encodeUtf8("my_app_v1");
  // "test_key_1" for local + mainnet testing, "key_1" for production
  func keyId() : VetKdKeyId = { curve = #bls12_381_g2; name = "key_1" };
  // ...
```

Implement the public key and key derivation endpoints:

```motoko
  public shared func getPublicKey() : async Blob {
    // vetkd_public_key does not require cycles
    let response = await managementCanister.vetkd_public_key({
      canister_id = null; context; key_id = keyId();
    });
    response.public_key
  };

  public shared ({ caller }) func deriveKey(transportPublicKey : Blob) : async Blob {
    // caller captured before the await; key_1 costs ~26B cycles
    let response = await (with cycles = 26_000_000_000) managementCanister.vetkd_derive_key({
      input = Principal.toBlob(caller);
      context;
      transport_public_key = transportPublicKey;
      key_id = keyId();
    });
    response.encrypted_key
  };
};
```

### Frontend: decrypt and use the vetKey

The frontend generates a transport key pair, sends the public half to the canister, receives the encrypted derived key, and decrypts it locally.

Generate a fresh transport key pair each session, then request and decrypt the vetKey:

```typescript
import { TransportSecretKey, DerivedPublicKey, EncryptedVetKey } from "@dfinity/vetkeys";

// 1. Generate an ephemeral transport key — new one each session
const transportSecretKey = TransportSecretKey.fromSeed(crypto.getRandomValues(new Uint8Array(32)));
const transportPublicKey = transportSecretKey.publicKey();

// 2. Request encrypted vetkey and verification key from the canister
const [encryptedKeyBytes, verificationKeyBytes] = await Promise.all([
  backendActor.get_encrypted_vetkey(subkeyId, transportPublicKey),
  backendActor.get_vetkey_verification_key(),
]);

// 3. Decrypt the vetkey using the transport secret
const vetKey = EncryptedVetKey.deserialize(new Uint8Array(encryptedKeyBytes))
  .decryptAndVerify(
    transportSecretKey,
    DerivedPublicKey.deserialize(new Uint8Array(verificationKeyBytes)),
    new Uint8Array(subkeyId),
  );
```

Use the vetKey to derive a symmetric AES-GCM key and encrypt/decrypt data:

```typescript
// 4. Derive a 256-bit AES key from the vetKey material
const aesKey = await crypto.subtle.importKey(
  "raw",
  vetKey.toDerivedKeyMaterial().data.slice(0, 32),
  { name: "AES-GCM" },
  false,
  ["encrypt", "decrypt"],
);

// 5. Encrypt data
const iv = crypto.getRandomValues(new Uint8Array(12));
const ciphertext = await crypto.subtle.encrypt(
  { name: "AES-GCM", iv },
  aesKey,
  new TextEncoder().encode("secret message"),
);

// 6. Decrypt data
const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
```

### Common mistakes

- **Reusing transport keys across sessions.** Generate a fresh transport key pair for each session. If an attacker ever learns the transport secret, they can decrypt all keys derived while that secret was in use.
- **Using derived key bytes directly as an AES key.** The `encrypted_key` field from `vetkd_derive_key` is an encrypted blob. After decryption, call `toDerivedKeyMaterial()` before using for AES — do not use the raw bytes directly.
- **Putting secret data in the `input` field.** The `input` field is sent to the management canister in plaintext and serves as a key identifier (e.g., a user principal or document ID). Never use it for actual secret data.
- **Inconsistent context values.** The `context` field on the canister and on the frontend must match exactly. A mismatch causes silent decryption failure.

## Identity-based encryption (IBE)

IBE lets you encrypt to an identity (such as a user's principal) without the recipient being online or having registered a key. Anyone who knows the canister's derived public key can encrypt to any principal. The recipient later authenticates to the canister, obtains their vetKey, and decrypts locally.

This is useful for private messaging, sealed auctions, and any case where you want to encrypt data "to" a principal who will retrieve it later.

> **Access control:** If you implement IBE without using `KeyManager` or `EncryptedMaps`, your canister must verify that `caller == recipient_principal` before calling `vetkd_derive_key`. Without this check, any caller can request any derived key and decrypt messages meant for someone else. The `ic-vetkeys` library handles this automatically.

**TypeScript IBE example — encrypt (sender side):**

```typescript
import { IbeCiphertext, IbeIdentity, IbeSeed } from "@dfinity/vetkeys";

// No canister call needed if the public key is already known
const recipientIdentity = IbeIdentity.fromBytes(recipientPrincipalBytes);
const ciphertext = IbeCiphertext.encrypt(
  derivedPublicKey, recipientIdentity,
  new TextEncoder().encode("secret message"),
  IbeSeed.random(),
);
const serialized = ciphertext.serialize(); // store this onchain (ciphertext, not plaintext)
```

**TypeScript IBE example — decrypt (recipient side):**

```typescript
import { TransportSecretKey, DerivedPublicKey, EncryptedVetKey, IbeCiphertext } from "@dfinity/vetkeys";

// Recipient authenticates to the canister to obtain their vetKey
const transportSecretKey = TransportSecretKey.fromSeed(crypto.getRandomValues(new Uint8Array(32)));
const [encryptedKeyBytes, verificationKeyBytes] = await Promise.all([
  backendActor.get_encrypted_vetkey(subkeyId, transportSecretKey.publicKey()),
  backendActor.get_vetkey_verification_key(),
]);
const vetKey = EncryptedVetKey.deserialize(new Uint8Array(encryptedKeyBytes))
  .decryptAndVerify(
    transportSecretKey,
    DerivedPublicKey.deserialize(new Uint8Array(verificationKeyBytes)),
    new Uint8Array(subkeyId),
  );

const decrypted = IbeCiphertext.deserialize(serialized).decrypt(vetKey);
// decrypted is Uint8Array containing "secret message"
```

### Deriving public keys offline

You can derive the canister's public key for a given context without making a canister call. This is useful for IBE encryption when the recipient is offline:

```typescript
import { MasterPublicKey, DerivedPublicKey } from "@dfinity/vetkeys";

// Derive offline from the known mainnet master public key
const masterKey = MasterPublicKey.productionKey();
const canisterKey = masterKey.deriveCanisterKey(canisterId);
const derivedKey: DerivedPublicKey = canisterKey.deriveSubKey(
  new TextEncoder().encode("my_app_v1"),
);
// Use derivedKey for IBE encryption without any network calls
```

For complete IBE and encrypted storage examples, see:
- [Password manager example](https://github.com/dfinity/vetkeys/tree/main/examples/password_manager) — encrypted key-value storage with `EncryptedMaps`
- [Encrypted notes dapp](https://github.com/dfinity/vetkeys/tree/main/examples/encrypted_notes_dapp_vetkd) — per-user encrypted note storage
- [IBE example](https://github.com/dfinity/vetkeys/tree/main/examples/basic_ibe) — identity-based encryption with Internet Identity principals

## Certified variables for data authenticity

Query calls on ICP run on a single replica and are not verified by consensus. A malicious or faulty replica could return fabricated data. Certified variables solve this: the canister stores a Merkle root hash in the subnet's certified state during update calls, and query responses include a subnet BLS signature proving the data is authentic.

Use certified variables when:
- Query responses must be verifiable by clients without trusting any single replica
- You serve data that could change (balances, configuration, records) via fast query calls
- Your frontend needs to verify that data hasn't been tampered with in transit

For the full implementation guide, including Merkle tree construction, witness generation, and frontend verification, see [Certified variables](../backends/certified-variables.md).

**Key rules:**
- `certified_data_set` may only be called during update calls (not query calls)
- You can only certify 32 bytes — build a Merkle tree and certify the root hash
- Re-certify data in `post_upgrade` — certified data is cleared on upgrade
- Clients must verify certificate freshness (the certificate embeds a timestamp; reject certificates older than ~5 minutes)

## Signature verification for external data

When your canister receives data from external parties — signed messages, X.509 CSRs, or HTTP request signatures — it must verify the cryptographic signature before trusting the data. ICP verifies signatures on ingress messages automatically, but canister-to-canister or external data flows require manual verification.

### IC ingress message signatures

Every ingress call to a canister is signed by the caller's identity. The IC verifies these signatures automatically before the message reaches your canister — you do not need to verify them yourself. The `caller` principal in your canister method is already authenticated.

For workflows that require additional independent verification (such as verifying a message offline or in a different context), the IC uses the following signature schemes:

- **Ed25519** — used by Internet Identity and many wallet implementations
- **ECDSA on secp256r1 (P-256)** — used by some hardware authenticators  
- **ECDSA on secp256k1** — used by Bitcoin-compatible wallets

To verify IC signatures independently (outside the IC, or as a second layer of validation), use the `ic-validator-ingress-message` Rust crate or the `@dfinity/standalone-sig-verifier-web` JavaScript library. See the [independently verifying IC signatures (Rust)](https://github.com/dfinity/ic/tree/master/rs/validator) documentation, or the [`@dfinity/standalone-sig-verifier-web` npm package](https://www.npmjs.com/package/@dfinity/standalone-sig-verifier-web) for the JavaScript path.

### X.509 certificate handling

Canisters can act as certificate authorities using threshold signing keys. Because no single node ever holds the threshold private key, only the canister (via consensus) can sign certificates — this gives you a CA whose private key cannot be exfiltrated.

The pattern: a canister generates a root CA certificate signed with its threshold Ed25519 or ECDSA key, then issues child certificates for CSRs submitted by external parties. Certificates can be verified by any standard X.509 tool.

For a complete working example in Rust, see the [x509 example](https://github.com/dfinity/examples/tree/master/rust/x509), which demonstrates:

1. Creating a root CA certificate with a threshold signing key
2. Issuing child certificates from externally provided CSRs (in PKCS#10/PEM format)
3. Verifying ownership of the CSR before signing

The key pattern for issuing a child certificate:

```rust
// Verify the CSR signature before trusting its contents
verify_certificate_request_signature(&cert_req)?;

// Verify the caller owns the key in the CSR
prove_ownership(&cert_req, ic_cdk::api::caller())?;

// Sign the child certificate using the canister's threshold key
// (ed25519_sign or ecdsa_sign via management canister)
```

This approach is used when you need to issue certificates to external systems that expect standard PKI infrastructure, while keeping the CA private key under threshold-protected control.

## Deploying and testing

### Local development

```bash
# Start a local network — test_key_1 and key_1 are provisioned automatically
icp network start -d

# Deploy your canister
icp deploy backend

# Test public key retrieval
icp canister call backend getPublicKey '()'
# Returns: (blob "...") — the vetKD public key for your canister

# Test key derivation (requires a 48-byte transport public key blob)
# In practice, the frontend generates this using TransportSecretKey.fromSeed()
icp canister call backend deriveKey '(blob "\00\01\02...")'
# Returns: (blob "...") — the encrypted derived key
```

### Mainnet deployment

```bash
# Deploy to mainnet
icp deploy backend -e ic

# Verify the public key is non-empty
icp canister call backend getPublicKey '()' -e ic
```

Confirm that:
- `getPublicKey` returns a non-empty blob (48+ bytes of BLS public key material)
- `deriveKey` returns a non-empty blob (encrypted key material)
- Different callers receive different derived keys (same caller + same input = same key; different caller = different key)

## Next steps

- [vetKeys concept guide](../../concepts/vetkeys.md) — how the threshold key derivation protocol works
- [Encryption guide](./encryption.md) — vetKeys encryption patterns including EncryptedMaps (coming soon)
- [Certified variables](../backends/certified-variables.md) — full certified data implementation
- [Security model](../../concepts/security.md) — IC security guarantees and threat model

<!-- Upstream: informed by dfinity/portal — docs/building-apps/authentication/independently-verifying-ic-signatures.mdx; dfinity/icskills — canister-security, vetkd, certified-variables; dfinity/examples — rust/vetkd, motoko/vetkd, rust/x509 -->
