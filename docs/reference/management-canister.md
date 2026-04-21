---
title: "Management Canister"
description: "API reference for the IC management canister (aaaaa-aa): canister lifecycle, signing, randomness, and more"
sidebar:
  order: 5
---

The management canister provides access to system features on the Internet Computer: creating and managing canisters, chain-key signing, HTTPS outcalls, randomness, and Bitcoin integration. It is not a real canister with its own state or Wasm module. It is a virtual canister implemented as part of the IC protocol itself.

The management canister address is `aaaaa-aa` (the empty blob). It is present on every subnet. When you call `aaaaa-aa`, the IC routes the request to the appropriate subnet transparently.

Most methods require the caller to be a **controller** of the target canister. Some methods (such as `raw_rand` and `deposit_cycles`) can only be called by canisters, not by external users. When an external user calls the management canister, the cost is charged to the managed canister.

For the full formal specification, see the [IC interface specification](ic-interface-spec.md).

## Canister settings

Several methods accept or return a `canister_settings` record. The fields are:

| Field | Type | Default | Description |
|---|---|---|---|
| `controllers` | `vec principal` | Caller only | Up to 10 principals that control the canister |
| `compute_allocation` | `nat` | `0` | Guaranteed compute power (0-100%) |
| `memory_allocation` | `nat` | `0` | Guaranteed memory in bytes (0 = best-effort) |
| `freezing_threshold` | `nat` | `2_592_000` | Seconds before depletion at which the canister freezes (~30 days) |
| `reserved_cycles_limit` | `nat` | `5_000_000_000_000` | Upper limit on reserved cycles (5T) |
| `wasm_memory_limit` | `nat` | `0` | Upper limit on Wasm heap memory in bytes (0 = no limit) |
| `wasm_memory_threshold` | `nat` | `0` | Remaining Wasm memory threshold that triggers the low-memory hook |
| `log_visibility` | `log_visibility` | `controllers` | Who can read canister logs: `controllers`, `public`, or `allowed_viewers(vec principal)` |
| `snapshot_visibility` | `snapshot_visibility` | `controllers` | Who can list and read canister snapshots: `controllers`, `public`, or `allowed_viewers(vec principal)` |
| `environment_variables` | `opt record` | `null` | Key-value pairs accessible during canister execution |

For practical guidance on configuring these, see the [canister settings guide](../guides/canister-management/settings.md).

## Canister lifecycle methods

### `create_canister`

Registers a new canister on the IC and returns its canister ID. The canister starts empty (no installed code).

- **Caller:** Canisters, or subnet admins via ingress messages
- **Parameters:**
  - `settings` (`opt canister_settings`) — initial canister settings
  - `sender_canister_version` (`opt nat64`) — caller's canister version (must match `ic0.canister_version` if provided)
- **Returns:** `record { canister_id : principal }`
- **Cycles:** Must be explicitly attached to the call (not deducted automatically)

If you provide a `controllers` list, the caller is only a controller if included in that list. If you omit `controllers`, it defaults to a list containing only the caller.

For the lifecycle workflow, see the [canister lifecycle guide](../guides/canister-management/lifecycle.md).

### `update_settings`

