---
learn_hub_id: 34471579767572
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34471579767572-State-Synchronization"
learn_hub_title: "State Synchronization"
learn_hub_section: "Blockchain Protocol"
learn_hub_category: "How does ICP work?"
migrated: false
---

# State Synchronization

To allow nodes to efficiently join a subnet that is running already or to catch up with the current state in case they have been offline for some time, the protocol supports state synchronization without processing all messages that have ever been executed.

To this end, the protocol creates checkpoints of the entire subnet state periodically. The checkpoints are [certified](https://learn.internetcomputer.org/hc/en-us/articles/34208241927316) by the subnet through a signature on a Merkle-tree-like structure – the manifest – and made available as part of a catch-up package via the [Peer-to-Peer (P2P) layer](https://learn.internetcomputer.org/hc/en-us/articles/34207428453140). As the name already suggests, a catch-up package allows a node to catch up if it has fallen behind, e.g., because it was offline for some time. In addition, it allows new nodes to join, e.g., if the subnet is to grow in size or a node needs to be replaced because of a failure.

## Nodes that join the subnet

A new node can download the latest catch-up package and, after validating it, download the state corresponding to the checkpoint. Downloading the state requires the transfer of large amounts (gigabytes to terabytes) of data from the nodes’s peers. This is done efficiently and in parallel from all peers, by using a protocol that chunks the state and allows for different chunks to be downloaded from different peers. Every chunk is authenticated through the catch-up package individually through its hash. The tree-like structure of the manifest allows to verify each of these chunks individually relative to the root hash in the catch-up package. The chunking protocol is similar to the approach that Bittorrent uses for downloading large files from many peers.

Once the full state corresponding to the checkpoint has been authentically downloaded, the node catches up to the current block height by processing all the blocks that have been generated in the subnet since the checkpoint.

Without state synchronization, it becomes practically impossible for nodes to (re-)join in a busy subnet: they would need to replay all blocks from the very first block ever created on the subnet as it is done in other blockchains. Thanks to the state sync protocol allowing to download recent checkpoints, only few blocks need to be replayed as opposed to replaying every block from the start of the blockchain. This is important is that the IC is intended to have a high throughput of compute operations per time unit, much like cloud servers running their applications. Consider a subnet that has been running for multiple years with high CPU utilization. This would make it infeasible for a newly joining node to catch up with the subnet when trying to replay all blocks starting with the genesis block of the subnet as it would have to redo multiple CPU years worth of computation. Thus, state synchronization is a necessary feature for a blockchain that wants to operate successfully under real-world conditions where nodes do fail and need replacement.

## Nodes that are behind

If a node is not newly added, but only had a downtime or other performance degradation and needs to catch up, it may still have an older checkpoint. In this case, only the chunks different to the local checkpoint need to be downloaded, which can significantly reduce the volume of data transferred. 

The blockchain state is organized as a Merkle tree and can currently reach a size of up to a terabyte. The syncing node might already have most of the blockchain state and may not need to download everything. Therefore, the syncing node tries to download only the subtrees of the peers’ blockchain state that differ from its local state. The syncing node first requests for the children of the root of the blockchain state. The syncing node then recursively downloads the subtrees that differ from its local state.

![The catching-up replica only syncs the parts of the replicated state that differ from the up-to-date replica](https://csojb-wiaaa-aaaal-qjftq-cai.icp0.io/_astro/state-sync.CGBHsPNA_Z1fxTja.webp)

### Additional Information

[20min video on State Synchronization](https://www.youtube.com/watch?v=WaNJINjGleg&list=PLuhDt1vhGcrfHG_rnRKsqZO1jL_Pd970h&index=14&t=2s)

