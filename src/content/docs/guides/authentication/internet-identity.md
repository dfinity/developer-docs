---
title: "Internet Identity"
description: "Authenticate users with Internet Identity on the Internet Computer."
sidebar:
  order: 1
doc_type: how-to
level: intermediate
features: []
icskills:
  - internet-identity
last_verified: 2026-03-10
---

Internet Identity (II) is ICP's native authentication service. It provides passwordless login using passkeys (WebAuthn), giving each user a unique principal per application for privacy. No passwords, no seed phrases for end users.

## How it works

1. The user clicks "Login" in your app.
2. Your frontend opens Internet Identity in a popup.
3. The user authenticates with a passkey (fingerprint, face ID, or security key).
4. II issues a **delegation identity** scoped to your application's origin.
5. Your frontend receives the delegation and uses it to sign canister calls.

Each application gets a different principal for the same II user, so applications cannot correlate users across sites.

## Setting up a project with Internet Identity

Create a new project with Internet Identity included:

```bash
icp new my_app --subfolder hello-world \
  --define backend_type=motoko \
  --define frontend_type=react \
  --define extras=internet-identity
```

This configures your project to use Internet Identity locally. Enable II on the local network in your `icp.yaml`:

```yaml
networks:
  - name: local
    mode: managed
    ii: true
```

On mainnet, Internet Identity is already deployed at `rdmx6-jaaaa-aaaaa-aaadq-cai` — no configuration needed.

## Frontend integration

Install the auth client library:

```bash
npm install @icp-sdk/auth @icp-sdk/core
```

Implement the login flow:

```js
import { AuthClient } from "@icp-sdk/auth/client";
import { HttpAgent } from "@icp-sdk/core/agent";
import { safeGetCanisterEnv } from "@icp-sdk/core/agent/canister-env";

// Create the auth client once on page load
const authClient = await AuthClient.create();

// Determine II URL based on environment
function getIdentityProviderUrl() {
  const host = window.location.hostname;
  const isLocal = host === "localhost" || host === "127.0.0.1" || host.endsWith(".localhost");
  if (isLocal) {
    // The local II canister ID comes from the ic_env cookie
    const env = safeGetCanisterEnv();
    const iiId = env?.["PUBLIC_CANISTER_ID:internet_identity"];
    return `http://${iiId}.localhost:8000`;
  }
  return "https://identity.ic0.app";
}

// Login
async function login() {
  await authClient.login({
    identityProvider: getIdentityProviderUrl(),
    onSuccess: async () => {
      const identity = authClient.getIdentity();
      const agent = await HttpAgent.create({ identity });
      // Use agent to make authenticated canister calls
    },
  });
}

// Check if already authenticated
if (await authClient.isAuthenticated()) {
  const identity = authClient.getIdentity();
  // User is already logged in
}

// Logout
async function logout() {
  await authClient.logout();
}
```

> **Important:** Create a single `AuthClient` instance on page load and reuse it. Do not create new instances inside click handlers.

## Backend verification

The backend canister automatically receives the caller's principal. Use it for authorization:

### Motoko

```motoko
actor {
  public shared(msg) func whoami() : async Principal {
    msg.caller
  };

  public shared(msg) func protectedAction() : async Text {
    assert(msg.caller != Principal.fromText("2vxsx-fae")); // reject anonymous
    "Authorized action completed"
  };
}
```

### Rust

```rust
#[ic_cdk::query]
fn whoami() -> String {
    ic_cdk::caller().to_string()
}

#[ic_cdk::update]
fn protected_action() -> String {
    let caller = ic_cdk::caller();
    assert!(caller != candid::Principal::anonymous(), "Anonymous not allowed");
    "Authorized action completed".to_string()
}
```

## Deploy and test locally

```bash
icp network start -d
icp deploy
```

Open the frontend URL from the deployment output. Click "Login" to be redirected to the local Internet Identity instance. Create a local identity (this is separate from production II) and authenticate.

## Delegation chain

When a user logs in:

1. The `AuthClient` generates a session key pair in the browser.
2. II signs a **delegation** that authorizes this session key to act on behalf of the user.
3. The delegation has an expiry (default: 8 hours) and is scoped to your application's origin.
4. The session key signs canister calls, and the delegation chain proves the user authorized it.

This means the user's passkey never leaves their device, and the delegation limits the scope and duration of access.

## Alternative origins

If your app is accessible from multiple domains (e.g., `<canister-id>.icp0.io` and `app.example.com`), users would get different principals per domain. To unify principals across origins, configure alternative origins by creating a `.well-known/ii-alternative-origins` file in your frontend canister:

```json
{
  "alternativeOrigins": ["https://app.example.com"]
}
```

## Resources

- [Internet Identity dashboard](https://identity.ic0.app)
- [Internet Identity GitHub](https://github.com/dfinity/internet-identity)
- [@icp-sdk/auth on npm](https://www.npmjs.com/package/@icp-sdk/auth)
- [icp-cli configuration reference](https://dfinity.github.io/icp-cli/reference/configuration/) -- network and canister configuration
