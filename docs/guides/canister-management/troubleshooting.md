---
title: "Troubleshooting"
description: "Diagnose and resolve common issues: latency problems, frontend errors, Wasm build failures, and security policy warnings"
sidebar:
  order: 12
---

This guide covers common issues encountered when developing and deploying canisters on ICP. For language-specific issues, see the [Motoko](../../languages/motoko/index.md) and [Rust](../../languages/rust/index.md) language docs.

## Problem: High query or update call latency

On subnets with low load, query calls return in approximately 100 milliseconds and update calls complete in approximately 2 seconds. If your application experiences higher latency than this, the subnet may be under load or the canister may need tuning.

### Identify your canister's subnet load

1. Find your canister's subnet on the [ICP dashboard](https://dashboard.internetcomputer.org/canisters) by searching for the canister ID.
2. Navigate to the subnet details and check the "Million Instructions Executed Per Second" metric.
3. Compare this to other subnets. If your subnet consistently shows high instruction throughput relative to others, it may be a source of latency.

You can also retrieve subnet metrics programmatically using an [HTTPS outcall](../../guides/backends/https-outcalls.md) from a canister to the system state tree, which includes canister count and subnet state.

### Consider compute allocation

A compute allocation of 1% guarantees your canister is scheduled for execution in at least 1 out of every 100 consensus rounds, which prevents latency spikes caused by competing canisters on the same subnet.

Set compute allocation in `icp.yaml`:

```yaml
canisters:
  backend:
    compute_allocation: 1
```

Or update an existing canister:

```bash
icp canister settings update backend --compute-allocation 1 -e ic
```

