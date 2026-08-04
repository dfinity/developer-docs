---
title: "Enterprise SSO"
description: "Connect your company's OpenID Connect provider to Internet Computer applications: register an OIDC client, publish one file on your domain, and optionally gate access app by app."
sidebar:
  order: 2
---

Internet Identity can authenticate your staff against your company's existing OpenID Connect provider, such as Okta, Entra ID, Google Workspace, or Auth0. Staff enter your company domain on the sign-in screen and authenticate with the account they already have.

Setup is two steps and takes one OIDC client and one file on your domain. Nothing has to be registered with Internet Identity: it discovers your configuration from that file. A third, optional step controls access app by app.

This guide is for the SSO administrator. If you are building an application, see [Internet Identity](internet-identity.md).

## 1. Register an OIDC client

In your identity provider, create App Integration → **OIDC** → **Web Application**.

| Setting | Value |
|---------|-------|
| Redirect URI | `https://id.ai/callback` |
| Grant types | Authorization Code and Implicit (hybrid) |
| ID token | Allow ID Token with implicit grant |
| Access token | Leave Access Token unchecked |
| Scopes | `openid`, `profile`, `email` |

Copy down the `client_id`, for example `0oaDEFAULT`. You need it in step 2.

## 2. Publish the discovery file

Serve a file over HTTPS at exactly this path on your company domain:

```text
https://acme.com/.well-known/ii-openid-configuration
```

```json
{
  "client_id": "0oaDEFAULT",
  "openid_configuration": "https://acme.okta.com/.well-known/openid-configuration",
  "name": "Acme Corp"
}
```

| Field | Value |
|-------|-------|
| `client_id` | The client from step 1 |
| `openid_configuration` | Your IdP's OIDC discovery URL |
| `name` | Optional label on the sign-in screen |

Serve it with `Access-Control-Allow-Origin: *` so applications can check the domain before sending a user into the flow.

That is the whole setup. On **id.ai**, staff choose **Sign in with SSO**, enter **acme.com** as their company domain, then authenticate against your IdP.

## 3. Gate access per app (optional)

By default your staff can sign in to any Internet Computer application with the client from step 1, and your provider's assignment rules for that client apply everywhere. To govern one application on its own, give it a client of its own.

Repeat these three steps for each application you want to gate.

**a. Add a client for the app.** Register a second OIDC client, identical settings to step 1. Copy its `client_id`, for example `0oaPAYROLL`.

**b. Assign who is allowed.** That client → **Assignments** → add the groups or users. This assignment is the access rule: assigned staff sign in as normal, anyone else is stopped by your IdP.

**c. Map the app to it.** Add one `app_clients` line to the file from step 2, keyed by the application's origin:

```json
"app_clients": {
  "https://payroll.acme.com": "0oaPAYROLL"
}
```

To refuse any application that is not listed, add `"gate_all_apps": true`.

Some providers issue a different `sub` for the same person in each OIDC client. Where that is the case, sign-ins through a per-app client would look like a different person, so name a claim that stays stable across your clients with `"stable_identifier_claim"`. It defaults to `sub`, which is correct when your provider's `sub` is already the same in every client.

<!-- Needs human verification: identity-provider-specific settings are not verifiable from ICP sources -->

:::note[Entra ID]
Set **Assignment required** to **Yes**. It defaults to **No**, which opens the app to your whole tenant. Entra ID also identifies users by `oid` rather than `sub`, so add `"stable_identifier_claim": "oid"` to the file.
:::

### Hiding an app name

The file is public, so any origin you list is visible to anyone who reads it. To map an application without naming it, use a salted hash of its origin as the key instead of the origin itself.

Run this in a shell, with `origin` set to the application's URL:

```bash
origin=https://payroll.acme.com
salt=$(openssl rand -hex 8)
data=$origin$salt
out=$(printf %s "$data" | openssl dgst -sha256 -r)
hash=$(echo $out | cut -d' ' -f1)
echo "$hash:$salt"
```

It prints one value, in the form `<hash>:<salt>`. Use it as the key in place of the origin:

```json
"app_clients": {
  "9c8dbbd738e2e390267c7dd7350623c541907a66a1f064e22c13d954e08322af:9f86d081884c7d65": "0oaPAYROLL"
}
```

Internet Identity matches the key by hashing the origin of whichever application the user is signing in to, so cleartext and hashed keys can be mixed in one file.

## The complete file

Every field, with the optional ones from step 3 filled in:

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

The first three fields switch on SSO for the organization. The rest control access per app:

| Field | Default | Purpose |
|-------|---------|---------|
| `app_clients` | none | Maps an application's origin, or a salted hash of it, to the client that governs it |
| `gate_all_apps` | `false` | Refuse applications that are not listed in `app_clients` |
| `stable_identifier_claim` | `sub` | The claim that identifies the same person across your clients |

## Next steps

- [Internet Identity](internet-identity.md): how applications send users into this flow.
- [`@icp-sdk/auth` reference](https://js.icp.build): the client library applications use to start it.

<!-- Upstream: informed by internet-identity src/internet_identity/src/openid/sso.rs -->