Updates the settings of an existing canister. Only controllers can call this method. Omitting a field from the `settings` record leaves that setting unchanged.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`) — target canister
  - `settings` (`canister_settings`) — settings to update
  - `sender_canister_version` (`opt nat64`)
- **Returns:** Nothing

### `install_code`

Installs or upgrades code on a canister. Only controllers can call this method.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `mode` — one of `install`, `reinstall`, or `upgrade`
  - `canister_id` (`principal`) — target canister
  - `wasm_module` (`blob`) — Wasm binary (raw or gzip-compressed)
  - `arg` (`blob`) — initialization argument
  - `sender_canister_version` (`opt nat64`)
- **Returns:** Nothing

Mode behavior:

| Mode | Precondition | Effect |
|---|---|---|
| `install` | Canister must be empty | Instantiates module, calls `canister_init` |
| `reinstall` | Any state | Wipes existing code and state (including stable memory), then installs |
| `upgrade` | Canister must have code | Runs upgrade flow (`canister_pre_upgrade` then `canister_post_upgrade`) |

The `upgrade` mode accepts optional sub-fields: `skip_pre_upgrade` (skip `canister_pre_upgrade`) and `wasm_memory_persistence` (set to `keep` to preserve Wasm heap memory).

This operation is atomic: if it fails, the canister is unchanged.

### `install_chunked_code`

Installs code that was previously uploaded in chunks. Useful for Wasm modules that exceed the single-message size limit.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `mode` — same as `install_code`
  - `target_canister` (`principal`) — where to install
  - `store_canister` (`opt principal`) — where chunks are stored (defaults to `target_canister`)
  - `chunk_hashes_list` (`vec record { hash : blob }`) — ordered list of chunk hashes
  - `wasm_module_hash` (`blob`) — SHA-256 of the concatenated chunks
  - `arg` (`blob`)
  - `sender_canister_version` (`opt nat64`)
- **Returns:** Nothing

The caller must be a controller of `store_canister` (or the `store_canister` itself). Both canisters must be on the same subnet.

For uploading large Wasm modules, see the [large Wasm guide](../guides/canister-management/large-wasm.md).

### `uninstall_code`

Removes a canister's code and state, making it empty. Outstanding calls are rejected. The canister retains its cycle balance, controllers, history, and settings.

- **Caller:** Controllers or subnet admins (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `sender_canister_version` (`opt nat64`)
- **Returns:** Nothing

### `canister_status`

Returns detailed information about a canister: status, settings, module hash, cycle balance, memory usage, and query statistics.

- **Caller:** Controllers, the canister itself, or subnet admins (canisters or external users; also available as a query call)
- **Parameters:**
  - `canister_id` (`principal`)
- **Returns:** A record containing:
  - `status` — `running`, `stopping`, or `stopped`
  - `ready_for_migration` (`bool`) — whether a stopped canister is ready for subnet migration (always `false` unless `stopped`)
  - `canister_version` (`nat64`) — the canister's current version number
  - `settings` — the definite canister settings currently in effect
  - `module_hash` (`opt blob`) — SHA-256 of installed module (`null` if empty)
  - `memory_size` (`nat`) — total memory consumed
  - `memory_metrics` — breakdown by component (Wasm memory, stable memory, globals, binary, custom sections, history, chunk store, snapshots)
  - `cycles` (`nat`) — current cycle balance
  - `reserved_cycles` (`nat`) — reserved cycle balance
  - `idle_cycles_burned_per_day` (`nat`) — daily idle burn rate
  - `query_stats` — query call statistics (total calls, instructions, request/response bytes)

### `canister_info`

Returns the history, current module hash, and controllers of any canister. Unlike `canister_status`, any canister can call this on any other canister.

- **Caller:** Canisters only
- **Parameters:**
  - `canister_id` (`principal`)
  - `num_requested_changes` (`opt nat64`) — how many history entries to return (default `0`)
- **Returns:**
  - `total_num_changes` (`nat64`)
  - `recent_changes` — list of canister changes (creation, deployment, controller changes, etc.)
  - `module_hash` (`opt blob`)
  - `controllers` (`vec principal`)

The system keeps at least the 20 most recent changes.

### `canister_metadata`

Reads custom-section metadata from a canister. Custom sections with names of the form `icp:public <name>` are readable by any canister. Custom sections with names of the form `icp:private <name>` are only readable by controllers.

- **Caller:** Canisters only
- **Parameters:**
  - `canister_id` (`principal`) — the canister to read metadata from
  - `name` (`text`) — identifies the custom section (`icp:public <name>` or `icp:private <name>`)
- **Returns:**
  - `value` (`blob`) — the content of the custom section

Common uses include reading `candid:service` for Candid interface discovery.

### `start_canister`

Sets a stopped or stopping canister to `running`.

- **Caller:** Controllers or subnet admins (canisters or external users)
- **Parameters:** `canister_id` (`principal`)
- **Returns:** Nothing

### `stop_canister`

Transitions a canister to `stopping`, then `stopped` once all outstanding responses are processed. While stopping, all incoming calls are rejected.

- **Caller:** Controllers or subnet admins (canisters or external users)
- **Parameters:** `canister_id` (`principal`)
- **Returns:** Nothing (returns when the canister reaches `stopped` status, or an error if it times out)

### `delete_canister`

Permanently deletes a canister. The canister must be stopped first. All state and cycles are discarded. The canister ID cannot be reused.

- **Caller:** Controllers or subnet admins (canisters or external users)
- **Parameters:** `canister_id` (`principal`)
- **Returns:** Nothing

### `deposit_cycles`

Deposits the cycles attached to this call into the specified canister.

- **Caller:** Canisters only
- **Parameters:** `canister_id` (`principal`)
- **Returns:** Nothing

## Code management (chunked uploads)

These methods support uploading large Wasm modules in chunks before installation via `install_chunked_code`.

### `upload_chunk`

Uploads a chunk (up to 1 MiB) to a canister's chunk store. Returns the SHA-256 hash of the stored chunk.

- **Caller:** Controllers or the canister itself (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `chunk` (`blob`)
- **Returns:** `record { hash : blob }`

### `clear_chunk_store`

Removes all chunks from a canister's chunk store.

- **Caller:** Controllers or the canister itself (canisters or external users)
- **Parameters:** `canister_id` (`principal`)
- **Returns:** Nothing

### `stored_chunks`

Lists the hashes of all chunks in a canister's chunk store.

- **Caller:** Controllers or the canister itself (canisters or external users)
- **Parameters:** `canister_id` (`principal`)
- **Returns:** `vec record { hash : blob }`

## Canister snapshots

Snapshots capture a canister's Wasm memory, stable memory, certified variables, chunk store, and Wasm binary. They can be loaded later to restore canister state.

### `take_canister_snapshot`

Creates a snapshot of the specified canister. Stop the canister first to ensure all outstanding callbacks are completed.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `replace_snapshot` (`opt snapshot_id`) — delete this snapshot after creating the new one
  - `uninstall_code` (`opt bool`) — uninstall code after snapshot creation
  - `sender_canister_version` (`opt nat64`)
- **Returns:** Snapshot metadata including `snapshot_id`

### `load_canister_snapshot`

Restores a canister from a previously taken snapshot. Stop the canister first.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `snapshot_id` (`snapshot_id`)
  - `sender_canister_version` (`opt nat64`)
- **Returns:** Nothing

### `list_canister_snapshots`

Lists all snapshots belonging to a canister.

- **Caller:** Controllers (canisters or external users)
- **Parameters:** `canister_id` (`principal`)
- **Returns:** List of snapshot metadata

### `delete_canister_snapshot`

Deletes a specific snapshot.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `snapshot_id` (`snapshot_id`)
- **Returns:** Nothing

### `read_canister_snapshot_metadata`

Returns all metadata of a snapshot: source (taken or uploaded), creation timestamp, Wasm size, Wasm globals, heap and stable memory sizes, chunk store hashes, canister version, certified data, and optionally the global timer and low-memory hook state.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `snapshot_id` (`snapshot_id`)
- **Returns:** Snapshot metadata record

### `read_canister_snapshot_data`

Returns a requested chunk of binary data from a snapshot: Wasm binary, heap memory, stable memory, or a chunk store entry.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `snapshot_id` (`snapshot_id`)
  - `kind` — which data to read (`wasm`, `wasm_memory`, `stable_memory`, or `chunk_store`), with `offset` and `size` (or `hash` for chunk store)
- **Returns:** `blob` — the requested data chunk

### `upload_canister_snapshot_metadata`

Creates a new snapshot by uploading metadata (Wasm size, globals, memory sizes, certified data, and optionally timer/hook state). Data is uploaded separately via `upload_canister_snapshot_data`.

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `replace_snapshot` (`opt snapshot_id`) — delete this snapshot after creating the new one
  - Snapshot metadata fields (Wasm size, globals, memory sizes, certified data, timer state, hook state)
- **Returns:** Snapshot metadata including `snapshot_id`

### `upload_canister_snapshot_data`

Uploads a chunk of binary data to a snapshot created via `upload_canister_snapshot_metadata`. Supports Wasm binary, heap memory, stable memory, and chunk store entries (max 1 MiB per chunk store entry).

- **Caller:** Controllers (canisters or external users)
- **Parameters:**
  - `canister_id` (`principal`)
  - `snapshot_id` (`snapshot_id`)
  - `kind` — which data to upload, with `offset` and chunk content
- **Returns:** Nothing

For practical usage, see the [canister snapshots guide](../guides/canister-management/snapshots.md).

## Randomness

### `raw_rand`

Returns 32 bytes of cryptographic randomness. The return value is unknown to any part of the IC at the time the call is submitted — it is resolved in the next execution round using the IC's random tape.

- **Caller:** Canisters only
- **Parameters:** None
- **Returns:** `blob` (32 bytes)

For practical usage patterns, see the [randomness guide](../guides/backends/randomness.md).

## Chain-key signing

Chain-key cryptography enables canisters to sign messages using threshold signatures without any single party holding the full private key. The management canister exposes ECDSA and Schnorr signing through the following methods.

### `ecdsa_public_key`

Returns a SEC1-encoded ECDSA public key derived for the given canister and derivation path.

- **Caller:** Canisters only
- **Parameters:**
  - `canister_id` (`opt principal`) — defaults to caller
  - `derivation_path` (`vec blob`) — up to 255 byte strings of arbitrary length
  - `key_id` (`record { curve : ecdsa_curve; name : text }`) — currently supports `secp256k1`
- **Returns:**
  - `public_key` (`blob`) — SEC1 compressed public key
  - `chain_code` (`blob`) — for deterministic child key derivation

For `secp256k1`, key derivation uses a generalization of BIP-32. To derive BIP-32-compatible public keys, each entry in `derivation_path` must be a 4-byte big-endian unsigned integer less than 2^31.

### `sign_with_ecdsa`

Signs a message hash using threshold ECDSA. The corresponding public key can be obtained via `ecdsa_public_key` with the same `derivation_path` and `key_id`.

- **Caller:** Canisters only
- **Parameters:**
  - `message_hash` (`blob`) — must be exactly 32 bytes
  - `derivation_path` (`vec blob`)
  - `key_id` (`record { curve : ecdsa_curve; name : text }`)
- **Returns:**
  - `signature` (`blob`) — concatenation of SEC1-encoded `r` and `s` values (64 bytes for `secp256k1`)
- **Cycles:** Must be explicitly attached to the call

> If the call returns a reject with code `SYS_UNKNOWN` or `CANISTER_ERROR`, the signature may still exist in the system. Do not assume the signature was not produced.

### `schnorr_public_key`

Returns a Schnorr public key derived for the given canister and derivation path.

- **Caller:** Canisters only
- **Parameters:**
  - `canister_id` (`opt principal`) — defaults to caller
  - `derivation_path` (`vec blob`) — up to 255 byte strings
  - `key_id` (`record { algorithm : schnorr_algorithm; name : text }`) — supports `bip340secp256k1` and `ed25519`
- **Returns:**
  - `public_key` (`blob`) — SEC1 compressed (for `bip340secp256k1`) or 32-byte Ed25519 format
  - `chain_code` (`blob`)

### `sign_with_schnorr`

Signs a message using threshold Schnorr. The corresponding public key can be obtained via `schnorr_public_key` with the same `derivation_path` and `key_id`.

- **Caller:** Canisters only
- **Parameters:**
  - `message` (`blob`) — the message to sign (not a hash)
  - `derivation_path` (`vec blob`)
  - `key_id` (`record { algorithm : schnorr_algorithm; name : text }`)
  - `aux` (`opt schnorr_aux`) — optional; the `bip341` variant accepts a `merkle_root_hash` for Taproot signatures (only with `bip340secp256k1`)
- **Returns:**
  - `signature` (`blob`) — 64 bytes (BIP-340 for `bip340secp256k1`, RFC 8032 for `ed25519`)
- **Cycles:** Must be explicitly attached to the call

> If the call returns a reject with code `SYS_UNKNOWN` or `CANISTER_ERROR`, the signature may still exist in the system.

For practical usage of chain-key signing in Bitcoin and Ethereum workflows, see the [Bitcoin guide](../guides/chain-fusion/bitcoin.md) and [Ethereum guide](../guides/chain-fusion/ethereum.md).

### Offline public key derivation

If you only need a public key — to derive a blockchain address or verify a signature — the management canister call can be avoided entirely. ICP's key derivation algorithm is deterministic and uses only public parameters, so derivation can be performed offline without cycles or a network connection. See the [offline key derivation guide](../guides/chain-fusion/offline-key-derivation.md) for TypeScript and Rust libraries.

## vetKD (Verifiable Encrypted Threshold Key Derivation)

### `vetkd_public_key`

Returns a vetKD public (verification) key derived for the given canister and context.

- **Caller:** Canisters only
- **Parameters:**
  - `canister_id` (`opt principal`) — defaults to caller
  - `context` (`blob`) — variable-length byte string
  - `key_id` (`record { curve : vetkd_curve; name : text }`) — supports `bls12_381_g2`
- **Returns:**
  - `public_key` (`blob`) — G2 element in BLS12-381 compressed form

### `vetkd_derive_key`

Returns an encrypted vetKD key that can be decrypted with the caller's transport secret key.

- **Caller:** Canisters only
- **Parameters:**
  - `input` (`blob`) — primary key material differentiator
  - `context` (`blob`) — domain separator
  - `key_id` (`record { curve : vetkd_curve; name : text }`)
  - `transport_public_key` (`blob`) — G1 element for encrypting the derived key
- **Returns:**
  - `encrypted_key` (`blob`) — the encrypted vetKD key
- **Cycles:** Must be explicitly attached to the call

## HTTPS outcalls

### `http_request`

Makes an HTTP request to an external URL and returns the response. This enables canisters to fetch offchain data, call external APIs, and interact with other blockchain RPCs.

- **Caller:** Canisters only
- **Parameters:**
  - `url` (`text`) — must start with `https://`; max 8192 characters
  - `max_response_bytes` (`opt nat64`) — max response size (up to 2 MB; defaults to 2 MB if not set)
  - `method` — `GET`, `HEAD`, or `POST` (replicated); additionally `PUT` and `DELETE` (non-replicated mode only)
  - `headers` (`vec record { name : text; value : text }`) — request headers (max 64 headers, 8 KiB per name/value, 48 KiB total)
  - `body` (`opt blob`) — request body
  - `transform` (`opt record { function : func; context : blob }`) — response transformation function exported by the calling canister
  - `is_replicated` (`opt bool`) — select replicated (default) or non-replicated mode
