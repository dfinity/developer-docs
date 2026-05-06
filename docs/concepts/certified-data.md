---
title: "Certified Data"
description: "How ICP enables clients to verify query responses with a single public key check"
sidebar:
  order: 11
---

Query calls on ICP return results immediately without going through consensus. This means the response comes from a single replica, and a client cannot inherently distinguish a legitimate response from a fabricated one. Certified data solves this: by embedding cryptographic certificates in query responses, canisters can prove that their response reflects state that was committed through consensus, without the client needing to replay any blockchain history.

## The verification problem

On most blockchains, clients that want to verify data without trusting a single node must do significant work. Bitcoin's Simplified Payment Verification downloads and validates block headers. Ethereum's light clients maintain a chain of committee hashes and verify Merkle proofs against the state root. Both approaches require ongoing synchronization and are impractical for mobile or web applications that need fast, lightweight verification.

ICP takes a different approach: instead of requiring clients to maintain any blockchain state, the protocol produces a certificate that can be verified with a single signature check against a **single, stable public key** (the Internet Computer's root public key). This key never changes (it was fixed at genesis and is published in the NNS governance system), so any client can embed it and immediately verify any certificate it receives.

## How certificates are produced

Each subnet holds a threshold BLS signing key. The corresponding subnet public key is registered on the NNS and derivable from the IC root public key. At each consensus round, the subnet computes a **certified state tree**: a hash tree representing the replicated state of all canisters on that subnet — and signs the root hash of this tree with its threshold BLS key.

The signed root is included in the subnet's **certified state**, which is available to every replica. When a canister wants to certify a response, it embeds a piece of certified state in the response, along with a Merkle path (witness) proving that the certified piece is included under the signed root.

The result is a certificate that carries:
- the subnet's threshold BLS signature over the state tree root
- a chain of NNS signatures linking the subnet public key back to the IC root key
- a witness (Merkle path) from the signed root to the specific canister value

Verifying this chain of signatures requires only the IC root public key. No block header downloads, no committee tracking, no ongoing synchronization.

## Certified variables

The interface through which canisters participate in this mechanism is **certified variables**:

- During an **update call** (which goes through consensus), the canister calls `certified_data_set` with a 32-byte value. The subnet includes this value in its certified state at the end of the consensus round.
- During a **query call**, the canister reads back the certificate (the subnet's signature over the certified state tree) and returns it to the caller along with the canister's response.

The 32-byte limitation is not a problem in practice. Applications use standard data structures like [Merkle trees](https://en.wikipedia.org/wiki/Merkle_tree) to commit to arbitrarily large amounts of data in a single 32-byte root hash. The canister stores the full data structure locally and returns a Merkle witness (a path from the root to the requested value) alongside the certificate in each query response. The client verifies both the certificate signature and the witness together.

This pattern allows canisters to provide both fast responses (query, no consensus delay) and cryptographic authentication, a combination not natively available in most blockchain systems.

## Applications

Certified data is used throughout ICP for exactly this reason:

- **Certified variables in canisters.** Any canister can certify its state for client verification. See the [Certified variables guide](../guides/backends/certified-variables.md) for how to implement this.
- **Certified assets.** The asset canister uses certified variables to produce certified HTTP responses. When a browser fetches a page served by an ICP canister, the HTTP gateway verifies the certificate before serving the response, so the browser sees only content that was committed through consensus.
- **Internet Identity.** The Internet Identity service certifies its delegations, so clients can verify that an authentication delegation is authentic without trusting the individual replica that served the query.

## Relationship to chain-key cryptography

Certified data is one of the core applications of [chain-key cryptography](chain-key-cryptography.md). The threshold BLS signature property that makes certified data possible is the same one that enables fast response verification at the top level: a single subnet public key is enough to verify any response from that subnet, because the private key is never held by any single node and the signature is produced collectively by the subnet's nodes through threshold BLS.

The unique-signature property of BLS is also essential here: for a given message and key, exactly one valid BLS signature exists. This means no subset of nodes can produce a different certificate for the same state, even if they collude.

## Next steps

- [Certified variables guide](../guides/backends/certified-variables.md): implement certified responses in a canister
- [Chain-key cryptography](chain-key-cryptography.md): the threshold BLS signatures that power this system
- [Network overview](network-overview.md): how subnet nodes produce the certified state tree

<!-- Upstream: learn hub staging: chain-key-cryptography/certified-communication.md -->
