---
title: "Inter-Canister Calls"
description: "Make query, update, and composite query calls between canisters."
sidebar:
  order: 1
doc_type: how-to
level: intermediate
features: []
icskills:
  - multi-canister
last_verified: 2026-03-10
---

Canisters communicate by sending messages to each other. Each inter-canister call consists of a request and a response. Understanding call types and their tradeoffs is essential for building multi-canister applications.

## Query vs update calls

| | Query calls | Update calls |
|--|-------------|--------------|
| **Speed** | 200-400ms | 1-2s |
| **Consensus** | No (single node) | Yes (all subnet nodes) |
| **State changes** | Discarded | Persisted |
| **Cost** | Free | Costs cycles |
| **Trust** | Response from one node | Consensus-verified |

### Defining query and update methods

**Motoko:**

```motoko
actor {
  stable var count : Nat = 0;

  // Query: fast, read-only
  public query func get() : async Nat {
    count
  };

  // Update: can modify state
  public func increment() : async Nat {
    count += 1;
    count
  };
}
```

**Rust:**

```rust
use std::cell::RefCell;

thread_local! {
    static COUNT: RefCell<u64> = RefCell::new(0);
}

#[ic_cdk::query]
fn get() -> u64 {
    COUNT.with(|c| *c.borrow())
}

#[ic_cdk::update]
fn increment() -> u64 {
    COUNT.with(|c| {
        let mut count = c.borrow_mut();
        *count += 1;
        *count
    })
}
```

### Calling from the CLI

```bash
# Query call (fast, free)
icp canister call my_canister get --query

# Update call (goes through consensus)
icp canister call my_canister increment --update
```

## Inter-canister calls

An update method can call other canisters. The call is asynchronous -- your canister sends the request, yields execution, and resumes when the response arrives.

### Motoko

```motoko
actor Main {
  let other : actor { getValue : () -> async Nat } =
    actor "rrkah-fqaaa-aaaaa-aaaaq-cai";

  public func fetchValue() : async Nat {
    let value = await other.getValue();
    value
  };
}
```

### Rust

```rust
use candid::{Principal, CandidType, Deserialize};

#[derive(CandidType, Deserialize)]
struct GetValueResult(u64);

#[ic_cdk::update]
async fn fetch_value() -> u64 {
    let canister_id = Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap();
    let (result,): (u64,) = ic_cdk::call(canister_id, "getValue", ())
        .await
        .expect("call failed");
    result
}
```

## Composite queries

Regular query calls cannot call other canisters. Composite queries solve this -- they can call other queries and composite queries, enabling read-only multi-canister workflows without going through consensus.

| | Query | Update | Composite query |
|--|-------|--------|-----------------|
| Can call other queries | No | Yes | Yes |
| Can call composite queries | No | No | Yes |
| Can modify state | No | Yes | No |
| Cross-subnet calls | No | Yes | No |
| Can be called as update | Yes | N/A | No |

### Motoko

```motoko
actor Frontend {
  let partition1 : actor { get : (Text) -> async ?Text } =
    actor "partition1-canister-id";
  let partition2 : actor { get : (Text) -> async ?Text } =
    actor "partition2-canister-id";

  public composite query func lookup(key : Text) : async ?Text {
    // Route to the correct partition based on the key
    if (key < "m") {
      await partition1.get(key)
    } else {
      await partition2.get(key)
    }
  };
}
```

### Rust

```rust
#[ic_cdk::query(composite = true)]
async fn lookup(key: String) -> Option<String> {
    let partition = if key < "m".to_string() {
        Principal::from_text("partition1-id").unwrap()
    } else {
        Principal::from_text("partition2-id").unwrap()
    };

    let (result,): (Option<String>,) = ic_cdk::call(partition, "get", (key,))
        .await
        .expect("call failed");
    result
}
```

## Error handling

Inter-canister calls can fail for several reasons: the target canister is stopped, out of cycles, traps during execution, or the subnet is unreachable. Always handle errors.

### Motoko

```motoko
public func safeFetch() : async Result.Result<Nat, Text> {
  try {
    let value = await other.getValue();
    #ok(value)
  } catch (e) {
    #err("Call failed: " # Error.message(e))
  }
};
```

### Rust

```rust
#[ic_cdk::update]
async fn safe_fetch() -> Result<u64, String> {
    let canister_id = Principal::from_text("rrkah-fqaaa-aaaaa-aaaaq-cai").unwrap();
    match ic_cdk::call::<(), (u64,)>(canister_id, "getValue", ()).await {
        Ok((value,)) => Ok(value),
        Err((code, msg)) => Err(format!("Call failed ({:?}): {}", code, msg)),
    }
}
```

## Best practices

- **Minimize cross-canister calls.** Each call adds latency and cycle cost. Batch data when possible.
- **Handle all errors.** A trap after an `await` cannot roll back the state changes made before the `await`.
- **Use composite queries for reads.** They are free and much faster than update calls.
- **Be aware of the commit point.** State changes before an `await` are committed. If the call after `await` fails, those changes are not rolled back.
- **Avoid long call chains.** Each hop adds ~1-2 seconds of latency and increases the chance of failure.

## Next steps

- [Candid](/guides/inter-canister/candid/) -- define canister interfaces
- [Testing strategies](/guides/testing/strategies/) -- test multi-canister applications
- [icp-cli CLI reference](https://dfinity.github.io/icp-cli/reference/cli/) -- canister call and deploy commands
