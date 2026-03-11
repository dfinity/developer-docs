---
title: "Execution Errors"
description: "Reference for Wasm execution errors and canister reject codes on ICP"
sidebar:
  order: 5
doc_type: reference
level: intermediate
last_verified: 2026-03-10
---

This page lists common execution errors returned by the ICP runtime, along with their causes and resolution steps.

## Reject codes

When a canister call fails, the response includes a reject code:

| Code | Name | Meaning |
|------|------|---------|
| 1 | `SYS_FATAL` | Fatal system error. The subnet cannot process the request. |
| 2 | `SYS_TRANSIENT` | Transient system error. Retry may succeed. |
| 3 | `DESTINATION_INVALID` | Target canister does not exist or cannot be reached. |
| 4 | `CANISTER_REJECT` | The canister explicitly rejected the call. |
| 5 | `CANISTER_ERROR` | The canister trapped or encountered an execution error. |

## Common errors

### Method not found

```
Canister has no update method 'foobar'.
```

**Cause:** The called method name does not match any exported method on the canister.

**Fix:**
- Verify the method name matches exactly (case-sensitive).
- Confirm the method type (update, query, composite_query) matches.
- Check that the canister code has not been upgraded to a version that removed the method.

### Instruction limit exceeded

```
Canister exceeded the instruction limit for single message execution.
```

**Cause:** The canister used more instructions than allowed in a single message execution.

**Fix:**
- Use the [performance counter API](https://internetcomputer.org/docs/references/ic-interface-spec#system-api-performance-counter) to identify expensive code paths.
- Break large computations across multiple messages using self-calls or timers.
- Use [canbench](https://github.com/dfinity/canbench) to profile instruction usage.

### Trapped

```
Canister trapped: <WebAssembly error>
```

**Cause:** A WebAssembly trap occurred -- out-of-bounds memory access, integer division by zero, `unreachable` instruction, or similar.

**Fix:** Test the canister with various inputs to find unhandled edge cases. Enable debug logging to identify the failing operation.

### Trapped explicitly

```
Canister called `ic0.trap` with message: <error message>
```

**Cause:** The canister code called `ic0.trap` explicitly. In Rust this happens on `panic!`; in Motoko on failed assertions or traps.

**Fix:** Review the error message for context. Test with the inputs that triggered the trap.

### Out of memory

```
Canister cannot grow its memory usage.
```

**Cause:** The canister hit the system-wide memory limit (~4 GiB Wasm heap, ~400 GiB stable memory), or the subnet is full.

**Fix:**
- Check current memory usage with `icp canister status <CANISTER_ID>`.
- Move data from heap to stable memory, or shard across multiple canisters.
- If the subnet is full, move the canister to a different subnet.

### Wasm memory limit exceeded

```
Canister exceeded its current Wasm memory limit of <N> bytes.
```

**Cause:** The canister's Wasm heap usage exceeded the configured `wasm_memory_limit`.

**Fix:** Increase the limit in canister settings, move data to stable memory, or shard across canisters. Be cautious: a canister using close to 4 GiB of heap may fail to upgrade.

### Wasm module not found

```
Attempted to execute a message, but the canister contains no Wasm module.
```

**Cause:** The canister exists but has no code installed.

**Fix:** Deploy code with `icp deploy` or the `install_code` management canister API.

### Insufficient cycles in memory grow

```
Canister cannot grow memory by <N> bytes due to insufficient cycles.
```

**Cause:** The canister does not have enough cycles to pay for the additional memory.

**Fix:** Top up the canister with more cycles:
```bash
icp canister deposit-cycles <AMOUNT> <CANISTER_ID>
```

### Reserved cycles limit exceeded

```
Canister cannot grow memory by <N> bytes due to its reserved cycles limit.
```

**Cause:** Growing memory would require reserving more cycles than the canister's `reserved_cycles_limit` allows. This happens when the subnet is above 750 GiB usage.

**Fix:** Increase the canister's `reserved_cycles_limit` or move to a subnet with lower memory usage.

### Canister not found

```
Canister xxx-xxx not found.
```

**Cause:** The target canister ID does not exist.

**Fix:** Verify the canister ID. Search for it on the [ICP Dashboard](https://dashboard.internetcomputer.org). For local development, ensure the canister is in your project config and has been deployed.

### Invalid controller

```
Only the controllers of the canister xxx-xxx can control it.
```

**Cause:** The operation requires controller permissions, and the caller is not a controller.

**Fix:** Perform the action from a principal that is a controller, or have an existing controller add your principal.

### Install code not enough cycles

```
Canister installation failed with 'Canister xxx-xxx is out of cycles'.
```

**Cause:** The canister does not have enough cycles to execute the install message.

**Fix:** Top up the canister before installing code.

### Canister not stopped (delete)

```
Canister xxx-xxx must be stopped before it is deleted.
```

**Cause:** Attempted to delete a running canister.

**Fix:** Stop the canister first:
```bash
icp canister stop <CANISTER_ID>
icp canister delete <CANISTER_ID>
```

### Wasm module too large

```
Wasm module size of <N> exceeds the maximum allowed size of 104857600.
```

**Cause:** The canister's Wasm binary exceeds the 100 MiB limit.

**Fix:** Use [ic-wasm](https://github.com/dfinity/ic-wasm) to shrink the module. Remove unused dependencies. Consider splitting logic across multiple canisters.

### Slice overrun

```
Canister attempted to perform a large memory operation that used N instructions and exceeded the slice limit M.
```

**Cause:** A single memory copy operation (e.g., to/from stable memory) was too large for one execution round.

**Fix:** Split large memory operations into smaller chunks across multiple messages.

### System API from wrong mode

```
"ic0.call_new" cannot be executed in non-replicated query mode.
```

**Cause:** The canister tried to use a system API that is not available in the current execution context (e.g., making inter-canister calls from a query).

**Fix:** Use the correct call type. Inter-canister calls require update or composite_query context.

### Install code rate limited

```
Canister xxx-xxx is rate limited because it executed too many instructions in the previous install_code messages.
```

**Cause:** The canister has been rate-limited due to excessive install operations.

**Fix:** Wait several minutes and retry.

## Further reading

- [Cycles pricing](/reference/cycles-costs/) -- Cost reference for all operations.
- [IC interface specification](https://internetcomputer.org/docs/references/ic-interface-spec) -- Full system API documentation.