- **Returns:**
  - `status` (`nat`) — HTTP status code
  - `headers` (`vec record { name : text; value : text }`)
  - `body` (`blob`)
- **Cycles:** Must be explicitly attached to the call. Charged based on `max_response_bytes` — always set this to a reasonable value to avoid overpaying.

In replicated mode, multiple replicas make the same request. Use the `transform` function to sanitize non-deterministic parts of the response (timestamps, unique IDs) so replicas can reach consensus.

For concept details, see [HTTPS outcalls](../concepts/https-outcalls.md).

## Bitcoin API (deprecated)

> The management canister Bitcoin API is **deprecated**. Call the Bitcoin canisters directly instead: `ghsi2-tqaaa-aaaan-aaaca-cai` (mainnet) or `g4xu7-jiaaa-aaaan-aaaaq-cai` (testnet).

The following methods are documented for reference. New code should use the Bitcoin canisters directly.

### `bitcoin_get_utxos`

Returns unspent transaction outputs (UTXOs) for a Bitcoin address.

- **Caller:** Canisters only
- **Parameters:**
  - `address` (`text`) — Bitcoin address (P2PKH, P2SH, P2WPKH, P2WSH, or P2TR)
  - `network` — `mainnet` or `testnet`
  - `filter` (`opt variant`) — either `min_confirmations : nat32` (max 144) or `page : blob` for pagination
