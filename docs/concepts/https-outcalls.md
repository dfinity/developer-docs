---
title: "HTTPS Outcalls"
description: "How canisters make HTTP requests to external services with consensus on responses"
sidebar:
  order: 6
icskills: [https-outcalls]
---

Canisters on the Internet Computer can make HTTP requests to any public web server — fetching API data, posting to webhooks, or querying offchain services — without relying on oracles or other intermediaries. This capability is called **HTTPS outcalls**.

What makes this unusual for a blockchain is that every replica in a subnet executes the same code independently. When a canister makes an HTTPS outcall, all replicas in the subnet send the same request to the external server, each receives its own response, and the subnet must reach consensus on a single response to return to the canister. This mechanism preserves the replicated state machine guarantees that make smart contracts trustworthy while enabling direct communication with the conventional web.

## Why HTTPS outcalls exist

Traditional blockchains cannot make outbound HTTP requests. Smart contracts are deterministic state machines — if different nodes received different responses from an external server, their state would diverge and consensus would break. The standard workaround is **oracles**: trusted third-party services that fetch offchain data and submit it onchain.

Oracles work, but they add complexity, cost, and trust assumptions. You must choose an oracle provider, pay their fees, and trust that they relay data honestly. With HTTPS outcalls, canisters call external APIs directly. The IC protocol handles the consensus problem internally, so you get the same result — reliable offchain data onchain — without the middleman.

## How outcalls reach consensus

When a canister calls the management canister's `http_request` method, the following happens:

1. **The request is replicated.** The subnet stores the pending request in replicated state. Each replica's networking layer picks it up independently.

2. **Every replica makes the same HTTP request.** On a 13-node subnet, 13 independent requests go to the target server. The IC first tries a direct IPv6 connection; if that fails (e.g., the server is IPv4-only), it retries through a SOCKS proxy.

3. **Each replica receives its own response.** These responses are often *almost* identical but may differ in non-deterministic fields — timestamps in headers, request IDs, JSON field ordering, or IP-dependent content.

4. **The transform function normalizes responses.** The canister provides a transform function (a query method) that each replica runs locally on its response. The transform strips or normalizes the non-deterministic parts so that all honest replicas produce the same transformed response.

5. **Consensus agrees on the response.** The IC's consensus protocol requires at least 2/3 of replicas to produce the same transformed response. If enough replicas agree, that response is returned to the canister. If they can't agree, the call fails with a timeout.

The transform function is critical. Without it, even minor differences between responses — a header timestamp off by a millisecond — prevent consensus. If consensus cannot be reached, the call eventually times out — this is the most common failure mode when developing outcalls.

> **Local testing caveat:** The local replica runs a single node, so all responses pass consensus automatically — even without a transform function. Transform and consensus issues only surface when you deploy to a multi-node subnet.

For practical guidance on writing transform functions, see the [HTTPS outcalls guide](../guides/backends/https-outcalls.md).

## The transform function

A transform function is a **query method** exported by your canister that takes a raw HTTP response and returns a cleaned version. The IC calls it on each replica's response before passing it to consensus.

There are two general strategies:

- **Extract only what you need.** Parse the response body (usually JSON), pull out the specific data fields your canister requires, and discard everything else. This produces the smallest possible response and is easiest to get right.

- **Strip the variable parts.** Remove headers and body fields that vary between responses (timestamps, request IDs, ordering differences) while keeping the rest of the structure intact.

The first approach is recommended whenever possible — it produces smaller responses, is simpler to implement, and is less likely to miss a non-deterministic field.

A common pattern is stripping all response headers (they frequently contain timestamps and server-specific metadata) and either keeping the body as-is (if it's already deterministic) or re-serializing JSON to normalize field ordering.

## Request types and idempotency

HTTPS outcalls support `GET`, `HEAD`, and `POST` methods.

**GET and HEAD** requests are straightforward — they're inherently idempotent (repeating them doesn't change server state), so having 13 replicas send the same GET is harmless. `HEAD` is particularly useful for determining a resource's response size before making the actual request, which helps you set `max_response_bytes` accurately.

**POST requests** require more care. Because all replicas send the request independently, a non-idempotent POST endpoint (like "create order") will be called once per replica — potentially 13 times on a standard subnet. To prevent this:

