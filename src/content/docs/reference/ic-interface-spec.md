---
title: "IC Interface Specification"
description: "The Internet Computer interface specification defining the system API and protocol"
sidebar:
  order: 1
doc_type: reference
level: advanced
last_verified: 2026-03-10
---

The IC interface specification is the canonical reference for the Internet Computer protocol. It defines the system API available to canisters, the HTTP interface for external clients, message encoding, certification, and state management.

## Key sections

### System API (ic0)

The system API is a set of functions imported by canister Wasm modules under the `ic0` namespace. These functions allow canisters to:

- Read message payloads and reply to callers
- Call other canisters
- Access stable memory
- Manage timers and certified data
- Query cycle balances and accept cycles
- Trap with error messages

### HTTP interface

External clients interact with the IC through HTTP endpoints:

| Endpoint | Purpose |
|----------|---------|
| `POST /api/v2/canister/<id>/call` | Submit update calls |
| `POST /api/v2/canister/<id>/query` | Submit query calls |
| `POST /api/v2/canister/<id>/read_state` | Read certified state |
| `GET /api/v2/status` | Subnet status and root key |

### Management canister

The virtual management canister (`aaaaa-aa`) exposes system-level operations. See [Management Canister](/reference/management-canister/) for the full API reference.

### Certification

The IC uses Merkle trees and BLS signatures to certify query responses. The state tree contains canister metadata, module hashes, and certified data that can be verified against the subnet's public key.

## Canonical source

The full specification is maintained in the [Internet Computer interface specification repository](https://github.com/dfinity/interface-spec). For the complete, authoritative reference including CBOR encoding details, authentication schemes, and message routing rules, consult the specification directly.

## Related pages

- [Management Canister](/reference/management-canister/) — API for canister lifecycle operations
- [Candid Specification](/reference/candid-spec/) — Interface description language used for encoding
- [HTTP Gateway Protocol](/reference/http-gateway-spec/) — How HTTP requests reach canisters