- **Returns:**
  - `utxos` (`vec utxo`) — up to 10,000 UTXOs per request, sorted by block height descending
  - `tip_block_hash` (`blob`)
  - `tip_height` (`nat32`)
  - `next_page` (`opt blob`) — pagination token if more UTXOs exist

### `bitcoin_get_balance`

Returns the balance of a Bitcoin address in satoshi.

- **Caller:** Canisters only
- **Parameters:**
  - `address` (`text`)
  - `network` — `mainnet` or `testnet`
  - `min_confirmations` (`opt nat32`)
- **Returns:** `nat64` (balance in satoshi)

### `bitcoin_send_transaction`

Submits a Bitcoin transaction to the network. The transaction must be well-formed, consume only unspent outputs, and have a positive fee.

- **Caller:** Canisters only
- **Parameters:**
  - `transaction` (`blob`) — serialized Bitcoin transaction
  - `network` — `mainnet` or `testnet`
- **Returns:** Nothing

No guarantee is provided that the transaction will enter the mempool or appear in a block.

### `bitcoin_get_current_fee_percentiles`

Returns fee percentiles (in millisatoshi/vbyte) over the last ~10,000 transactions.

- **Caller:** Canisters only
- **Parameters:**
  - `network` — `mainnet` or `testnet`
