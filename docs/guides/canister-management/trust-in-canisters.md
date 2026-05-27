---
title: "Trust in canisters"
description: "How to evaluate whether a canister is safe to interact with: code verification, build reproducibility, controller trust, and immutability options"
sidebar:
  order: 11
---

Applications that handle token transfers, financial transactions, or other sensitive operations require that users trust the canister to act honestly and reliably. This guide explains how to assess whether a canister you did not write is safe to interact with.

Two questions matter:

1. Does the canister do what it claims to do?
2. Will its behavior stay that way?

## Does the canister do what it claims?

### Inspect the source code

If the developer published source code, review it to confirm it implements the claimed functionality and nothing else. Source code alone is not sufficient: you also need to confirm that the running Wasm was compiled from that source.

### Verify the Wasm hash

ICP exposes the SHA-256 hash of every canister's deployed Wasm module. If the developer published source code and documented build instructions, you can reproduce the build yourself and compare hashes:

1. Get the deployed hash:

```bash
icp canister status <canister-id> -e ic
```

2. Reproduce the build from the published source following the developer's instructions.
3. Compute the SHA-256 hash of the rebuilt Wasm and compare it to the deployed hash.

A matching hash confirms the running code was compiled from the published source. For this to be meaningful, the build must be reproducible: the same source must produce a byte-identical Wasm binary every time. See [Reproducible builds](./reproducible-builds.md) for how to structure a project for this.

### Track Wasm hash changes with canister history

Every canister keeps a record of at least its 20 most recent changes, including code installations, upgrades, reinstalls, and controller changes. You can use this history to check whether a canister's Wasm hash has changed over time and, if so, when.

See [Canister lifecycle](./lifecycle.md#canister-history) for how to query canister history programmatically and with the `icp` CLI.

## Will the canister behavior stay that way?

Even if a canister runs correct code today, its controllers can upgrade it to different code at any time. The second question is about governance: who controls the canister, and how decentralized is that control?

### Verify the controller list

Retrieve the current controller list:

```bash
icp canister status <canister-id> -e ic
```

You can also retrieve controller information programmatically via a [`read_state` request](../../references/ic-interface-spec/https-interface.md#http-read-state) to the IC management interface.

If the controller list contains a single developer identity, that developer has complete authority to change the canister code and any assets it holds at any time. This is the lowest trust level.

### The trust spectrum

| Controller type | Trust level | Notes |
|-----------------|-------------|-------|
| Single developer identity | Lowest | One person can change or delete the canister at any time |
| Multi-sig (e.g. Orbit) | Medium | Multiple parties must agree before changes take effect |
| [SNS (Service Nervous System)](../../concepts/sns-framework.md) | High | Governance is enforced by the network; changes require a community vote with token-weighted approval |
| Black-holed | Highest | No controller can change the code; the canister is permanently immutable |

In all cases, the trust requirements flow to the controller. If an SNS governs the canister, review the SNS configuration and token distribution to assess how decentralized the governance actually is. An SNS with a heavily concentrated token supply provides weaker guarantees than a broadly distributed one.

Note that even with decentralized governance, assets held by a canister are under the control of whoever controls the canister. Before interacting with a canister that holds your assets, understand what governance controls apply and who participates in it.

### Black-holed canisters

A canister can be made permanently immutable in two ways:

**No controllers.** Setting the controller list to empty means no one can upgrade, reinstall, or delete the canister. Only the NNS can uninstall it via a proposal, and only in exceptional circumstances. If a canister has an empty controller list, no external party can ever change its code.

**Black hole canister as controller.** The ["black hole" canister](https://github.com/ninegua/ic-blackhole) (`e3mmv-5qaaa-aaaah-aadma-cai`) has only itself as a controller and accepts no upgrade instructions. Passing control to it makes the subject canister permanently immutable while still allowing third parties to query useful information (such as the cycles balance) via the black hole interface. The black hole canister is thoroughly documented and its Wasm is independently verifiable.

**Important caveat.** A canister that lists itself as its own controller appears immutable, but may not be. If the canister contains code that can call `install_code` or `reinstall_code` on itself, it can change its own Wasm without any external controller action. Before treating a self-controlled canister as immutable, inspect the source code to confirm it contains no such call paths. Reproducible builds are essential here: code inspection is only meaningful if you can confirm the inspected source matches what is running.

## Related

- [Reproducible builds](./reproducible-builds.md): structuring a project so users can independently verify the deployed Wasm hash
- [Canister lifecycle](./lifecycle.md#canister-history): querying canister history to track Wasm hash changes over time
- [Canister control](../../guides/security/canister-control.md): governance and decentralization recommendations for canister operators

<!-- Upstream: informed by dfinity/portal docs/building-apps/best-practices/trust-in-canisters.mdx -->
