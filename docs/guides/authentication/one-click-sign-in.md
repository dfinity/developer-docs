---
title: "One-click sign-in"
description: "Send users straight to Google, Apple, Microsoft, or their organization's SSO when they sign in with Internet Identity, and check an organization domain before they do."
sidebar:
  order: 4
---

By default, `signIn()` opens Internet Identity and the user picks how to authenticate. One-click sign-in skips that choice: the user lands directly on the provider's own screen. Internet Identity is still the signer: it verifies the provider's token and issues the delegation.

A client is built for one of two entry points, never both:

| Option | Sends the user to | Value |
|--------|-------------------|-------|
| `openIdProvider` | A provider Internet Identity has built in | `"google"`, `"apple"`, or `"microsoft"` |
| `ssoDomain` | An organization's own OpenID provider | The organization's domain, such as `"acme.com"` |

Both are constructor options, fixed for the client's lifetime. To offer several, build one client per choice.

## Sign in with a built-in provider

```javascript
import { AuthClient } from "@icp-sdk/auth/client";

const authClient = new AuthClient({ openIdProvider: "google" });
await authClient.signIn();
```

The user goes straight to Google's account chooser. The rest of the flow (`getStatus()`, `getIdentity()`, `signOut()`) is unchanged.

## Sign in with an organization's SSO

```javascript
const authClient = new AuthClient({ ssoDomain: "acme.com" });
await authClient.signIn();
```

Internet Identity reads the organization's configuration from `https://acme.com/.well-known/ii-openid-configuration` and sends the user to the provider named there. Any organization that [publishes that file](enterprise-sso.md) can be signed in against, with nothing registered ahead of time.

The domain is normalized when the client is built: lowercased, IDNA-encoded, and reduced to a host with an optional port. A value carrying a scheme, a path, a query, or a fragment is not a domain, and the client reports it as `invalid` (see below).

If your app sets a `derivationOrigin`, the client sends it along with the domain, so Internet Identity uses the client the organization assigned to that origin.

## Check a domain the user typed

An app that asks the user for their organization's domain can show whether it works before they continue. A client built with `ssoDomain` checks its domain against Internet Identity by itself, and `getSsoStatus()` returns the result, the same way `getStatus()` returns the session:

| State | Meaning | Show |
|-------|---------|------|
| `checking` | Internet Identity is resolving the domain. | A spinner. |
| `available` | The domain is ready for sign-in. `name` is the organization's display name, when it publishes one. | "Continue with Acme Corp". |
| `invalid` | The input is not a domain. | Ask the user to correct it. |
| `unavailable` | The domain publishes no usable configuration, or resolving it failed. `retryAfter` is when a retry can succeed, when known. | The failure, and a retry button. |

`getSsoStatus()` is synchronous and never throws, and `subscribe()` calls back whenever it changes. Build a new client as the user types, and dispose of the one it replaces, which also stops its check:

```javascript
let client;

input.addEventListener("input", () => {
  client?.dispose();
  client = new AuthClient({ ssoDomain: input.value });
  client.subscribe(() => render(client.getSsoStatus()));
  render(client.getSsoStatus());
});

function render(sso) {
  switch (sso.state) {
    case "checking":
      return showSpinner();
    case "available":
      return enableContinue(sso.name);
    case "invalid":
      return showNotADomain();
    case "unavailable":
      return showUnavailable(sso.retryAfter);
  }
}

continueButton.addEventListener("click", () => client?.signIn());
```

A replaced client is disposed before it can report, so a stale result never renders. The client waits a moment before asking Internet Identity, so fast typing does not need a debounce of its own.

For a "Try again" button, call `refreshSsoStatus()`. While `retryAfter` is in the future, keep the button disabled and count down to it ("Try again in 2 min"): Internet Identity does not retry a failing domain sooner, and an early retry answers `unavailable` again at once.

The check also prepares Internet Identity for this domain, so `signIn()` on the same client starts without waiting. `signIn()` opens Internet Identity in every state except `invalid`, which rejects without opening anything. A sign-in through an `unavailable` domain shows Internet Identity's own error screen.

## Request attributes in the same step

A sign-in that goes to one provider can request attributes scoped to that provider, which the user grants on the same screen. See [Identity attributes](identity-attributes.md#scoped-keys).

## Next steps

- [Enterprise SSO](enterprise-sso.md): how an organization enables SSO sign-in for its staff.
- [Identity attributes](identity-attributes.md): request a name and email with the sign-in.
- [`@icp-sdk/auth` API reference](https://js.icp.build/auth/latest/): every option and method.
