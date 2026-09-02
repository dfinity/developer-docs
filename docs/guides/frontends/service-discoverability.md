---
title: "Service discoverability"
description: "What an app exposes so ICP MCP can discover its canisters, interfaces, behavior, data, and identity from just its URL."
sidebar:
  order: 3
---

When an agent working through ICP MCP is handed only your app's URL (for example, `https://yourapp.com`), it should be able to work out the rest on its own: which canisters your app comprises, what each one does, how to call them, how to query their data, and how to act as the signed-in user. No human supplying canister IDs, no bespoke integration.

This guide describes what a canister app exposes to make that possible, ordered by priority.

:::caution[Publishing the Layer 1 manifest opts your app in]
Making an app available through [ICP MCP](https://internetcomputer.org/icp-mcp/) is governed by the [ICP MCP App Operator Terms](https://internetcomputer.org/icp-mcp/app-operator-terms/), an agreement between DFINITY and the app's operator: the person or entity legally authorized to operate the app and declare its canisters.

**Publishing the Layer 1 manifest at `/.well-known/ic-architecture` opts the app into ICP MCP and constitutes the operator's acceptance of those terms**. It is sufficient to make its declared canisters eligible for everything ICP MCP does with them, queries and state-changing calls alike; no separate registration is required. Publication is also the condition ICP MCP applies to every call it makes to a canister: it reads and calls only canisters a manifest declares. An app that publishes none is still resolved and described from the files it serves publicly over HTTPS, and its canister IDs may still turn up there (from the gateway's `x-ic-canister-id` header, `/env.json`, or the JS bundle). ICP MCP will not read or call those, though, so it cannot confirm what they are: a manifest is the only route from an app to a canister an agent can use. Removing the manifest stops new calls of every kind.

**Registration is optional** and is not a condition of participation. It is how an operator tells DFINITY who they are, so they can be reached with the notices the terms provide for, and so there is a record of who accepted and which version; it can include the URL of the app's own privacy policy, so ICP MCP can present it to users. What ICP MCP discloses to a participating app, and what it processes if an operator registers, are described in the [ICP MCP Privacy Policy](https://internetcomputer.org/icp-mcp/privacy-policy/); under the App Operator Terms the operator remains responsible for handling the personal data that reaches the app lawfully, and for keeping the app's own privacy notice accurate and available to its users.

Layer 1 is required for participation through ICP MCP. Once the manifest is published, Layers 2–5 remain independently optional and useful; together they make an app fully agent-ready.
:::

## The five layers

An agent handed only your app's URL should be able to do five things, unattended:

1. Enumerate every canister the app comprises, and each one's role.
2. Inspect each canister's typed interface.
3. Understand the behavior the types cannot convey.
4. Query the app's data efficiently, without a bespoke method per question.
5. Act as the signed-in user, with that user's own permissions.

Layer 1 is required for participation through ICP MCP. Once the manifest is published, Layers 2–5 remain independently optional and useful; together they make an app fully agent-ready.

| Layer | Question it answers | Mechanism |
|-------|---------------------|-----------|
| 1. Composition | Which canisters make up this app, and what is each for? | `/.well-known/ic-architecture` manifest |
| 2. Interface | What methods and types does a canister expose? | `candid:service` metadata |
| 3. Behavior | How does it actually behave (units, lifecycle, gotchas)? | `getApiDoc` query method |
| 4. Data | How do I query its data? | OQL: `schema` and `execute` query methods |
| 5. Identity | How do I act as the signed-in user, under the right principal? | `/.well-known/ii-derivation-origin` declaration |

## Layer 1: Composition discovery

An app should declare the set of canisters it comprises, each labeled with its role.

### The canister manifest

Serve a JSON document at the origin's `/.well-known/ic-architecture` that lists every canister and its role:

```json
{
  "version": "1.0.0",
  "canisters": [
    {
      "id": "hcv4s-uaaaa-aaabq-qaaba-cai",
      "name": "frontend",
      "role": "the frontend"
    },
    {
      "id": "hmxr2-pqaaa-aaabq-qaaaa-cai",
      "name": "backend",
      "role": "the backend",
      "description": "orders + inventory API; call getApiDoc() first"
    }
  ]
}
```

