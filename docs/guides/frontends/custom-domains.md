---
title: "Custom Domains"
description: "Point a custom domain to your ICP-hosted frontend with DNS and boundary node configuration"
sidebar:
  order: 2
---

By default, every canister on ICP is accessible at `https://<canister-id>.icp0.io`. To serve your frontend under your own domain (e.g., `app.example.com`), you register it with the HTTP gateway custom domain service.

The service handles TLS certificate provisioning, renewal, and routing automatically. You configure three DNS records, deploy a domain ownership file to your canister, and call a registration API.

## Prerequisites

- A registered domain from any registrar (Namecheap, GoDaddy, Cloudflare, Route 53, etc.)
- Access to edit DNS records for that domain
- A deployed asset canister (see [Asset canister](asset-canister.md))
- `curl` for the registration API calls

## Overview

The full setup involves:

1. Configure three DNS records for your domain
2. Create a `.well-known/ic-domains` file in your frontend assets listing your domain
3. Deploy your canister with the ownership file
4. Validate your configuration (optional but recommended)
5. Register the domain via the REST API
6. Wait for certificate provisioning

## Step 1: Configure DNS records

Add three DNS records at your registrar. Replace `CUSTOM_DOMAIN` with your domain (e.g., `app.example.com`):

| Record type | Host | Value |
|---|---|---|
| `CNAME` | `CUSTOM_DOMAIN` | `CUSTOM_DOMAIN.icp1.io` |
| `TXT` | `_canister-id.CUSTOM_DOMAIN` | your canister ID (e.g., `hwvjt-wqaaa-aaaam-qadra-cai`) |
| `CNAME` | `_acme-challenge.CUSTOM_DOMAIN` | `_acme-challenge.CUSTOM_DOMAIN.icp2.io` |

Some registrars omit the main domain suffix when entering records. For `app.example.com` on such providers:

- `app` instead of `app.example.com`
- `_canister-id.app` instead of `_canister-id.app.example.com`
- `_acme-challenge.app` instead of `_acme-challenge.app.example.com`

**Apex domains:** Many registrars do not allow a `CNAME` on the apex (e.g., `example.com` without a subdomain). Use your provider's `ANAME` or `ALIAS` record type if available — these work like CNAME flattening and point to `CUSTOM_DOMAIN.icp1.io`. For GoDaddy apex domains, use Cloudflare or another provider that supports apex CNAME flattening.

**Cloudflare users (if you already use Cloudflare as your DNS provider):** Disable Universal SSL under SSL/TLS > Edge Certificates before registering. Cloudflare's Universal SSL interferes with the ACME certificate challenge used by ICP. Also set DNS mode to "DNS only" (not proxied). If you are on Namecheap, GoDaddy, or Route 53 without Cloudflare, this note does not apply to you.

## Step 2: Create the `ic-domains` file

Your canister must serve `/.well-known/ic-domains` over HTTP. This file proves you own the domain.

Create the file with one domain per line:

```text
app.example.com
www.example.com
```

**Placement for asset canisters:** Hidden directories (starting with `.`) are excluded by the asset canister by default. To include `.well-known/`:

1. Place the file in your `public/` directory (Vite, SvelteKit, Nuxt) or `static/` directory (older SvelteKit versions) so the build tool copies it to the output directory. For Next.js, place it in `public/`. Most frameworks have a dedicated directory for static files that are copied as-is to the build output:

   ```
   public/
   ├── .ic-assets.json5
   └── .well-known/
       └── ic-domains
   ```

2. Add a rule to your `.ic-assets.json5` to allow the hidden directory:

   ```json5
   [
     {
       "match": ".well-known",
       "ignore": false
     }
   ]
   ```

   If you already have an `.ic-assets.json5`, add this rule to the existing array.

## Step 3: Deploy your canister

Deploy to mainnet so the ownership file is live:

```bash
icp deploy -e ic frontend
```

Replace `frontend` with your canister's name as defined in `icp.yaml`.

Verify the file is accessible:

```bash
curl -sL https://<canister-id>.icp0.io/.well-known/ic-domains
```

You should see your domain listed in the response.

## Step 4: Validate your configuration (recommended)

Before registering, validate that your DNS records and canister file are correct:

```bash
curl -sL -X GET "https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN/validate" | jq
```

A successful response:

```json
{
  "status": "success",
  "message": "Domain is eligible for registration: DNS records are valid and canister ownership is verified",
  "data": {
    "domain": "CUSTOM_DOMAIN",
    "canister_id": "CANISTER_ID",
    "validation_status": "valid"
  }
}
```

If validation fails, the response indicates what is wrong:

