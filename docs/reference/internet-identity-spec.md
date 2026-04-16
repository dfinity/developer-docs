---
title: "Internet Identity Specification"
description: "Internet Identity protocol: delegation chains, passkey management, and canister signatures"
sidebar:
  order: 12
---

Internet Identity (II) is the Internet Computer's native authentication system. This page describes the protocol that II uses to authenticate users: how delegation chains are structured, how passkeys and OpenID Connect (OIDC) providers are managed, how canister signatures work, and how the alternative origins mechanism lets multiple domains share the same user principal.

For a practical integration guide with working code, see [Internet Identity](../guides/authentication/internet-identity.md).

## Canister IDs

| Canister | ID | URL |
|---|---|---|
| Internet Identity backend | `rdmx6-jaaaa-aaaaa-aaadq-cai` | — |
| Internet Identity frontend | `uqzsh-gqaaa-aaaaq-qaada-cai` | `https://id.ai` |

Both IDs are identical on local replicas when `ii: true` is set in your network configuration. See [System Canisters](system-canisters.md) for the hosting subnet and full canister listing.

## Identity design and data model

Internet Identity uses an **identity anchor** model. Each user creates one or more anchors (numeric identifiers), and each anchor can have multiple authentication devices registered to it.

### Principal-per-app isolation

II derives a **different principal** for each frontend origin. A user logging into `https://app-a.icp0.io` gets a different principal than when logging into `https://app-b.icp0.io`, even with the same anchor and the same passkey. This principal-per-app isolation has two security properties:

- A delegation issued for one dapp cannot be used to authenticate at another.
- Multiple dapps cannot correlate a user's activity across services.

The principal for a user at a given origin is computed as:

```
principal = SHA-224(DER-encoded_canister_signature_public_key) · 0x02
```

where the canister signature public key encodes both the signing canister (`rdmx6-…`) and a seed derived from the anchor number and the frontend origin. This is the self-authenticating principal form defined in the [IC interface specification](ic-interface-spec.md).

### Anchors and devices

An **anchor** is an unsigned 64-bit integer. Users can register multiple devices (passkeys, security keys, recovery phrases) against a single anchor. All devices associated with an anchor produce the same set of principals — the principal depends on the anchor number and origin, not on which device was used to authenticate.

## Passkey management

