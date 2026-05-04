---
title: "Verifiable Randomness"
description: "How ICP generates unpredictable random numbers using a threshold Verifiable Random Function, with no trusted party required"
sidebar:
  order: 7
---

Generating unpredictable random numbers is a fundamental requirement for many applications: lotteries, games, fair selection, cryptographic protocols, and more. In a system where every node must agree on the same state, this is harder than it sounds.

## Why randomness is hard on deterministic consensus systems

Consensus-based systems execute every transaction deterministically. Each node replays the same operations and must arrive at the same state. This means randomness sources available to normal programs (such as OS entropy (`/dev/urandom`), hardware timers, or per-process seeds) cannot be used directly: they would produce different values on each replica, breaking consensus.

Naive alternatives have well-known weaknesses:

- **Block hashes as seeds.** Miners or validators can selectively publish or withhold blocks to influence outcomes. Any actor who produces blocks can bias the result.
- **Commit-reveal schemes.** Participants can abort after seeing others' commitments, biasing the outcome in their favor if abstaining is cheaper than losing.
- **Trusted oracles.** External randomness sources reintroduce centralization and single points of failure: contradicting the goal of trustless execution.

ICP addresses these limitations at the protocol level, so application developers do not need to implement workarounds themselves.

## The threshold VRF approach

ICP generates randomness using a **Verifiable Random Function (VRF)** executed collaboratively by the subnet's nodes using threshold cryptography. No single node, and no subset below the threshold, can predict or influence the output.

The process runs once per execution round:

1. **Round input.** The VRF is seeded with the current round number. Each round has a globally agreed-upon number, so the input is the same on every replica.
2. **Threshold evaluation.** The subnet's nodes collaborate using [chain-key cryptography](chain-key-cryptography.md) to evaluate the VRF. Computing the output requires a threshold of nodes to participate. The same threshold used in the consensus protocol. A minority of malicious nodes cannot bias or predict the result.
3. **Random tape.** The VRF output seeds a per-round pseudorandom number generator called the **random tape**. The random tape is then used to produce individual random values for each canister that requested randomness in the previous round.
4. **Delivery.** The `raw_rand` result is determined in the round after the call arrives (see one-round delay below), not when the canister submits it. The 32-byte blob delivered to the caller is the same on every replica, satisfying consensus.

### Security properties

The threshold VRF provides three guarantees that address these challenges:

- **Unpredictability.** The output cannot be known before the threshold of nodes collaborates to compute it. Because the computation spans a round boundary, no party (including subnet nodes) can predict the result in advance.
- **Unbiasability.** No individual node can influence the output. A malicious node cannot single-handedly prevent the subnet from producing randomness (a threshold of honest nodes is sufficient) but it cannot steer the result toward a preferred value. This is in contrast to leader-based schemes where the block producer has exclusive influence.
- **Verifiability.** The VRF output includes a proof that any party can verify using the subnet's public key. This means the randomness is not just unpredictable: it is provably correct. External observers can confirm that the subnet followed the protocol.

## The random tape and `raw_rand`

The random tape is the developer-facing interface to ICP's randomness. When a canister calls `raw_rand` on the management canister, it receives 32 bytes derived from the random tape of the next execution round. Crucially:

- **One round of delay.** A `raw_rand` call submitted in round N receives entropy from round N+1. This ensures that the subnet nodes have not yet seen the round N+1 randomness when the call arrives: they cannot bias the output they have not yet computed.
- **Update calls only.** `raw_rand` is an inter-canister call to the management canister. It requires an update call context and cannot be used from a query call. Query calls execute on a single replica and do not participate in the subnet's consensus: there is no random beacon available.
- **32 bytes per call.** Each invocation returns 32 bytes (256 bits) of entropy. This is sufficient to derive many independent values: four 64-bit integers, 32 single-byte selections, or a seed for a seeded pseudorandom number generator.

## Applications

The threshold VRF is appropriate for a wide range of use cases where unpredictable, unbiasable randomness is needed:

- **Fair selection.** Lotteries, raffles, jury selection, random assignment of roles or rewards.
- **Games.** Procedural generation, shuffle mechanics, NPC behavior, any outcome that must not be predictable by the player.
- **Cryptographic protocols.** Generating nonces, challenge values, or session keys entirely onchain.
- **Sampling.** Random subsets for audits, testing, or statistical processes.

### When to use additional mechanisms

The subnet's threshold VRF ensures the subnet itself did not bias the output. It does not prevent a canister from learning the randomness and reacting to it before revealing the outcome to users. For applications where users need to independently verify fairness, combine `raw_rand` with a commit-reveal scheme: commit to the parameters before requesting randomness, then reveal both together. This way, even if a canister were somehow compromised, users can audit whether the randomness was used as committed.

For applications that need verifiable randomness tied to a specific user or event identifier (rather than per-round subnet randomness) see the vetKeys VRF functionality described in [vetKeys](vetkeys.md).

## Next steps

- [Verifiable randomness guide](../guides/backends/randomness.md): how to call `raw_rand` and derive typed values in Motoko and Rust
- [Management canister reference](../references/management-canister.md#raw_rand): `raw_rand` API specification
- [Chain-key cryptography](chain-key-cryptography.md): the cryptographic foundation underlying the threshold VRF
- [Security](security.md): how randomness fits into the broader ICP security model

<!-- Upstream: informed by dfinity/portal — docs/building-apps/network-features/randomness.mdx; docs/building-apps/network-features/vetkeys/verifiable-random-function.mdx -->
