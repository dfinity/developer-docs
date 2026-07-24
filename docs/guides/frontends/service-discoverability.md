---
title: "Service discoverability"
description: "What a canister app exposes so an AI agent can discover its canisters, interfaces, behavior, data, and identity from just its URL"
sidebar:
  order: 3
---

When an AI agent is handed only your app's URL (for example, `https://yourapp.com`), it should be able to work out the rest on its own: which canisters your app comprises, what each one does, how to call them, how to query their data, and how to act as the signed-in user. No human supplying canister IDs, no bespoke integration.

This guide describes what a canister app exposes to make that possible, ordered by priority. Parts of it are established Internet Computer standards, and parts are proposed conventions this guidance builds on; each section is labeled so you know which is which.

## The five layers

An agent handed only your app's URL should be able to do five things, unattended:

1. Enumerate every canister the app comprises, and each one's role.
2. Inspect each canister's typed interface.
3. Understand the behavior the types cannot convey.
4. Query the app's data efficiently, without a bespoke method per question.
5. Act as the signed-in user, with that user's own permissions.

Each layer is independently adoptable and independently useful. Together they make an app agent-ready.

| Layer | Question it answers | Mechanism |
|-------|---------------------|-----------|
| 1. Composition | Which canisters make up this app, and what is each for? | `/.well-known/ic-architecture` manifest |
| 2. Interface | What methods and types does a canister expose? | `candid:service` metadata |
| 3. Behavior | How does it actually behave (units, lifecycle, gotchas)? | `getApiDoc` query method |
| 4. Data | How do I query its data? | OQL: `schema` and `execute` query methods |
| 5. Identity | How do I act as the signed-in user, under the right principal? | `/.well-known/ii-derivation-origin` declaration |

`candid:service` (Layer 2) and `/.well-known/ii-alternative-origins` are existing Internet Computer and Internet Identity standards. The `/.well-known/ic-architecture` manifest, the `/.well-known/ii-derivation-origin` declaration, the `getApiDoc` convention, and the OQL data surface are proposed conventions. Layer 1 (composition discovery) is the most important and, in practice, today's weakest link, so it gets the most detail below.

## One way to expose each fact

Everything an app declares for discovery is served over HTTP as a dedicated file at a well-known path: a JSON manifest, or a single-value text file, read like `curl`. Do not embed discovery metadata in an HTML asset (a meta tag, inline script, or runtime cookie config), and do not require it to be mined from JavaScript bundles. One documented file per fact means there is nothing to reconcile and nothing to guess.

The IC gateway does stamp an automatic `x-ic-canister-id` response header, but it names only the frontend and, like any header, is trivially forgeable. This guidance does not rely on it (see the anti-patterns under Layer 1).

## Layer 1: Composition discovery

**Proposed.** The single most valuable thing an app can declare is the set of canisters it comprises, each labeled with its role. Everything downstream (interface, behavior, data, identity) is per-canister, so an agent that cannot enumerate the set is stuck asking a human for canister IDs.

### The canister manifest

Serve a small JSON document at the origin's `/.well-known/ic-architecture` that lists every canister and its role:

```json
{
  "canisters": [
    { "id": "hmxr2-pqaaa-aaabq-qaaaa-cai", "role": "backend",
      "description": "orders + inventory API; call getApiDoc() first" },
    { "id": "hcv4s-uaaaa-aaabq-qaaba-cai", "role": "frontend" }
  ]
}
```

This is the way an app declares its composition. It expresses the full set (not just a single "main" canister), it is read like `curl` (independent of the login page and of any HTML or JavaScript), and it fails loudly at deploy time rather than silently.

**Field rules:**

- `id` is required and must be a canister principal.
- `role` and `description` are optional, human-readable, and untrusted. A consumer sanitizes them before use.
- Unknown fields must be ignored, so the format can grow (for example, per-canister network hints or an api-doc pointer) without breaking older readers.

**Serving rules:**

- Serve it at exactly `/.well-known/ic-architecture`, at the origin, with no file extension. The IC's `.well-known` discovery files omit extensions by convention (compare `ic-domains` and `ii-alternative-origins`), even when, as here, the content is JSON.
- Serve real JSON with `Content-Type: application/json`. The most common failure is a single-page-app catch-all returning `index.html` for unknown paths. Exempt `/.well-known/*` from the SPA rewrite in your asset canister configuration.
- Generate it at deploy time. Canister IDs differ per network (local, staging, mainnet), so the file must be produced by the deploy pipeline (which already knows the IDs) rather than committed with hard-coded values.

To serve `/.well-known/*` from an asset canister, add a rule to `.ic-assets.json5` so the hidden directory is included, exactly as for the `ic-domains` file:

