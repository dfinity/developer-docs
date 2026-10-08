---
title: "Shared sessions across subdomains"
description: "Keep one Internet Identity principal across your origins, and share one sign-in across sibling subdomains such as chat.example.com and hr.example.com."
sidebar:
  order: 6
---

Internet Identity derives a principal per origin, so the same person is a different user on every origin your app is served from. This page first gives your origins one principal, then lets apps on sibling subdomains share one sign-in: sign in on one and the others are signed in too, sign out of one and the others follow.

## Use one derivation origin

To keep one principal across several origins, pick one of them as the **derivation origin** and have the others derive their principals from it. Pick the origin least likely to change, such as the canister's own `https://<canister-id>.icp.net` address rather than a custom domain, and pin it before the app has users: changing it later gives every existing user a new principal.

The official gateway domains (`icp.net`, `icp0.io`, and `ic0.app`) already produce the same principal for one canister, so they need none of this.

**1. Every other origin sets `derivationOrigin`.** The derivation origin itself does not set it:

```javascript
import { AuthClient } from "@icp-sdk/auth/client";

const authClient = new AuthClient({
  derivationOrigin: "https://<canister-id>.icp.net",
});
```

**2. The derivation origin lists the others.** Serve `/.well-known/ii-alternative-origins` on the derivation origin:

```json
{ "alternativeOrigins": ["https://www.example.com", "https://chat.example.com"] }
```

Entries are origins, with no paths and no trailing slashes. At most 100 are allowed, and a longer list is rejected as a whole, so every alternative origin stops signing in.

**3. Serve it as JSON with CORS.** Internet Identity reads the file cross-origin. On a [static site](../frontends/static-site/overview.md), `.well-known/` is uploaded automatically; declare the headers in a `_headers` file at the root of your build directory:

```text
/.well-known/ii-alternative-origins
  Content-Type: application/json
  Access-Control-Allow-Origin: *
```

The normative rules are in [Alternative frontend origins](../../references/internet-identity-spec.md#alternative-frontend-origins) in the Internet Identity specification.

## Share one sign-in across sibling subdomains

Apps on sibling subdomains of one domain, such as `chat.example.com` and `hr.example.com`, can share one sign-in. This builds on the section above: every app derives from the same derivation origin, or each has its own principal and there is nothing to share.

### Share the record

Every app builds its client with the same derivation origin and the same cookie domain, so a sign-in on one writes a record the others read. The record holds only the signed-in principal and when the session ends.

```javascript
import { AuthClient, CookieStateStorage, InteractionRequiredError } from "@icp-sdk/auth/client";

const clientOptions = {
  derivationOrigin: "https://auth.example.com",
  stateStorage: new CookieStateStorage({ domain: "example.com" }),
};
```

Choosing a cookie domain means trusting every origin under it, so do this only on a domain whose subdomains you all control.

### Pick up the sign-in on a `/reauth` route

An app whose status is `signed-in-elsewhere` holds no credential for the account its sibling signed in with. It asks Internet Identity for its own, silently, on a route of its own. That runs on page load without a user gesture, which a popup would be blocked for, so it uses the redirect transport:

```javascript
// Runs on the /reauth route.
async function reauth() {
  const status = new AuthClient(clientOptions).getStatus();
  if (status.state !== "signed-in-elsewhere") {
    location.replace("/");
    return;
  }

  // A second client: transport, prompt, and hint are fixed when a client is built.
  const authClient = new AuthClient({
    ...clientOptions,
    transport: "redirect",
    prompt: "none",
    hint: status.principal, // answer for the account already signed in
  });

  try {
    await authClient.signIn({
      returnTo: new URLSearchParams(location.search).get("next") ?? "/",
    });
  } catch (error) {
    if (error instanceof InteractionRequiredError) {
      // Nothing to pick up: the shared record is stale, so clear it.
      await authClient.signOut().catch(() => {});
    }
    location.replace("/");
  }
}

reauth();
```

Without `hint`, Internet Identity refuses when it holds more than one session rather than guessing, with an `InteractionRequiredError` whose `reason` is `account_selection_required`. A stale record that is not cleared sends the user back here on every page.

### Declare the callback

A redirect sign-in returns only to a callback the returning origin declares itself. Every app serves `/.well-known/ii-auth-callbacks` on its own origin, not once on the derivation origin, listing its own route:

```json
{ "callbacks": ["https://chat.example.com/reauth"] }
```

Each entry is matched exactly, so it is the full URL with no fragment. Serve the file like the alternative origins one, as `application/json` with `Access-Control-Allow-Origin: *`. An undeclared, unreadable, or mismatched callback means the sign-in never comes back. The route must also not redirect: the response arrives in the URL fragment, which a redirect carries along to wherever it forwards.

### Send every page there on load

Every page reads the status as it loads and hands `signed-in-elsewhere` to `/reauth` with the page to come back to. Every page, not only the ones that need a sign-in: otherwise a visitor already signed in on a sibling lands on a public page here and sees a signed-out header.

```javascript
const authClient = new AuthClient(clientOptions);
const status = authClient.getStatus();

// This state only: signed-out and expired need a normal sign-in.
if (status.state === "signed-in-elsewhere") {
  location.replace(`/reauth?next=${encodeURIComponent(location.pathname + location.search)}`);
}
```

### Offer it to an open page

Once a page is open, the status of that same client can still turn `signed-in-elsewhere` when someone signs in on a sibling in another tab. Redirecting a page the user is working on would lose their work, so offer the same redirect behind a button:

```javascript
authClient.subscribe(() => {
  if (authClient.getStatus().state === "signed-in-elsewhere") {
    showResumeDialog(() =>
      location.replace(`/reauth?next=${encodeURIComponent(location.pathname + location.search)}`),
    );
  }
});
```

## When a shared session ends

- **Idleness.** Pass `maxTimeToIdle` (nanoseconds) to `signIn()` to end the session after that long without use in any of the apps. Internet Identity enforces it, so it holds across tabs whether or not any is open; without it, Internet Identity applies seven days.
- **Signing out.** `signOut()` in any app ends the session at Internet Identity and removes the shared record. Every sibling reads the record as gone on its next render. A sibling in the middle of a request finishes it, and its next one is refused within five minutes, which is how long a delegation it already holds stays valid.
- **Signing in again elsewhere** replaces the session rather than ending it: a sibling still holding a credential for the old one drops it on its next use and picks up the new sign-in through `/reauth`, with nothing shown to the user.

Your app learns that a session ended the next time it reads the status: the state becomes `expired`, which still names the account, so the screen can say whose session ended.

## Next steps

- [Getting started](internet-identity.md#render-on-the-sign-in-status): the four sign-in states and how to render them.
- [App metadata](app-metadata.md): publish your app's name and logo once, on the derivation origin.
- [Custom domains](../frontends/custom-domains.md): serve your app from your own domain.