- **Use an idempotency key.** Include a unique identifier in the request headers. Well-designed APIs recognize duplicate requests by this key and process only the first one.
- **Design for idempotency.** If you control the target API, make the endpoint handle duplicate requests gracefully.
- **Read back and verify.** After a POST, make a GET request to confirm the expected state change happened exactly once.

Not all servers support idempotency keys, so evaluate this on a case-by-case basis before using POST outcalls for state-changing operations.

## Cycle costs

HTTPS outcalls are not free — the calling canister must attach cycles to cover the cost. Both the Motoko `ic` mops package and the Rust `ic-cdk` provide wrappers that automatically compute and attach the required amount using the `ic0.cost_http_request` system API.

The cost depends on two factors:

- **Request size** — the combined byte length of the URL, headers, body, transform function name, and transform context.
- **`max_response_bytes`** — the maximum response size you declare. This is what you're charged for, not the actual response size.

If you omit `max_response_bytes`, the system assumes the maximum of 2 MB and charges accordingly — roughly 21.5 billion cycles on a 13-node subnet. Always set this to a reasonable upper bound for your expected response to avoid overpaying. Unused cycles are refunded.

For exact pricing formulas, see the [cycles costs reference](../reference/cycles-costs.md).

## Limitations

- **HTTPS only.** Plain HTTP is not supported. The target server must have a valid TLS certificate.
- **2 MB response limit.** The maximum response body is 2,097,152 bytes. If the response exceeds `max_response_bytes`, the call fails.
- **Public endpoints only.** Canisters cannot reach localhost, private IP ranges (10.x.x.x, 192.168.x.x), or other non-routable addresses.
- **No streaming or WebSocket.** Outcalls are single request-response pairs. Long-lived connections are not supported.
- **~30-second timeout.** If the external server doesn't respond in time, the call fails.
- **Rate limiting.** All canisters on a subnet share the same IPv6 prefixes. If many canisters on the same subnet call the same server, they share its rate limit quota. Using API keys with per-key quotas mitigates this.
- **Shared API keys are visible to all replicas.** An API key stored in canister state is readable by every replica. A compromised replica could use the key to make entirely different, unauthorized requests to the external service — not just replay the canister's intended request. [TEE-enabled subnets](https://learn.internetcomputer.org/hc/en-us/articles/46124920595988-Trusted-Execution-Environments) mitigate this by running replicas in hardware-enforced enclaves, preventing node operators from reading canister memory. Consider deploying canisters that store sensitive credentials on a TEE-enabled subnet.

## HTTPS outcalls vs. oracles

| | HTTPS outcalls | Oracles |
|---|---|---|
| **Trust model** | Subnet replicas + target server only | Subnet + oracle provider(s) + target server |
| **Cost** | Cycle cost of the outcall only | Oracle fees + ingress message costs |
| **Latency** | Single round-trip (seconds) | Multiple hops: canister → oracle contract → oracle service → server → back (higher latency) |
| **Setup** | Call the management canister API directly | Deploy or integrate with oracle contract, configure oracle provider |
| **Decentralization** | Built into the subnet — no third parties | Depends on the oracle provider's architecture |

HTTPS outcalls can replace oracles for most use cases: price feeds, API queries, webhook notifications, and data verification. Oracles may still be useful if you need features like aggregated multi-source data feeds or historical data caching that an oracle provider maintains as a service.

## Future extensions

Two extensions are under consideration that may affect architecture decisions:

- **Flexible quorum:** A canister could specify that only a single replica (instead of all replicas) makes the request. This would solve the idempotency problem for POST requests and reduce rate-limit pressure on external servers.
- **Multiple responses:** Instead of consensus on a single response, the canister could receive all individual replica responses and resolve differences in application logic — useful for fast-moving data like price feeds.

## Next steps

- [HTTPS outcalls guide](../guides/backends/https-outcalls.md) — practical how-to with code examples in Motoko and Rust
- [Chain Fusion: Ethereum integration](../guides/chain-fusion/ethereum.md) — uses HTTPS outcalls via the EVM RPC canister
- [Cycles costs reference](../reference/cycles-costs.md) — detailed pricing formulas
- [Learn Hub: HTTPS Outcalls](https://learn.internetcomputer.org/hc/en-us/articles/34211194553492) — additional learning material

<!-- Upstream: informed by dfinity/portal docs/references/https-outcalls-how-it-works.mdx -->
