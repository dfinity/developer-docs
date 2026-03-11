---
title: "Management Canister"
description: "The aaaaa-aa virtual canister API for canister management and platform services"
sidebar:
  order: 2
doc_type: reference
level: intermediate
last_verified: 2026-03-10
---

The management canister is a virtual canister at address `aaaaa-aa` (the empty blob). It does not have its own Wasm module or isolated state. Instead, it is implemented directly within the ICP protocol and is available on every subnet.

When a canister or user calls `aaaaa-aa`, ICP routes the request to the appropriate subnet transparently. The cost of the call is charged to the calling canister.

## Why it exists

Some canister management operations are asynchronous and may involve canisters on different subnets. The System API only supports synchronous operations. By exposing these operations through a virtual canister, ICP reuses its existing inter-canister call mechanics and provides a familiar interface.

## Access control

- Most methods require the caller to be a **controller** of the target canister.
- Some methods (such as `raw_rand` and `deposit_cycles`) can only be called by canisters, not by users.
- When a user calls the management canister, processing costs are charged to the managed canister.

## Calling the management canister

**Rust:**

```rust
use ic_cdk::api::management_canister::main::create_canister;
use ic_cdk::api::management_canister::main::CreateCanisterArgument;

let (canister_id,) = create_canister(CreateCanisterArgument { settings: None })
    .await
    .expect("Failed to create canister");
```

**Motoko:**

```motoko
actor {
  let ic = actor "aaaaa-aa" : actor {
    create_canister : shared { settings : ?CanisterSettings } -> async { canister_id : Principal };
  };

  public func create() : async Principal {
    let result = await ic.create_canister({ settings = null });
    result.canister_id
  };
};
```

**CLI:**

```bash
icp canister status <canister-id> -n ic
```

## API reference

### Canister lifecycle

| Method | Description |
|--------|-------------|
| `create_canister` | Create a new canister. Returns the new canister ID. Caller becomes a controller. |
| `install_code` | Install or reinstall Wasm code on a canister. Modes: `install`, `reinstall`, `upgrade`. |
| `install_chunked_code` | Install large Wasm modules uploaded in chunks. |
| `upload_chunk` | Upload a chunk of a large Wasm module to a canister's chunk store. |
| `clear_chunk_store` | Clear all uploaded chunks from a canister's chunk store. |
| `stored_chunks` | List chunks currently in a canister's chunk store. |
| `uninstall_code` | Remove a canister's Wasm module and state. |
| `start_canister` | Start a stopped canister. |
| `stop_canister` | Stop a canister. Pending calls are rejected. |
| `delete_canister` | Permanently delete a stopped canister and reclaim its cycles. |
| `update_settings` | Modify canister settings (controllers, memory limit, compute allocation, freezing threshold). |

### Canister information

| Method | Description |
|--------|-------------|
| `canister_status` | Get status, settings, memory usage, cycles balance, and module hash of a canister. |
| `canister_info` | Get the canister's history of code changes, controller changes, and module hash. |

### Threshold signatures

| Method | Description |
|--------|-------------|
| `sign_with_ecdsa` | Create a threshold ECDSA signature. Used for Bitcoin and EVM transactions. |
| `sign_with_schnorr` | Create a threshold Schnorr signature (BIP-340 or Ed25519). |
| `ecdsa_public_key` | Retrieve the threshold ECDSA public key for a derivation path. |
| `schnorr_public_key` | Retrieve the threshold Schnorr public key for a derivation path. |

### HTTPS outcalls

| Method | Description |
|--------|-------------|
| `http_request` | Make an HTTP/HTTPS request to an external server. Supports GET, POST, and HEAD. |

### Randomness

| Method | Description |
|--------|-------------|
| `raw_rand` | Return 32 bytes of cryptographic randomness. Only callable by canisters. The value is unknown at request time and resolved in the next execution round. |

### Bitcoin API

| Method | Description |
|--------|-------------|
| `bitcoin_get_balance` | Get the BTC balance for an address. |
| `bitcoin_get_utxos` | Get the UTXOs for a Bitcoin address. |
| `bitcoin_send_transaction` | Submit a signed Bitcoin transaction to the network. |
| `bitcoin_get_current_fee_percentiles` | Get the current Bitcoin network fee percentiles. |

### Cycles management

| Method | Description |
|--------|-------------|
| `deposit_cycles` | Deposit cycles from the caller to a target canister. Only callable by canisters. |

### Node metrics

| Method | Description |
|--------|-------------|
| `node_metrics_history` | Retrieve historical node metrics for a subnet. |

## Further reading

- [IC Interface Specification: Management Canister](https://internetcomputer.org/docs/references/ic-interface-spec#ic-management-canister)
- [Candid interface definition](https://internetcomputer.org/docs/references/ic-interface-spec#ic-candid)