This is the way an app declares its composition. It is recommended to create this file during your app's deployment, as opposed to updating it for an already-deployed app, as demonstrated [here](https://github.com/raymondk/demo-ic-architecture/tree/main/frontend/ic-architecture).

**Field rules:**

- `version` identifies the manifest schema version.
- `id` is required and must be a canister principal.
- `name` and `role` label the canister, and `description` is optional. These human-readable fields are untrusted, so a consumer sanitizes them before use.
- Unknown fields must be ignored, so the format can grow (for example, per-canister network hints or an api-doc pointer) without breaking older readers.

**Serving rules:**

- Serve it at exactly `/.well-known/ic-architecture`, at the origin, with no file extension. The IC's `.well-known` discovery files omit extensions by convention (compare `ic-domains` and `ii-alternative-origins`), even when, as here, the content is JSON.
- Serve real JSON with `Content-Type: application/json`. The most common failure is a single-page-app catch-all returning `index.html` for unknown paths. Exempt `/.well-known/*` from the SPA rewrite wherever your frontend is served.
- Generate it at deploy time. Canister IDs differ per network (local, staging, mainnet), so the file must be produced by the deploy pipeline (which already knows the IDs) rather than committed with hard-coded values.

The exact configuration depends on how you host the frontend; the requirement is only that `/.well-known/*` is served as a static file, not rewritten to `index.html`. If you serve assets from an asset canister, see [Asset canister](asset-canister.md#ic-assetsjson5) for including the hidden `.well-known` directory and configuring SPA aliasing, and [Custom domains](custom-domains.md#step-2-create-the-ic-domains-file) for the same `.well-known` pattern applied to domain ownership.

## Layer 2: Interface discovery

Expose your Candid interface as the canister's public `candid:service` metadata, the standard IC mechanism emitted by default by the common toolchains. This lets an agent fetch the exact method signatures and types and encode or decode calls correctly.

See [Candid interface](../canister-calls/candid.md) for how Candid describes a canister's methods and types.

## Layer 3: Behavioral guidance

Candid types describe shape, not behavior. Expose a query method that returns a prose (markdown) guide to the things an agent cannot infer from types:

```candid
getApiDoc : () -> (text) query;    // or the snake_case name get_api_doc
```

Cover the non-obvious semantics, for example:

- **Units and encoding:** integer money scaled by `10^8`, fractions versus tenth-bps, timestamp units.
- **Authentication:** which calls need a signed principal, and how anonymous access differs from a signed-in user.
- **Lifecycle:** staged or asynchronous operations that return before completing, so the agent must poll.
- **Mutation safety:** what is irreversible, and any dead-man switches.
- **Polling rules** and the gotchas that routinely trip up new integrators.

**Name it discoverably.** Because the method name itself appears in `candid:service`, an agent finds `getApiDoc` with zero out-of-band knowledge: no bootstrap hint, meta tag, or side channel required.

## Layer 4: Queryable data surface

For data-rich apps, expose a self-describing query surface so an agent can answer questions without you writing a bespoke method per question. OQL is one such convention, a pair of query methods:

```candid
schema  : ()     -> (text)   query;  // JSON catalogue: entities, fields, edges
execute : (text) -> (Result) query;  // one JSON query object -> rows
```

`schema` returns a JSON catalogue of entities, their fields (with types and roles), and the edges between them. An agent fetches it once so it knows what is queryable.

`execute` takes one JSON query object (filters, aggregation, ordering, projection, paging) and returns a paged `Result`:

```candid
type Cell   = record { name : text; value : variant { ... } };  // value tagged by its scalar type
type Result = record { hasMore : bool; rows : vec vec Cell };    // each row is a list of named cells
```

Each cell carries its column `name` and a `value` that is a type-tagged variant (text, integer, and so on), so agents read cells by name, never by position, and page while `hasMore` is true. Prefer server-side filtering and aggregation so only the needed data crosses into the agent's context. Any Candid interface works; OQL just makes open-ended questions more economical.

## Layer 5: Acting as the user

To let an agent act with the user's own principal and permissions, an app should expose the [Internet Identity](../authentication/internet-identity.md) **_derivation origin_** its frontends pin. An agent that already holds the user's Internet Identity authorization derives a short-lived, per-app delegation for that origin on demand. This yields the same principal the user has when they use your app in a web browser, so your existing access control applies unchanged.

The principal a user gets is a function of three inputs:

1. The user's Internet Identity
2. The _account_ within that Internet Identity
3. Your app's derivation origin (the only factor controlled by your app)

The derivation origin defaults to the **_visible_** origin requested by the user (for agentic flows) or the origin a user sees in their web browser address line (for classical flows).

If the app has multiple frontends (e.g., due to migrating to a new brand name) the visible URL is not necessarily the origin identities are derived for. Providing the well-known file below tells an agent which origin to request Internet Identity derivations for when your users prompt that agent to access the app from any of its supported origins (e.g., starting from a new or secondary frontend).

**Instructions.** Each of the frontend origins your app supports should publish the app's derivation origin in a dedicated file at `/.well-known/ii-derivation-origin`, whose body is the canonical `https://host` origin on a single line:

```text
https://hcv4s-uaaaa-aaabq-qaaba-cai.icp.net
```

If you use the default (the app's own origin), you may omit the file. Its absence means "derive for the visible / requested origin itself." Serve it with no file extension and exempt `/.well-known/*` from the SPA catch-all, exactly as for the manifest. Generate it at deploy time when the origin is a per-network canister URL.

**Relationship between derivation origin and alternative-origins.** A custom origin is enabled by two coupled files: the app pins `derivationOrigin` in its Internet Identity configuration, and the derivation origin publishes `/.well-known/ii-alternative-origins` listing the origins permitted to derive against it. That list answers "who may point here," not "where does this app point." The two are not interchangeable, and there is no reverse lookup from an app URL to its custom derivation origin. Reading it the wrong way round silently produces the wrong principal. See [Internet Identity](../authentication/internet-identity.md#alternative-origins) for how to configure `derivationOrigin` and `ii-alternative-origins`.

## Deployment checklist

- [ ] **Composition:** the deploy pipeline emits `/.well-known/ic-architecture` listing every canister with a role, served as real JSON at the extensionless path.
- [ ] **Routing:** `/.well-known/*` is exempt from the SPA catch-all rewrite.
- [ ] **Interface:** `candid:service` metadata is exposed (do not strip it).
- [ ] **Behavior:** the backend exposes `getApiDoc` or `get_api_doc`, returning a markdown guide.
- [ ] **Data (if applicable):** data-rich canisters expose OQL `schema` and `execute`.
- [ ] **Identity (if custom):** publish the effective origin in `/.well-known/ii-derivation-origin` (canonical `https://host`, one line).

## Acceptance tests

An app is agent-discoverable when these pass against the deployed origin:

```bash
# 1. Manifest is real JSON listing the canisters (not the SPA shell)
curl -s https://APP/.well-known/ic-architecture | jq '.canisters[].id'

# 2. Backend exposes candid:service; fetch it against the backend ID from step 1
#    (and confirm the interface declares getApiDoc, plus schema/execute if data-rich)
icp canister metadata <BACKEND_ID> candid:service -e ic

# 3. If you pin a CUSTOM derivation origin, it is published in its own file as the
#    canonical https://host. An absent file means the default (https://APP).
#    Use -f so a 404 is treated as an error and the fallback fires (curl -s alone
#    exits 0 on 404, so the "default" branch would never run).
curl -sf https://APP/.well-known/ii-derivation-origin || echo "default (https://APP)"
```

End to end: an agent given only `https://APP` resolves the backend ID first (labeled with its role), reads `getApiDoc` to learn behavior, queries data apps via OQL, and, to act as the user, derives the user's principal against the app's declared derivation origin. All of that happens without a human supplying an ID or guessing which origin the user's principal comes from.

## Related documents

- [Asset canister](asset-canister.md): serve `.well-known` files and configure SPA routing.
- [Custom domains](custom-domains.md): apply the same `.well-known` pattern to domain ownership.
- [Internet Identity](../authentication/internet-identity.md#alternative-origins): configure `derivationOrigin` and alternative origins.
- [Candid interface](../canister-calls/candid.md): define the typed interface agents read.
