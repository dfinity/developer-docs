---
title: "Response Certification"
description: "Verify that frontend responses are authentic and untampered using IC certificates"
sidebar:
  order: 3
---

Query responses on ICP are answered by a single replica without going through consensus. A malicious or faulty replica could return fabricated data. **Response certification** solves this: canisters commit a cryptographic hash to the subnet's certified state, and query responses include a certificate signed by the subnet's threshold BLS key. HTTP gateways (boundary nodes) verify every response automatically, so users are protected without any extra client-side code — as long as the canister certifies its responses.

This guide explains how certification works at the HTTP layer, what the asset canister does automatically, when you need custom certification, and how to verify certificates client-side.

## How HTTP response certification works

The asset canister implements **HTTP certification v2**, a protocol on top of certified data:

1. **Certification setup (update call)** — when an asset is uploaded, the canister inserts its path, response headers, and body hash into a Merkle tree and commits the tree's root hash via `certified_data_set`. The subnet includes this root hash in its certified state each consensus round.

2. **HTTP query call** — when a browser requests an asset, the canister retrieves the subnet BLS certificate via `data_certificate()`, generates a Merkle proof (witness) for the requested path, and returns the response with `IC-Certificate` and `IC-Certificate-Expression` headers containing the certificate and witness.

3. **Boundary node verification** — the HTTP gateway (boundary node) verifies the BLS signature on the certificate, extracts the certified root hash, and confirms the witness proves the response body and headers are included under that root hash. If verification fails, the gateway returns an error.

```
UPLOAD (update call, goes through consensus):
  1. Asset body and headers are hashed
  2. Hash is inserted into Merkle tree at the asset's path
  3. certified_data_set(tree_root_hash) -- stored in subnet state

HTTP REQUEST (query call, single replica):
  1. Browser requests an asset
  2. Canister calls data_certificate() -- retrieves BLS-signed certificate
  3. Canister builds Merkle witness for the requested path
  4. Response includes IC-Certificate and IC-Certificate-Expression headers

BOUNDARY NODE VERIFICATION (transparent):
  1. Verifies certificate BLS signature against IC root public key
  2. Extracts certified_data from certificate
  3. Verifies witness proves (path, headers, body hash) is in the tree
  4. Forwards verified response to browser
```

The browser receives only responses that have passed this check. Because verification happens at the boundary node, no browser-side JavaScript is needed for standard asset serving.

## Certified vs uncertified access

The asset canister supports two serving modes:

| Domain | Certification | Notes |
|--------|--------------|-------|
| `<canister-id>.icp0.io` | Verified | Boundary node checks every response |
| `<canister-id>.raw.icp0.io` | None | Responses not verified — use only when necessary |

Raw access is enabled by default. Disable it in `.ic-assets.json5` for any assets that must not be served unverified:

```json5
[
  {
    "match": "**/*",
    "allow_raw_access": false
  }
]
```

With `allow_raw_access` set to `false`, requests to the `raw.icp0.io` domain are redirected to the certified domain automatically.

## What the asset canister handles automatically

When you deploy a frontend with `icp deploy`, the asset canister:

- Inserts every uploaded file into the HTTP certification tree
- Sets the certified root hash after each sync
- Returns the correct `IC-Certificate` and `IC-Certificate-Expression` headers on every `http_request` query
- Updates certification when files change on subsequent deploys
- Certifies `Content-Type` and any headers specified in `.ic-assets.json5`

You do not need to write any certification code to use the standard asset canister workflow. See [Asset canister](asset-canister.md) for the deployment configuration.

### What gets certified

The asset canister certifies the full response: path, response body, status code, and the response headers you configure in `.ic-assets.json5`. Headers that are not listed are not included in the certification, which means a malicious replica could inject arbitrary values for uncertified headers.

Always certify headers that affect browser behavior. In particular:

- `Content-Type` — if uncertified, a malicious replica could serve HTML with `Content-Type: application/javascript`, causing the browser to execute it in a different context
- Security headers (`Content-Security-Policy`, `X-Frame-Options`, etc.) — if uncertified, a malicious replica could strip them

The `security_policy: "standard"` option in `.ic-assets.json5` certifies a baseline set of security headers. For custom headers, list them explicitly in `headers` — the asset canister certifies everything in that object.

## Custom HTTP canisters

If you are writing a canister that serves HTTP responses directly (not through the asset canister), you must handle certification yourself using the `ic-http-certification` or `ic-asset-certification` Rust crates.

