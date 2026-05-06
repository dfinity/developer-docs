---
learn_hub_id: 34207428453140
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34207428453140-Peer-to-peer"
learn_hub_title: "Peer to peer"
learn_hub_section: "Blockchain Protocol"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Peer to peer

The peer-to-peer layer (P2P) of the Internet Computer, the bottommost layer in the protocol stack, is responsible for the secure and reliable communication between the nodes of a subnet. P2P thus serves as the foundation of the Internet Computer’s protocol stack by enabling nodes to broadcast artifacts, such as user inputs to canisters or protocol messages like block proposals. P2P's key property is the guaranteed message delivery to all required subnet nodes despite varying real-world network conditions and node failures. The P2P layer is used by the [consensus layer](hc/en-us/articles/01JJBWMDX90WR1GE5HHD0EAEPB), the next layer in the stack above it, to broadcast artifacts to the other nodes in the subnet.

## Abortable broadcast

At the heart of the P2P layer is the [Abortable Broadcast primitive](https://arxiv.org/abs/2410.22080), which is critical for efficient communication in a setting where nodes may fail or even act maliciously. With Abortable Broadcast, nodes abort the transmission of artifacts they no longer need explicitly. This allows Abortable Broadcast to provide strong delivery guarantees in the presence of network congestion, node or link failures, and backpressure. By preserving bandwidth and bounding the size of its data structures, Abortable Broadcast prevents overload from malicious nodes while ensuring the delivery of non-aborted artifacts from honest nodes. It resembles a publish–subscribe model, with the added ability to abort in-flight messages when needed.

The P2P layer allows the filtering of incoming artifacts, accepting only necessary ones while discarding or delaying the admission of others. This ensures crucial artifacts are obtained more quickly than the others. This optimization is well-known from traditional networking and reduces the processing load of the layers above P2P.

## QUIC Transport

The Abortable Broadcast implementation relies on a transport component consisting of a custom RPC library built on top of [QUIC](https://en.wikipedia.org/wiki/QUIC). This library enables the efficient orchestration of multiple higher-level protocols on the same replica. Key features of the transport component include message multiplexing and caller pushback in the event that packet consumption is significantly slower than packet production.

## Security

To prevent Denial of Service (DoS) attacks, nodes connect only with other nodes in the same subnet, with membership managed by the [Network Nervous System (NNS)](https://learn.internetcomputer.org/hc/en-us/articles/01JH3CFANJAE1J5VAZ9NZ3ZQ9Z). The NNS registry canister acts as a service discovery mechanism for the P2P layer, enabling P2P to ensure encrypted and authenticated communication between nodes through TLS.  
  


## Additional information

[Blogpost on P2P](https://medium.com/dfinity/a-new-p2p-layer-is-coming-to-the-internet-computer-772ac2a29484)  
[Scientific article on Abortable Broadcast and its implementation for ICP](https://arxiv.org/abs/2410.22080)  
[Video on Abortable Broadcast](https://www.youtube.com/watch?v=f8-G_C4li70&list=PLVEhhIklNtB4HjWkLhqNacvBDzA0Wt2H1)

