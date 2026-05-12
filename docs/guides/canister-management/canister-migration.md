---
title: "Canister migration"
description: "Move a canister to a different subnet while preserving its state, with or without keeping the original canister ID"
sidebar:
  order: 10
---

Moving a canister to a different subnet is sometimes necessary: the canister was deployed to the wrong subnet, geographic or replication requirements have changed, or you need to consolidate canisters for efficient inter-canister calls. This guide covers both migration paths depending on whether you can accept a new canister ID.

## When to migrate

Consider migrating a canister when:

- **Wrong subnet**: the canister was deployed to an unintended subnet. See [Subnet selection](subnet-selection.md) for how to target subnets at deployment time.
- **Geographic requirements**: a subnet in a specific region is now required for data residency compliance.
- **Replication needs**: moving to a larger subnet (such as the fiduciary subnet) for stronger fault tolerance.
- **Colocation**: consolidating canisters onto the same subnet to reduce inter-canister call latency.

## Choosing your approach

Your options depend on whether the canister ID can change:

| Approach | State | Canister ID | Source canister | Complexity |
|---|---|---|---|---|
| [Snapshot transfer](#migrating-without-preserving-the-canister-id) | Preserved | New ID | Retained | Moderate |
| [Full migration](#migrating-with-the-canister-id) | Preserved | Preserved | Deleted | Advanced |

**Snapshot transfer** is the simpler path and is appropriate when you can accept a new canister ID. Create a new canister on the desired subnet, transfer state via snapshots, and switch over. The source canister is retained and can be deleted afterward.

**Full migration** is required when the canister ID must be preserved. The canister ID must not change when:

- **Threshold signatures (tECDSA / tSchnorr)**: The IC derives signing keys by cryptographically binding them to the calling canister's principal. Any Bitcoin or Ethereum addresses derived from those keys are permanently tied to the original canister ID. Changing the ID means losing access to those signing keys and any assets they control.
- **vetKeys**: vetKey derivation includes the canister's principal. A new ID produces entirely different decryption keys, making previously encrypted data permanently inaccessible.
- **External references**: Other canisters, frontends, or off-chain systems that reference the canister by ID will break. This includes Internet Identity: users who authenticated via a canister-ID-based domain (for example, `<canister-id>.icp0.io`) will lose access to their sessions.

:::danger
If your canister uses threshold signatures (tECDSA / tSchnorr) or vetKeys, snapshot transfer splits state from keys: the target canister gets a new ID and therefore different signing and decryption keys. Any Bitcoin or Ethereum addresses and any encrypted data tied to the original canister ID become inaccessible from the new canister.

You still have a recovery window: the source canister is retained after snapshot transfer, so the original keys remain accessible through it. Stop the target, switch back to the source, and perform full migration instead. Do this before deleting the source canister. Once the source is deleted, those keys and any assets or data tied to them are permanently gone.
:::

## Migrating without preserving the canister ID

Use this approach when you can accept a new canister ID. The source canister remains on its original subnet until you explicitly delete it; there is no irreversible step and no minimum cycle requirement.

### 1. Create a target canister

Create a new canister on the desired subnet. The `--detached` flag creates the canister without recording it in your project configuration, which is useful here since this is a temporary migration target:

```bash
icp canister create --detached -e ic --subnet <target-subnet-id>
```

Note the canister ID printed in the output. Add `--quiet` to print only the ID, which is useful for scripting.

### 2. Transfer state via snapshots

See [Canister snapshots](snapshots.md#downloading-and-uploading-snapshots) for full details on resuming interrupted transfers.

```bash
# Stop and snapshot the source canister
icp canister stop my-canister -e ic
icp canister snapshot create my-canister -e ic

# Download the snapshot locally
icp canister snapshot download my-canister <snapshot-id> -o ./migration-snapshot -e ic

# Upload and restore on the target canister
icp canister snapshot upload <target-id> -i ./migration-snapshot -n ic
icp canister snapshot restore <target-id> <new-snapshot-id> -n ic
```

### 3. Copy settings

Snapshots capture the Wasm module and memory, but not canister settings. Check the source canister's current settings and apply any non-default values to the target:

```bash
icp canister settings show my-canister -e ic

# Apply non-default settings to the target canister
icp canister settings update <target-id> \
  --compute-allocation 10 \
  --freezing-threshold 604800 \
  -n ic
```

Run `icp canister settings update --help` for a full list of available settings.

### 4. Switch over

Start the target canister:

```bash
icp canister start <target-id> -n ic
```

The source canister is still stopped on its original subnet. Manage it before updating the project mapping, while `my-canister` still refers to it:

```bash
# Delete it if no longer needed
icp canister delete my-canister -e ic
```

Update your project to point `my-canister` to the new ID. icp-cli stores canister IDs in `.icp/data/mappings/<environment>.ids.json` (mainnet) or `.icp/cache/mappings/<environment>.ids.json` (local). Edit the file:

```json
{
  "my-canister": "<target-id>"
}
```

Update any other canisters, frontends, or off-chain systems that reference the old canister ID.

## Migrating with the canister ID

Use this approach when the canister ID must be preserved. This adds an ID migration step using `icp canister migrate-id`, which moves the canister ID from the source to the target on the new subnet.

> **Important:** `icp canister migrate-id` moves only the canister ID. It does **not** transfer state, settings, or cycles. If you skip the preparation steps below, the canister's Wasm module, memory, and stable memory will be lost. The source canister is permanently deleted and its cycles are burned when the migration completes.

### How the ID migration works

`icp canister migrate-id` tells the NNS migration canister to:

1. Rename the target canister to have the source canister's ID
2. Update the IC routing table so the source canister ID now resolves to the target's subnet
3. Delete the source canister from its original subnet; all remaining cycles are burned
4. Restore the source canister's original controllers on the target

After this process:

- **Source canister**: permanently deleted; its cycles are burned and its ID now lives on the target's subnet
- **Target canister**: continues on the same subnet under the source canister's ID, with the state, cycles, and settings it had before migration (controllers are replaced by those restored from the source)
- **Target canister's original ID**: ceases to exist permanently

Because the target canister's state is what survives, you must transfer state via snapshots before running `migrate-id`.

### 1. Create a target canister

Create a new canister on the desired subnet:

```bash
icp canister create --detached -e ic --subnet <target-subnet-id>
```

Note the canister ID from the output. Immediately top up the target canister with enough cycles for ongoing operation. The source canister's cycles are burned during migration and are not transferred:

```bash
icp canister top-up <target-id> --amount 5T -n ic
```

### 2. Transfer state via snapshots

Stop the source canister, create a snapshot, download it, upload it to the target, and restore it:

```bash
# Stop and snapshot the source canister
icp canister stop my-canister -e ic
icp canister snapshot create my-canister -e ic

# Download the snapshot locally
icp canister snapshot download my-canister <snapshot-id> -o ./migration-snapshot -e ic

# Upload the snapshot to the target canister
icp canister snapshot upload <target-id> -i ./migration-snapshot -n ic

# Restore on the target (use the new snapshot ID from the upload output)
icp canister snapshot restore <target-id> <new-snapshot-id> -n ic
```

After restoring, the target has the same Wasm module, memory, and stable memory as the source.

**Delete the snapshot on the target.** The `migrate-id` command requires the target to have no snapshots before it will proceed:

```bash
icp canister snapshot delete <target-id> <new-snapshot-id> -n ic
```

For large canisters, downloads and uploads may take time. If interrupted, resume with `--resume`. See [Canister snapshots](snapshots.md#downloading-and-uploading-snapshots) for details.

### 3. Copy settings

Snapshots capture the Wasm module and memory, but not canister settings. Controllers are automatically restored from the source during ID migration, but other settings must be copied manually:

```bash
icp canister settings show my-canister -e ic

# Apply non-default settings to the target (controllers are restored automatically; do not copy them)
icp canister settings update <target-id> \
  --compute-allocation 10 \
  --freezing-threshold 604800 \
  --wasm-memory-limit 2GiB \
  -n ic
```

### 4. Stop the target canister

Both canisters must be stopped before the ID migration. The source is already stopped from step 2, so only the target needs stopping:

```bash
icp canister stop <target-id> -n ic
```

### 5. Migrate the canister ID

Run the migration. The `--replace` flag accepts canister names or principals:

```bash
icp canister migrate-id my-canister --replace <target-id> -e ic
```

The command validates prerequisites (different subnets, both stopped, sufficient cycles, no snapshots on target), asks for confirmation (skip with `-y`), adds the NNS migration canister as a controller of both canisters, initiates the migration, and polls for completion.

> **Cycles warning:** The source canister requires a minimum cycle balance before migration can proceed. All remaining cycles on the source are burned when it is deleted. If the source has a large cycle balance, consider reducing it before migrating. The command warns you if the balance is high enough to warrant attention.

### 6. Start and verify

Start the canister to resume operation:

```bash
icp canister start my-canister -e ic
```

Verify the canister is on the expected subnet by querying the NNS Registry canister:

```bash
icp canister call rwlgt-iiaaa-aaaaa-aaaaa-cai get_subnet_for_canister \
  '(record { "principal" = opt principal "<canister-id>" })' --query -n ic
```

### 7. Clean up

The NNS migration canister is added as a controller during ID migration and is not automatically removed. Remove it if you want a clean controller set:

```bash
# Check current controllers
icp canister settings show my-canister -e ic

# Remove the NNS migration canister
icp canister settings update my-canister --remove-controller sbzkb-zqaaa-aaaaa-aaaiq-cai -e ic
```

Delete the local snapshot directory once you have verified the migration succeeded:

```bash
rm -rf ./migration-snapshot
```

### Handling interruptions

If the `migrate-id` command is interrupted or times out (the default timeout is 12 minutes), the migration continues on the network. Use `--resume-watch` to reconnect:

```bash
icp canister migrate-id my-canister --replace <target-id> --resume-watch -e ic
```

This skips validation and initiation and resumes polling migration status. To exit early without waiting, use `--skip-watch` and then `--resume-watch` later to verify completion.

## Troubleshooting

### "Canister is not ready for migration"

The canister has not finished preparing. Wait a few seconds and retry.

### "Canisters are on the same subnet"

`migrate-id` requires canisters on different subnets. Create a new target on the desired subnet:

```bash
icp canister create --detached -e ic --subnet <target-subnet-id>
```

### "Target canister has snapshots"

Delete all snapshots on the target before running `migrate-id`:

```bash
icp canister snapshot list <target-id> -n ic
icp canister snapshot delete <target-id> <snapshot-id> -n ic
```

### Insufficient cycles on source

The source canister must meet a minimum cycle balance for migration. Top it up:

```bash
icp canister top-up my-canister --amount 1T -e ic
```

### Migration timed out

The 12-minute timeout does not cancel the migration. Use `--resume-watch` to continue monitoring:

```bash
icp canister migrate-id my-canister --replace <target-id> --resume-watch -e ic
```

## Next steps

- [Subnet selection](subnet-selection.md): Choose the right subnet at deployment time to avoid needing to migrate
- [Canister snapshots](snapshots.md): Full reference for creating, downloading, uploading, and restoring snapshots
- [Canister settings](settings.md): Settings that snapshots do not capture and that must be copied manually
- [Cycles management](cycles-management.md): Understand cycle costs before and after migration

<!-- Upstream: informed by dfinity/icp-cli docs/guides/canister-migration.md; dfinity/icp-cli docs/reference/cli.md -->