### When to use custom certification

Use custom HTTP certification when:

- Your canister serves HTTP responses via `http_request` and you need boundary nodes to verify them
- You need to certify dynamic responses (generated per request, not pre-uploaded assets)
- You are building a canister that functions as its own frontend without using the standard asset canister

For static assets (HTML, CSS, JS, images), use the standard asset canister instead — it handles all certification automatically and is more efficient.

### Using ic-asset-certification

The `ic-asset-certification` crate provides a high-level API for certifying static assets embedded in a Rust canister:

Add to `Cargo.toml`:

```toml
[dependencies]
ic-asset-certification = "3"
ic-http-certification = "3"
ic-cdk = "0.19"
```

Certify assets in your `init` and `post_upgrade` hooks:

```rust
use ic_asset_certification::{Asset, AssetConfig, AssetRouter};
use ic_cdk::{init, post_upgrade, query};
use ic_http_certification::{HttpRequest, HttpResponse};
use std::cell::RefCell;

thread_local! {
    static ROUTER: RefCell<AssetRouter<'static>> = RefCell::new(AssetRouter::default());
}

fn certify_assets() {
    let assets = vec![
        Asset::new("index.html", include_bytes!("../../../frontend/index.html").as_slice()),
        Asset::new("app.js", include_bytes!("../../../frontend/app.js").as_slice()),
    ];

    let configs = vec![
        AssetConfig::File {
            path: "index.html".to_string(),
            content_type: Some("text/html".to_string()),
            headers: vec![
                ("Cache-Control".to_string(), "no-cache".to_string()),
            ],
            fallback_for: vec![],
            aliased_by: vec!["/".to_string()],
            encodings: vec![],
        },
        AssetConfig::Pattern {
            pattern: "*.js".to_string(),
            content_type: Some("text/javascript".to_string()),
            headers: vec![
                ("Cache-Control".to_string(), "public, max-age=31536000, immutable".to_string()),
            ],
            encodings: vec![],
        },
    ];

    ROUTER.with(|router| {
        let mut router = router.borrow_mut();
        router.certify_assets(assets, configs).expect("Failed to certify assets");

        // Update the canister's certified data with the tree root hash.
        ic_cdk::api::certified_data_set(&router.root_hash());
    });
}

#[init]
fn init() {
    certify_assets();
}

#[post_upgrade]
fn post_upgrade() {
    // Certified data is cleared on upgrade — must be re-established.
    certify_assets();
}

#[query]
fn http_request(request: HttpRequest) -> HttpResponse {
    ROUTER.with(|router| {
        let router = router.borrow();

        // The router builds the response with IC-Certificate and
        // IC-Certificate-Expression headers automatically.
        match router.serve_asset(
            &ic_cdk::api::data_certificate().expect("data_certificate not available"),
            &request,
        ) {
            Ok(response) => response,
            Err(_) => HttpResponse::builder()
                .with_status_code(404)
                .with_body(b"Not found".to_vec())
                .build(),
        }
    })
}
```

