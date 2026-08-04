---
title: "Single sign-on"
description: "Connect your company SSO to Internet Computer applications: register an OIDC client, publish one file on your domain, and optionally gate access app by app."
sidebar:
  order: 2
---

Internet Identity can authenticate your staff against your company's OpenID Connect provider. Set up once for everyone, then control access app by app.

This guide is for the SSO administrator. If you are building an application, see [Internet Identity](internet-identity.md).

1. Register an OIDC client in your IdP.
2. Publish one file on your domain.
3. Gate each app (optional).

## Switch on SSO for the organization

Required, one time.

### 1. Register an OIDC client

Create App Integration → **OIDC** → **Web Application**.

| Setting | Value |
|---------|-------|
| Redirect URI | `https://id.ai/callback` |
| Grant types | Authorization Code and Implicit (hybrid) |
| ID token | Allow ID Token with implicit grant |
| Access token | Leave Access Token unchecked |
| Scopes | `openid`, `profile`, `email` |

Copy down the `client_id`, for example `0oaDEFAULT`.

### 2. Publish the discovery file

Serve it over HTTPS at exactly this path:

```
https://acme.com/.well-known/ii-openid-configuration
```

- `client_id`: the client from step 1.
- `openid_configuration`: your IdP's OIDC discovery URL.
- `name`: optional label on the sign-in screen.

Serve it with `Access-Control-Allow-Origin: *` so applications can check the domain before sending a user into the flow.

Done. On **id.ai** staff choose **Sign in with SSO**, enter **acme.com** as their company domain, then authenticate against your IdP.

## Control access per application

Optional, repeat per app.

**a. Add a client for the app.** Register a second OIDC client, identical settings to step 1. Copy its `client_id`, for example `0oaPAYROLL`.

**b. Assign who is allowed.** That client → **Assignments** → add the groups or users. This assignment is the access rule: assigned staff sign in as normal, anyone else is stopped by your IdP.

**c. Map the app to it.** Add one `app_clients` line to the file from step 2. Repeat for each app you want to gate.

<!-- Needs human verification: identity-provider-specific settings are not verifiable from ICP sources -->

:::note[Entra ID]
Set **Assignment required** to **Yes**. It defaults to **No**, which opens the app to your whole tenant.
:::

## The complete file

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

`client_id`, `openid_configuration`, and `name` switch on SSO for the organization. The rest is per-app access control. On Entra ID, set `stable_identifier_claim` to `oid`.

### Hiding an app name

The file is public, so listed origins are visible. Run these lines with `origin` set to the app's URL. The printed value is its `app_clients` key.

```bash
origin=https://payroll.acme.com
salt=$(openssl rand -hex 8)
data=$origin$salt
out=$(printf %s "$data" | openssl dgst -sha256 -r)
hash=$(echo $out | cut -d' ' -f1)
echo "$hash:$salt"
```

### Denying unlisted apps

`gate_all_apps: true` refuses any app not listed.

## Next steps

- [Internet Identity](internet-identity.md): how applications send users into this flow.
- [Verifiable credentials](verifiable-credentials.md): issue signed attestations about users from a canister.

<!-- Upstream: informed by internet-identity src/internet_identity/src/openid/sso.rs -->
