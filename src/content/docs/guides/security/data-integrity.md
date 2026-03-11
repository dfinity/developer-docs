---
title: "Data Integrity and Certification"
description: "Ensuring data integrity through response certification and certified variables"
sidebar:
  order: 4
doc_type: how-to
level: intermediate
icskills: [certified-variables]
last_verified: 2026-03-10
---

ICP offers two modes for reading canister state: **update calls** and **query calls**. Each has different security properties. Understanding when and how to certify data is essential for applications that serve security-sensitive information.

## Update calls vs query calls

| Property | Update call | Query call |
|----------|------------|------------|
| Speed | Slow (2-4 seconds) | Fast (<200ms) |
| Execution | Replicated across subnet | Single replica |
| Response signed | Yes (subnet threshold signature) | No |
| State mutation | Yes | No |
| Integrity guarantee | Full consensus | None (single replica can forge response) |

**The problem:** Query calls are fast but a malicious replica or boundary node can modify the response. This makes raw query calls unsuitable for security-critical data.

**The solution:** Certified variables let you pre-certify data in update calls, then serve it through fast query calls with a cryptographic proof that the data is authentic.

## How certified data works

Every execution round, the subnet creates a threshold signature over a state tree that includes a `certified_data` field for each canister. This field is limited to **32 bytes**.

The flow:

1. **Update call:** Compute a hash of your data structure and store it as the canister's `certified_data` using `ic0.certified_data_set`. The subnet signs it in the next round.
2. **Query call:** Return the data along with the `certificate` (from `data_certificate()`) and a `witness` (Merkle proof) that the data is part of the certified hash.
3. **Client:** Verify the certificate signature against the IC root public key, check the timestamp for freshness, and verify the witness links the returned data to the certified hash.

Since only 32 bytes are certified, you typically store the **root hash of a Merkle tree** that contains your actual data. The witness proves a specific leaf is part of that tree.

## When to use certification

**Use certified variables when:**

- Your frontend needs fast, authenticated responses (query-speed with update-level trust)
- You serve assets over HTTP that boundary nodes verify
- You provide data that users make financial or governance decisions on

**You may not need certification when:**

- The data is not security-critical (e.g., display-only metrics)
- You can call query methods as update calls (replicated queries) and accept the latency
- Your data changes so frequently that the certification overhead is impractical

**Tip:** Replica-signed queries (enabled by default in the ICP Rust and JavaScript agents) protect against malicious boundary nodes but not malicious replicas. They are a lighter alternative but do not provide full subnet-level guarantees.

## Implementation pattern

### 1. Set up a Merkle tree in canister state

**Rust:**

```rust
use ic_certified_map::RbTree;
use std::cell::RefCell;

thread_local! {
    static TREE: RefCell<RbTree<Vec<u8>, Vec<u8>>> = RefCell::new(RbTree::new());
}
```

**Motoko:**

```motoko
import CertTree "mo:ic-certification/CertTree";

stable let cert_store : CertTree.Store = CertTree.newStore();
let ct = CertTree.Ops(cert_store);
```

### 2. Update the tree and certify on writes

**Rust:**

```rust
#[ic_cdk::update]
fn set_value(key: String, value: String) {
    TREE.with_borrow_mut(|tree| {
        tree.insert(key.as_bytes().to_vec(), value.as_bytes().to_vec());
        ic_cdk::api::set_certified_data(&tree.root_hash());
    });
}
```

**Motoko:**

```motoko
public func setValue(key : Text, value : Text) : async () {
    ct.put([Text.encodeUtf8(key)], Text.encodeUtf8(value));
    ct.setCertifiedData();
};
```

### 3. Return certified data in queries

**Rust:**

```rust
#[ic_cdk::query]
fn get_value(key: String) -> CertifiedResponse {
    let certificate = ic_cdk::api::data_certificate()
        .expect("No data certificate available");

    TREE.with_borrow(|tree| {
        let value = tree.get(key.as_bytes())
            .expect("Key not found")
            .to_owned();

        let mut witness = vec![];
        let mut serializer = serde_cbor::Serializer::new(&mut witness);
        serializer.self_describe().unwrap();
        tree.witness(key.as_bytes())
            .serialize(&mut serializer)
            .unwrap();

        CertifiedResponse { value, certificate, witness }
    })
}
```

### 4. Verify on the client

The client must:

1. **Verify the certificate signature** against the IC root public key.
2. **Check the timestamp** in the certificate (reject if older than 5 minutes).
3. **Extract `certified_data`** from the certificate tree at path `/canister/<canister_id>/certified_data`.
4. **Recompute the witness root hash** and verify it matches `certified_data`.
5. **Look up the value** in the witness using the query parameters as the path.
6. **Compare** the witness value with the returned response.

Libraries like `@icp-sdk/core` (JavaScript) and `ic-certificate-verification` (Rust) provide helpers for these steps.

## HTTP asset certification

The asset canister automatically certifies all served assets. If you serve HTTP responses from a custom canister, add the `ic-certificate` header with the certification proof.

**Serve assets through `<canister-id>.icp0.io`**, where boundary nodes enforce response verification. Never serve security-critical content through `raw.icp0.io`, which skips verification.

Check in your `http_request` handler if the request came through `raw.icp0.io` and return an error if so:

```rust
#[query]
fn http_request(req: HttpRequest) -> HttpResponse {
    // Reject requests through raw.icp0.io
    if req.url.contains("raw.icp0.io") {
        return HttpResponse {
            status_code: 403,
            body: b"Use icp0.io instead of raw.icp0.io".to_vec(),
            ..Default::default()
        };
    }
    // Serve certified assets
    // ...
}
```

## Summary

| Approach | Trust level | Latency | Use case |
|----------|------------|---------|----------|
| Update call | Full consensus | 2-4s | State mutations, security-critical reads where latency is acceptable |
| Query + certified variables | Full consensus | <200ms | Security-critical reads requiring fast responses |
| Replica-signed query | Protects against boundary nodes | <200ms | Moderate trust, convenience |
| Raw query | None | <200ms | Non-critical, display-only data |