II uses the [WebAuthn](https://www.w3.org/TR/webauthn/) standard to register and authenticate devices. WebAuthn defines two operations:

- **Registration (`create`)** — generates a new key pair on the authenticator and returns the public key and a credential ID to the relying party (the II frontend).
- **Assertion (`get`)** — proves possession of the private key by signing a challenge.

### Supported key types

II supports the key types used by common platform and roaming authenticators:

| Key type | Curve | Algorithm |
|---|---|---|
| ECDSA P-256 | secp256r1 | ES256 (SHA-256) |
| Ed25519 | Curve25519 | EdDSA |

Platform authenticators (Touch ID, Face ID, Windows Hello) typically use ECDSA P-256. Some hardware security keys support Ed25519; ECDSA P-256 is more universally supported.

### OpenID Connect (OIDC) login

In addition to passkeys, II supports OpenID Connect (OIDC) providers (Google, Apple, Microsoft). An OpenID Connect login produces the same principal as a passkey login for the same anchor — the key type differs, but the principal derivation uses the same anchor number and frontend origin.

## Client authentication protocol

The client authentication protocol is how a dapp frontend requests authentication from II. It uses the browser's `postMessage` API to communicate between the dapp origin and the II frontend origin.

### Overview

1. The dapp frontend generates a **session key pair** (ephemeral Ed25519 key pair) and stores the private key in memory or session storage.
2. The dapp opens the II frontend (`https://id.ai`) in a popup window, passing the session public key and requested delegation parameters.
3. The user authenticates with their passkey.
4. II signs a **delegation** from the anchor's principal key to the session public key.
5. II returns the delegation to the dapp via `postMessage`.
6. The dapp attaches the session key and delegation to canister calls.

The II frontend authenticates the requesting origin using the frontend origin in the `postMessage` call. This is what derives the origin-specific principal — II uses the frontend origin (scheme + host + port) as the seed input when computing the delegation.

### Delegation structure

A delegation in the II protocol has the following fields:

| Field | Type | Description |
|---|---|---|
| `pubkey` | `blob` | The session public key to delegate to |
| `expiration` | `nat` | Expiry timestamp in nanoseconds since Unix epoch |
| `targets` | `array of CanisterId` (optional) | If set, the delegation only applies to these canisters |

The delegation is signed by the II canister using a **canister signature** (see [Canister signatures](#canister-signatures) below). The dapp then uses the session key to sign individual canister calls, attaching the II delegation as `sender_delegation` in the request envelope.

### Expiry constraints

- **Default recommendation:** 8 hours (`BigInt(8) * BigInt(3_600_000_000_000)` nanoseconds).
- **Maximum:** 30 days (2,592,000,000,000,000 nanoseconds). Longer values are silently clamped by II.

The IC validates delegation expiry on every request. Expired delegations are rejected.

### Session key

The session key is a short-lived key pair generated by the dapp frontend. Its purpose is to avoid exposing the user's anchor key to the frontend. The lifecycle is:

- Generated fresh at the start of each authentication flow.
- Private key stays in the browser (memory or `sessionStorage`).
- Discarded after logout or expiry.

The backend canister sees the user's principal (derived from the anchor key), not the session key. The session key is only used to sign the transport layer — the IC verifies the delegation chain and surfaces the anchor-derived principal to canister code.

## Delegation chain format

The IC interface specification defines the complete wire format for delegation chains. The relevant fields in an II-authenticated canister call are:

| Field | Description |
|---|---|
| `sender_pubkey` | DER-encoded session public key |
| `sender_delegation` | Array of signed delegations |
| `sender_sig` | Signature over the request, using the session private key |

The `sender_delegation` field is an array. For a typical II authentication, there is one delegation: from the II canister's per-app key to the session public key. The IC walks the chain:

1. Verifies `sender_pubkey` is a self-authenticating principal encoding of the `sender`.
2. For each delegation in `sender_delegation`, verifies the signature and checks that expiry has not passed.
3. Verifies `sender_sig` using the final key in the chain.

Delegation chains may not contain cycles or self-signed delegations. The maximum chain length accepted by the IC is 20 delegations. See the [IC interface specification](ic-interface-spec.md) for the full verification algorithm.

## Canister signatures

The II canister uses **canister signatures** to sign delegations. A canister signature is an IC-specific signature scheme where a canister proves a value by including it in its certified data.

### How it works

1. The II canister stores an empty blob at path `["sig", SHA-256(seed), SHA-256(payload)]` in its certified variable tree. This causes the certified data root hash to commit to both the seed and the payload.
2. A certification is produced: a certificate containing the certified data root hash derived from this tree.
3. The signature returned to the dapp consists of the certificate plus a witness tree that proves the path existed.

The verifier checks:
- The certificate's root hash matches the IC's certified state root.
- The witness tree has a hash that matches the certified data value in the certificate, and contains the path `["sig", SHA-256(seed), SHA-256(payload)]`.
- The delegation payload hash matches.

### Public key encoding

A canister signature public key is a DER-encoded `SubjectPublicKeyInfo` with OID `1.3.6.1.4.1.56387.1.2`. The `BIT STRING` field encodes:

```
|signing_canister_id| · signing_canister_id · seed
```

where `|signing_canister_id|` is a one-byte length prefix and `·` is concatenation. This encoding is what II uses to produce per-app, per-anchor principal keys — the seed encodes the anchor number and origin.

For the full formal definition, see the "Canister signatures" section of the [IC interface specification](ic-interface-spec.md).

## Alternative frontend origins

By default, a user gets a different principal on each distinct frontend origin. Alternative origins let multiple domains produce the same principal.

### When to use this

Alternative origins are useful when:

- You are migrating from `<canister-id>.icp0.io` to a custom domain and need existing users to keep their principals.
- You serve your app from multiple domains within the same organization and want principals to match.
- You serve your app from `/` and `/login` and want both paths to produce the same principal (though subdirectory paths within the same origin already produce the same principal).

:::note
II automatically handles the `icp0.io` vs `ic0.app` domain difference — you do **not** need alternative origins for that case.
:::

### Protocol

The protocol follows a discovered configuration model. The dapp designates a **primary origin (A)** and lists alternative origins (B, C, …) in a well-known endpoint:

1. The primary origin (A) serves a JSON document at:
   ```
   GET https://<origin-A>/.well-known/ii-alternative-origins
   ```
   with response body:
   ```json
   {
     "alternativeOrigins": [
       "https://www.alternatedomain.com"
     ]
   }
   ```
   Maximum 10 entries. No trailing slashes or paths. The document must be served from a canister using **certified assets** — II verifies the response is authentic using the IC's certified variables mechanism before honoring it.

2. The alternative origin (B) sets `derivationOrigin` in its login call:
   ```javascript
   // assumes authClient is initialized — see the Internet Identity guide
   authClient.login({
     identityProvider: "https://id.ai",
     derivationOrigin: "https://<origin-A>",
     onSuccess: () => { /* ... */ },
   });
   ```

3. II fetches `/.well-known/ii-alternative-origins` from the `derivationOrigin`, verifies the certificate, confirms the requesting origin is listed, and issues a delegation for the principal derived from origin A (not origin B).

The primary origin (A) does not set `derivationOrigin` — it authenticates normally and its origin is the canonical derivation origin.

### Asset canister configuration

The `.well-known/` directory and the `ii-alternative-origins` file (no extension) must be explicitly configured in the asset canister to avoid being treated as hidden files:

```json
[
  {
    "match": ".well-known",
    "ignore": false
  },
  {
    "match": ".well-known/ii-alternative-origins",
    "headers": {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    "ignore": false
  }
]
```

See the [Internet Identity guide](../guides/authentication/internet-identity.md) for the complete setup with file layout.

## Session management

### Checking authentication state

The `AuthClient` stores the delegation in `localStorage` so sessions persist across page reloads. Call `authClient.isAuthenticated()` on page load to check whether a valid (non-expired) delegation is stored.

If `isAuthenticated()` returns `true`, call `authClient.getIdentity()` to get the delegation identity and create an authenticated agent without prompting the user to re-authenticate.

### Logout

Calling `authClient.logout()` removes the delegation from `localStorage`. The session key is discarded. The delegation that was issued by II remains valid until its expiry — it is not revoked at the protocol level. Logout is a client-side operation only.

### Delegation expiry and "remember me" flows

- **Short session (8 hours):** Use for typical dapps where re-authentication is acceptable. The user will be prompted again after 8 hours.
- **Long session (up to 30 days):** Use for "remember me" flows. The delegation remains valid for 30 days; the user is only prompted if they explicitly log out or if the delegation expires.

## Protocol boundaries

This section clarifies what the II protocol guarantees and what it does not.

**II guarantees:**
- Each (anchor, origin) pair produces a stable, unique principal.
- Delegations are signed by the II canister's key and can be verified using the IC's certified state.
- Alternative origin lookups are verified using certified assets, preventing an attacker from spoofing the `.well-known/ii-alternative-origins` response.

**II does not guarantee:**
- Revoking individual delegations before their expiry. Logout is client-side only.
- Cross-device session synchronization. Sessions are stored per-browser.
- Account recovery by default. Recovery phrases must be explicitly registered as a device.

## Full specification

The complete Internet Identity specification, including the full Candid interface for the II canister, is maintained in the [dfinity/internet-identity](https://github.com/dfinity/internet-identity) repository.

The Candid interface (`internet_identity.did`) describes every method the II canister exposes, including `create_challenge`, `register`, `add`, `remove`, `get_anchor_info`, `get_delegation`, and `prepare_delegation`. Refer to that file for the canonical types and method signatures.

## Next steps

- [Internet Identity guide](../guides/authentication/internet-identity.md) — practical integration with working code examples
- [System Canisters](system-canisters.md) — canister ID, hosting subnet, and lifecycle information
- [IC Interface Specification](ic-interface-spec.md) — delegation chain wire format, canister signature verification, and the full principal encoding spec

<!-- Upstream: informed by dfinity/portal — docs/building-apps/authentication/integrate-internet-identity.mdx, docs/building-apps/authentication/alternative-origins.mdx, docs/building-apps/security/iam.mdx, docs/references/ic-interface-spec.md; dfinity/icskills — skills/internet-identity/SKILL.md -->