```json5
[
  {
    "match": ".well-known",
    "ignore": false
  }
]
```

See [Asset canister](asset-canister.md#ic-assetsjson5) for SPA aliasing configuration, and [Custom domains](custom-domains.md#step-2-create-the-ic-domains-file) for the same `.well-known` pattern applied to domain ownership.

:::note
This is a proposed convention. There is no standard way today for an app to enumerate the multiple canisters it comprises: existing signals identify only a single "main" canister. The goal is exactly one documented way to declare composition.
:::

### Anti-patterns: do not rely on these for discovery

- **Discovery metadata embedded in HTML** (a `<meta>` tag, inline script, or templated page). Markup readers do not execute JavaScript, HTML is not a machine-readable contract, and it couples discovery to a page's lifecycle. Declare every fact in its own `/.well-known` file instead.
- **The `x-ic-canister-id` gateway header, for composition.** The IC HTTP gateway sets it automatically, but it names only the frontend or asset canister (never backends) and, like any response header, is trivially echoed by any origin. It is a hint at best, not a declaration the app controls. The manifest already lists the frontend as a role, so treat the manifest as the one source.
- **Config delivered only at runtime** (a `Set-Cookie` config blob, a script that reads `document.cookie`, and similar). It is invisible to a file reader and is a private transport between your platform and your own JavaScript, not a discovery interface.
- **IDs present only in the JavaScript bundle.** Mining a minified bundle is a last-ditch heuristic, not a contract.
- **A SPA catch-all answering `/.well-known/*`** (including `ic-architecture` and `ii-derivation-origin`) with `index.html`.
- **Per-network IDs committed into source.** They are wrong on every network but the one you baked them for.

## Layer 2: Interface discovery

**Standard.** Expose your Candid interface as the canister's public `candid:service` metadata, the standard IC mechanism emitted by default by the common toolchains. This lets an agent fetch the exact method signatures and types and encode or decode calls correctly. If it is unreadable, every downstream layer degrades to guessing. Nothing app-specific is required beyond not stripping it.

See [Candid interface](../canister-calls/candid.md) for how Candid describes a canister's methods and types.

## Layer 3: Behavioral guidance

**Convention.** Candid types describe shape, not behavior. Expose a query method that returns a prose (markdown) guide to the things an agent cannot infer from types:

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

**Convention.** For data-rich apps, expose a self-describing query surface so an agent can answer questions without you writing a bespoke method per question. OQL is one such convention, a pair of query methods:

```candid
schema  : ()     -> (text)   query;  // JSON catalogue: entities, fields, edges
execute : (text) -> (Result) query;  // one JSON query object -> rows
```

`schema` returns a JSON catalogue of entities, their fields (with types and roles), and the edges between them. An agent fetches it once so it knows what is queryable.

`execute` takes one JSON query object (filters, aggregation, ordering, projection, paging) and returns rows. The result is a paged record of `{ hasMore, rows }` where each cell is `{ name, value }`. Agents read cells by name, never by position, and page while `hasMore` is true.

Prefer server-side filtering and aggregation so only the needed data crosses into the agent's context. OQL is a recommended default, not a requirement: any Candid interface still works, just less economically for open-ended questions.

## Layer 5: Acting as the user

**Proposed.** To let an agent act with the user's own principal and permissions, an app exposes exactly one thing: the [Internet Identity](../authentication/internet-identity.md) derivation origin its frontends pin. An agent that already holds the user's Internet Identity authorization derives a short-lived, per-app delegation for that origin on demand. This yields the same principal the user has when they use your app, so your existing access control applies unchanged. No login page, no AI-specific backend code, and no bot account are required. (How the agent obtains the user's authorization in the first place, through session, scope, or consent, is the connector's concern and out of scope here. All the app has to publish is the origin.)

The principal a user gets is a function of one input: the derivation origin Internet Identity signs for. By default that is the visible origin (`https://yourapp.com`). But an app may pin a custom derivation origin, typically its canister origin, so that a branded domain and its canister URL resolve to the same principal. When that is the case, the visible URL is not the origin identities are derived for, and an agent that assumes otherwise derives a valid but wrong principal, one with none of the user's permissions.

**The alternative-origins file is the inverse relation.** A custom origin is enabled by two coupled files: the app pins `derivationOrigin` in its Internet Identity configuration, and the derivation origin publishes `/.well-known/ii-alternative-origins` listing the origins permitted to derive against it. That list answers "who may point here," not "where does this app point." The two are not interchangeable, and there is no reverse lookup from an app URL to its custom derivation origin. Reading it the wrong way round silently produces the wrong principal. See [Internet Identity](../authentication/internet-identity.md#alternative-origins) for how to configure `derivationOrigin` and `ii-alternative-origins`.

**So the app states the answer rather than leaving it to be guessed.** Publish the effective derivation origin in a dedicated file at `/.well-known/ii-derivation-origin`, whose body is the canonical `https://host` origin on a single line:

```text
https://hcv4s-uaaaa-aaabq-qaaba-cai.icp.net
```

This dedicated file, not the composition manifest, is the authoritative forward answer to "which origin does this app derive against." Keeping it separate is deliberate:

- It is an identity concern (Layer 5), orthogonal to composition (Layer 1). An app may pin a custom derivation origin independently of how it declares composition.
- It sits symmetrically beside `/.well-known/ii-alternative-origins`, hence the `ii-` prefix: domain-based derivation is an Internet Identity concept, not a general IC one. This file is the forward relation ("where does this app point"); that file is the inverse ("who may point here").
- A single-value, plain-text file is trivial to serve and to verify (one `curl`, no parsing), and it follows the `.well-known` convention.

If you use the default (the app's own origin), omit the file. Its absence means "derive for the app origin itself." Serve it with no file extension and exempt `/.well-known/*` from the SPA catch-all, exactly as for the manifest. Generate it at deploy time when the origin is a per-network canister URL.

**What a well-behaved agent does with it.** It fetches `/.well-known/ii-derivation-origin` (falling back to the app origin itself when the file is absent), signs the delegation for that canonical origin, and echoes back both the origin it derived for and the app URL it was asked about with every identity result. An origin mismatch is then visible at a glance instead of hiding behind a plausible-looking principal.

## Precedence and who produces what

| Signal | Layer | Produced by | Trust | Status |
|--------|-------|-------------|-------|--------|
| `/.well-known/ic-architecture` | Composition (all) | Deploy pipeline | App-declared | Proposed |
| `x-ic-canister-id` header | Composition (frontend) | IC gateway | Automatic hint (frontend); forgeable, not relied on | Automatic |
| `candid:service` | Interface | Canister toolchain | Authoritative | Standard |
| `getApiDoc` method | Behavior | Canister code | App-declared | Convention |
| `schema` / `execute` | Data | Canister code | App-declared | Convention |
| `/.well-known/ii-derivation-origin` | Identity | Deploy pipeline or static | App-declared | Proposed |
| `/.well-known/ii-alternative-origins` | Identity (inverse) | App (static file) | Not a lookup source | Standard |

A consumer treats each app-declared signal as the app's own claim, to confirm rather than trust blindly. It fails closed: a malformed, oversized, or catch-all response yields no finding rather than a wrong one, and every ID is validated as a real canister principal before use.

## Deployment checklist

- [ ] **Composition:** the deploy pipeline emits `/.well-known/ic-architecture` listing every canister with a role, served as real JSON at the extensionless path.
- [ ] **Routing:** `/.well-known/*` is exempt from the SPA catch-all rewrite, so it is served as itself, not `index.html`.
- [ ] **Interface:** `candid:service` metadata is exposed (do not strip it).
- [ ] **Behavior:** the backend exposes `getApiDoc` or `get_api_doc`, returning a markdown guide.
- [ ] **Data (if applicable):** data-rich canisters expose OQL `schema` and `execute`.
- [ ] **Identity (if custom):** publish the effective origin in `/.well-known/ii-derivation-origin` (canonical `https://host`, one line). Do not expect agents to infer it from `ii-alternative-origins`.

## Acceptance tests

An app is agent-discoverable when these pass against the deployed origin:

```bash
# 1. Manifest is real JSON listing the canisters (not the SPA shell)
curl -s https://APP/.well-known/ic-architecture | jq '.canisters[].id'

# 2. Backend exposes candid:service, getApiDoc, and (if data-rich) OQL,
#    verified against the backend ID from step 1 via an IC agent:
#    get_candid(backend) succeeds; the interface declares getApiDoc; schema and execute are present.

# 3. If you pin a CUSTOM derivation origin, it is published in its own file as the
#    canonical https://host. An absent file means the default (https://APP).
curl -s https://APP/.well-known/ii-derivation-origin || echo "default (https://APP)"
```

End to end: an agent given only `https://APP` resolves the backend ID first (labeled with its role), reads `getApiDoc` to learn behavior, queries data apps via OQL, and, to act as the user, derives the user's principal against the app's declared derivation origin. All of that happens without a human supplying an ID or guessing which origin the user's principal comes from.

## Next steps

- [Asset canister](asset-canister.md): serve `.well-known` files and configure SPA routing.
- [Custom domains](custom-domains.md): apply the same `.well-known` pattern to domain ownership.
- [Internet Identity](../authentication/internet-identity.md#alternative-origins): configure `derivationOrigin` and alternative origins.
- [Candid interface](../canister-calls/candid.md): define the typed interface agents read.
