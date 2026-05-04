---
title: "Verifiable Credentials"
description: "Issue and verify credentials on ICP using Internet Identity and the VC protocol: covers issuer and relying party integration patterns."
sidebar:
  order: 2
---

A verifiable credential (VC) is a cryptographically signed digital attestation about a user: for example, that they are over 18, passed KYC, or are a member of an organization. On ICP, verifiable credentials are issued by canister-based issuers, mediated by Internet Identity, and consumed by relying party applications.

This guide covers the VC architecture on ICP, how the protocol works, and how to implement both sides of the flow: issuer and relying party.

**Choose your path:** If you are building a service that attests claims about users (age verification, KYC, membership), go to [Implementing an issuer](#implementing-an-issuer). If you are building an app that requests credentials from an issuer to gate access, go to [Implementing a relying party](#implementing-a-relying-party).

## Key concepts

The VC protocol on ICP involves four actors:

- **User**: the person who holds the credential and consents to share it.
- **Issuer**: a canister (or service) that verifies claims about a user and issues credentials. Examples: an age verification service, an employer, a KYC provider.
- **Relying party**: a canister or application that requests credentials from an issuer to gate access or provide personalized experiences.
- **Identity provider**: Internet Identity, which acts as the communication bridge between the relying party and the issuer. Critically, II creates a temporary `id_alias` identifier so the issuer and relying party never learn each other's user principal: preserving unlinkability.

The flow always runs through Internet Identity: the relying party requests a credential, II prompts the user for consent, II contacts the issuer, and the resulting signed credential is returned to the relying party. The issuer and relying party communicate only through II: they never exchange data directly.

## How the protocol works

### High-level flow

1. The user visits the relying party and triggers a credential request (for example, by trying to access a members-only feature).
2. The relying party opens an Internet Identity window at the `/vc-flow` path.
3. II shows the user a consent dialog that identifies the relying party, the issuer, and the requested credential type.
4. If the user approves, II creates an `id_alias`: an opaque temporary identifier unique to this RP/issuer pair.
5. II calls the issuer's `prepare_credential` and `get_credential` endpoints. The issuer returns a signed JWT credential bound to the `id_alias`.
6. II returns a verifiable presentation (VP) to the relying party. The VP contains two nested JWTs:
   - An **id-alias credential** signed by II, proving that the relying party's user principal maps to the `id_alias`.
   - The **issued credential** signed by the issuer, bound to the `id_alias`.
7. The relying party verifies both signatures and the credential claims.

The two-credential structure is what preserves unlinkability: the issuer signs for the `id_alias`, not for the relying party's principal. The relying party can verify the credential chain without learning the user's identity at the issuer.

### Window message protocol

The relying party and Internet Identity communicate through [`window.postMessage()`](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage). When the II window is ready, it sends:

```json
{
  "jsonrpc": "2.0",
  "method": "vc-flow-ready"
}
```

The relying party then sends a `request_credential` message (see [Relying party](#requesting-a-credential) below).

## Implementing an issuer

An issuer is a canister that exposes four API endpoints. Internet Identity calls these endpoints on behalf of users during the VC flow. The issuer never opens connections itself: it responds to calls from II.

### Issuer API endpoints

#### 1. `vc_consent_message`

Returns the consent text shown to the user in the II dialog. This message must clearly describe what credential is being requested and why.

```rust
// vc_consent_message: returns human-readable consent text for the user.
// Called by II before showing the consent dialog.
// Input: CredentialSpec { credentialType, arguments }
// Output: Icrc21ConsentInfo { consent_message, language }
```

<!-- Needs human verification: exact function signature from vc-playground — vc-playground is not in .sources/ -->

#### 2. `derivation_origin`

Returns the URL used to derive the user's principal for this issuer. If you do not use [alternative derivation origins](../../references/internet-identity-spec.md), return the canister's default URL:

```
https://<issuer-canister-id>.icp0.io
```

If you use alternative origins, return the same value as your `derivationOrigin` login parameter. The returned value is verified via `.well-known/ii-alternative-origins`.

#### 3. `prepare_credential`

Validates the credential request and prepares the credential. This endpoint must:

- Validate the request from II (check that the caller is II, the credential type is supported, and the user meets the credential requirements).
- Update `certified_data` with a new root hash that includes the pending signature on the credential.

The endpoint returns a `prepared_context` opaque value that is passed unchanged to `get_credential`. Use it to carry the unsigned VC and any state needed to complete signing.

#### 4. `get_credential`

Issues the signed credential. This endpoint:

- Runs the same validation as `prepare_credential`.
- Verifies that `prepared_context` is consistent with the earlier preparation step.
- Returns the signed credential as a JWT.

The credential is signed using a [canister signature](../../references/ic-interface-spec/index.md#canister-signatures): a signature produced by the canister's key, not an ECDSA or Ed25519 key. This means the canister must update `certified_data` in `prepare_credential` before the signature becomes available in `get_credential`.

### Credential format convention

Return credentials using this convention so relying parties can verify them consistently.

Given a credential specification:

```json
{
  "credentialSpec": {
    "credentialType": "VerifiedAdult",
    "arguments": {
      "minAge": 18
    }
  }
}
```

The issued JWT `credentialSubject` should contain:

```json
{
  "VerifiedAdult": {
    "minAge": 18
  }
}
```

The `credentialType` value is used as the key in `credentialSubject`, and the arguments become key-value entries under it.

### Example: age verification issuer

A compliant issuer for age verification would implement `prepare_credential` to check whether the user has a verified date of birth on record, and `get_credential` to return a signed JWT attesting `VerifiedAdult` with `minAge: 18`.

For complete Rust implementations of all four API endpoints, see the [vc-playground issuer example](https://github.com/dfinity/vc-playground/blob/main/issuer/src/main.rs). This is the primary reference implementation. The four endpoints above require careful handling of canister signatures and certified data, and the reference implementation shows the complete pattern including error handling and Candid interface definitions.

<!-- Needs human verification: exact Rust function signatures for all four issuer endpoints — vc-playground is not in .sources/ so code cannot be verified inline -->

## Implementing a relying party

A relying party requests credentials from issuers through Internet Identity. The relying party must:

1. Open an II window and initiate the VC flow.
2. Request the credential.
3. Receive and verify the returned verifiable presentation.

### Using the JavaScript SDK

The [@dfinity/verifiable-credentials](https://www.npmjs.com/package/@dfinity/verifiable-credentials) package handles the window messaging protocol for you. This is a dedicated VC package: it is separate from the `@icp-sdk/*` family used for general authentication.

```javascript
import { requestVerifiablePresentation } from "@dfinity/verifiable-credentials/request-verifiable-presentation";

requestVerifiablePresentation({
  onSuccess: async (verifiablePresentation) => {
    // verifiablePresentation is a JWT string: validate it before trusting it
    console.log("Received VP:", verifiablePresentation);
  },
  onError(err) {
    console.error("VC flow failed:", err);
  },
  issuerData: {
    origin: "https://employment-info.com",
    canisterId: "rwlgt-iiaaa-aaaaa-aaaaa-cai",
  },
  credentialData: {
    credentialSpec: {
      credentialType: "VerifiedEmployee",
      arguments: {
        employerName: "XYZ Ltd.",
      },
    },
    credentialSubject: userPrincipal, // the user's principal at the relying party
  },
  identityProvider: new URL("https://id.ai"),
  derivationOrigin: undefined, // set if your RP uses alternative derivation origins
});
```

The SDK:

- Opens a new II window.
- Waits for the `vc-flow-ready` message.
- Sends the `request_credential` JSON-RPC call.
- Calls `onSuccess` with the VP JWT on success, or `onError` if the user cancels or an error occurs.

**Note:** `onSuccess` fires when the VP is received: it does not mean the credential is valid. You must verify the VP before acting on it.

### Manual integration

If you prefer to implement the window message protocol yourself, the three steps are:

**Step 1: Open the II window**

Open a window to the identity provider's `/vc-flow` path:

```javascript
const iiWindow = window.open("https://id.ai/vc-flow");
```

Wait for the `vc-flow-ready` postMessage from II before sending a request.

**Step 2: Send the credential request**

Send a JSON-RPC `request_credential` message:

```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "method": "request_credential",
  "params": {
    "issuer": {
      "origin": "https://employment-info.com",
      "canisterId": "rwlgt-iiaaa-aaaaa-aaaaa-cai"
    },
    "credentialSpec": {
      "credentialType": "VerifiedEmployee",
      "arguments": {
        "employerName": "XYZ Ltd."
      }
    },
    "credentialSubject": "2mdal-aedsb-hlpnv-qu3zl-ae6on-72bt5-fwha5-xzs74-5dkaz-dfywi-aqe"
  }
}
```

Parameters:

| Field | Required | Description |
|-------|----------|-------------|
| `issuer.origin` | Yes | The origin URL of the issuer service |
| `issuer.canisterId` | No | The issuer canister ID (optional, helps II locate the issuer) |
| `credentialSpec.credentialType` | Yes | The type of credential being requested |
| `credentialSpec.arguments` | No | Credential-specific arguments (e.g., `minAge`) |
| `credentialSubject` | Yes | The user's principal at the relying party |
| `derivationOrigin` | No | Alternative derivation origin for the RP's principal |

**Step 3: Receive and handle the response**

On success, II returns:

```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "result": {
    "verifiablePresentation": "eyJQ..."
  }
}
```

On failure:

```json
{
  "id": 1,
  "jsonrpc": "2.0",
  "error": {
    "version": "1",
    "code": "UNKNOWN"
  }
}
```

Errors intentionally provide no details about the failure reason (to protect user privacy). Handle both success and error cases, and treat the user closing the II window as an error.

### Verifying the verifiable presentation

The `verifiablePresentation` value is a JWT. Do not trust it without verification.

#### Credential structure

The VP is a JWT with no signature in the outer layer. Decoded, it contains:

```json
{
  "iss": "<relying-party-principal-or-ii>",
  "vp": {
    "@context": "https://www.w3.org/2018/credentials/v1",
    "type": "VerifiablePresentation",
    "verifiableCredential": [
      "<id-alias-credential-jwt>",
      "<issued-credential-jwt>"
    ]
  }
}
```

The `verifiableCredential` array always contains exactly two JWTs in this order:

1. **id-alias credential**: signed by Internet Identity. Proves that the relying party's user principal maps to the `id_alias`.
2. **Issued credential**: signed by the issuer. The subject is the `id_alias`.

**id-alias credential decoded:**

```json
{
  "iss": "https://identity.internetcomputer.org/",
  "sub": "<relying-party-user-principal>",
  "vc": {
    "type": ["VerifiableCredential", "InternetIdentityIdAlias"],
    "credentialSubject": {
      "InternetIdentityIdAlias": {
        "hasIdAlias": "<id-alias>",
        "derivationOrigin": "<derivation-origin>"
      }
    }
  }
}
```

**Issued credential decoded:**

```json
{
  "iss": "<issuer-origin>",
  "sub": "<did-id-alias>",
  "vc": {
    "type": ["VerifiableCredential", "<credential-type>"],
    "credentialSubject": {
      "<credential-type>": {
        "<argument-key>": "<argument-value>"
      }
    }
  }
}
```

#### Cryptographic verification

Both credentials are signed using [canister signatures](../../references/ic-interface-spec/index.md#canister-signatures). To verify them:

1. Decode the outer VP JWT.
2. Extract the two inner JWTs from `vp.verifiableCredential`.
3. Verify the id-alias credential signature against II's canister signature.
4. Verify the issued credential signature against the issuer's canister signature.

See the [vc_util library in the Internet Identity repository](https://github.com/dfinity/internet-identity/blob/main/src/vc_util/src/lib.rs) for a reference implementation of canister signature verification.

#### Semantic verification

After verifying the signatures, check the following:

From the **id-alias credential**:
- `iss` is `https://identity.internetcomputer.org/` (the expected II canister). <!-- Needs human verification: the portal spec uses this value; verify against the live vc-spec if II now issues credentials with `https://id.ai/` as the issuer instead -->
- `sub` contains the user's principal at the relying party.
- Credential type is `InternetIdentityIdAlias`.
- `derivationOrigin` matches the derivation origin used when logging into the relying party.

From the **issued credential**:
- `vc.type` includes the credential type you requested.
- The first field in `vc.credentialSubject` matches `vc.type[1]` (the credential type).
- The arguments in `vc.credentialSubject.<credential-type>` match what was requested.

Cross-credential check:
- The `sub` of the issued credential matches `vc.credentialSubject.InternetIdentityIdAlias.hasIdAlias` from the id-alias credential. Note that this `sub` value uses the `did:` URI scheme (for example, `did:ic:...`): it is not a bare principal text. Compare the full DID string, not just the principal portion.

This chain confirms that the issuer attested the claim for the same `id_alias` that II linked to your user's principal.

See the [demo relying party implementation](https://github.com/dfinity/vc-playground/blob/main/rp/src/main.rs) for a complete example.

## Testing

### Live demo environment

A demo relying party is deployed on ICP for testing:
[https://l7rua-raaaa-aaaap-ahh6a-cai.icp0.io/](https://l7rua-raaaa-aaaap-ahh6a-cai.icp0.io/)

Use the II staging instance to avoid using real user credentials:
[https://fgte5-ciaaa-aaaad-aaatq-cai.ic0.app/](https://fgte5-ciaaa-aaaad-aaatq-cai.ic0.app/)

A demo issuer is deployed that will issue any requested credential. Explore the issuer canister on the [NNS dashboard](https://dashboard.internetcomputer.org/canister/qdiif-2iaaa-aaaap-ahjaq-cai) or browse its implementation in the [vc-playground repository](https://github.com/dfinity/vc-playground).

### Local development

Run Internet Identity locally by setting `ii: true` in your `icp.yaml`:

```yaml
networks:
  - name: local
    mode: managed
    ii: true
```

The II frontend will be available at `http://id.ai.localhost:8000`. Point your `identityProvider` at this URL during local development.

## Privacy properties

The VC protocol provides the following privacy guarantees:

- **Unlinkability**: The issuer learns the user's `id_alias`, not their principal at the relying party. The relying party learns the `id_alias`, not the user's principal at the issuer. Neither party can correlate the user's identity across both services.
- **User consent**: No credential is issued without the user explicitly approving the consent dialog shown by Internet Identity.
- **Opaque errors**: Error responses from II do not reveal why a credential request failed, preventing information leakage about the user's status at the issuer.

## Next steps

- Read the [VC specification](https://github.com/dfinity/internet-identity/blob/main/docs/vc-spec.md) for the full protocol details.
- Explore the [verifiable credentials playground](https://github.com/dfinity/vc-playground) for issuer and relying party reference implementations.
- Review [Internet Identity integration](internet-identity.md) for authentication setup.
- See the [Internet Identity specification](../../references/internet-identity-spec.md) for alternative derivation origins and canister signature details.

<!-- Upstream: informed by dfinity/portal docs/building-apps/network-features/verifiable-credentials/ (overview.mdx, how-it-works.mdx, issuer.mdx, relying-party.mdx); dfinity/icskills skills/internet-identity/SKILL.md -->
