---
title: "Asset Canister"
description: "Serve web assets from a canister on the Internet Computer."
sidebar:
  order: 1
doc_type: how-to
level: intermediate
features: []
icskills:
  - asset-canister
last_verified: 2026-03-10
---

Asset canisters host frontend web applications on ICP. They compile HTML, CSS, JavaScript, and other static files into a Wasm module that serves content over HTTP.

## How asset canisters work

An asset canister implements `http_request` and `http_request_streaming_callback` methods. When a user visits `https://<canister-id>.icp0.io`, the boundary node forwards the request to the canister, which returns the appropriate asset.

The typical workflow:

1. Write frontend code (HTML, JS, CSS, or use a framework like React or SvelteKit).
2. Configure your `icp.yaml` with the `@dfinity/asset-canister` recipe.
3. Run `icp deploy`. The CLI compiles assets into a Wasm module and installs it.
4. Users access the app at `https://<canister-id>.icp0.io` or a [custom domain](/guides/frontends/custom-domains/).

## Configuration

Define an asset canister in your `icp.yaml`:

```yaml
canisters:
  - name: frontend
    recipe:
      type: "@dfinity/asset-canister@v2.1.0"
      configuration:
        dir: dist
        build:
          - npm install
          - npm run build
```

- **`dir`** -- directory containing built assets to upload.
- **`build`** -- commands to run before uploading assets (e.g., build your frontend).

Backend canister IDs are automatically injected via the `ic_env` cookie — no `dependencies` field needed.

## Asset configuration with .ic-assets.json5

Create a `.ic-assets.json5` file in your source directory to configure headers, caching, and file handling:

```json5
[
  {
    "match": "**/*",
    "security_policy": "standard",
    "headers": {
      "Content-Security-Policy": "default-src 'self'; script-src 'self'"
    }
  },
  {
    "match": "**/*.js",
    "headers": {
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  },
  {
    "match": ".well-known",
    "ignore": false
  }
]
```

Key fields:

| Field | Purpose |
|-------|---------|
| `match` | Glob pattern for files |
| `ignore` | Include (`false`) or exclude (`true`) files |
| `headers` | HTTP response headers |
| `cache.max_age` | Cache duration in seconds |
| `security_policy` | `"standard"`, `"hardened"`, or `"disabled"` |
| `allow_raw_access` | Set `false` to redirect `.raw.icp0.io` to `.icp0.io` |

Hidden files (starting with `.`) are ignored by default. Use `"ignore": false` to include them.

## SPA routing

For single-page applications, configure a fallback so all routes serve `index.html`. The asset canister supports this through the `allow_raw_access` and routing configuration. Your SPA framework's build step typically handles this by outputting a single `index.html` that your client-side router uses.

## Uploading assets programmatically

Use the `@dfinity/assets` npm package to upload files to an asset canister from JavaScript:

```js
import { AssetManager } from "@dfinity/assets";

const assetManager = new AssetManager({
  canisterId: assetCanisterId,
  agent,
  concurrency: 32,
  maxSingleFileSize: 450000,
  maxChunkSize: 1900000,
});

await assetManager.store(fileContent, { fileName: "images/logo.png" });
```

## Application URLs

| Environment | URL format |
|-------------|------------|
| Local | `http://127.0.0.1:8000/?canisterId=<canister-id>` |
| Mainnet | `https://<canister-id>.icp0.io` |
| Raw | `https://<canister-id>.raw.icp0.io` |

The `raw.icp0.io` domain bypasses response verification and serves content directly. Use the standard `.icp0.io` domain for production to benefit from [response certification](/guides/frontends/certification/).

## Limitations

- A single asset canister can host approximately **1 GiB** of static files. Distribute across multiple canisters for larger sites.
- Server-side rendering (SSR) is not supported in canisters. Host SSR frontends externally and connect to ICP backend canisters via the [ICP SDK](https://js.icp.build).
- Dynamic URLs are not natively supported. Use client-side routing or a library like [ic-pluto](https://crates.io/crates/ic-pluto) for server-side dynamic routing.

## Next steps

- [Custom domains](/guides/frontends/custom-domains/) -- use your own domain name
- [Response certification](/guides/frontends/certification/) -- verify HTTP responses
- [icp-cli configuration reference](https://dfinity.github.io/icp-cli/reference/configuration/) -- asset canister recipe options
