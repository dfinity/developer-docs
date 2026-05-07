---
title: "IC management canister"
description: "The virtual management canister interface: canister lifecycle, threshold signing, Bitcoin, and provisional APIs"
sidebar:
  label: "Management Canister"
  order: 3
---

## The IC management canister {#ic-management-canister}

The interfaces above provide the fundamental ability for external users and canisters to contact other canisters. But the Internet Computer provides additional functionality, such as canister and user management. This functionality is exposed to external users and canisters via the *IC management canister*.

:::note

The *IC management canister* is just a facade; it does not actually exist as a canister (with isolated state, Wasm code, etc.).

:::

The IC management canister address is `aaaaa-aa` (i.e. the empty blob).

It is possible to use the management canister via external requests (a.k.a. ingress messages). The cost of processing that request is charged to the canister that is being managed. Most methods only permit the controllers to call them. Calls to `raw_rand` and `deposit_cycles` are never accepted as ingress messages.

### Interface overview {#ic-candid}

The interface description below, in [Candid syntax](../candid-spec.md), describes the available functionality. You can also [download the file](/references/ic.did).

```candid file=<rootDir>/public/references/ic.did
```

The binary encoding of arguments and results are as per Candid specification.

### IC method `create_canister` {#ic-create_canister}

This method can only be called by canisters and subnet admins, i.e., it cannot be called by external users who are not subnet admins via ingress messages.

Before deploying a canister, the administrator of the canister first has to register it with the IC, to get a canister id (with an empty canister behind it), and then separately install the code.

The optional `settings` parameter can be used to set the following settings:

-   `controllers` (`vec principal`)

    A list of at most 10 principals. The principals in this list become the *controllers* of the canister.
    Note that the caller of the `create_canister` call is not a controller of the canister
    unless it is a member of the `controllers` list.

    Default value: A list containing only the caller of the `create_canister` call.

-   `compute_allocation` (`nat`)

    Must be a number between 0 and 100, inclusively. It indicates how much compute power should be guaranteed to this canister, expressed as a percentage of the maximum compute power that a single canister can allocate. If the IC cannot provide the requested allocation, for example because it is oversubscribed, the call will be rejected.

    Default value: 0

-   `memory_allocation` (`nat`)

    Must be a number between 0 and 2<sup>64</sup>-1, inclusively.
    It indicates an amount of memory in bytes that the canister is guaranteed to be allowed to use in total.
    If the IC cannot guarantee the requested memory allocation, for example because it is oversubscribed, then the call will be rejected.

    Default value: 0

-   `freezing_threshold` (`nat`)

    Must be a number between 0 and 2<sup>64</sup>-1, inclusively, and indicates a length of time in seconds.

    A canister is considered frozen whenever the IC estimates that the canister would be depleted of cycles before `freezing_threshold` seconds pass, given the canister's current size and the IC's current cost for storage.

    Calls to a frozen canister will be rejected with `SYS_TRANSIENT` reject code. Additionally, a canister cannot perform calls if that would, due the cost of the call and transferred cycles, would push the balance into frozen territory; these calls fail with `ic0.call_perform` returning a non-zero error code.

    Default value: 2592000 (approximately 30 days).

-   `reserved_cycles_limit` (`nat`)

    Must be a number between 0 and 2<sup>128</sup>-1, inclusively, and indicates the upper limit on `reserved_cycles` of the canister.

    An operation that allocates resources such as compute and memory will fail if the new value of `reserved_cycles` exceeds this limit.

    Default value: 5_000_000_000_000 (5 trillion cycles).

-   `wasm_memory_limit` (`nat`)

    Must be a number between 0 and 2<sup>48</sup>-1 (i.e., 256TB), inclusively, and indicates the upper limit on the WASM heap memory consumption of the canister in bytes.

    An operation (update method, canister init, canister post_upgrade) that causes the WASM heap memory consumption to exceed this limit will trap.
    The WASM heap memory limit is ignored for query methods, response callback handlers, global timers, heartbeats, and canister pre_upgrade.

    If set to 0, then there's no upper limit on the WASM heap memory consumption of the canister subject to the available memory on the IC.

    Default value: 0 (i.e., no explicit limit).

    Note: in a future release of this specification, the default value and whether the limit is enforced for global timers and heartbeats might change.

-   `log_visibility` (`log_visibility`)

    Controls who can access the canister's logs through the `fetch_canister_logs` endpoint of the management canister. Can be one of:
    - `controllers`: Only the canister's controllers can fetch logs
    - `public`: Anyone can fetch the canister's logs
    - `allowed_viewers` (`vec principal`): Only principals in the provided list and the canister's controllers can fetch logs, the maximum length of the list is 10

    Default value: `controllers`.

-   `snapshot_visibility` (`snapshot_visibility`)

    Controls who can access the canister's snapshots through the following endpoints of the management canister:
    - `read_canister_snapshot_metadata`
    - `read_canister_snapshot_data`
    - `list_canister_snapshots`

    Can be one of:
    - `controllers`: Only the canister's controllers can read its snapshots
    - `public`: Anyone can read the canister's snapshots
    - `allowed_viewers` (`vec principal`): Only principals in the provided list and the canister's controllers can read its snapshots, the maximum length of the list is 10

    Default value: `controllers`.

