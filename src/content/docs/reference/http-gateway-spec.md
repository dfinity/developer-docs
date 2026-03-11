---
title: "HTTP Gateway Protocol"
description: "Specification for the HTTP gateway protocol that serves canister content over HTTPS"
sidebar:
  order: 2
doc_type: reference
level: advanced
last_verified: 2026-03-10
---

The HTTP gateway protocol defines how standard HTTP requests from browsers are translated into canister calls and how canister responses are served back as HTTP responses. This is what makes it possible to host full web applications on the Internet Computer.

## How it works

1. A user visits `https://<canister-id>.icp0.io` or a custom domain
2. The boundary node (HTTP gateway) translates the HTTP request into a canister query call to `http_request`
3. The canister returns an HTTP response (status, headers, body)
4. If the response requires mutation, the gateway upgrades to an update call via `http_request_update`
5. The gateway verifies the response against the canister's certified data

## Key concepts

### Query vs. update flow

| Step | Method | When |
|------|--------|------|
| Initial request | `http_request` (query) | Always — fast, no consensus needed |
| Upgrade | `http_request_update` (update) | Only if the query response sets `upgrade = true` |

### Response certification

Canisters can certify their HTTP responses by including an `IC-Certificate` header. The gateway verifies this certificate against the subnet's public key, ensuring the response has not been tampered with. This is critical for security — without certification, a malicious boundary node could serve altered content.

### Streaming

For large responses that exceed the message size limit, canisters use a streaming callback protocol. The initial response includes a `streaming_strategy` field with a callback function and token. The gateway calls this callback repeatedly until no more tokens are returned.

### Custom domains

Custom domains are supported through DNS configuration:

1. Create a CNAME record pointing to `icp1.io`
2. Create a TXT record at `_canister-id.<domain>` with the canister ID
3. The boundary node routes requests to the correct canister

See [Custom Domains](/guides/frontends/custom-domains/) for a step-by-step guide.

## Canonical source

The full specification is maintained in the [HTTP gateway protocol specification](https://github.com/dfinity/interface-spec). It covers edge cases, error handling, and the complete certification verification algorithm.

## Related pages

- [Asset Canister](/guides/frontends/asset-canister/) — Serving web assets
- [Certification](/guides/frontends/certification/) — Response verification in practice
- [IC Interface Specification](/reference/ic-interface-spec/) — Parent protocol specification