- **Returns:** `vec nat64` — 101 percentiles (0th through 100th)

### `bitcoin_get_block_headers`

Returns block headers for a range of block heights.

- **Caller:** Canisters only
- **Parameters:**
  - `start_height` (`nat32`)
  - `end_height` (`opt nat32`) — defaults to tip height
  - `network` — `mainnet` or `testnet`
- **Returns:**
  - `tip_height` (`nat32`)
  - `block_headers` (`vec blob`) — 80-byte headers in standard Bitcoin format

For Bitcoin integration patterns, see the [Bitcoin guide](../guides/chain-fusion/bitcoin.md).

## Canister logging

### `fetch_canister_logs`

Returns the most recent log entries for a canister. Logs are produced by `ic0.debug_print` and trap messages. Logs persist across upgrades but are purged on reinstall or uninstall. Total log size is capped at 4 KiB.

- **Caller:** External users only (query call; not callable by canisters)
- **Parameters:** `canister_id` (`principal`)
- **Returns:**
  - `canister_log_records` (`vec record { idx : nat64; timestamp_nanos : nat64; content : blob }`)

Log visibility is controlled by the `log_visibility` canister setting.

For practical usage, see the [canister logs guide](../guides/canister-management/logs.md).

## Subnet and node information

### `node_metrics_history`

