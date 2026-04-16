---
title: "Canister Snapshots"
description: "Create, restore, and manage canister snapshots for backup and recovery"
sidebar:
  order: 5
---

Canister snapshots capture the full state of a canister — its compiled Wasm module, Wasm heap memory, stable memory, certified variables, and chunk store — at a specific point in time. You can restore a canister to a snapshot to roll back after a failed upgrade, recover from data corruption, or transfer state to another canister.

Only controllers of a canister can create or restore snapshots. Up to 10 snapshots per canister can be stored on-chain at a time.

## When to use snapshots

Snapshots are useful in three situations:

- **Pre-upgrade backup** — Take a snapshot before deploying an upgrade. If the upgrade introduces a bug or breaks state, restore the snapshot to roll back instantly.
- **Disaster recovery** — If a canister traps with an unrecoverable error and you have a snapshot, you can restore the canister to its last known-good state.
- **State transfer** — Download a snapshot to disk, then upload it to another canister. This is the foundation of canister migration between subnets.

## Creating a snapshot

A canister must be stopped before taking a snapshot. The `icp canister snapshot create` command returns a snapshot ID that you use to reference the snapshot later.

```bash
icp canister stop my-canister -e ic
icp canister snapshot create my-canister -e ic
icp canister start my-canister -e ic
```

The command prints the snapshot ID:

```
Created snapshot: 0000000000000000800000000010000a0101
```

To replace an existing snapshot instead of creating a new one, use `--replace`:

```bash
icp canister snapshot create my-canister --replace <snapshot-id> -e ic
```

This atomically replaces the old snapshot once the new one is created, which keeps you within the 10-snapshot limit without losing coverage.

## Listing snapshots

To see all snapshots for a canister:

```bash
icp canister snapshot list my-canister -e ic
```

The output shows each snapshot ID, its size, and when it was taken:

```
0000000000000000800000000010000a0101: 2.39MiB, taken at 2024-09-16 19:40:23 UTC
```

## Restoring from a snapshot

Restoring replaces the canister's current Wasm module, heap memory, stable memory, certified variables, and chunk store with the snapshot contents. Any state added after the snapshot was taken is discarded. The canister must be stopped before restoring.

```bash
icp canister stop my-canister -e ic
icp canister snapshot restore my-canister <snapshot-id> -e ic
icp canister start my-canister -e ic
```

## Deleting a snapshot

Remove a snapshot you no longer need:

```bash
icp canister snapshot delete my-canister <snapshot-id> -e ic
```

## Downloading and uploading snapshots

You can download a snapshot to disk for offline backup or to transfer state to a different canister.

### Downloading

```bash
icp canister snapshot download my-canister <snapshot-id> -o ./my-snapshot -e ic
```

The output directory contains:

| File | Description |
|------|-------------|
| `metadata.json` | Snapshot metadata (timestamps, sizes, chunk hashes) |
| `wasm_module.bin` | The canister's Wasm module |
| `wasm_memory.bin` | Wasm heap memory |
| `stable_memory.bin` | Stable memory |
| `wasm_chunk_store/` | Wasm chunk store files |

For large canisters, downloads may take time. If interrupted, resume with `--resume`:

```bash
icp canister snapshot download my-canister <snapshot-id> -o ./my-snapshot --resume -e ic
```

### Uploading

Upload a snapshot from disk to create a new snapshot on a canister:

```bash
icp canister snapshot upload my-canister -i ./my-snapshot -e ic
```

To replace an existing snapshot:

```bash
icp canister snapshot upload my-canister -i ./my-snapshot --replace <snapshot-id> -e ic
```

Like downloads, interrupted uploads can be resumed:

```bash
icp canister snapshot upload my-canister -i ./my-snapshot --resume -e ic
```

## Example: pre-upgrade backup and rollback

This workflow captures state before an upgrade so you can roll back if the upgrade fails:

```bash
# 1. Stop the canister and create a snapshot
icp canister stop my-canister -e ic
icp canister snapshot create my-canister -e ic
# Note the snapshot ID printed by the command
icp canister start my-canister -e ic

# 2. Deploy the upgrade
icp deploy my-canister -e ic

# 3. Verify the upgrade works
icp canister call my-canister health_check -e ic

# 4a. If the upgrade is good, clean up the snapshot
icp canister snapshot delete my-canister <snapshot-id> -e ic

# 4b. If the upgrade is bad, restore the snapshot
icp canister stop my-canister -e ic
icp canister snapshot restore my-canister <snapshot-id> -e ic
icp canister start my-canister -e ic
```

## Example: transferring state between canisters

Download a snapshot from a source canister and upload it to a target canister. This download-then-upload workflow is the foundation of canister migration between subnets — direct restore (`load_canister_snapshot`) only works within the same subnet, so cross-subnet transfer requires downloading the snapshot locally first and uploading it to the target.

All snapshot commands accept either canister names (with `-e`) or canister IDs (with `-n`). Use `-n ic` when the target canister is not part of your project.

```bash
# Download state from the source
icp canister stop source-canister -e ic
icp canister snapshot create source-canister -e ic
icp canister start source-canister -e ic
icp canister snapshot download source-canister <snapshot-id> -o ./state-backup -e ic

# Upload state to the target canister (use -n ic for a canister not in your project)
icp canister snapshot upload <target-canister-id> -i ./state-backup -n ic
# Note the new snapshot ID, then stop the target and restore
icp canister stop <target-canister-id> -n ic
icp canister snapshot restore <target-canister-id> <new-snapshot-id> -n ic
icp canister start <target-canister-id> -n ic
```

## Snapshot limits and storage costs

Each snapshot stores the full canister state and counts toward the canister's storage usage, which is billed in cycles. The platform supports up to 10 snapshots per canister. When you reach the limit, delete old snapshots or use `--replace` to replace them in one step.

To view how much storage your snapshots are using, check the `snapshots_size` field in `icp canister status`:

```bash
icp canister status my-canister -e ic
```

## Next steps

- [Canister lifecycle](lifecycle.md) — Understand how snapshots fit into the upgrade workflow
- [Canister upgrades security](../security/canister-upgrades.md) — Security considerations when using snapshot-based rollbacks
- [icp-cli canister snapshot reference](https://cli.internetcomputer.org/) — Full command reference for all snapshot subcommands

<!-- Upstream: informed by dfinity/icp-cli docs/guides/canister-snapshots.md; dfinity/portal docs/building-apps/canister-management/snapshots.mdx -->