| Error | Fix |
|---|---|
| Missing DNS CNAME record | Add the `_acme-challenge` CNAME pointing to `_acme-challenge.CUSTOM_DOMAIN.icp2.io` |
| Missing DNS TXT record | Add the `_canister-id` TXT record with your canister ID |
| Invalid DNS TXT record | Ensure the TXT value is a valid canister ID (no extra spaces or quotes) |
| More than one DNS TXT record | Remove duplicate `_canister-id` TXT records — keep exactly one |
| Failed to retrieve known domains | Ensure `.well-known/ic-domains` is deployed and served (`ignore: false` in `.ic-assets.json5`) |
| Domain missing from list | Add the domain to the `ic-domains` file and redeploy |

## Step 5: Register the domain

```bash
curl -sL -X POST "https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN" | jq
```

A successful response:

```json
{
  "status": "success",
  "message": "Domain registration request accepted and may take a few minutes to process",
  "data": {
    "domain": "CUSTOM_DOMAIN",
    "canister_id": "CANISTER_ID"
  }
}
```

Common registration errors:

- **bad_request** — Invalid domain format, missing DNS records, or validation errors. Run the validate endpoint first.
- **conflict** — A certificate already exists for this domain, or another registration task is in progress. Retry after a few minutes.
- **internal_server_error** — An unexpected error occurred. Retry later.

## Step 6: Wait for certificate provisioning

Registration takes a few minutes. Poll the status endpoint:

```bash
curl -sL -X GET "https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN" | jq
```

The `registration_status` field progresses from `registering` → `registered`:

| Status | Meaning |
|---|---|
| `registering` | Request accepted, certificate provisioning in progress |
| `registered` | Certificate issued, domain is live |
| `expired` | Certificate has expired — re-register with a `POST` request to trigger a new provisioning cycle |
| `failed` | Registration failed — check the error message in the response |

Once `registered`, wait a few more minutes for propagation to all HTTP gateways before testing in a browser.

## Example: registering `foo.bar.com`

For canister ID `hwvjt-wqaaa-aaaam-qadra-cai` and domain `foo.bar.com`:

**DNS records:**

| Record type | Host | Value |
|---|---|---|
| `CNAME` | `foo.bar.com` | `foo.bar.com.icp1.io` |
| `TXT` | `_canister-id.foo.bar.com` | `hwvjt-wqaaa-aaaam-qadra-cai` |
| `CNAME` | `_acme-challenge.foo.bar.com` | `_acme-challenge.foo.bar.com.icp2.io` |

**`ic-domains` file** (at `public/.well-known/ic-domains`):

```text
foo.bar.com
```

**Registration commands:**

```bash
# Validate
curl -sL -X GET "https://icp0.io/custom-domains/v1/foo.bar.com/validate" | jq

# Register
curl -sL -X POST "https://icp0.io/custom-domains/v1/foo.bar.com" | jq

# Check status
curl -sL -X GET "https://icp0.io/custom-domains/v1/foo.bar.com" | jq
```

## HttpAgent configuration for custom domains

When your frontend runs on a custom domain, the `HttpAgent` cannot automatically detect the IC API host. Configure it explicitly:

```typescript
import { HttpAgent } from "@icp-sdk/core/agent";

const isProduction = process.env.NODE_ENV === "production";
const host = isProduction ? "https://icp-api.io" : undefined;
const agent = await HttpAgent.create({ host });
```

Without this, `HttpAgent` falls back to using the page origin as the API host — which will fail on custom domains since they do not proxy IC API traffic.

For local development, you also need to pass `shouldFetchRootKey: true` so the agent can fetch the replica's root key. See [Asset canister](asset-canister.md) for a complete local + mainnet agent setup example.

## Updating a custom domain

To point an existing custom domain at a different canister:

1. Update the `_canister-id` TXT record in your DNS settings to the new canister ID.

2. Notify the service:

   ```bash
   curl -sL -X PATCH "https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN" | jq
   ```

3. Check the registration status to track progress:

   ```bash
   curl -sL -X GET "https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN" | jq
   ```

## Removing a custom domain

1. Remove the `_canister-id` TXT record and the `_acme-challenge` CNAME from your DNS settings.

2. Notify the service:

   ```bash
   curl -sL -X DELETE "https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN" | jq
   ```

3. Confirm deletion — the status endpoint should return 404:

   ```bash
   curl -sL -X GET "https://icp0.io/custom-domains/v1/CUSTOM_DOMAIN" | jq
   ```

## Internet Identity and custom domains

