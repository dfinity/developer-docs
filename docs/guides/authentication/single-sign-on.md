---
title: "Single sign-on"
description: "Connect your organization's OpenID provider to Internet Identity so staff sign in to ICP applications with their company account, and control access per application."
sidebar:
  order: 2
---

Internet Identity can authenticate your staff against your own OpenID Connect provider (Okta, Entra ID, Google Workspace, Auth0, Keycloak, or any other OIDC-compliant IdP). Staff enter your company domain on the Internet Identity sign-in screen and authenticate with their existing company account.

This guide is for the administrator of the identity provider. Two steps switch it on for the whole organization, and an optional third step controls access application by application. No registration with Internet Identity is required: it discovers your configuration from a file you publish on your domain.

If you are building an application and want to send users into this flow, see [Internet Identity](internet-identity.md).

## How it works

1. A user picks **Continue with SSO** on the Internet Identity sign-in screen and enters your company domain, for example `acme.com`.
2. Internet Identity fetches `https://acme.com/.well-known/ii-openid-configuration` and reads the OIDC client to use.
3. It follows the `openid_configuration` URL in that file to your provider's standard OIDC discovery document, which supplies the issuer, the authorization endpoint, and the signing keys.
4. The user authenticates with your provider. Your provider returns an ID token.
5. Internet Identity verifies that token against your provider's published keys and issues the user a delegation for the application they are signing in to.

Verification happens onchain, in the Internet Identity canister. Your provider's signing keys are fetched by the network, not by the user's browser, and the token never has to be trusted by the application.

## Step 1: Register an OIDC client

In your identity provider, create an application integration of type **OIDC / Web application**, configured as follows.

| Setting | Value |
|---------|-------|
| Redirect URI | `https://id.ai/callback` |
| Grant types | Authorization code **and** implicit (the hybrid flow) |
| ID token | Allowed with the implicit grant |
| Access token | Not required. Leave it unchecked |
| Scopes | `openid`, `profile`, `email` |

Internet Identity uses `response_type=code id_token` with `response_mode=form_post`, and verifies the ID token in the canister. There is no token-endpoint exchange, so a client restricted to the authorization-code flow alone cannot be used. A client that does not allow an ID token with the implicit grant produces an `unsupported_response_type` error on the sign-in screen.

Copy the client ID when you are done. You need it in step 2.

## Step 2: Publish the discovery file

Serve the following document over HTTPS at exactly this path on your company domain:

```
https://acme.com/.well-known/ii-openid-configuration
```

```json
{
  "client_id": "0oaDEFAULT",
  "openid_configuration": "https://acme.okta.com/.well-known/openid-configuration",
  "name": "Acme Corp"
}
```

| Field | Required | Meaning |
|-------|----------|---------|
| `client_id` | Yes | The client from step 1. Every ID token's `aud` claim must match it |
| `openid_configuration` | Yes | Your provider's OIDC discovery URL. Must be `https` |
| `name` | No | Label shown on the sign-in screen and on consent prompts. Falls back to the domain. Maximum 255 bytes |
| `app_clients` | No | Per-application access control. See step 3 |
| `gate_all_apps` | No | Deny applications not listed in `app_clients`. Defaults to `false` |
| `stable_identifier_claim` | No | Claim used as the stable user identifier. Defaults to `sub` |

Serve it with `Access-Control-Allow-Origin: *`. The document is public and unauthenticated, and applications validate a domain from the browser before sending the user into the flow.

Two constraints apply to the document your `openid_configuration` URL points at, both enforced by Internet Identity:

- The `issuer` it declares must be on the same host as the `openid_configuration` URL itself.
- Its `authorization_endpoint` must be on the same host as the `issuer`.

Both are standard OIDC self-assertion checks. They stop a tampered discovery document from redirecting your staff to an unrelated provider. Your company domain itself may differ from the provider's host, which is what allows `acme.com` to point at `acme.okta.com`.

That is the whole setup. Staff can now sign in with `acme.com` as their company domain.

### Changes take up to an hour

Internet Identity caches a resolved configuration for one hour, and keeps serving the last known good copy for a further hour if a refresh fails. Plan client or endpoint changes accordingly: publish the new file, then allow an hour before retiring the old client.

## Step 3: Control access per application

By default, any ICP application a user visits can be signed in to with your organization's primary client, and your provider's assignment rules for that client apply to all of them.

