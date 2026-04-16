---
title: "Offchain Calls"
description: "Call canister functions from frontends, scripts, and backend services using IC agent libraries"
sidebar:
  order: 4
---

An **agent** is a client-side library that constructs ingress messages, signs them with a cryptographic identity, and sends them to ICP boundary nodes. Agents handle the protocol details — CBOR encoding, request IDs, certificate verification — so your application code works with native language types.

## How agents work

When you call a canister method through an agent, the agent:

1. Encodes your arguments as Candid (a CBOR-wrapped binary format)
2. Attaches a cryptographic identity (anonymous or authenticated)
3. Sends a `POST` request to `/api/v2/canister/<canister-id>/call` (update) or `/api/v2/canister/<canister-id>/query` (query)
4. For update calls, polls the replica using `read_state` requests until the response is ready
5. Verifies the certificate in the response using the IC root key
6. Decodes the Candid response into native language types

## Query vs update calls

The IC has two call types that agents route differently:

| | Query | Update |
|---|---|---|
| State changes | Not allowed | Allowed |
| Routing | Single replica — fast (~200ms) | Goes through consensus (~2–4 seconds) |
| Response verification | Node key signatures verified by default; certified data provides app-layer guarantees | Full certificate from consensus |
| Candid annotation | `query` | (default) |

The Candid interface definition tells the agent which call type to use. When you generate typed bindings from a `.did` file, the generated code routes each method correctly — you do not need to decide manually.

## Available agents

DFINITY maintains official agents for JavaScript/TypeScript and Rust. Several community agents cover additional languages.

### Official agents

**JavaScript / TypeScript — `@icp-sdk/core`**

The primary agent for browser and Node.js applications. Install from npm:

```bash
npm install @icp-sdk/core
```

Import path: `@icp-sdk/core/agent`

