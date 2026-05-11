---
title: "Peer-to-peer layer"
description: "How ICP nodes broadcast artifacts and exchange protocol messages using the Abortable Broadcast primitive and QUIC transport."
sidebar:
  order: 1
---

The peer-to-peer (P2P) layer is the bottommost layer in the ICP protocol stack. It is responsible for secure and reliable communication between the nodes of a subnet, providing the foundation on which all higher protocol layers depend.

P2P allows nodes to broadcast artifacts: user inputs to canisters and protocol messages such as block proposals. Its key property is guaranteed message delivery to all required subnet nodes despite varying real-world network conditions and node failures. The P2P layer is used by the [consensus layer](consensus.md) to broadcast artifacts to the other nodes in a subnet.

## Abortable Broadcast

At the heart of the P2P layer is the Abortable Broadcast primitive, which is critical for efficient communication in a setting where nodes may fail or act maliciously. With Abortable Broadcast, nodes can explicitly abort the transmission of artifacts they no longer need. This allows the protocol to provide strong delivery guarantees in the presence of network congestion, node or link failures, and backpressure.

By preserving bandwidth and bounding the size of its data structures, Abortable Broadcast prevents overload from malicious nodes while ensuring delivery of non-aborted artifacts from honest nodes. It resembles a publish/subscribe model with the added ability to abort in-flight messages when needed.

The P2P layer allows filtering of incoming artifacts: accepting only necessary ones while discarding or delaying others. Crucial artifacts are obtained more quickly than non-essential ones. This reduces the processing load of the layers above P2P.

## QUIC transport

The Abortable Broadcast implementation relies on a transport component built on top of [QUIC](https://en.wikipedia.org/wiki/QUIC): a custom RPC library that enables efficient orchestration of multiple higher-level protocols on the same replica. Key features include message multiplexing and caller pushback when packet consumption lags behind packet production.

## Security

To prevent denial-of-service attacks, nodes connect only with other nodes in the same subnet. Subnet membership is managed by the [Network Nervous System (NNS)](../../references/glossary.md#network-nervous-system-nns). The NNS registry canister acts as a service discovery mechanism for the P2P layer, enabling encrypted and authenticated communication between nodes through TLS.

## Further reading

- [Protocol Stack](index.md): how P2P fits into the four-layer architecture
- [Abortable Broadcast paper](https://arxiv.org/abs/2410.22080)

<!-- Upstream: informed by Learn Hub article "Peer to peer" (migrated, source retired) -->
