---
title: "Onchain Randomness"
description: "Generate cryptographically secure random numbers in canisters using the management canister's raw_rand API"
sidebar:
  order: 4
---

[Canisters](../../concepts/canisters.md) can generate cryptographically secure random numbers directly from canister code. This guide shows how to call the `raw_rand` method, derive typed values from the returned bytes, and use randomness safely.

For how ICP produces unpredictable randomness without any trusted party, see [Onchain Randomness](../../concepts/onchain-randomness.md).

## Why onchain randomness is different

Consensus-based systems execute every transaction deterministically: every node replays the same operations and must reach the same state. This means you cannot use typical randomness sources like `Math.random()` or `/dev/urandom`: they would produce different values on each replica, breaking consensus.

ICP solves this with a threshold Verifiable Random Function (VRF). The result of `raw_rand` is produced collaboratively by the subnet's nodes using a random beacon that no single node can predict or bias. Every node independently verifies the output is correct, and the same 32 bytes are delivered to all replicas: satisfying both unpredictability and consensus.

## The `raw_rand` API

The management canister (`aaaaa-aa`) exposes `raw_rand`, which returns 32 bytes of cryptographic randomness:

- **Caller:** Canisters only (not callable via ingress messages / external clients)
- **Parameters:** None
- **Returns:** `blob`: 32 bytes

Because `raw_rand` is an update call to the management canister, it can only be invoked from an update context in your canister. **Randomness is not available in query calls**: a query executes on a single replica and cannot access the subnet-level random beacon. Attempting to call `raw_rand` from a query will trap.

