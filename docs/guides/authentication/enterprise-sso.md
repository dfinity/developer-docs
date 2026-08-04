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

### How long a sign-in lasts

Add `"session_max_age_seconds"` to cap how long a sign-in stays valid. Once that much time has passed since a member of staff authenticated, they authenticate against your IdP again:

```json
{
  "client_id": "0oaDEFAULT",
  "openid_configuration": "https://acme.okta.com/.well-known/openid-configuration",
  "session_max_age_seconds": 28800
}
```

Eight hours (`28800`) covers a working day, so staff re-authenticate at most daily. The ceiling is 30 days (`2592000`).

Applications choose their own session length as well, and this value caps it: an application asking for 30 days on a domain that allows eight hours gets eight hours. Leave the field out and the application's own choice applies.

## 3. Gate access per app (optional)

By default your staff can sign in to any Internet Computer application with the client from step 1, and your provider's assignment rules for that client apply everywhere. To govern one application on its own, give it a client of its own.

Repeat these three steps for each application you want to gate.

<!-- Needs human verification: the provider-specific settings in this section are not verifiable from ICP sources -->

**a. Add a client for the app.** Register a second OIDC client, identical settings to step 1. Copy its `client_id`, for example `0oaPAYROLL`.

**b. Assign who is allowed.** That client → **Assignments** → add the groups or users. This assignment is the access rule: assigned staff sign in as normal, anyone else is stopped by your IdP. On Entra ID, set **Assignment required** to **Yes** on the client as well. It defaults to **No**, which leaves the app open to your whole tenant.

**c. Map the app to it.** Add one `app_clients` line to the file from step 2, keyed by the application's origin:

```json
"app_clients": {
  "https://payroll.acme.com": "0oaPAYROLL"
}
```

### Applications you have not listed

By default, an application missing from `app_clients` falls back to the organization's client from step 1, so staff can sign in to it like any other. Set `"gate_all_apps": true` to refuse those sign-ins instead, and staff visiting an unlisted application are told your organization has not granted it access.

Use `true` when the list is meant to be exhaustive, so a new application cannot be signed in to until you have added it deliberately.

### Providers that issue a per-client subject

This applies only once an application has a client of its own.

Some providers, Entra ID among them, issue a different `sub` for the same person in each OIDC client. Sign-ins through the per-app client would then look like a different person from sign-ins through the organization's client. Set `"stable_identifier_claim"` to a claim that stays the same across your clients: on Entra ID that is `oid`.

It defaults to `sub`, which is correct when your provider's `sub` is already the same in every client.

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

Every field, with the optional ones filled in:

```json
{
  "client_id": "0oaDEFAULT",
  "openid_configuration": "https://acme.okta.com/.well-known/openid-configuration",
  "name": "Acme Corp",
  "session_max_age_seconds": 28800,
  "app_clients": {
    "https://payroll.acme.com": "0oaPAYROLL",
    "https://board.acme.com": "0oaBOARD"
  },
  "gate_all_apps": false,
  "stable_identifier_claim": "sub"
}
```

`client_id` and `openid_configuration` are required. The rest are optional:

| Field | Default | Purpose |
|-------|---------|---------|
| `name` | the domain | Label shown on the sign-in screen |
| `session_max_age_seconds` | unset | How long a sign-in stays valid before staff authenticate again |
| `app_clients` | none | Maps an application's origin, or a salted hash of it, to the client that governs it |
| `gate_all_apps` | `false` | Refuse applications that are not listed in `app_clients` |
| `stable_identifier_claim` | `sub` | The claim that identifies the same person across your clients |

## Next steps

- [Internet Identity](internet-identity.md): how applications send users into this flow.
- [`@icp-sdk/auth` reference](https://js.icp.build): the client library applications use to start it.

<!-- Upstream: informed by internet-identity src/internet_identity/src/openid/sso.rs -->
