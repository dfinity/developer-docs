---
title: "Canister Interface (System API)"
description: "WebAssembly module format and the System API available to canisters at runtime"
sidebar:
  label: "Canister Interface"
  order: 2
---

## Canister module format {#canister-module-format}

A canister module is a [WebAssembly module](https://webassembly.github.io/spec/core/index.html) that is either in binary format (typically `.wasm`) or gzip-compressed (typically `.wasm.gz`). If the module starts with byte sequence `[0x1f, 0x8b, 0x08]`, then the system decompresses the contents as a gzip stream according to [RFC-1952](https://datatracker.ietf.org/doc/html/rfc1952.html) and then parses the output as a WebAssembly binary.

## Canister interface (System API) {#system-api}

The System API is the interface between the running canister and the Internet Computer. It allows the WebAssembly module of a canister to expose functionality to the users (method entry points) and the IC (e.g. initialization), and exposes functionality of the IC to the canister (e.g. calling other canisters). Because WebAssembly is rather low-level, it also explains how to express higher level concepts (e.g. binary blobs).

We want to leverage advanced WebAssembly features, such as WebAssembly host references. But as they are not yet supported by all tools involved, this section describes an initial System API that does not rely on host references. In section [Outlook: Using Host References](#host-references), we outline some of the proposed uses of WebAssembly host references.

### WebAssembly module requirements {#system-api-module}

In order for a WebAssembly module to be usable as the code for the canister, it needs to conform to the following requirements:

-   It may declare (import or export) at most one memory.

-   It may only import a function if it is listed in [Overview of imports](#system-api-imports).
    In particular, all imported functions belong to the `ic0` module (denoted by the prefix `ic0.`).
    The value of `I ∈ {i32, i64}` specifying whether the imported functions have 32-bit or 64-bit pointers
    is derived from the bit-width of the declared memory defaulting to `I = i32` if the canister declares no memory.

-   It may have a `(start)` function.

-   If it exports a function called `canister_init`, the function must have type `() -> ()`.

-   If it exports a function called `canister_inspect_message`, the function must have type `() -> ()`.

-   If it exports a function called `canister_pre_upgrade`, the function must have type `() -> ()`.

-   If it exports a function called `canister_post_upgrade`, the function must have type `() -> ()`.

-   If it exports a function called `canister_heartbeat`, the function must have type `() -> ()`.

-   If it exports a function called `canister_on_low_wasm_memory`, the function must have type `() -> ()`.

-   If it exports a function called `canister_global_timer`, the function must have type `() -> ()`.

-   If it exports any functions called `canister_update <name>`, `canister_query <name>`, or `canister_composite_query <name>` for some `name`, the functions must have type `() -> ()`.

-   It may not export more than one function called `canister_update <name>`, `canister_query <name>`, or `canister_composite_query <name>` with the same `name`.

-   It may not export other methods the names of which start with the prefix `canister_` besides the methods allowed above.

-   It may not have both `icp:public <name>` and `icp:private <name>` with the same `name` as the custom section name.

-   It may not have other custom sections the names of which start with the prefix `icp:` besides the `icp:public ` and `icp:private `.

-   The IC may reject WebAssembly modules that

    -   declare more than 50,000 functions, or

    -   declare more than 1,000 globals, or

    -   declare more than 16 exported custom sections (the custom section names with prefix `icp:`), or

    -   the number of all exported functions called `canister_update <name>`, `canister_query <name>`, or `canister_composite_query <name>` exceeds 1,000, or

    -   the sum of `<name>` lengths in all exported functions called `canister_update <name>`, `canister_query <name>`, or `canister_composite_query <name>` exceeds 20,000, or

    -   the total size of the custom sections (the sum of `<name>` lengths in their names `icp:public <name>` and `icp:private <name>` plus the sum of their content lengths) exceeds 1MiB.

### Interpretation of numbers

WebAssembly number types (`i32`, `i64`) do not indicate if the numbers are to be interpreted as signed or unsigned. Unless noted otherwise, whenever the System API interprets them as numbers (e.g. memory pointers, buffer offsets, array sizes), they are to be interpreted as unsigned.

### Entry points {#entry-points}

The canister provides entry points which are invoked by the IC under various circumstances:

-   The canister may export a function with name `canister_init` and type `() -> ()`.

-   The canister may export a function with name `canister_pre_upgrade` and type `() -> ()`.

-   The canister may export a function with name `canister_post_upgrade` and type `() -> ()`.

-   The canister may export functions with name `canister_inspect_message` with type `() -> ()`.

-   The canister may export a function with name `canister_heartbeat` with type `() -> ()`.

-   The canister may export a function with name `canister_global_timer` with type `() -> ()`.

-   The canister may export functions with name `canister_update <name>` and type `() -> ()`.

-   The canister may export functions with name `canister_query <name>` and type `() -> ()`.

-   The canister may export functions with name `canister_composite_query <name>` and type `() -> ()`.

-   The canister may export a function with the name `canister_on_low_wasm_memory` and type `() -> ()`.

-   The canister table may contain functions of type `(env : I) -> ()` which may be used as callbacks for inter-canister calls and composite query methods.
    The value of `I ∈ {i32, i64}` specifying whether the imported functions have 32-bit or 64-bit pointers
    is derived from the bit-width of the declared memory defaulting to `I = i32` if the canister declares no memory.

If the execution of any of these entry points traps for any reason, then all changes to the WebAssembly state, as well as the effect of any externally visible system call (like `ic0.msg_reply`, `ic0.msg_reject`, `ic0.call_perform`), are discarded. For upgrades, this transactional behavior applies to the `canister_pre_upgrade`/`canister_post_upgrade` sequence as a whole.

#### Canister initialization {#system-api-init}

If `canister_init` is present, then this is the first exported WebAssembly function invoked by the IC. The argument that was passed along with the canister initialization call (see [IC method](./management-canister.md#ic-install_code)) is available to the canister via `ic0.msg_arg_data_size/copy`.

The IC assumes the canister to be fully instantiated if the `canister_init` method entry point returns. If the `canister_init` method entry point traps, then canister installation has failed, and the canister is reverted to its previous state (i.e. empty with `install`, or whatever it was for a `reinstall`).

#### Canister upgrades {#system-api-upgrades}

When a canister is upgraded to a new WebAssembly module, the IC:

1.  Invokes `canister_pre_upgrade` (if exported by the current canister code and `skip_pre_upgrade` is not `opt true`) on the old instance, to give the canister a chance to clean up (e.g. move data to [stable memory](#system-api-stable-memory)).

2.  Instantiates the new module, including the execution of `(start)`, with a fresh WebAssembly state.

3.  Invokes `canister_post_upgrade` (if present) on the new instance, passing the `arg` provided in the `install_code` call ([IC method](./management-canister.md#ic-install_code)).

The stable memory is preserved throughout the process; the WebAssembly memory is discarded unless `wasm_memory_persistence` is `opt keep`; any other WebAssembly state is discarded.

During these steps, no other entry point of the old or new canister is invoked. The `canister_init` function of the new canister is *not* invoked.

These steps are atomic: If `canister_pre_upgrade` or `canister_post_upgrade` trap, the upgrade has failed, and the canister is reverted to the previous state. Otherwise, the upgrade has succeeded, and the old instance is discarded.

:::note
The `skip_pre_upgrade` flag can be enabled to skip the execution of the `canister_pre_upgrade` method on the old canister instance.
The main purpose of this mode is recovery from cases when the `canister_pre_upgrade` hook traps unconditionally preventing the normal upgrade path.

Skipping the pre-upgrade can lead to data loss.
Use it only as the last resort and only if the stable memory already contains the entire canister state.
:::

#### Public methods {#system-api-requests}

To define a public method of name `name`, a WebAssembly module exports a function with name `canister_update <name>`, `canister_query <name>`, or `canister_composite_query <name>` and type `() -> ()`. We call this the *method entry point*. The name of the exported function distinguishes update, query, and composite query methods.

:::note

The space in `canister_update <name>`, `canister_query <name>`, and `canister_composite_query <name>`, resp., is intentional. There is exactly one space between `canister_update/canister_query/canister_composite_query` and the `<name>`.

:::

The argument of the call (e.g. the content of the `arg` field in the [API request to call a canister method](./https-interface.md#http-call)) is copied into the canister on demand using the System API functions shown below.

Eventually, a method will want to send a response, using `ic0.reply` or `ic0.reject`

#### Heartbeat

For periodic or time-based execution, the WebAssembly module can export a function with name `canister_heartbeat`. The heartbeats scheduling algorithm is implementation-defined.

`canister_heartbeat` is triggered by the IC, and therefore has no arguments and cannot reply or reject. Still, the function `canister_heartbeat` can initiate new calls.

:::note

While an implementation will likely try to keep the interval between `canister_heartbeat` invocations to within a few seconds, this is not formally part of this specification.

:::

#### Global timer {#global-timer}

For time-based execution, the WebAssembly module can export a function with name `canister_global_timer`. This function is called if the canister has set its global timer (using the System API function `ic0.global_timer_set`) and the current time (as returned by the System API function `ic0.time`) has passed the value of the global timer.

Once the function `canister_global_timer` is scheduled, the canister's global timer is deactivated. The global timer is also deactivated upon changes to the canister's Wasm module (calling `install_code`, `install_chunked_code`, `uninstall_code` methods of the management canister or if the canister runs out of cycles). In particular, the function `canister_global_timer` won't be scheduled again unless the canister sets the global timer again (using the System API function `ic0.global_timer_set`). The global timer scheduling algorithm is implementation-defined.

`canister_global_timer` is triggered by the IC, and therefore has no arguments and cannot reply or reject. Still, the function `canister_global_timer` can initiate new calls.

:::note

While an implementation will likely try to keep the interval between the value of the global timer and the time-stamp of the `canister_global_timer` invocation within a few seconds, this is not formally part of this specification.

:::

#### On Low Wasm Memory {#on-low-wasm-memory}

A canister can export a function with the name `canister_on_low_wasm_memory`, which is scheduled whenever the canister's remaining wasm memory size in bytes falls from at least a threshold `t` to strictly less than `t`.
The threshold `t` can be defined in the field `wasm_memory_threshold` in the [canister's settings](./management-canister.md#ic-update_settings) and by default it is set to 0.

:::note

While the above function is scheduled immediately once the condition above is triggered, it may not necessarily be executed immediately if the canister does not have enough cycles.
If the canister gets frozen immediately after the function is scheduled for execution, the function will run once the canister's unfrozen _if_ the canister's remaining wasm memory size in bytes remains strictly less than the threshold `t`.
:::

#### Callbacks

Callbacks are addressed by their table index (as a proxy for a Wasm `funcref`).

In the reply callback of a [inter-canister method call](#system-api-call), the argument refers to the response to that call. In reject callbacks, no argument is available.

### Replicated and Non-Replicated execution mode

Canister methods can be executed either in *replicated* mode where the method runs on all subnet nodes and the results go through consensus or in *non-replicated* mode where the method runs on a single node and the result does not go through consensus. The trade-off between replicated and non-replicated mode is therefore one between the result's latency and trustworthiness.

The following table captures the modes that different canister methods can be executed in.

| Canister method             | Replicated Mode | Non-Replicated Mode |
| --------------------------- | --------------- | ------------------- |
| canister_update             | Yes             | No                  |
| canister_query              | Yes             | Yes                 |
| canister_composite_query    | No              | Yes                 |
| canister_inspect_message    | No              | Yes                 |
| canister_init               | Yes             | No                  |
| canister_pre_upgrade        | Yes             | No                  |
| canister_post_upgrade       | Yes             | No                  |
| canister_heartbeat          | Yes             | No                  |
| canister_global_timer       | Yes             | No                  |
| canister_on_low_wasm_memory | Yes             | No                  |

### Overview of imports {#system-api-imports}

:::note

The 32-bit stable memory System API (`ic0.stable_size`, `ic0.stable_grow`, `ic0.stable_write`, and `ic0.stable_read`) is DEPRECATED. Canister developers are advised to use the 64-bit stable memory System API instead.

:::

The following sections describe various System API functions, also referred to as system calls, which we summarize here.

All the following functions belong to the `ic0` module (denoted by the prefix `ic0.`).

In the following, the value of `I ∈ {i32, i64}` specifies whether the imported functions have 32-bit or 64-bit pointers.
Given a canister module, the value of `I ∈ {i32, i64}` is derived from the bit-width of the declared memory
defaulting to `I = i32` if the canister declares no memory.

```
    ic0.msg_arg_data_size : () -> I;                                                      // I U RQ NRQ TQ CQ Ry CRy F
    ic0.msg_arg_data_copy : (dst : I, offset : I, size : I) -> ();                        // I U RQ NRQ TQ CQ Ry CRy F
    ic0.msg_caller_size : () -> I;                                                        // *
    ic0.msg_caller_copy : (dst : I, offset : I, size : I) -> ();                          // *
    ic0.msg_caller_info_data_size : () -> I;                                              // U RQ NRQ CQ Ry Rt CRy CRt C CC F
    ic0.msg_caller_info_data_copy : (dst : I, offset : I, size : I) -> ();                // U RQ NRQ CQ Ry Rt CRy CRt C CC F
    ic0.msg_caller_info_signer_size : () -> I;                                            // U RQ NRQ CQ Ry Rt CRy CRt C CC F
    ic0.msg_caller_info_signer_copy : (dst : I, offset : I, size : I) -> ();              // U RQ NRQ CQ Ry Rt CRy CRt C CC F
    ic0.msg_reject_code : () -> i32;                                                      // Ry Rt CRy CRt C
    ic0.msg_reject_msg_size : () -> I  ;                                                  // Rt CRt
    ic0.msg_reject_msg_copy : (dst : I, offset : I, size : I) -> ();                      // Rt CRt

    ic0.msg_deadline : () -> i64;                                                         // U Q CQ Ry Rt CRy CRt

    ic0.msg_reply_data_append : (src : I, size : I) -> ();                                // U RQ NRQ TQ CQ Ry Rt CRy CRt
    ic0.msg_reply : () -> ();                                                             // U RQ NRQ TQ CQ Ry Rt CRy CRt
    ic0.msg_reject : (src : I, size : I) -> ();                                           // U RQ NRQ TQ CQ Ry Rt CRy CRt

    ic0.msg_cycles_available128 : (dst : I) -> ();                                        // U RQ Rt Ry
    ic0.msg_cycles_refunded128 : (dst : I) -> ();                                         // Rt Ry
    ic0.msg_cycles_accept128 : (max_amount_high : i64, max_amount_low: i64, dst : I)
                           -> ();                                                         // U RQ Rt Ry

    ic0.cycles_burn128 : (amount_high : i64, amount_low : i64, dst : I)
                           -> ();                                                         // I G U RQ Ry Rt C T

    ic0.canister_self_size : () -> I;                                                     // *
    ic0.canister_self_copy : (dst : I, offset : I, size : I) -> ();                       // *
    ic0.canister_cycle_balance128 : (dst : I) -> ();                                      // *
    ic0.canister_liquid_cycle_balance128 : (dst : I) -> ();                               // *
    ic0.canister_status : () -> i32;                                                      // *
    ic0.canister_version : () -> i64;                                                     // *

    ic0.subnet_self_size : () -> I;                                                       // *
    ic0.subnet_self_copy : (dst : I, offset : I, size : I) -> ();                         // *

    ic0.msg_method_name_size : () -> I;                                                   // F
    ic0.msg_method_name_copy : (dst : I, offset : I, size : I) -> ();                     // F
    ic0.accept_message : () -> ();                                                        // F

    ic0.call_new :
      ( callee_src  : I,
        callee_size : I,
        name_src    : I,
        name_size   : I,
        reply_fun   : I,
        reply_env   : I,
        reject_fun  : I,
        reject_env  : I
      ) -> ();                                                                            // U CQ Ry Rt CRy CRt T
    ic0.call_on_cleanup : (fun : I, env : I) -> ();                                       // U CQ Ry Rt CRy CRt T
    ic0.call_data_append : (src : I, size : I) -> ();                                     // U CQ Ry Rt CRy CRt T
    ic0.call_with_best_effort_response : (timeout_seconds : i32) -> ();                   // U CQ Ry Rt CRy CRt T
    ic0.call_cycles_add128 : (amount_high : i64, amount_low: i64) -> ();                  // U Ry Rt T
    ic0.call_perform : () -> ( err_code : i32 );                                          // U CQ Ry Rt CRy CRt T

    ic0.stable64_size : () -> (page_count : i64);                                         // * s
    ic0.stable64_grow : (new_pages : i64) -> (old_page_count : i64);                      // * s
    ic0.stable64_write : (offset : i64, src : i64, size : i64) -> ();                     // * s
    ic0.stable64_read : (dst : i64, offset : i64, size : i64) -> ();                      // * s

    ic0.root_key_size : () -> I;                                                          // I G U RQ Ry Rt C T
    ic0.root_key_copy : (dst : I, offset : I, size : I) -> ();                            // I G U RQ Ry Rt C T
    ic0.certified_data_set : (src : I, size : I) -> ();                                   // I G U Ry Rt T
    ic0.data_certificate_present : () -> i32;                                             // *
    ic0.data_certificate_size : () -> I;                                                  // NRQ CQ
    ic0.data_certificate_copy : (dst : I, offset : I, size : I) -> ();                    // NRQ CQ

    ic0.time : () -> (timestamp : i64);                                                   // *
    ic0.global_timer_set : (timestamp : i64) -> i64;                                      // I G U Ry Rt C T
    ic0.performance_counter : (counter_type : i32) -> (counter : i64);                    // * s
    ic0.is_controller : (src : I, size : I) -> ( result : i32);                           // * s
    ic0.in_replicated_execution : () -> (result : i32);                                   // * s
    
    ic0.cost_call : (method_name_size: i64, payload_size : i64, dst : I) -> ();           // * s
    ic0.cost_create_canister : (dst : I) -> ();                                           // * s
    ic0.cost_http_request : (request_size : i64, max_res_bytes : i64, dst : I) -> ();     // * s
    ic0.cost_sign_with_ecdsa : (src : I, size : I, ecdsa_curve: i32, dst : I) -> i32;     // * s
    ic0.cost_sign_with_schnorr : (src : I, size : I, algorithm: i32, dst : I) -> i32;     // * s
    ic0.cost_vetkd_derive_key : (src : I, size : I, vetkd_curve: i32, dst : I) -> i32;  // * s

    ic0.env_var_count : () -> I;                                                                      // *

    ic0.env_var_name_size : (index: I) -> I;                                                          // *
    ic0.env_var_name_copy : (index: I, dst: I, offset: I, size: I) -> ();                             // *
    ic0.env_var_name_exists : (name_src: I, name_size: I) -> i32;                                       // *
    
    ic0.env_var_value_size : (name_src: I, name_size: I) -> I;                                        // *
    ic0.env_var_value_copy : (name_src: I, name_size: I, dst: I, offset: I, size: I) -> ();           // *

    ic0.debug_print : (src : I, size : I) -> ();                                                      // * s
    ic0.trap : (src : I, size : I) -> ();                                                             // * s
```

The following System API functions are only available if `I = i32`, i.e., if the bit-width of the declared memory is 32
or if the canister declares no memory.

```
    ic0.msg_cycles_available : () -> i64;                                                 // U RQ Rt Ry
    ic0.msg_cycles_refunded : () -> i64;                                                  // Rt Ry
    ic0.msg_cycles_accept : (max_amount : i64) -> (amount : i64);                         // U RQ Rt Ry
    ic0.canister_cycle_balance : () -> i64;                                               // *
    ic0.call_cycles_add : (amount : i64) -> ();                                           // U Ry Rt T
    ic0.stable_size : () -> (page_count : i32);                                           // * s
    ic0.stable_grow : (new_pages : i32) -> (old_page_count : i32);                        // * s
    ic0.stable_write : (offset : i32, src : i32, size : i32) -> ();                       // * s
    ic0.stable_read : (dst : i32, offset : i32, size : i32) -> ();                        // * s
```

The comment after each function lists from where these functions may be invoked:

-   `I`: from `canister_init` or `canister_post_upgrade`

-   `G`: from `canister_pre_upgrade`

-   `U`: from `canister_update …`

-   `RQ`: from `canister_query …` in replicated mode

-   `NRQ`: from `canister_query …` in non-replicated mode

-   `TQ`: from `canister_query …` in canister http outcall transform

-   `CQ`: from `canister_composite_query …`

-   `Ry`: from a reply callback

-   `Rt`: from a reject callback

-   `CRy`: from a reply callback in composite query

-   `CRt`: from a reject callback in composite query

-   `C`: from a cleanup callback

-   `CC`: from a cleanup callback in composite query

-   `s`: the `(start)` module initialization function

-   `F`: from `canister_inspect_message`

-   `T`: from *system task* (`canister_heartbeat` or `canister_global_timer` or `canister_on_low_wasm_memory`)

-   `*` = `I G U RQ NRQ TQ CQ Ry Rt CRy CRt C CC F T` (NB: Not `(start)`)

If the canister invokes a system call from somewhere else, it will trap.

Since Wasm doesn't have a 128-bit number type, calls requiring 128-bit arguments (e.g., the 128-bit versions of cycle operations) encode such arguments as a pair of 64-bit numbers containing the high and low bits.

### Blob-typed arguments and results

WebAssembly functions parameter and result types can only be primitive number types. To model functions that accept or return blobs or text values, the following idiom is used:

To provide access to a string or blob `foo`, the System API provides two functions:
```
ic0.foo_size : () -> I; I ∈ {i32, i64}
ic0.foo_copy : (dst : I, offset : I, size : I) -> (); I ∈ {i32, i64}
```

The `*_size` function indicates the size, in bytes, of `foo`. The `*_copy` function copies `size` bytes from `foo[offset..offset+size]` to `memory[dst..dst+size]`. This traps if `offset+size` is greater than the size of `foo`, or if `dst+size` exceeds the size of the Wasm memory.

Dually, a System API function that conceptually takes a blob or string as a parameter `foo` has two parameters:

```
ic0.set_foo : (src : I, size : I) -> …; I ∈ {i32, i64}
```

which copies, at the time of function invocation, the data referred to by `src`/`size` out of the canister. Unless otherwise noted, this traps if `src+size` exceeds the size of the WebAssembly memory.

### Method arguments

The canister can access an argument. For `canister_init`, `canister_post_upgrade` and method entry points, the argument is the argument of the call; in a reply callback, it refers to the received reply. So the lifetime of the argument data is a single WebAssembly function execution, not the whole method call tree.

-   `ic0.msg_arg_data_size : () → I` and `ic0.msg_arg_data_copy : (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`

    The message argument data.

-   `ic0.msg_caller_size : () → I` and `ic0.msg_caller_copy : (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`

    The identity of the caller, which may be a canister id or a user id. During canister installation or upgrade, this is the id of the user or canister requesting the installation or upgrade. During a system task (heartbeat or global timer), this is the id of the management canister.

-   `ic0.msg_caller_info_data_size : () → I`, `ic0.msg_caller_info_signer_size : () → I` and `ic0.msg_caller_info_data_copy : (dst : I, offset : I, size : I) → ()`; and `ic0.msg_caller_info_signer_copy : (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`

    Auxiliary information about the caller as provided by the canister with which the caller's identity is associated (i.e., the public key of the canister signature is equal to the public key of the caller's identity).
    These functions can only return non-empty values if the caller is a self-authenticating principal authenticated by canister signatures. In particular, they always return empty values when the caller is another canister.

    The `caller_info_data` may include information such as identity attributes of the caller.
    The `_signer_` functions return the canister ID of the canister providing the signature, and the `_data_` functions return the data provided by the canister.
    This auxiliary information can only be set if the caller principal is derived from the public key corresponding to a canister signature, and it is guaranteed to be properly signed by the issuing canister.

    These functions trap in `canister_init`, `canister_post_upgrade`, `canister_pre_upgrade`, canister http outcall transform, the `(start)` module initialization function, and system tasks (`canister_heartbeat` or `canister_global_timer` or `canister_on_low_wasm_memory`).

-   `ic0.msg_reject_code : () → i32`

    Returns the reject code, if the current function is invoked as a reject callback or as a cleanup callback of a reject callback.

    It returns the special "no error" code `0` if the callback is a reply callback or a cleanup callback of a reply callback; this allows canisters to use a single entry point for both the reply and reject callback, if they choose to do so.

-   `ic0.msg_reject_msg_size : () → I` and `ic0.msg_reject_msg_copy : (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`

    The reject message. Traps if there is no reject message (i.e. if `reject_code` is `0`).

-   `ic0.msg_deadline : () -> i64`

    The deadline, in nanoseconds since 1970-01-01, after which the caller might stop waiting for a response.

    For update methods and their callbacks, if the method was called via a bounded-wait inter-canister call the deadline is computed based on the time the call was made, and the `timeout_seconds` parameter provided by the caller. For other calls (including ingress messages and all calls to query and composite query methods, including calls in replicated mode) a deadline of 0 is returned.

### Responding {#responding}

Eventually, the canister will want to respond to the original call, either by replying (indicating success) or rejecting (signalling an error):

-   `ic0.msg_reply_data_append : (src : I, size : I) → ()`; `I ∈ {i32, i64}`

    Appends data it to the (initially empty) data reply. Traps if the total appended data exceeds the [maximum response size](../cycles-costs.md).

    This traps if the current call already has been or does not need to be responded to.

    Any data assembled, but not replied using `ic0.msg_reply`, gets discarded at the end of the current message execution. In particular, the reply buffer gets reset when the canister yields control without calling `ic0.msg_reply`.

:::note

This can be invoked multiple times within the same message execution to build up the argument with data from various places on the Wasm heap. This way, the canister does not have to first copy all the pieces from various places into one location.

:::

-   `ic0.msg_reply : () → ()`

    Replies to the sender with the data assembled using `ic0.msg_reply_data_append`.

    This function can be called at most once (a second call will trap), and must be called exactly once to indicate success.

    See [Cycles](#system-api-cycles) for how this interacts with cycles available on this call.

-   `ic0.msg_reject : (src : I, size : I) → ()`; `I ∈ {i32, i64}`

    Rejects the call. The data referred to by `src`/`size` is used for the diagnostic message.

    This system call traps if `src+size` exceeds the size of the WebAssembly memory, or if the current call already has been or does not need to be responded to, or if the data referred to by `src`/`size` is not valid UTF8.

    The other end will receive this reject with reject code `CANISTER_REJECT`, see [Reject codes](./https-interface.md#reject-codes).

    Possible reply data assembled using `ic0.msg_reply_data_append` is discarded.

    See [Cycles](#system-api-cycles) for how this interacts with cycles available on this call.

### Ingress message inspection {#system-api-inspect-message}

A canister can inspect ingress messages before executing them. When the IC receives an update call from a user, the IC will use the canister method `canister_inspect_message` to determine whether the message shall be accepted. If the canister is empty (i.e. does not have a Wasm module), then the ingress message will be rejected. If the canister is not empty and does not implement `canister_inspect_message`, then the ingress message will be accepted.

In `canister_inspect_message`, the canister can determine the name of the method called by the message using `ic0.msg_method_name_size : () → I` and `ic0.msg_method_name_copy : (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`.

In `canister_inspect_message`, the canister can accept the message by invoking `ic0.accept_message : () → ()`. This function traps if invoked twice. If the canister traps in `canister_inspect_message` or does not call `ic0.accept_message`, then the access is denied.

:::note

The `canister_inspect_message` is executed by a single node and thus its outcome depends on the state of this node.
In particular, the `canister_inspect_message` might be executed on a state that does not reflect the changes
made by a previously successfully completed update call if the `canister_inspect_message` is executed by a node
that is not up-to-date in terms of its state.

:::

:::note

The `canister_inspect_message` is *not* invoked for query calls, inter-canister calls or calls to the management canister.

:::

### Self-identification {#system-api-canister-self}

A canister can learn about its own identity:

-   `ic0.canister_self_size : () → I` and `ic0.canister_self_copy: (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`

    These functions allow the canister to query its own canister id (as a blob).

A canister can learn about the subnet it is running on:

-   `ic0.subnet_self_size : () → I` and `ic0.subnet_self_copy: (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`

    These functions allow the canister to query the subnet id (as a blob) of the subnet on which the canister is running.

### Canister status {#system-api-canister-status}

This function allows a canister to find out if it is running, stopping or stopped (see [IC method](./management-canister.md#ic-canister_status) and [IC method](./management-canister.md#ic-stop_canister) for context).

-   `ic0.canister_status : () → i32`

    returns the current status of the canister:

    Status `1` indicates running, `2` indicates stopping, and `3` indicates stopped.

    Observing the canister status is particularly useful during `canister_post_upgrade`. Confirming that the status is 3 (stopped) helps prevent accidentally upgrading a canister that has not fully stopped.

### Canister version {#system-api-canister-version}

For each canister, the system maintains a *canister version*. Upon canister creation, it is set to 0, and it is **guaranteed** to be incremented upon every change of the canister ID, canister's code, settings, running status (Running, Stopping, Stopped), cycles balance, and memory (WASM and stable memory), i.e., upon every successful canister renaming, management canister call of methods `update_settings`, `load_canister_snapshot`, `install_code`, `install_chunked_code`, `uninstall_code`, `start_canister`, and `stop_canister` on that canister, code uninstallation due to that canister running out of cycles, canister's running status transitioning from Stopping to Stopped, and successful execution of update methods, replicated query methods, response callbacks, heartbeats, and global timers. The system can also arbitrarily increment the canister version at any time.

-   `ic0.canister_version : () → i64`

    returns the current canister version.

During the canister upgrade process, `canister_pre_upgrade` sees the old counter value, and `canister_post_upgrade` sees the new counter value.

### Inter-canister method calls {#system-api-call}

When handling an update call (or a callback), a canister can do further calls to another canister. Calls are assembled in a builder-like fashion, starting with `ic0.call_new`, adding more attributes using the `ic0.call_*` functions, and eventually performing the call with `ic0.call_perform`.

-   `ic0.call_new :
    ( callee_src  : I,
      callee_size : I,
      name_src    : I,
      name_size   : I,
      reply_fun   : I,
      reply_env   : I,
      reject_fun  : I,
      reject_env  : I,
    ) → ()`; `I ∈ {i32, i64}`

Begins assembling a call to the canister specified by `callee_src/_size` at method `name_src/_size`.

The IC records two mandatory callback functions, represented by a table entry index `*_fun` and some additional value `*_env`. When the response comes back, the table is read at the corresponding index, expected to be a function of type `(env : I) -> ()`, and passed the corresponding `*_env` value.

The reply callback is executed upon successful completion of the method call, which can query the reply using `ic0.msg_arg_data_*`.

The reject callback is executed if the method call fails asynchronously or the other canister explicitly rejects the call. The reject code and message can be queried using `ic0.msg_reject_code` and `ic0.msg_reject_msg_*`.

Subsequent calls to the following functions set further attributes of that call, until the call is concluded (with `ic0.call_perform`) or discarded (by returning without calling `ic0.call_perform` or by starting a new call with `ic0.call_new`.)

-   `ic0.call_on_cleanup : (fun : I, env : I) → ()`; `I ∈ {i32, i64}`

If a cleanup callback (of type `(env : I) -> ()`) is specified for this call, it is executed if and only if the `reply` or the `reject` callback was executed and trapped (for any reason).

During the execution of the `cleanup` function, only a subset of the System API is available. The cleanup function is expected to run swiftly (within a fixed, yet to be specified cycle limit) and serves to free resources associated with the callback.

If this traps (e.g. runs out of cycles), the state changes from the `cleanup` function are discarded, as usual, and no further actions are taken related to that call. Canisters likely want to avoid this from happening.

There must be at most one call to `ic0.call_on_cleanup` between `ic0.call_new` and `ic0.call_perform`.

-   `ic0.call_with_best_effort_response : (timeout_seconds : i32) -> ()`

    Turns the call into a *bounded-wait call*, by relaxing the response delivery guarantee to be best effort, and asking the system to respond at the latest after `timeout_seconds` have elapsed. Best effort means the system may also respond with a `SYS_UNKNOWN` reject code, signifying that the call **may or may not** have been processed by the callee. Then, even if the callee produces a response, it will not be delivered to the caller.

    Any value for `timeout_seconds` is permitted, but is silently bounded from above by the `MAX_CALL_TIMEOUT` system constant; i.e., larger timeouts are treated as equivalent to `MAX_CALL_TIMEOUT` and do not cause an error. The implementation may add a specific [error code](./https-interface.md#error-codes) to a reject message to indicate the cause, in particular whether the timeout expired. Note that the reject callback may be executed (possibly significantly) later than the specified time (e.g., if the caller is under high load), or before timeout expiration (e.g., if the system is under load).

    A caller that receives a `SYS_UNKNOWN` reject code, yet needs to learn the call outcome, must find an out-of-band way of doing so. For example, if the callee provides idempotent function calls, the caller can simply retry the call. Sample causes of `SYS_UNKNOWN` include the call not being delivered in time, call processing not completing in time, reply delivery taking too long, and the system shedding load.

    This method can be called only in between `ic0.call_new` and `ic0.call_perform`, and at most once at that. Otherwise, it traps. A different timeout can be specified for each call.

-   `ic0.call_data_append : (src : I, size : I) -> ()`; `I ∈ {i32, i64}`

    Appends the specified bytes to the argument of the call. Initially, the argument is empty. Traps if the total appended data exceeds the [maximum inter-canister call payload](../cycles-costs.md).

    This may be called multiple times between `ic0.call_new` and `ic0.call_perform`.

-   `ic0.call_cycles_add : (amount : i64) -> ()`

    This system call moves cycles from the canister balance onto the call under construction, to be transferred with that call.

    The cycles are deducted from the balance as shown by `ic0.canister_cycle_balance128` immediately, and moved back if the call cannot be performed (e.g. if `ic0.call_perform` signals an error, if the canister invokes `ic0.call_new`, or returns without calling `ic0.call_perform`).

    This system call may be called multiple times between `ic0.call_new` and `ic0.call_perform`.

    This system call traps if there is no call under construction, i.e., if not called between `ic0.call_new` and `ic0.call_perform`.

    This system call traps if trying to transfer more cycles than returned by `ic0.canister_liquid_cycle_balance128`.

-   `ic0.call_cycles_add128 : (amount_high : i64, amount_low : i64) -> ()`

    This system call moves cycles from the canister balance onto the call under construction, to be transferred with that call.

    The amount of cycles it moves is represented by a 128-bit value which can be obtained by combining the `amount_high` and `amount_low` parameters.

    The cycles are deducted from the balance as shown by `ic0.canister_cycle_balance128` immediately, and moved back if the call cannot be performed (e.g. if `ic0.call_perform` signals an error, if the canister invokes `ic0.call_new`, or returns without calling `ic0.call_perform`).

    This system call may be called multiple times between `ic0.call_new` and `ic0.call_perform`.

    This system call traps if there is no call under construction, i.e., if not called between `ic0.call_new` and `ic0.call_perform`.

    This system call traps if trying to transfer more cycles than returned by `ic0.canister_liquid_cycle_balance128`.

-   `ic0.call_perform  : () -> ( err_code : i32 )`

    This concludes assembling the call. It queues the call message to the given destination, but does not actually act on it until the current WebAssembly function returns without trapping.

    This deducts `MAX_CYCLES_PER_RESPONSE` cycles from the canister balance and sets them aside for response processing.

    The returned `err_code` is always one of `0` and `2`. An `err_code` of `0` means that no error occurred and that the IC could enqueue the call. In this case, the call will either be delivered, returned because the destination canister does not exist, returned due to a lack of resources within the IC, or returned because of an out of cycles condition. This also means that exactly one of the reply or reject callbacks will be executed.

    A non-zero value of `err_code` (`2`) indicates that the call could not be performed and the semantics of that value are the same as for the corresponding `SYS_FATAL` [reject code](./https-interface.md#reject-codes). The non-zero value of `err_code` (`2`) could arise due to a lack of resources within the IC, but also if the call would reduce the current cycle balance to a level below where the canister would be frozen. No callbacks are executed in this case.

    After `ic0.call_perform` and before the next call to `ic0.call_new`, all other `ic0.call_*` function calls trap.

### Cycles {#system-api-cycles}

Each canister maintains a balance of *cycles*, which are used to pay for platform usage. Cycles are represented by 128-bit values.

:::note

This specification currently does not go into details about which actions cost how many cycles and/or when. In general, you must assume that the canister's cycle balance can change arbitrarily between method executions, and during each System API function call, unless explicitly mentioned otherwise.

:::

-   `ic0.canister_cycle_balance : () → i64`

    Indicates the current cycle balance of the canister. It is the canister balance before the execution of the current message, minus a reserve to pay for the execution of the current message and calls finalized via `ic0.call_perform`, minus any cycles queued up to be sent via `ic0.call_cycles_add` and `ic0.call_cycles_add128`. After execution of the message, the IC may add unused cycles from the reserve back to the balance.

:::note

This call traps if the current balance does not fit into a 64-bit value. Canisters that need to deal with larger cycles balances should use `ic0.canister_cycle_balance128` instead.

:::

-   `ic0.canister_cycle_balance128 : (dst : I) → ()`; `I ∈ {i32, i64}`

    Indicates the current cycle balance of the canister by copying the value at the location `dst` in the canister memory. It is the canister balance before the execution of the current message, minus a reserve to pay for the execution of the current message and calls finalized via `ic0.call_perform`, minus any cycles queued up to be sent via `ic0.call_cycles_add` and `ic0.call_cycles_add128`. After execution of the message, the IC may add unused cycles from the reserve back to the balance.

-   `ic0.canister_liquid_cycle_balance128 : (dst : I) → ()`; `I ∈ {i32, i64}`

    Indicates the current amount of cycles that is available for spending in calls and execution by copying the value at the location `dst` in the canister memory. This amount of cycles can be safely attached to a call via `ic0.call_cycles_add128` as long as the memory usage of the canister does not increase for the rest of the current message execution. Hence, it is recommended to never attach the entire `ic0.canister_liquid_cycle_balance128` to a call, but leave some slack based on the expected canister memory usage and freezing threshold.

-   `ic0.msg_cycles_available : () → i64`

    Returns the amount of cycles that were transferred by the caller of the current call, and is still available in this message.

    Initially, in the update method entry point, this is the amount that the caller passed to the canister. When cycles are accepted (`ic0.msg_cycles_accept`), this reports fewer cycles accordingly. When the call is responded to (reply or reject), all available cycles are refunded to the caller, and this will return 0.

:::note

This call traps if the amount of cycles available does not fit into a 64-bit value. Please use `ic0.msg_cycles_available128` instead.

:::

-   `ic0.msg_cycles_available128 : (dst : I) → ()`; `I ∈ {i32, i64}`

    Indicates the number of cycles transferred by the caller of the current call, still available in this message. The amount of cycles is represented by a 128-bit value. This call copies this value starting at the location `dst` in the canister memory.

    Initially, in the update method entry point, this is the amount that the caller passed to the canister. When cycles are accepted (`ic0.msg_cycles_accept128`), this reports fewer cycles accordingly. When the call is responded to (reply or reject), all available cycles are refunded to the caller, and this will report 0 cycles.

-   `ic0.msg_cycles_accept : (max_amount : i64) → (amount : i64)`

    This moves cycles from the call to the canister balance. It moves as many cycles as possible, up to these constraints:

    It moves no more cycles than `max_amount`.

    It moves no more cycles than available according to `ic0.msg_cycles_available`, and

    It can be called multiple times, each time possibly adding more cycles to the balance.

    The return value indicates how many cycles were actually moved.

    This system call does not trap.

:::tip

Example: To accept all cycles provided in a call, invoke `ic0.msg_cycles_accept(ic0.msg_cycles_available())` in the method handler or a callback handler, *before* calling reply or reject.

:::

-   `ic0.msg_cycles_accept128 : (max_amount_high : i64, max_amount_low : i64, dst : I) → ()`; `I ∈ {i32, i64}`

    This moves cycles from the call to the canister balance. It moves as many cycles as possible, up to these constraints:

    It moves no more cycles than the amount obtained by combining `max_amount_high` and `max_amount_low`. Cycles are represented by 128-bit values.

    It moves no more cycles than available according to `ic0.msg_cycles_available128`, and

    It can be called multiple times, each time possibly adding more cycles to the balance.

    This call also copies the amount of cycles that were actually moved starting at the location `dst` in the canister memory.

    This does not trap.

-   `ic0.cycles_burn128 : (amount_high : i64, amount_low : i64, dst : I) -> ()`; `I ∈ {i32, i64}`

    This burns cycles from the canister. It burns as many cycles as possible, up to these constraints:

    It burns no more cycles than the amount obtained by combining `amount_high` and `amount_low`. Cycles are represented by 128-bit values.

    It burns no more cycles than the amount of cycles available for spending `liquid_balance(balance, reserved_balance, freezing_limit)`, where `reserved_balance` are cycles reserved for resource payments and `freezing_limit` is the amount of idle cycles burned by the canister during its `freezing_threshold`.

    It can be called multiple times, each time possibly burning more cycles from the balance.

    This call also copies the amount of cycles that were actually burned starting at the location `dst` in the canister memory.

    This system call does not trap.

-   `ic0.msg_cycles_refunded : () → i64`

    This function can only be used in a callback handler (reply or reject), and indicates the amount of cycles that came back with the response as a refund. The refund has already been added to the canister balance automatically.

:::note

This call traps if the amount of cycles refunded does not fit into a 64-bit value. In general, it is recommended to use `ic0.msg_cycles_refunded128` instead.

:::

-   `ic0.msg_cycles_refunded128 : (dst : I) → ()`; `I ∈ {i32, i64}`

    This function can only be used in a callback handler (reply or reject), and indicates the amount of cycles that came back with the response as a refund. The refund has already been added to the canister balance automatically.

### Stable memory {#system-api-stable-memory}

:::note

The 32-bit stable memory System API (`ic0.stable_size`, `ic0.stable_grow`, `ic0.stable_write`, and `ic0.stable_read`) is DEPRECATED. Canister developers are advised to use the 64-bit stable memory System API instead.

:::

Canisters have the ability to store and retrieve data from a secondary memory. The purpose of this *stable memory* is to provide space to store data beyond upgrades. The interface mirrors roughly the memory-related instructions of WebAssembly, and tries to be forward compatible with exposing this feature as an additional memory.

The stable memory is initially empty and can be grown up to the [Wasm stable memory limit](../cycles-costs.md) (provided the subnet has capacity).

-   `ic0.stable_size : () → (page_count : i32)`

    returns the current size of the stable memory in WebAssembly pages. (One WebAssembly page is 64KiB)

    This system call traps if the size of the stable memory exceeds 2<sup>32</sup> bytes.

-   `ic0.stable_grow : (new_pages : i32) → (old_page_count : i32)`

    tries to grow the memory by `new_pages` many pages containing zeroes.

    This system call traps if the *previous* size of the memory exceeds 2<sup>32</sup> bytes.

    If the *new* size of the memory exceeds 2<sup>32</sup> bytes or growing is unsuccessful, then it returns `-1`.

    Otherwise, it grows the memory and returns the *previous* size of the memory in pages.

-   `ic0.stable_write : (offset : i32, src : i32, size : i32) → ()`

    copies the data referred to by `src`/`size` out of the canister and replaces the corresponding segment starting at `offset` in the stable memory.

    This system call traps if the size of the stable memory exceeds 2<sup>32</sup> bytes.

    It also traps if `src+size` exceeds the size of the WebAssembly memory or `offset+size` exceeds the size of the stable memory.

-   `ic0.stable_read : (dst : i32, offset : i32, size : i32) → ()`

    copies the data referred to by `offset`/`size` out of the stable memory and replaces the corresponding bytes starting at `dest` in the canister memory.

    This system call traps if the size of the stable memory exceeds 2<sup>32</sup> bytes.

    It also traps if `dst+size` exceeds the size of the WebAssembly memory or `offset+size` exceeds the size of the stable memory

-   `ic0.stable64_size : () → (page_count : i64)`

    returns the current size of the stable memory in WebAssembly pages. (One WebAssembly page is 64KiB)

-   `ic0.stable64_grow : (new_pages : i64) → (old_page_count : i64)`

    tries to grow the memory by `new_pages` many pages containing zeroes.

    If successful, returns the *previous* size of the memory (in pages). Otherwise, returns `-1`.

-   `ic0.stable64_write : (offset : i64, src : i64, size : i64) → ()`

    Copies the data from location \[src, src+size) of the canister memory to location \[offset, offset+size) in the stable memory.

    This system call traps if `src+size` exceeds the size of the WebAssembly memory or `offset+size` exceeds the size of the stable memory.

-   `ic0.stable64_read : (dst : i64, offset : i64, size : i64) → ()`

    Copies the data from location \[offset, offset+size) of the stable memory to the location \[dst, dst+size) in the canister memory.

    This system call traps if `dst+size` exceeds the size of the WebAssembly memory or `offset+size` exceeds the size of the stable memory.

### System time {#system-api-time}

The canister can query the IC for the current time.

`ic0.time : () -> i64`

The time is given as nanoseconds since 1970-01-01. The IC guarantees that

-   the time, as observed by the canister, is monotonically increasing, even across canister upgrades.

-   within an invocation of one entry point, the time is constant.

The times observed by different canisters are unrelated, and calls from one canister to another may appear to travel "backwards in time".

:::note

While an implementation will likely try to keep the time returned by `ic0.time` close to the real time, this is not formally part of this specification.

:::

### Global timer

The canister can set a global timer to make the system schedule a call to the exported `canister_global_timer` Wasm method after the specified time. The time must be provided as nanoseconds since 1970-01-01.

`ic0.global_timer_set : (timestamp : i64) -> i64`

The function returns the previous value of the timer. If no timer is set before invoking the function, then the function returns zero.

Passing zero as an argument to the function deactivates the timer and thus prevents the system from scheduling calls to the canister's `canister_global_timer` Wasm method.

### Performance counter {#system-api-performance-counter}

The canister can query one of the "performance counters", which is a deterministic monotonically increasing integer approximating the amount of work the canister has done. Developers might use this data to profile and optimize the canister performance.

`ic0.performance_counter : (counter_type : i32) -> i64`

The argument `type` decides which performance counter to return:

-   0 : current execution instruction counter. The number of WebAssembly instructions the canister has executed since the beginning of the current [Message execution](./abstract-behavior.md#rule-message-execution).

-   1 : call context instruction counter.

    - For replicated message execution, it is the number of WebAssembly instructions the canister has executed within the call context of the current [Message execution](./abstract-behavior.md#rule-message-execution) since [Call context creation](./abstract-behavior.md#call-context-creation). The counter monotonically increases across all [message executions](./abstract-behavior.md#rule-message-execution) in the call context until the corresponding [call context is removed](./abstract-behavior.md#call-context-removal).

    - For non-replicated message execution, it is the number of WebAssembly instructions the canister has executed within the corresponding `composite_query_helper` in [Query call](./abstract-behavior.md#query-call). The counter monotonically increases across the executions of the composite query method and the composite query callbacks until the corresponding `composite_query_helper` returns (ignoring WebAssembly instructions executed within any further downstream calls of `composite_query_helper`).

In the future, the IC might expose more performance counters.

### Replicated execution check {#system-api-replicated-execution-check}

The canister can check whether it is currently running in replicated or non replicated execution.

`ic0.in_replicated_execution : () -> (result: i32)`

Returns 1 if the canister is being run in replicated mode and 0 otherwise.

### Controller check {#system-api-controller-check}

The canister can check whether a given principal is one of its controllers.

`ic0.is_controller : (src : I, size : I) -> (result: i32)`; `I ∈ {i32, i64}`

Checks whether the principal identified by `src`/`size` is one of the controllers of the canister. If yes, then a value of 1 is returned, otherwise a 0 is returned. It can be called multiple times.

This system call traps if `src+size` exceeds the size of the WebAssembly memory or the principal identified by `src`/`size` is not a valid binary encoding of a principal.

### Certified data {#system-api-certified-data}

For each canister, the IC keeps track of "certified data", a canister-defined blob. For fresh canisters (upon install or reinstall), this blob is the empty blob (`""`).

-   `ic0.root_key_size: () → I` and `ic0.root_key_copy : (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`

    Copies the public key (a DER-encoded BLS key) of the IC root key of this instance of the Internet Computer Protocol to the canister.

    This traps in non-replicated mode (NRQ, TQ, CQ, CRy, CRt, CC, and F modes, as defined in [Overview of imports](#system-api-imports)).

-   `ic0.certified_data_set : (src : I, size : I) -> ()`; `I ∈ {i32, i64}`

    The canister can update the certified data with this call. The passed data must be no larger than 32 bytes. This can be used any number of times.

When executing a query or composite query method via a query call (i.e. in non-replicated mode), the canister can fetch a certificate that authenticates to third parties the value last set via `ic0.certified_data_set`. The certificate is not available in composite query method callbacks and in query and composite query methods evaluated on canisters other than the target canister of the query call.

-   `ic0.data_certificate_present : () -> i32`

    returns `1` if a certificate is present, and `0` otherwise.

    This will return `1` when called from a query or composite query method on the target canister of a query call.

    This will return `0` for update methods, if a query method is executed in replicated mode (e.g. when invoked via an update call or inter-canister call) or as canister http outcall transform, and in composite query method callbacks and in query and composite query methods evaluated on canisters other than the target canister of a query call.

-   `ic0.data_certificate_size : () → I` and `ic0.data_certificate_copy : (dst : I, offset : I, size : I) → ()`; `I ∈ {i32, i64}`

    Copies the certificate for the current value of the certified data to the canister.

    The certificate is a blob as described in [Certification](./certification.md#certification) that contains the values at path `/canister/<canister_id>/certified_data` and at path `/time` of [The system state tree](./index.md#state-tree).

    If this `certificate` includes a subnet delegation, then the id of the current canister will be included in the delegation's canister id range.

    This traps if `ic0.data_certificate_present()` returns `0`.

### Cycle cost calculation {#system-api-cycle-cost}

Inter-canister calls have an implicit cost, and some calls to the management canister require the caller to attach cycles to the call explicitly.  
The various cost factors may change over time, so the following system calls give the canister programmatic, up-to-date information about the costs.

These system calls return costs in Cycles, represented by 128 bits, which will be written to the heap memory starting at offset `dst`. Note that the cost calculation is only correct for correct inputs, e.g., a method name length argument should not exceed 20'000, because such an argument would be rejected by `ic0.call_new`. The cost API will still return a number in this case, but it would not have a real meaning. 

-   `ic0.cost_call : (method_name_size: i64, payload_size : i64, dst : I) -> ()`; `I ∈ {i32, i64}`

    This system call returns the amount of cycles that a canister needs to be above the freezing threshold in order to successfully make an inter-canister call. This includes the base cost for an inter-canister call, the cost for each byte transmitted in the request, the cost for the transmission of the largest possible response, and the cost for executing the largest possible response callback. The last two are cost _reservations_, which must be possible for a call to succeed, but they will be partially refunded if the real response and callback are smaller. So the cost of the actual inter-canister call may be less than this system call predicts, but it cannot be more. 
    `method_name_size` is the byte length of the method name, and `payload_size` is the byte length of the argument to the method. 

-   `ic0.cost_create_canister : (dst : I) -> ()`; `I ∈ {i32, i64}`

    The cost of creating a canister on the same subnet as the calling canister via [`create_canister`](./management-canister.md#ic-create_canister). Note that canister creation via a call to the CMC can have a different cost if the target subnet has a different replication factor.

-   `ic0.cost_http_request(request_size : i64, max_res_bytes : i64, dst : I) -> ()`; `I ∈ {i32, i64}`

    The cost of a canister http outcall via [`http_request`](./management-canister.md#ic-http_request). `request_size` is the sum of the byte lengths of the following components of an http request: 
    - url
    - headers - i.e., the sum of the lengths of all keys and values 
    - body
    - transform - i.e., the sum of the transform method name length and the length of the transform context
    
    `max_res_bytes` is the maximum response length the caller wishes to accept (the caller should provide the default value of `2,000,000` if no maximum response length is provided in the actual request to the management canister). 

-   `ic0.cost_sign_with_ecdsa(src : I, size : I, ecdsa_curve: i32, dst : I) -> i32`; `I ∈ {i32, i64}`

-   `ic0.cost_sign_with_schnorr(src : I, size : I, algorithm: i32, dst : I) -> i32`; `I ∈ {i32, i64}`

-   `ic0.cost_vetkd_derive_key(src : I, size : I, vetkd_curve: i32, dst : I) -> i32`; `I ∈ {i32, i64}`

    These system calls accept a key name via a textual representation for the specific signing scheme / key of a given size stored in the heap memory starting at offset `src`. They also accept an `i32` with the following interpretations:
    - `ecdsa_curve: 0 → secp256k1`
    - `algorithm: 0 → bip340secp256k1, 1 → ed25519`
    - `vetkd_curve: 0 → bls12_381`

    See [`sign_with_ecdsa`](./management-canister.md#ic-sign_with_ecdsa), [`sign_with_schnorr`](./management-canister.md#ic-sign_with_schnorr) and [`vetkd_encrypted_key`](#ic-vetkd_encrypted_key) for more information.

    These system calls trap if `src` + `size` or `dst` + 16 exceed the size of the WebAssembly memory. Otherwise, they return an `i32` with the following meaning:
    - `0`: Success. The result can be found at the memory address `dst`.
    - `1`: Invalid curve or algorithm. Memory at `dst` is left unchanged.
    - `2`: Invalid key name for the given combination of signing scheme and (valid) curve/algorithm. Memory at `dst` is left unchanged.

### Environment Variables

The following system calls provide access to the canister's environment variables:

-   `ic0.env_var_count : () -> I`; `I ∈ {i32, i64}`

    Returns the number of environment variables set for this canister.

-   `ic0.env_var_name_size : (index: I) -> I`; `I ∈ {i32, i64}`

    Gets the size in bytes of the name of the environment variable at the given index.

    This system call traps if:
      - If the index is out of bounds (>= than value provided by `ic0.env_var_count`)

-   `ic0.env_var_name_copy : (index: I, dst: I, offset: I, size: I) -> ()`; `I ∈ {i32, i64}`

    Copies the name of the environment variable at the given index into memory.

    This system call traps if:
      - The index is out of bounds (>= than value provided by `ic0.env_var_count`)
      - `offset+size` is greater than the size of the environment variable name
      - `dst+size` exceeds the size of the WebAssembly memory


-   `ic0.env_var_name_exists : (name_src: I, name_size: I) -> i32`; `I ∈ {i32, i64}`

    Checks if an environment variable with the given name exists. If yes, then a value of 1 is returned, otherwise a 0 is returned.

    This system call traps if:
       - `name_size` exceeds the maximum length of a variable name
       - `name_src+name_size` exceeds the size of the WebAssembly memory
       - If the data referred to by `name_src`/`name_size` is not valid UTF8. 


-   `ic0.env_var_value_size : (name_src: I, name_size: I) -> I`; `I ∈ {i32, i64}`

    Gets the size in bytes of the value for the environment variable with the given name.

    This system call traps if:
      - `name_size` exceeds the maximum length of a variable name
      - `name_src+name_size` exceeds the size of the WebAssembly memory
      - If the data referred to by `name_src`/`name_size` is not valid UTF8. 
      - The name does not match any existing environment variable.

-   `ic0.env_var_value_copy : (name_src: I, name_size: I, dst: I, offset: I, size: I) -> ()`; `I ∈ {i32, i64}`

    Copies the value of the environment variable with the given name into memory.

    This system call traps if:
      - `name_size` exceeds the maximum length of a variable name
      - `name_src+name_size` exceeds the size of the WebAssembly memory
      - If the data referred to by `name_src`/`name_size` is not valid UTF8. 
      - The name does not match any existing environment variable.
      - `offset+size` is greater than the size of the environment variable value
      - `dst+size` exceeds the size of the WebAssembly memory

These system calls allow canisters to:
- Enumerate all environment variables
- Look up values by name

### Debugging aids

Canister can produce logs available through the management canister endpoint [`fetch_canister_logs`](./management-canister.md#ic-fetch_canister_logs).

-   `ic0.debug_print : (src : I, size : I) -> ()`; `I ∈ {i32, i64}`

    This copies out the data specified by `src` and `size` and appends that data to canister logs.
    The data can be trimmed to an implementation defined maximum size.

    This function never traps, even if the `src+size` exceeds the size of the memory (in which case system-generated data are used instead).

Similarly, the System API allows the canister to effectively trap and give some indication about why it trapped:

-   `ic0.trap : (src : I, size : I) -> ()`; `I ∈ {i32, i64}`

    This copies out the data specified by `src` and `size` and appends that data to canister logs.
    The data can be trimmed to an implementation defined maximum size.

    Moreover, the data specified by `src` and `size` might be included in a reject message
    (trimmed to an implementation defined maximum size and omitting bytes that are not valid UTF-8).

    This function always traps.

### Outlook: Using Host References {#host-references}

The Internet Computer aims to make the most of the WebAssembly platform, and embraces WebAssembly features. With WebAssembly host references, we can make the platform more secure, the interfaces more abstract and more compositional. The above `ic0` System API does not yet use WebAssembly host references. Once they become available on our platform, a new version of the System API using host references will be available via the `ic` module. The changes will be, at least

1.  The introduction of a `api_nonce` reference, which models the capability to use the System API. It is passed as an argument to `canister_init`, `canister_update <name>` etc., and expected as an argument by almost all System API function calls. (The debugging aids remain unconstrained.)

2.  The use of references, instead of binary blobs, to address principals (user ids, canister ids), e.g. in `ic0.msg_caller` or in `ic0.call_new`. Additional functions will be provided to convert between the transparent binary representation of principals and references.

3.  Making the builder interface to create calls build calls identified by a reference, rather than having an implicit partial call in the background.

A canister may only use the old *or* the new interface; the IC detects which interface the canister intends to use based on the names and types of its function imports and exports.

<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->