For the full pattern including streaming, 404 fallbacks, and compressed encodings, see the [assets example](https://github.com/dfinity/response-verification/tree/main/examples/http-certification/assets) in the `response-verification` repository.

### Using ic-http-certification

For more control — certifying dynamic responses, certifying only specific headers, or building a custom CEL expression — use the lower-level `ic-http-certification` crate directly. See the [ic-http-certification documentation](https://docs.rs/ic-http-certification) for details.

## Client-side certificate verification

For standard asset serving via the asset canister, verification is transparent: the boundary node verifies every response before forwarding it to the browser, and you do not need any JavaScript verification code.

For custom canisters returning certified data over the Candid interface (not HTTP), you may need to verify the certificate in JavaScript. This is the pattern covered in [Certified variables](../backends/certified-variables.md) — the canister returns `(data, certificate, witness)` as Candid values, and the frontend verifies them with `@dfinity/certificate-verification`.

### When client-side verification is needed

- Your canister exposes a Candid query method that returns certified data (not via `http_request`)
- You want to verify certification in the browser independently, without relying on the boundary node
- You are building a custom HTTP client that does not use a standard HTTP gateway

### Verifying a certified response

Use `@dfinity/certificate-verification` from the `response-verification` repository:

```bash
npm install @dfinity/certificate-verification
```

The `verifyCertification` function performs the full six-step verification:

1. Verify the certificate BLS signature against the IC root public key
2. Check certificate freshness — `/time` must be within `maxCertificateTimeOffsetMs` of the current time
3. CBOR-decode the witness into a hash tree
4. Reconstruct the witness root hash
5. Compare with `certified_data` in the certificate
6. Return the verified tree for value lookup

```typescript
import { verifyCertification } from "@dfinity/certificate-verification";
import { lookup_path, lookupResultToBuffer } from "@icp-sdk/core/agent";
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
  // Steps 1–5: verifies BLS signature, time, and witness match.
  // Throws CertificateTimeError or CertificateVerificationError on failure.
  const tree = await verifyCertification({
    canisterId: Principal.fromText(canisterId),
    encodedCertificate: response.certificate,
    encodedTree: response.witness,
    rootKey,
    maxCertificateTimeOffsetMs: MAX_CERT_TIME_OFFSET_MS,
  });

  // Step 6: look up the key in the verified witness tree.
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
      "Response value does not match witness — canister returned tampered data"
    );
  }

  return verifiedValue;
}
```

Obtain the root key from the agent:

```typescript
import { HttpAgent } from "@icp-sdk/core/agent";

const IS_LOCAL = process.env.NODE_ENV !== "production";

const agent = await HttpAgent.create({
  host: IS_LOCAL ? "http://localhost:8000" : "https://icp-api.io",
  // Only fetch root key on local networks.
  // On mainnet, the root key is hardcoded in the JS SDK.
  // Fetching it on mainnet is a security risk — never do this in production.
  shouldFetchRootKey: IS_LOCAL,
});

// Use agent.rootKey in verifyCertification calls
```

> **Never call `fetchRootKey()` or set `shouldFetchRootKey: true` against mainnet.** These options let the agent fetch the root key from the replica over an unauthenticated connection — a man-in-the-middle could supply a fake root key and make forged certificates appear valid. On mainnet, the root key is hardcoded in the JS SDK.

For the full working example including a backend canister, see the [certified-counter example](https://github.com/dfinity/response-verification/tree/main/examples/certification/certified-counter).

## Common mistakes

**Not disabling raw access for sensitive assets.** By default `allow_raw_access` is `true`, meaning assets are also available on `raw.icp0.io` where no verification occurs. Set `"allow_raw_access": false` in `.ic-assets.json5` for any assets that must not be served unverified.

**Not certifying Content-Type and security headers.** Headers not listed in `.ic-assets.json5` are not included in the certification. A malicious replica could inject arbitrary values for uncertified headers. Always certify `Content-Type` and any security headers your application relies on.

**Fetching the root key on mainnet.** Calling `agent.fetchRootKey()` or setting `shouldFetchRootKey: true` against mainnet allows a man-in-the-middle to supply a fake root key. Use the hardcoded key (default behavior of the JS SDK) for all mainnet deployments.

**Skipping certificate freshness checks.** The certificate's `/time` field contains the subnet timestamp. Without checking that this timestamp is recent, an attacker could replay a stale certificate. Always set `maxCertificateTimeOffsetMs` to a reasonable value (5 minutes is recommended).

**Forgetting to re-certify after canister upgrade.** Certified data is cleared on upgrade. Custom canisters must call `certified_data_set` with the current tree root hash in both `#[init]` and `#[post_upgrade]` (Rust) or `system func postupgrade` (Motoko).

**Certifying responses in the canister but not updating the hash.** If you modify assets or data but forget to call `certified_data_set` with the new root hash, query responses will fail boundary node verification.

## Next steps

- [Asset canister](asset-canister.md) — deploy and configure the standard asset canister with automatic certification
- [Certified variables](../backends/certified-variables.md) — certify Candid query responses from backend canisters
- [Security concepts](../../concepts/security.md) — why query integrity matters
- [HTTP Gateway specification](../../reference/http-gateway-spec.md) — how boundary nodes verify responses

<!-- Upstream: informed by dfinity/response-verification — packages/ic-asset-certification/README.md, packages/ic-http-certification/README.md, packages/certificate-verification-js/README.md, packages/certificate-verification-js/src/index.ts, examples/certification/certified-counter; dfinity/portal — docs/building-apps/frontends/asset-security.mdx; dfinity/icskills — skills/certified-variables/SKILL.md, skills/asset-canister/SKILL.md -->