-   `wasm_memory_threshold` (`nat`)

    Must be a number between 0 and 2<sup>64</sup>-1, inclusively, and indicates the threshold on the remaining wasm memory size of the canister in bytes:
    if the remaining wasm memory size of the canister is below the threshold, execution of the ["on low wasm memory" hook](./canister-interface.md#on-low-wasm-memory) is scheduled.

    Default value: 0 (i.e., the "on low wasm memory" hook is never scheduled).

-   `environment_variables` (`environment_variables`)

    A record containing key-value pairs where both key and value are UTF-8 encoded strings. These variables are accessible to the canister during execution and can be used to configure canister behavior without code changes. Each key must be unique.

    The maximum number of environment variables is implementation-defined. The maximum length of keys and values is implementation-defined.

    Default value: `null` (i.e., no environment variables provided).

The optional `sender_canister_version` parameter can contain the caller's canister version. If provided, its value must be equal to `ic0.canister_version`.

Until code is installed, the canister is `Empty` and behaves like a canister that has no public methods.

Cycles to pay for the call must be explicitly transferred with the call, i.e., they are not automatically deducted from the caller's balance implicitly (e.g., as for inter-canister calls). (No cycles are required on subnets that have a non-empty list of subnet admins.)

### IC method `update_settings` {#ic-update_settings}

This method can be called by canisters as well as by external users via ingress messages.

Only *controllers* of the canister can update settings. See [IC method](#ic-create_canister) for a description of settings.

Not including a setting in the `settings` record means not changing that field. The defaults described above are only relevant during canister creation.

The optional `sender_canister_version` parameter can contain the caller's canister version. If provided, its value must be equal to `ic0.canister_version`.

### IC method `upload_chunk` {#ic-upload_chunk}

This method can be called by canisters as well as by external users via ingress messages.

Canisters have associated some storage space (hence forth chunk storage) where they can hold chunks of Wasm modules that are too lage to fit in a single message. This method allows the controllers of a canister (and the canister itself) to upload such chunks. The method returns the hash of the chunk that was stored. The size of each chunk must be at most 1MiB. The maximum number of chunks in the chunk store is `CHUNK_STORE_SIZE` chunks. The storage cost of each chunk is fixed and corresponds to storing 1MiB of data.

### IC method `clear_chunk_store` {#ic-clear_chunk_store}

This method can be called by canisters as well as by external users via ingress messages.

Canister controllers (and the canister itself) can clear the entire chunk storage of a canister.

### IC method `stored_chunks` {#ic-stored_chunks}

This method can be called by canisters as well as by external users via ingress messages.

Canister controllers (and the canister itself) can list the hashes of chunks in the chunk storage of a canister.

### IC method `install_code` {#ic-install_code}

This method can be called by canisters as well as by external users via ingress messages.

This method installs code into a canister.

Only controllers of the canister can install code.

-   If `mode = variant { install }`, the canister must be empty before. This will instantiate the canister module and invoke its `canister_init` method (if present), as explained in Section "[Canister initialization](./canister-interface.md#system-api-init)", passing the `arg` to the canister.

-   If `mode = variant { reinstall }`, if the canister was not empty, its existing code and state (including stable memory) is removed before proceeding as for `mode = install`.

    Note that this is different from `uninstall_code` followed by `install_code`, as `uninstall_code` generates a synthetic reject response to all callers of the uninstalled canister that the uninstalled canister did not yet reply to and ensures that callbacks to outstanding calls made by the uninstalled canister won't be executed (i.e., upon receiving a response from a downstream call made by the uninstalled canister, the cycles attached to the response are refunded, but no callbacks are executed).

-   If `mode = variant { upgrade }` or `mode = variant { upgrade = opt record { skip_pre_upgrade = .., wasm_memory_persistence = .. } }`, this will perform an upgrade of a non-empty canister as described in [Canister upgrades](./canister-interface.md#system-api-upgrades), passing `arg` to the `canister_post_upgrade` method of the new instance. If `skip_pre_upgrade = opt true`, then the `canister_pre_upgrade` method on the old instance is not executed. If `wasm_memory_persistence = opt keep`, then the WebAssembly memory is preserved.

This is atomic: If the response to this request is a `reject`, then this call had no effect.

:::note

Some canisters may not be able to make sense of callbacks after upgrades; these should be stopped first, to wait for all outstanding callbacks, or be uninstalled first, to prevent outstanding callbacks from being invoked (by marking the corresponding call contexts as deleted). It is expected that the canister admin (or their tooling) does that separately.

:::

The `wasm_module` field specifies the canister module to be installed. The system supports multiple encodings of the `wasm_module` field, as described in [Canister module format](./canister-interface.md#canister-module-format):

-   If the `wasm_module` starts with byte sequence `[0x00, 'a', 's', 'm']`, the system parses `wasm_module` as a raw WebAssembly binary.

-   If the `wasm_module` starts with byte sequence `[0x1f, 0x8b, 0x08]`, the system parses `wasm_module` as a gzip-compressed WebAssembly binary.

The optional `sender_canister_version` parameter can contain the caller's canister version. If provided, its value must be equal to `ic0.canister_version`.

This method traps if the canister's cycle balance decreases below the canister's freezing limit after executing the method.

### IC method `install_chunked_code` {#ic-install_chunked_code}

This method can be called by canisters as well as by external users via ingress messages.

This method installs code that had previously been uploaded in chunks.

Only controllers of the target canister can call this method.

The `mode`, `arg`, and `sender_canister_version` parameters are as for `install_code`.
The `target_canister` specifies the canister where the code should be installed.
The optional `store_canister` specifies the canister in whose chunk storage the chunks are stored (this parameter defaults to `target_canister` if not specified).
For the call to succeed, the caller must be a controller of the `store_canister` or the caller must be the `store_canister`. The `store_canister` must be on the same subnet as the target canister.

The `chunk_hashes_list` specifies a list of hash values `[h1,...,hk]` with `k <= MAX_CHUNKS_IN_LARGE_WASM`. The system looks up in the chunk store of `store_canister` (or that of the target canister if `store_canister` is not specified) blobs corresponding to `h1,...,hk` and concatenates them to obtain a blob of bytes referred to as `wasm_module` in `install_code`. It then checks that the SHA-256 hash of `wasm_module` is equal to the `wasm_module_hash` parameter and calls `install_code` with parameters `(record {mode; target_canister; wasm_module; arg; sender_canister_version})`.

### IC method `uninstall_code` {#ic-uninstall_code}

This method can be called by canisters as well as by external users via ingress messages.

This method removes a canister's code and state, making the canister *empty* again.

Only controllers of the canister or subnet admins can uninstall code.

Uninstalling a canister's code will reject all calls that the canister has not yet responded to, and drop the canister's code and state. Outstanding responses to the canister will not be processed, even if they arrive after code has been installed again. Cycles attached to such responses will still be refunded though.

The canister is now [empty](./index.md#canister-lifecycle). In particular, any incoming or queued calls will be rejected.

A canister after *uninstalling* retains its *cycle* balances, *controllers*, history, status, and allocations.

The optional `sender_canister_version` parameter can contain the caller's canister version. If provided, its value must be equal to `ic0.canister_version`.

### IC method `canister_status` {#ic-canister_status}

This method can be called by canisters as well as by external users via ingress messages.
This method can also be called by external users via non-replicated (query) calls, but it cannot be called from composite query calls.

Indicates various information about the canister. It contains:

-   The status of the canister. It could be one of `running`, `stopping` or `stopped`.

-   A bool `ready_for_migration` indicating whether a stopped canister is ready to be migrated to another subnet (i.e., whether it has empty queues and flushed streams). This flag can only ever be `true` if the `status` variant (see above) is `stopped`. This property is guaranteed by the protocol, but deliberately not on the type level in order to facilitate backwards compatible service evolution.

-   The canister version.

-   The "settings" of the canister containing:

    -   The controllers of the canister. The order of returned controllers may vary depending on the implementation.

    -   The compute allocation of the canister.

    -   The memory allocation of the canister in bytes.

    -   The freezing threshold of the canister in seconds.

    -   The reserved cycles limit of the canister, i.e., the maximum number of cycles that can be in the canister's reserved balance after increasing the canister's memory allocation and/or actual memory usage.

    -   The visibility of the canister's logs.

    -   The visibility of the canister's snapshots.

    -   The WASM heap memory limit of the canister in bytes (the value of `0` means that there is no explicit limit).

    -   The "low wasm memory" threshold, which is used to determine when the [canister_on_low_wasm_memory](./canister-interface.md#on-low-wasm-memory) function is executed.
    
    -   The environment variables of the canister, which is a record containing key-value pairs used to configure the canister's behavior.

-   A SHA256 hash of the module installed on the canister. This is `null` if the canister is empty.

-   The actual memory usage of the canister, representing the total memory consumed by the canister.

-   A record containing detailed breakdown of memory usage into individual components (see [Memory Metrics](#ic-canister_status-memory_metrics) for more details).

-   The cycle balance of the canister.

-   The reserved cycles balance of the canister, i.e., the number of cycles reserved when increasing the canister's memory allocation and/or actual memory usage.

-   The idle cycle consumption of the canister, i.e., the number of cycles burned by the canister per day due to its compute and memory allocation and actual memory usage.

-   Statistics regarding the query call execution of the canister, i.e., a record containing the following fields:

    * `num_calls_total`: the total number of query and composite query methods evaluated on the canister,

    * `num_instructions_total`: the total number of WebAssembly instructions executed during the evaluation of query and composite query methods,

    * `request_payload_bytes_total`: the total number of query and composite query method payload bytes, and

    * `response_payload_bytes_total`: the total number of query and composite query response payload (reply data or reject message) bytes.

Only the controllers of the canister or the canister itself or subnet admins can request its status.

#### Memory Metrics {#ic-canister_status-memory_metrics}

    * `wasm_memory_size`: Represents the Wasm memory usage of the canister, i.e. the heap memory used by the canister's WebAssembly code.

    * `stable_memory_size`: Represents the stable memory usage of the canister.

    * `global_memory_size`: Represents the memory usage of the global variables that the canister is using.

    * `wasm_binary_size`: Represents the memory occupied by the Wasm binary that is currently installed on the canister. This is the size of the binary uploaded via `install_code` or `install_chunked_code`, e.g., the compressed size if the uploaded binary is gzipped.

    * `custom_sections_size`: Represents the memory used by custom sections defined by the canister, which may include additional metadata or configuration data.

    * `canister_history_size`: Represents the memory used for storing the canister's history.

    * `wasm_chunk_store_size`: Represents the memory used by the Wasm chunk store of the canister.

    * `snapshots_size`: Represents the memory consumed by all snapshots that belong to this canister.

All sizes are expressed in bytes.

### IC method `canister_info` {#ic-canister_info}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

Provides the history of the canister, its current module SHA-256 hash, and its current controllers. Every canister can call this method on every other canister (including itself). Users cannot call this method.

The canister history consists of a list of canister changes (canister creation, code uninstallation, code deployment, loading a snapshot, controllers change, canister renaming). Every canister change consists of the system timestamp at which the change was performed, the canister version after performing the change, the change's origin (a user or a canister), and its details. The change origin includes the principal (called *originator* in the following) that initiated the change and, if the originator is a canister, the originator's canister version when the originator initiated the change (if available).
- Canister creation is described by the full set of controllers along with a [hash of the environment variables](./https-interface.md#hash-of-map), if environment variables were specified. The order of controllers stored in the canister history may vary depending on the implementation.
- Code deployment is described by its mode (code install, code reinstall, code upgrade) and the SHA-256 hash of the newly deployed canister module.
- Loading a snapshot is described by the canister ID of the canister from which the snapshot was loaded (if that canister ID is different than the canister ID onto which the snapshot is loaded), the snapshot ID, the canister version and timestamp at which the snapshot was taken (the canister version and timestamp refer to the canister from which the snapshot was loaded), and the source of the snapshot (canister state or metadata upload).
- Controllers change is described by the full new set of controllers after the change. The order of controllers stored in the canister history may vary depending on the implementation.
- Canister renaming is described by the canister ID and the total number of canister changes before renaming as well as the canister ID, the canister version, and the total number of canister changes of the new canister ID. Because only a dedicated NNS canister can perform canister renaming, the actual principal who requested canister renaming is recorded in a separate field `requested_by`. The total number of canister changes reported by the IC method `canister_info` is overriden to the total number of canister changes of the new canister ID. Canister changes referring to the canister ID before renaming are preserved.

The system can drop the oldest canister changes from the list to keep its length bounded (at least `20` changes are guaranteed to remain in the list). The system also drops all canister changes if the canister runs out of cycles.

The following parameters should be supplied for the call:

-   `canister_id`: the canister ID of the canister to retrieve information about.

-   `num_requested_changes`: optional, specifies the number of requested canister changes. If not provided, the default value of `0` will be used.

The returned response contains the following fields:

-   `total_num_changes`: the total number of canister changes that have been ever recorded in the history. This value does not change if the system drops the oldest canister changes from the list of changes.

-   `recent_changes`: the list containing the most recent canister changes. If `num_requested_changes` is provided, then this list contains that number of changes or, if more changes are requested than available in the history, then this list contains all changes available in the history. If `num_requested_changes` is not specified, then this list is empty.

-   `module_hash`: the SHA-256 hash of the currently installed canister module (or `null` if the canister is empty).

-   `controllers`: the current set of canister controllers. The order of returned controllers may vary depending on the implementation.

### IC method `canister_metadata` {#ic-canister_metadata}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

Provides access to canister's metadata contained in custom sections whose names have the form `icp:public <name>` or `icp:private <name>`
(see [Canister module format](./canister-interface.md#canister-module-format) for requirements on custom sections).

Every canister can retrieve public metadata (in custom sections whose names have the form `icp:public <name>`) of every other canister (including itself).
Only controllers of a canister can access its private metadata (in custom sections whose names have the form `icp:private <name>`).

The following parameters should be supplied for the call:

-   `canister_id` (`principal`): the canister ID of the canister to retrieve metadata from.

-   `name` (`text`): identifies canister's metadata contained in a custom section whose name has the form `icp:public <name>` or `icp:private <name>`
    (note that a canister cannot have custom sections with both `icp:public <name>` or `icp:private <name>` as names for the same `<name>`, see [Canister module format](./canister-interface.md#canister-module-format)).

The returned response contains the following fields:

-   `value` (`blob`): the content of canister's metadata identified by the given `name`.

### IC method `stop_canister` {#ic-stop_canister}

This method can be called by canisters as well as by external users via ingress messages.

The controllers of a canister or subnet admins may stop a canister (e.g., to prepare for a canister upgrade).

When this method successfully returns, then the canister status is `stopped` at that point.
However, note that the canister might be restarted at any time due to a concurrent call.

The execution of this method proceeds as follows:

- The immediate effect is that the status of the canister is changed to `stopping` (unless the canister is already stopped).
- The IC now rejects all calls to a stopping canister, indicating that the canister is stopping. Responses to a stopping canister are processed as usual.
- When all outstanding responses have been processed (so that there are no open call contexts), the canister status is changed to `stopped`.
- If the canister status is changed to `stopped` within an implementation-specific timeout, then this method successfully returns.
- Otherwise, this method returns an error (the canister status is still `stopping` and might eventually become `stopped` if all outstanding responses have been processed and the canister has not been restarted by a separate call).

### IC method `start_canister` {#ic-start_canister}

This method can be called by canisters as well as by external users via ingress messages.

A canister may be started by its controllers or subnet admins.

If the canister status was `stopped` or `stopping` then the canister status is simply set to `running`. In the latter case all `stop_canister` calls which are processing fail (and are rejected).

If the canister was already `running` then the status stays unchanged.

### IC method `delete_canister` {#ic-delete_canister}

This method can be called by canisters as well as by external users via ingress messages.

This method deletes a canister from the IC.

Only controllers of the canister or subnet admins can delete it and the canister must already be stopped. Deleting a canister cannot be undone, any state stored on the canister is permanently deleted and its cycles are discarded. Once a canister is deleted, its ID cannot be reused.

### IC method `deposit_cycles` {#ic-deposit_cycles}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method deposits the cycles included in this call into the specified canister.

### IC method `raw_rand` {#ic-raw_rand}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method takes no input and returns 32 pseudo-random bytes to the caller. The return value is unknown to any part of the IC at time of the submission of this call. A new return value is generated for each call to this method.

### IC method `ecdsa_public_key` {#ic-ecdsa_public_key}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method returns a [SEC1](https://www.secg.org/sec1-v2.pdf) encoded ECDSA public key for the given canister using the given derivation path. If the `canister_id` is unspecified, it will default to the canister id of the caller. The `derivation_path` is a vector of variable length byte strings. Each byte string may be of arbitrary length, including empty. The total number of byte strings in the `derivation_path` must be at most 255. The `key_id` is a struct specifying both a curve and a name. The availability of a particular `key_id` depends on the implementation.

For curve `secp256k1`, the public key is derived using a generalization of BIP32 (see [ia.cr/2021/1330, Appendix D](https://ia.cr/2021/1330)). To derive (non-hardened) [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)-compatible public keys, each byte string (`blob`) in the `derivation_path` must be a 4-byte big-endian encoding of an unsigned integer less than 2<sup>31</sup>. If the `derivation_path` contains a byte string that is not a 4-byte big-endian encoding of an unsigned integer less than 2<sup>31</sup>, then a derived public key will be returned, but that key derivation process will not be compatible with the [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) standard.

The return value is an extended public key consisting of an ECDSA `public_key`, encoded in [SEC1](https://www.secg.org/sec1-v2.pdf) compressed form, and a `chain_code`, which can be used to deterministically derive child keys of the `public_key`.

This call requires that an ECDSA key with ID `key_id` was generated by the IC. Otherwise, the call is rejected.

### IC method `sign_with_ecdsa` {#ic-sign_with_ecdsa}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method returns a new [ECDSA](https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.186-4.pdf) signature of the given `message_hash` that can be separately verified against a derived ECDSA public key. This public key can be obtained by calling `ecdsa_public_key` with the caller's `canister_id`, and the same `derivation_path` and `key_id` used here. 

:::note

If the signing request returns a reject response whose reject code is `SYS_UNKNOWN` or `CANISTER_ERROR`, the signature may exist in the system even though it's not returned to the requesting canister. Thus, canisters should not rely on the signature not existing in these cases.

:::

The signatures are encoded as the concatenation of the [SEC1](https://www.secg.org/sec1-v2.pdf) encodings of the two values r and s. For curve `secp256k1`, this corresponds to 32-byte big-endian encoding.

This call requires that an ECDSA key with ID `key_id` was generated by the IC, the signing functionality for that key was enabled, and `message_hash` is 32 bytes long. Otherwise, the call is is rejected.

Cycles to pay for the call must be explicitly transferred with the call, i.e., they are not automatically deducted from the caller's balance implicitly (e.g., as for inter-canister calls).

### IC method `schnorr_public_key` {#ic-schnorr_public_key}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method returns a (derived) Schnorr public key for the given canister using the given derivation path. If the `canister_id` is unspecified, it will default to the canister id of the caller. The `derivation_path` is a vector of variable length byte strings. Each byte string may be of arbitrary length, including empty. The total number of byte strings in the `derivation_path` must be at most 255. The `key_id` is a struct specifying both an algorithm and a name. The availability of a particular `key_id` depends on the implementation.

The return value is an extended Schnorr public key consisting of a Schnorr `public_key` and a `chain_code`. The chain code can be used to deterministically derive child keys of the `public_key`. Both the derivation and the encoding of the public key depends on the key ID's `algorithm`:

-   For algorithm `bip340secp256k1`, the public key is derived using the generalization of BIP32 defined in [ia.cr/2021/1330, Appendix D](https://ia.cr/2021/1330). To derive (non-hardened) [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki)-compatible public keys, each byte string (`blob`) in the `derivation_path` must be a 4-byte big-endian encoding of an unsigned integer less than 2<sup>31</sup>. If the `derivation_path` contains a byte string that is not a 4-byte big-endian encoding of an unsigned integer less than 2<sup>31</sup>, then a derived public key will be returned, but that key derivation process will not be compatible with the [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) standard.

    The public key is encoded in [SEC1](https://www.secg.org/sec1-v2.pdf) compressed form. To use BIP32 public keys to verify BIP340 Schnorr signatures, the first byte of the (33-byte) SEC1-encoded public key must be removed (see [BIP-340, Public Key Conversion](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki#public-key-conversion)).

-   For algorithm `ed25519`, the public key is derived using the scheme specified in [Ed25519 hierarchical key derivation](#ed25519-key-derivation).

    The public key is encoded in standard 32-byte compressed form (see [RFC8032, 5.1.2 Encoding](https://datatracker.ietf.org/doc/html/rfc8032#section-5.1.2)).

This call requires that a Schnorr key with ID `key_id` was generated by the IC. Otherwise, the call is rejected.

#### Ed25519 hierarchical key derivation {#ed25519-key-derivation}

This section describes a child key derivation (CKD) function for computing child public keys from Ed25519 parent public keys.
The section is inspired by [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki) and uses similar wording and structure.

##### Motivation

To support the Ed25519 variant of threshold Schnorr signatures on the Internet Computer, a key derivation scheme compatible with Ed25519 signatures is required.
For a respective signing service on the Internet Computer to be efficient, the signing subnet maintains only a single master key pair and _derives_ signing child keys for each canister.
Although there exist various hierarchical key derivation schemes (e.g., [BIP32](https://github.com/bitcoin/bips/blob/master/bip-0032.mediawiki), [SLIP10](https://github.com/satoshilabs/slips/blob/master/slip-0010.md), [BIP32-Ed25519](https://input-output-hk.github.io/adrestia/static/Ed25519_BIP.pdf), [Schnorrkel](https://github.com/w3f/schnorrkel)), all of the analyzed schemes are either incompatible in a threshold setting (e.g., use hardened key derivation only), comply with clamping which adds unnecessary complexity, or otherwise rely on non-standard primitives.
For these reasons, a new derivation scheme is specified here.
This scheme does not make use of _clamping_ (see [RFC8032, Section 5.1.5, Item 2](https://datatracker.ietf.org/doc/html/rfc8032#section-5.1.5)), because it is unnecessary in the given setting, and satisfies the following requirements:

- Off-chain availability: New public keys can be computed off-chain from a master public key without requiring interaction with the IC.
- Hierarchical derivation: Derived keys are organized in a tree such that from any public key it is possible to derive new child keys. The first level is used to derive unique canister-specific keys from the master key.
- Simplicity: The scheme is simple to implement using existing libraries.

##### Conventions

We will assume the elliptic curve (EC) operations using the field and curve parameters as defined by Ed25519 (see [RFC8032, Section 5.1](https://datatracker.ietf.org/doc/html/rfc8032#section-5.1)). Variables below are either:

- Integers modulo the order of the curve's prime order subgroup (referred to as L).
- Points on the curve.
- Byte sequences.

Addition (+) of two points is defined as application of the EC group operation.
Concatenation (||) is the operation of appending one byte sequence onto another.

We assume the following functions:

- point(p): returns the point resulting from EC point multiplication (repeated application of the EC group operation) of the Ed25519 base point with the integer p.
- ser<sub>P</sub>(P): serializes the point to a byte sequence using standard 32-byte compressed form (see [RFC8032, 5.1.2 Encoding](https://datatracker.ietf.org/doc/html/rfc8032#section-5.1.2)).
- utf8(s): returns the UTF-8 encoding of string s.
- parse<sub>512</sub>(p): interprets a 64-byte sequence as a 512-bit number, most significant byte first.
- HKDF(salt,IKM,info,N) -> OKM: HMAC-based key derivation function (see [RFC5869](https://datatracker.ietf.org/doc/html/rfc5869)) using HMAC-SHA512 (see [RFC4231](https://datatracker.ietf.org/doc/html/rfc4231)) calculating N-bytes long output key material (OKM) from (byte sequences) salt, input key material (IKM), and application specific information *info*.

##### Extended keys

Public keys are extended with an extra 32 bytes of entropy, which extension is called chain code.
An extended public key is represented as (K, c), with K = point(k) and c being the chain code, for some private key k.
Each extended key can have an arbitrary number of child keys.
The scheme does not support hardened derivation of child keys.

##### Child key derivation (CKD) function

Given a parent extended public key and an index i, it is possible to compute the corresponding child extended public key.
The function CKDpub computes a child extended public key from a parent extended public key and an index i, where i is a byte sequence of arbitrary length (including empty).

CKDpub((K<sub>par</sub>, c<sub>par</sub>), i) → (K<sub>i</sub>, c<sub>i</sub>):
- let IKM = ser<sub>P</sub>(K<sub>par</sub>) || i.
- let OKM = HKDF(c<sub>par</sub>, IKM, utf8("Ed25519"), 96).
- Split OKM into a 64-byte and a 32-byte sequence, tweak and c<sub>i</sub>.
- let K<sub>i</sub> = K<sub>par</sub> + point(parse<sub>512</sub>(tweak) mod L).
- return (K<sub>i</sub>, c<sub>i</sub>).

##### Key tree

A key tree can be built by repeatedly applying CKDpub, starting with one root, called the master extended public key M.
Computing CKDpub(M, i) for different values of i results in a number of level-0 derived keys.
As each of these is again an extended key, CKDpub can be applied to those as well.
The sequence of indices used when repeatedly applying CKDpub is called the _derivation path_.

The function KTpub computes a child extended public key from a parent extended public key and a derivation path d.

KTpub((K<sub>par</sub>, c<sub>par</sub>), d) → (K<sub>d</sub>, c<sub>d</sub>):
- let (K<sub>d</sub>, c<sub>d</sub>) = (K<sub>par</sub>, c<sub>par</sub>)
- for all indices i in d:
  (K<sub>d</sub>, c<sub>d</sub>) = CKDpub((K<sub>d</sub>, c<sub>d</sub>), i)
- return (K<sub>d</sub>, c<sub>d</sub>).

### IC method `sign_with_schnorr` {#ic-sign_with_schnorr}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method returns a Schnorr signature of the given `message` that can be verified against a (derived) public key obtained by calling `schnorr_public_key` using the caller's `canister_id` and the given `derivation_path` and `key_id`.

:::note

If the signing request returns a reject response whose reject code is `SYS_UNKNOWN` or `CANISTER_ERROR`, the signature may exist in the system even though it's not returned to the requesting canister. Thus, canisters should not rely on the signature not existing in these cases.

:::

The encoding of the signature depends on the key ID's `algorithm`:

-   For algorithm `bip340secp256k1`, the signature is encoded in 64 bytes according to [BIP340](https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki).

-   For algorithm `ed25519`, the signature is encoded in 64 bytes according to [RFC8032, 5.1.6 Sign](https://datatracker.ietf.org/doc/html/rfc8032#section-5.1.6). Note that the returned signature is **non-deterministic** and a different signature may be computed every time it is requested.

This call requires that a Schnorr key with ID `key_id` was generated by the IC and the signing functionality for that key was enabled. Otherwise, the call is rejected.

This call accepts an optional auxiliary parameter `aux`. The auxiliary parameter type `schnorr_aux` is an enumeration. The only currently supported variant is `bip341` which allows passing a Merkle tree root hash, which is required to implement Taproot signatures as defined in [BIP341](https://github.com/bitcoin/bips/blob/master/bip-0341.mediawiki). The `bip341` variant is only allowed for `bip340secp256k1` signatures, and if provided the `merkle_root_hash` must be generated in accordance with BIP341's specification for `taproot_output_script`. Specifically it should be either an empty bytestring (for the `script == None` case) or else 32 bytes generated using the procedure documented as `taproot_tree_helper`. If no auxiliary parameter is provided, then `bip340secp256k1` signatures are generated in accordance with BIP340.

On the Internet Computer, the tuple of the requested master key, the calling canister, and derivation path determines which private key is used to generate the signature, and which public key is returned by `schnorr_public_key`.

When using BIP341 signatures, the actual signature that is created will be relative to the Schnorr signature derived as described in BIP341's `taproot_sign_script`. The key returned by `schnorr_public_key` is the value identified in BIP341 as `internal_pubkey`.

Cycles to pay for the call must be explicitly transferred with the call, i.e., they are not automatically deducted from the caller's balance implicitly (e.g., as for inter-canister calls).

### IC method `vetkd_public_key` {#ic-vetkd_public_key}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method returns the vetKD public (verification) key derived from the vetKD master public key with ID `key_id` for the canister with the given `canister_id` and the given `context`.

If the `canister_id` is unspecified, it will default to the canister id of the caller. The `context` is a byte string of variable length. The `key_id` is a struct specifying both a curve and a name. The availability of a particular `key_id` depends on the implementation.

The public key returned for an empty `context` is called _canister public key_. Given this canister public key, the public key for a particular `context` can also be derived offline.

For curve `bls12_381_g2`, the returned `public_key` is a G<sub>2</sub> element in compressed form in [BLS Signatures Draft RFC](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature-05#name-bls12-381) encoding.

This call requires that a vetKD master key with ID `key_id` was generated by the IC and the key derivation functionality for that key was enabled, and that the `canister_id` meets the requirement of a canister id. Otherwise, the call is is rejected.

### IC method `vetkd_derive_key` {#ic-vetkd_derive_key}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method returns a vetKD key (aka vetKey) encrypted under `transport_public_key` and derived from the vetKD master key with ID `key_id` based on the caller's `input` for a given `context`.

Both the `input` and the `context` are byte strings of variable length. While both are inputs to the underlying key derivation algorithm (implicitly together with the calling canister's ID), `input` is intended as the primary differentiator when deriving different keys, while `context` is intended as domain separator.
The `key_id` is a struct specifying both a curve and a name. The availability of a particular `key_id` depends on the implementation.

Both the encrypted and the decrypted form of the vetKD key can be verified by using the respective vetKD public (verification) key, which can be obtained by calling the IC method `vetkd_public_key`.

For curve `bls12_381_g2`, the following holds:

-   The `transport_public_key` is a G<sub>1</sub> element in compressed form in [BLS Signatures Draft RFC](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature-05#name-bls12-381) encoding. Transport public keys are created by calculating *tpk = g<sub>1</sub><sup>tsk</sup>*, where the transport secret key *tsk* is chosen uniformly at random from Z<sub>p</sub>.

-   The returned `encrypted_key` is the blob `E1 · E2 · E3`, where E<sub>1</sub> and E<sub>3</sub> are G<sub>1</sub> elements, and E<sub>2</sub> is a G<sub>2</sub> element, all in compressed form in [BLS Signatures Draft RFC](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature-05#name-bls12-381) encoding.

    The encrypted key can be verified by ensuring *e(E<sub>1</sub>, g<sub>2</sub>) == e(g<sub>1</sub>, E<sub>2</sub>)*, and *e(E<sub>3</sub>, g<sub>2</sub>) == e(tpk, E<sub>2</sub>) \* e(H(dpk · `input`), dpk)*, where *dpk* is the derived (vetKD) public key associated with the respective `context`, `key_id`, and the canister ID of the caller.

-   The decrypted vetKD key *k* is obtained by calculating E<sub>3</sub> \* E<sub>1</sub><sup>-tsk</sup>, where tsk ∈ Z<sub>p</sub> is the transport secret key that was used to generate the `transport_public_key`.

    The key can be verified by ensuring *e(k, g<sub>2</sub>) == e(H(dpk · `input`), dpk)*, where *dpk* is the derived (vetKD) public key associated with the respective `context`, `key_id`, and the canister ID of the caller. Such verification protects against untrusted canisters returning invalid keys.

where

-   g<sub>1</sub>, g<sub>2</sub> are generators of G<sub>1</sub>, G<sub>2</sub>, which are groups of prime order *p*,

-   \* denotes the group operation in G<sub>1</sub>, G<sub>2</sub>, and G<sub>T</sub>,

-   e: `G1 x G2 → GT` is the pairing (see [BLS Signatures Draft RFC, Appendix A](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature-05#name-bls12-381)),

-   H hashes into G<sub>1</sub> according to the [BLS12-381 message augmentation scheme ciphersuite in the BLS Signatures Draft RFC](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-bls-signature#name-message-augmentation-2) (see also [Hashing to Elliptic Curves Draft RFC](https://datatracker.ietf.org/doc/html/draft-irtf-cfrg-hash-to-curve#name-suites-for-bls12-381)),

-   `·` and · denote concatenation

This call requires that a vetKD master key with ID `key_id` was generated by the IC and the key derivation functionality for that key was enabled. Otherwise, the call is is rejected.

Cycles to pay for the call must be explicitly transferred with the call, i.e., they are not automatically deducted from the caller's balance implicitly (e.g., as for inter-canister calls).

### IC method `http_request` {#ic-http_request}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

This method makes an HTTP request to a given URL and returns the HTTP response, possibly after a transformation.

The method can be called in either replicated or non-replicated mode. In the replicated mode, the same HTTP request is performed by multiple IC replicas, providing strong guarantees on the integrity of the response. In the non-replicated mode, the request is made by a single replica, with weak integrity guarantees.

:::note

The non-replicated mode is considered EXPERIMENTAL. Canister developers must be aware that the API may evolve in a non-backward-compatible way.

:::

Both because of replication and to handle network issues, the canister should aim to issue *idempotent* requests, meaning that it must not change the state at the remote server, or that the remote server has the means to identify duplicated requests. Otherwise, the risk of failure increases.

In the replicated mode, the responses for all identical requests must match, too. However, a web service could return slightly different responses for identical idempotent requests. For example, it may include some unique identification or a timestamp that would vary across responses.

For this reason, the calling canister can supply a transformation function, which the IC uses to let the canister sanitize the responses from such unique values. The transformation function is executed separately on the corresponding response received for a request (both in replicated and non-replicated modes). Only the transformed response will be available to the calling canister.

Currently, the `GET`, `HEAD`, and `POST` methods are supported for HTTP requests. Additionally, the `PUT` and `DELETE` methods are supported in non-replicated mode only. `PUT` and `DELETE` are restricted to non-replicated mode to avoid confusing race conditions that may occur with replicated execution.

It is important to note the following for the usage of the `POST` method:

- The calling canister must make sure that the remote server is able to recognize requests as duplicates of each other and apply only one of them, even if they are sent from multiple sources. This may require, for example, to set a certain request header to uniquely identify the request. This is especially important in the replicated mode.

- There is no guarantee that all sent requests are as specified by the canister.

Furthermore, for all methods, the following holds:

- There are no confidentiality guarantees on the request or response content.

- In the replicated mode, if the canister receives a response, then at least one request that was sent matched the canister's request, and the response was to that request. In the non-replicated mode, there are no such guarantees. The canister should not assume the integrity of the response and must check it by some other means.

For security reasons, only HTTPS connections are allowed (URLs must start with `https://`). The IC uses industry-standard root CA lists to validate certificates of remote web servers.

The **size** of an HTTP request from the canister or an HTTP response from the remote HTTP server is the total number of bytes representing the names and values of HTTP headers and the HTTP body. The maximal size for the request from the canister is `2MB` (`2,000,000B`). Each request can specify a maximal size for the response from the remote HTTP server. The upper limit on the maximal size for the response is `2MB` (`2,000,000B`) and this value also applies if no maximal size value is specified. An error will be returned when the request or response is larger than the maximal size.

The following parameters should be supplied for the call:

-   `url` - the requested URL. The URL must be valid according to [RFC-3986](https://www.ietf.org/rfc/rfc3986.txt), it might contain non-ASCII characters according to [RFC-3987](https://www.ietf.org/rfc/rfc3987.txt), and its length must not exceed `8192`. The URL may specify a custom port number.

-   `max_response_bytes` - optional, specifies the maximal size of the response in bytes. If provided, the value must not exceed `2MB` (`2,000,000B`). The call will be charged based on this parameter. If not provided, the maximum of `2MB` will be used.

-   `method` - currently, `GET`, `HEAD`, and `POST` are supported. Additionally, `PUT` and `DELETE` are supported in non-replicated mode only.

-   `headers` - list of HTTP request headers and their corresponding values

-   `body` - optional, the content of the request's body

-   `transform` - an optional record that includes a function that transforms raw responses to sanitized responses, and a byte-encoded context that is provided to the function upon invocation, along with the response to be sanitized. If provided, the calling canister itself must export this function

-   `is_replicated` - optional, selecting between replicated and non-replicated modes.

:::note

The `is_replicated` field is considered EXPERIMENTAL.

:::

Cycles to pay for the call must be explicitly transferred with the call, i.e., they are not automatically deducted from the caller's balance implicitly (e.g., as for inter-canister calls).

The returned response (and the response provided to the `transform` function, if specified) contains the following fields:

-   `status` - the response status (e.g., 200, 404)

-   `headers` - list of HTTP response headers and their corresponding values

-   `body` - the response's body

The `transform` function may, for example, transform the body in any way, add or remove headers, modify headers, etc. The maximal number of bytes representing the response produced by the `transform` function is equal to `max_response_bytes`, if provided, otherwise the default value of `2MB` (`2,000,000B`) is used as the limit. Note that the number of bytes representing the response produced by the `transform` function includes the serialization overhead of the encoding produced by the canister.

When the transform function is invoked by the system due to a canister HTTP request, the caller's identity is the principal of the management canister. This information can be used by developers to implement an access control mechanism for this function.

The following additional limits apply to HTTP requests and HTTP responses from the remote server:

-   the number of headers must not exceed `64`,

-   the number of bytes representing a header name or value must not exceed `8KiB`, and

-   the total number of bytes representing the header names and values must not exceed `48KiB`.

If the request headers provided by the canister do not contain a `user-agent` header (case-insensitive),
then the IC sends a `user-agent` header (case-insensitive) with the value `ic/1.0`
in addition to the headers provided by the canister. Such an additional header does not contribute
to the above limits on HTTP request headers.

:::note

The Internet Computer mainnet supports requests to both IPv6 and IPv4 destinations. The system prioritizes a direct connection to IPv6 addresses (i.e., the domain has a `AAAA` DNS record). If a direct connection cannot be established (e.g., the domain only has an IPv4 address via an A record), the request is automatically retried through a proxy.

:::

:::warning

If you do not specify the `max_response_bytes` parameter, the maximum of a `2MB` response will be charged for, which is expensive in terms of cycles. Always set the parameter to a reasonable upper bound of the expected (network and transformed) response size to not incur unnecessary cycles costs for your request.

:::

### IC method `node_metrics_history` {#ic-node_metrics_history}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

:::note

The node metrics management canister API is considered EXPERIMENTAL. Canister developers must be aware that the API may evolve in a non-backward-compatible way.

:::

Given a subnet ID as input, this method returns a time series of node metrics (field `node_metrics`). The timestamps are represented as nanoseconds since 1970-01-01 (field `timestamp_nanos`) at which the metrics were sampled. The returned timestamps are all timestamps after (and including) the provided timestamp (field `start_at_timestamp_nanos`) for which node metrics are available. The maximum number of returned timestamps is 60 and no two returned timestamps belong to the same UTC day.

Note that a sample will only include metrics for nodes whose metrics changed compared to the previous sample. This means that if a node disappears in one sample and later reappears its metrics will restart from 0 and consumers of this API need to adjust for these resets when aggregating over multiple samples.

A single metric entry is a record with the following fields:

- `node_id` (`principal`): the principal characterizing a node;

- `num_blocks_proposed_total` (`nat64`): the number of blocks proposed by this node;

- `num_block_failures_total` (`nat64`): the number of failed block proposals by this node.

### IC method `subnet_info` {#ic-subnet_info}

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

Given a subnet ID as input, this method returns a record `subnet_info` containing metadata about that subnet.

The fields returned are:
- `replica_version` (`text`) of the targeted subnet
- `registry_version` (`nat64`) of the targeted subnet

### IC method `take_canister_snapshot` {#ic-take_canister_snapshot}

This method can be called by canisters as well as by external users via ingress messages.

This method takes a snapshot of the specified canister. A snapshot consists of the wasm memory, stable memory, certified variables, wasm chunk store and wasm binary.

A `take_canister_snapshot` call creates a new snapshot. However, the call might fail if the maximum number of snapshots per canister is reached. This error can be avoided by providing an existing snapshot ID via the optional `replace_snapshot` parameter. That existing snapshot will be deleted once a new snapshot has been successfully created.

It's important to note that a new snapshot might increase the memory footprint of the canister. Thus, the canister's balance must have a sufficient amount of cycles so that the canister does not become frozen. This issue can be mitigated by uninstalling code of the canister via the optional `uninstall_code` parameter after a new snapshot has been successfully created. The exact semantics of uninstalling code is described in the section on the IC method [`uninstall_code`](#ic-uninstall_code).

Only controllers can take a snapshot of a canister and load it back to the canister.

:::note

It's important to stop a canister before taking a snapshot to ensure that all outstanding callbacks are completed. Failing to do so may cause the canister to not make sense of the callbacks if its state is restored using the snapshot.
It is expected that the canister controllers (or their tooling) do this separately.

:::

The optional `sender_canister_version` parameter can contain the caller's canister version. If provided, its value must be equal to `ic0.canister_version`.

### IC method `load_canister_snapshot` {#ic-load_canister_snapshot}

This method can be called by canisters as well as by external users via ingress messages.

This method loads a snapshot identified by `snapshot_id` onto the canister. It fails if no snapshot with the specified `snapshot_id` can be found.

The snapshot can only be loaded onto a canister that belongs to the same subnet as the canister from which the snapshot is loaded.

The caller must be a controller of

- the canister onto which the snapshot is loaded; and

- the canister from which the snapshot is loaded.

:::note

It's important to stop a canister before loading a snapshot to ensure that all outstanding callbacks are completed. Failing to do so may cause the canister to not make sense of the callbacks if its state is restored.
It is expected that the canister controllers (or their tooling) do this separately.

:::

The optional `sender_canister_version` parameter can contain the caller's canister version. If provided, its value must be equal to `ic0.canister_version`.

### IC method `read_canister_snapshot_metadata` {#ic-read_canister_snapshot_metadata}

This method can be called by canisters as well as by external users via ingress messages.

Who is allowed to read the metadata of a snapshot of that canister is determined by the field `snapshot_visibility` in `canister_settings` and can be one of the following variants:
- `controllers`: Only the canister's controllers can read its snapshots metadata
- `public`: Anyone can read the canister's snapshots metadata
- `allowed_viewers` (`vec principal`): Only principals in the provided list and the canister's controllers can read snapshots metadata, the maximum length of the list is 10

This method returns all metadata of a snapshot identified by `snapshot_id` of the canister identified by `canister_id`. It fails if no snapshot with the specified `snapshot_id` can be found for that canister.

The returned metadata of a snapshot contain:

- the "source" of the snapshot, i.e., whether the snapshot was created by taking the canister state using the method [`take_canister_snapshot`](#ic-take_canister_snapshot) or by (snapshot) metadata upload using the method [`upload_canister_snapshot_metadata`](#ic-upload_canister_snapshot_metadata);

- the timestamp at which the snapshot was created, i.e., the method [`take_canister_snapshot`](#ic-take_canister_snapshot) or [`upload_canister_snapshot_metadata`](#ic-upload_canister_snapshot_metadata) executed;

- the size of the canister WASM (in bytes);

- values of WASM globals (not to be confused with global variables in a high-level programming language) that are either exported or mutable in the canister WASM;

- sizes of WASM (a.k.a. heap) and stable memory (in bytes);

- hashes of chunks in the WASM chunk store;

- the [canister version](./canister-interface.md#system-api-canister-version) when the snapshot was created, i.e., the method [`take_canister_snapshot`](#ic-take_canister_snapshot) or [`upload_canister_snapshot_metadata`](#ic-upload_canister_snapshot_metadata) executed;

- the [certified data](./canister-interface.md#system-api-certified-data);

- (optional) the state of the [global timer](./canister-interface.md#global-timer), i.e., whether it is inactive or active with a deadline (in nanoseconds since 1970-01-01);

- (optional) the state of the [on low wasm memory](./canister-interface.md#on-low-wasm-memory) hook, i.e., whether the condition for the hook to be scheduled is not satisfied, the hook is ready to be executed (i.e., the hook has been scheduled), or the hook has already been executed.

The state of the global timer and on low wasm memory hook are `null` for existing snapshots created before release [release-2025-04-03_03-15-base (68fc31a141b25f842f078c600168d8211339f422](https://dashboard.internetcomputer.org/release/68fc31a141b25f842f078c600168d8211339f422) rolled out between April 7, 2025, and April 14, 2025, in the ICP mainnet.

### IC method `read_canister_snapshot_data` {#ic-read_canister_snapshot_data}

This method can be called by canisters as well as by external users via ingress messages.

Who is allowed to read a snapshot of that canister is determined by the field `snapshot_visibility` in `canister_settings` and can be one of the following variants:
- `controllers`: Only the canister's controllers can read its snapshots
- `public`: Anyone can read the canister's snapshots
- `allowed_viewers` (`vec principal`): Only principals in the provided list and the canister's controllers can read snapshots, the maximum length of the list is 10

This method returns a requested kind of (binary) data from a snapshot identified by `snapshot_id` of the canister identified by `canister_id`. It fails if no snapshot with the specified `snapshot_id` can be found for that canister.

The following kinds of (binary) data from a snapshot can be requested:

- chunk of the canister WASM starting at a given `offset` and with a given `size` of the chunk (`offset + size` must not exceed the canister WASM size as in the snapshot metadata);

- chunk of the WASM (a.k.a. heap) memory starting at a given `offset` and with a given `size` of the chunk (`offset + size` must not exceed the WASM memory size as in the snapshot metadata);

- chunk of the stable memory starting at a given `offset` and with a given `size` of the chunk (`offset + size` must not exceed the stable memory size as in the snapshot metadata);

- (full) chunk in the WASM chunk store identified by its `hash` (`hash` must be present in the snapshot metadata).

### IC method `upload_canister_snapshot_metadata` {#ic-upload_canister_snapshot_metadata}

This method can be called by canisters as well as by external users via ingress messages.

Only controllers of a canister can create a snapshot of that canister by uploading the snapshot's metadata.

An `upload_canister_snapshot_metadata` call creates a new snapshot. However, the call might fail if the maximum number of snapshots per canister is reached. This error can be avoided by providing an existing snapshot ID via the optional `replace_snapshot` parameter. That existing snapshot will be deleted once a new snapshot has been successfully created (in particular, before data is uploaded to that new snapshot using subsequent `upload_canister_snapshot_data` calls).

It's important to note that a new snapshot will increase the memory footprint of the canister. Thus, the canister's balance must have a sufficient amount of cycles so that the canister does not become frozen.

Uploaded metadata of a snapshot contain:

- the size of the canister WASM (in bytes);

- values of WASM globals (not to be confused with global variables in a high-level programming language) that are either exported or mutable in the canister WASM;

- sizes of WASM (a.k.a. heap) and stable memory (in bytes);

- the [certified data](./canister-interface.md#system-api-certified-data);

- (optional) the state of the [global timer](./canister-interface.md#global-timer), i.e., whether it is inactive or active with a deadline (in nanoseconds since 1970-01-01);

- (optional) the state of the [on low wasm memory](./canister-interface.md#on-low-wasm-memory) hook, i.e., whether the condition for the hook to be scheduled is not satisfied, the hook is ready to be executed (i.e., the hook has been scheduled), or the hook has already been executed.

If the state of the global timer and/or the on low wasm memory hook are not provided in the uploaded metadata,
then their state is not updated when loading the snapshot using the method `load_canister_snapshot`.

### IC method `upload_canister_snapshot_data` {#ic-upload_canister_snapshot_data}

This method can be called by canisters as well as by external users via ingress messages.

Only controllers of a canister can upload data to a snapshot of that canister.

This method uploads a provided (binary) chunk of a provided kind of (binary) data to a snapshot identified by `snapshot_id` of the canister identified by `canister_id`. It fails if no snapshot with the specified `snapshot_id` can be found for that canister or if the snapshot with the specified `snapshot_id` has been created using the method `take_canister_snapshot` (i.e., not by uploading snapshot metadata).

The following kinds of (binary) data can be uploaded to a snapshot:

- chunk of the canister WASM starting at a given `offset` (`offset + |chunk|` must not exceed the canister WASM size as in the snapshot metadata);

- chunk of the WASM (a.k.a. heap) memory starting at a given `offset` (`offset + |chunk|` must not exceed the WASM memory size as in the snapshot metadata);

- chunk of the stable memory starting at a given `offset` (`offset + |chunk|` must not exceed the stable memory size as in the snapshot metadata);

- (full) chunk in the WASM chunk store (the length `|chunk|` of the provided chunk must be at most 1MiB and the maximum number of chunks in the chunk store of the snapshot is `CHUNK_STORE_SIZE` chunks).

It's important to note that uploading a chunk to the WASM chunk store of the snapshot will increase the memory footprint of the canister. Thus, the canister's balance must have a sufficient amount of cycles so that the canister does not become frozen. On the other hand, uploading a chunk to the canister WASM, WASM (a.k.a.) heap memory, and stable memory does increase the memory footprint of the canister since their sizes have been fixed when uploading the snapshot's metadata.

### IC method `list_canister_snapshots` {#ic-list_canister_snapshots}

This method can be called by canisters as well as by external users via ingress messages.

This method lists the snapshots of the canister identified by `canister_id`.

Who is allowed to list the snapshots of that canister is determined by the field `snapshot_visibility` in `canister_settings` and can be one of the following variants:
- `controllers`: Only the canister's controllers can list its snapshots
- `public`: Anyone can list the canister's snapshots
- `allowed_viewers` (`vec principal`): Only principals in the provided list and the canister's controllers can list the snapshots, the maximum length of the list is 10

### IC method `delete_canister_snapshot` {#ic-delete_canister_snapshot}

This method can be called by canisters as well as by external users via ingress messages.

This method deletes a specified snapshot that belongs to an existing canister. An error will be returned if the snapshot is not found. 

A snapshot cannot be found if it was never created, it was previously deleted, replaced by a new snapshot through a `take_canister_snapshot` or `upload_canister_snapshot_metadata` request, or if the canister itself has been deleted or run out of cycles.

A snapshot may be deleted only by the controllers of the canister that the snapshot belongs to.

### IC method `fetch_canister_logs` {#ic-fetch_canister_logs}

This method can only be called by external users via non-replicated (query) calls, i.e., it cannot be called by canisters, cannot be called via replicated calls, and cannot be called from composite query calls.

Given a canister ID as input, this method returns a vector of logs of that canister including its trap messages.
The canister logs are *not* collected in canister methods running in non-replicated mode (NRQ, TQ, CQ, CRy, CRt, CC, and F modes, as defined in [Overview of imports](./canister-interface.md#system-api-imports)) and the canister logs are *purged* when the canister is reinstalled or uninstalled.
The total size of all returned logs does not exceed 4KiB.
If new logs are added resulting in exceeding the maximum total log size of 4KiB, the oldest logs will be removed.
Logs persist across canister upgrades and they are deleted if the canister is reinstalled or uninstalled.

The log visibility is defined in the `log_visibility` field of `canister_settings` and can be one of the following variants:

- `controllers`: only the canister's controllers can fetch logs (default);
- `public`: everyone can fetch logs;
- `allowed_viewers` (`vec principal`): only principals in the provided list and the canister's controllers can fetch logs, the maximum length of the list is 10.

A single log is a record with the following fields:

- `idx` (`nat64`): the unique sequence number of the log for this particular canister;
- `timestamp_nanos` (`nat64`): the timestamp as nanoseconds since 1970-01-01 at which the log was recorded;
- `content` (`blob`): the actual content of the log;

:::warning

The response of a query comes from a single replica, and is therefore not appropriate for security-sensitive applications.
Replica-signed queries may improve security because the recipient can verify the response comes from the correct subnet.

:::

### IC method `list_canisters` {#ic-list_canisters}

This method can only be called by external users with subnet admin privileges via non-replicated (query) calls, i.e., it cannot be called by canisters, cannot be called via replicated calls, and cannot be called from composite query calls.

This method returns the list of all canisters on the subnet as consecutive canister ID ranges. Deleted canisters are not included in the result.

A canister ID range is a record with the following fields:

- `start` (`principal`): the first canister ID in the range (inclusive);
- `end` (`principal`): the last canister ID in the range (inclusive).

:::warning

The response of a query comes from a single replica, and is therefore not appropriate for security-sensitive applications.
Replica-signed queries may improve security because the recipient can verify the response comes from the correct subnet.

:::

## The IC Bitcoin API {#ic-bitcoin-api}

The Bitcoin API exposed by the management canister is DEPRECATED.
Developers should interact with the Bitcoin canisters (`ghsi2-tqaaa-aaaan-aaaca-cai` for Bitcoin mainnet and `g4xu7-jiaaa-aaaan-aaaaq-cai` for Bitcoin testnet) directly.
Information about Bitcoin and the IC Bitcoin integration can be found in the [Bitcoin developer guides](https://developer.bitcoin.org/devguide/) and  the [Bitcoin integration documentation](../../guides/chain-fusion/bitcoin.md).

### IC method `bitcoin_get_utxos` {#ic-bitcoin_get_utxos}

:::note

This method is DEPRECATED. Canister developers are advised to call the method of the same name on the Bitcoin (mainnet or testnet) canister.

:::

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

Given a `get_utxos_request`, which must specify a Bitcoin address and a Bitcoin network (`mainnet` or `testnet`), the function returns all unspent transaction outputs (UTXOs) associated with the provided address in the specified Bitcoin network based on the current view of the Bitcoin blockchain available to the Bitcoin component. The UTXOs are returned sorted by block height in descending order.

The following address formats are supported:

-   Pay to public key hash (P2PKH)

-   Pay to script hash (P2SH)

-   Pay to witness public key hash (P2WPKH)

-   Pay to witness script hash (P2WSH)

-   Pay to taproot (P2TR)

If the address is malformed, the call is rejected.

The optional `filter` parameter can be used to restrict the set of returned UTXOs, either providing a minimum number of confirmations or a page reference when pagination is used for addresses with many UTXOs. In the first case, only UTXOs with at least the provided number of confirmations are returned, i.e., transactions with fewer than this number of confirmations are not considered. In other words, if the number of confirmations is `c`, an output is returned if it occurred in a transaction with at least `c` confirmations and there is no transaction that spends the same output with at least `c` confirmations.

There is an upper bound of 144 on the minimum number of confirmations. If a larger minimum number of confirmations is specified, the call is rejected. Note that this is not a severe restriction as the minimum number of confirmations is typically set to a value around 6 in practice.

It is important to note that the validity of transactions is not verified in the Bitcoin component. The Bitcoin component relies on the proof of work that goes into the blocks and the verification of the blocks in the Bitcoin network. For a newly discovered block, a regular Bitcoin (full) node therefore provides a higher level of security than the Bitcoin component, which implies that it is advisable to set the number of confirmations to a reasonably large value, such as 6, to gain confidence in the correctness of the returned UTXOs.

There is an upper bound of 10,000 UTXOs that can be returned in a single request. For addresses that contain sufficiently many UTXOs, a partial set of the address's UTXOs are returned along with a page reference.

In the second case, a page reference (a series of bytes) must be provided, which instructs the Bitcoin component to collect UTXOs starting from the corresponding "page".

A `get_utxos_request` without the optional `filter` results in a request that considers the full blockchain, which is equivalent to setting `min_confirmations` to 0.

The recommended workflow is to issue a request with the desired number of confirmations. If the `next_page` field in the response is not empty, there are more UTXOs than in the returned vector. In that case, the `page` field should be set to the `next_page` bytes in the subsequent request to obtain the next batch of UTXOs.

### IC method `bitcoin_get_balance` {#ic-bitcoin_get_balance}

:::note

This method is DEPRECATED. Canister developers are advised to call the method of the same name on the Bitcoin (mainnet or testnet) canister.

:::

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

Given a `get_balance_request`, which must specify a Bitcoin address and a Bitcoin network (`mainnet` or `testnet`), the function returns the current balance of this address in `Satoshi` (10^8 Satoshi = 1 Bitcoin) in the specified Bitcoin network. The same address formats as for [`bitcoin_get_utxos`](#ic-bitcoin_get_utxos) are supported.

If the address is malformed, the call is rejected.

The optional `min_confirmations` parameter can be used to limit the set of considered UTXOs for the calculation of the balance to those with at least the provided number of confirmations in the same manner as for the [`bitcoin_get_utxos`](#ic-bitcoin_get_utxos) call.

Given an address and the optional `min_confirmations` parameter, `bitcoin_get_balance` iterates over all UTXOs, i.e., the same balance is returned as when calling [`bitcoin_get_utxos`](#ic-bitcoin_get_utxos) for the same address and the same number of confirmations and, if necessary, using pagination to get all UTXOs for the same tip hash.

### IC method `bitcoin_send_transaction` {#ic-bitcoin_send_transaction}

:::note

This method is DEPRECATED. Canister developers are advised to call the method of the same name on the Bitcoin (mainnet or testnet) canister.

:::

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

Given a `send_transaction_request`, which must specify a `blob` of a Bitcoin transaction and a Bitcoin network (`mainnet` or `testnet`), several checks are performed:

-   The transaction is well formed.

-   The transaction only consumes unspent outputs with respect to the current (longest) blockchain, i.e., there is no block on the (longest) chain that consumes any of these outputs.

-   There is a positive transaction fee.

If at least one of these checks fails, the call is rejected.

If the transaction passes these tests, the transaction is forwarded to the specified Bitcoin network. Note that the function does not provide any guarantees that the transaction will make it into the mempool or that the transaction will ever appear in a block.

### IC method `bitcoin_get_current_fee_percentiles` {#ic-bitcoin_get_current_fee_percentiles}

:::note

This method is DEPRECATED. Canister developers are advised to call the method of the same name on the Bitcoin (mainnet or testnet) canister.

:::

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

The transaction fees in the Bitcoin network change dynamically based on the number of pending transactions. It must be possible for a canister to determine an adequate fee when creating a Bitcoin transaction.

This function returns fee percentiles, measured in millisatoshi/vbyte (1000 millisatoshi = 1 satoshi), over the last 10,000 transactions in the specified network, i.e., over the transactions in the last approximately 4-10 blocks.

The [standard nearest-rank estimation method](https://en.wikipedia.org/wiki/Percentile#The_nearest-rank_method), inclusive, with the addition of a 0th percentile is used. Concretely, for any i from 1 to 100, the ith percentile is the fee with rank `⌈i * 100⌉`. The 0th percentile is defined as the smallest fee (excluding coinbase transactions).

### IC method `bitcoin_get_block_headers` {#ic-bitcoin_get_block_headers}

:::note

This method is DEPRECATED. Canister developers are advised to call the method of the same name on the Bitcoin (mainnet or testnet) canister.

:::

This method can only be called by canisters, i.e., it cannot be called by external users via ingress messages.

Given a start height, an optional end height, and a Bitcoin network (`mainnet` or `testnet`), the function returns the block headers in the provided range. The range is inclusive, i.e., the block headers at the start and end heights are returned as well.
An error is returned when an end height is specified that is greater than the tip height.

If no end height is specified, all blocks until the tip height, i.e., the largest available height, are returned. However, if the range from the start height to the end height or the tip height is large, only a prefix of the requested block headers may be returned in order to bound the size of the response.

The response is guaranteed to contain the block headers in order: if it contains any block headers, the first block header occurs at the start height, the second block header occurs at the start height plus one and so forth.

The response is a record consisting of the tip height and the vector of block headers.
The block headers are 80-byte blobs in the [standard Bitcoin format](https://developer.bitcoin.org/reference/block_chain.html#block-headers).

## The IC Provisional API {#ic-provisional-api}

The IC Provisional API for creating canisters and topping up canisters out of thin air is only available in local development instances.

### IC method `provisional_create_canister_with_cycles` {#ic-provisional_create_canister_with_cycles}

This method can be called by canisters as well as by external users via ingress messages.

As a provisional method on development instances, the `provisional_create_canister_with_cycles` method is provided. It behaves as `create_canister`, but initializes the canister's balance with `amount` fresh cycles (using `DEFAULT_PROVISIONAL_CYCLES_BALANCE` if `amount = null`). If `specified_id` is provided, the canister is created under this id. Note that canister creation using `create_canister` or `provisional_create_canister_with_cycles` with `specified_id = null` can fail after calling `provisional_create_canister_with_cycles` with provided `specified_id`. In that case, canister creation should be retried.

The optional `sender_canister_version` parameter can contain the caller's canister version. If provided, its value must be equal to `ic0.canister_version`.

Cycles added to this call via `ic0.call_cycles_add` and `ic0.call_cycles_add128` are returned to the caller.

This method is only available in local development instances.

### IC method `provisional_top_up_canister` {#ic-provisional_top_up_canister}

This method can be called by canisters as well as by external users via ingress messages.

As a provisional method on development instances, the `provisional_top_up_canister` method is provided. It adds `amount` cycles to the balance of canister identified by `amount`.

Cycles added to this call via `ic0.call_cycles_add` and `ic0.call_cycles_add128` are returned to the caller.

Any user can top-up any canister this way.

This method is only available in local development instances.

<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->
