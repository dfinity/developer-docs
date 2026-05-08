---
title: "State Synchronization"
description: "How ICP nodes join or re-join a subnet by downloading certified checkpoints instead of replaying the full block history."
sidebar:
  order: 5
---

State synchronization allows nodes to join a running subnet or recover from downtime without replaying every message ever executed. Instead, the protocol creates periodic certified checkpoints that capture a complete snapshot of the subnet state. A node that needs to catch up downloads a recent checkpoint and replays only the blocks produced since that checkpoint.

Checkpoints are certified by the subnet through a signature over a Merkle-tree manifest (see [Message routing: per-checkpoint certification](message-routing.md#per-checkpoint-certification)). They are made available to other nodes via the [peer-to-peer layer](peer-to-peer.md) as part of a [**catch-up package**](../../references/glossary.md#catch-up-package-cup).

## Joining nodes

A new node downloads the latest catch-up package, validates it, and then downloads the corresponding state. This involves transferring potentially gigabytes to terabytes of data. The transfer is done efficiently and in parallel from multiple peers: the state is chunked, each chunk is authenticated individually through its hash in the manifest's Merkle tree, and different chunks can be downloaded from different peers simultaneously. This approach is similar to BitTorrent.

Once the full checkpoint state is downloaded and authenticated, the node replays the blocks produced since that checkpoint to reach the current block height.

Without state synchronization, joining a busy subnet would be impractical. A node would need to replay every block from the subnet's genesis, potentially amounting to years of CPU computation on a subnet that has been running with high utilization. State synchronization makes this feasible by limiting replay to only recent blocks.

## Recovering nodes

A node that was temporarily offline may still hold an older checkpoint. In this case, only the chunks that differ from its local checkpoint need to be downloaded, which can significantly reduce the volume of data transferred.

The subnet state is organized as a Merkle tree and can reach up to a terabyte in size. A recovering node first requests the children of the root of the state tree from its peers. It then recursively downloads only the subtrees that differ from its local state, skipping the parts it already has.

This incremental approach ensures that a recovering node transfers the minimum amount of data needed to rejoin the subnet, rather than downloading the full state again.

![The catching-up replica only syncs the parts of the replicated state that differ from the up-to-date replica](/concepts/protocol/state-sync.webp)

## Further reading

- [Message routing](message-routing.md): how checkpoints and state certification work
- [Peer-to-peer](peer-to-peer.md): the broadcast layer used to transfer checkpoint chunks

<!-- Upstream: informed by Learn Hub article "State Synchronization" (migrated, source retired) -->