To govern one application separately, give it its own OIDC client and map it in the file:

1. Register a second OIDC client with the same settings as step 1. Copy its client ID.
2. In your provider, assign the groups or users allowed to use that client. This assignment is the access rule: assigned staff sign in normally, everyone else is stopped by your provider.
3. Add the application's origin to `app_clients`:

```json
{
  "client_id": "0oaDEFAULT",
  "openid_configuration": "https://acme.okta.com/.well-known/openid-configuration",
  "name": "Acme Corp",
  "app_clients": {
    "https://payroll.acme.com": "0oaPAYROLL",
    "https://board.acme.com": "0oaBOARD"
  },
  "gate_all_apps": false,
  "stable_identifier_claim": "sub"
}
```

Repeat for each application you want to govern separately. The map holds at most 100 entries, and a map over that limit is rejected outright rather than truncated.

Set `gate_all_apps` to `true` to refuse any application that is not listed. Staff visiting an unlisted application then see a message telling them your organization has not granted that application access.

<!-- Needs human verification: the identity-provider-specific settings below are not verifiable from ICP sources -->

:::note[Entra ID]
Set **Assignment required** to **Yes** on the per-application client. It defaults to **No**, which leaves the application open to your whole tenant. Entra ID also issues a tenant-stable identifier as `oid` rather than `sub`, so set `"stable_identifier_claim": "oid"`.
:::

### Keeping application names private

The discovery file is public, so any origin listed in `app_clients` is visible to anyone who reads it. To map an application without naming it, use a salted hash of the origin as the key instead:

```bash
origin=https://payroll.acme.com
salt=$(openssl rand -hex 8)
hash=$(printf %s "$origin$salt" | openssl dgst -sha256 -r | cut -d' ' -f1)
echo "$hash:$salt"
```

Use the printed `<hash>:<salt>` value as the key:

```json
"app_clients": {
  "3f2a…c81:9f86d081884c7d65": "0oaPAYROLL"
}
```

Internet Identity treats any key of the form `<hex>:<hex>` as a hashed origin and matches it by recomputing `sha256(origin + salt)`. Anything else is compared as a cleartext origin, so the two forms can be mixed in one file.

## What applications receive

After a successful sign-in, the application receives a delegation, exactly as with any other Internet Identity sign-in. The user gets a different principal per application origin, so applications cannot correlate the same member of staff across services.

Applications may also request identity attributes, which arrive signed by the canister and scoped to your domain, as `sso:acme.com:name` and `sso:acme.com:email`. The user is asked to consent to sharing them.

`verified_email` is not available for SSO sign-ins. Internet Identity only marks an address as verified when it established that the user has access to it, either by verifying the address itself or through a claim scheme built in for a specific provider. It has no basis to make that claim about an address asserted by another organization's provider, so the attribute is not offered.

## Troubleshooting

Staff see these messages on the Internet Identity sign-in screen. Each points at a specific piece of the setup.

| Message | Cause |
|---------|-------|
| "Couldn't load SSO settings from `acme.com`" | The discovery file is unreachable, is not valid JSON, is missing `client_id` or `openid_configuration`, or the second-hop document failed a host check. Internet Identity retries for 30 seconds before reporting this |
| "Your organization hasn't granted this app access via `acme.com`" | `gate_all_apps` is `true` and the application's origin is not in `app_clients` |
| "`acme.com`'s SSO app doesn't allow the hybrid OAuth flow" | The client from step 1 does not permit `response_type=id_token code`. Enable the implicit grant and ID tokens |
| "`acme.com`'s SSO denied the sign-in" | Your provider rejected the user, usually because they are not assigned to the client |

To check the setup yourself, fetch both documents in the order Internet Identity does:

```bash
curl https://acme.com/.well-known/ii-openid-configuration
curl https://acme.okta.com/.well-known/openid-configuration
```

The first must return your client ID and the discovery URL. The second must return an `issuer`, a `jwks_uri`, and an `authorization_endpoint`, all on the host that serves it.

## Next steps

- [Internet Identity](internet-identity.md): how applications integrate the sign-in flow, including sending users straight to your SSO.
- [Verifiable credentials](verifiable-credentials.md): issue signed attestations about users from a canister.

<!-- Upstream: informed by internet-identity src/internet_identity/src/openid/sso.rs -->
