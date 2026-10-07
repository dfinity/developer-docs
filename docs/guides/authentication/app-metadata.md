---
title: "App metadata"
description: "Show your app's name, description, and logo on the Internet Identity sign-in screen by publishing /.well-known/ii-app-metadata."
sidebar:
  order: 2
---

By default, the Internet Identity sign-in screens identify your app by its origin alone. To have them also show a name, a short description, and a logo, publish a JSON document at `/.well-known/ii-app-metadata`. Any app can publish one: there is no list to join and no approval step.

## Publish the document

```json
{
  "name": "Example App",
  "description": "A short tagline shown on the sign-in screen",
  "logo": "/logo.png",
  "privacyPolicyUrl": "/privacy",
  "termsOfServiceUrl": "https://legal.example.com/terms"
}
```

Every field is optional, and unknown fields are ignored, so a document stays valid as fields are added. In short:

- `name` is at most 40 characters and `description` at most 120.
- `logo` is a raster image (PNG, JPEG, WebP, GIF, or AVIF; not SVG) on the same origin as the document. Write it as a relative URL, since II may read the document from any of your canister's gateway domains. A roughly square image of about 512 pixels works well.
- `privacyPolicyUrl` and `termsOfServiceUrl` are `https` links, on any origin, shown on the screen where a user connects an MCP client to your app.
- One field that fails validation invalidates the **whole document**, so none of it is shown. II logs which field is at fault to the browser console on the sign-in screen.

The complete rules, including a JSON Schema to validate your document against, are in [App metadata](../../references/internet-identity-spec.md#app-metadata) in the Internet Identity specification.

## Publish it on the right origin

II reads the document from the origin your users' identities are derived for: your `derivationOrigin` when you set one (see [Shared sessions across subdomains](shared-sessions.md#use-one-derivation-origin)), and the origin the sign-in came from otherwise. Publish it once on that origin; every alternative origin it lists is shown with the same name, description, and logo.

## Serve it with CORS

II reads both the document and the logo cross-origin, so both need an `Access-Control-Allow-Origin` header, and the document, which has no file extension, needs its content type set.

On a [static site](../frontends/static-site/overview.md), `.well-known/` is uploaded automatically; declare the headers in a `_headers` file at the root of your build directory:

```text
/.well-known/ii-app-metadata
  Content-Type: application/json
  Access-Control-Allow-Origin: *

/logo.png
  Access-Control-Allow-Origin: *
```

On the [legacy asset canister](../frontends/asset-canister.md), un-ignore the directory and set the headers in `.ic-assets.json5`:

```json
[
  {
    "match": ".well-known",
    "ignore": false
  },
  {
    "match": ".well-known/ii-app-metadata",
    "headers": {
      "Access-Control-Allow-Origin": "*",
      "Content-Type": "application/json"
    },
    "ignore": false
  },
  {
    "match": "logo.png",
    "headers": {
      "Access-Control-Allow-Origin": "*"
    }
  }
]
```

A missing, unreachable, or invalid document never blocks sign-in: the screens fall back to the curated entry II still ships for a small list of apps, and to showing your origin otherwise. A logo that cannot be fetched costs you the logo alone; the name and description still show.

The metadata is exactly as trustworthy as the origin serving it, so II keeps showing your origin next to it: the origin is what users can actually check.

## Next steps

- [Getting started](internet-identity.md): add sign-in to your frontend.
- [Shared sessions across subdomains](shared-sessions.md): serve one app from several origins with one set of metadata.