Note that compute allocation incurs a rental fee regardless of actual canister activity. See [Canister settings](./settings.md#compute-allocation) for cost details.

### Consider migrating to a less-loaded subnet

If the subnet consistently shows high load and compute allocation alone does not resolve the latency, migrating your canister to a less-loaded subnet may be the most effective remedy. Subnets process messages independently, so a canister on a busy subnet competes with every other canister on that subnet regardless of its compute allocation.

Check current subnet loads on the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) to identify subnets with available capacity. For how to migrate a canister to a different subnet, see [Subnet selection](./subnet-selection.md#canister-is-on-the-wrong-subnet).

### Use query calls instead of update calls where appropriate

Query calls skip consensus and return in milliseconds. If a method only reads state and the data does not need to be tamperproof, use a `query` method instead of an update method.

For applications that require tamperproof reads (for example, a frontend that displays financial data), use certified variables instead of reducing to basic query calls. See [Certified variables](../backends/certified-variables.md) for how to serve verifiable query responses.

### Avoid unnecessary system API calls in queries

In query calls, avoid calling `balance()` and `time()` unless they are required for the response. These system API calls add overhead on every invocation.

### Retrieve boundary node information for support escalation

If latency problems persist and you need to escalate to DFINITY, include the boundary node address and request ID:

1. Open your browser's developer tools and go to the **Network** tab.
2. Trigger a call to your canister.
3. Find the request in the network log. The boundary node IP address appears as the **Remote Address**.
4. The request ID appears as the `X-Request-Id` response header.

Include both values when reporting latency issues.

## Problem: Latency when reading data

Query calls that read from stable memory are slower than those that read from heap memory. If a hot query path reads frequently accessed values from stable memory, consider caching those values in heap memory as a `transient` variable (Motoko) or a `thread_local!` `RefCell<T>` (Rust).

This is a trade-off: cached heap values are lost on upgrade and must be re-initialized in `post_upgrade`. Use caching only for data that is expensive to read repeatedly and safe to reconstruct.

## Problem: Slow inter-canister calls

Inter-canister calls use async messaging and incur at least one additional consensus round of latency. If an inter-canister call is made on the hot path of a query, this makes the query as slow as an update call.

Design considerations:

- **Skip the inter-canister call when possible.** If data from another canister can be cached locally and refreshed on a schedule via a timer, avoid the synchronous call entirely.
- **Move the call off the critical path.** If the result of an inter-canister call is not needed to return an immediate response, trigger it asynchronously and return results via a subsequent query.

For patterns around bounded and unbounded inter-canister calls, see [Inter-canister calls](../canister-calls/inter-canister-calls.md).

## Problem: Frontend shows a blank screen with "Failed to load resource"

A frontend deployed to the mainnet returns a blank screen and the browser console shows "Failed to load resource" errors.

**Check for client-side firewall or proxy interference.** Some corporate firewalls and browser extensions block requests to `*.icp0.io` or `*.ic0.app` domains. If the frontend loads on a different network, a firewall or proxy is the likely cause.

**Verify the asset canister is deployed correctly.** Run `icp canister status <canister-name> -e ic` and confirm the module hash is populated. If the hash is `None`, the canister exists but has no code installed.

## Problem: Frontend violates Content Security Policy

The browser console shows an error like:

```
Refused to connect to 'https://ic0.app/api/v2/canister/<canister-id>/read_state'
because it violates the document's Content Security Policy.
```

This happens when the asset canister was installed without the current security headers, or when the CSP headers have drifted out of sync with the deployed code.

**Fix:** reinstall the asset canister to refresh the CSP headers:

```bash
icp deploy <frontend-canister-name> --mode reinstall -e ic
```

After reinstall, the asset canister serves updated security headers on every request.

## Problem: Security policy warning "This project does not define a security policy for some assets"

This warning appears when your project includes an asset canister but `.ic-assets.json5` does not define a security policy.

**Fix:** add a security policy to `.ic-assets.json5` in your frontend asset directory:

```json5
[
  {
    "match": "**/*",
    "security_policy": "standard"
  }
]
```

The `standard` policy applies a default Content Security Policy and security headers. If these headers block functionality your application needs (for example, loading resources from a specific external domain), override the relevant headers individually:

```json5
[
  {
    "match": "**/*",
    "security_policy": "standard",
    "headers": {
      "Content-Security-Policy": "default-src 'self' https://example.com; ..."
    }
  }
]
```

See [Asset canister](../frontends/asset-canister.md#ic-assets-json5) for the full `.ic-assets.json5` reference.

## Problem: Rust canister fails to install with "invalid import section"

Deploying a Rust canister returns an error indicating the Wasm module has an invalid import section:

```
Error: Failed to install code in canister ...
Caused by: Wasm module has an invalid import section
```

**Cause:** one or more crates in your dependency tree assume that certain standard library functions (such as `std::time` or file system calls) are available in `wasm32-unknown-unknown` targets. The IC Wasm runtime does not provide these functions, so the Wasm module imports them and the install is rejected.

**Fix:**

1. Find the crate causing the issue. Add `--target wasm32-unknown-unknown` to your `cargo build` command and look for linker errors that name unavailable imports.

2. Check whether the crate offers a feature flag to disable non-Wasm dependencies (for example, `features = ["no-std"]` or `default-features = false`).

3. Replace the crate with an alternative that targets `no_std` or `wasm32-unknown-unknown` explicitly. Many standard library crates have `wasm`-compatible alternatives on crates.io.

4. If the crate is a transitive dependency, pin the version or use `[patch.crates-io]` in `Cargo.toml` to substitute a compatible fork.

## Related

- [Canister settings](./settings.md): compute allocation, memory allocation, and freezing threshold
- [Subnet selection](./subnet-selection.md): choosing a subnet when latency is a deployment constraint
- [Optimization](./optimization.md): reducing Wasm binary size and cycle costs
- [Asset canister](../frontends/asset-canister.md): frontend deployment and `.ic-assets.json5` configuration
- [Certified variables](../backends/certified-variables.md): tamperproof query responses

<!-- Upstream: informed by dfinity/portal docs/building-apps/best-practices/troubleshooting.mdx; dfx-centric content excluded, fully rewritten for icp CLI -->
