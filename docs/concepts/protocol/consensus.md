---
title: "Consensus"
description: "How ICP subnets reach agreement on message ordering through block making, notarization, and finalization."
---

The consensus protocol allows every node in a subnet to agree on which messages to process and in what order. Each subnet runs its own independent instance of the protocol. The output of each consensus round is a single finalized block of ordered messages that every node then executes deterministically, producing the same state transition on each.

ICP's consensus is designed to meet three requirements:

- **Low latency.** Blocks are finalized in roughly one second, achieving near-instant finality.
- **High throughput.** Many messages can be included in each block.
- **Robustness.** The protocol degrades gracefully under node or network failures, maintaining safety regardless of message delivery timing.

## Cryptographic finality

ICP provides cryptographic finality rather than probabilistic finality. Probabilistic finality considers a block final only after enough subsequent blocks have built on top of it. ICP avoids this approach for two reasons: probabilistic finality is a weak guarantee, and it would substantially increase the time before a message response can be trusted.

The ICP consensus protocol achieves cryptographic finality while making minimal assumptions about the network. Safety does not depend on any bound on message delivery time (the protocol only assumes an asynchronous network). For a globally distributed network, synchrony is not a realistic assumption. When messages do arrive promptly, the protocol makes progress with good latency. Correctness is always guaranteed regardless of message delays, as long as fewer than one third of subnet nodes are faulty.

## Consensus rounds

The protocol maintains a tree of notarized blocks, with a special genesis block at the root. The protocol proceeds in rounds. Each round adds at least one new notarized block to the tree as a child of a notarized block from the previous round. When things proceed normally, exactly one notarized block is added and it is immediately finalized. Once a block is finalized, all of its ancestors are implicitly finalized. The protocol guarantees a unique chain of finalized blocks. This chain is the output of consensus.

A consensus round has three phases.

### Block making

In every round, one or more nodes called block makers propose a block. Each block contains a reference to a notarized block from the previous round, ingress messages submitted by users, and XNet messages received from other subnets.

Block makers are selected through a random permutation of subnet nodes, using randomness derived from a random beacon produced by [chain-key cryptography](../chain-key-cryptography.md). The permutation assigns a rank to each node. The lowest-rank node acts as the primary block maker and broadcasts its proposal to all subnet nodes.

If the primary block maker is faulty or the network is slow and no notarized block appears within a timeout, nodes of increasing rank step in to propose blocks. The protocol guarantees that one block eventually gets notarized in every round.

### Notarization

When a node receives a block proposal, it validates it for syntactic correctness. If valid, the node broadcasts the block along with a notarization share: a BLS multi-signature share. A block becomes notarized when at least two thirds of subnet nodes have submitted notarization shares for it. These shares can be aggregated into a compact notarization.

If the primary block maker's proposal is notarized within the timeout, a node will not support the notarization of any other block in that round. Otherwise, a node may support notarization of blocks from higher-rank block makers (but only up to the highest rank it has already committed to).

### Finalization

Once a node obtains a notarized block, it will not subsequently support notarization of any other block in that round. If the node had not previously supported notarization of any other block, it also broadcasts a finalization share for this block. A block is finalized when at least two thirds of nodes have submitted finalization shares.

This rule guarantees that if a block is finalized in a given round, no other notarized block exists in that round: the chain remains unique.

## Further reading

- [Protocol Stack](index.md): how consensus fits into the four-layer architecture
- [DFINITY Consensus blog post](https://medium.com/dfinity/achieving-consensus-on-the-internet-computer-ee9fbfbafcbc)
- [Consensus white paper](https://eprint.iacr.org/2021/632.pdf)
- [Extended abstract published at PODC '22](https://assets.ctfassets.net/ywqk17d3hsnp/1Gutwfrd1lMgiUBJZGCdUG/d3ea7730aba0a4b793741681463239f5/podc-2022-cr.pdf)

<!-- Upstream: informed by Learn Hub article "Consensus" (migrated, source retired) -->
