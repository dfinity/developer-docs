---
title: "Asset Canister"
description: "Deploy and serve frontend assets from an ICP canister with SPA routing, canister discovery, programmatic uploads, and security configuration"
sidebar:
  order: 1
---

The asset [canister](../../concepts/canisters.md) hosts static files (HTML, CSS, JavaScript, images) directly on the Internet Computer. It serves web frontends over HTTP, with responses certified by the [subnet](../../concepts/network-overview.md#subnets) so that HTTP gateways and browsers can verify that content was served by the blockchain rather than a centralized server.

This guide covers configuring the asset canister recipe in `icp.yaml`, deploying frontends, configuring SPA routing with `.ic-assets.json5`, connecting frontends to backend canisters, and uploading assets programmatically.

## How the asset canister works

The asset canister is a pre-built Rust canister maintained by DFINITY. It implements an `http_request` endpoint that accepts HTTP requests and returns HTTP responses containing your frontend files. When you deploy with icp-cli, the tool:

1. Downloads the pre-built asset canister WASM
2. Creates the canister (if new) and installs the WASM
3. Syncs your build output directory to the canister (uploading, updating, and deleting files as needed)

Users access your frontend at `https://<canister-id>.icp0.io` (mainnet) or `http://<canister-id>.localhost:8000` (local). You can also register a [custom domain](custom-domains.md).

### What the asset canister provides

- **HTTP serving** with proper content types inferred from file extensions
- **Automatic compression** using gzip and Brotli (no configuration needed)
- **Response certification** so HTTP gateways can verify content integrity
- **SPA routing** via configurable aliasing rules
- **Canister discovery** by exposing backend canister IDs through an `ic_env` cookie
- **Permission-based upload control** with Prepare, Commit, and ManagePermissions roles

### Limitations

- **No server-side rendering.** Canisters cannot run JavaScript at the server level. Use static-site generation (SSG) or client-side rendering. If SSR is required, host the frontend outside ICP and keep the backend logic in a canister.
- **No dynamic URL routing at the server level.** The asset canister serves static files. Client-side routing (via SPA aliasing) works, but server-generated routes do not.
- **Storage limits.** The asset canister can hold well over 4 GiB in stable memory, but individual uploads are limited by the 2 MB ingress message size (the JS SDK handles chunking automatically for larger files). Large media files become expensive in cycles. Use a dedicated storage solution for video or large datasets.

## Configure the asset canister

### icp.yaml

Define an asset canister using the `@dfinity/asset-canister` recipe in your `icp.yaml`:

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

The key fields are:

- **`recipe.type`:** specifies the asset canister recipe with a pinned version. Always pin to a specific version (e.g., `@v2.1.0`). See [available versions](https://github.com/dfinity/icp-cli-recipes/releases?q=asset-canister&expanded=true).
- **`dir`:** the directory containing your build output. This is `dist` for Vite-based projects, `out` for Next.js static exports, or `build` for Create React App. The contents of this directory (not the directory itself) are uploaded to the canister.
- **`build`:** shell commands that icp-cli runs before uploading. If omitted, icp-cli uploads whatever is already in `dir` without building.

For a full-stack project with a backend canister, list both in the same `icp.yaml`:

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
  - name: backend
    recipe:
      type: "@dfinity/rust@v3.2.0"
      configuration:
        package: backend
```

For more on project configuration, see [Project structure](../../getting-started/project-structure.md).

### .ic-assets.json5

The `.ic-assets.json5` file controls asset-level settings: HTTP headers, caching, SPA routing, and raw access policy. Place it in your `public/` or `static/` folder so your build tool copies it into the `dir` directory automatically. The asset canister reads this file during sync.

Here is a recommended configuration:

```json5
[
  {
    // Default settings for all files
    "match": "**/*",
    "security_policy": "standard",
    "headers": {
      "Cache-Control": "public, max-age=0, must-revalidate"
    },
    // Disable raw (uncertified) access by default
    "allow_raw_access": false
  },
  {
    // Cache hashed static assets aggressively
    "match": "assets/**/*",
    "headers": {
      "Cache-Control": "public, max-age=31536000, immutable"
    }
  },
  {
    // SPA fallback: serve index.html for unmatched routes
    "match": "**/*",
    "enable_aliasing": true
  }
]
```

Key settings explained:

- **`security_policy: "standard"`** applies a set of security headers (Content-Security-Policy, X-Frame-Options, etc.). If these headers block your application, override individual headers in the `headers` object rather than removing the security policy entirely.
- **`allow_raw_access: false`** prevents assets from being served on the `raw.icp0.io` domain, where responses are not verified by HTTP gateways. Only enable raw access when strictly needed (e.g., for assets that must be embedded in iframes on other domains).
- **`enable_aliasing: true`** tells the asset canister to serve `index.html` when a requested path has no matching file. This is required for single-page applications where the client-side router handles URL paths like `/about` or `/settings`.

Rules are applied in order. Later rules override earlier ones for overlapping paths.

## Deploy

### Local deployment

```bash
# Start the local network
icp network start -d

# Build and deploy all canisters
icp deploy

# Or deploy only the frontend
icp deploy frontend
```

After deployment, open your browser to `http://<canister-id>.localhost:8000/`. The canister ID appears in the deploy output, or you can retrieve it with `icp canister list`.

### Mainnet deployment

```bash
icp deploy -e ic frontend
```

Your frontend is accessible at `https://<canister-id>.icp0.io` or `https://<canister-id>.ic0.app`.

### Updating the frontend

When only your frontend code has changed:

```bash
npm run build
icp deploy frontend
```

If only static assets changed (no WASM update needed), use `icp sync` instead of a full redeploy: it skips canister reinstallation and only uploads changed files:

```bash
icp sync frontend
```

## Connect frontend to backend canisters

When your frontend needs to call backend canisters, it needs the backend's canister ID and the network's root key. The asset canister provides both automatically through the **canister discovery** mechanism.

### How canister discovery works

During `icp deploy`, icp-cli injects all canister IDs as environment variables (formatted as `PUBLIC_CANISTER_ID:<canister-name>`) into every canister in the environment. The asset canister exposes these variables, along with the network's root key (`IC_ROOT_KEY`), through a cookie named `ic_env` that is set on all HTML responses.

This means your frontend code works identically on local networks and mainnet without any environment-specific configuration.

### Reading canister IDs in JavaScript

Use `@icp-sdk/core` to read the `ic_env` cookie:

```javascript
import { safeGetCanisterEnv } from "@icp-sdk/core/agent/canister-env";

const canisterEnv = safeGetCanisterEnv();
const backendId = canisterEnv?.["PUBLIC_CANISTER_ID:backend"];
```

icp-cli does not generate `.env` files. The `ic_env` cookie is the standard mechanism for frontend canister discovery.

For the complete pattern (creating an agent and making calls), see the [hello-world template](https://github.com/dfinity/icp-cli-templates/tree/main/hello-world) which demonstrates reading the `ic_env` cookie and calling a backend canister. For frontend-only projects without a backend, see the [static-website template](https://github.com/dfinity/icp-cli-templates/tree/main/static-website).

### Local development with a dev server

For fast iteration with hot module replacement, use a local dev server (Vite, webpack, etc.) instead of accessing the asset canister directly. Since the dev server is not the asset canister, it does not set the `ic_env` cookie automatically. You need to configure the dev server to provide it.

The workflow is:

```bash
icp network start -d
icp deploy backend    # Only the backend needs to be deployed
npm run dev           # Start your dev server with ic_env configuration
```

See the [frontend-environment-variables example](https://github.com/dfinity/icp-cli/tree/main/examples/icp-frontend-environment-variables) for a complete Vite configuration that fetches canister IDs from the CLI and sets the `ic_env` cookie locally.

## Programmatic uploads with @icp-sdk/canisters

For uploading files from code rather than through `icp deploy`, use the `AssetManager` from `@icp-sdk/canisters`:

```javascript
import { AssetManager } from "@icp-sdk/canisters/assets";
import { HttpAgent } from "@icp-sdk/core/agent";

const LOCAL_REPLICA = "http://localhost:8000";
const MAINNET = "https://ic0.app";
const host = LOCAL_REPLICA; // Change to MAINNET for production

const agent = await HttpAgent.create({
  host,
  // Only fetch the root key on local replicas.
  // Setting this to true against mainnet is a security vulnerability
  // because it lets a man-in-the-middle supply a fake root key.
  shouldFetchRootKey: host === LOCAL_REPLICA,
});

const assetManager = new AssetManager({
  canisterId: "your-asset-canister-id",
  agent,
});

// Upload a single file (files >1.9 MB are automatically chunked)
const key = await assetManager.store(fileBuffer, {
  fileName: "photo.jpg",
  contentType: "image/jpeg",
  path: "/uploads",
});
console.log("Uploaded to:", key); // "/uploads/photo.jpg"

// List all assets
const assets = await assetManager.list();

// Delete an asset
await assetManager.delete("/uploads/old-photo.jpg");
```

For the full API, see the [JS SDK canisters documentation](https://js.icp.build/canisters).

### Upload permissions

The asset canister has a built-in permission system with three roles:

| Role | Can upload chunks | Can commit (publish) | Can manage permissions |
|------|:-:|:-:|:-:|
| **Prepare** | Yes | No | No |
| **Commit** | Yes | Yes | No |
| **ManagePermissions** | Yes | Yes | Yes |

Grant permissions using `icp canister call`:

```bash
# Grant commit permission for a deploy pipeline
icp canister call frontend grant_permission '(record {
  to_principal = principal "<principal-id>";
  permission = variant { Commit }
})'

# List principals with commit permission
icp canister call frontend list_permitted '(record {
  permission = variant { Commit }
})'

# Revoke a permission
icp canister call frontend revoke_permission '(record {
  of_principal = principal "<principal-id>";
  permission = variant { Commit }
})'
```

> **Security note:** Do not use `icp canister settings update frontend --add-controller <principal-id>` for upload access. Controllers have full canister control (upgrade WASM, change settings, delete the canister, drain cycles). Use `grant_permission` with the appropriate role instead.

## Verify deployment

After deploying, confirm everything is working:

```bash
# Check canister status
icp canister status frontend

# List uploaded assets
icp canister call frontend list '(record {})'

# Fetch the index page
icp canister call frontend http_request '(record {
  url = "/";
  method = "GET";
  body = vec {};
  headers = vec {};
  certificate_version = opt 2;
})'
```

To test SPA routing, request a path that only exists as a client-side route:

```bash
icp canister call frontend http_request '(record {
  url = "/about";
  method = "GET";
  body = vec {};
  headers = vec {};
  certificate_version = opt 2;
})'
# Should return status_code = 200 (index.html), not 404
```

## Common issues

**Build output directory is empty or missing.** The `dir` field in `icp.yaml` must point to the directory that exists after your build commands run. For Vite projects this is `dist`, for Next.js static exports it is `out`. If the directory does not exist at deploy time, `icp deploy` fails or deploys an empty canister.

**SPA routes return 404 on refresh.** Add `"enable_aliasing": true` in `.ic-assets.json5`. Without this, the asset canister looks for a literal file at the requested path (e.g., `/about`) and returns 404 when it does not exist.

**Wrong canister name in deploy command.** If `icp.yaml` defines `frontend` but you run `icp deploy assets`, icp-cli creates a new canister instead of updating the existing one. Always use the exact name from your configuration.

**Frontend cannot find backend canister IDs.** Ensure both canisters are deployed together (`icp deploy` without arguments) so that all canister IDs are injected into all canisters. Deploying a single canister only updates that canister's environment variables.

**Content types are wrong for programmatic uploads.** The asset canister infers content types from file extensions for files uploaded via `icp deploy`. When uploading programmatically with `AssetManager`, pass the `contentType` option explicitly.

## Next steps

- [Framework integration](frameworks.md): set up React, Svelte, or Vue with the asset canister
- [Custom domains](custom-domains.md): serve your frontend from your own domain
- [Response certification](certification.md): verify that asset canister responses are authentic
- [Authentication with Internet Identity](../authentication/internet-identity.md): add user login to your frontend
- [photo-storage example](https://github.com/dfinity/examples/tree/master/hosting/photo-storage): programmatic uploads with AssetManager

<!-- Upstream: informed by dfinity/icskills — skills/asset-canister/SKILL.md, dfinity/portal — docs/building-apps/frontends/using-an-asset-canister.mdx, dfinity/portal — docs/building-apps/frontends/uploading-serving-assets.mdx -->