Internet Identity (II) derives user principals from the origin domain. If your users authenticate using the canister URL (`<canister-id>.icp0.io`) and you switch to a custom domain, they will get different principals on the new domain.

To preserve the same principals across both origins, configure alternative origins. See [Internet Identity](../authentication/internet-identity.md) for the setup.

## DNS configuration by registrar

### Namecheap

Open the **Advanced DNS** tab for your domain.

**Subdomain** (e.g., `example.ic-domain.live`):

- `ALIAS` record: host `example`, target `example.ic-domain.live.icp1.io`
- `CNAME` record: host `_acme-challenge.example`, target `_acme-challenge.example.ic-domain.live.icp2.io`
- `TXT` record: host `_canister-id.example`, value `<canister-id>`

**Apex** (e.g., `ic-domain.live`):

- `ALIAS` record: host `@`, target `ic-domain.live.icp1.io`
- `CNAME` record: host `_acme-challenge`, target `_acme-challenge.ic-domain.live.icp2.io`
- `TXT` record: host `_canister-id`, value `<canister-id>`

### GoDaddy

GoDaddy does not support `CNAME` or `ALIAS` records on the apex. For apex domains on GoDaddy, use Cloudflare as your DNS provider (free tier available):

1. Create a Cloudflare account and add your domain.
2. Note the two Cloudflare nameservers provided.
3. In GoDaddy DNS Management, remove all existing DNS entries.
4. Under **Nameservers**, click **Change** and enter the Cloudflare nameservers. Nameserver propagation can take several hours; Cloudflare will notify you by email when it completes. Only proceed after the nameservers are active.
5. In Cloudflare, add the CNAME and TXT records as described above.
6. Disable Universal SSL and proxy in Cloudflare (DNS only mode).

For **subdomains** on GoDaddy (works without Cloudflare):

- `CNAME` record: host `example`, value `example.ic-domain.live.icp1.io`
- `CNAME` record: host `_acme-challenge.example`, value `_acme-challenge.example.ic-domain.live.icp2.io`
- `TXT` record: host `_canister-id.example`, value `<canister-id>`

### Amazon Route 53

Route 53 does not support apex CNAME records. For apex domains, follow the Cloudflare alternative DNS approach described in the **GoDaddy** section above (the steps under "use Cloudflare as your DNS provider").

For **subdomains** on Route 53, navigate to **Hosted zones**, click your domain, then click **Create record**:

- `CNAME` record: name `example`, value `example.ic-domain.live.icp1.io`
- `CNAME` record: name `_acme-challenge.example`, value `_acme-challenge.example.ic-domain.live.icp2.io`
- `TXT` record: name `_canister-id.example`, value `<canister-id>`

## Troubleshooting

**Domain not accessible after registration shows `registered`**

Wait 5–10 minutes for propagation to all HTTP gateways. DNS TTL can also delay visibility.

**Validation returns "Missing DNS TXT record"**

DNS changes can take minutes to hours to propagate. Wait and retry. Verify the record is set correctly using `dig`:

```bash
dig TXT _canister-id.CUSTOM_DOMAIN
```

**Validation returns "Failed to retrieve known domains"**

The `.well-known/ic-domains` file is not accessible on your canister. Check:

1. The file exists in the correct location in your build output
2. `.ic-assets.json5` contains `{ "match": ".well-known", "ignore": false }`
3. The canister was redeployed after adding the file

Verify directly:

```bash
curl -sL https://<canister-id>.icp0.io/.well-known/ic-domains
```

**Certificate renewal failing**

If your certificate expires and renewal fails, check for stale `_acme-challenge` TXT records left by your DNS provider's own SSL service. These do not always appear in the dashboard:

```bash
dig TXT _acme-challenge.CUSTOM_DOMAIN
```

If TXT records appear, disable all SSL/TLS offerings from your provider to remove them.

**Multiple TXT records on `_canister-id`**

Only one TXT record may exist for `_canister-id.CUSTOM_DOMAIN`. Check with:

```bash
dig TXT _canister-id.CUSTOM_DOMAIN
```

Remove any duplicates and keep exactly one record containing your canister ID.

## Next steps

- [Certification](certification.md) — Enable certified asset responses for your custom domain
- [Cycles management](../canister-management/cycles-management.md) — Ensure your canister has sufficient cycles for production traffic
- [Internet Identity](../authentication/internet-identity.md) — Configure alternative origins if your users authenticate with II

<!-- Upstream: informed by dfinity/portal — docs/building-apps/frontends/custom-domains/using-custom-domains.mdx, docs/building-apps/frontends/custom-domains/dns-setup.mdx; dfinity/icskills — skills/custom-domains/SKILL.md -->
