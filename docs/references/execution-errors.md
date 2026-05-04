---
title: "Execution Errors"
description: "Reference for canister execution errors on ICP: causes, example messages, and how to fix each error."
sidebar:
  order: 10
---

A reference for errors returned when executing canisters on ICP. Each entry includes the error message, what causes it, and how to fix it.

## Trap errors

### Trapped

The canister encountered a WebAssembly trap.

**Example error:**
```
Canister trapped: <WebAssembly error>
```

A trap is an interruption of code execution that returns an error. WebAssembly operations that trap include out-of-bounds memory accesses, integer division by zero, and the `unreachable` instruction. When a canister traps, message execution ends immediately and any state changes made during that message execution are rolled back.

Common root causes:

- **Heap out of bounds**: the canister accessed heap memory that has not been allocated. Check for places where memory is allocated (creating vectors, buffers) and whether you try to access that memory before it is allocated.
- **Stable memory out of bounds**: similar to heap out of bounds but for stable memory.
- **Integer division by zero**: the canister attempted to divide by zero. Inspect the canister code for any division operations.
- **Unreachable**: typically produced when a Rust canister panics. Rust canisters using `ic-cdk` macros automatically convert panics to `ic0.trap` calls with a human-readable message including the file, line, and panic reason.

To fix this error, test the canister to identify unhandled errors. Review the [canister trapping guide](../guides/canister-management/lifecycle.md) for detailed guidance on traps during upgrades and inter-canister calls.

### Trapped explicitly

The canister aborted execution by calling the `ic0.trap` system API.

**Example error:**
```
Canister called `ic0.trap` with message: <Canister error message>
```

When encountering an error, canisters may choose to fail with an error message by calling the [`ic0.trap` API](./ic-interface-spec/canister-interface.md). The Rust and Motoko CDKs insert calls to this API when panicking.

To fix this error, test the canister to determine which inputs trigger panics. Review the error message embedded in the trap to identify the source of the failure.

---

## Instruction and memory limit errors

### Instruction limit exceeded

The canister reached the maximum number of allowed instructions before completing execution.

**Example error:**
```
Canister exceeded the instruction limit for single message execution.
```

ICP limits the number of WebAssembly instructions a canister can execute per message to protect against non-terminating computations. The limit differs by message type:

| Message type | Instruction limit |
|---|---|
| Update call / heartbeat / timer | 40 billion |
| Query call | 5 billion |
| Canister install / upgrade | 300 billion |
| `inspect_message` | 200 million |

See [resource limits](./cycles-costs.md) for the full table.

