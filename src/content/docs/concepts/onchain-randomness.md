---
title: "On-Chain Randomness"
description: "Generate verifiable random numbers inside canisters"
sidebar:
  order: 5
doc_type: explanation
level: intermediate
features: [randomness]
last_verified: 2026-03-10
---

ICP provides cryptographically secure, unpredictable random numbers directly inside canister execution. Unlike other blockchains where randomness must be sourced from external oracles, ICP's randomness is built into the protocol using a verifiable random function (VRF).

## How it works

Each round, the protocol evaluates a VRF using chain-key cryptography. The output seeds a pseudorandom number generator called the **random tape**. This produces unique random values for every canister that requested randomness.

The key security property: `raw_rand` uses the random tape from the **next** round, not the current one. This means no party -- not even the subnet nodes -- can predict the output at the time the request is made.

## The `raw_rand` API

The management canister exposes a single method:

```candid
raw_rand : () -> (blob);
```

It takes no arguments and returns **32 bytes** of pseudorandom data.

### Motoko

```motoko
import IC "ic:aaaaa-aa";

actor {
    public func random_bytes() : async Blob {
        await IC.raw_rand()
    };

    public func random_number() : async Nat {
        let bytes = await IC.raw_rand();
        var n : Nat = 0;
        for (b in bytes.vals()) {
            n := n * 256 + Nat8.toNat(b);
        };
        n
    };
};
```

Motoko also provides a higher-level [Random module](https://mops.one/base/docs/Random) that wraps `raw_rand` with convenient utilities like `coin()`, `range()`, and `blob()`.

### Rust

```rust
use ic_cdk::api::management_canister::main::raw_rand;

#[ic_cdk::update]
async fn random_bytes() -> Vec<u8> {
    let (bytes,) = raw_rand().await.expect("raw_rand failed");
    bytes
}

#[ic_cdk::update]
async fn random_u64() -> u64 {
    let (bytes,) = raw_rand().await.expect("raw_rand failed");
    u64::from_le_bytes(bytes[..8].try_into().unwrap())
}
```

## Important considerations

- `raw_rand` is an **update call**. It cannot be used in query calls because it requires consensus.
- Each call returns 32 bytes. If you need more randomness, make multiple calls or use the 32 bytes to seed a local PRNG.
- The randomness is **unpredictable** but not externally verifiable. For publicly verifiable randomness, consider using [VetKeys as a VRF](/concepts/vetkeys).

## Use cases

- **Lotteries and raffles** -- fair, tamper-proof random selection
- **Gaming** -- unpredictable game outcomes, loot drops, procedural generation
- **Random assignment** -- NFT trait randomization, committee selection
- **Cryptographic protocols** -- nonce generation, random challenges

## Resources

- [IC interface spec: `raw_rand`](/reference/ic-interface-spec#ic-raw_rand)
- [Motoko Random module](https://mops.one/base/docs/Random)
- [Community Conversations: randomness on ICP](https://www.youtube.com/watch?v=nl5BuiWClD0)
