---
title: "Response certification"
description: "Verify that frontend responses are authentic and untampered using IC certificates"
sidebar:
  order: 4
---

Query responses on ICP are answered by a single replica without going through consensus. A malicious or faulty replica could return fabricated data. **Response certification** solves this: canisters commit a cryptographic hash to the subnet's certified state, and query responses include a certificate signed by the subnet's threshold BLS key. [HTTP gateways](../../concepts/edge-infrastructure.md#http-gateways) verify every HTTP response automatically, so users are protected without any extra client-side code: as long as the canister certifies its responses. The gateway does not verify Candid calls an app makes through an agent; see [Client-side certificate verification](#client-side-certificate-verification).

This guide explains how certification works at the HTTP layer, what each frontend recipe does automatically, when you need custom certification, and how to verify certificates client-side.

## How HTTP response certification works

Both frontend recipes implement **HTTP certification v2**, a protocol on top of certified data:

1. **Certification setup (update call)**: when an asset is uploaded, the canister inserts its path, response headers, and body hash into a Merkle tree and commits the tree's root hash via `certified_data_set`. The subnet includes this root hash in its certified state each consensus round.

2. **HTTP query call**: when a browser requests an asset, the canister retrieves the subnet BLS certificate via `data_certificate()`, generates a Merkle proof (witness) for the requested path, and returns the response with `IC-Certificate` and `IC-CertificateExpression` headers containing the certificate and witness.

3. **Gateway verification**: the HTTP gateway verifies the BLS signature on the certificate, extracts the certified root hash, and confirms the witness proves the response body and headers are included under that root hash. If verification fails, the gateway returns an error.

```text
UPLOAD (update call, goes through consensus):
  1. Asset body and headers are hashed
  2. Hash is inserted into Merkle tree at the asset's path
  3. certified_data_set(tree_root_hash) -- stored in subnet state

HTTP REQUEST (query call, single replica):
  1. Browser requests an asset
  2. Canister calls data_certificate() -- retrieves BLS-signed certificate
  3. Canister builds Merkle witness for the requested path
  4. Response includes IC-Certificate and IC-CertificateExpression headers

HTTP GATEWAY VERIFICATION (transparent):
  1. Verifies certificate BLS signature against IC root public key
  2. Extracts certified_data from certificate
  3. Verifies witness proves (path, headers, body hash) is in the tree
  4. Forwards verified response to browser
```

The browser receives only responses that have passed this check. Because verification happens at the gateway, no browser-side JavaScript is needed for standard asset serving.

## Certified vs uncertified access

Through the standard ICP gateway, a canister that serves HTTP is reachable on two kinds of hostname: one where the gateway verifies the response certificate before forwarding it, and a `raw` one where it forwards the response without checking. Which hostnames a gateway exposes, and which of them verify, is a property of how that gateway is deployed rather than of the canister:

| Domain | Certification | Notes |
|--------|--------------|-------|
| `<canister-id>.icp.net` | Verified | The gateway checks the proof on every response |
| `<canister-id>.raw.icp.net` | None | The canister still attaches the certificate; the gateway discards it |

What you can do about the raw host depends on which canister you deployed.

**Static site.** The canister certifies every response and accepts only version 2 of the certification protocol, so nothing it serves is uncertified. There is deliberately no raw-access switch: the canister's only clue about the hostname is the `Host` header, which the client supplies and nothing authenticates, and which hostnames verify is a property of how a given gateway is deployed rather than anything the gateway protocol defines. Verification is the gateway's job, so picking the gateway is the trust decision. Link to a verifying host, and treat a raw URL as a debugging tool rather than a way to serve or visit a site. See [Who verifies the certificate](static-site/how-it-works.md#who-verifies-the-certificate).

**Asset canister (legacy).** Raw access is enabled by default, and the canister can refuse it. Disable it in `.ic-assets.json5` for any assets that must not be served unverified:

```json5
[
  {
    "match": "**/*",
    "allow_raw_access": false
  }
]
```

With `allow_raw_access` set to `false`, the canister answers requests for a raw mainnet hostname with a `308` redirect to a certified one. A request to `<canister-id>.raw.icp.net` or `<canister-id>.raw.icp0.io` lands on `<canister-id>.icp0.io`, and `<canister-id>.raw.ic0.app` on `<canister-id>.ic0.app`. The canister recognizes raw hostnames by the `Host` header, so a local `raw.localhost` request is not redirected.

## What each recipe certifies automatically

Neither recipe needs certification code from you. What differs is how much of the response is covered.

**Static site.** Certifies every response it serves, including status code, body, and the headers you declare in [`_headers`](static-site/headers.md). There is no way to turn certification off and no uncertified header path, which is why redirects and headers are limited to what can be enumerated ahead of time, and why the sync plugin rejects [reserved headers](static-site/headers.md#reserved-headers) at deploy time instead of serving a value it cannot certify. Note that it adds no default headers at all: no `Cache-Control`, no CSP. Anything you want certified, you declare.

**The asset canister** inserts every uploaded file into the HTTP certification tree, sets the certified root hash after each sync, returns the `IC-Certificate` and `IC-CertificateExpression` headers on every `http_request` query, and re-certifies on subsequent deploys. It certifies `Content-Type`, `Cache-Control` when `max_age` is set, `Content-Encoding` for encoded assets, and the headers you list in `.ic-assets.json5`.

### What gets certified

With the asset canister, headers that are not listed in `.ic-assets.json5` are left out of the certification, which means a malicious replica could inject arbitrary values for them.

Always certify headers that affect browser behavior. In particular:

- `Content-Type`: if uncertified, a malicious replica could serve HTML with `Content-Type: application/javascript`, causing the browser to execute it in a different context
- Security headers (`Content-Security-Policy`, `X-Frame-Options`, etc.): if uncertified, a malicious replica could strip them

The `security_policy: "standard"` option in `.ic-assets.json5` certifies a baseline set of security headers. For custom headers, list them explicitly in `headers`: the asset canister certifies everything in that object.

This whole class of mistake does not exist on a static site, which certifies the full response.

## Custom HTTP canisters

If you are writing a canister that serves HTTP responses directly (not through one of the frontend recipes), you must handle certification yourself using the `ic-http-certification` or `ic-asset-certification` Rust crates.

### When to use custom certification

Use custom HTTP certification when:

- Your canister serves HTTP responses via `http_request` and you need the HTTP gateway to verify them
- You need to certify dynamic responses (generated per request, not pre-uploaded assets)
- You are building a canister that functions as its own frontend without using one of the frontend recipes

For static assets (HTML, CSS, JS, images), [host a static site](static-site/overview.md) instead: certification is handled for you and is more efficient.

### Using ic-asset-certification

The `ic-asset-certification` crate provides a high-level API for certifying static assets embedded in a Rust canister:

Add to `Cargo.toml`:

```toml
[dependencies]
candid = "0.10"
ic-asset-certification = "4"
ic-http-certification = "4"
ic-cdk = "0.20"
```

Certify assets in your `init` and `post_upgrade` hooks. Every path the gateway can request needs a certified response, so paths without an asset fall back to a certified `404.html`: an uncertified error response is rejected by the gateway.

```rust
use ic_asset_certification::{Asset, AssetConfig, AssetFallbackConfig, AssetRouter};
use ic_cdk::{init, post_upgrade, query};
use ic_http_certification::{HttpRequest, HttpResponse, StatusCode};
use std::cell::RefCell;

thread_local! {
    static ROUTER: RefCell<AssetRouter<'static>> = RefCell::new(AssetRouter::default());
}

fn certify_assets() {
    let assets = vec![
        Asset::new("index.html", include_bytes!("../../frontend/index.html").as_slice()),
        Asset::new("404.html", include_bytes!("../../frontend/404.html").as_slice()),
        Asset::new("app.js", include_bytes!("../../frontend/app.js").as_slice()),
    ];

    let configs = vec![
        AssetConfig::File {
            path: "index.html".to_string(),
            content_type: Some("text/html".to_string()),
            headers: vec![("Cache-Control".to_string(), "no-cache".to_string())],
            fallback_for: vec![],
            aliased_by: vec!["/".to_string()],
            encodings: vec![],
        },
        // A certified 404 page for every path without an asset.
        AssetConfig::File {
            path: "404.html".to_string(),
            content_type: Some("text/html".to_string()),
            headers: vec![("Cache-Control".to_string(), "no-cache".to_string())],
            fallback_for: vec![AssetFallbackConfig {
                scope: "/".to_string(),
                status_code: Some(StatusCode::NOT_FOUND),
            }],
            aliased_by: vec![],
            encodings: vec![],
        },
        AssetConfig::Pattern {
            pattern: "*.js".to_string(),
            content_type: Some("text/javascript".to_string()),
            headers: vec![(
                "Cache-Control".to_string(),
                "public, max-age=31536000, immutable".to_string(),
            )],
            encodings: vec![],
        },
    ];

    ROUTER.with_borrow_mut(|router| {
        router.certify_assets(assets, configs).expect("Failed to certify assets");
        ic_cdk::api::certified_data_set(router.root_hash());
    });
}

#[init]
fn init() {
    certify_assets();
}

// The router lives on the heap and is wiped on upgrade: rebuild it and re-set the root hash.
#[post_upgrade]
fn post_upgrade() {
    certify_assets();
}

#[query]
fn http_request(request: HttpRequest) -> HttpResponse<'static> {
    ROUTER.with_borrow(|router| {
        // Adds the IC-Certificate and IC-CertificateExpression headers.
        router
            .serve_asset(
                &ic_cdk::api::data_certificate().expect("http_request must be a query"),
                &request,
            )
            // Uncertified, so the gateway rejects it: only reached if no asset or fallback matches.
            .unwrap_or_else(|_| HttpResponse::not_found(b"Not found".to_vec(), vec![]).build())
    })
}

ic_cdk::export_candid!();
```

For the full pattern including streaming, 404 fallbacks, and compressed encodings, see the [assets example](https://github.com/dfinity/response-verification/tree/main/examples/http-certification/assets) in the `response-verification` repository.

### Using ic-http-certification

For more control (certifying dynamic responses, certifying only specific headers, or building a custom CEL expression) use the lower-level `ic-http-certification` crate directly. See the [ic-http-certification documentation](https://docs.rs/ic-http-certification) for details.

## Client-side certificate verification

Which responses need client-side code depends on who verifies them:

| Response | Verified by | Client code |
|----------|-------------|-------------|
| HTTP from a frontend canister or `http_request`, on a verifying host (`<canister-id>.icp.net`, a custom domain) | the HTTP gateway | none |
| The same response on a `raw` hostname, or fetched by your own HTTP client | nobody | [`@dfinity/response-verification`](https://www.npmjs.com/package/@dfinity/response-verification) (`verifyRequestResponsePair`) |
| Update call through an actor | consensus; the agent verifies the response certificate | none |
| Candid query call through an actor | only the signature of the node that answered | certified data, verified with `@dfinity/certificate-verification` |

The gateway does not verify the Candid calls an app makes through an agent, even when the app itself was served from a verifying host. A canister that returns certified data over Candid (the pattern in [Certified variables](../backends/certified-variables.md)) returns `(data, certificate, witness)`, and the client verifies them.

### Verifying a certified response

Use `@dfinity/certificate-verification` from the `response-verification` repository. Version 4 peer-depends on `@icp-sdk/core` ^6 and takes `Uint8Array` inputs:

```bash
npm install @dfinity/certificate-verification @icp-sdk/core
```

`verifyCertification` verifies the certificate's BLS signature against the root key, checks that the certificate's `/time` is within `maxCertificateTimeOffsetMs`, decodes the witness, and checks that the witness root hash equals the canister's `certified_data` in the certificate. It returns the witness tree for the lookup:

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

`lookup_path` returns a status, and only `Absent` proves that a key does not exist. `Unknown` means the witness does not cover the key: treat it as a failure, never as "not found", or a replica can hide a real value behind a witness for another key. Candid `blob` fields arrive as `Uint8Array` in `@icp-sdk/bindgen` bindings, so the response can be passed as is.

Pass the root key of the network the canister runs on:

- **Browser:** `safeGetCanisterEnv()?.IC_ROOT_KEY` from the `ic_env` cookie (`@icp-sdk/core/agent/canister-env`), which the frontend canister sets on local networks and mainnet alike. It is the key of the network serving the page.
- **Node scripts and tests:** the `root_key` field of `icp network status --json`, hex-decoded to bytes.
- **Mainnet:** the agent's built-in default, `agent.rootKey` on an agent created without a `rootKey` option.

> **Never call `fetchRootKey()` or set `shouldFetchRootKey: true` in shipped code.** They make the agent fetch the root key from the replica over an unauthenticated connection: a man-in-the-middle could supply a fake root key and make forged certificates appear valid.

For a runnable example of the verification steps in a browser (a single certified value, verified with `@icp-sdk/core` directly), see [`motoko/cert-var`](https://github.com/dfinity/examples/tree/master/motoko/cert-var).

## Common mistakes

**Sharing a raw URL.** A raw link is copy-pasteable and gets passed on, and nothing in the response tells the visitor it arrived unverified. Link to a verifying hostname, and keep raw for debugging. On the asset canister you can also refuse it outright with `"allow_raw_access": false`, which is worth setting for anything sensitive.

**Assuming certification implies verification.** A certificate only helps if somebody checks it, and in a browser that is the gateway, chosen by whoever wrote the URL. A canister that certifies every response still gives a visitor on a non-verifying gateway no better assurance than an ordinary web host.

**Not certifying Content-Type and security headers (asset canister).** Headers not listed in `.ic-assets.json5` are not included in the certification. A malicious replica could inject arbitrary values for uncertified headers. Always certify `Content-Type` and any security headers your application relies on.

**Fetching the root key on mainnet.** Calling `agent.fetchRootKey()` or setting `shouldFetchRootKey: true` against mainnet allows a man-in-the-middle to supply a fake root key. Use the hardcoded key (default behavior of the JS SDK) for all mainnet deployments.

**Skipping certificate freshness checks.** The certificate's `/time` field contains the subnet timestamp. Without checking that this timestamp is recent, an attacker could replay a stale certificate. Always set `maxCertificateTimeOffsetMs` to a reasonable value (5 minutes is recommended).

**Losing the certification tree on upgrade.** Certified data itself survives upgrades, but a certification tree kept on the heap (an `HttpCertificationTree` or `AssetRouter`) does not, while the old root hash stays set. Rebuild the tree in `#[post_upgrade]` and call `certified_data_set` again, as in the example above.

**Certifying responses in the canister but not updating the hash.** If you modify assets or data but forget to call `certified_data_set` with the new root hash, query responses will fail the HTTP gateway's verification.

## Next steps

- [Hosting a static site](static-site/overview.md): deploy a frontend whose every response is certified
- [Asset canister (legacy)](asset-canister.md): certification on the older recipe, and how to migrate
- [Certified variables](../backends/certified-variables.md): certify Candid query responses from backend canisters
- [Security concepts](../../concepts/security.md): why query integrity matters
- [HTTP Gateway specification](../../references/http-gateway-protocol-spec.md): how HTTP gateways verify responses

<!-- Upstream: informed by dfinity/response-verification — packages/ic-asset-certification/README.md, packages/ic-http-certification/README.md, packages/certificate-verification-js/README.md, packages/certificate-verification-js/src/index.ts, examples/certification/certified-counter; dfinity/portal — docs/building-apps/frontends/asset-security.mdx; dfinity/icskills — skills/certified-variables/SKILL.md, skills/static-site/SKILL.md -->