To fix this error, use tools such as the performance counter API or [canbench](https://github.com/dfinity/canbench) to identify which sections of code use the most instructions and optimize them.

### Memory access limit exceeded

The amount of data the canister tried to read or write from stable memory exceeded the per-message limit.

**Example error:**
```
Canister exceeded memory access limits: Exceeded the limit for the number of modified pages in the stable memory in a single message execution: limit: 8388608 KB.
```

Although stable memory can hold hundreds of GiB of data, each message must execute within a round and is limited to reading and writing only a portion of that data. See [resource limits](./cycles-costs.md) for current values.

To fix this error, break up operations that read or write large regions of stable memory into multiple messages, using self-calls if necessary.

### Slice overrun

The canister tried to perform a large copy that cannot be completed in a single round.

**Example error:**
```
Canister attempted to perform a large memory operation that used N instructions and exceeded the slice limit M.
```

ICP maintains a consistent block rate by limiting the number of operations per round. A single large copy (to or from stable memory, or within the main heap) may be too large to execute within a round and cannot be automatically split into smaller copies.

To fix this error, find the locations in the canister code that execute large copies and split them into multiple smaller copies.

### Out of memory

The canister tried to request more memory than the system can provide during execution.

**Example error:**
```
Canister cannot grow its memory usage.
```

ICP imposes limits on both the main memory (Wasm heap, up to 4 GiB for wasm32 or 6 GiB for wasm64) and stable memory (up to 500 GiB) per canister, as well as on the total memory per subnet. This error is triggered when any one of those limits is reached.

To diagnose this error, check the canister's current memory usage using the [`canister_status` API](./ic-interface-spec/management-canister.md#ic-canister_status) or the `icp canister status` command. Subnet memory usage is visible on the [ICP dashboard](https://dashboard.internetcomputer.org/subnets).

To fix this error:

- If the canister has reached the system-wide limit and the usage is expected, shard data across multiple canisters.
- If the canister has unexpectedly reached the limit, debug it for memory leaks. [canbench](https://github.com/dfinity/canbench) can help profile memory usage.
- If the subnet is full, move the canister to a subnet with more available memory.

### Wasm memory limit exceeded

The canister tried to grow its Wasm heap memory beyond the limit set by its `wasm_memory_limit` setting.

**Example error:**
```
Canister exceeded its current Wasm memory limit of 2147483648 bytes. The peak Wasm memory usage was 2147485000 bytes. If the canister reaches 4GiB, then it may stop functioning and may become unrecoverable. Please reach out to the canister owner to investigate the reason for the increased memory usage. It might be necessary to move data from the Wasm memory to the stable memory. If such high Wasm memory usage is expected and safe, then the developer can increase the Wasm memory limit in the canister settings.
```

Canisters can impose a limit on Wasm heap memory usage to prevent reaching the maximum (4 GiB for wasm32, 6 GiB for wasm64). A canister that reaches the maximum may be unable to upgrade if the `pre_upgrade` hook requires additional heap memory.

To diagnose this error, check the canister's `wasm_memory_limit` setting. If memory usage is unexpected, use [canbench](https://github.com/dfinity/canbench) to check for a memory leak.

To fix this error:
- Migrate data from heap memory to stable memory.
- Shard data across multiple canisters.
- Increase the `wasm_memory_limit` setting if you are certain the canister can use more memory and remain upgradeable.

### Reserved pages for old Motoko

The canister is running an older version of Motoko that reserves additional Wasm heap pages for upgrading.

**Example error:**
```
Canister tried to allocate pages reserved for upgrading older versions of Motoko.
```

Newer versions of Motoko do not require these reserved pages. This issue only occurs for Motoko versions `0.6.20` and older.

To fix this error, upgrade to a newer version of icp-cli (which includes a newer Motoko compiler). Any icp-cli version shipping Motoko 0.6.21 or later eliminates this error.

---

## Cycles errors

### Insufficient cycles in memory grow

The canister does not have enough cycles to grow its memory.

**Example error:**
```
Canister cannot grow memory by 65536 bytes due to insufficient cycles.
```

Canisters pay for their memory each round. Growing memory requires that the canister have enough cycles to pay for the increased usage. For operations like uploading a Wasm chunk, taking a snapshot, or installing code, the error message may include an "At least X additional cycles are required" suffix indicating the shortfall.

To fix this error, top up the canister with more cycles. See the [cycles management guide](../guides/canister-management/cycles-management.md).

### Reserved cycles limit exceeded in memory grow

Growing the canister's memory would require reserving more cycles than the canister's reserved cycles limit allows.

**Example error:**
```
Canister cannot grow memory by 65536 bytes due to its reserved cycles limit. The current limit (5000000000) would be exceeded by 1000000.
```

When subnets run low on memory, growing memory requires reserving cycles to pay for future usage. Canisters have a `reserved_cycles_limit` setting, and this error means growing memory would exceed that limit.

To diagnose this error, check the canister's current `reserved_cycles_limit` using `icp canister status` or the `canister_status` API. Subnet memory usage is visible on the [ICP dashboard](https://dashboard.internetcomputer.org/subnets).

To fix this error, increase the canister's reserved cycles limit or move it to a subnet with lower memory usage.

### Reserved cycles limit exceeded in memory allocation

Increasing the canister's memory allocation would require reserving more cycles than the reserved cycles limit allows.

**Example error:**
```
Cannot increase memory allocation to 50000000000 due to its reserved cycles limit. The current limit (1000000000000) would be exceeded by 301000000.
```

Similar to the error above, but triggered when changing the `memory_allocation` canister setting rather than during normal execution.

To fix this error, increase the canister's reserved cycles limit or move it to a subnet with lower memory usage.

### Reserved cycles limit is too low

There was an attempt to set the `reserved_cycles_limit` to a value lower than the canister's current reserved cycles balance.

**Example error:**
```
Cannot set the reserved cycles limit 1000 below the reserved cycles balance of the canister 2000.
```

To fix this error, increase the reserved cycles limit to a value at or above the reported reserved cycles balance.

### Insufficient cycles in message memory growth

The canister doesn't have enough cycles to allocate the memory required to send a message.

**Example error:**
```
Canister cannot grow message memory by 10240 bytes due to insufficient cycles.
```

Sending a message to another canister reserves space in subnet memory for the message and its response. This error means the canister doesn't have enough cycles to pay for that memory without freezing.

To fix this error, top up the canister with more cycles. See the [cycles management guide](../guides/canister-management/cycles-management.md).

### Insufficient cycles in compute allocation

The canister does not have enough cycles to increase its compute allocation.

**Example error:**
```
Cannot increase compute allocation to 50 due to insufficient cycles. At least 1000000000 additional cycles are required.
```

Canisters pay for compute allocation. This error means an attempt was made to increase the compute allocation beyond what the canister can currently pay for.

To fix this error, top up the canister with more cycles. See the [cycles management guide](../guides/canister-management/cycles-management.md).

### Insufficient cycles in memory allocation

The canister does not have enough cycles to increase its memory allocation.

**Example error:**
```
Cannot increase memory allocation to 40000000000 due to insufficient cycles. At least 10000000000 additional cycles are required.
```

Canisters pay for memory allocation. This error means an attempt was made to increase the memory allocation beyond what the canister can currently pay for.

To fix this error, top up the canister with more cycles. See the [cycles management guide](../guides/canister-management/cycles-management.md).

### Install code not enough cycles

A canister doesn't have enough cycles to execute an install message.

**Example error:**
```
Canister installation failed with `Canister xxx-xxx is out of cycles: please top up the canister with at least 10000000000 additional cycles`.
```

To fix this error, top up the canister with additional cycles before retrying the installation. See the [cycles management guide](../guides/canister-management/cycles-management.md).

### Create canister not enough cycles

The request to create a canister did not include enough cycles to pay the creation fee.

**Example error:**
```
Creating a canister requires a fee of 100000000000 that is deducted from the canister's initial balance but only 1000000 cycles were received with the create_canister request.
```

To fix this error, include enough cycles with the request to meet the canister creation fee.

---

## System API constraint errors

### Calling a system API from the wrong mode

The canister tried to use a system API call in a message type where it is not permitted.

**Example error:**
```
Canister violated contract: "ic0.call_new" cannot be executed in non-replicated query mode.
```

Certain system APIs are only available in specific message types. For a complete overview of which system APIs are available in which contexts, see the [IC interface specification](./ic-interface-spec/canister-interface.md#system-api-imports).

Common cases:
- Trying to make a call in a query (only allowed in composite queries).
- Trying to set a timer in a composite query (only allowed in updates).

To fix this error, change the call type to one that supports the API, or restructure the logic to avoid calling the restricted API in that context.

### `msg_reply_data_append` payload too large

The canister tried to reply with a payload larger than the maximum allowed response size.

**Example error:**
```
Canister violated contract: ic0.msg_reply_data_append: application payload size (3000000) cannot be larger than 2097152.
```

The response to a message cannot exceed the maximum allowed response size (2 MiB for replicated execution, 3 MiB for query calls). Consider having the canister check the size of a response before replying and truncating it or returning an error if it is too long.

### `msg_reject` payload too large

The canister tried to reject a message with a payload larger than the maximum allowed response.

**Example error:**
```
Canister violated contract: ic0.msg_reject: application payload size (3000000) cannot be larger than 2097152.
```

The string included with a rejection cannot exceed the maximum allowed response size. Consider checking the size of the reject string before replying and truncating it or returning a different error if it is too long.

### `certified_data_set` payload too large

The canister tried to set certified data that exceeds the ICP limit on certified data size.

**Example error:**
```
Canister violated contract: ic0_certified_data_set failed because the passed data must be no larger than 32 bytes. Found 100 bytes.
```

The certified data field is limited to 32 bytes. To fix this error, certify just a hash of the data instead of its full contents. For background on certified data, see the [IC interface specification](./ic-interface-spec/canister-interface.md#system-api-certified-data).

### Canister made a call with too large a method name

The canister tried to execute a call with a method name that is too long.

**Example error:**
```
Canister violated contract: Size of method_name 22000 exceeds the allowed limit of 20000.
```

Method names are generally short (similar to function names), so a name that is too long likely indicates a bug in the calling canister. Run the canister locally and use debug printing to verify the correct method name is being called.

### Canister made a call with too large a payload

The canister tried to make a call with a payload that exceeds ICP message size limits.

**Example error:**
```
Canister violated contract: Request to xxx-xxx:foo has a payload size of 20000000, which exceeds the allowed limit of 10485760.
```

To fix this error, debug the calling canister to check that it is not sending more data than required. If the payload is correct, redesign any APIs so that large amounts of data can be transferred across multiple smaller messages. Same-subnet inter-canister calls allow up to 10 MiB; cross-subnet calls and ingress messages are limited to 2 MiB.

### Canister made a call with too long a timeout

The canister tried to make a call with a timeout that exceeds the maximum allowed timeout.

**Example error:**
```
Canister violated contract: Request to xxx-xxx:foo has a timeout of {} seconds, which exceeds the allowed timeout duration.
```

To fix this error, check that the correct timeout is set (the timeout is in seconds). If a very long timeout is required, consider not setting a timeout at all.

---

## Wasm module validation errors

### Method not found

The canister was called with a method name not exported by that canister.

**Example error:**
```
Canister has no update method 'foobar'.
```

To fix this error:

- Verify that the method name exactly matches the name exported by the callee.
- Verify that the method type (update, query, composite query) matches the exported method.
- Check whether the callee's canister code has been updated to a version that renamed or removed the method.

### Wasm module not found

The canister exists but has no Wasm module installed.

**Example error:**
```
Attempted to execute a message, but the canister contains no Wasm module.
```

A canister can exist without having Wasm code installed if it has never been deployed or if it has been uninstalled. Check the canister status using `icp canister status` or the `canister_status` API to confirm whether a module is installed (the "Module hash" field will be non-null if code is present).

To fix this error, deploy code to the canister using `icp deploy` or the [`install_code`](./ic-interface-spec/management-canister.md#ic-install_code) / [`install_chunked_code`](./ic-interface-spec/management-canister.md#ic-install_chunked_code) management canister APIs.

### Wasm module too large

The canister's Wasm module exceeds the maximum allowed size.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module size of 200000000 exceeds the maximum allowed size of 104857600.
```

The Wasm module size limit is 100 MiB.

To fix this error, shrink or optimize the Wasm module using [`ic-wasm`](https://github.com/dfinity/ic-wasm). If the module is still too large, remove unneeded dependencies or refactor the logic into multiple canisters.

### Wasm module duplicate exports

The canister is exporting multiple methods with the same name.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module has an invalid export section. Duplicate function 'foo' exported multiple times with different call types: update, query, or composite_query.
```

To fix this error, rename one of the duplicated exports.

### Wasm module exports too many methods

The canister exports more methods than the maximum allowed by ICP.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module has an invalid export section. The number of exported functions called `canister_update <name>`, `canister_query <name>`, or `canister_composite_query <name>` exceeds 1000.
```

The limit is 1000 exported update, query, and composite query methods.

To fix this error, consolidate the logic of multiple methods into a single method that takes an additional argument to distinguish which logic to run, or separate logic across multiple canisters.

### Wasm module sum of exported name lengths too large

The sum of the name lengths of all exported methods is too large.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module has an invalid export section. The sum of `<name>` lengths in exported functions called `canister_update <name>`, `canister_query <name>`, or `canister_composite_query <name>` exceeds 20000.
```

The total length of all exported method names (combined) must not exceed 20,000 characters.

To fix this error, choose shorter method names.

### Wasm module too many functions

The canister's Wasm module contains more functions than ICP allows.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module defined 60000 functions, which exceeds the maximum number allowed 50000.
```

The limit is 50,000 functions per Wasm module.

To fix this error, use [`ic-wasm`](https://github.com/dfinity/ic-wasm) to remove unused functions. If the limit is still exceeded, split the logic across multiple canisters.

### Wasm module too many globals

The canister's Wasm module contains more globals than ICP allows.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module defined 1200 globals which exceeds the maximum number allowed 1000.
```

The limit is 1,000 globals per Wasm module.

To fix this error, group related globals into a larger structure stored in Wasm heap memory.

### Wasm module function complexity too high

The canister's Wasm module contains a function that ICP rejects because it may take too long to compile.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module contains a function at index 7 with complexity 1300000 which exceeds the maximum complexity allowed 1000000.
```

Certain Wasm instructions (such as those involving branching or indirection) take a long time to compile. Each function is limited in how many such instructions it may use.

To fix this error, break the large function up into multiple smaller functions.

### Wasm module function too large

The canister's Wasm module contains a function that is too large.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module contains a function at index 7 of size 1500000 that exceeds the maximum allowed size of 1000000.
```

ICP limits the number of Wasm instructions per function body to 1,000,000.

To fix this error, break the large function up into multiple smaller functions.

### Wasm module function name too large

The canister's Wasm module contains a function with a name that is too large.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module contains a function at index 7 with name 'very_long_function_name...' of size 1500000 bytes that exceeds the maximum allowed size of 1048576 bytes.
```

Function names are limited to 1 MiB.

To fix this error, use shorter function names.

### Wasm module code section too large

The total size of all function bodies in the canister's Wasm module is too large.

**Example error:**
```
Canister's Wasm module is not valid: Wasm module code section size of 1200000 exceeds the maximum allowed size of 10485760.
```

The [code section](https://webassembly.github.io/spec/core/binary/modules.html#code-section) of the Wasm module is limited to 10 MiB.

To fix this error, use [`ic-wasm`](https://github.com/dfinity/ic-wasm) to shrink the code section. If the limit is still exceeded, split the logic across multiple canisters.

### Wasm chunk store error

There was an error while executing a method to manipulate the canister's Wasm chunk store.

**Example error:**
```
Error from Wasm chunk store: Cannot upload chunk. At least 10000000 additional cycles are required.
```

Wasm chunk store operations include `upload_chunk`, `clear_chunk_store`, and `install_chunked_code`. This error may indicate insufficient cycles or a mismatch in chunk hashes.

To fix this error, top up the canister if it does not have enough cycles, or use the `stored_chunks` API to inspect which chunks have been uploaded if you get errors about mismatching or missing hashes. See the [large Wasm module guide](../guides/canister-management/large-wasm.md).

---

## Canister lifecycle errors

### Invalid controller

An action failed because it can only be performed by a controller of the canister.

**Example error:**
```
Only the controllers of the canister {} can control it.
Canister's controllers: xxx-xxx yyy-yyy
Sender's ID: zzz-zzz
```

Certain actions (such as updating the canister's Wasm code) can only be performed by controllers. To fix this error, perform the action from a principal that is already a controller, or have an existing controller add your principal to the canister's controller list.

### Canister not found

An action was performed on a canister that does not exist.

**Example error:**
```
Canister xxx-xxx not found.
```

To fix this error, confirm that the canister ID is correct. When testing locally, ensure the canister is listed in your project's configuration file and has been deployed with `icp deploy`.

### Canister not empty

There was an attempt to install code on a canister that already has code installed.

**Example error:**
```
Canister xxx-xxx cannot be installed because the canister is not empty. Try installing with mode='reinstall' instead.
```

Installing a Wasm module is only for canisters that have no existing state. If the intention is to update the Wasm module while preserving state, use an [upgrade](../guides/canister-management/lifecycle.md) instead. If the intention is to overwrite the canister state entirely, use `reinstall` mode.

### Delete canister not stopped

There was an attempt to delete a canister that is not in the stopped state.

**Example error:**
```
Canister xxx-xxx must be stopped before it is deleted.
```

Canisters must be stopped before deletion to ensure no calls are left unresolved. Check the status of the canister. If it is `Stopping`, wait for all outstanding calls to be resolved before proceeding. Otherwise, stop the canister before deleting it.

### Delete canister self

A canister executed a request to delete itself.

**Example error:**
```
Canister xxx-xxx cannot delete itself.
```

A canister cannot delete itself. To fix this error, delete the canister from one of its other controllers. If the only controller is the canister itself, it cannot be directly deleted: it will first be frozen when its cycle balance falls below the freezing threshold, and eventually deleted when the balance reaches zero.

### Delete canister queue not empty

There was a request to delete a canister that has non-empty input or output queues.

**Example error:**
```
Canister xxx-xxx has messages in its queues and cannot be deleted now. Please retry after some time.
```

A canister cannot be deleted while it has pending messages because those messages would be lost. Wait until the pending messages have been processed. To prevent new messages from arriving, stop the canister before deleting it.

### Install code rate limited

An install message for the canister cannot be executed because the canister has been rate limited.

**Example error:**
```
Canister xxx-xxx is rate limited because it executed too many instructions in the previous install_code messages. Please retry installation after several minutes.
```

There is a limit on how many instructions a canister can execute for installations in a given time period. To fix this error, retry the installation after a few minutes.

### Missing upgrade option

There was an upgrade message that was missing a required field.

**Example error:**
```
Missing upgrade option: Enhanced orthogonal persistence requires the `wasm_memory_persistence` upgrade option.
```

To fix this error, resend the message with the required fields included.

### Invalid upgrade option

There was an upgrade message with an invalid field.

**Example error:**
```
Invalid upgrade option: The `wasm_memory_persistence: opt Keep` upgrade option requires that the new canister module supports enhanced orthogonal persistence.
```

To fix this error, resend the message after omitting or correcting the invalid field.

### Invalid settings

A canister was created with invalid settings, or there was an attempt to change canister settings to an invalid value.

**Example error:**
```
Could not validate the settings: Invalid settings: 'controllers' length exceeds maximum size allowed of 10.
```

To fix this error, apply the described changes to make the settings valid. A canister may have at most 10 controllers.

---

## Subnet capacity errors

### Subnet compute capacity oversubscribed

There is not enough compute capacity remaining on the subnet to satisfy a compute allocation request.

**Example error:**
```
Canister requested a compute allocation of 20% which cannot be satisfied because the Subnet's remaining compute capacity is 10%.
```

Canisters can request a compute allocation to guarantee periodic execution. This error occurs when other canisters on the subnet have already consumed all available compute capacity.

To fix this error, move the canister to another subnet or decrease the compute allocation on other controlled canisters on the current subnet.

### Subnet memory capacity oversubscribed

There is not enough memory remaining on the subnet to satisfy a memory allocation request.

**Example error:**
```
Canister requested 4 GiB of memory but only 2 GiB are available in the subnet.
```

Canisters can reserve a fixed memory allocation. This error occurs when the subnet does not have enough free memory to satisfy the reservation.

To fix this error, move the canister to another subnet or reduce the memory usage of other controlled canisters on the current subnet.

### Subnet custom section memory capacity oversubscribed

There is not enough memory on the subnet for Wasm custom sections to allow a Wasm module to be installed.

**Example error:**
```
Canister requested 10 MiB of Wasm custom sections memory but only 1 MiB are available in the subnet.
```

Subnets separately track memory used to store the custom sections of canister Wasm modules.

To fix this error:
- If custom sections are not required, remove them using [`wasm-strip`](https://github.com/WebAssembly/wabt).
- Otherwise, move the canister to another subnet or uninstall other controlled canisters on the subnet that are consuming custom section space.

### Subnet out of canister IDs

There was an attempt to create a canister on a subnet that cannot hold any more canisters.

**Example error:**
```
Could not create canister. Subnet has surpassed its canister ID allocation.
```

To fix this error, create the canister on another subnet.

### Maximum number of canisters reached

There was an attempt to create a canister on a subnet that has reached the maximum number of allowed canisters.

**Example error:**
```
Subnet yyy-yyy has reached the allowed canister limit of 100000 canisters. Retry creating the canister.
```

To fix this error, create the canister on another subnet.

---

## Snapshot errors

### Canister snapshot not found

A canister snapshot operation was performed with a snapshot ID that does not exist.

**Example error:**
```
Could not find the snapshot ID 125-xxx-xxx for canister xxx-xxx.
```

To fix this error, use the `list_canister_snapshot` API to see which snapshots exist on the canister.

### Canister heap delta rate limited

The canister has been rate limited, preventing it from taking or loading a snapshot.

**Example error:**
```
Canister xxx-xxx is heap delta rate limited: current delta debit is 1000005000, but limit is 1000000000.
```

Canisters are limited by how much data they can write in a given time frame. This error means the canister has recently written a large amount of data and cannot currently take or load a snapshot because those operations also generate writes to blockchain state.

To fix this error, wait a few seconds and retry. If the error persists because the canister continually writes large amounts of data, consider stopping the canister before taking or loading a snapshot, or sharding data across multiple canisters.

### Canister snapshot invalid ownership

A canister snapshot operation was performed with a snapshot ID that does not belong to the target canister.

**Example error:**
```
The snapshot 125-xxx-xxx does not belong to canister yyy-yyy.
```

To fix this error, use the `list_canister_snapshot` API to confirm which snapshots belong to the canister.

### Long execution already in progress

There was an attempt to load a canister snapshot on a canister that is in the middle of a long-running execution.

**Example error:**
```
The canister xxx-xxx is currently executing a long-running message.
```

Snapshots cannot be loaded while a canister is executing a long message. Wait a few seconds for the message execution to complete and retry. If the problem persists, stop the canister before loading the snapshot.

### Canister snapshot not loadable

The snapshot cannot be loaded onto the target canister because the canister is not yet ready.

**Example error:**
```
Snapshot is not currently loadable on the specified canister. Try again later. The call should succeed if you wait sufficiently long (usually ten minutes).
```

To fix this error, wait at least 10 minutes and retry.

### Canister snapshot not controller

The caller is not a controller of the canister that owns the snapshot.

**Example error:**
```
Only a controller of the canister that the snapshot belongs to can load it.
```

To fix this error, ensure the caller is a controller of the canister that originally created the snapshot.

---

## Metadata errors

### Canister metadata no Wasm module

There was an attempt to fetch metadata from a canister that has no Wasm module installed.

**Example error:**
```
The canister xxx-xxx has no Wasm module and hence no metadata is available.
```

To fix this error, install a Wasm module with the given metadata section if you are a controller of the canister.

### Canister metadata section not found

There was an attempt to fetch a metadata section that does not exist or is private.

**Example error:**
```
The canister xxx-xxx has no metadata section with the name yyy-yyy.
```

To fix this error, confirm that the metadata section exists for the given canister and section name. For private metadata sections, the request must be signed by a principal that is a controller of the canister.

---

## Next steps

- Review [resource limits](./cycles-costs.md) for the full table of ICP constraints.
- Learn about [canister lifecycle](../guides/canister-management/lifecycle.md) including traps during upgrades.
- Optimize resource usage with the [canister optimization guide](../guides/canister-management/optimization.md).
- Understand the system APIs in the [IC interface specification](./ic-interface-spec/canister-interface.md).

<!-- Upstream: informed by dfinity/portal — docs/references/execution-errors.mdx; docs/building-apps/canister-management/trapping.mdx; docs/building-apps/canister-management/resource-limits.mdx -->
