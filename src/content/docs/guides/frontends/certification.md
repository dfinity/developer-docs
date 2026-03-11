---
title: "Response Certification"
description: "Verify HTTP responses and configure content security policies for canisters."
sidebar:
  order: 3
doc_type: how-to
level: intermediate
features: []
icskills:
  - certified-variables
last_verified: 2026-03-10
---

When a user fetches a page from a canister, the response comes through a boundary node. Without verification, a compromised or malicious boundary node could alter the content. Response certification lets clients cryptographically verify that the response they received matches what the canister actually produced.

## How certification works

1. During an **update call**, the canister computes a hash of the data it wants to certify and stores it in a **certified variable** via the system API.
2. The subnet signs a hash tree that includes the canister's certified data as part of consensus.
3. When a **query call** returns the data, it also returns a **certificate** -- a proof signed by the subnet.
4. The client (browser or agent) verifies the certificate against the subnet's public key, confirming the response is authentic.

This mechanism allows query calls (which are fast and free) to return trustworthy data without going through consensus themselves.

## Certified variables

Certified variables are the low-level primitive for certification. A canister sets a 32-byte value that gets included in the subnet's certified state tree.

### Motoko

```motoko
import CertifiedData "mo:base/CertifiedData";
import Blob "mo:base/Blob";
import SHA256 "mo:sha2/Sha256";

actor {
  stable var data : Text = "Hello";

  func certifyData() {
    let hash = SHA256.fromBlob(#sha256, Text.encodeUtf8(data));
    CertifiedData.set(Blob.toArray(hash));
  };

  public func update(newData : Text) : async () {
    data := newData;
    certifyData();
  };

  public query func get() : async (Text, Blob) {
    let cert = CertifiedData.getCertificate();
    (data, cert)
  };
}
```

### Rust

```rust
use ic_cdk::api::{set_certified_data, data_certificate};
use sha2::{Sha256, Digest};

#[ic_cdk::update]
fn set_data(value: String) {
    DATA.with(|d| *d.borrow_mut() = value.clone());

    let hash = Sha256::digest(value.as_bytes());
    set_certified_data(&hash);
}

#[ic_cdk::query]
fn get_data() -> (String, Option<Vec<u8>>) {
    let cert = data_certificate();
    let value = DATA.with(|d| d.borrow().clone());
    (value, cert)
}
```

## HTTP response certification

For asset canisters and HTTP endpoints, the `ic-http-certification` library handles certification of full HTTP responses, including status codes, headers, and bodies.

The asset canister (`type: "assets"`) handles HTTP certification automatically. You do not need to implement it manually for standard frontend deployments.

For custom HTTP endpoints, use the `ic-http-certification` crate:

```rust
use ic_http_certification::{HttpCertification, HttpCertificationTree, HttpCertificationPath};

// Certify responses for a specific path
let path = HttpCertificationPath::exact("/api/data");

// Certify all paths under a prefix using wildcards
let wildcard_path = HttpCertificationPath::wildcard("/assets");
```

The library supports:

- **Exact path certification** -- certify responses for specific URLs
- **Wildcard certification** -- certify responses for URL prefixes (useful for 404 pages and catch-all routes)
- **Header and body certification** -- prove the entire response is authentic

## Content security policy

Configure CSP headers in your `.ic-assets.json5` to control what resources the browser is allowed to load:

```json5
[
  {
    "match": "**/*",
    "security_policy": "standard",
    "headers": {
      "Content-Security-Policy": "default-src 'self'; script-src 'self'; connect-src 'self' https://icp0.io https://*.icp0.io https://icp-api.io; img-src 'self' data:; style-src 'self' 'unsafe-inline'; frame-ancestors 'none'; upgrade-insecure-requests;"
    }
  }
]
```

Security recommendations:

- Tighten `connect-src` to only the canister IDs your frontend needs to call.
- Replace `'unsafe-inline'` in `style-src` with specific hashes where possible.
- Use [CSP Evaluator](https://csp-evaluator.withgoogle.com/) to validate your policy.
- Set `"allow_raw_access": false` to redirect `.raw.icp0.io` requests to the certified `.icp0.io` endpoint.

## When to use certification

| Scenario | Certification needed? |
|----------|-----------------------|
| Asset canister (standard `type: "assets"`) | Handled automatically |
| Custom `http_request` endpoint | Yes, implement manually |
| Inter-canister query results | Use certified variables if trust matters |
| Backend-only canister (no HTTP) | Not applicable |

## Next steps

- [Asset canister](/guides/frontends/asset-canister/) -- configure and deploy frontend assets
- [Custom domains](/guides/frontends/custom-domains/) -- serve your app from a custom domain
- [ic-http-certification crate](https://crates.io/crates/ic-http-certification) -- library documentation
