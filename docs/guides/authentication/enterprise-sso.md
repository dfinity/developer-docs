---
title: "Enterprise SSO"
description: "Connect your company's OpenID Connect provider to Internet Computer applications: register an OIDC client, publish one file on your domain, and optionally gate access app by app."
sidebar:
  order: 5
---

Internet Identity can authenticate your staff against your company's existing OpenID Connect provider, such as Okta, Entra ID, Google Workspace, or Auth0. Staff enter your company domain on the sign-in screen and authenticate with the account they already have.

Setup takes two required steps, one OIDC client and one file on your domain, plus an optional third that controls access app by app. Nothing has to be registered with Internet Identity: it discovers your configuration from that file.

This guide is for the SSO administrator. If you are building an application, see [One-click sign-in](one-click-sign-in.md#sign-in-with-an-organizations-sso).

## 1. Register an OIDC client

In your identity provider, register an **OIDC web application** (in Okta: Create App Integration → OIDC → Web Application) with these settings:

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

`openid_configuration` must be an `https` URL, and your IdP's issuer and authorization endpoint must be on the same host as it. Internet Identity fetches the file itself, so it needs no CORS header.

That is the whole setup. On **id.ai**, staff choose **Sign in with SSO**, enter **acme.com** as their company domain, then authenticate against your IdP. The domain is entered bare, such as `acme.com`: `https://acme.com`, `acme.com/`, and `acme.com/sso` are not domains.

### How long a sign-in lasts

A sign-in stays valid for eight hours. Once that much time has passed since a member of staff authenticated, they authenticate against your IdP again. Set `"session_max_age_seconds"` to choose a different length:

```json
{
  "client_id": "0oaDEFAULT",
  "openid_configuration": "https://acme.okta.com/.well-known/openid-configuration",
  "session_max_age_seconds": 28800
}
```

The default of eight hours (`28800`) covers a working day, so staff re-authenticate at most daily. The maximum is 30 days (`2592000`): a value of `0` or above the maximum is not clamped, it makes Internet Identity reject the whole file (see [Limits](#limits)).

Applications choose their own session length as well, and this value caps it: an application asking for 30 days on a domain that allows eight hours gets eight hours.

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

The key must be the application's exact origin: scheme, host, and port if any, with no path and no trailing slash. A key that does not match exactly is never used, and that application silently falls back to the organization's client.

### Applications you have not listed

By default, an application missing from `app_clients` falls back to the organization's client from step 1, so staff can sign in to it like any other. Set `"gate_all_apps": true` to refuse those sign-ins instead, and staff visiting an unlisted application are told your organization has not granted it access.

Use `true` when the list is meant to be exhaustive, so a new application cannot be signed in to until you have added it deliberately.

### Providers that issue a per-client subject

This applies only once an application has a client of its own.

Some providers, Entra ID among them, issue a different `sub` for the same person in each OIDC client. Sign-ins through the per-app client would then look like a different person from sign-ins through the organization's client. Set `"stable_identifier_claim"` to a claim that stays the same across your clients: on Entra ID that is `oid`.

It defaults to `sub`, which is correct when your provider's `sub` is already the same in every client.

Choose it before staff sign in through per-app clients. Internet Identity recognizes a person across your clients by the value of this claim, so changing it later means sign-ins through per-app clients no longer match the people they matched before.
<!-- Needs human verification: the user-visible effect of changing stable_identifier_claim on a domain already in use (inferred from the stable-id index in internet-identity storage/storable/sso_stable_id_key.rs). -->

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
| `session_max_age_seconds` | `28800` (eight hours) | How long a sign-in stays valid before staff authenticate again |
| `app_clients` | none | Maps an application's origin, or a salted hash of it, to the client that governs it |
| `gate_all_apps` | `false` | Refuse applications that are not listed in `app_clients` |
| `stable_identifier_claim` | `sub` | The claim that identifies the same person across your clients |

## Limits

Internet Identity checks the whole file, and a value outside these limits rejects **the whole file**, not just that field. While it is rejected, staff cannot sign in through your domain at all.

| What | Limit |
|------|-------|
| The file, as served | At most 64 KiB |
| `client_id`, `name`, `stable_identifier_claim` | At most 255 bytes each |
| `session_max_age_seconds` | More than `0` and at most `2592000` (30 days) |
| `app_clients` | At most 100 entries |
| An `app_clients` key or client ID | At most 255 bytes each |
| All `app_clients` keys and client IDs together | At most 16 KiB |

Your IdP's own discovery document is checked the same way: at most 64 KiB, with `issuer`, `jwks_uri`, and `authorization_endpoint` at most 255 bytes each.

## When changes take effect

Internet Identity caches your file and the discovery document it points to. A cached copy is fresh for an hour; after that, the next sign-in through your domain, or an application checking the domain, fetches it again. That sign-in, and any that arrive while the fetch runs, still use the copy that was cached, which after a quiet period can be up to seven days old; every sign-in after the fetch uses your current file.

- **To stop new sign-ins to an application at once**, remove the people or groups from that application's client in your IdP: your IdP enforces its assignments on every sign-in, while a change to `app_clients` or `gate_all_apps` applies only from the next fetch. Sessions already established last until they end, at most `session_max_age_seconds` after the sign-in.
- **If your file becomes unreachable or invalid**, Internet Identity keeps using the last good copy until it is two hours old (an hour past fresh), or drops it at once if it is older, and then refuses sign-ins through your domain until the file is fixed. After a failed fetch it waits before trying again, starting at one minute and doubling each time.

## Next steps

- [One-click sign-in](one-click-sign-in.md#sign-in-with-an-organizations-sso): how applications send staff into this flow.
- [Identity attributes](identity-attributes.md#scoped-keys): the `sso:` attributes your staff can share with applications.

<!-- Upstream: informed by internet-identity src/internet_identity/src/openid/sso.rs -->
