---
title: "Message routing"
description: "How ICP routes messages between canisters across subnets, certifies subnet state, and enables secure cross-subnet communication."
sidebar:
  order: 3
---

Message routing is the lower of the two upper layers of the ICP protocol stack. It sits above consensus and below execution, orchestrating the flow of messages from finalized blocks into canister input queues, triggering execution, routing the resulting inter-canister messages, and certifying subnet state.

Its responsibilities fall into four areas:

- **Induction.** Extracting messages from finalized consensus blocks and placing them into canister input queues.
- **Execution invocation.** Triggering the execution layer to process the inducted messages.
- **Message routing.** Forwarding inter-canister messages within the subnet and into outgoing XNet streams for cross-subnet delivery.
- **State certification.** Certifying the subnet's replicated state using [chain-key cryptography](../chain-key-cryptography.md).

Although the layer is named for message routing, state certification is equally important: it underlies chain-evolution technology and allows nodes to catch up to the current state without replaying all historical blocks.

## Message processing

Whenever consensus produces a finalized block, it hands the block to message routing. This marks the transition between the lower and upper halves of the protocol stack: the lower two layers agree on a block, and the upper two layers process it deterministically.

Message routing extracts [ingress messages](../../references/glossary.md#ingress-message) (submitted by users) and [XNet](../../references/glossary.md#xnet) messages (sent by canisters on other subnets) from the block. Each message is placed into the input queue of its target canister. This process is called **induction**, and all queues together are called the [**induction pool**](../../references/glossary.md#induction-pool). After induction, message routing triggers the execution layer, which schedules and executes messages from the pool.

Message routing and execution modify subnet state in a deterministic way: every honest node makes the same state changes, preserving the replicated state machine properties of the subnet.

## Inter-canister messaging

Executing a canister message can produce new inter-canister messages. How those messages are handled depends on whether the target canister is on the same subnet or a different one.

### Intra-subnet messages

Messages to canisters on the same subnet do not go through consensus. Because they deterministically result from an already-agreed message, their execution is also deterministic. The execution layer places these messages directly into the target canister's input queue. This process is transitive: a message can produce more messages, forming a tree of execution. Intra-subnet messages are executed as long as the cycles limit for the round has not been exhausted. Remaining messages are deferred to subsequent rounds.

Local canister-to-canister messaging is asynchronous. Messages are queued and scheduled rather than synchronously invoked, which is the standard inter-canister semantics on ICP.

### Cross-subnet messages (XNet)

Messages to canisters on other subnets are placed into the outgoing XNet stream for the target subnet. At the end of the round, message routing certifies these streams using a Merkle-tree-style data representation and chain-key cryptography. This means every outgoing XNet message is authenticated by the originating subnet's collective signature.

Block makers on the receiving subnet fetch certified XNet messages during block assembly, validate the certificate against the originating subnet's public key, and include valid messages in a consensus block. The Merkle-tree structure allows partial consumption: a receiving subnet can include some XNet messages from a stream in one round and the rest in a later round, while still validating each message's authenticity.

## State certification

The replicated state of a subnet includes all information needed for its operation. Message routing certifies this state in two modes.

### Per-round certification

At the end of each round (when all messages have been executed or the cycles limit has been reached), message routing certifies a subset of the state tree:

- Responses to ingress messages (the ingress history)
- XNet messages queued for other subnets
- Canister metadata (module hashes and certified variables)

These certified responses can be read and validated against the subnet's public key by users. Each subnet's public key is in turn certified by the [Network Nervous System (NNS)](../../references/glossary.md#network-nervous-system-nns), so a certified response can be verified against a single root of trust: the NNS public key. This provides a powerful alternative to reading transaction logs, as responses are authenticated by the network rather than by a centralized server.

Per-round state certification enables secure, verifiable inter-subnet communication, which is a core enabler of ICP's scalability across many subnets.

### Per-checkpoint certification

Not all state is certified every round. Canister Wasm code and written memory pages are certified only at checkpoints, which are periodic snapshots of the entire replicated state persisted to disk.

Checkpoints are created roughly every 10 minutes. For each checkpoint, the subnet computes a certification over a Merkle-tree manifest. Certification is incremental: only the pages that changed since the last checkpoint need to be processed, and their changes are propagated up the tree. The root hash of the manifest is signed by the subnet, forming a [**catch-up package**](../../references/glossary.md#catch-up-package-cup) that new or recovering nodes can use to join without replaying the full block history.

The time to compute a checkpoint certification is linear in the number of changed memory pages, not the total state size. This matters as subnets can hold terabytes of state: a full recertification of that volume at each checkpoint interval would be impractical.

## Further reading

- [Protocol Stack](index.md): how message routing fits into the four-layer architecture
- [State synchronization](state-synchronization.md): how catch-up packages are used by joining nodes

<!-- Upstream: informed by Learn Hub article "Message Routing" (migrated, source retired) -->
