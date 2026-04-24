---
title: "Certified Variables"
description: "Return verifiable query responses using Merkle trees and certified data"
sidebar:
  order: 5
---

Query calls on ICP are answered by a single replica without going through consensus. This means a malicious or faulty replica could return fabricated data. **Certified variables** solve this: the [canister](../../concepts/canisters.md) stores a hash in the [subnet's](../../concepts/network-overview.md#subnets) certified state during an update call, and query responses include a certificate signed by the subnet's threshold BLS key, proving the data is authentic. The result is responses that are both fast (no consensus delay) and cryptographically verified.

For a conceptual overview of why query integrity matters, see [Security concepts](../../concepts/security.md).

## How certification works

The mechanism relies on three coordinated steps:

1. **Update call**: the canister modifies data, builds or updates a Merkle tree over that data, and calls `certified_data_set` (Rust) or `CertifiedData.set` (Motoko) with the tree's 32-byte root hash. The subnet includes this hash in its certified state tree each consensus round.

2. **Query call**: the canister calls `data_certificate()` / `CertifiedData.getCertificate()` to retrieve the subnet BLS certificate, builds a witness (Merkle proof) for the requested key, and returns `(data, certificate, witness)` to the caller.

3. **Client verification**: the client verifies the certificate signature against the IC root public key, extracts the root hash from the certificate's state tree, then confirms the witness proves the data is included under that root hash.

```
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
- `data_certificate()` returns `None` in update calls: certificates are only available during query calls.
- After a canister upgrade, the certified data is cleared. Re-establish certification in both `#[init]` and `#[post_upgrade]` (Rust), or in `system func postupgrade` (Motoko).

## Rust implementation

Add to `Cargo.toml`:

```toml
[dependencies]
candid = "0.10"
ic-cdk = "0.19"
ic-certified-map = "0.4"
serde = { version = "1", features = ["derive"] }
serde_bytes = "0.11"
ciborium = "0.2"
```

`ic-certified-map` provides `RbTree`, a Merkle-tree-backed map. Each call to `tree.root_hash()` returns a 32-byte SHA-256 hash of the entire tree; `tree.witness(key)` returns a Merkle proof for a specific key.

```rust
use candid::{CandidType, Deserialize};
use ic_cdk::{init, post_upgrade, query, update};
use ic_certified_map::{AsHashTree, RbTree};
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
    // Certified data is cleared on upgrade: must be re-established.
    // Assumes tree data has already been loaded from stable memory.
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
    // data_certificate() is only available in query calls.
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

For a single certified value, hash it to 32 bytes and pass the hash to `CertifiedData.set`:

```motoko
import CertifiedData "mo:core/CertifiedData";
import Text "mo:core/Text";
// mops add sha2
import Sha256 "mo:sha2/Sha256";

persistent actor {

  var certifiedValue : Text = "";

  // Update the certified value (update call only).
  public func setCertifiedValue(value : Text) : async () {
    certifiedValue := value;
    let hash = Sha256.fromBlob(#sha256, Text.encodeUtf8(value));
    CertifiedData.set(hash);
  };

  // Return the value with its certificate (query call).
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

  // CertTree.Store is stable: persists across upgrades.
  let certStore : CertTree.Store = CertTree.newStore();
  let ct = CertTree.Ops(certStore);

  // Establish initial certification.
  ct.setCertifiedData();

  public func set(key : Text, value : Text) : async () {
    ct.put([Text.encodeUtf8(key)], Text.encodeUtf8(value));
    // CRITICAL: call after every mutation.
    ct.setCertifiedData();
  };

  public func remove(key : Text) : async () {
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

  // Re-establish certification after upgrade.
  // (CertTree.Store is stable, so tree data survives, but certified_data is cleared.)
  system func postupgrade() {
    ct.setCertifiedData();
  };
};
```

## Client-side verification

The client must verify the certificate before trusting the data. The `@dfinity/certificate-verification` package handles the full verification flow:

1. Verify the certificate BLS signature against the IC root public key
2. Check certificate freshness. The `/time` field must be within an acceptable window (recommended: 5 minutes)
3. CBOR-decode the witness into a hash tree
4. Reconstruct the witness root hash
5. Compare it with the `certified_data` path in the certificate
6. Look up the requested key in the verified witness tree

```typescript
import { verifyCertification } from "@dfinity/certificate-verification";
import { lookup_path, lookupResultToBuffer, HashTree } from "@icp-sdk/core/agent";
import { Principal } from "@icp-sdk/core/principal";

const MAX_CERT_TIME_OFFSET_MS = 5 * 60 * 1000; // 5 minutes

async function getVerifiedValue(
  rootKey: ArrayBuffer,
  canisterId: string,
  key: string,
  response: {
    value: string | null;
    certificate: ArrayBuffer;
    witness: ArrayBuffer;
  }
): Promise<string | null> {
  // Steps 1-5: verify BLS signature, time, and witness hash match.
  // Throws CertificateTimeError or CertificateVerificationError on failure.
  const tree: HashTree = await verifyCertification({
    canisterId: Principal.fromText(canisterId),
    encodedCertificate: response.certificate,
    encodedTree: response.witness,
    rootKey,
    maxCertificateTimeOffsetMs: MAX_CERT_TIME_OFFSET_MS,
  });

  // Step 6: look up the key in the verified witness tree.
  // lookup_path returns a LookupResult discriminated union; lookupResultToBuffer
  // extracts the Uint8Array value or returns undefined if the key is absent.
  const leafData = lookupResultToBuffer(
    lookup_path([new TextEncoder().encode(key)], tree)
  );

  if (leafData === undefined) {
    // Key is provably absent from the certified tree.
    return null;
  }

  const verifiedValue = new TextDecoder().decode(leafData);

  // Confirm the canister-returned value matches what the witness proves.
  if (response.value !== null && response.value !== verifiedValue) {
    throw new Error(
      "Response value does not match witness: canister returned tampered data"
    );
  }

  return verifiedValue;
}
```

The JS SDK documentation covers the full `verifyCertification` API at [js.icp.build](https://js.icp.build).

## Deploy and test

```bash
# Deploy the canister
icp deploy backend

# Set a certified value (update call: goes through consensus)
icp canister call backend set '("greeting", "hello world")'

# Query the certified value
icp canister call backend get '("greeting")'
# Returns: record { value = opt "hello world"; certificate = blob "..."; witness = blob "..." }

# Delete a value
icp canister call backend delete '("greeting")'

# Verify certification survives upgrade
icp canister call backend set '("key", "value")'
icp deploy backend  # triggers upgrade
icp canister call backend get '("key")'
# Expected: certificate is non-null (postupgrade re-established certification)
```

## Common mistakes

**Calling `certified_data_set` in a query call**: this traps immediately. The pattern is: set the hash during update calls, retrieve the certificate during query calls.

**Not updating the hash after data changes**: if you modify the tree but forget to call `certified_data_set`, query responses will fail client verification because the certificate proves a stale hash.

**Forgetting to re-certify after upgrade**: certified data is cleared on upgrade. Both `#[init]` and `#[post_upgrade]` (Rust) or `system func postupgrade` (Motoko) must call the certification function.

**Building the witness for the wrong key**: the Merkle proof must correspond to the exact key being queried. A witness for `users/alice` will not verify `users/bob`.

**Skipping certificate freshness checks on the client**: the certificate's `/time` field contains the subnet timestamp. Without a freshness check, an attacker could replay a stale certificate with outdated data. Always check that `certificate_time` is within an acceptable delta (5 minutes is recommended).

**Assuming `data_certificate()` is available in update calls**: it returns `None` / `null` in update calls. Only query calls can access the certificate.

## HTTP asset certification

For canisters that serve HTTP responses directly through the HTTP Gateway, responses must be certified so the boundary node can verify them. This is a separate protocol built on top of certified data, handled by the `ic-http-certification` crate. For frontend assets (HTML, CSS, JS), use the asset canister, which handles HTTP certification automatically.

See [Frontend certification](../../guides/frontends/certification.md) for the asset canister and HTTP certification workflow.

## Next steps

- [Security concepts](../../concepts/security.md): why query integrity matters and when to use certified variables vs replicated queries
- [Frontend certification](../../guides/frontends/certification.md): HTTP asset certification for the asset canister
- [IC Interface Specification](../../reference/ic-interface-spec.md): the certified data system API and certificate format

<!-- Upstream: informed by dfinity/portal — docs/building-apps/security/data-integrity-and-authenticity.mdx; dfinity/icskills — skills/certified-variables/SKILL.md; dfinity/cdk-rs — library/ic-certified-map/src/lib.rs, ic-cdk/src/api.rs; caffeinelabs/motoko-core — src/CertifiedData.mo; dfinity/examples — motoko/cert-var; dfinity/response-verification — README.md -->