Full documentation: [js.icp.build](https://js.icp.build)

**Rust — `ic-agent`**

A low-level Rust library for building applications that interact with ICP. Add to your project:

```bash
cargo add ic-agent
```

Crate documentation: [docs.rs/ic-agent](https://docs.rs/ic-agent/latest/ic_agent/)

### Community agents

The following agents are community-maintained. Check their repositories for current status and security review history before using in production:

| Language | Package |
|----------|---------|
| Go | [`agent-go` by Aviate Labs](https://github.com/aviate-labs/agent-go) |
| Java / Android | [`ic4j-agent` by IC4J](https://github.com/ic4j/ic4j-agent) |
| Dart / Flutter | [`agent_dart` by AstroX](https://github.com/AstroxNetwork/agent_dart) |
| .NET | [`ICP.NET` by Gekctek](https://github.com/Gekctek/ICP.NET) |
| Elixir | [`icp_agent`](https://github.com/diodechain/icp_agent) |
| C | [`agent-c` by Zondax](https://github.com/Zondax/icp-client-cpp) |

## JavaScript / TypeScript: using the agent

The recommended pattern is to generate typed bindings from your canister's `.did` file and use the `createActor` helper those bindings export. This avoids writing raw agent calls and ensures your code matches the canister interface.

### Generating bindings

Use `@icp-sdk/bindgen` to generate TypeScript bindings from a `.did` file:

```bash
npx @icp-sdk/bindgen --did-file ./backend.did --out-dir ./src/backend/api
```

For Vite projects, use the Vite plugin to regenerate bindings automatically during development. See [Candid and binding generation](candid.md) for details.

### Creating an actor (browser)

In a browser frontend served by an asset canister, read the canister ID from the environment cookie that icp-cli injects at deploy time:

```typescript
import { createActor } from "./backend/api/backend";
import { getCanisterEnv } from "@icp-sdk/core/agent/canister-env";

// Declare the environment variables your asset canister exposes.
// icp-cli injects PUBLIC_CANISTER_ID:<name> for every canister in the project.
interface CanisterEnv {
  readonly "PUBLIC_CANISTER_ID:backend": string;
}

const canisterEnv = getCanisterEnv<CanisterEnv>();
const canisterId = canisterEnv["PUBLIC_CANISTER_ID:backend"];

// Pass rootKey only on non-standard networks. On mainnet the IC root key is
// embedded in the agent — omit rootKey there.
// In local development, let the agent fetch the root key from the local replica.
const actor = createActor(canisterId, {
  agentOptions: {
    rootKey: !import.meta.env.DEV ? canisterEnv.IC_ROOT_KEY : undefined,
    shouldFetchRootKey: import.meta.env.DEV,
  },
});
```

`getCanisterEnv` reads the `ic_env` cookie that the asset canister sets automatically. See [Canister discovery](#canister-discovery) below for how this works.

### Creating an actor (Node.js)

For Node.js scripts and backend services, create an `HttpAgent` directly and pass it to `createActor`:

```typescript
import { HttpAgent } from "@icp-sdk/core/agent";
import { createActor } from "./backend/api/backend";

const agent = await HttpAgent.create({
  host: "https://icp-api.io",
  // Omit identity to use the anonymous identity.
  // Pass an identity here for authenticated calls.
  // IC root key is embedded in the agent for mainnet — do not set shouldFetchRootKey.
});

const actor = createActor("<canister-id>", { agent });
```

For local development against a local replica, fetch the root key:

```typescript
const agent = await HttpAgent.create({
  host: "http://127.0.0.1:8000",
  shouldFetchRootKey: true,
});
```

### Making calls

Once you have an actor, call methods as regular async functions. The generated bindings handle Candid encoding and routing:

```typescript
// Query call — fast, read-only
const greeting = await actor.greet("Ada");
console.log(greeting); // "Hello, Ada!"
```

### Error handling

Agent errors are thrown as `Error` instances. Wrap calls in `try/catch`:

```typescript
try {
  const result = await actor.greet("Ada");
} catch (err) {
  if (err instanceof Error) {
    console.error("Call failed:", err.message);
  }
}
```

## Rust: using ic-agent

### Initializing the agent

```rust
use anyhow::Result;
use ic_agent::Agent;

pub async fn create_agent(url: &str, use_mainnet: bool) -> Result<Agent> {
    let agent = Agent::builder().with_url(url).build()?;
    if !use_mainnet {
        // Fetch the root key for local development only.
        // The mainnet root key is embedded in the agent.
        agent.fetch_root_key().await?;
    }
    Ok(agent)
}

#[tokio::main]
async fn main() -> Result<()> {
    let agent = create_agent("https://ic0.app", true).await?;
    Ok(())
}
```

### Making calls

Use `agent.query` for query calls and `agent.update` for update calls. Encode arguments with `candid::Encode!` and decode responses with `candid::Decode!`:

```rust
use ic_agent::{Agent, export::Principal};
use candid::{Encode, Decode, CandidType};
use serde::Deserialize;

async fn call_greet(agent: &Agent, canister_id: &str) -> anyhow::Result<String> {
    let canister = Principal::from_text(canister_id)?;

    // Query call: encode the argument, call the method, decode the response
    let response = agent
        .query(&canister, "greet")
        .with_arg(Encode!(&"Ada")?)
        .call()
        .await?;
    let (greeting,) = Decode!(&response, String)?;
    Ok(greeting)
}
```

For update calls, use `.call_and_wait()` instead of `.call()`:

```rust
let response = agent
    .update(&canister, "update_name")
    .with_arg(Encode!(&"Ada")?)
    .call_and_wait() // submits the update and polls until the response is certified
    .await?;
```

### Authentication

The Rust agent uses an `Identity` to sign requests. The default is anonymous. To authenticate:

```rust
use ic_agent::identity::BasicIdentity;

let identity = BasicIdentity::from_pem_file("path/to/identity.pem")?;
let agent = Agent::builder()
    .with_url("https://ic0.app")
    .with_identity(identity)
    .build()?;
```

Available identity types: `AnonymousIdentity`, `BasicIdentity` (Ed25519), `Secp256k1Identity`, `Prime256v1Identity`. See [ic_agent::identity](https://docs.rs/ic-agent/latest/ic_agent/identity/index.html) for the full list.

## Canister discovery

Canister IDs differ between environments (local, staging, mainnet). Hardcoding them breaks when you redeploy or share code. icp-cli solves this with automatic canister ID injection.

### How it works

During `icp deploy`, icp-cli injects `PUBLIC_CANISTER_ID:<canister-name>` environment variables into every canister in the project. For a project with `backend` and `frontend` canisters, every canister receives:

```
PUBLIC_CANISTER_ID:backend  → bkyz2-fmaaa-aaaaa-qaaaq-cai
PUBLIC_CANISTER_ID:frontend → bd3sg-teaaa-aaaaa-qaaba-cai
```

### Frontend: reading the cookie

The asset canister exposes these variables via an `ic_env` cookie, along with the network's root key (`IC_ROOT_KEY`). Use `getCanisterEnv` from `@icp-sdk/core` to read the cookie:

```typescript
import { getCanisterEnv } from "@icp-sdk/core/agent/canister-env";

// Declare the environment variables your asset canister exposes.
// icp-cli injects PUBLIC_CANISTER_ID:<name> for every canister in the project.
interface CanisterEnv {
  readonly "PUBLIC_CANISTER_ID:backend": string;
}

const env = getCanisterEnv<CanisterEnv>();
const backendId = env["PUBLIC_CANISTER_ID:backend"];
const rootKey = env.IC_ROOT_KEY; // Uint8Array — use for certificate verification
```

This works identically on local networks and mainnet without code changes.

### Local development with a dev server

During development, your dev server runs outside the asset canister and the `ic_env` cookie is not set automatically. Simulate it by configuring your dev server to inject the cookie. With Vite:

```typescript
// vite.config.ts
const IC_ROOT_KEY_HEX = "308182..."; // placeholder — replace with your local replica root key
const BACKEND_CANISTER_ID = "bkyz2-fmaaa-aaaaa-qaaaq-cai"; // from `icp canister list`

export default defineConfig({
  server: {
    headers: {
      "Set-Cookie": `ic_env=${encodeURIComponent(
        `ic_root_key=${IC_ROOT_KEY_HEX}&PUBLIC_CANISTER_ID:backend=${BACKEND_CANISTER_ID}`
      )}; SameSite=Lax;`,
    },
  },
});
```

The hello-world template from `icp new` includes this setup. See the template's `vite.config.ts` for a working example.

## Authentication

Calls to ICP always carry a cryptographic identity. An anonymous identity is used by default.

### Anonymous calls

Anonymous calls work without any setup. The sender principal is `"2vxsx-fae"`. Canisters can check the caller principal to detect anonymous calls.

### Authenticated calls with Internet Identity

To associate calls with a user's Internet Identity, use `@icp-sdk/auth` to complete the delegation flow and get an `Identity` object, then pass it to the agent. See [Internet Identity](../authentication/internet-identity.md) for the full integration guide.

Once you have an authenticated identity, pass it to the agent at creation time:

```typescript
import { HttpAgent } from "@icp-sdk/core/agent";

// identity obtained from Internet Identity delegation
const agent = await HttpAgent.create({
  host: "https://icp-api.io",
  identity, // DelegationIdentity from @icp-sdk/auth
});
```

## Next steps

- [Candid and binding generation](candid.md) — generate typed clients from `.did` files
- [Onchain calls](onchain-calls.md) — canister-to-canister calls from within the IC
- [Internet Identity](../authentication/internet-identity.md) — adding user authentication to offchain calls
- [Asset canister](../frontends/asset-canister.md) — deploying the frontend that makes these calls

<!-- Upstream: informed by dfinity/portal — docs/building-apps/interact-with-canisters/agents/overview.mdx, docs/building-apps/interact-with-canisters/agents/javascript-agent.mdx, docs/building-apps/interact-with-canisters/agents/rust-agent.mdx; dfinity/icp-cli — docs/concepts/canister-discovery.md; dfinity/icp-cli-templates — hello-world/frontend/app/src/App.tsx, hello-world/frontend/app/vite.config.ts; dfinity/icp-js-sdk-docs — @icp-sdk/core/agent, @icp-sdk/core/agent/canister-env, @icp-sdk/bindgen -->
