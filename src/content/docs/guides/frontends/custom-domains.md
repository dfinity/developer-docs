---
title: "Custom Domains"
description: "Configure custom DNS domains for canisters on the Internet Computer."
sidebar:
  order: 2
doc_type: how-to
level: intermediate
features: []
icskills: []
last_verified: 2026-03-10
---

By default, canisters are accessible at `<canister-id>.icp0.io`. You can serve your application from a custom domain by configuring DNS records and registering with the HTTP gateway's custom domain service. SSL certificates are automatically provisioned and renewed.

## Step 1: Configure DNS records

Add three DNS records at your domain registrar, replacing `CUSTOM_DOMAIN` with your domain (e.g., `app.example.com`):

| Record type | Host | Value |
|-------------|------|-------|
| `CNAME` | `CUSTOM_DOMAIN` | `CUSTOM_DOMAIN.icp1.io` |
| `TXT` | `_canister-id.CUSTOM_DOMAIN` | Your canister ID |
| `CNAME` | `_acme-challenge.CUSTOM_DOMAIN` | `_acme-challenge.CUSTOM_DOMAIN.icp2.io` |

> **Apex domains:** Most DNS providers do not allow `CNAME` records at the apex (e.g., `example.com`). Use an `ANAME` or `ALIAS` record if your provider supports CNAME flattening.

> **Important:** Disable any SSL/TLS certificate offering from your DNS provider (e.g., Cloudflare Universal SSL) as it will interfere with the custom domain registration.

## Step 2: Create the ic-domains file

Create a `.well-known/ic-domains` file in your frontend source listing your custom domains, one per line:

```
app.example.com
www.example.com
```

Add a `.ic-assets.json5` file to ensure the hidden directory is included in the build:

```json5
[
  {
    "match": ".well-known",
    "ignore": false
  }
]
```

## Step 3: Deploy the canister

```bash
icp deploy frontend --environment ic
```

## Step 4: Validate your configuration (optional)

```bash
curl -sL https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN/validate | jq
```

A successful response includes `"validation_status": "valid"`. Fix any errors before proceeding.

## Step 5: Register the domain

```bash
curl -sL -X POST https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN | jq
```

## Step 6: Check registration status

Registration takes a few minutes. Track progress with:

```bash
curl -sL https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN | jq
```

Status values: `registering`, `registered`, `expired`, `failed`.

Once the status is `registered`, wait a few more minutes for the certificate to propagate to all HTTP gateways, then access your canister at the custom domain.

## Update a custom domain

To point your domain at a different canister:

1. Update the `TXT` record for `_canister-id.CUSTOM_DOMAIN` with the new canister ID.
2. Send a `PATCH` request:

```bash
curl -sL -X PATCH https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN | jq
```

## Remove a custom domain

1. Remove the `TXT` and `_acme-challenge` `CNAME` DNS records.
2. Send a `DELETE` request:

```bash
curl -sL -X DELETE https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN | jq
```

## HttpAgent configuration

When using a custom domain, the `@icp-sdk/core` HttpAgent may not automatically detect the ICP API host. Configure it explicitly:

```ts
const host = isProduction ? "https://icp-api.io" : undefined;
const agent = await HttpAgent.create({ host });
```

## Internet Identity and custom domains

If your app uses Internet Identity, user principals depend on the origin domain. Switching from `<canister-id>.icp0.io` to a custom domain changes the principal users receive. To prevent this, configure [alternative origins](https://internetcomputer.org/docs/building-apps/authentication/alternative-origins) before migrating.

## Troubleshooting

- **Validate first.** Always run the validate endpoint before registering.
- **Check DNS propagation.** Use `dig TXT _canister-id.CUSTOM_DOMAIN` to verify records.
- **Remove stale ACME records.** Check for leftover `_acme-challenge` TXT records from previous certificate providers.
- **Verify ic-domains file.** Open `<canister-id>.icp0.io/.well-known/ic-domains` in a browser to confirm it is accessible.

## Next steps

- [Asset canister](/guides/frontends/asset-canister/) -- configure your frontend canister
- [Response certification](/guides/frontends/certification/) -- verify HTTP responses
- [icp-cli CLI reference](https://dfinity.github.io/icp-cli/reference/cli/) -- deploy and canister management commands
