---
title: "Certified variables"
description: "Return verifiable query responses using Merkle trees and certified data"
sidebar:
  order: 5
---

Query calls on ICP are answered by a single replica without going through consensus. This means a malicious or faulty replica could return fabricated data. **Certified variables** solve this: the [canister](../../concepts/canisters.md) stores a hash in the [subnet's](../../concepts/network-overview.md#subnets) certified state during an update call, and query responses include a certificate signed by the subnet's threshold BLS key, proving the data is authentic. The result is responses that are both fast (no consensus delay) and cryptographically verified.

For a conceptual explanation of how certified data works and why it matters, see [Certified data](../../concepts/certified-data.md). For the security implications, see [Security concepts](../../concepts/security.md).

## How certification works

The mechanism relies on three coordinated steps:

1. **Update call**: the canister modifies data, builds or updates a Merkle tree over that data, and calls `certified_data_set` (Rust) or `CertifiedData.set` (Motoko) with the tree's 32-byte root hash. The subnet includes this hash in its certified state tree each consensus round.

2. **Query call**: the canister calls `data_certificate()` / `CertifiedData.getCertificate()` to retrieve the subnet BLS certificate, builds a witness (Merkle proof) for the requested key, and returns `(data, certificate, witness)` to the caller.

3. **Client verification**: the client verifies the certificate signature against the IC root public key, extracts the root hash from the certificate's state tree, then confirms the witness proves the data is included under that root hash.

```text
UPDATE CALL (goes through consensus):
  1. Canister modifies state
  2. Canister builds/updates Merkle tree
  3. certified_data_set(root_hash)  -- 32 bytes stored in subnet state

QUERY CALL (single replica, no consensus):
  1. Client sends query
  2. Canister calls data_certificate() -- retrieves subnet BLS signature
  3. Canister builds witness (Merkle proof) for requested key
  4. Returns: { data, certificate, witness }

CLIENT:
  1. Verify certificate BLS signature against IC root public key
  2. Extract root_hash from certificate state tree
  3. Confirm witness: root_hash + witness proves data is authentic
```

## Key constraints

- `certified_data_set` accepts **at most 32 bytes**. You cannot certify arbitrary data directly. Build a Merkle tree over your data and certify only the 32-byte root hash. The tree provides proofs for individual values.
- `certified_data_set` **must be called in update calls only**. Calling it in a query call traps.
- `data_certificate()` returns `None` in update calls, including a query method invoked as an update call. `icp canister call` sends an update call unless you pass `--query`, so always test certified getters with `icp canister call --query`.
- Certified data survives upgrades (install and reinstall start it empty). A Merkle tree kept on the heap does not: in Rust, rebuild the tree in `#[post_upgrade]` and call `certified_data_set` again. A Motoko `CertTree.Store` persists with the actor, so nothing needs re-setting.

## Rust implementation

Add to `Cargo.toml`:

```toml
[dependencies]
candid = "0.10"
ic-cdk = "0.20"
ic-certification = { version = "4", features = ["serde"] }
serde = { version = "1", features = ["derive"] }
serde_bytes = "0.11"
ciborium = "0.2"
```

`ic-certification` provides `RbTree`, a Merkle-tree-backed map (`ic-certified-map` 0.4 has the same API). Each call to `tree.root_hash()` returns a 32-byte SHA-256 hash of the entire tree; `tree.witness(key)` returns a Merkle proof for a specific key.

```rust
use candid::{CandidType, Deserialize};
use ic_cdk::{init, post_upgrade, query, update};
use ic_certification::{AsHashTree, RbTree};
use serde_bytes::ByteBuf;
use std::cell::RefCell;

thread_local! {
    static TREE: RefCell<RbTree<Vec<u8>, Vec<u8>>> = RefCell::new(RbTree::new());
}

// Call this after every data change to keep the certified hash current.
fn update_certified_data() {
    TREE.with(|tree| {
        let tree = tree.borrow();
        ic_cdk::api::certified_data_set(&tree.root_hash());
    });
}

#[init]
fn init() {
    update_certified_data();
}

#[post_upgrade]
fn post_upgrade() {
    // The heap TREE is empty after an upgrade, while the old certified hash is kept.
    // Rebuild TREE from stable storage here, then re-set the hash to match it.
    update_certified_data();
}

#[update]
fn set(key: String, value: String) {
    TREE.with(|tree| {
        let mut tree = tree.borrow_mut();
        tree.insert(key.as_bytes().to_vec(), value.as_bytes().to_vec());
    });
    update_certified_data();
}

#[update]
fn delete(key: String) {
    TREE.with(|tree| {
        let mut tree = tree.borrow_mut();
        tree.delete(key.as_bytes());
    });
    update_certified_data();
}

#[derive(CandidType, Deserialize)]
struct CertifiedResponse {
    value: Option<String>,
    certificate: ByteBuf,   // subnet BLS signature
    witness: ByteBuf,       // Merkle proof for this key
}

#[query]
fn get(key: String) -> CertifiedResponse {
    // data_certificate() is only available in query calls (icp canister call --query).
    let certificate = ic_cdk::api::data_certificate()
        .expect("data_certificate only available in query calls");

    TREE.with(|tree| {
        let tree = tree.borrow();

        let value = tree.get(key.as_bytes())
            .map(|v| String::from_utf8(v.clone()).unwrap());

        // Build a Merkle proof for this specific key.
        let witness = tree.witness(key.as_bytes());
        let mut witness_buf = vec![];
        ciborium::into_writer(&witness, &mut witness_buf)
            .expect("Failed to serialize witness");

        CertifiedResponse {
            value,
            certificate: ByteBuf::from(certificate),
            witness: ByteBuf::from(witness_buf),
        }
    })
}

// Required by the icp-cli Rust recipe, which extracts the Candid interface from the wasm
ic_cdk::export_candid!();
```

### Batch updates

Multiple values can be written in one update call with a single certification step:

```rust
#[update]
fn set_many(entries: Vec<(String, String)>) {
    TREE.with(|tree| {
        let mut tree = tree.borrow_mut();
        for (key, value) in entries {
            tree.insert(key.as_bytes().to_vec(), value.as_bytes().to_vec());
        }
    });
    // One certification update covers all the changes.
    update_certified_data();
}
```

## Motoko implementation

### Simple single-value certification

For a single certified value, hash it to 32 bytes and pass the hash to `CertifiedData.set`. Certify the initial value at install too: certified data starts empty, so without it a query fails verification until the first write.

```motoko
import CertifiedData "mo:core/CertifiedData";
import Text "mo:core/Text";
// mops add sha2
import Sha256 "mo:sha2/Sha256";

persistent actor {

  // Simple certified single-value example:
  var certifiedValue : Text = "";

  // Certify the hash of the current value (max 32 bytes; update calls and init only)
  func certify() {
    CertifiedData.set(Sha256.fromBlob(#sha256, Text.encodeUtf8(certifiedValue)));
  };

  // Certify the initial value at install: certified data starts empty, not as sha256("")
  certify();

  // Set a certified value (update call only)
  public func setCertifiedValue(value : Text) : async () {
    certifiedValue := value;
    certify();
  };

  // Get the certified value with its certificate (query call)
  public query func getCertifiedValue() : async {
    value : Text;
    certificate : ?Blob;
  } {
    {
      value = certifiedValue;
      certificate = CertifiedData.getCertificate();
    }
  };
};
```

### Multi-value store with Merkle witnesses

For certifying multiple values with per-key witnesses, use the `ic-certification` mops package, which provides `CertTree`:

```motoko
// mops add ic-certification
import CertTree "mo:ic-certification/CertTree";
import CertifiedData "mo:core/CertifiedData";
import Text "mo:core/Text";

persistent actor {

  // CertTree.Store is stable: the tree and the certified data persist across upgrades.
  let certStore : CertTree.Store = CertTree.newStore();
  // Ops is an object with functions, not stable data: it must be transient.
  transient let ct = CertTree.Ops(certStore);

  // Establish initial certification.
  ct.setCertifiedData();

  public func set(key : Text, value : Text) : async () {
    ct.put([Text.encodeUtf8(key)], Text.encodeUtf8(value));
    // CRITICAL: call after every mutation.
    ct.setCertifiedData();
  };

  public func delete(key : Text) : async () {
    ct.delete([Text.encodeUtf8(key)]);
    ct.setCertifiedData();
  };

  public query func get(key : Text) : async {
    value : ?Blob;
    certificate : ?Blob;
    witness : Blob;
  } {
    let path = [Text.encodeUtf8(key)];
    let witness = ct.reveal(path);
    {
      value = ct.lookup(path);
      certificate = CertifiedData.getCertificate();
      witness = ct.encodeWitness(witness);
    }
  };

};
```

## Client-side verification

The client must verify the certificate before trusting the data. The `@dfinity/certificate-verification` package (version 4, peer-depends on `@icp-sdk/core` ^6, takes `Uint8Array`) handles the full verification flow for a witness:

1. Verify the certificate BLS signature against the IC root public key
2. Check certificate freshness: the `/time` field must be within `maxCertificateTimeOffsetMs` (recommended: 5 minutes)
3. CBOR-decode the witness into a hash tree
4. Reconstruct the witness root hash
5. Compare it with the `certified_data` path in the certificate
6. Look up the requested key in the verified witness tree

```typescript
import { verifyCertification } from "@dfinity/certificate-verification";
import { lookup_path, LookupPathStatus } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";

const MAX_CERT_TIME_OFFSET_MS = 5 * 60 * 1000; // 5 minutes

export async function getVerifiedValue(
  rootKey: Uint8Array,
  canisterId: string,
  key: string,
  response: { value: string | null; certificate: Uint8Array; witness: Uint8Array },
): Promise<string | null> {
  // Steps 1-5; throws CertificateTimeError or CertificateVerificationError on failure.
  const tree = await verifyCertification({
    canisterId: Principal.fromText(canisterId),
    encodedCertificate: response.certificate,
    encodedTree: response.witness,
    rootKey,
    maxCertificateTimeOffsetMs: MAX_CERT_TIME_OFFSET_MS,
  });

  // Step 6: the path must match how the canister inserted the key (here: UTF-8 bytes).
  const result = lookup_path([new TextEncoder().encode(key)], tree);
  switch (result.status) {
    case LookupPathStatus.Found: {
      const verified = new TextDecoder().decode(result.value);
      if (response.value !== verified) throw new Error("value does not match witness");
      return verified;
    }
    case LookupPathStatus.Absent:
      if (response.value !== null) throw new Error("witness proves the key is absent");
      return null;
    default:
      // Unknown/Error: the witness does not cover this key, so it proves nothing
      throw new Error(`witness does not cover key (${result.status})`);
  }
}
```

`lookup_path` returns a status, and only `Absent` proves that a key does not exist. Treat `Unknown` (the witness does not cover the key) as a failure, never as "not found". For where the root key comes from, see [Client-side certificate verification](../frontends/certification.md#client-side-certificate-verification).

### Single value without a witness

The simple Motoko example certifies `sha256(value)` without a Merkle tree, so there is no witness to pass to `verifyCertification`. Verify it with `Certificate.create` from `@icp-sdk/core`, which checks the signature and a ±5 minute freshness window:

```typescript
import { Certificate, lookupResultToBuffer, uint8Equals } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";

export async function verifySingleValue(
  rootKey: Uint8Array,
  canisterId: string,
  response: { value: string; certificate: Uint8Array },
): Promise<string> {
  const principal = Principal.fromText(canisterId);
  const cert = await Certificate.create({
    certificate: response.certificate,
    rootKey,
    principal: { canisterId: principal },
  });
  const certifiedData = lookupResultToBuffer(
    cert.lookup_path(["canister", principal.toUint8Array(), "certified_data"]),
  );
  // Recompute what the canister certified: sha256 of the UTF-8 value
  const hash = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(response.value)),
  );
  if (!certifiedData || !uint8Equals(certifiedData, hash)) {
    throw new Error("value does not match certified data");
  }
  return response.value;
}
```


## Deploy and test

```bash
# Deploy the canister
icp deploy backend

# Set a certified value (update call: goes through consensus)
icp canister call backend set '("greeting", "hello world")'

# Query the certified value: --query is required, or no certificate is returned
icp canister call --query backend get '("greeting")'
# Returns: record { certificate = blob "..."; value = opt "hello world"; witness = blob "..." }

# Delete a value
icp canister call backend delete '("greeting")'

# Check certification after an upgrade
icp canister call backend set '("key", "value")'
icp deploy backend  # triggers upgrade
icp canister call --query backend get '("key")'
# Motoko CertTree: the value survives and the certificate still verifies.
# Rust example: the heap tree is gone, so value = null, but the certificate still verifies
# (a proof of absence) because post_upgrade re-set the hash.
```

## Common mistakes

**Calling `certified_data_set` in a query call**: this traps immediately. The pattern is: set the hash during update calls, retrieve the certificate during query calls.

**Not updating the hash after data changes**: if you modify the tree but forget to call `certified_data_set`, query responses will fail client verification because the certificate proves a stale hash.

**Losing the tree on upgrade**: certified data survives upgrades, but a Rust tree kept on the heap does not, while the old hash stays set. Rebuild the tree in `#[post_upgrade]` and call `certified_data_set` again. A Motoko `CertTree.Store` persists, so no hook is needed.

**Building the witness for the wrong key**: the Merkle proof must correspond to the exact key being queried. A witness for `users/alice` will not verify `users/bob`.

**Skipping certificate freshness checks on the client**: the certificate's `/time` field contains the subnet timestamp. Without a freshness check, an attacker could replay a stale certificate with outdated data. Always check that `certificate_time` is within an acceptable delta (5 minutes is recommended).

**Calling the getter as an update call**: `data_certificate()` returns `None` / `null` in update calls, including a query method called as one. `icp canister call` does that unless you pass `--query`.

**Treating every non-`Found` lookup as absent**: `lookupResultToBuffer` returns `undefined` for `Absent`, `Unknown` and `Error` alike. Only `Absent` proves a key does not exist; switch on the `lookup_path` status instead.

**Declaring the Motoko `CertTree.Ops` object as stable**: in a persistent actor, `let ct = CertTree.Ops(certStore)` fails to compile (`variable ct is declared stable but has non-stable type`). Declare it `transient`.

## HTTP asset certification

For canisters that serve HTTP responses directly through the HTTP Gateway, responses must be certified so the boundary node can verify them. This is a separate protocol built on top of certified data, handled by the `ic-http-certification` crate. For frontend assets (HTML, CSS, JS), [host a static site](../frontends/static-site/overview.md) instead, which handles HTTP certification automatically.

See [Frontend certification](../../guides/frontends/certification.md) for how the frontend canisters certify responses, and what a custom HTTP canister has to do itself.

## Next steps

- [Security concepts](../../concepts/security.md): why query integrity matters and when to use certified variables vs replicated queries
- [Frontend certification](../../guides/frontends/certification.md): HTTP asset certification for a frontend canister
- [IC Interface Specification: Certified Data](../../references/ic-interface-spec/canister-interface.md#system-api-certified-data): the certified data system API
- [IC Interface Specification: Certification](../../references/ic-interface-spec/certification.md): certificate format and delegation

<!-- Upstream: informed by dfinity/portal (docs/building-apps/security/data-integrity-and-authenticity.mdx); dfinity/icskills (skills/certified-variables/SKILL.md); dfinity/cdk-rs (library/ic-certified-map/src/lib.rs, ic-cdk/src/api.rs); caffeinelabs/motoko-core (src/CertifiedData.mo); dfinity/examples (motoko/cert-var); dfinity/response-verification (README.md) -->