> This API is **experimental** and may change in a non-backward-compatible way.

Returns a time series of node metrics for a given subnet. Returns up to 60 timestamps (no two from the same UTC day), starting from `start_at_timestamp_nanos`. A sample only includes metrics for nodes whose values changed since the previous sample — consumers must handle resets when a node disappears and reappears.

- **Caller:** Canisters only
- **Parameters:**
  - `subnet_id` (`principal`)
  - `start_at_timestamp_nanos` (`nat64`)
- **Returns:** A list of timestamped records, each containing a list of node metrics:
  - `node_id` (`principal`)
  - `num_blocks_proposed_total` (`nat64`)
  - `num_block_failures_total` (`nat64`)

### `subnet_info`

Returns metadata about a subnet.

- **Caller:** Canisters only
- **Parameters:**
  - `subnet_id` (`principal`)
- **Returns:**
  - `replica_version` (`text`) — the replica version running on the subnet
  - `registry_version` (`nat64`) — the registry version of the subnet

## Provisional methods (local testing only)

These methods are only available on local development instances. They do not exist on mainnet.

### `provisional_create_canister_with_cycles`

Behaves like `create_canister` but initializes the canister with the specified number of cycles (or a default amount if `null`). If `specified_id` is provided, creates the canister with that exact ID.

- **Caller:** Canisters or external users
- **Parameters:**
  - `amount` (`opt nat`) — initial cycle balance
  - `settings` (`opt canister_settings`)
  - `specified_id` (`opt principal`) — request a specific canister ID
  - `sender_canister_version` (`opt nat64`)
- **Returns:** `record { canister_id : principal }`

### `provisional_top_up_canister`

Adds cycles to any canister out of thin air.

- **Caller:** Canisters or external users (any caller)
- **Parameters:**
  - `canister_id` (`principal`)
  - `amount` (`nat`) — cycles to add
- **Returns:** Nothing

## Cycle costs

Cycle costs for management canister calls vary depending on subnet replication factor and are subject to change. Rather than hardcoding costs, use the System API cost functions to query current prices programmatically:

- `ic0.cost_create_canister` — cost of `create_canister`
- `ic0.cost_call` — cost of an inter-canister call (base + per-byte)
- `ic0.cost_http_request` — cost of `http_request`
- `ic0.cost_sign_with_ecdsa` — cost of `sign_with_ecdsa`
- `ic0.cost_sign_with_schnorr` — cost of `sign_with_schnorr`
- `ic0.cost_vetkd_derive_key` — cost of `vetkd_derive_key`

Methods that require explicit cycle attachment (`create_canister`, `sign_with_ecdsa`, `sign_with_schnorr`, `vetkd_derive_key`, `http_request`) will fail if insufficient cycles are provided.

## Candid interface

The complete Candid interface definition for the management canister is available at [`ic.did`](/reference/ic.did). This file defines all types and method signatures in machine-readable Candid format and can be used for binding generation and type checking.

<!-- sync public/reference/ic.did from .sources/portal/docs/references/_attachments/ic.did -->

## Next steps

- [Canister lifecycle guide](../guides/canister-management/lifecycle.md) — practical workflows for creating, upgrading, and managing canisters
- [Canister settings guide](../guides/canister-management/settings.md) — configuring controllers, memory, compute, and freezing thresholds
- [HTTPS outcalls](../concepts/https-outcalls.md) — architecture and constraints of outbound HTTP requests
- [Bitcoin integration](../guides/chain-fusion/bitcoin.md) — building Bitcoin-native applications with chain-key signing
- [IC interface specification](ic-interface-spec.md) — the complete formal specification

<!-- Upstream: informed by dfinity/portal — docs/references/system-canisters/management-canister.mdx, docs/references/ic-interface-spec.md, docs/references/_attachments/ic.did; dfinity/icskills — skills/cycles-management/SKILL.md -->
