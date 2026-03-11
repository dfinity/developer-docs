---
title: "Canister Settings"
description: "Configure controllers, memory limits, and compute allocation for canisters."
sidebar:
  order: 2
doc_type: how-to
level: intermediate
features: []
icskills: []
last_verified: 2026-03-10
---

Every canister has configurable settings that control its behavior. Only a controller of the canister can read or modify these settings.

## Viewing settings

```bash
icp canister status my_canister
```

This returns the canister's status, controllers, memory usage, cycle balance, and all configured settings.

You can also query settings programmatically by calling the `canister_status` method on the management canister.

## Modifying settings

```bash
icp canister update-settings my_canister --<setting-name> <value>
```

Or call the [`update_settings`](https://internetcomputer.org/docs/references/ic-interface-spec#ic-update_settings) endpoint of the management canister from within canister code.

## Controllers

Controllers are principals (user identities or other canisters) that have full administrative rights over a canister. A canister can have multiple controllers or none.

Actions restricted to controllers:

- Installing, upgrading, and reinstalling code
- Starting and stopping the canister
- Reading canister status and cycle balance
- Updating settings
- Deleting the canister

```bash
# Add a controller
icp canister update-settings my_canister --add-controller <principal-id>

# Remove a controller
icp canister update-settings my_canister --remove-controller <principal-id>
```

A canister with no controllers is **immutable** (sometimes called "blackholed") and cannot be upgraded or deleted.

### Common control models

| Model | Description |
|-------|-------------|
| Developer | Single developer or team with direct control |
| MultiSig | Requires multiple signatures via a threshold canister |
| DAO (SNS) | Upgrades governed by community vote |
| No controller | Immutable canister; code cannot change |

## Compute allocation

Compute allocation reserves a percentage of an execution core for the canister, guaranteeing it will be scheduled regularly. The default is **0%** (best-effort scheduling).

```bash
icp canister update-settings my_canister --compute-allocation 50
```

A value of `50` means the canister gets 50% of a core and is scheduled at least every other round. Allocated compute incurs a rental fee regardless of actual usage.

## Memory allocation

Memory allocation pre-reserves a fixed amount of memory (in bytes) for the canister. The default is **0** (on-demand allocation).

```bash
icp canister update-settings my_canister --memory-allocation 1073741824
```

Pre-allocated memory incurs a rental fee. If actual usage exceeds the allocation, additional memory is allocated on demand and may fail if the subnet is at capacity.

## Freezing threshold

The freezing threshold (in seconds) defines how long the canister should be able to survive on its current cycle balance without executing. When the balance drops below this threshold, the canister is frozen and stops processing messages.

The default is **2,592,000 seconds** (approximately 30 days).

```bash
icp canister update-settings my_canister --freezing-threshold 5184000
```

If a canister runs out of cycles after the freezing threshold expires, it is **uninstalled** -- its code and data are deleted, but the canister ID and metadata remain.

## Wasm memory limit

Sets a soft limit (in bytes) on 32-bit Wasm memory to prevent canisters from hitting the 4 GiB hard limit:

```bash
icp canister update-settings my_canister --wasm-memory-limit 3221225472
```

This limit is enforced for update messages (up to the first `await`) and `canister_init`/`post_upgrade`. It is not enforced for queries, response callbacks, or `pre_upgrade` to avoid blocking recovery paths.

## Reserved cycles limit

Caps how many cycles can be set aside for future resource payments via the resource reservation mechanism. Default is **5 trillion cycles**.

```bash
icp canister update-settings my_canister --reserved-cycles-limit 5000000000000
```

## Log visibility

Controls who can read the canister's logs. Options are `controllers` (default) or `public`.

```bash
icp canister update-settings my_canister --log-visibility public
```

See [Canister logs](/guides/canisters/logs/) for details on logging and log viewer allow lists.

## Next steps

- [Canister lifecycle](/guides/canisters/lifecycle/) -- create, deploy, upgrade, and delete canisters
- [Canister settings reference](https://dfinity.github.io/icp-cli/reference/canister-settings/) -- all configurable canister settings
