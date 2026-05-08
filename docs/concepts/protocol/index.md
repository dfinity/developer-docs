---
title: "Protocol Stack"
description: "The four-layer architecture that every ICP subnet runs: peer-to-peer, consensus, message routing, and execution."
---

The Internet Computer is created by the Internet Computer Protocol (ICP), which gives the network its name. ICP consists of multiple subnets, with each subnet running its own instance of the protocol stack. Each subnet hosts canisters and executes messages sent to them by users or by other canisters (which may be hosted on the same or a different subnet).

A message addressed to a canister is executed by every node in the corresponding subnet. Execution updates the canister state. To keep state in sync across all nodes, every node must execute the same messages in the same order: fully deterministically. This replicated state machine property is the core of what makes ICP a trustworthy execution environment.

## Four-layer architecture

Each node runs a replica process structured in four layers:

1. [Peer-to-peer](peer-to-peer.md): secure and reliable message broadcast between nodes
2. [Consensus](consensus.md): agreement on which messages to process and in what order
3. [Message routing](message-routing.md): delivery of messages to canister input queues and state certification
4. [Execution](execution.md): deterministic execution of canister code

The lower two layers (peer-to-peer and consensus) are responsible for agreeing, each round, on a block of messages. The upper two layers (message routing and execution) deterministically process that block on every node.

At the start of a round, all honest nodes hold identical state: the replicated state of the subnet, which includes the current state of every canister hosted there. By executing the messages in a finalized block in a completely deterministic way, every node reaches the same resulting state.

## Cross-subnet messaging

Canisters communicate with each other regardless of whether they share a subnet. The protocol handles both:

- **Intra-subnet messages.** Messages between canisters on the same subnet do not go through consensus. They are placed directly into the target canister's input queue and scheduled for execution. This makes local inter-canister calls faster in terms of latency and throughput.
- **Cross-subnet messages (XNet).** Messages to canisters on other subnets flow through the XNet stream. The originating subnet certifies these messages using [chain-key cryptography](../chain-key-cryptography.md), and block makers on the receiving subnet validate the certificate and include the messages in a block.

## State synchronization

To allow nodes to efficiently join a running subnet or catch up after downtime, the protocol supports [state synchronization](state-synchronization.md). Rather than replaying every message ever executed, a new or recovering node downloads a recent certified checkpoint and replays only the blocks produced since that checkpoint.

## Further reading

- [Peer-to-peer](peer-to-peer.md): Abortable Broadcast and QUIC transport
- [Consensus](consensus.md): block making, notarization, and finalization in detail
- [Message routing](message-routing.md): induction, XNet streaming, and state certification
- [Execution](execution.md): WebAssembly execution, deterministic time slicing, and cycles
- [State synchronization](state-synchronization.md): catch-up packages and incremental sync
- [Performance](performance.md): throughput, latency, and mainnet benchmark figures

<!-- Upstream: informed by Learn Hub article "Blockchain Protocol" (migrated, source retired) -->