See the [Management Canister reference](../../reference/management-canister.md#raw_rand) for the full API specification.

## Getting random bytes

**Motoko**

Motoko's `mo:core/Random` module wraps `raw_rand`. `Random.blob()` returns the raw 32-byte blob, which you convert to an array with `Blob.toArray` for byte-level access:

```motoko
import Random "mo:core/Random";

public shared func getRandomBytes() : async Blob {
    let entropy : Blob = await Random.blob();
    entropy
};
```

`Random.blob()` calls `raw_rand` internally and returns the 32-byte blob. Each call to `getRandomBytes` makes one call to the management canister.

**Rust**

The `ic_cdk` crate provides `ic_cdk::management_canister::raw_rand()` which wraps the `raw_rand` management canister call:

```rust
#[ic_cdk::update]
async fn get_random_bytes() -> Vec<u8> {
    let random_bytes = ic_cdk::management_canister::raw_rand()
        .await
        .expect("raw_rand failed");
    random_bytes
}
```

`raw_rand` is an async call: it must be awaited from an `async` function marked `#[ic_cdk::update]`.

## Generating a random number in a range

To generate a random integer in the range `[0, n)`, extract bytes from the result and reduce modulo `n`.

**Motoko**

```motoko
import Random "mo:core/Random";
import Blob "mo:core/Blob";
import Nat8 "mo:core/Nat8";

public shared func rollDie(sides : Nat) : async Nat {
    let entropy = await Random.blob();
    let bytes = Blob.toArray(entropy);
    Nat8.toNat(bytes[0]) % sides
};
```

For multiple random values in a single call, convert the 32-byte blob to an array and index directly. No additional `raw_rand` calls needed:

```motoko
import Random "mo:core/Random";
import List "mo:core/List";
import Blob "mo:core/Blob";
import Nat8 "mo:core/Nat8";

public shared func rollMultipleDice(count : Nat, sides : Nat) : async [Nat] {
    let entropy = await Random.blob();
    let bytes = Blob.toArray(entropy);
    // raw_rand returns 32 bytes; each byte gives one independent value
    let results = List.empty<Nat>();
    var i = 0;
    label loop_ loop {
        if (i >= count or i >= bytes.size()) break loop_;
        List.add(results, Nat8.toNat(bytes[i]) % sides);
        i += 1;
    };
    List.toArray(results)
};
```

**Rust**

```rust
#[ic_cdk::update]
async fn roll_die(sides: u64) -> u64 {
    let random_bytes = ic_cdk::management_canister::raw_rand()
        .await
        .expect("raw_rand failed");
    // take the first 8 bytes as a u64
    let n = u64::from_le_bytes(random_bytes[..8].try_into().unwrap());
    n % sides
}
```

For multiple random values from a single `raw_rand` call, slice the 32-byte result into windows:

```rust
#[ic_cdk::update]
async fn roll_multiple_dice(count: usize, sides: u64) -> Vec<u64> {
    let random_bytes = ic_cdk::management_canister::raw_rand()
        .await
        .expect("raw_rand failed");
    // yields up to 4 independent u64 values from 32 bytes
    random_bytes
        .chunks_exact(8)
        .take(count)
        .map(|chunk| {
            let n = u64::from_le_bytes(chunk.try_into().unwrap());
            n % sides
        })
        .collect()
}
```

## Choosing winners from a list

A common use case is selecting one or more random elements from a list: for example, choosing a lottery winner or assigning roles in a game.

**Motoko**

```motoko
import Random "mo:core/Random";
import Blob "mo:core/Blob";
import Nat8 "mo:core/Nat8";

public shared func pickWinner(participants : [Text]) : async ?Text {
    if (participants.size() == 0) { return null };
    let entropy = await Random.blob();
    let bytes = Blob.toArray(entropy);
    let idx = Nat8.toNat(bytes[0]) % participants.size();
    ?participants[idx]
};
```

**Rust**

```rust
#[ic_cdk::update]
async fn pick_winner(participants: Vec<String>) -> Option<String> {
    if participants.is_empty() {
        return None;
    }
    let random_bytes = ic_cdk::management_canister::raw_rand()
        .await
        .expect("raw_rand failed");
    let idx = (random_bytes[0] as usize) % participants.len();
    Some(participants[idx].clone())
}
```

## Seeding a PRNG from `raw_rand` (Rust)

Some Rust crates (for example, `rand`) depend on `getrandom` as a randomness source. Because `getrandom` uses OS-level entropy that does not exist in the Wasm environment, you must register a custom handler.

The recommended approach is to seed a `rand` PRNG from a single `raw_rand` call, then use the PRNG for subsequent draws:

```rust
use rand::SeedableRng;
use rand::rngs::StdRng;
use rand::Rng;

#[ic_cdk::update]
async fn generate_with_prng(count: usize) -> Vec<u64> {
    let seed_bytes = ic_cdk::management_canister::raw_rand()
        .await
        .expect("raw_rand failed");
    let seed: [u8; 32] = seed_bytes.try_into().unwrap();
    let mut rng = StdRng::from_seed(seed);
    // use rng for multiple draws without additional management canister calls
    (0..count).map(|_| rng.gen::<u64>()).collect()
}
```

Add `rand` to your `Cargo.toml`:

```toml
[dependencies]
rand = { version = "0.8", default-features = false, features = ["std_rng"] }
```

The `std_rng` feature compiles `StdRng` without requiring OS entropy, which is compatible with the Wasm target.

## Security considerations

**Always use randomness in update calls, never in queries.** Query calls execute on a single replica and cannot access the random beacon. The `raw_rand` API will trap if called from a query context.

**One call per decision round.** Each call to `raw_rand` costs cycles and involves an inter-canister call to the management canister. Batch your entropy needs: a single 32-byte blob provides 256 bits of entropy: enough for 4 independent `u64` values, 32 independent byte selections, or one `StdRng` seed for unlimited draws.

**Understand the timing guarantee.** The value returned by `raw_rand` is determined during the round in which the management canister processes the call, not when your canister submits it. Subnet nodes collaborate to produce the value under the consensus protocol. No individual node can predict or bias the output. This is appropriate for games, lotteries, and fair selection. For use cases requiring verifiable fairness to external observers who do not trust the subnet operator, combine `raw_rand` with a commit-reveal scheme.

**Reentrancy caution.** Because `raw_rand` is an async call, your canister's execution can be interleaved with other messages at the `await` point. If you check state before the `await` and rely on that state after, another message may have modified it in between. See [Canister security](../security/inter-canister-calls.md) for reentrancy patterns.

## Example: random maze

The `random_maze` example in the ICP examples repository generates a maze using randomness to decide which walls to remove during a depth-first search. It demonstrates how to consume entropy incrementally across many cells.

Note: this example predates `mo:core` and uses the older `Random.Finite` API. The patterns in this guide use `mo:core/Random` instead.

- [random_maze (Motoko)](https://github.com/dfinity/examples/tree/master/motoko/random_maze)

## Next steps

- [Onchain Randomness (concept)](../../concepts/onchain-randomness.md): how the IC's threshold VRF works
- [Management Canister](../../reference/management-canister.md): `raw_rand` API reference
- [Data Integrity](../security/data-integrity.md): using randomness in a secure application design
- [Inter-canister calls](../canister-calls/inter-canister-calls.md): async patterns and reentrancy

<!-- Upstream: informed by dfinity/portal — docs/building-apps/integrations/randomness.mdx; dfinity/icskills — skills/canister-security/SKILL.md; dfinity/examples — motoko/random_maze; caffeinelabs/motoko-core — src/Random.mo -->
