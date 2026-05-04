---
title: "Abstract Behavior"
description: "Formal specification of the Internet Computer abstract state machine and execution semantics"
sidebar:
  label: "Abstract Behavior"
  order: 5
---

:::note
This section is a rigorous formal specification intended for protocol implementors and security researchers. Most application developers do not need to read this section. See the [HTTPS Interface](./https-interface.md), [Canister Interface](./canister-interface.md), and [IC Management Canister](./management-canister.md) pages instead.
:::

## Abstract behavior {#abstract-behavior}

The previous sections describe the interfaces, i.e. outer edges of the Internet Computer, but give only intuitive and vague information in prose about what these interfaces actually do.

The present section aims to address that question with great precision, by describing the *abstract state* of the whole Internet Computer, and how this state can change in response to API function calls, or spontaneously (modeling asynchronous, distributed or non-deterministic execution).

The design of this abstract specification (e.g. how and where pending messages are stored) are *not* to be understood to in any way prescribe a concrete implementation or software architecture. The goals here are formal precision and clarity, but not implementability, so this can lead to different ways of phrasing.

### Notation

We specify the behavior of the Internet Computer using ad-hoc pseudocode.

The manipulated values are primitive values (numbers, text, binary blobs), aggregate values (lists, unordered lists a.k.a. bags, partial maps, records with fixed fields, named constructors) and functions.

We use a concatenation operator `·` with various types: to extend sets and maps, or to concatenate lists with lists or lists with elements.

The shape of values is described using a hand-wavy type system. We use `Foo = Nat` to define type aliases; now `Foo` can be used instead of `Nat`. Often, the right-hand side is a more complex type here, e.g. a record, or multiple possible types separated by a vertical bar (`|`). Partial maps are written as `Key ↦ Value` and the function type as `Argument → Result`.

:::note

All values are immutable! State change is specified by describing the new state, not by changing the existing state.

:::

Record fields are accessed using dot-notation (e.g. `S.request_id > 0`). To create a new record from an existing record `R` with some fields changed, the syntax `R where field = new_value` is used. This syntax can also be used to create new records with some deeply nested field changed: `R where some_map[key].field = new_value`.

In the state transitions, upper-case variables (`S`, `C`, `Req_id`) are free variables: The state transition may be taken for any possible value of these variables. `S` always refers to the previous state. A state transition often comes with a list of *conditions*, which may restrict the values of these free variables. The *state after* is usually described using the record update syntax by starting with `S where`.

For example, the condition `S.messages = Older_messages · M · Younger_messages` says that `M` is some message in field `messages` of the record `S`, and that `Younger_messages` and `Older_messages` are the other messages in the state. If the "state after" specifies `S with messages = Older_messages · Younger_messages`, then the message `M` is removed from the state.

### Abstract state

In this specification, we describe the Internet Computer as a state machine. In particular, there is a single piece of data that describes the complete state of the IC, called `S`.

Of course, this is a huge simplification: The real Internet Computer is distributed and has a multi-component architecture, and the state is spread over many different components, some physically separated. But this simplification allows us to have a concise description of the behavior, and to easily make global decisions (such as, "is there any pending message"), without having to specify the bookkeeping that allows such global decisions.

#### Identifiers

Principals (canister ids and user ids) are blobs, but some of them have special form, as explained in [Special forms of Principals](./index.md#id-classes).
```
type Principal = Blob
```
The function
```
mk_self_authenticating_id : PublicKey -> Principal
mk_self_authenticating_id pk = H(pk) · 0x02
```
calculates self-authenticating ids.

The function
```
canister_signature_pk : Principal -> Blob -> PublicKey
```
calculates the public key of a [canister signature](./index.md#canister-signatures).

The function
```
mk_derived_id : Principal -> Blob -> Principal
mk_derived_id p nonce = H(|p| · p · nonce) · 0x03
```
calculates derived ids. With `|p|` we denote the length of the principal, in bytes, encoded as a single byte.

The principal of the anonymous user is fixed:
```
anonymous_id : Principal
anonymous_id = 0x04
```
The principal of the management canister is the empty blob (i.e. `aaaaa-aa`):
```
ic_principal : Principal = ""
```
These function domains and fixed values are mutually disjoint.

Method names can be arbitrary pieces of text:
```
MethodName = Text
```
#### Abstract canisters {#abstract-canisters}

The [WebAssembly System API](./canister-interface.md#system-api) is relatively low-level, and some of its details (e.g. that the argument data is queried using separate calls, and that closures are represented by a function pointer and a number, that method names need to be mangled) would clutter this section. Therefore, we abstract over the WebAssembly details as follows:

-   The state `WasmState` of a WebAssembly module is represented by its WASM (a.k.a. heap) and stable memory and a list of (exported or mutable) globals. For notational simplicity, the principal of the canister with state represented by `WasmState` is also stored in `WasmState`.

-   A canister module `CanisterModule` consists of an initial state, and (pure) functions that model function invocation on the canister. A function return value either indicates that the canister function traps, or returns a new state together with a description of the invoked asynchronous System API calls.
    ```
    WasmState = {
      wasm_memory : Blob;
      stable_memory : Blob;
      globals : [Global];
      self_id : Principal;
    }
    Global
      = I32(Int)
      | I64(Int)
      | F32(Real)
      | F64(Real)
      | V128(Nat);
    Callback = (abstract)
    ChunkStore = Hash -> Blob

    Arg = Blob;
    CallerId = Principal;
    CallerInfoData = Blob;
    CallerInfoSigner = Blob;

    Timestamp = Nat;
    CanisterVersion = Nat;
    Env = {
      time : Timestamp;
      controllers : List Principal;
      global_timer : Nat;
      balance : Nat;
      reserved_balance : Nat;
      reserved_balance_limit : Nat;
      compute_allocation : Nat;
      memory_allocation : Nat;
      memory_usage_raw_module : Nat;
      memory_usage_canister_history : Nat;
      memory_usage_chunk_store : Nat;
      memory_usage_snapshots : Nat;
      freezing_threshold : Nat;
      subnet_id : Principal;
      subnet_size : Nat;
      certificate : NoCertificate | Blob;
      status : Running | Stopping | Stopped;
      canister_version : CanisterVersion;
    }

    RejectCode = Nat
    Response = Reply Blob | Reject (RejectCode, Text)
    MethodCall = {
      callee : CanisterId;
      method_name: MethodName;
      arg: Blob;
      transferred_cycles: Nat;
      callback: Callback;
      timeout_seconds : NoTimeout | Nat;
    }

    UpdateFunc = WasmState -> Trap { cycles_used : Nat; } | Return {
      new_state : WasmState;
      new_calls : List MethodCall;
      new_certified_data : NoCertifiedData | Blob;
      new_global_timer : NoGlobalTimer | Nat;
      response : NoResponse | Response;
      cycles_accepted : Nat;
      cycles_used : Nat;
    }
    QueryFunc = WasmState -> Trap { cycles_used : Nat; } | Return {
      response : Response;
      cycles_accepted : Nat;
      cycles_used : Nat;
    }
    CompositeQueryFunc = WasmState -> Trap { cycles_used : Nat; } | Return {
      new_state : WasmState;
      new_calls : List MethodCall;
      response : NoResponse | Response;
      cycles_used : Nat;
    }
    SystemTaskFunc = WasmState -> Trap { cycles_used : Nat; } | Return {
      new_state : WasmState;
      new_calls : List MethodCall;
      new_certified_data : NoCertifiedData | Blob;
      new_global_timer : NoGlobalTimer | Nat;
      cycles_used : Nat;
    }

    AvailableCycles = Nat
    RefundedCycles = Nat

    CanisterModule = {
      initial_globals : [Global];
      init : (CanisterId, Arg, CallerId, Env) -> Trap { cycles_used : Nat; } | Return {
        new_state : WasmState;
        new_certified_data : NoCertifiedData | Blob;
        new_global_timer : NoGlobalTimer | Nat;
        cycles_used : Nat;
      }
      pre_upgrade : (WasmState, Principal, Env) -> Trap { cycles_used : Nat; } | Return {
        new_state : WasmState;
        new_certified_data : NoCertifiedData | Blob;
        cycles_used : Nat;
      }
      post_upgrade : (WasmState, Arg, CallerId, Env) -> Trap { cycles_used : Nat; } | Return {
        new_state : WasmState;
        new_certified_data : NoCertifiedData | Blob;
        new_global_timer : NoGlobalTimer | Nat;
        cycles_used : Nat;
      }
      update_methods : MethodName ↦ ((Arg, CallerId, CallerInfoData, CallerInfoSigner, Deadline, Env, AvailableCycles) -> UpdateFunc)
      query_methods : MethodName ↦ ((Arg, CallerId, CallerInfoData, CallerInfoSigner, Env) -> QueryFunc)
      composite_query_methods : MethodName ↦ ((Arg, CallerId, CallerInfoData, CallerInfoSigner, Env) -> CompositeQueryFunc)
      heartbeat : (Env) -> SystemTaskFunc
      global_timer : (Env) -> SystemTaskFunc
      on_low_wasm_memory : (Env) -> SystemTaskFunc
      callbacks : (Callback, CallerId, CallerInfoData, CallerInfoSigner, Response, Deadline, RefundedCycles, Env, AvailableCycles) -> UpdateFunc
      composite_callbacks : (Callback, CallerId, CallerInfoData, CallerInfoSigner, Response, Env) -> UpdateFunc
      inspect_message : (MethodName, WasmState, Arg, CallerId, CallerInfoData, CallerInfoSigner, Env) -> Trap | Return {
        status : Accept | Reject;
      }
    }
    ```

This high-level interface presents a pure, mathematical model of a canister, and hides the bookkeeping required to provide the System API as seen in Section [Canister interface (System API)](./canister-interface.md#system-api).

The `CanisterId` parameter of `init` is merely passed through to the canister, via the `canister.self` system call.

The `Env` parameter provides synchronous read-only access to portions of the system state and canister metadata that are always available.

The parsing of a blob to a canister module and its public and private custom sections is modelled via the (possibly implicitly failing) functions
```
parse_wasm_mod : Blob -> CanisterModule
parse_public_custom_sections : Blob -> Text ↦ Blob
parse_private_custom_sections : Blob -> Text ↦ Blob
```

The concrete mapping of this abstract `CanisterModule` to actual WebAssembly concepts and the System API is described separately in section [Abstract Canisters to System API](#concrete-canisters).

#### Call contexts

The Internet Computer provides certain messaging guarantees: If a user or a canister calls another canister, it will eventually get a single response (a reply or a rejection), even if some canister code along the way fails.

To ensure that only one response is generated, and also to detect when no response can be generated any more, the IC maintains a *call context*. The `needs_to_respond` field is set to `false` once the call has received a response. Further attempts to respond will now fail.
```
Request = {
    nonce : Blob;
    ingress_expiry : Nat;
    sender : UserId;
    sender_info : {
      info : Blob;
      signer : Blob;
      sig : Blob;
    };
    canister_id : CanisterId;
    method_name : Text;
    arg : Blob;
  }
CallId = (abstract)
CallOrigin
  = FromUser {
      request : Request;
    }
  | FromCanister {
      calling_context : CallId;
      callback: Callback;
      deadline : NoDeadline | Timestamp | Expired Timestamp;
    }
  | FromSystemTask
CallCtxt = {
  canister : CanisterId;
  origin : CallOrigin;
  needs_to_respond : bool;
  deleted : bool;
  available_cycles : Nat;
}
```
#### Calls and Messages

Calls into and within the IC are implemented as messages passed between canisters. During their lifetime, messages change shape: they begin as a call to a public method, which is resolved to a WebAssembly function that is then executed, potentially generating a response which is then delivered.

Therefore, a message can have different shapes:
```
Queue = Unordered | Queue { from : System | CanisterId; to : CanisterId }
EntryPoint
  = PublicMethod MethodName Principal Blob
  | Callback Callback Response RefundedCycles
  | Heartbeat
  | GlobalTimer
  | OnLowWasmMemory
Message
  = CallMessage {
      origin : CallOrigin;
      caller : Principal;
      caller_info_data : Blob;
      caller_info_signer : Blob;
      callee : CanisterId;
      method_name : Text;
      arg : Blob;
      transferred_cycles : Nat;
      queue : Queue;
    }
  | FuncMessage {
      call_context : CallId;
      caller : Principal;
      caller_info_data : Blob;
      caller_info_signer : Blob;
      receiver : CanisterId;
      entry_point : EntryPoint;
      queue : Queue;
    }
  | ResponseMessage {
      origin : CallOrigin;
      response : Response;
      refunded_cycles : Nat;
    }
```

The `queue` field is used to describe the message ordering behavior. Its concrete value is only used to determine when the relative order of two messages must be preserved, and is otherwise not interpreted. Response messages are not ordered so they have no `queue` field.

A reference implementation would likely maintain a separate list of `messages` for each such queue to efficiently find eligible messages; this document uses a single global list for a simpler and more concise system state.

#### API requests

We distinguish between API requests (type `Request`) passed to `/api/v2/…/call` and `/api/v4/…/call`, which may be present in the IC state, and the *read-only* API requests passed to `/api/v3/…/read_state` and `/api/v3/…/query`, which are only ephemeral.

These are the read-only messages:
```
Path = List(Blob)
APIReadRequest
  = StateRead = {
    nonce : Blob;
    ingress_expiry : Nat;
    sender : UserId;
    paths : List(Path);
  }
  | CanisterQuery = {
    nonce : Blob;
    ingress_expiry : Nat;
    sender : UserId;
    sender_info : {
      info : Blob;
      signer : Blob;
      sig : Blob;
    };
    canister_id : CanisterId;
    method_name : Text;
    arg : Blob;
  }
```

Signed delegations contain the (unsigned) delegation data in a nested record, next to the signature of that data.
```
PublicKey = Blob
Signature = Blob
SignedDelegation = {
  delegation : {
    pubkey : PublicKey;
    targets : [CanisterId] | Unrestricted;
    expiration : Timestamp
  };
  signature : Signature
}
```

For the signatures in a `Request`, we assume that the following function implements signature verification as described in [Authentication](./https-interface.md#authentication). This function picks the corresponding signature scheme according to the DER-encoded metadata in the public key.
```
verify_signature : PublicKey -> Signature -> Blob -> Bool
Envelope = {
  content : Request | APIReadRequest;
  sender_pubkey : PublicKey | NoPublicKey;
  sender_sig : Signature | NoSignature;
  sender_delegation: [SignedDelegation]
}
```

The evolution of a `Request` goes through these states, as explained in [Overview of canister calling](./https-interface.md#http-call-overview):
```
RequestStatus
  = Received
  | Processing
  | Rejected (RejectCode, Text)
  | Replied Blob
  | Done
```

A `Path` may refer to a request by way of a *request id*, as specified in [Request ids](./https-interface.md#request-id):
```
RequestId = { b ∈ Blob | |b| = 32 }
hash_of_map: Request -> RequestId
```

#### The system state

Finally, we can describe the state of the IC as a record having the following fields:
```
CanState
 = EmptyCanister | {
  wasm_state : WasmState;
  module : CanisterModule;
  raw_module : Blob;
  public_custom_sections: Text ↦ Blob;
  private_custom_sections: Text ↦ Blob;
}
CanStatus
  = Running
  | Stopping (List (CallOrigin, Nat))
  | Stopped
ChangeOrigin
  = FromUser {
      user_id : PrincipalId;
    }
  | FromCanister {
      canister_id : PrincipalId;
      canister_version : CanisterVersion | NoCanisterVersion;
    }
CodeDeploymentMode
  = Install
  | Reinstall
  | Upgrade
SnapshotId = (abstract)
SnapshotSource
  = TakenFromCanister
  | MetadataUpload
ChangeDetails
  = Creation {
      controllers : [PrincipalId];
      environment_variables_hash: opt Blob;
    }
  | CodeUninstall
  | CodeDeployment {
      mode : CodeDeploymentMode;
      module_hash : Blob;
    }
  | LoadSnapshot {
      from_canister_id : PrincipalId;
      snapshot_id : SnapshotId;
      canister_version : CanisterVersion;
      taken_at_timestamp : Timestamp;
      source : SnapshotSource;
    }
  | ControllersChange {
      controllers: [PrincipalId];
  }
  | RenameCanister {
      canister_id : PrincipalId;
      total_num_changes : Nat;
      rename_to : {
          canister_id : PrincipalId;
          version : Nat;
          total_num_changes : Nat;
      };
      requested_by : PrincipalId;
  }
Change = {
  timestamp_nanos : Timestamp;
  canister_version : CanisterVersion;
  origin : ChangeOrigin;
  details : ChangeDetails;
}
CanisterHistory = {
  total_num_changes : Nat;
  recent_changes : [Change];
}
CanisterLogVisibility
  = Controllers
  | Public
  | AllowedViewers [Principal]
CanisterSnapshotVisibility
  = Controllers
  | Public
  | AllowedViewers [Principal]
CanisterLog = {
  idx : Nat;
  timestamp_nanos : Nat;
  content : Blob;
}
OnLowWasmMemoryHookStatus
  = ConditionNotSatisfied
  | Ready
  | Executed
QueryStats = {
  timestamp : Timestamp;
  num_instructions : Nat;
  request_payload_bytes : Nat;
  response_payload_bytes : Nat;
}
Subnet = {
  subnet_id : Principal;
  subnet_size : Nat;
}
Snapshot = {
  source : SnapshotSource;
  taken_at_timestamp : Timestamp;
  raw_module : Blob;
  wasm_state : WasmState;
  chunk_store : ChunkStore;
  canister_version : CanisterVersion;
  certified_data : Blob;
  global_timer : Timestamp | null;
  on_low_wasm_memory_hook_status : OnLowWasmMemoryHookStatus | null;
}
S = {
  requests : Request ↦ (RequestStatus, Principal);
  canisters : CanisterId ↦ CanState;
  snapshots: CanisterId ↦ SnapshotId ↦ Snapshot;
  controllers : CanisterId ↦ Set Principal;
  compute_allocation : CanisterId ↦ Nat;
  memory_allocation : CanisterId ↦ Nat;
  freezing_threshold : CanisterId ↦ Nat;
  canister_status: CanisterId ↦ CanStatus;
  canister_version: CanisterId ↦ CanisterVersion;
  canister_subnet : CanisterId ↦ Subnet;
  time : CanisterId ↦ Timestamp;
  global_timer : CanisterId ↦ Timestamp;
  balances: CanisterId ↦ Nat;
  reserved_balances: CanisterId ↦ Nat;
  reserved_balance_limits: CanisterId ↦ Nat;
  wasm_memory_limit: CanisterId ↦ Nat;
  wasm_memory_threshold: CanisterId ↦ Nat;
  environment_variables: CanisterId ↦ (Text ↦ Text)
  on_low_wasm_memory_hook_status: CanisterId ↦ OnLowWasmMemoryHookStatus;
  certified_data: CanisterId ↦ Blob;
  canister_history: CanisterId ↦ CanisterHistory;
  canister_log_visibility: CanisterId ↦ CanisterLogVisibility;
  canister_snapshot_visibility: CanisterId ↦ CanisterSnapshotVisibility;
  canister_logs: CanisterId ↦ [CanisterLog];
  query_stats: CanisterId ↦ [QueryStats];
  system_time : Timestamp
  call_contexts : CallId ↦ CallCtxt;
  messages : List Message; // ordered!
  root_key : PublicKey
}
```

To convert `CanStatus` into `status : Running | Stopping | Stopped` from `Env`, we define the following conversion function:
```
simple_status(Running) = Running
simple_status(Stopping _) = Stopping
simple_status(Stopped) = Stopped
```

To convert `CallOrigin` into `ChangeOrigin`, we define the following conversion function:
```
change_origin(principal, _, FromUser { … }) = FromUser {
    user_id = principal
  }
change_origin(principal, sender_canister_version, FromCanister { … }) = FromCanister {
    canister_id = principal
    canister_version = sender_canister_version
  }
change_origin(principal, sender_canister_version, FromSystemTask) = FromCanister {
    canister_id = principal
    canister_version = sender_canister_version
  }
```

#### Cycle bookkeeping and resource consumption

The main cycle balance of canister `A` in state `S` can be obtained with `S.balances(A)`.
In addition to the main balance, each canister has a reserved balance `S.reserved_balances(A)`.
The reserved balance contains cycles that were set aside from the main balance for future payments for the consumption of resources such as compute and memory.
The reserved cycles can only be used for resource payments and cannot be transferred back to the main balance.

The (unspecified) function `idle_cycles_burned_rate(compute_allocation, memory_allocation, memory_usage, subnet_size)` determines the idle resource consumption rate in cycles per day of a canister given its current compute and memory allocation, memory usage, and subnet size. The function `freezing_limit(compute_allocation, memory_allocation, freezing_threshold, memory_usage, subnet_size)` determines the freezing limit in cycles of a canister given its current compute and memory allocation, freezing threshold in seconds, memory usage, and subnet size. The value `freezing_limit(compute_allocation, memory_allocation, freezing_threshold, memory_usage, subnet_size)` is derived from `idle_cycles_burned_rate(compute_allocation, memory_allocation, memory_usage, subnet_size)` and `freezing_threshold` as follows:
```
freezing_limit(compute_allocation, memory_allocation, freezing_threshold, memory_usage, subnet_size) = idle_cycles_burned_rate(compute_allocation, memory_allocation, memory_usage, subnet_size) * freezing_threshold / (24 * 60 * 60)
```

The (unspecified) functions `memory_usage_wasm_state(wasm_state)`, `memory_usage_raw_module(raw_module)`, `memory_usage_canister_history(canister_history)`, `memory_usage_chunk_store(chunk_store)`, and `memory_usage_snapshots(snapshots)` determine the canister's memory usage in bytes consumed by its Wasm state, raw Wasm binary, canister history, chunk store, and snapshots, respectively.

The freezing limit of canister `A` in state `S` can be obtained as follows:
```
freezing_limit(S, A) =
  freezing_limit(
    S.compute_allocation[A],
    S.memory_allocation[A],
    S.freezing_threshold[A],
    memory_usage_wasm_state(S.canisters[A].wasm_state) +
      memory_usage_raw_module(S.canisters[A].raw_module) +
      memory_usage_canister_history(S.canister_history[A]) +
      memory_usage_chunk_store(S.chunk_store[A]) +
      memory_usage_snapshots(S.snapshots[A]),
    S.canister_subnet[A].subnet_size,
  )
```

The amount of cycles that is available for spending in calls and execution is computed by the function `liquid_balance(balance, reserved_balance, freezing_limit)`:
```
liquid_balance(balance, reserved_balance, freezing_limit) = balance - max(freezing_limit - reserved_balance, 0)
```

The "liquid" balance of canister `A` in state `S` can be obtained as follows:
```
liquid_balance(S, A) =
  liquid_balance(
    S.balances[A],
    S.reserved_balances[A],
    freezing_limit(S, A),
  )
```

The reasoning behind this is that resource payments first drain the reserved balance and only when the reserved balance gets to zero, they start draining the main balance.

The amount of cycles that need to be reserved after operations that allocate resources is modeled with an unspecified function `cycles_to_reserve(S, CanisterId, compute_allocation, memory_allocation, snapshots, CanState)` that depends on the old IC state, the id of the canister, the new allocations of the canister, the snapshots of the canister, and the new state of the canister.

#### Initial state

The initial state of the IC is

```
{
  requests = ();
  canisters = ();
  snapshots = ();
  controllers = ();
  compute_allocation = ();
  memory_allocation = ();
  freezing_threshold = ();
  canister_status = ();
  canister_version = ();
  canister_subnet = ();
  time = ();
  global_timer = ();
  balances = ();
  reserved_balances = ();
  reserved_balance_limits = ();
  wasm_memory_limit = ();
  wasm_memory_threshold = ();
  environment_variables = ();
  on_low_wasm_memory_hook_status = ();
  certified_data = ();
  canister_history = ();
  canister_log_visibility = ();
  canister_snapshot_visibility = ();
  canister_logs = ();
  query_stats = ();
  system_time = T;
  call_contexts = ();
  messages = [];
  root_key = PublicKey;
  subnet_admins = ();
}
```

for some time stamp `T`, some DER-encoded BLS public key `PublicKey`, and using `()` to denote the empty map or bag.

### Invariants

The following is an incomplete list of invariants that should hold for the abstract state `S`, and are not already covered by the type annotations in this section.

-   No pair of update, query, and composite query methods in a CanisterModule can have the same name:
    ```
    ∀ (_ ↦ CanState) ∈ S.canisters:
      dom(CanState.module.update_methods) ∩ dom(CanState.module.query_methods) = ∅
      dom(CanState.module.update_methods) ∩ dom(CanState.module.composite_query_methods) = ∅
      dom(CanState.module.query_methods) ∩ dom(CanState.module.composite_query_methods) = ∅
    ```

-   Deleted call contexts were not awaiting a response:
    ```
    ∀ (_ ↦ Ctxt) ∈ S.call_contexts:
      if Ctxt.deleted then Ctxt.needs_to_respond = false
    ```
-   Responded call contexts have no available\_cycles left:
    ```
    ∀ (_ ↦ Ctxt) ∈ S.call_contexts:
      if Ctxt.needs_to_respond = false then Ctxt.available_cycles = 0
    ```
-   A stopped canister does not have any call contexts (in particular, a stopped canister does not have any call contexts marked as deleted):
    ```
    ∀ (_ ↦ Ctxt) ∈ S.call_contexts:
      S.canister_status[Ctxt.canister] ≠ Stopped
    ```
-   Referenced call contexts exist, unless the origins have expired deadlines:

    ```
    ∀ CallMessage {origin = FromCanister O, …} ∈ S.messages. O.deadline ≠ Expired _ ⇒ O.calling_context ∈ dom(S.call_contexts)
    ∀ ResponseMessage {origin = FromCanister O, …} ∈ S.messages. O.deadline ≠ Expired _ ⇒ O.calling_context ∈ dom(S.call_contexts)
    ∀ (_ ↦ {needs_to_respond = true, origin = FromCanister O, …}) ∈ S.call_contexts: O.deadline ≠ Expired _ ⇒ O.calling_context ∈ dom(S.call_contexts)
    ∀ (_ ↦ Stopping Origins) ∈ S.canister_status: ∀(FromCanister O, _) ∈ Origins. O.deadline ≠ Expired _ ⇒ O.calling_context ∈ dom(S.call_contexts)
    ```
### State transitions

Based on this abstract notion of the state, we can describe the behavior of the IC. There are three classes of behaviors:

-   Potentially state changing API requests that are submitted via `/api/v2/…/call` and `/api/v4/…/call`. These transitions describe checks that the request must pass to be considered received.

-   Spontaneous transitions that model the internal behavior of the IC, by describing conditions on the state that allow the transition to happen, and the state after.

-   Responses to reads (i.e. `/api/v3/…/read_state` and `/api/v3/…/query`). By definition, these do *not* change the state of the IC, and merely describe the response based on the read request (or query, respectively) and the current state.

The state transitions are not complete with regard to error handling. For example, the behavior of sending a request to a non-existent canister is not specified here. For now, we trust implementors to make sensible decisions there.

We model the [The IC management canister](./management-canister.md#ic-management-canister) with one state transition per method. There, we assume a function
```
candid : Value -> Blob
```
that represents Candid encoding; this is implicitly taking the method types, as declared in [Interface overview](./management-canister.md#ic-candid), into account. We model the parsing of Candid values in the "Conditions" section using `candid` as well, by treating it as a non-deterministic function.

#### Envelope Authentication

The following predicate describes when an envelope `E` correctly signs the enclosed request with a key belonging to a user `U`, at time `T`: It returns which canister ids this envelope may be used at (as a set of principals).
```
verify_envelope({ content = C }, U, T)
  = { p : p is CanisterID } if U = anonymous_id
verify_envelope({ content = C, sender_pubkey = PK, sender_sig = Sig, sender_delegation = DS}, U, T)
  = TS if U = mk_self_authenticating_id E.sender_pubkey
  ∧ (PK', TS) = verify_delegations(DS, PK, T, { p : p is CanisterId })
  ∧ verify_signature PK' Sig ("\x0Aic-request" · hash_of_map(C))
verify_delegations([], PK, T, TS) = (PK, TS)
verify_delegations([D] · DS, PK, T, TS)
  = verify_delegations(DS, D.pubkey, T, TS ∩ delegation_targets(D))
  if verify_signature PK D.signature ("\x1Aic-request-auth-delegation" · hash_of_map(D.delegation))
   ∧ D.delegation.expiration ≥ T
delegation_targets(D)
  = if D.targets = Unrestricted
    then { p : p is CanisterId }
    else D.targets
```
#### Effective canister ids

A `Request` has an effective canister id according to the rules in [Effective canister id](./https-interface.md#http-effective-canister-id):
```
is_effective_canister_id(Request {canister_id = ic_principal, method = create_canister, …}, p)
is_effective_canister_id(Request {canister_id = ic_principal, method = provisional_create_canister_with_cycles, …}, p)
is_effective_canister_id(CanisterQuery {canister_id = ic_principal, method = list_canisters, …}, p)
is_effective_canister_id(Request {canister_id = ic_principal, method = install_chunked_code, arg = candid({target_canister = p, …}), …}, p)
is_effective_canister_id(Request {canister_id = ic_principal, arg = candid({canister_id = p, …}), …}, p)
is_effective_canister_id(Request {canister_id = p, …}, p), if p ≠ ic_principal
```

#### API Request submission {#api-request-submission}

After a replica (i.e., a node belonging to an IC subnet) receives a call in an HTTP request to `/api/v2/canister/<ECID>/call` or `/api/v4/canister/<ECID>/call`
and if the replica accepts the call and subsequently the IC subnet (as a whole) receives the call, then the call gets added to the IC state as `Received`.

This can only happen if the target canister is not frozen and

- the target canister is not empty, the target canister is running, and ingress message inspection succeeds for calls to a regular canister;

- the management canister method can be called via ingress messages and the caller is a controller of the target canister for calls to the management canister
  (or the call targets the [IC Provisional API](./management-canister.md#ic-provisional-api) on a development instance).

Moreover, the signature must be valid and created with a correct key. Due to this check, the envelope is discarded after this point.

Finally, the system time (of the replica receiving the HTTP request) must not have exceeded the `ingress_expiry` field of the HTTP request containing the call.

Submitted request to `/api/<VERSION>/canister/<ECID>/call`

```html

E : Envelope

```

where `<VERSION>` is `v2` or `v4`.

Conditions  

```html

E.content.canister_id ∈ verify_envelope(E, E.content.sender, S.system_time)
if E.sender_pubkey = canister_signature_pk Signing_canister_id Seed:
  if not (E.content.sender_info = null):
    verify_signature E.sender_pubkey E.content.sender_info.sig ("\x0Eic-sender-info" · E.content.sender_info.info)
    E.content.sender_info.signer = Signing_canister_id
else:
  E.content.sender_info = null
if E.content.sender = mk_self_authenticating_id (canister_signature_pk Signing_canister_id Seed):
  if E.content.sender_info = null:
    Caller_info_data = ""
    Caller_info_signer = ""
  else:
    Caller_info_data = E.content.sender_info.info
    Caller_info_signer = Signing_canister_id
else:
  Caller_info_data = ""
  Caller_info_signer = ""
|E.content.nonce| <= 32
E.content ∉ dom(S.requests)
S.system_time <= E.content.ingress_expiry
is_effective_canister_id(E.content, ECID)
liquid_balance(S, E.content.canister_id) ≥ 0
( E.content.canister_id = ic_principal
  E.content.arg = candid({canister_id = CanisterId, …})
  E.content.sender ∈ S.controllers[CanisterId]
  E.content.method_name ∈
    { "install_code", "install_chunked_code", "update_settings",
      "upload_chunk", "stored_chunks", "clear_chunk_store",
      "take_canister_snapshot", "load_canister_snapshot", "list_canister_snapshots", "delete_canister_snapshot",
      "read_canister_snapshot_metadata", "read_canister_snapshot_data", "upload_canister_snapshot_metadata", "upload_canister_snapshot_data",
      "provisional_top_up_canister" }
) ∨ (
  E.content.canister_id = ic_principal
  E.content.arg = candid({canister_id = CanisterId, …})
  E.content.sender ∈ S.controllers[CanisterId] ∪ S.subnet_admins[S.canister_subnet[CanisterId]]
  E.content.method_name ∈
    { "start_canister", "stop_canister", "uninstall_code", "delete_canister", "canister_status" }
) ∨ (
  E.content.canister_id = ic_principal
  E.content.sender ∈ S.subnet_admins[S.canister_subnet[ECID]]
  E.content.method_name ∈
    { "create_canister" }
) ∨ (
  E.content.canister_id = ic_principal
  E.content.method_name ∈
    { "provisional_create_canister_with_cycles" }
) ∨ (
  E.content.canister_id ≠ ic_principal
  S.canisters[E.content.canister_id] ≠ EmptyCanister
  S.canister_status[E.content.canister_id] = Running
  Env = {
    time = S.time[E.content.canister_id];
    controllers = S.controllers[E.content.canister_id];
    global_timer = S.global_timer[E.content.canister_id];
    balance = S.balances[E.content.canister_id];
    reserved_balance = S.reserved_balances[E.content.canister_id];
    reserved_balance_limit = S.reserved_balance_limits[E.content.canister_id];
    compute_allocation = S.compute_allocation[E.content.canister_id];
    memory_allocation = S.memory_allocation[E.content.canister_id];
    memory_usage_raw_module = memory_usage_raw_module(S.canisters[E.content.canister_id].raw_module);
    memory_usage_canister_history = memory_usage_canister_history(S.canister_history[E.content.canister_id]);
    memory_usage_chunk_store = memory_usage_chunk_store(S.chunk_store[E.content.canister_id]);
    memory_usage_snapshots = memory_usage_snapshots(S.snapshots[E.content.canister_id]);
    freezing_threshold = S.freezing_threshold[E.content.canister_id];
    subnet_id = S.canister_subnet[E.content.canister_id].subnet_id;
    subnet_size = S.canister_subnet[E.content.canister_id].subnet_size;
    certificate = NoCertificate;
    status = simple_status(S.canister_status[E.content.canister_id]);
    canister_version = S.canister_version[E.content.canister_id];
  }
  S.canisters[E.content.canister_id].module.inspect_message
    (E.content.method_name, S.canisters[E.content.canister_id].wasm_state, E.content.arg, E.content.sender, Caller_info_data, Caller_info_signer, Env) = Return {status = Accept;}
)

```

State after  

```html

S with
    requests[E.content] = (Received, ECID)

```

:::note

This is not instantaneous (the IC takes some time to agree it accepts the request) nor guaranteed (a node could just drop the request, or maybe it did not pass validation). But once the request has entered the IC state like this, it will be acted upon.

:::

#### Request rejection

The IC may reject a received message for internal reasons (high load, low resources) or expiry. The precise conditions are not specified here, but the reject code must indicate this to be a system error.

Conditions  

```html

S.requests[R] = (Received, ECID)
Code = SYS_FATAL or Code = SYS_TRANSIENT

```

State after  

```html

S with
    requests[R] = (Rejected (Code, Msg), ECID)

```

#### Initiating canister calls

A first step in processing a canister update call is to create a `CallMessage` in the message queue.

The `request` field of the `FromUser` origin establishes the connection to the API message. One could use the corresponding `hash_of_map` for this purpose, but this formulation is more abstract.

The IC does not make any guarantees about the order of incoming messages.

Conditions  

```html

S.requests[R] = (Received, ECID)
S.system_time <= R.ingress_expiry
C = S.canisters[R.canister_id]

if R.sender = mk_self_authenticating_id (canister_signature_pk Signing_canister_id Seed):
  if R.sender_info = null:
    Caller_info_data = ""
    Caller_info_signer = ""
  else:
    Caller_info_data = R.sender_info.info
    Caller_info_signer = Signing_canister_id
else:
  Caller_info_data = ""
  Caller_info_signer = ""

```

State after  

```html

S with
    requests[R] = (Processing, ECID)
    messages =
      CallMessage {
        origin = FromUser { request = R };
        caller = R.sender;
        caller_info_data = Caller_info_data;
        caller_info_signer = Caller_info_signer;
        callee = R.canister_id;
        method_name = R.method_name;
        arg = R.arg;
        transferred_cycles = 0;
        queue = Unordered;
      } · S.messages

```

#### Calls to stopped/stopping canisters are rejected

A call to a canister which is stopping, or stopped is automatically rejected.

Conditions  

```html

S.messages = Older_messages · CallMessage CM · Younger_messages
(CM.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ CM.queue)
S.canisters[CM.callee] ≠ EmptyCanister
S.canister_status[CM.callee] = Stopped or S.canister_status[CM.callee] = Stopping
```

State after:

```html

messages = Older_messages · Younger_messages  ·
  ResponseMessage {
      origin = CM.origin;
      response = Reject (CANISTER_ERROR, <implementation-specific>);
      refunded_cycles = CM.transferred_cycles;
  }

```

#### Calls to frozen canisters are rejected

A call to a canister which is frozen is automatically rejected.

Conditions  

```html

S.messages = Older_messages · CallMessage CM · Younger_messages
(CM.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ CM.queue)
S.canisters[CM.callee] ≠ EmptyCanister
liquid_balance(S, CM.callee) < 0
```

State after:

```html

messages = Older_messages · Younger_messages  ·
  ResponseMessage {
      origin = CM.origin;
      response = Reject (SYS_TRANSIENT, <implementation-specific>);
      refunded_cycles = CM.transferred_cycles;
  }

```

#### Call context creation {#call-context-creation}

Before invoking a heartbeat, a global timer, or a message to a public entry point, a call context is created for bookkeeping purposes. For these invocations the canister must be running (so not stopped or stopping). Additionally, these invocations only happen for "real" canisters, not the IC management canister.

This "bookkeeping transition" must be immediately followed by the corresponding ["Message execution" transition](#rule-message-execution).

*Call context creation: Public entry points*

For a message to a public entry point, the method is looked up in the list of exports. This happens for both ingress and inter-canister messages.

The position of the message in the queue is unchanged.

Conditions  

```html

S.messages = Older_messages · CallMessage CM · Younger_messages
(CM.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ CM.queue)
S.canisters[CM.callee] ≠ EmptyCanister
S.canister_status[CM.callee] = Running
liquid_balance(S, CM.callee) ≥ MAX_CYCLES_PER_MESSAGE
Ctxt_id ∉ dom(S.call_contexts)

```

State after  

```html

S with
    messages =
      Older_messages ·
      FuncMessage {
        call_context = Ctxt_id;
        caller = CM.caller;
        caller_info_data = CM.caller_info_data;
        caller_info_signer = CM.caller_info_signer;
        receiver = CM.callee;
        entry_point = PublicMethod CM.method_name CM.caller CM.arg;
        queue = CM.queue;
      } ·
      Younger_messages
    call_contexts[Ctxt_id] = {
      canister = CM.callee;
      origin = CM.origin;
      needs_to_respond = true;
      deleted = false;
      available_cycles = CM.transferred_cycles;
    }
    balances[CM.callee] = S.balances[CM.callee] - MAX_CYCLES_PER_MESSAGE

```

*Call context creation: Heartbeat*

If canister `C` exports a method with name `canister_heartbeat`, the IC will create the corresponding call context.

Conditions  

```html

S.canisters[C] ≠ EmptyCanister
S.canister_status[C] = Running
liquid_balance(S, C) ≥ MAX_CYCLES_PER_MESSAGE
Ctxt_id ∉ dom(S.call_contexts)

```

State after  

```html

S with
    messages =
      FuncMessage {
        call_context = Ctxt_id;
        caller = ic_principal;
        caller_info_data = "";
        caller_info_signer = "";
        receiver = C;
        entry_point = Heartbeat;
        queue = Queue { from = System; to = C };
      }
      · S.messages
    call_contexts[Ctxt_id] = {
      canister = C;
      origin = FromSystemTask;
      needs_to_respond = false;
      deleted = false;
      available_cycles = 0;
    }
    balances[C] = S.balances[C] - MAX_CYCLES_PER_MESSAGE

```

*Call context creation: Global timer*

If canister `C` exports a method with name `canister_global_timer`, the global timer of canister `C` is set, and the current time for canister `C` has passed the value of the global timer, the IC will create the corresponding call context and deactivate the global timer.

Conditions  

```html

S.canisters[C] ≠ EmptyCanister
S.canister_status[C] = Running
S.global_timer[C] ≠ 0
S.time[C] ≥ S.global_timer[C]
liquid_balance(S, C) ≥ MAX_CYCLES_PER_MESSAGE
Ctxt_id ∉ dom(S.call_contexts)

```

State after  

```html

S with
    messages =
      FuncMessage {
        call_context = Ctxt_id;
        caller = ic_principal;
        caller_info_data = "";
        caller_info_signer = "";
        receiver = C;
        entry_point = GlobalTimer;
        queue = Queue { from = System; to = C };
      }
      · S.messages
    call_contexts[Ctxt_id] = {
      canister = C;
      origin = FromSystemTask;
      needs_to_respond = false;
      deleted = false;
      available_cycles = 0;
    }
    global_timer[C] = 0
    balances[C] = S.balances[C] - MAX_CYCLES_PER_MESSAGE

```

*Call context creation: On low wasm memory*

If `S.on_low_wasm_memory_hook_status[C]` is `Ready` for a canister `C`, the IC will create the corresponding call context and set `S.on_low_wasm_memory_hook_status[C]` to `Executed`.

Conditions

```html

S.canisters[C] ≠ EmptyCanister
S.canister_status[C] = Running
S.on_low_wasm_memory_hook_status[C] = Ready
liquid_balance(S, C) ≥ MAX_CYCLES_PER_MESSAGE
Ctxt_id ∉ dom(S.call_contexts)

```

State after

```html

S with
    messages =
      FuncMessage {
        call_context = Ctxt_id;
        caller = ic_principal;
        caller_info_data = "";
        caller_info_signer = "";
        receiver = C;
        entry_point = OnLowWasmMemory;
        queue = Queue { from = System; to = C };
      }
      · S.messages
    call_contexts[Ctxt_id] = {
      canister = C;
      origin = FromSystemTask;
      needs_to_respond = false;
      deleted = false;
      available_cycles = 0;
    }
    on_low_wasm_memory_hook_status[C] = Executed
    balances[C] = S.balances[C] - MAX_CYCLES_PER_MESSAGE

```

The IC can execute any message that is at the head of its queue, i.e. there is no older message with the same abstract `queue` field. The actual message execution, if successful, may enqueue further messages and --- if the function returns a response --- record this response. The new call and response messages are enqueued at the end.

Note that new messages are executed only if the canister is Running and is not frozen.

#### Scheduling on low wasm memory hook {#rule-on-low-wasm-memory}

This transition is executed immediately after [Message execution](#rule-message-execution) and IC Management Canister execution (update call).

Conditions

```html
if S.wasm_memory_limit[C] < |S.canisters[C].wasm_state.wasm_memory| + S.wasm_memory_threshold[C]:
  if S.on_low_wasm_memory_hook_status[C] = ConditionNotSatisfied:
    On_low_wasm_memory_hook_status = Ready
  else:
    On_low_wasm_memory_hook_status = S.on_low_wasm_memory_hook_status[C]
else:
  On_low_wasm_memory_hook_status = ConditionNotSatisfied
```

State after

```html
S with
  on_low_wasm_memory_hook_status[C] = On_low_wasm_memory_hook_status
```

#### Message execution {#rule-message-execution}

The transition models the actual execution of a message, whether it is an initial call to a public method or a response. In either case, a call context already exists (see transition "Call context creation").

For convenience, we first define a function that extracts the deadline from a call context. Note that user and system messages have no deadline.

```html

deadline_of_context(ctxt) = match ctxt.origin with
    FromCanister O if O.deadline ≠ Expired _ → O.deadline
    FromCanister O if O.deadline = Expired ts → ts
    otherwise → NoDeadline

```

Conditions  

```html

S.messages = Older_messages · FuncMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
(∀ FuncMessage M' ∈ Older_messages · Younger_messages. M'.receiver ≠ M.receiver or M.entry_point ≠ OnLowWasmMemory)
S.on_low_wasm_memory_hook_status[M.receiver] ≠ Ready
S.canisters[M.receiver] ≠ EmptyCanister
Mod = S.canisters[M.receiver].module
Ctxt = S.call_contexts[M.call_context]
Deadline = deadline_of_context(Ctxt)

Is_response = M.entry_point == Callback _ _ _

Env = {
  time = S.time[M.receiver];
  controllers = S.controllers[M.receiver];
  global_timer = S.global_timer[M.receiver];
  balance = S.balances[M.receiver]
  reserved_balance = S.reserved_balances[M.receiver];
  reserved_balance_limit = S.reserved_balance_limits[M.receiver];
  compute_allocation = S.compute_allocation[M.receiver];
  memory_allocation = S.memory_allocation[M.receiver];
  memory_usage_raw_module = memory_usage_raw_module(S.canisters[M.receiver].raw_module);
  memory_usage_canister_history = memory_usage_canister_history(S.canister_history[M.receiver]);
  memory_usage_chunk_store = memory_usage_chunk_store(S.chunk_store[M.receiver]);
  memory_usage_snapshots = memory_usage_snapshots(S.snapshots[M.receiver]);
  freezing_threshold = S.freezing_threshold[M.receiver];
  subnet_id = S.canister_subnet[M.receiver].subnet_id;
  subnet_size = S.canister_subnet[M.receiver].subnet_size;
  certificate = NoCertificate;
  status = simple_status(S.canister_status[M.receiver]);
  canister_version = S.canister_version[M.receiver];
}

Available = Ctxt.available_cycles
( M.entry_point = PublicMethod Name Caller Arg
  F = Mod.update_methods[Name](Arg, M.caller, M.caller_info_data, M.caller_info_signer, Deadline, Env, Available)
  New_canister_version = S.canister_version[M.receiver] + 1
  Wasm_memory_limit = S.wasm_memory_limit[M.receiver]
)
or
( M.entry_point = PublicMethod Name Caller Arg
  F = query_as_update(Mod.query_methods[Name], Arg, M.caller, M.caller_info_data, M.caller_info_signer, Env, Available)
  New_canister_version = S.canister_version[M.receiver]
  Wasm_memory_limit = 0
)
or
( M.entry_point = Callback Callback Response RefundedCycles
  F = Mod.callbacks(Callback, M.caller, M.caller_info_data, M.caller_info_signer, Response, Deadline, RefundedCycles, Env, Available)
  New_canister_version = S.canister_version[M.receiver] + 1
  Wasm_memory_limit = 0
)
or
( M.entry_point = Heartbeat
  F = system_task_as_update(Mod.heartbeat, Env)
  New_canister_version = S.canister_version[M.receiver] + 1
  Wasm_memory_limit = 0
)
or
( M.entry_point = GlobalTimer
  F = system_task_as_update(Mod.global_timer, Env)
  New_canister_version = S.canister_version[M.receiver] + 1
  Wasm_memory_limit = 0
)
or
( M.entry_point = OnLowWasmMemory
  F = system_task_as_update(Mod.on_low_wasm_memory, Env)
  New_canister_version = S.canister_version[M.receiver] + 1
  Wasm_memory_limit = 0
)

R = F(S.canisters[M.receiver].wasm_state)

```

State after  

```html

if
  R = Return res
  validate_sender_canister_version(res.new_calls, S.canister_version[M.receiver])
  res.cycles_used ≤ (if Is_response then MAX_CYCLES_PER_RESPONSE else MAX_CYCLES_PER_MESSAGE)
  res.cycles_accepted ≤ Available
  (res.cycles_used + ∑ [ MAX_CYCLES_PER_RESPONSE + call.transferred_cycles | call ∈ res.new_calls ]) ≤
    (S.balances[M.receiver] + res.cycles_accepted + (if Is_response then MAX_CYCLES_PER_RESPONSE else MAX_CYCLES_PER_MESSAGE))
  Cycles_reserved = cycles_to_reserve(S, A.canister_id, S.compute_allocation[A.canister_id], S.memory_allocation[A.canister_id], S.snapshots[A.canister_id], New_state)
  New_balance =
      (S.balances[M.receiver] + res.cycles_accepted + (if Is_response then MAX_CYCLES_PER_RESPONSE else MAX_CYCLES_PER_MESSAGE))
      - (res.cycles_used + ∑ [ MAX_CYCLES_PER_RESPONSE + call.transferred_cycles | call ∈ res.new_calls ])
      - Cycles_reserved
  New_reserved_balance = S.reserved_balances[M.receiver] + Cycles_reserved
  Min_balance = if Is_response then 0 else freezing_limit(
    S.compute_allocation[M.receiver],
    S.memory_allocation[M.receiver],
    S.freezing_threshold[M.receiver],
    memory_usage_wasm_state(res.new_state) +
      memory_usage_raw_module(S.canisters[M.receiver].raw_module) +
      memory_usage_canister_history(S.canister_history[M.receiver]) +
      memory_usage_chunk_store(S.chunk_store[M.receiver]) +
      memory_usage_snapshots(S.snapshots[M.receiver]),
    S.canister_subnet[M.receiver].subnet_size,
  )
  New_reserved_balance ≤ S.reserved_balance_limits[M.receiver]
  liquid_balance(
    New_balance,
    New_reserved_balance,
    Min_balance
  ) ≥ 0
  (Wasm_memory_limit = 0) or |res.new_state.wasm_memory| <= Wasm_memory_limit
  (res.response = NoResponse) or Ctxt.needs_to_respond
then
  S with
    canisters[M.receiver].wasm_state = res.new_state;
    canister_version[M.receiver] = New_canister_version;
    messages =
      Older_messages ·
      Younger_messages ·
      [ CallMessage {
          origin = FromCanister {
            call_context = M.call_context;
            callback = call.callback;
            deadline = if call.timeout_seconds ≠ NoTimeout
                        then S.time[M.receiver] + call.timeout_seconds * 10^9
                        else NoDeadline

          };
          caller = M.receiver;
          caller_info_data = "";
          caller_info_signer = "";
          callee = call.callee;
          method_name = call.method_name;
          arg = call.arg;
          transferred_cycles = call.transferred_cycles
          queue = Queue { from = M.receiver; to = call.callee };
        }
      | call ∈ res.new_calls ] ·
      [ ResponseMessage {
          origin = Ctxt.origin;
          response = res.response;
          refunded_cycles = Available - res.cycles_accepted;
        }
      | res.response ≠ NoResponse ]

    if res.response = NoResponse:
       call_contexts[M.call_context].available_cycles = Available - res.cycles_accepted
    else
       call_contexts[M.call_context].needs_to_respond = false
       call_contexts[M.call_context].available_cycles = 0

    if res.new_certified_data ≠ NoCertifiedData:
      certified_data[M.receiver] = res.new_certified_data

    if res.new_global_timer ≠ NoGlobalTimer:
      global_timer[M.receiver] = res.new_global_timer

    balances[M.receiver] = New_balance
    reserved_balances[M.receiver] = New_reserved_balance

    canister_logs[M.receiver] = S.canister_logs[M.receiver] · canister_logs
else
  S with
    messages = Older_messages · Younger_messages
    balances[M.receiver] =
      (S.balances[M.receiver] + (if Is_response then MAX_CYCLES_PER_RESPONSE else MAX_CYCLES_PER_MESSAGE))
      - min (R.cycles_used, (if Is_response then MAX_CYCLES_PER_RESPONSE else MAX_CYCLES_PER_MESSAGE))

```

Depending on whether this is a call message and a response messages, we have either set aside `MAX_CYCLES_PER_MESSAGE` or `MAX_CYCLES_PER_RESPONSE`, either in the call context creation rule or the Callback invocation rule.

The cycle consumption of executing this message is modeled via the unspecified `cycles_used` variable; the variable takes some value between 0 and `MAX_CYCLES_PER_MESSAGE`/`MAX_CYCLES_PER_RESPONSE` (for call execution and response execution, respectively).

The logs produced by the canister during message execution are modeled via the unspecified `canister_logs` variable; the variable stores a list of logs (each of type `CanisterLog`) with consecutive sequence numbers, timestamps equal to `S.time[M.receiver]`, and contents produced by the canister calling `ic0.debug_print`, `ic0.trap`, or produced by the WebAssembly runtime when the canister WebAssembly module traps.

This transition detects certain behavior that will appear as a trap (and which an implementation may implement by trapping directly in a system call):

-   Responding if the present call context does not need to be responded to

-   Accepting more cycles than are available on the call context

-   Sending out more cycles than available to the canister

-   Consuming more cycles than allowed (and reserved)

If message execution [*traps* (in the sense of a Wasm function)](./canister-interface.md#system-api-module), the message gets dropped. No response is generated (as some other message may still fulfill this calling context). Any state mutation is discarded. If the message was a call, the associated cycles are held by its associated call context and will be refunded to the caller, see [Call context starvation](#rule-starvation).

If message execution [*returns* (in the sense of a Wasm function)](./canister-interface.md#system-api-module), the state is updated and possible outbound calls and responses are enqueued.

Note that returning does *not* imply that the call associated with this message now *succeeds* in the sense defined in [section responding](./canister-interface.md#responding); that would require a (unique) call to `ic0.reply`. Note also that the state changes are persisted even when the IC is set to synthesize a [CANISTER\_ERROR](./https-interface.md#reject-codes) reject immediately afterward (which happens when this returns without calling `ic0.reply` or `ic0.reject`, the corresponding call has not been responded to and there are no outstanding callbacks, see [Call context starvation](#rule-starvation)).

The function `validate_sender_canister_version` checks that `sender_canister_version` matches the actual canister version of the sender in all calls to the methods of the management canister that take `sender_canister_version`:
```
validate_sender_canister_version(new_calls, canister_version_from_system) =
  ∀ call ∈ new_calls. (call.callee = ic_principal and (call.method = 'create_canister' or call.method = 'update_settings' or call.method = 'install_code' or call.method = `install_chunked_code` or call.method = 'uninstall_code' or call.method = 'provisional_create_canister_with_cycles') and call.arg = candid(A) and A.sender_canister_version = n) => n = canister_version_from_system
```

The functions `query_as_update` and `system_task_as_update` turns a query function (note that composite query methods cannot be called when executing a message during this transition) resp the heartbeat or global timer into an update function; this is merely a notational trick to simplify the rule:
```
query_as_update(f, arg, caller, caller_info_data, caller_info_signer, env, available) = λ wasm_state →
  match f(arg, caller, caller_info_data, caller_info_signer, env, available)(wasm_state) with
    Trap trap → Trap trap
    Return res → Return {
      new_state = wasm_state;
      new_calls = [];
      new_certified_data = NoCertifiedData;
      new_global_timer = NoGlobalTimer;
      response = res.response;
      cycles_accepted = res.cycles_accepted;
      cycles_used = res.cycles_used;
    }
    
system_task_as_update(f, env) = λ wasm_state →
  match f(env)(wasm_state) with
    Trap trap → Trap trap
    Return res → Return {
      new_state = res.new_state;
      new_calls = res.new_calls;
      new_certified_data = res.new_certified_data;
      new_global_timer = res.new_global_timer;
      response = NoResponse;
      cycles_accepted = 0;
      cycles_used = res.cycles_used;
    }
```

Note that by construction, a query function will either trap or return with a response; it will never send calls, and it will never change the state of the canister.

#### Spontaneous request rejection {#request-rejection}

The system can reject a request at any point in time, e.g., because it is overloaded.

Condition:
```html
S.messages = Older_messages · CallMessage CM · Younger_messages
```

State after, with `reject_code` being an arbitrary reject code:
```html
S.messages =
    Older_messages
    · Younger_messages
    · ResponseMessage {
        origin = CM.origin;
        response = Reject (reject_code, <implementation-specific>);
        refunded_cycles = CM.transferred_cycles;
      }
```

#### Call expiry {#call-expiry}

These transitions expire bounded-wait calls. The transition can be taken before the specified call deadline (e.g., due to high system load), and we thus ignore the caller time in these transitions. We define two variants of the transition, one that expires messages, and one that expires calls that are in progress (i.e., have open downstream call contexts).

The first transition defines the expiry of messages.

Condition:

```html
S.messages = Older_messages · M · Younger_messages
M = CallMessage _ ∨ M = ResponseMessage _
M.origin = FromCanister O
O.deadline = timestamp
```

State after:

```html
S.messages = Older_messages · (M with origin = FromCanister O with deadline = Expired timestamp) · Younger_messages ·
    ResponseMessage {
        origin = FromCanister O with deadline = NoDeadline;
        response = Reject (SYS_UNKNOWN, <implementation-specific>);
        refunded_cycles = 0;
    }
```

The next two transitions define the expiry of calls that are being processed by the callee. The first transition deals with regular calls.

Condition:

```html
ctxt_id ∈ S.call_contexts
S.call_contexts[ctxt_id].origin = FromCanister O
S.call_contexts[ctxt_id].needs_to_respond = true
O.deadline = timestamp
```

State after:

```html
S.call_contexts[ctxt_id].origin = FromCanister O with deadline = Expired timestamp
S.messages = S.messages · ResponseMessage {
    origin = FromCanister O with deadline = NoDeadline;
    response = Reject (SYS_UNKNOWN, <implementation-specific>);
    refunded_cycles = 0;
}
```

The second transition deals with the special case of a call that's trying to stop the `target_canister`

Condition:

```html
S.canister_status[target_canister] = Stopping (prefix · (FromCanister O, stop_ts) · suffix)
O.deadline = timestamp
```

State after:

```html
S.canister_status[target_canister] =
    Stopping (prefix · (FromCanister O with deadline = Expired timestamp, stop_ts) · suffix)
S.messages = S.messages · ResponseMessage {
    origin = FromCanister O with deadline = NoDeadline;
    response = Reject (SYS_UNKNOWN, <implementation-specific>);
    refunded_cycles = 0;
}
```

#### Call context starvation {#rule-starvation}

If the call context needs to respond (in particular, if the call context is not for a system task) and there is no call, downstream call context, or response that references a call context, then a reject is synthesized. The error message below is *not* indicative. In particular, if the IC has an idea about *why* this starved, it can put that in there (e.g. the initial message handler trapped with an out-of-memory access).

Conditions  

```html

S.call_contexts[Ctxt_id].needs_to_respond = true
∀ CallMessage {origin = FromCanister O, …} ∈ S.messages. O.calling_context ≠ Ctxt_id ∨ O.deadline = Expired _
∀ ResponseMessage {origin = FromCanister O, …} ∈ S.messages. O.calling_context ≠ Ctxt_id ∨ O.deadline = Expired _
∀ (_ ↦ {needs_to_respond = true, origin = FromCanister O, …}) ∈ S.call_contexts: O.calling_context ≠ Ctxt_id ∨ O.deadline = Expired _
∀ (_ ↦ Stopping Origins) ∈ S.canister_status: ∀(FromCanister O, _) ∈ Origins. O.calling_context ≠ Ctxt_id ∨ O.deadline = Expired _

```

State after  

```html

S with
    call_contexts[Ctxt_id].needs_to_respond = false
    call_contexts[Ctxt_id].available_cycles = 0
    messages =
      S.messages ·
      ResponseMessage {
        origin = S.call_contexts[Ctxt_id].origin;
        response = Reject (CANISTER_ERROR, <implementation-specific>);
        refunded_cycles = S.call_contexts[Ctxt_id].available_cycles;
      }

```

#### Call context removal {#call-context-removal}

If there is no call, downstream call context, or response that references a call context, and the call context does not need to respond (because it has already responded or its origin is a system task that does not await a response), then the call context can be removed.

Conditions  

```html

S.call_contexts[Ctxt_id].needs_to_respond = false
∀ CallMessage {origin = FromCanister O, …} ∈ S.messages. O.calling_context ≠ Ctxt_id ∨ O.deadline = Expired _
∀ ResponseMessage {origin = FromCanister O, …} ∈ S.messages. O.calling_context ≠ Ctxt_id ∨ O.deadline = Expired _
∀ (_ ↦ {needs_to_respond = true, origin = FromCanister O, …}) ∈ S.call_contexts: O.calling_context ≠ Ctxt_id ∨ O.deadline = Expired _
∀ (_ ↦ Stopping Origins) ∈ S.canister_status: ∀(FromCanister O, _) ∈ Origins. O.calling_context ≠ Ctxt_id ∨ O.deadline = Expired _

```

State after  

```html

S with
    call_contexts[Ctxt_id] = (deleted)

```

#### IC Management Canister: Canister creation

The IC chooses an appropriate canister id (referred to as `CanisterId`) and subnet id (referred to as `SubnetId`, `SubnetId ∈ Subnets`, where `Subnets` is the under-specified set of subnet ids on the IC) and instantiates a new (empty) canister identified by `CanisterId` on the subnet identified by `SubnetId` with subnet size denoted by `SubnetSize`. The *controllers* are set such that the sender of this request is the only controller, unless the `settings` say otherwise. All cycles on this call are now the canister's initial cycles.

This is also when the System Time of the new canister starts ticking.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'create_canister'
M.arg = candid(A)
is_system_assigned Canister_id
Canister_id ∉ dom(S.canisters)
SubnetId ∈ Subnets
(A.settings.environment_variables = null or 
  (|A.settings.environment_variables| ≤ MAX_ENV_VAR_COUNT and
   ∀(name, value) ∈ A.settings.environment_variables:
     |name| ≤ MAX_ENV_VAR_NAME_LENGTH and
     |value| ≤ MAX_ENV_VAR_VALUE_LENGTH and
     is_valid_utf8(name) and
     is_valid_utf8(value)))

if A.settings.controllers is not null:
  New_controllers = A.settings.controllers
else:
  New_controllers = [M.caller]

if A.settings.compute_allocation is not null:
  New_compute_allocation = A.settings.compute_allocation
else:
  New_compute_allocation = 0
if A.settings.memory_allocation is not null:
  New_memory_allocation = A.settings.memory_allocation
else:
  New_memory_allocation = 0
if A.settings.freezing_threshold is not null:
  New_freezing_threshold = A.settings.freezing_threshold
else:
  New_freezing_threshold = 2592000
if A.settings.reserved_cycles_limit is not null:
  New_reserved_balance_limit = A.settings.reserved_cycles_limit
else:
  New_reserved_balance_limit = 5_000_000_000_000
if A.settings.wasm_memory_limit is not null:
  New_wasm_memory_limit = A.settings.wasm_memory_limit
else:
  New_wasm_memory_limit = 0
if A.settings.wasm_memory_threshold is not null:
  New_wasm_memory_threshold = A.settings.wasm_memory_threshold
else:
  New_wasm_memory_threshold = 0
if A.settings.environment_variables is not null:
  New_environment_variables = A.settings.environment_variables
else:
  New_environment_variables = []

Cycles_reserved = cycles_to_reserve(S, Canister_id, New_compute_allocation, New_memory_allocation, null, EmptyCanister.wasm_state)
New_balance = M.transferred_cycles - Cycles_reserved
New_reserved_balance = Cycles_reserved
New_reserved_balance <= New_reserved_balance_limit
if New_compute_allocation > 0 or New_memory_allocation > 0 or Cycles_reserved > 0:
  liquid_balance(S', Canister_id) ≥ 0

New_canister_history = {
  total_num_changes = 1
  recent_changes = {
    timestamp_nanos = CurrentTime
    canister_version = 0
    origin = change_origin(M.caller, A.sender_canister_version, M.origin)
    details = Creation {
      controllers = New_controllers
      environment_variables_hash = if A.settings.environment_variables is not null then
        opt hash_of_map(A.settings.environment_variables)
      else
        null
    }
  }
}

if A.settings.log_visibility is not null:
  New_canister_log_visibility = A.settings.log_visibility
else:
  New_canister_log_visibility = Controllers

if A.settings.snapshot_visibility is not null:
  New_canister_snapshot_visibility = A.settings.snapshot_visibility
else:
  New_canister_snapshot_visibility = Controllers
```

State after  

```html

S' = S with
    canisters[Canister_id] = EmptyCanister
    snapshots[A.canister_id] = null
    time[Canister_id] = CurrentTime
    global_timer[Canister_id] = 0
    controllers[Canister_id] = New_controllers
    chunk_store[Canister_id] = ()
    compute_allocation[Canister_id] = New_compute_allocation
    memory_allocation[Canister_id] = New_memory_allocation
    freezing_threshold[Canister_id] = New_freezing_threshold
    balances[Canister_id] = New_balance
    reserved_balances[Canister_id] = New_reserved_balance
    reserved_balance_limits[Canister_id] = New_reserved_balance_limit
    wasm_memory_limit[Canister_id] = New_wasm_memory_limit
    wasm_memory_threshold[Canister_id] = New_wasm_memory_threshold
    environment_variables[Canister_id] = New_environment_variables
    on_low_wasm_memory_hook_status[Canister_id] = ConditionNotSatisfied
    certified_data[Canister_id] = ""
    query_stats[Canister_id] = []
    canister_history[Canister_id] = New_canister_history
    canister_log_visibility[Canister_id] = New_canister_log_visibility
    canister_snapshot_visibility[Canister_id] = New_canister_snapshot_visibility
    canister_logs[Canister_id] = []
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid({canister_id = Canister_id}))
        refunded_cycles = 0
      }
    canister_status[Canister_id] = Running
    canister_version[Canister_id] = 0
    canister_subnet[Canister_id] = Subnet {
      subnet_id : SubnetId
      subnet_size : SubnetSize
    }

```

This uses the predicate
```
is_system_assigned : Principal -> Bool
```
which characterizes all system-assigned ids.

To avoid clashes with potential user ids or is derived from users or canisters, we require (somewhat handwavy) that

-   `is_system_assigned (mk_self_authenticating_id pk) = false` for possible public keys `pk` and

-   `is_system_assigned (mk_derived_id p dn) = false` for any `p` that could be a user id or canister id.

-   `is_system_assigned p = false` for `|p| > 29`.

-   `is_system_assigned ic_principal = false`.

#### IC Management Canister: Changing settings

Only the controllers of the given canister can update the canister settings.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'update_settings'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id]
(A.settings.environment_variables = null or 
  (|A.settings.environment_variables| ≤ MAX_ENV_VAR_COUNT and
   ∀(name, value) ∈ A.settings.environment_variables:
     |name| ≤ MAX_ENV_VAR_NAME_LENGTH and
     |value| ≤ MAX_ENV_VAR_VALUE_LENGTH and
     is_valid_utf8(name) and
     is_valid_utf8(value)))

if New_wasm_memory_limit > 0:
  |S.canisters[A.canister_id].wasm_state.wasm_memory| ≤ New_wasm_memory_limit

if A.settings.compute_allocation is not null:
  New_compute_allocation = A.settings.compute_allocation
else:
  New_compute_allocation = S.compute_allocation[A.canister_id]
if A.settings.memory_allocation is not null:
  New_memory_allocation = A.settings.memory_allocation
else:
  New_memory_allocation = S.memory_allocation[A.canister_id]
if A.settings.freezing_threshold is not null:
  New_freezing_threshold = A.settings.freezing_threshold
else:
  New_freezing_threshold = S.freezing_threshold[A.canister_id]
if A.settings.reserved_cycles_limit is not null:
  New_reserved_balance_limit = A.settings.reserved_cycles_limit
else:
  New_reserved_balance_limit = S.reserved_balance_limits[A.canister_id]
if A.settings.wasm_memory_limit is not null:
  New_wasm_memory_limit = A.settings.wasm_memory_limit
else:
  New_wasm_memory_limit = S.wasm_memory_limit[A.canister_id]
if A.settings.wasm_memory_threshold is not null:
  New_wasm_memory_threshold = A.settings.wasm_memory_threshold
else:
  New_wasm_memory_threshold = S.wasm_memory_threshold[A.canister_id]
if A.settings.environment_variables is not null:
  New_environment_variables = A.settings.environment_variables
else:
  New_environment_variables = S.environment_variables[A.canister_id]

Cycles_reserved = cycles_to_reserve(S, A.canister_id, New_compute_allocation, New_memory_allocation, S.snapshots[A.canister_id], S.canisters[A.canister_id].wasm_state)
New_balance = S.balances[A.canister_id] - Cycles_reserved
New_reserved_balance = S.reserved_balances[A.canister_id] + Cycles_reserved
New_reserved_balance ≤ New_reserved_balance_limit
if New_compute_allocation > S.compute_allocation[A.canister_id] or New_memory_allocation > S.memory_allocation[A.canister_id] or Cycles_reserved > 0:
  liquid_balance(S', A.canister_id) ≥ 0

S.canister_history[A.canister_id] = {
  total_num_changes = N;
  recent_changes = H;
}

if A.settings.controllers is not null:
  New_canister_history = {
    total_num_changes = N + 1;
    recent_changes = H · {
      timestamp_nanos = S.time[A.canister_id];
      canister_version = S.canister_version[A.canister_id] + 1;
      origin = change_origin(M.caller, A.sender_canister_version, M.origin);
      details = ControllersChange {
        controllers = A.settings.controllers;
      };
    };
  }
else:
  New_canister_history = S.canister_history[A.canister_id]

```

State after  

```html

S' = S with
    if A.settings.controllers is not null:
      controllers[A.canister_id] = A.settings.controllers
      canister_history[A.canister_id] = New_canister_history
    compute_allocation[A.canister_id] = New_compute_allocation
    memory_allocation[A.canister_id] = New_memory_allocation
    freezing_threshold[A.canister_id] = New_freezing_threshold
    balances[A.canister_id] = New_balance
    reserved_balances[A.canister_id] = New_reserved_balance
    reserved_balance_limits[A.canister_id] = New_reserved_balance_limit
    wasm_memory_limit[A.canister_id] = New_wasm_memory_limit
    wasm_memory_threshold[A.canister_id] = New_wasm_memory_threshold
    environment_variables[A.canister_id] = New_environment_variables
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    if A.settings.log_visibility is not null:
      canister_log_visibility[A.canister_id] = A.settings.log_visibility
    if A.settings.snapshot_visibility is not null:
      canister_snapshot_visibility[A.canister_id] = A.settings.snapshot_visibility
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid())
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Canister status

The controllers of a canister can obtain detailed information about the canister.

Given a state `S` and `Canister_id`, we define

```html

canister_status(S, Canister_id) =
    {
      status = simple_status(S.canister_status[Canister_id]);
      settings = {
        controllers = S.controllers[Canister_id];
        compute_allocation = S.compute_allocation[Canister_id];
        memory_allocation = S.memory_allocation[Canister_id];
        freezing_threshold = S.freezing_threshold[Canister_id];
        reserved_cycles_limit = S.reserved_balance_limit[Canister_id];
        wasm_memory_limit = S.wasm_memory_limit[Canister_id];
        wasm_memory_threshold = S.wasm_memory_threshold[Canister_id];
        environment_variables = S.environment_variables[Canister_id];
      }
      module_hash =
        if S.canisters[Canister_id] = EmptyCanister
        then null
        else opt (SHA-256(S.canisters[Canister_id].raw_module));
      memory_size = Memory_usage;
      memory_metrics = Memory_metrics;
      cycles = S.balances[Canister_id];
      reserved_cycles = S.reserved_balances[Canister_id]
      idle_cycles_burned_per_day = idle_cycles_burned_rate(
        S.compute_allocation[Canister_id],
        S.memory_allocation[Canister_id],
        memory_usage_wasm_state(S.canisters[Canister_id].wasm_state) +
          memory_usage_raw_module(S.canisters[Canister_id].raw_module) +
          memory_usage_canister_history(S.canister_history[Canister_id]) +
          memory_usage_chunk_store(S.chunk_store[Canister_id]) +
          memory_usage_snapshots(S.snapshots[Canister_id]),
        S.freezing_threshold[Canister_id],
        S.canister_subnet[Canister_id].subnet_size,
      );
      query_stats = noise(SUM {{num_calls_total: 1,
                                num_instructions_total: single_query_stats.num_instructions,
                                request_payload_bytes_total: single_query_stats.request_payload_bytes,
                                response_payload_bytes_total: single_query_stats.response_payload_bytes} |
                               single_query_stats <- S.query_stats[Canister_id];
                               single_query_stats.timestamp <= S.time[Canister_id] - T})
    }

```

where
- `Memory_usage` is the (in this specification underspecified) total canister memory usage in bytes;
- `Memory_metrics` are the (in this specification underspecified) detailed metrics on the memory consumption of the canister (see [Memory Metrics](./management-canister.md#ic-canister_status-memory_metrics) for more details);
- `T` is an (in this specification underspecified) time delay of query statistics and `noise` is an (in this specification underspecified) probabilistic function
modelling information loss due to aggregating query statistics in a distributed system.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'canister_status'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id] ∪ {A.canister_id} ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]

```

State after  

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = candid(canister_status(S, A.canister_id))
        refunded_cycles = M.transferred_cycles
      }

```

The IC method `canister_status` can also be invoked via management canister query calls.
They are calls to `/api/v3/canister/<ECID>/query`
with CBOR content `Q` such that `Q.canister_id = ic_principal`.

Submitted request to `/api/v3/canister/<ECID>/query`

```html

E : Envelope

```

Conditions

```html

E.content = CanisterQuery Q
Q.canister_id = ic_principal
Q.method_name = 'canister_status'
|Q.nonce| <= 32
is_effective_canister_id(E.content, ECID)
S.system_time <= Q.ingress_expiry or Q.sender = anonymous_id
Q.arg = candid(A)
A.canister_id ∈ verify_envelope(E, Q.sender, S.system_time)
if E.sender_pubkey = canister_signature_pk Signing_canister_id Seed:
  if not (Q.sender_info = null):
    verify_signature E.sender_pubkey Q.sender_info.sig ("\x0Eic-sender-info" · Q.sender_info.info)
    Q.sender_info.signer = Signing_canister_id
else:
  Q.sender_info = null
Q.sender ∈ S.controllers[A.canister_id] ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]

```

Query response `R`:

```html

{status: "replied"; reply: {arg: candid(canister_status(S, A.canister_id))}, signatures: Sigs}

```

where the query `Q`, the response `R`, and a certificate `Cert` that is obtained by requesting the path `/subnet` in a **separate** read state request to `/api/v3/canister/<ECID>/read_state` satisfy the following:

```html

verify_response(Q, R, Cert) ∧ lookup(["time"], Cert) = Found S.system_time // or "recent enough"

```

#### IC Management Canister: Canister information

Every canister can retrieve the canister history, current module hash, and current controllers of every other canister (including itself).

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'canister_info'
M.arg = candid(A)
if A.num_requested_changes = null then From = |S.canister_history[A.canister_id].recent_changes|
else From = max(0, |S.canister_history[A.canister_id].recent_changes| - A.num_requested_changes)
End = |S.canister_history[A.canister_id].recent_changes| - 1

```

State after  

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = candid({
          total_num_changes = S.canister_history[A.canister_id].total_num_changes;
          recent_changes = S.canister_history[A.canister_id].recent_changes[From..End];
          module_hash =
            if S.canisters[A.canister_id] = EmptyCanister
            then null
            else opt (SHA-256(S.canisters[A.canister_id].raw_module));
          controllers = S.controllers[A.canister_id];
        })
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Canister metadata

Every canister can retrieve public metadata of every other canister (including itself)
and private metadata of canisters controlled by the caller.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'canister_metadata'
M.arg = candid(A)
A.name ∈ dom(S.canisters[A.canister_id].public_custom_sections) ∨ (A.name ∈ dom(S.canisters[A.canister_id].private_custom_sections) ∧ M.caller ∈ S.controllers[A.canister_id])
if A.name ∈ dom(S.canisters[A.canister_id].public_custom_sections):
  Content = S.canisters[A.canister_id].public_custom_sections[A.name]
else:
  Content = S.canisters[A.canister_id].private_custom_sections[A.name]

```

State after  

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = candid({
          value = Content;
        })
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Upload Chunk

A controller of a canister, or the canister itself can upload chunks to the chunk store of that canister.

Conditions

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'upload_chunk'
M.arg = candid(A)
|dom(S.chunk_store[A.canister_id]) ∪ {SHA-256(A.chunk)}| <= CHUNK_STORE_SIZE
M.caller ∈ S.controllers[A.canister_id] ∪ {A.canister_id}


```

State after

```html

S with
    chunk_store[A.canister_id](SHA-256(A.chunk)) = A.chunk
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = candid({hash: hash})
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Clear chunk store

The controller of a canister, or the canister itself can clear the chunk store of that canister.

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'clear_chunk_store'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id] ∪ {A.canister_id}
```

State after

```html

S with
    chunk_store[A.canister_id] = ()
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = candid()
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: List stored chunks

The controller of a canister, or the canister itself can list the hashes of the chunks stored in the chunk store.

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'stored_chunks'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id] ∪ {A.canister_id}

```

State after

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = candid([{hash: hash} | hash <- dom(S.chunk_store[A.canister_id])])
        refunded_cycles = M.transferred_cycles
      }

```




#### IC Management Canister: Code installation

Only the controllers of the given canister can install code. This transition installs new code over a canister. This involves invoking the `canister_init` method (see [Canister initialization](./canister-interface.md#system-api-init)), which must succeed.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'install_code'
M.arg = candid(A)
Mod = parse_wasm_mod(A.wasm_module)
Public_custom_sections = parse_public_custom_sections(A.wasm_module);
Private_custom_sections = parse_private_custom_sections(A.wasm_module);
(A.mode = install and S.canisters[A.canister_id] = EmptyCanister) or A.mode = reinstall
M.caller ∈ S.controllers[A.canister_id]

dom(Mod.update_methods) ∩ dom(Mod.query_methods) = ∅
dom(Mod.update_methods) ∩ dom(Mod.composite_query_methods) = ∅
dom(Mod.query_methods) ∩ dom(Mod.composite_query_methods) = ∅

Env = {
  time = S.time[A.canister_id];
  controllers = S.controllers[A.canister_id];
  global_timer = 0;
  balance = S.balances[A.canister_id];
  reserved_balance = S.reserved_balances[A.canister_id];
  reserved_balance_limit = S.reserved_balance_limits[A.canister_id];
  compute_allocation = S.compute_allocation[A.canister_id];
  memory_allocation = S.memory_allocation[A.canister_id];
  memory_usage_raw_module = memory_usage_raw_module(A.wasm_module);
  memory_usage_canister_history = memory_usage_canister_history(New_canister_history);
  memory_usage_chunk_store = memory_usage_chunk_store(New_chunk_store);
  memory_usage_snapshots = memory_usage_snapshots(S.snapshots[A.canister_id]);
  freezing_threshold = S.freezing_threshold[A.canister_id];
  subnet_id = S.canister_subnet[A.canister_id].subnet_id;
  subnet_size = S.canister_subnet[A.canister_id].subnet_size;
  certificate = NoCertificate;
  status = simple_status(S.canister_status[A.canister_id]);
  canister_version = S.canister_version[A.canister_id] + 1;
}
Mod.init(A.canister_id, A.arg, M.caller, Env) = Return {new_state = New_state; new_certified_data = New_certified_data; new_global_timer = New_global_timer; cycles_used = Cycles_used;}
Cycles_reserved = cycles_to_reserve(S, A.canister_id, S.compute_allocation[A.canister_id], S.memory_allocation[A.canister_id], S.snapshots[A.canister_id], New_state)
New_balance = S.balances[A.canister_id] - Cycles_used - Cycles_reserved
New_reserved_balance = S.reserved_balances[A.canister_id] + Cycles_reserved
New_reserved_balance ≤ S.reserved_balance_limits[A.canister_id]

liquid_balance(S, A.canister_id) ≥ MAX_CYCLES_PER_MESSAGE

liquid_balance(S', A.canister_id) ≥ 0

(S.wasm_memory_limit[A.canister_id] = 0) or |New_state.wasm_memory| <= S.wasm_memory_limit[A.canister_id]

S.canister_history[A.canister_id] = {
  total_num_changes = N;
  recent_changes = H;
}
New_canister_history = {
  total_num_changes = N + 1;
  recent_changes = H · {
    timestamp_nanos = S.time[A.canister_id];
    canister_version = S.canister_version[A.canister_id] + 1
    origin = change_origin(M.caller, A.sender_canister_version, M.origin);
    details = CodeDeployment {
      mode = A.mode;
      module_hash = SHA-256(A.wasm_module);
    };
  };
}

```

State after  

```html

S' = S with
    canisters[A.canister_id] = {
      wasm_state = New_state;
      module = Mod;
      raw_module = A.wasm_module;
      public_custom_sections = Public_custom_sections;
      private_custom_sections = Private_custom_sections;
    }
    certified_data[A.canister_id] = New_certified_data
    if New_global_timer ≠ NoGlobalTimer:
      global_timer[A.canister_id] = New_global_timer
    else:
      global_timer[A.canister_id] = 0
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    balances[A.canister_id] = New_balance
    reserved_balances[A.canister_id] = New_reserved_balance
    canister_history[A.canister_id] = New_canister_history
    canister_logs[A.canister_id] = New_canister_logs
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin;
        response = Reply (candid());
        refunded_cycles = M.transferred_cycles;
      }

```

The logs produced by the canister during the execution of the WebAssembly `start` and `canister_init` functions are modeled via the unspecified `New_canister_logs` variable; the variable stores a list of logs (each of type `CanisterLog`) with consecutive sequence numbers, timestamps equal to `S.time[A.canister_id]`, and contents produced by the canister calling `ic0.debug_print`, `ic0.trap`, or produced by the WebAssembly runtime when the canister WebAssembly module traps.

#### IC Management Canister: Code upgrade

Only the controllers of the given canister can install new code. This changes the code of an *existing* canister, preserving the state in the stable memory. This involves invoking the `canister_pre_upgrade` method, if the `skip_pre_upgrade` flag is not set to `opt true`, on the old and `canister_post_upgrade` method on the new canister, which must succeed and must not invoke other methods. If the `wasm_memory_persistence` flag is set to `opt keep`, then the WebAssembly memory is preserved.

If the old canister module exports a private custom section with the name "enhanced-orthogonal-persistence", then the `wasm_memory_persistence` option must be set to `opt keep` or `opt replace`, i.e., the option must not be `null`.

If the `wasm_memory_persistence` option is set to `opt keep`, then the new canister module must export a private custom section with the name "enhanced-orthogonal-persistence".

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'install_code'
M.arg = candid(A)
Mod = parse_wasm_mod(A.wasm_module)
Public_custom_sections = parse_public_custom_sections(A.wasm_module)
Private_custom_sections = parse_private_custom_sections(A.wasm_module)
M.caller ∈ S.controllers[A.canister_id]
S.canisters[A.canister_id] = { wasm_state = Old_state; module = Old_module, …}

dom(Mod.update_methods) ∩ dom(Mod.query_methods) = ∅
dom(Mod.update_methods) ∩ dom(Mod.composite_query_methods) = ∅
dom(Mod.query_methods) ∩ dom(Mod.composite_query_methods) = ∅

Env = {
  time = S.time[A.canister_id];
  controllers = S.controllers[A.canister_id];
  global_timer = S.global_timer[A.canister_id];
  balance = S.balances[A.canister_id];
  reserved_balance = S.reserved_balances[A.canister_id];
  reserved_balance_limit = S.reserved_balance_limits[A.canister_id];
  compute_allocation = S.compute_allocation[A.canister_id];
  memory_allocation = S.memory_allocation[A.canister_id];
  memory_usage_raw_module = memory_usage_raw_module(S.canisters[A.canister_id].raw_module);
  memory_usage_canister_history = memory_usage_canister_history(S.canister_history[A.canister_id]);
  memory_usage_chunk_store = memory_usage_chunk_store(S.chunk_store[A.canister_id]);
  memory_usage_snapshots = memory_usage_snapshots(S.snapshots[A.canister_id]);
  freezing_threshold = S.freezing_threshold[A.canister_id];
  subnet_id = S.canister_subnet[A.canister_id].subnet_id;
  subnet_size = S.canister_subnet[A.canister_id].subnet_size;
  certificate = NoCertificate;
  status = simple_status(S.canister_status[A.canister_id]);
  canister_version = S.canister_version[A.canister_id];
}

(
  (A.mode = upgrade U and U.skip_pre_upgrade ≠ true)
  Env1 = Env with {
    global_timer = S.global_timer[A.canister_id];
    canister_version = S.canister_version[A.canister_id];
  }
  Old_module.pre_upgrade(Old_State, M.caller, Env1) = Return {new_state = Intermediate_state; new_certified_data = New_certified_data; cycles_used = Cycles_used;}
)
or
(
  (A.mode = upgrade U and U.skip_pre_upgrade = true)
  Intermediate_state = Old_state
  New_certified_data = NoCertifiedData
  Cycles_used = 0
)

(
  (A.mode = upgrade U and U.wasm_memory_persistence ≠ keep)
  Persisted_state = {
    wasm_memory = "";
    stable_memory = Intermediate_state.stable_memory;
    globals = Mod.initial_globals;
    self_id = A.canister_id;
  }
)
or
(
  (A.mode = upgrade U and U.wasm_memory_persistence = keep)
  Persisted_state = {
    wasm_memory = Intermediate_state.wasm_memory;
    stable_memory = Intermediate_state.stable_memory;
    globals = Mod.initial_globals;
    self_id = A.canister_id;
  }
)

(A.mode = upgrade U and U.wasm_memory_persistence = keep)
or
(A.mode = upgrade U and U.wasm_memory_persistence = replace)
or
(S.canisters[A.canister_id].private_custom_sections["enhanced-orthogonal-persistence"] = null)

not (A.mode = upgrade U and U.wasm_memory_persistence = keep and Private_custom_sections["enhanced-orthogonal-persistence"] = null)

Env2 = Env with {
  memory_usage_raw_module = memory_usage_raw_module(A.wasm_module);
  memory_usage_canister_history = memory_usage_canister_history(New_canister_history);
  global_timer = 0;
  canister_version = S.canister_version[A.canister_id] + 1;
}

Mod.post_upgrade(Persisted_state, A.arg, M.caller, Env2) = Return {new_state = New_state; new_certified_data = New_certified_data'; new_global_timer = New_global_timer; cycles_used = Cycles_used';}

Cycles_reserved = cycles_to_reserve(S, A.canister_id, S.compute_allocation[A.canister_id], S.memory_allocation[A.canister_id], S.snapshots[A.canister_id], New_state)
New_balance = S.balances[A.canister_id] - Cycles_used - Cycles_used' - Cycles_reserved
New_reserved_balance = S.reserved_balances[A.canister_id] + Cycles_reserved
New_reserved_balance ≤ S.reserved_balance_limits[A.canister_id]

liquid_balance(S, A.canister_id) ≥ MAX_CYCLES_PER_MESSAGE

liquid_balance(S', A.canister_id) ≥ 0

(S.wasm_memory_limit[A.canister_id] = 0) or |New_state.wasm_memory| <= S.wasm_memory_limit[A.canister_id]

S.canister_history[A.canister_id] = {
  total_num_changes = N;
  recent_changes = H;
}
New_canister_history = {
  total_num_changes = N + 1;
  recent_changes = H · {
    timestamp_nanos = S.time[A.canister_id];
    canister_version = S.canister_version[A.canister_id] + 1
    origin = change_origin(M.caller, A.sender_canister_version, M.origin);
    details = CodeDeployment {
      mode = Upgrade;
      module_hash = SHA-256(A.wasm_module);
    };
  };
}
```

State after  

```html

S' = S with
    canisters[A.canister_id] = {
      wasm_state = New_state;
      module = Mod;
      raw_module = A.wasm_module;
      public_custom_sections = Public_custom_sections;
      private_custom_sections = Private_custom_sections;
    }
    if New_certified_data' ≠ NoCertifiedData:
      certified_data[A.canister_id] = New_certified_data'
    else if New_certified_data ≠ NoCertifiedData:
      certified_data[A.canister_id] = New_certified_data
    if New_global_timer ≠ NoGlobalTimer:
      global_timer[A.canister_id] = New_global_timer
    else:
      global_timer[A.canister_id] = 0
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    balances[A.canister_id] = New_balance;
    reserved_balances[A.canister_id] = New_reserved_balance;
    canister_history[A.canister_id] = New_canister_history
    canister_logs[A.canister_id] = S.canister_logs[A.canister_id] · canister_logs
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin;
        response = Reply (candid());
        refunded_cycles = M.transferred_cycles;
      }

```

The logs produced by the canister during the execution of the WebAssembly `canister_pre_upgrade`, `start`, and `canister_post_upgrade` functions are modeled via the unspecified `canister_logs` variable; the variable stores a list of logs (each of type `CanisterLog`) with consecutive sequence numbers, timestamps equal to `S.time[A.canister_id]`, and contents produced by the canister calling `ic0.debug_print`, `ic0.trap`, or produced by the WebAssembly runtime when the canister WebAssembly module traps.

#### IC Management Canister: Install chunked code

Conditions

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'install_chunked_code'
M.arg = candid(A)
if A.store_canister = null then
  store_canister = A.target_canister
else
  store_canister = A.store_canister
M.caller ∈ S.controllers[A.target_canister]
M.caller ∈ S.controllers[store_canister] ∪ {store_canister}
S.canister_subnet[A.target_canister] = S.canister_subnet[strorage_canister]
∀ h ∈ A.chunk_hashes_list. h ∈ dom(S.chunk_store[store_canister])
A.chunk_hashes_list = [h1,h2,...,hk]
wasm_module = S.chunk_store[store_canister][h1] || ... || S.chunk_store[store_canister][hk]
A.wasm_module_hash = SHA-256(wasm_module)
M' = M with
    method_name = 'install_code'
    arg = candid(record {A.mode; A.target_canister; wasm_module; A.arg; A.sender_canister_version})

```

State after

```html

S with
    messages = Older_messages · CallMessage M' · Younger_messages

```

#### IC Management Canister: Code uninstallation {#rule-uninstall}

Upon uninstallation, the canister is reverted to an empty canister, and all outstanding call contexts are rejected and marked as deleted.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'uninstall_code'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id] ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]
S.canister_history[A.canister_id] = {
  total_num_changes = N;
  recent_changes = H;
}

```

State after  

```html

S with
    canisters[A.canister_id] = EmptyCanister
    certified_data[A.canister_id] = ""
    chunk_store = ()
    canister_history[A.canister_id] = {
      total_num_changes = N + 1;
      recent_changes = H · {
          timestamp_nanos = S.time[A.canister_id];
          canister_version = S.canister_version[A.canister_id] + 1
          origin = change_origin(M.caller, A.sender_canister_version, M.origin);
          details = CodeUninstall;
        };
    }
    canister_logs[A.canister_id] = []
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    global_timer[A.canister_id] = 0

    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid())
        refunded_cycles = M.transferred_cycles
      } ·
      [ ResponseMessage {
          origin = Ctxt.origin
          response = Reject (CANISTER_REJECT, <implementation-specific>)
          refunded_cycles = Ctxt.available_cycles
        }
      | Ctxt_id ↦ Ctxt ∈ S.call_contexts
      , Ctxt.canister = A.canister_id
      , Ctxt.needs_to_respond = true
      ]

      for Ctxt_id ↦ Ctxt ∈ S.call_contexts:
        if Ctxt.canister = A.canister_id:
          call_contexts[Ctxt_id].deleted := true
          call_contexts[Ctxt_id].needs_to_respond := false
          call_contexts[Ctxt_id].available_cycles := 0

```

#### IC Management Canister: Stopping a canister

The controllers of a canister can stop a canister. Stopping a canister goes through two steps. First, the status of the canister is set to `Stopping`; as explained above, a stopping canister rejects all incoming requests and continues processing outstanding responses. When a stopping canister has no more open call contexts, its status is changed to `Stopped` and a response is generated. Note that when processing responses, a stopping canister can make calls to other canisters and thus create new call contexts. In addition, a canister which is stopped or stopping will accept (and respond) to further `stop_canister` requests.

We encode this behavior via three (types of) transitions:

1.  First, any `stop_canister` call sets the state of the canister to `Stopping`; we record in the IC state the origin (and cycles) of all `stop_canister` calls which arrive at the canister while it is stopping (or stopped). Note that every such `stop_canister` call can be rejected by the system at any time (the canister stays stopping in this case), e.g., if the `stop_canister` call could not be responded to for a long time.

2.  Next, when the canister has no open call contexts (so, in particular, all outstanding responses to the canister have been processed), the status of the canister is set to `Stopped`.

3.  Finally, each pending `stop_canister` call (which are encoded in the status) is responded to, to indicate that the canister is stopped.

Conditions

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'stop_canister'
M.arg = candid(A)
S.canister_status[A.canister_id] = Running
M.caller ∈ S.controllers[A.canister_id] ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]

```

State after  

```html

S with
    messages = Older_messages · Younger_messages
    canister_status[A.canister_id] = Stopping [(M.origin, M.transferred_cycles)]
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1

```

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'stop_canister'
M.arg = candid(A)
S.canister_status[A.canister_id] = Stopping Origins
M.caller ∈ S.controllers[A.canister_id] ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]

```

State after  

```html

S with
    messages = Older_messages · Younger_messages
    canister_status[A.canister_id] = Stopping (Origins · [(M.origin, M.transferred_cycles)])
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1

```

The status of a stopping canister which has no open call contexts is set to `Stopped`, and all pending `stop_canister` calls are replied to.

Conditions  

```html

S.canister_status[CanisterId] = Stopping Origins
∀ Ctxt_id. S.call_contexts[Ctxt_id].canister ≠ CanisterId

```

State after  

```html

S with
    canister_status[CanisterId] = Stopped
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    messages = S.Messages ·
        [ ResponseMessage {
            origin = O
            response = Reply (candid())
            refunded_cycles = C
          }
        | (O, C) ∈ Origins
        ]

```

Sending a `stop_canister` message to an already stopped canister is acknowledged (i.e. responded with success) and the canister version is incremented, but is otherwise a no-op:

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'stop_canister'
M.arg = candid(A)
S.canister_status[A.canister_id] = Stopped
M.caller ∈ S.controllers[A.canister_id] ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]

```

State after  

```html

S with
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin;
        response = Reply (candid());
        refunded_cycles = M.transferred_cycles;
      }

```

Pending `stop_canister` calls may be rejected by the system at any time (the canister stays stopping in this case):

Conditions

```html

S.canister_status[CanisterId] = Stopping (Older_origins · (O, C) · Younger_origins)

```

State after

```html

S with
    canister_status[CanisterId] = Stopping (Older_origins · Younger_origins)
    messages = S.Messages ·
      ResponseMessage {
        origin = O
        response = Reject (SYS_TRANSIENT, <implementation-specific>)
        refunded_cycles = C
      }

```

#### IC Management Canister: Starting a canister

The controllers of a canister can start a `stopped` canister. If the canister is already running, the command has no effect on the canister (except for incrementing its canister version).

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'start_canister'
M.arg = candid(A)
S.canister_status[A.canister_id] = Running or S.canister_status[A.canister_id] = Stopped
M.caller ∈ S.controllers[A.canister_id] ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]

```

State after  

```html

S with
    canister_status[A.canister_id] = Running
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    messages = Older_messages · Younger_messages ·
        ResponseMessage{
            origin = M.origin
            response = Reply (candid())
            refunded_cycles = M.transferred_cycles
        }

```

If the status of the canister was 'stopping', then the canister status is set to `running`. The pending `stop_canister` request(s) are rejected.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'start_canister'
M.arg = candid(A)
S.canister_status[A.canister_id] = Stopping Origins
M.caller ∈ S.controllers[A.canister_id] ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]

```

State after  

```html

S with
    canister_status[A.canister_id] = Running
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    messages = Older_messages · Younger_messages ·
        ResponseMessage{
            origin = M.origin
            response = Reply (candid())
            refunded_cycles = M.transferred_cycles
        } ·
        [ ResponseMessage {
            origin = O
            response = Reject (CANISTER_ERROR, <implementation-specific>)
            refunded_cycles = C
          }
        | (O, C) ∈ Origins
        ]

```

#### IC Management Canister: Canister deletion

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'delete_canister'
M.arg = candid(A)
S.canister_status[A.canister_id] = Stopped
M.caller ∈ S.controllers[A.canister_id] ∪ S.subnet_admins[S.canister_subnet[A.canister_id]]

```

State after  

```html

S with
    canisters[A.canister_id] = (deleted)
    snapshots[A.canister_id] = (deleted)
    controllers[A.canister_id] = (deleted)
    compute_allocation[A.canister_id] = (deleted)
    memory_allocation[A.canister_id] = (deleted)
    freezing_threshold[A.canister_id] = (deleted)
    canister_status[A.canister_id] = (deleted)
    canister_version[A.canister_id] = (deleted)
    canister_subnet[A.canister_id] = (deleted)
    time[A.canister_id] = (deleted)
    global_timer[A.canister_id] = (deleted)
    balances[A.canister_id] = (deleted)
    reserved_balances[A.canister_id] = (deleted)
    reserved_balance_limits[A.canister_id] = (deleted)
    wasm_memory_limit[A.canister_id] = (deleted)
    wasm_memory_threshold[A.canister_id] = (deleted)
    on_low_wasm_memory_hook_status[A.canister_id] = (deleted)
    certified_data[A.canister_id] = (deleted)
    canister_history[A.canister_id] = (deleted)
    canister_log_visibility[A.canister_id] = (deleted)
   canister_snapshot_visibility[A.canister_id] = (deleted)
    canister_logs[A.canister_id] = (deleted)
    query_stats[A.canister_id] = (deleted)
    chunk_store[A.canister_id] = (deleted)
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid())
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Depositing cycles

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'deposit_cycles'
M.arg = candid(A)
A.canister_id ∈ dom(S.balances)

```

State after  

```html

S with
    balances[A.canister_id] =
      S.balances[A.canister_id] + M.transferred_cycles
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid())
        refunded_cycles = 0
      }

```

#### IC Management Canister: Random numbers

The management canister can produce pseudo-random bytes. It always returns a 32-byte `blob`:

The precise guarantees around the randomness, e.g. unpredictability, are not captured in this formal semantics.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'raw_rand'
M.arg = candid()
|B| = 32

```

State after  

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid(B))
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Node Metrics

:::note

The node metrics management canister API is considered EXPERIMENTAL. Canister developers must be aware that the API may evolve in a non-backward-compatible way.

:::

The management canister returns metrics for nodes on a given subnet. The definition of the metrics values
is not captured in this formal semantics.

Conditions

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'node_metrics_history'
M.arg = candid(A)
R = <implementation-specific>

```

State after

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid(R))
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Subnet information

The management canister returns subnet metadata given a subnet ID.

Conditions

```html
S.messages = Older_messages · CallMessage M · Younger_messages 
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue) 
M.callee = ic_principal 
M.method_name = 'subnet_info'
R = <implementation-specific> 
```

State after

```html
S with 
    messages = Older_messages · Younger_messages · 
      ResponseMessage { 
        origin = M.origin 
        response = Reply (candid(R)) 
        refunded_cycles = M.transferred_cycles 
      }
```


#### IC Management Canister: Canister creation with cycles

This is a variant of `create_canister`, which sets the initial cycle balance based on the `amount` argument.

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'provisional_create_canister_with_cycles'
M.arg = candid(A)
is_system_assigned Canister_id
Canister_id ∉ dom(S.canisters)
(A.settings.environment_variables = null or 
  (|A.settings.environment_variables| ≤ MAX_ENV_VAR_COUNT and
   ∀(name, value) ∈ A.settings.environment_variables:
     |name| ≤ MAX_ENV_VAR_NAME_LENGTH and
     |value| ≤ MAX_ENV_VAR_VALUE_LENGTH and
     is_valid_utf8(name) and
     is_valid_utf8(value)))

if A.specified_id is not null:
  Canister_id = A.specified_id
if A.settings.controllers is not null:
  New_controllers = A.settings.controllers
else:
  New_controllers = [M.caller]

if A.settings.compute_allocation is not null:
  New_compute_allocation = A.settings.compute_allocation
else:
  New_compute_allocation = 0
if A.settings.memory_allocation is not null:
  New_memory_allocation = A.settings.memory_allocation
else:
  New_memory_allocation = 0
if A.settings.freezing_threshold is not null:
  New_freezing_threshold = A.settings.freezing_threshold
else:
  New_freezing_threshold = 2592000
if A.settings.reserved_cycles_limit is not null:
  New_reserved_balance_limit = A.settings.reserved_cycles_limit
else:
  New_reserved_balance_limit = 5_000_000_000_000
if A.settings.wasm_memory_limit is not null:
  New_wasm_memory_limit = A.settings.wasm_memory_limit
else:
  New_wasm_memory_limit = 0
if A.settings.wasm_memory_threshold is not null:
  New_wasm_memory_threshold = A.settings.wasm_memory_threshold
else:
  New_wasm_memory_threshold = 0
if A.settings.environment_variables is not null:
  New_environment_variables = A.settings.environment_variables
else:
  New_environment_variables = []


Cycles_reserved = cycles_to_reserve(S, Canister_id, New_compute_allocation, New_memory_allocation, null, EmptyCanister.wasm_state)
if A.amount is not null:
  New_balance = A.amount - Cycles_reserved
else:
  New_balance = DEFAULT_PROVISIONAL_CYCLES_BALANCE - Cycles_reserved
New_reserved_balance = Cycles_reserved
New_reserved_balance ≤ New_reserved_balance_limit
if New_compute_allocation > 0 or New_memory_allocation > 0 or Cycles_reserved > 0:
  liquid_balance(S', Canister_id) ≥ 0

New_canister_history {
  total_num_changes = 1
  recent_changes = {
    timestamp_nanos = CurrentTime
    canister_version = 0
    origin = change_origin(M.caller, A.sender_canister_version, M.origin)
    details = Creation {
      controllers = New_controllers
      environment_variables_hash = if A.settings.environment_variables is not null then
        opt hash_of_map(A.settings.environment_variables)
      else
        null
    }
  }
}

if A.settings.log_visibility is not null:
  New_canister_log_visibility = A.settings.log_visibility
else:
  New_canister_log_visibility = Controllers

if A.settings.snapshot_visibility is not null:
  New_canister_snapshot_visibility = A.settings.snapshot_visibility
else:
  New_canister_snapshot_visibility = Controllers
```

State after  

```html

S' = S with
    canisters[Canister_id] = EmptyCanister
    snapshots[Canister_id] = null
    time[Canister_id] = CurrentTime
    global_timer[Canister_id] = 0
    controllers[Canister_id] = New_controllers
    compute_allocation[Canister_id] = New_compute_allocation
    memory_allocation[Canister_id] = New_memory_allocation
    freezing_threshold[Canister_id] = New_freezing_threshold
    balances[Canister_id] = New_balance
    reserved_balances[Canister_id] = New_reserved_balance
    reserved_balance_limits[Canister_id] = New_reserved_balance_limit
    wasm_memory_limit[Canister_id] = New_wasm_memory_limit
    wasm_memory_threshold[Canister_id] = New_wasm_memory_threshold
    environment_variables[Canister_id] = New_environment_variables
    on_low_wasm_memory_hook_status[Canister_id] = ConditionNotSatisfied
    certified_data[Canister_id] = ""
    canister_history[Canister_id] = New_canister_history
    canister_log_visibility[Canister_id] = New_canister_log_visibility
    canister_snapshot_visibility[Canister_id] = New_canister_snapshot_visibility
    canister_logs[Canister_id] = []
    query_stats[CanisterId] = []
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid({canister_id = Canister_id}))
        refunded_cycles = M.transferred_cycles
      }
    canister_status[Canister_id] = Running
    canister_version[Canister_id] = 0
    canister_subnet[Canister_id] = Subnet {
      subnet_id : SubnetId
      subnet_size : SubnetSize
    }

```

#### IC Management Canister: Top up canister

Conditions  

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ CallMessage M' | FuncMessage M' ∈ Older_messages. M'.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'provisional_top_up_canister'
M.arg = candid(A)
A.canister_id ∈ dom(S.canisters)

```

State after  

```html

S with
    balances[A.canister_id] = S.balances[A.canister_id] + A.amount
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid())
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Take canister snapshot

Only the controllers of the given canister can take a snapshot. 
A snapshot will be identified internally by a system-generated opaque `Snapshot_id`.

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'take_canister_snapshot'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id]
if A.replace_snapshot is not null:
  A.replace_snapshot ∈ dom(S.snapshots[A.canister_id])
else:
  |dom(S.snapshots[A.canister_id])| < MAX_SNAPSHOTS

A.uninstall_code = null or A.uninstall_code = false

New_snapshot = Snapshot {
  source = TakenFromCanister;
  take_at_timestamp = S.time[A.canister_id];
  raw_module = S.canisters[A.canister_id].raw_module;
  wasm_state = S.canisters[A.canister_id].wasm_state;
  chunk_store = S.chunk_store[A.canister_id];
  canister_version = S.canister_version[A.canister_id];
  certified_data = S.certified_data[A.canister_id];
  global_timer = S.global_timer[A.canister_id];
  on_low_wasm_memory_hook_status = S.on_low_wasm_memory_hook_status[A.canister_id];
}
New_snapshots = S.snapshots[A.canister_id] with
  A.replace_snapshot = (undefined)
  Snapshot_id = New_snapshot
Cycles_reserved = cycles_to_reserve(S, A.canister_id, S.compute_allocation[A.canister_id], S.memory_allocation[A.canister_id], New_snapshots, S.canisters[A.canister_id])
New_balance = S.balances[A.canister_id] - Cycles_used - Cycles_reserved
New_reserved_balance = S.reserved_balances[A.canister_id] + Cycles_reserved
New_reserved_balance ≤ S.reserved_balance_limits[A.canister_id]

liquid_balance(S', A.canister_id) ≥ 0
```

State after

```html

S' = S with
    snapshots[A.canister_id] = New_snapshots
    balances[A.canister_id] = New_balance
    reserved_balances[A.canister_id] = New_reserved_balance
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin;
        response = Reply (candid({
          id = Snapshot_id;
          taken_at_timestamp = S.time[A.canister_id];
          total_size = memory_usage_snapshots([Snapshot_id → New_snapshot]);
        }));
        refunded_cycles = M.transferred_cycles;
      }

```

It is also possible to atomically uninstall code after taking a snapshot; in particular, the canister memory usage is updated atomically and thus it does not grow significantly (ignoring some potential constant overhead for certified variables which are not accounted for by canister memory usage, but are accounted for in canister snapshot memory usage).

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'take_canister_snapshot'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id]
S.canister_history[A.canister_id] = {
  total_num_changes = N;
  recent_changes = H;
}

if A.replace_snapshot is not null:
  A.replace_snapshot ∈ dom(S.snapshots[A.canister_id])
else:
  |dom(S.snapshots[A.canister_id])| < MAX_SNAPSHOTS

A.uninstall_code = true

New_snapshot = Snapshot {
  source = TakenFromCanister;
  take_at_timestamp = S.time[A.canister_id];
  raw_module = S.canisters[A.canister_id].raw_module;
  wasm_state = S.canisters[A.canister_id].wasm_state;
  chunk_store = S.chunk_store[A.canister_id];
  canister_version = S.canister_version[A.canister_id];
  certified_data = S.certified_data[A.canister_id];
  global_timer = S.global_timer[A.canister_id];
  on_low_wasm_memory_hook_status = S.on_low_wasm_memory_hook_status[A.canister_id];
}
New_snapshots = S.snapshots[A.canister_id] with
  A.replace_snapshot = (undefined)
  Snapshot_id = New_snapshot
Cycles_reserved = cycles_to_reserve(S, A.canister_id, S.compute_allocation[A.canister_id], S.memory_allocation[A.canister_id], New_snapshots, EmptyCanister)
New_balance = S.balances[A.canister_id] - Cycles_used - Cycles_reserved
New_reserved_balance = S.reserved_balances[A.canister_id] + Cycles_reserved
New_reserved_balance ≤ S.reserved_balance_limits[A.canister_id]

liquid_balance(S', A.canister_id) ≥ 0
```

State after

```html

S' = S with
    snapshots[A.canister_id] = New_snapshots
    balances[A.canister_id] = New_balance
    reserved_balances[A.canister_id] = New_reserved_balance

    canisters[A.canister_id] = EmptyCanister
    certified_data[A.canister_id] = ""
    chunk_store = ()
    canister_history[A.canister_id] = {
      total_num_changes = N + 1;
      recent_changes = H · {
          timestamp_nanos = S.time[A.canister_id];
          canister_version = S.canister_version[A.canister_id] + 1
          origin = change_origin(M.caller, A.sender_canister_version, M.origin);
          details = CodeUninstall;
        };
    }
    canister_logs[A.canister_id] = []
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    global_timer[A.canister_id] = 0

    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin;
        response = Reply (candid({
          id = Snapshot_id;
          taken_at_timestamp = S.time[A.canister_id];
          total_size = memory_usage_snapshots([Snapshot_id → New_snapshot]);
        }));
        refunded_cycles = M.transferred_cycles;
      } ·
      [ ResponseMessage {
          origin = Ctxt.origin
          response = Reject (CANISTER_REJECT, <implementation-specific>)
          refunded_cycles = Ctxt.available_cycles
        }
      | Ctxt_id ↦ Ctxt ∈ S.call_contexts
      , Ctxt.canister = A.canister_id
      , Ctxt.needs_to_respond = true
      ]

    for Ctxt_id ↦ Ctxt ∈ S.call_contexts:
      if Ctxt.canister = A.canister_id:
        call_contexts[Ctxt_id].deleted := true
        call_contexts[Ctxt_id].needs_to_respond := false
        call_contexts[Ctxt_id].available_cycles := 0

```

#### IC Management Canister: Load canister snapshot


Controllers of a canister can load a snapshot that belongs to a canister on the same subnet and also controlled by the caller.

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'load_canister_snapshot'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id]
A.snapshot_id ∈ dom(S.snapshots[Canister_id])
S.canister_subnet[A.canister_id].subnet_id = S.canister_subnet[Canister_id].subnet_id
M.caller ∈ S.controllers[Canister_id]
Snapshot = S.snapshots[Canister_id][A.snapshot_id]

Mod = parse_wasm_mod(Snapshot.raw_module);

|Snapshot.wasm_state.globals| = |Mod.initial_globals|
for i in [0..|Snapshot.wasm_state.globals|]:
  if Snapshot.wasm_state.globals[i] = I32(_):
    Mod.initial_globals = I32(_)
  else if Snapshot.wasm_state.globals[i] = I64(_):
    Mod.initial_globals = I64(_)
  else if Snapshot.wasm_state.globals[i] = F32(_):
    Mod.initial_globals = F32(_)
  else if Snapshot.wasm_state.globals[i] = F64(_):
    Mod.initial_globals = F64(_)
  else if Snapshot.wasm_state.globals[i] = V128(_):
    Mod.initial_globals = V128(_)

if Snapshot.source = MetadataUpload:
  if Snapshot.on_low_wasm_memory_hook_status = ConditionNotSatisfied:
    HookConditionInSnapshotField = false
  else:
    HookConditionInSnapshotField = true
  if S.wasm_memory_limit[A.canister_id] < |Snapshot.wasm_state.wasm_memory| + S.wasm_memory_threshold[A.canister_id]:
    HookConditionInSnapshotState = true
  else:
    HookConditionInSnapshotState = false
  (HookConditionInSnapshotField and HookConditionInSnapshotState)
  or
  ((not HookConditionInSnapshotField) and (not HookConditionInSnapshotState))

New_state = {
  wasm_state = Snapshot.wasm_state;
  raw_module = Snapshot.raw_module;
  module = Mod;
  public_custom_sections = parse_public_custom_sections(Snapshot.raw_module);
  private_custom_sections = parse_private_custom_sections(Snapshot.raw_module);
}

if Snapshot.source = MetadataUpload and Snapshot.global_timer is not null:
  New_global_timer = Snapshot.global_timer
else:
  New_global_timer = S.global_timer[A.canister_id]

if Snapshot.source = MetadataUpload and Snapshot.on_low_wasm_memory_hook_status is not null:
  New_on_low_wasm_memory_hook_status = Snapshot.on_low_wasm_memory_hook_status
else:
  New_on_low_wasm_memory_hook_status = S.on_low_wasm_memory_hook_status[A.canister_id]

Cycles_reserved = cycles_to_reserve(S, A.canister_id, S.compute_allocation[A.canister_id], S.memory_allocation[A.canister_id], S.snapshots[A.canister_id], New_state)
New_balance = S.balances[A.canister_id] - Cycles_used - Cycles_reserved
New_reserved_balance = S.reserved_balances[A.canister_id] + Cycles_reserved
New_reserved_balance ≤ S.reserved_balance_limits[A.canister_id]

S.canister_history[A.canister_id] = {
  total_num_changes = N;
  recent_changes = H;
}
if Canister_id = A.canister_id:
  From_canister_id = null
else:
  From_canister_id = Canister_id
New_canister_history = {
  total_num_changes = N + 1;
  recent_changes = H · {
    timestamp_nanos = S.time[A.canister_id];
    canister_version = S.canister_version[A.canister_id] + 1
    origin = change_origin(M.caller, A.sender_canister_version, M.origin);
    details = LoadSnapshot {
      from_canister_id = From_canister_id
      snapshot_id = A.snapshot_id
      canister_version = Snapshot.canister_version
      taken_at_timestamp = Snapshot.take_at_timestamp
      source = Snapshot.source
    };
  };
}

liquid_balance(S', A.canister_id) ≥ 0

```

State after  

```html

S' = S with
    canisters[A.canister_id] = New_state
    chunk_store[A.canister_id] = Snapshot.chunk_store
    certified_data[A.canister_id] = Snapshot.certified_data
    global_timer[A.canister_id] = New_global_timer
    on_low_wasm_memory_hook_status[A.canister_id] = New_on_low_wasm_memory_hook_status
    balances[A.canister_id] = New_balance
    reserved_balances[A.canister_id] = New_reserved_balance
    canister_history[A.canister_id] = New_canister_history
    canister_version[A.canister_id] = S.canister_version[A.canister_id] + 1
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin;
        response = Reply (candid());
        refunded_cycles = M.transferred_cycles;
      }

```

#### IC Management Canister: Read snapshot metadata

Access to the metadata of a canister snapshot is determined by the canister settings `canister_snapshot_visibility`.

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'read_canister_snapshot_metadata'
M.arg = candid(A)
(S[A.canister_id].canister_snapshot_visibility = Public)
  or
  (S[A.canister_id].canister_snapshot_visibility = Controllers and M.caller in S[A.canister_id].controllers)
  or
  (S[A.canister_id].canister_snapshot_visibility = AllowedViewers Principals and (M.caller in S[A.canister_id].controllers or M.caller in Principals))

A.snapshot_id ∈ dom(S.snapshots[A.canister_id])
Snapshot = S.snapshots[A.canister_id][A.snapshot_id]

SnapshotMetadata = {
  source = Snapshot.source;
  taken_at_timestamp = Snapshot.taken_at_timestamp;
  wasm_module_size = |Snapshot.raw_module|;
  globals = Snapshot.wasm_state.globals;
  wasm_memory_size = |Snapshot.wasm_state.wasm_memory|;
  stable_memory_size = |Snapshot.wasm_state.stable_memory|;
  wasm_chunk_store = [{hash: hash} | hash <- dom(Snapshot.chunk_store)]
  canister_version = Snapshot.canister_version;
  certified_data = Snapshot.certified_data;
  global_timer = Snapshot.global_timer;
  on_low_wasm_memory_hook_status = Snapshot.on_low_wasm_memory_hook_status;
}

```

State after

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid(SnapshotMetadata))
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Read snapshot data

Access to the (binary) data of a canister snapshot is determined by the canister settings `canister_snapshot_visibility`.

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'read_canister_snapshot_data'
M.arg = candid(A)
(S[A.canister_id].canister_snapshot_visibility = Public)
  or
  (S[A.canister_id].canister_snapshot_visibility = Controllers and M.caller in S[A.canister_id].controllers)
  or
  (S[A.canister_id].canister_snapshot_visibility = AllowedViewers Principals and (M.caller in S[A.canister_id].controllers or M.caller in Principals))

A.snapshot_id ∈ dom(S.snapshots[A.canister_id])
Snapshot = S.snapshots[A.canister_id][A.snapshot_id]

if A.kind = WasmModule { offset, size }:
  offset + size <= |Snapshot.raw_module|
else if A.kind = WasmMemory { offset, size }:
  offset + size <= |Snapshot.wasm_state.wasm_memory|
else if A.kind = StableMemory { offset, size }:
  offset + size <= |Snapshot.wasm_state.stable_memory|
else if A.kind = WasmChunk { hash }:
  hash in dom(Snapshot.chunk_store)

if A.kind = WasmModule { offset, size }:
  Chunk = Snapshot.raw_module[offset..offset+size]
else if A.kind = WasmMemory { offset, size }:
  Chunk = Snapshot.wasm_state.wasm_memory[offset..offset+size]
else if A.kind = StableMemory { offset, size }:
  Chunk = Snapshot.wasm_state.stable_memory[offset..offset+size]
else if A.kind = WasmChunk { hash }:
  Chunk = Snapshot.chunk_store[hash]

```

State after

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid({chunk = Chunk}))
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Upload canister snapshot metadata

Only the controllers of the given canister can create a new snapshot by uploading its metadata.
A snapshot will be identified internally by a system-generated opaque `Snapshot_id`.


```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'upload_canister_snapshot_metadata'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id]
if A.replace_snapshot is not null:
  A.replace_snapshot ∈ dom(S.snapshots[A.canister_id])
else:
  |dom(S.snapshots[A.canister_id])| < MAX_SNAPSHOTS

New_snapshot = Snapshot {
  source = MetadataUpload;
  take_at_timestamp = S.time[A.canister_id];
  raw_module = [0 | _ <- [0..A.wasm_module_size]];
  wasm_state = {
    wasm_memory = [0 | _ <- [0..A.wasm_memory_size]];
    stable_memory = [0 | _ <- [0..A.stable_memory_size]];
    globals = A.globals;
    self_id = A.canister_id;
  };
  chunk_store = [];
  canister_version = S.canister_version[A.canister_id];
  certified_data = A.certified_data;
  global_timer = A.global_timer;
  on_low_wasm_memory_hook_status = A.on_low_wasm_memory_hook_status;
}
New_snapshots = S.snapshots[A.canister_id] with
  A.replace_snapshot = (undefined)
  Snapshot_id = New_snapshot
Cycles_reserved = cycles_to_reserve(S, A.canister_id, S.compute_allocation[A.canister_id], S.memory_allocation[A.canister_id], New_snapshots, S.canisters[A.canister_id])
New_balance = S.balances[A.canister_id] - Cycles_used - Cycles_reserved
New_reserved_balance = S.reserved_balances[A.canister_id] + Cycles_reserved
New_reserved_balance ≤ S.reserved_balance_limits[A.canister_id]

liquid_balance(S', A.canister_id) ≥ 0
```

State after

```html

S' = S with
    snapshots[A.canister_id] = New_snapshots
    balances[A.canister_id] = New_balance
    reserved_balances[A.canister_id] = New_reserved_balance
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin;
        response = Reply (candid({
          snapshot_id = Snapshot_id;
        }));
        refunded_cycles = M.transferred_cycles;
      }

```

#### IC Management Canister: Upload canister snapshot data

Only the controllers of the given canister can upload (binary) data to its snapshots.


```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'upload_canister_snapshot_data'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id]

A.snapshot_id ∈ dom(S.snapshots[A.canister_id])
Snapshot = S.snapshots[A.canister_id][A.snapshot_id]
Snapshot.source = MetadataUpload

if A.kind = WasmModule { offset }:
  offset + |A.chunk| <= |Snapshot.raw_module|
else if A.kind = WasmMemory { offset }:
  offset + |A.chunk| <= |Snapshot.wasm_state.wasm_memory|
else if A.kind = StableMemory { offset }:
  offset + |A.chunk| <= |Snapshot.wasm_state.stable_memory|
else if A.kind = WasmChunk { hash }:
  |dom(Snapshot.chunk_store) ∪ {SHA-256(A.chunk)}| <= CHUNK_STORE_SIZE

if A.kind = WasmModule { offset }:
  New_raw_module = Snapshot.raw_module[0..offset] · A.chunk · Snapshot.raw_module[offset+|A.chunk|..|Snapshot.raw_module|]
  New_snapshot = Snapshot with
    raw_module = New_raw_module
else if A.kind = WasmMemory { offset }:
  New_wasm_memory = Snapshot.wasm_memory[0..offset] · A.chunk · Snapshot.wasm_memory[offset+|A.chunk|..|Snapshot.wasm_memory|]
  New_snapshot = Snapshot with
    wasm_memory = New_wasm_memory
else if A.kind = StableMemory { offset }:
  New_stable_memory = Snapshot.stable_memory[0..offset] · A.chunk · Snapshot.stable_memory[offset+|A.chunk|..|Snapshot.stable_memory|]
  New_snapshot = Snapshot with
    stable_memory = New_stable_memory
else if A.kind = WasmChunk:
  New_chunk_store = Snapshot.chunk_store with
    SHA-256(A.chunk) = A.chunk
  New_snapshot = Snapshot with
    chunk_store = New_chunk_store

New_snapshots = S.snapshots[A.canister_id] with
  Snapshot_id = New_snapshot

Cycles_reserved = cycles_to_reserve(S, A.canister_id, S.compute_allocation[A.canister_id], S.memory_allocation[A.canister_id], New_snapshots, S.canisters[A.canister_id])
New_balance = S.balances[A.canister_id] - Cycles_used - Cycles_reserved
New_reserved_balance = S.reserved_balances[A.canister_id] + Cycles_reserved
New_reserved_balance ≤ S.reserved_balance_limits[A.canister_id]

liquid_balance(S', A.canister_id) ≥ 0
```

State after

```html

S' = S with
    snapshots[A.canister_id] = New_snapshots
    balances[A.canister_id] = New_balance
    reserved_balances[A.canister_id] = New_reserved_balance
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin;
        response = Reply (candid());
        refunded_cycles = M.transferred_cycles;
      }

```

#### IC Management Canister: List canister snapshots

Access to the list of the existing snapshots of a canister is determined by the canister settings `canister_snapshot_visibility`.

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'list_canister_snapshots'
M.arg = candid(A)
(S[A.canister_id].canister_snapshot_visibility = Public)
  or
  (S[A.canister_id].canister_snapshot_visibility = Controllers and M.caller in S[A.canister_id].controllers)
  or
  (S[A.canister_id].canister_snapshot_visibility = AllowedViewers Principals and (M.caller in S[A.canister_id].controllers or M.caller in Principals))


Snapshots = [{
  id = Snapshot_id;
  taken_at_timestamp = Snapshot.taken_at_timestamp;
  total_size = memory_usage_snapshots([Snapshot_id → Snapshot]);
} | Snapshot_id → Snapshot ∈ S.snapshots[A.canister_id]]

```

State after

```html

S with
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid(Snapshots))
        refunded_cycles = M.transferred_cycles
      }

```

#### IC Management Canister: Delete canister snapshot

A snapshot may be deleted only by the controllers of the canister that the snapshot belongs to.

```html

S.messages = Older_messages · CallMessage M · Younger_messages
(M.queue = Unordered) or (∀ msg ∈ Older_messages. msg.queue ≠ M.queue)
M.callee = ic_principal
M.method_name = 'delete_canister_snapshot'
M.arg = candid(A)
M.caller ∈ S.controllers[A.canister_id]
A.snapshot_id ∈ dom(S.snapshots[A.canister_id])

```

State after

```html

S with
    S.snapshots[A.canister_id][A.snapshot_id] = (deleted)
    messages = Older_messages · Younger_messages ·
      ResponseMessage {
        origin = M.origin
        response = Reply (candid());
        refunded_cycles = M.transferred_cycles
      }

```

#### Callback invocation

When an inter-canister call has been responded to, we can queue the call to the callback.

This "bookkeeping transition" must be immediately followed by the corresponding ["Message execution" transition](#rule-message-execution).

Conditions  

```html

S.messages = Older_messages · ResponseMessage RM · Younger_messages
RM.origin = FromCanister {
    call_context = Ctxt_id
    callback = Callback
    deadline = D
  }
Ctxt_id ∈ dom(S.call_contexts)
Ctxt = S.call_contexts[Ctxt_id]
not Ctxt.deleted
Ctxt.canister ∈ dom(S.balances)
D ≠ Expired _

Caller = if Ctxt.origin = FromUser { request = R }:
  R.sender
else if Ctxt.origin = FromCanister { calling_context = Calling_ctxt, …}:
  S.call_contexts[Calling_ctxt].canister
else:
  ic_principal

if Ctxt.origin = FromUser { request = R }:
  if R.sender = mk_self_authenticating_id (canister_signature_pk Signing_canister_id Seed):
    if R.sender_info = null:
      Caller_info_data = ""
      Caller_info_signer = ""
    else:
      Caller_info_data = R.sender_info.info
      Caller_info_signer = Signing_canister_id
  else:
    Caller_info_data = ""
    Caller_info_signer = ""
else:
  Caller_info_data = ""
  Caller_info_signer = ""

```

State after  

```html

S with
    balances[S.call_contexts[Ctxt_id].canister] =
      S.balances[S.call_contexts[Ctxt_id].canister] + RM.refunded_cycles
    messages =
      Older_messages ·
      FuncMessage {
        call_context = Ctxt_id
        caller = Caller
        caller_info_data = Caller_info_data
        caller_info_signer = Caller_info_signer
        receiver = S.call_contexts[Ctxt_id].canister
        entry_point = Callback Callback RM.response RM.refunded_cycles
        queue = Unordered
      } ·
      Younger_messages

```

If the responded call context does not exist anymore, because the canister has been uninstalled since, the refunded cycles are still added to the canister balance, but no function invocation is enqueued.

Conditions  

```html

S.messages = Older_messages · ResponseMessage RM · Younger_messages
RM.origin = FromCanister {
    call_context = Ctxt_id
    callback = Callback
    deadline = D
  }
Ctxt_id ∈ dom(S.call_contexts)
S.call_contexts[Ctxt_id].deleted
S.call_contexts[Ctxt_id].canister ∈ dom(S.balances)
D ≠ Expired _

```

State after  

```html

S with
    balances[S.call_contexts[Ctxt_id].canister] =
      S.balances[S.call_contexts[Ctxt_id].canister] + RM.refunded_cycles + MAX_CYCLES_PER_RESPONSE
    messages = Older_messages · Younger_messages

```

#### Dropping expired messages {#message-timeout}

Condition:
```html
S.messages = Older_messages · M · Younger_messages
M = ResponseMessage _ ∨ M = CallMessage _
M.origin = FromCanister O
O.deadline = Expired _
```

State after

```html
S.messages = Older_messages · Younger_messages
```

#### Respond to user request

When an ingress method call has been responded to, we can record the response in the list of queries.

Conditions  

```html

S.messages = Older_messages · ResponseMessage RM · Younger_messages
RM.origin = FromUser { request = M }
S.requests[M] = (Processing, ECID)

```

State after  

```html

S with
    messages = Older_messages · Younger_messages
    requests[M] =
      | (Replied R, ECID)        if M.response = Reply R
      | (Rejected (c, R), ECID)  if M.response = Reject (c, R)

```

NB: The refunded cycles, `RM.refunded_cycles` are, by construction, empty.

#### Update call request clean up

The IC will keep the data for a replied or rejected update `call` request around for a certain, implementation defined amount of time, to allow users to poll for the data with `read_state` requests . After that time, the data of the request will be dropped:

Conditions  

```html

(S.requests[M] = (Replied _, ECID)) or (S.requests[M] = (Rejected _, ECID))

```

State after  

```html

S with
    requests[M] = (Done, ECID)

```

At the same or some later point, the request will be removed from the state of the IC. This must happen no earlier than the ingress expiry time set in the request.

Conditions  

```html

(S.requests[M] = (Replied _, _)) or (S.requests[M] = (Rejected _, _)) or (S.requests[M] = (Done, _))
M.ingress_expiry < S.system_time

```

State after  

```html

S with
    requests[M] = (deleted)

```

#### Canister out of cycles

Once a canister runs out of cycles, its code is uninstalled (cf. [IC Management Canister: Code uninstallation](#rule-uninstall)), the canister changes in the canister history are dropped (their total number is preserved), and the allocations are set to zero:

Conditions  

```html

S.balances[CanisterId] = 0
S.reserved_balances[CanisterId] = 0
S.canister_history[CanisterId] = {
  total_num_changes = N;
  recent_changes = H;
}

```

State after  

```html

S with
    canisters[CanisterId] = EmptyCanister
    snapshots[CanisterId] = null
    certified_data[CanisterId] = ""
    canister_history[CanisterId] = {
      total_num_changes = N;
      recent_changes = [];
    }
    canister_logs[CanisterId] = []
    canister_version[CanisterId] = S.canister_version[CanisterId] + 1
    global_timer[CanisterId] = 0
    compute_allocation[Canister_id] = 0
    memory_allocation[Canister_id] = 0

    messages = S.messages ·
      [ ResponseMessage {
          origin = Ctxt.origin
          response = Reject (CANISTER_REJECT, <implementation-specific>)
          refunded_cycles = Ctxt.available_cycles
        }
      | Ctxt_id ↦ Ctxt ∈ S.call_contexts
      , Ctxt.canister = CanisterId
      , Ctxt.needs_to_respond = true
      ]

    for Ctxt_id ↦ Ctxt ∈ S.call_contexts:
      if Ctxt.canister = CanisterId:
        call_contexts[Ctxt_id].deleted := true
        call_contexts[Ctxt_id].needs_to_respond := false
        call_contexts[Ctxt_id].available_cycles := 0

```

#### Canister renaming

The system canister migration orchestrator (we denote its canister ID by `Canister_migration_orchestrator`)
can perform canister renaming of a canister with canister ID `Canister_id`
to a new canister ID `New_canister_id`.
The actual caller of the corresponding canister migration orchestrator's endpoint who requested canister renaming is denoted by `Caller`.
We denote the system canister migration orchestrator version when performing the renaming by `Canister_migration_orchestrator_version`.

Conditions

```html

not (S.canister_subnet[Canister_id] = S.canister_subnet[New_canister_id])

Caller ∈ S.controllers[Canister_id]
Caller ∈ S.controllers[New_canister_id]

Canister_migration_orchestrator ∈ S.controllers[Canister_id]
Canister_migration_orchestrator ∈ S.controllers[New_canister_id]

S.canister_status[Canister_id] = Stopped
S.canister_status[New_canister_id] = Stopped

∀ Snapshot_id. S.snapshots[Canister_id][Snapshot_id] = null

S.canister_history[Canister_id] = {
  total_num_changes = N;
  recent_changes = H;
}

New_canister_history = {
  total_num_changes = S.canister_history[New_canister_id].total_num_changes + 1;
  recent_changes = H · {
    timestamp_nanos = S.time[Canister_id];
    canister_version = max(S.canister_version[New_canister_id], S.canister_version[Canister_id]) + 1;
    origin = FromCanister {
      canister_id = Canister_migration_orchestrator
      canister_version = Canister_migration_orchestrator_version
    };
    details = RenameCanister {
      canister_id = Canister_id;
      total_num_changes = N;
      rename_to = {
        canister_id = New_canister_id;
        version = S.canister_version[New_canister_id];
        total_num_changes = S.canister_history[New_canister_id].total_num_changes;
      };
      requested_by = Caller;
    };
  };
}

```

State after

```html

S with
  canisters[New_canister_id] = S.canisters[Canister_id]
  canisters[Canister_id] = (deleted)
  snapshots[New_canister_id] = {}
  snapshots[Canister_id] = (deleted)
  controllers[New_canister_id] = S.controllers[Canister_id]
  controllers[Canister_id] = (deleted)
  compute_allocation[New_canister_id] = S.compute_allocation[Canister_id]
  compute_allocation[Canister_id] = (deleted)
  memory_allocation[New_canister_id] = S.memory_allocation[Canister_id]
  memory_allocation[Canister_id] = (deleted)
  freezing_threshold[New_canister_id] = S.freezing_threshold[Canister_id]
  freezing_threshold[Canister_id] = (deleted)
  canister_status[New_canister_id] = S.canister_status[Canister_id]
  canister_status[Canister_id] = (deleted)
  canister_version[New_canister_id] = max(S.canister_version[New_canister_id], S.canister_version[Canister_id]) + 1
  canister_version[Canister_id] = (deleted)
  canister_subnet[New_canister_id] = S.canister_subnet[Canister_id]
  canister_subnet[Canister_id] = (deleted)
  time[New_canister_id] = S.time[Canister_id]
  time[Canister_id] = (deleted)
  global_timer[New_canister_id] = S.global_timer[Canister_id]
  global_timer[Canister_id] = (deleted)
  balances[New_canister_id] = S.balances[Canister_id]
  balances[Canister_id] = (deleted)
  reserved_balances[New_canister_id] = S.reserved_balances[Canister_id]
  reserved_balances[Canister_id] = (deleted)
  reserved_balance_limits[New_canister_id] = S.reserved_balance_limits[Canister_id]
  reserved_balance_limits[Canister_id] = (deleted)
  wasm_memory_limit[New_canister_id] = S.wasm_memory_limit[Canister_id]
  wasm_memory_limit[Canister_id] = (deleted)
  wasm_memory_threshold[New_canister_id] = S.wasm_memory_threshold[Canister_id]
  wasm_memory_threshold[Canister_id] = (deleted)
  environment_variables[New_canister_id] = S.environment_variables[Canister_id]
  environment_variables[Canister_id] = (deleted)
  on_low_wasm_memory_hook_status[New_canister_id] = S.on_low_wasm_memory_hook_status[Canister_id]
  on_low_wasm_memory_hook_status[Canister_id] = (deleted)
  certified_data[New_canister_id] = S.certified_data[Canister_id]
  certified_data[Canister_id] = (deleted)
  canister_history[New_canister_id] = New_canister_history
  canister_history[Canister_id] = (deleted)
  canister_log_visibility[New_canister_id] = S.canister_log_visibility[Canister_id]
  canister_log_visibility[Canister_id] = (deleted)
  canister_snapshot_visibility[New_canister_id] = S.canister_snapshot_visibility[Canister_id]
  canister_snapshot_visibility[Canister_id] = (deleted)
  canister_logs[New_canister_id] = S.canister_logs[Canister_id]
  canister_logs[Canister_id] = (deleted)
  query_stats[New_canister_id] = S.query_stats[Canister_id]
  query_stats[Canister_id] = (deleted)

```

#### Time progressing, cycle consumption, canister version increments and subnet admins updates

Time progresses. Abstractly, it does so independently for each canister, and in unspecified intervals.

Conditions  

```html

T0 = S.time[CanisterId]
T1 > T0

```

State after  

```html

S with
    time[CanisterId] = T1

```

The canister cycle balances similarly deplete at an unspecified rate, but stay non-negative.
If the canister has a positive reserved balance, then the reserved balance depletes before the main balance:

Conditions  

```html
R0 = S.reserved_balances[CanisterId]
0 ≤ R1 < R0

```

State after

```html

S with
    reserved_balances[CanisterId] = R1

```

Once the reserved balance reaches zero, then the main balance starts depleting:

Conditions

```html
S.reserved_balances[CanisterId] = 0
B0 = S.balances[CanisterId]
0 ≤ B1 < B0

```

State after  

```html

S with
    balances[CanisterId] = B1

```

Similarly, the system time, used to expire requests, progresses:

Conditions  

```html

T0 = S.system_time
T1 > T0

```

State after  

```html

S with
    system_time = T1

```

Additionally, the canister version can be incremented arbitrarily:

Conditions  

```html

N0 = S.canister_version[CanisterId]
N1 > N0

```

State after  

```html

S with
    canister_version[CanisterId] = N1

```

Finally, subnet admins can be changed arbirtrarily: 

Conditions  

```html

SA0 = S.subnet_admins
SA1 != SA0

```

State after  

```html

S with
    subnet_admins = SA1

```

:::note

In production, subnet admins can be set via the Subnet Rental Canister which is not modeled in this document.

#### Trimming canister history

The list of canister changes can be trimmed, but the total number of recorded canister changes cannot be altered. At least 20 changes are guaranteed to remain in the list of changes.

Conditions  

```html

S.canister_history[CanisterId] = {
    total_num_changes = N;
    recent_changes = Older_changes · Newer_changes;
  }
|Newer_changes| ≥ 20

```

State after  

```html

S with
    canister_history[CanisterId] = {
      total_num_changes = N;
      recent_changes = Newer_changes;
    }

```

#### Trimming canister logs

Canister logs can be trimmed if their total length exceeds 4KiB.

Conditions

```html

S.canister_logs[CanisterId] = Older_logs · Newer_logs
SUM { |l| | l <- Older_logs } > 4KiB

```

State after

```html

S with
    canister_logs[CanisterId] = Newer_logs

```

#### IC Management Canister: Canister logs (query call) {#ic-mgmt-canister-fetch-canister-logs}

This section specifies management canister query calls.
They are calls to `/api/v3/canister/<ECID>/query`
with CBOR content `Q` such that `Q.canister_id = ic_principal`.

The management canister offers the method `fetch_canister_logs`
that can be called as a query call and
returns logs of a requested canister.

Submitted request to `/api/v3/canister/<ECID>/query`

```html

E : Envelope

```

Conditions

```html

E.content = CanisterQuery Q
Q.canister_id = ic_principal
Q.method_name = 'fetch_canister_logs'
|Q.nonce| <= 32
is_effective_canister_id(E.content, ECID)
S.system_time <= Q.ingress_expiry or Q.sender = anonymous_id
Q.arg = candid(A)
A.canister_id ∈ verify_envelope(E, Q.sender, S.system_time)
if E.sender_pubkey = canister_signature_pk Signing_canister_id Seed:
  if not (Q.sender_info = null):
    verify_signature E.sender_pubkey Q.sender_info.sig ("\x0Eic-sender-info" · Q.sender_info.info)
    Q.sender_info.signer = Signing_canister_id
else:
  Q.sender_info = null
(S[A.canister_id].canister_log_visibility = Public)
  or
  (S[A.canister_id].canister_log_visibility = Controllers and Q.sender in S[A.canister_id].controllers)
  or
  (S[A.canister_id].canister_log_visibility = AllowedViewers Principals and (Q.sender in S[A.canister_id].controllers or Q.sender in Principals))

```

Query response `R`:

```html

{status: "replied"; reply: {arg: candid(S.canister_logs[A.canister_id])}, signatures: Sigs}

```

where the query `Q`, the response `R`, and a certificate `Cert` that is obtained by requesting the path `/subnet` in a **separate** read state request to `/api/v3/canister/<ECID>/read_state` satisfy the following:

```html

verify_response(Q, R, Cert) ∧ lookup(["time"], Cert) = Found S.system_time // or "recent enough"

```

#### IC Management Canister: List canisters (query call) {#ic-mgmt-canister-list-canisters}

This section specifies the `list_canisters` management canister query call.
It is a call to `/api/v3/canister/<ECID>/query`
with CBOR content `Q` such that `Q.canister_id = ic_principal`.

The management canister offers the method `list_canisters`
that can be called as a query call by subnet admins and
returns the list of all canisters on the subnet as consecutive canister ID ranges.

Submitted request to `/api/v3/canister/<ECID>/query`

```html

E : Envelope

```

Conditions

```html

E.content = CanisterQuery Q
Q.canister_id = ic_principal
Q.method_name = 'list_canisters'
|Q.nonce| <= 32
is_effective_canister_id(E.content, ECID)
S.system_time <= Q.ingress_expiry or Q.sender = anonymous_id
verify_envelope(E, Q.sender, S.system_time)
Q.sender ∈ S.subnet_admins[S.canister_subnet[ECID]]

```

Query response `R`:

```html

{status: "replied"; reply: {arg: candid({canisters: CanisterIdRanges})}, signatures: Sigs}

```

where `CanisterIdRanges` is the list of all canister IDs on the subnet encoded as consecutive canister ID ranges (excluding deleted canisters), and the query `Q`, the response `R`, and a certificate `Cert` that is obtained by requesting the path `/subnet` in a **separate** read state request to `/api/v3/canister/<ECID>/read_state` satisfy the following:

```html

verify_response(Q, R, Cert) ∧ lookup(["time"], Cert) = Found S.system_time // or "recent enough"

```

#### Query call {#query-call}

This section specifies query calls `Q` whose `Q.canister_id` is a non-empty canister `S.canisters[Q.canister_id]`. Query calls to the management canister, i.e., `Q.canister_id = ic_principal`, are specified in Sections [Canister status](#ic-management-canister-canister-status), [Canister logs](#ic-mgmt-canister-fetch-canister-logs), and [List canisters](#ic-mgmt-canister-list-canisters).

Canister query calls to `/api/v3/canister/<ECID>/query` can be executed directly. They can only be executed against non-empty canisters which have a status of `Running` and are also not frozen.

In query and composite query methods evaluated on the target canister of the query call, a certificate is provided to the canister that is valid, contains a current state tree (or "recent enough"; the specification is currently vague about how old the certificate may be), and reveals the canister's [Certified Data](./canister-interface.md#system-api-certified-data).

Composite query methods can call query methods and composite query methods up to a maximum depth `MAX_CALL_DEPTH_COMPOSITE_QUERY` of the call graph. The total amount of cycles consumed by executing a (composite) query method and all (transitive) calls it makes must be at most `MAX_CYCLES_PER_QUERY`. This limit applies in addition to the limit `MAX_CYCLES_PER_MESSAGE` for executing a single (composite) query method and `MAX_CYCLES_PER_RESPONSE` for executing a single callback of a (composite) query method.

We define an auxiliary method that handles calls from composite query methods by performing a call graph traversal. It can also be (trivially) invoked for query methods that do not make further calls.
```
composite_query_helper(S, Cycles, Depth, Root_canister_id, Caller, Caller_info_data, Caller_info_signer, Canister_id, Method_name, Arg) =
  let Mod = S.canisters[Canister_id].module
  let Cert <- { Cert | verify_cert(Cert) and
                       lookup(["canister", Canister_id, "certified_data"], Cert) = Found S.certified_data[Canister_id] and
                       lookup(["time"], Cert) = Found S.system_time // or "recent enough"
              }
  if Canister_id ≠ Root_canister_id
  then
    Cert := NoCertificate // no certificate available in query and composite query methods evaluated on canisters other than the target canister of the query call
  let Env = { time = S.time[Canister_id];
              controllers = S.controllers[Canister_id];
              global_timer = S.global_timer[Canister_id];
              balance = S.balances[Canister_id];
              reserved_balance = S.reserved_balances[Canister_id];
              reserved_balance_limit = S.reserved_balance_limits[Canister_id];
              compute_allocation = S.compute_allocation[Canister_id];
              memory_allocation = S.memory_allocation[Canister_id];
              memory_usage_raw_module = memory_usage_raw_module(S.canisters[Canister_id].raw_module);
              memory_usage_canister_history = memory_usage_canister_history(S.canister_history[Canister_id]);
              memory_usage_chunk_store = memory_usage_chunk_store(S.chunk_store[Canister_id]);
              memory_usage_snapshots = memory_usage_snapshots(S.snapshots[Canister_id]);
              freezing_threshold = S.freezing_threshold[Canister_id];
              subnet_id = S.canister_subnet[Canister_id].subnet_id;
              subnet_size = S.canister_subnet[Canister_id].subnet_size;
              certificate = Cert;
              status = simple_status(S.canister_status[Canister_id]);
              canister_version = S.canister_version[Canister_id];
            }
  if S.canisters[Canister_id] ≠ EmptyCanister and
     S.canister_status[Canister_id] = Running and
     (Method_name ∈ dom(Mod.query_methods) or Method_name ∈ dom(Mod.composite_query_methods)) and
     Cycles >= MAX_CYCLES_PER_MESSAGE
  then
     let W = S.canisters[Canister_id].wasm_state
     let F = if Method_name ∈ dom(Mod.query_methods) then Mod.query_methods[Method_name] else Mod.composite_query_methods[Method_name]
     if liquid_balance(S, Canister_id) < 0
     then
       Return (Reject (SYS_TRANSIENT, <implementation-specific>), Cycles, S)
     let R = F(Arg, Caller, Caller_info_data, Caller_info_signer, Env)(W)
     if R = Trap trap
     then Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles - trap.cycles_used, S)
     else if R = Return {new_state = W'; new_calls = Calls; response = Response; cycles_used = Cycles_used}
     then
        W := W'
        if Cycles_used > MAX_CYCLES_PER_MESSAGE
        then
           Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles - MAX_CYCLES_PER_MESSAGE, S) // single message execution out of cycles
        Cycles := Cycles - Cycles_used
        if Response = NoResponse
        then
           while Calls ≠ []
           do
              if Depth = MAX_CALL_DEPTH_COMPOSITE_QUERY
              then
                 Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles, S) // max call graph depth exceeded
              let Calls' · Call · Calls''  = Calls
              Calls := Calls' · Calls''
              if S.canister_subnet[Canister_id].subnet_id ≠ S.canister_subnet[Call.callee].subnet_id
              then
                 Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles, S) // calling to another subnet
              let (Response', Cycles', S') = composite_query_helper(S, Cycles, Depth + 1, Root_canister_id, Canister_id, "", "", Call.callee, Call.method_name, Call.arg)
              Cycles := Cycles'
              S := S'
              if Cycles < MAX_CYCLES_PER_RESPONSE
              then
                 Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles, S) // composite query out of cycles
              Env.Cert = NoCertificate // no certificate available in composite query callbacks
              let F' = Mod.composite_callbacks(Call.callback, Caller, Caller_info_data, Caller_info_signer, Response', Env)
              let R'' = F'(W')
              if R'' = Trap trap''
              then Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles - trap''.cycles_used, S)
              else if R'' = Return {new_state = W''; new_calls = Calls''; response = Response''; cycles_used = Cycles_used''}
              then
                 W := W''
                 if Cycles_used'' > MAX_CYCLES_PER_RESPONSE
                 then
                    Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles - MAX_CYCLES_PER_RESPONSE, S) // single message execution out of cycles
                 Cycles := Cycles - Cycles_used''
                 if Response'' = NoResponse
                 then
                    Calls := Calls'' · Calls
                 else
                    Return (Response'', Cycles, S)
           Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles, S) // canister did not respond
        else
           Return (Response, Cycles, S)
  else
     Return (Reject (CANISTER_ERROR, <implementation-specific>), Cycles, S)
```

Submitted request to `/api/v3/canister/<ECID>/query`

```html

E : Envelope

```

Conditions  

```html

E.content = CanisterQuery Q
Q.canister_id ∈ verify_envelope(E, Q.sender, S.system_time)
if E.sender_pubkey = canister_signature_pk Signing_canister_id Seed:
  if not (Q.sender_info = null):
    verify_signature E.sender_pubkey Q.sender_info.sig ("\x0Eic-sender-info" · Q.sender_info.info)
    Q.sender_info.signer = Signing_canister_id
else:
  Q.sender_info = null
|Q.nonce| <= 32
is_effective_canister_id(E.content, ECID)
S.system_time <= Q.ingress_expiry or Q.sender = anonymous_id

if Q.sender = mk_self_authenticating_id (canister_signature_pk Signing_canister_id Seed):
  if Q.sender_info = null:
    Caller_info_data = ""
    Caller_info_signer = ""
  else:
    Caller_info_data = Q.sender_info.info
    Caller_info_signer = Signing_canister_id
else:
  Caller_info_data = ""
  Caller_info_signer = ""

```

Query response `R`:

-   if `composite_query_helper(S, MAX_CYCLES_PER_QUERY, 0, Q.canister_id, Q.sender, Caller_info_data, Caller_info_signer, Q.canister_id, Q.method_name, Q.arg) = (Reject (RejectCode, RejectMsg), _, S')` then
    ```
    {status: "rejected"; reject_code: RejectCode; reject_message: RejectMsg; error_code: <implementation-specific>, signatures: Sigs}
    ```

-   Else if `composite_query_helper(S, MAX_CYCLES_PER_QUERY, 0, Q.canister_id, Q.sender, Caller_info_data, Caller_info_signer, Q.canister_id, Q.method_name, Q.arg) = (Reply Res, _, S')` then
    ```
    {status: "replied"; reply: {arg: Res}, signatures: Sigs}
    ```

where the query `Q`, the response `R`, and a certificate `Cert` that is obtained by requesting the path `/subnet` in a **separate** read state request to `/api/v3/canister/<ECID>/read_state` satisfy the following:

```html

verify_response(Q, R, Cert) ∧ lookup(["time"], Cert) = Found S.system_time // or "recent enough"

```

State after

```html

S' with
    query_stats[Q.receiver] = S'.query_stats[Q.receiver] · {
        timestamp = S'.time[Q.receiver]
        num_instructions = <implementation-specific>
        request_payload_bytes = |Q.Arg|
        response_payload_bytes =
          if R.status = "rejected" then |R.reject_message|
          else |R.reply.arg|
    }

```

#### Certified state reads

:::note

Requesting paths with the prefix `/subnet` at `/api/v3/canister/<ECID>/read_state` might be deprecated in the future. Hence, users might want to point their requests for paths with the prefix `/subnet` to `/api/v3/subnet/<effective_subnet_id>/read_state`.

On the IC mainnet, the root subnet ID `tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe` can be used to retrieve the list of all IC mainnet's subnets by requesting the prefix `/subnet` at `/api/v3/subnet/tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe/read_state`.

:::

The user can read elements of the *state tree*, using a `read_state` request to `/api/v3/canister/<ECID>/read_state` or `/api/v3/subnet/<effective_subnet_id>/read_state`.

Submitted request to `/api/v3/canister/<ECID>/read_state`

```html

E : Envelope

```

Conditions  

```html

E.content = ReadState RS
TS = verify_envelope(E, RS.sender, S.system_time)
|E.content.nonce| <= 32
S.system_time <= RS.ingress_expiry or RS.sender = anonymous_id
∀ path ∈ RS.paths. may_read_path_for_canister(S, R.sender, path)
∀ (["request_status", Rid] · _) ∈ RS.paths.  ∀ R ∈ dom(S.requests). hash_of_map(R) = Rid => R.canister_id ∈ TS

```

Read response  
A record with

-   `{certificate: C}`

The predicate `may_read_path_for_canister` is defined as follows, implementing the access control outlined in [Request: Read state](./https-interface.md#http-read-state):
```
may_read_path_for_canister(S, _, ["time"]) = True
may_read_path_for_canister(S, _, ["subnet"]) = True
may_read_path_for_canister(S, _, ["subnet", sid]) = True
may_read_path_for_canister(S, _, ["subnet", sid, "public_key"]) = True
may_read_path_for_canister(S, _, ["subnet", sid, "type"]) = True
may_read_path_for_canister(S, _, ["subnet", sid, "canister_ranges"]) = sid == root_subnet_id
may_read_path_for_canister(S, _, ["subnet", sid, "node"]) = True
may_read_path_for_canister(S, _, ["subnet", sid, "node", nid]) = True
may_read_path_for_canister(S, _, ["subnet", sid, "node", nid, "public_key"]) = True
may_read_path_for_canister(S, _, ["request_status", Rid]) =
may_read_path_for_canister(S, _, ["request_status", Rid, "status"]) =
may_read_path_for_canister(S, _, ["request_status", Rid, "reply"]) =
may_read_path_for_canister(S, _, ["request_status", Rid, "reject_code"]) =
may_read_path_for_canister(S, _, ["request_status", Rid, "reject_message"]) =
may_read_path_for_canister(S, _, ["request_status", Rid, "error_code"]) =
  ∀ (R ↦ (_, ECID')) ∈ dom(S.requests). hash_of_map(R) = Rid => RS.sender == R.sender ∧ ECID == ECID'
may_read_path_for_canister(S, _, ["canister", cid, "module_hash"]) = cid == ECID
may_read_path_for_canister(S, _, ["canister", cid, "controllers"]) = cid == ECID
may_read_path_for_canister(S, _, ["canister", cid, "metadata", name]) = cid == ECID ∧ UTF8(name) ∧
  (cid ∉ dom(S.canisters[cid]) ∨
   S.canisters[cid] = EmptyCanister ∨
   name ∉ (dom(S.canisters[cid].public_custom_sections) ∪ dom(S.canisters[cid].private_custom_sections)) ∨
   name ∈ dom(S.canisters[cid].public_custom_sections) ∨
   (name ∈ dom(S.canisters[cid].private_custom_sections) ∧ RS.sender ∈ S.controllers[cid])
  )
may_read_path_for_canister(S, _, _) = False
```

where `UTF8(name)` holds if `name` is encoded in UTF-8.

Submitted request to `/api/v3/subnet/<effective_subnet_id>/read_state`

```html

E : Envelope

```

Conditions  

```html

E.content = ReadState RS
verify_envelope(E, RS.sender, S.system_time)
|E.content.nonce| <= 32
S.system_time <= RS.ingress_expiry
∀ path ∈ RS.paths. may_read_path_for_subnet(S, RS.sender, path)

```

Read response  
A record with

-   `{certificate: C}`


The predicate `may_read_path_for_subnet` is defined as follows, implementing the access control outlined in [Request: Read state](./https-interface.md#http-read-state):
```
may_read_path_for_subnet(S, _, ["time"]) = True
may_read_path_for_subnet(S, _, ["canister_ranges", sid]) = True
may_read_path_for_subnet(S, _, ["subnet"]) = True
may_read_path_for_subnet(S, _, ["subnet", sid]) = True
may_read_path_for_subnet(S, _, ["subnet", sid, "public_key"]) = True
may_read_path_for_subnet(S, _, ["subnet", sid, "type"]) = True
may_read_path_for_subnet(S, _, ["subnet", sid, "canister_ranges"]) = sid == root_subnet_id
may_read_path_for_subnet(S, _, ["subnet", sid, "metrics"]) = sid == <effective_subnet_id>
may_read_path_for_subnet(S, _, ["subnet", sid, "node"]) = True
may_read_path_for_subnet(S, _, ["subnet", sid, "node", nid]) = True
may_read_path_for_subnet(S, _, ["subnet", sid, "node", nid, "public_key"]) = True
may_read_path_for_subnet(S, _, _) = False
```
The response is a certificate `cert`, as specified in [Certification](./certification.md#certification), which passes `verify_cert` (assuming `S.root_key` as the root of trust), and where for every `path` documented in [The system state tree](./index.md#state-tree) that has a path in `RS.paths` or `["time"]` as a prefix, we have
```
lookup_in_tree(path, cert.tree) = lookup_in_tree(path, state_tree(S))
```
where `state_tree` constructs a labeled tree from the IC state `S` and the (so far underspecified) set of subnets `subnets`, as per [The system state tree](./index.md#state-tree)
```
state_tree(S) = {
  "time": S.system_time;
  "canister_ranges": { subnet_id : { canister_id : ranges | the lexicographically sorted list of ranges in subnet_ranges is split into chunks starting at canister_id } | (subnet_id, _, subnet_ranges, _) ∈ subnets };
  "subnet": { subnet_id : { "public_key" : subnet_pk; "type" : <implementation-specific> ; "metrics" : <implementation-specific>; "node": { node_id : { "public_key" : node_pk } | (node_id, node_pk) ∈ subnet_nodes } } | (subnet_id, subnet_pk, subnet_ranges, subnet_nodes) ∈ subnets };
  "subnet": { subnet_id : { "canister_ranges" : subnet_ranges } | (subnet_id, _, subnet_ranges, _) ∈ subnets ∧ subnet_id == root_subnet_id };
  "request_status": { request_id(R): request_status_tree(T) | (R ↦ (T, _)) ∈ S.requests };
  "canister":
    { canister_id :
        { "module_hash" : SHA256(C.raw_module) | if C ≠ EmptyCanister } ∪
        { "controllers" : CBOR(S.controllers[canister_id]) } ∪
        { "metadata": { name: blob | (name, blob) ∈ S.canisters[canister_id].public_custom_sections ∪ S.canisters[canister_id].private_custom_sections } }
    | (canister_id, C) ∈ S.canisters };
}

request_status_tree(Received) =
  { "status": "received" }
request_status_tree(Processing) =
  { "status": "processing" }
request_status_tree(Rejected (code, msg)) =
  { "status": "rejected"; "reject_code": code; "reject_message": msg; "error_code": <implementation-specific>}
request_status_tree(Replied arg) =
  { "status": "replied"; "reply": arg }
request_status_tree(Done) =
  { "status": "done" }
```

and where `lookup_in_tree` is a function that returns `Found v` for a value `v`, `Absent`, or `Error`, appropriately. See the Section [Lookup](./certification.md#lookup) for more details.

### Abstract Canisters to System API {#concrete-canisters}

In Section [Abstract canisters](#abstract-canisters) we introduced an abstraction over the interface to a canister, to avoid cluttering the abstract specification of the Internet Computer from WebAssembly details. In this section, we will fill the gap and explain how the abstract canister interface maps to the [concrete System API](./canister-interface.md#system-api) and the WebAssembly concepts as defined in the [WebAssembly specification](https://webassembly.github.io/spec/core/index.html).

#### The concrete `Callback`

The abstract `Callback` type above models an entry point for responses:
```
I ∈ {i32, i64}
Closure = {
    fun   : I,
    env   : I,
}
Callback = {
  on_reply : Closure;
  on_reject : Closure;
  on_cleanup : Closure | NoClosure;
}
```

#### The execution state

We can model the execution of WebAssembly functions as stateful functions that have access to the WASM memory (a.k.a. heap) and (exported or mutable) globals in `WasmState`. In order to also model the behavior of the system imports, which have access to additional data structures, we extend the state as follows:
```
Params = {
  arg : NoArg | Blob;
  caller : Principal;
  caller_info_data : Blob;
  caller_info_signer : Blob;
  reject_code : 0 | SYS_FATAL | SYS_TRANSIENT | …;
  reject_message : Text;
  sysenv : Env;
  cycles_refunded : Nat;
  method_name : NoText | Text;
  deadline : NoDeadline | Timestamp;
}
ExecutionState = {
  wasm_state : WasmState;
  params : Params;
  response : NoResponse | Response;
  cycles_accepted : Nat;
  cycles_available : Nat;
  cycles_used : Nat;
  balance : Nat;
  reply_params : { arg : Blob };
  pending_call : MethodCall | NoPendingCall;
  calls : List MethodCall;
  new_certified_data : NoCertifiedData | Blob;
  new_global_timer : NoGlobalTimer | Nat;
  ingress_filter : Accept | Reject;
  context : I | G | U | Q | CQ | Ry | Rt | CRy | CRt | C | CC | F | T | s;
}
```

This allows us to model WebAssembly functions, including host-provided imports, as functions with implicit mutable access to an `ExecutionState`, dubbed *execution functions*. Syntactically, we express this using an implicit argument of type `ref ExecutionState` in angle brackets (e.g. `func<es>(x)` for the invocation of a WebAssembly function with type `(x : i32) -> ()`). The lifetime of the `ExecutionState` data structure is that of one such function invocation.

The "liquid" balance of a canister with a given `ExecutionState` can be obtained as follows:
```
liquid_balance(es) =
  liquid_balance(
    es.balance,
    es.params.sysenv.reserved_balance,
    freezing_limit(
      es.params.sysenv.compute_allocation,
      es.params.sysenv.memory_allocation,
      es.params.sysenv.freezing_threshold,
      memory_usage_wasm_state(es.wasm_state) +
        es.params.sysenv.memory_usage_raw_module +
        es.params.sysenv.memory_usage_canister_history +
        es.params.sysenv.memory_usage_chunk_store +
        es.params.sysenv.memory_usage_snapshots,
      es.params.sysenv.subnet_size,
    )
  )
```

-   For more convenience when creating a new `ExecutionState`, we define the following partial records:
    ```
    empty_params = {
      arg = NoArg;
      caller = ic_principal;
      caller_info_data = "";
      caller_info_signer = "";
      reject_code = 0;
      reject_message = "";
      sysenv = (undefined);
      cycles_refunded = 0;
      method_name = NoText;
      deadline = NoDeadline;
    }
    empty_execution_state = {
      wasm_state = (undefined);
      params = (undefined);
      response = NoResponse;
      cycles_accepted = 0;
      cycles_available = 0;
      cycles_used = 0;
      balance = 0;
      reply_params = { arg = "" };
      pending_call = NoPendingCall;
      calls = [];
      new_certified_data = NoCertifiedData;
      new_global_timer = NoGlobalTimer;
      ingress_filter = Reject;
      context = (undefined);
    }
    ```

#### The concrete `CanisterModule`

Finally, we can specify the abstract `CanisterModule` that models a concrete WebAssembly module.

-   We define the initial values `initial_globals` of the (exported or mutable) globals declared in the WebAssembly module.

-   We define a helper `table` which is an array of all functions of the WebAssembly module listed in its (unique according to Section [WebAssembly module requirements](./canister-interface.md#system-api-module)) table.

-   We define a helper function
    ```
    start : (WasmState) -> Trap { cycles_used : Nat; } | Return {
        new_state : WasmState;
        cycles_used : Nat;
      }
    ```

    modelling execution of a potential `(start)` function.

    If the WebAssembly module does not export a function called under the name `start`, then
    ```
    start = λ (wasm_state) →
      Return {
        new_state = wasm_state;
        cycles_used = 0;
      }
    ```

    Otherwise, if the WebAssembly module exports a function `func` under the name `start`, it is
    ```
    start = λ (wasm_state) →
      let es = ref {empty_execution_state with
        wasm_state = wasm_state;
        context = s;
      }
      try func<es>() with Trap then Trap {cycles_used = es.cycles_used;}
      Return {
        new_state = es.wasm_state;
        cycles_used = es.cycles_used;
      }
    ```

    Note that `params` are undefined in the `(start)` function's execution state which is fine because the System API does not have access to that part of the execution state during the execution of the `(start)` function.

-   The `init` field of the `CanisterModule` is defined as follows:

    If the WebAssembly module does not export a function called under the name `canister_init`, then
    ```
    init = λ (self_id, arg, caller, sysenv) →
      match start({wasm_memory = ""; stable_memory = ""; globals = initial_globals; self_id = self_id;}) with
        Trap trap → Trap trap
        Return res → Return {
            new_state = res.wasm_state;
            new_certified_data = NoCertifiedData;
            new_global_timer = NoGlobalTimer;
            cycles_used = res.cycles_used;
          }
    ```

    Otherwise, if the WebAssembly module exports a function `func` under the name `canister_init`, it is
    ```
    init = λ (self_id, arg, caller, sysenv) →
      match start({wasm_memory = ""; stable_memory = ""; globals = initial_globals; self_id = self_id;}) with
        Trap trap → Trap trap
        Return res →
          let es = ref {empty_execution_state with
              wasm_state = res.wasm_state
              params = empty_params with {
                  arg = arg;
                  caller = caller;
                  sysenv = sysenv with {
                      balance = sysenv.balance - res.cycles_used
                    }
                }
              balance = sysenv.balance - res.cycles_used
              context = I
            }
          try func<es>() with Trap then Trap {cycles_used = res.cycles_used + es.cycles_used;}
          Return {
              new_state = es.wasm_state;
              new_certified_data = es.new_certified_data;
              new_global_timer = es.new_global_timer;
              cycles_used = res.cycles_used + es.cycles_used;
            }
    ```

-   The `pre_upgrade` field of the `CanisterModule` is defined as follows:

    If the WebAssembly module does not export a function called under the name `canister_pre_upgrade`, then it simply returns the current state:
    ```
    pre_upgrade = λ (old_state, caller, sysenv) → Return {new_state = old_state; new_certified_data = NoCertifiedData; cycles_used = 0;}
    ```

    Otherwise, if the WebAssembly module exports a function `func` under the name `canister_pre_upgrade`, it is
    ```
    pre_upgrade = λ (old_state, caller, sysenv) →
      let es = ref {empty_execution_state with
          wasm_state = old_state
          params = empty_params with { caller = caller; sysenv }
          balance = sysenv.balance
          context = G
        }
      try func<es>() with Trap then Trap {cycles_used = es.cycles_used;}
      Return {
        new_state = es.wasm_state;
        new_certified_data = es.new_certified_data;
        cycles_used = es.cycles_used;
      }
    ```

-   The `post_upgrade` field of the `CanisterModule` is defined as follows:

    If the WebAssembly module does not export a function called under the name `canister_post_upgrade`, then
    ```
    post_upgrade = λ (wasm_state, arg, caller, sysenv) →
      match start(wasm_state) with
        Trap trap → Trap trap
        Return res → Return {
            new_state = res.wasm_state;
            new_certified_data = NoCertifiedData;
            new_global_timer = NoGlobalTimer;
            cycles_used = res.cycles_used;
          }
    ```

    Otherwise, if the WebAssembly module exports a function `func` under the name `canister_post_upgrade`, it is
    ```
    post_upgrade = λ (wasm_state, arg, caller, sysenv) →
      match start(wasm_state) with
        Trap trap → Trap trap
        Return res →
          let es = ref {empty_execution_state with
              wasm_state = res.wasm_state
              params = empty_params with {
                  arg = arg;
                  caller = caller;
                  sysenv = sysenv with {
                      balance = sysenv.balance - res.cycles_used
                    }
                }
              balance = sysenv.balance - res.cycles_used
              context = I
            }
          try func<es>() with Trap then Trap {cycles_used = res.cycles_used + es.cycles_used;}
          Return {
              new_state = es.wasm_state;
              new_certified_data = es.new_certified_data;
              new_global_timer = es.new_global_timer;
              cycles_used = res.cycles_used + es.cycles_used;
            }
    ```

-   The partial map `update_methods` of the `CanisterModule` is defined for all method names `method` for which the WebAssembly program exports a function `func` named `canister_update <method>`, and has value
    ```
    update_methods[method] = λ (arg, caller, caller_info_data, caller_info_signer, deadline, sysenv, available) → λ wasm_state →
      let es = ref {empty_execution_state with
          wasm_state = wasm_state;
          params = empty_params with {
              arg = arg;
              caller = caller;
              caller_info_data = caller_info_data;
              caller_info_signer = caller_info_signer;
              deadline = deadline;
              sysenv;
          }
          balance = sysenv.balance
          cycles_available = available;
          context = U
        }
      try func<es>() with Trap then Trap {cycles_used = es.cycles_used;}
      discard_pending_call<es>()
      Return {
        new_state = es.wasm_state;
        new_calls = es.calls;
        new_certified_data = es.new_certified_data;
        new_global_timer = es.new_global_timer;
        response = es.response;
        cycles_accepted = es.cycles_accepted;
        cycles_used = es.cycles_used;
      }
    ```

-   The partial map `query_methods` of the `CanisterModule` is defined for all method names `method` for which the WebAssembly program exports a function `func` named `canister_query <method>`, and has value
    ```
    query_methods[method] = λ (arg, caller, caller_info_data, caller_info_signer, sysenv, available) → λ wasm_state →
      let es = ref {empty_execution_state with
          wasm_state = wasm_state;
          params = empty_params with {
              arg = arg;
              caller = caller;
              caller_info_data = caller_info_data;
              caller_info_signer = caller_info_signer;
              sysenv
          }
          balance = sysenv.balance
          cycles_available = available
          context = Q
        }
      try func<es>() with Trap then Trap {cycles_used = es.cycles_used;}
      Return {
        response = es.response;
        cycles_accepted = es.cycles_accepted;
        cycles_used = es.cycles_used;
      }
    ```

    By construction, the (possibly modified) `es.wasm_state` is discarded.

-   The partial map `composite_query_methods` of the `CanisterModule` is defined for all method names `method` for which the WebAssembly program exports a function `func` named `canister_composite_query <method>`, and has value
    ```
    composite_query_methods[method] = λ (arg, caller, caller_info_data, caller_info_signer, sysenv) → λ wasm_state →
      let es = ref {empty_execution_state with
          wasm_state = wasm_state;
          params = empty_params with {
              arg = arg;
              caller = caller;
              caller_info_data = caller_info_data;
              caller_info_signer = caller_info_signer;
              sysenv
          }
          balance = sysenv.balance
          context = CQ
        }
      try func<es>() with Trap then Trap {cycles_used = es.cycles_used;}
      discard_pending_call<es>()
      Return {
        new_state = es.wasm_state;
        new_calls = es.calls;
        response = es.response;
        cycles_used = es.cycles_used;
      }
    ```

-   The function `heartbeat` of the `CanisterModule` is defined if the WebAssembly program exports a function `func` named `canister_heartbeat`, and has value
    ```
    heartbeat = λ (sysenv) → λ wasm_state →
      let es = ref {empty_execution_state with
        wasm_state = wasm_state;
        params = empty_params with { arg = NoArg; caller = ic_principal; sysenv }
        balance = sysenv.balance
        context = T
      }
      try func<es>() with Trap then Trap {cycles_used = es.cycles_used;}
      discard_pending_call<es>()
      Return {
        new_state = es.wasm_state;
        new_calls = es.calls;
        new_certified_data = es.certified_data;
        new_global_timer = es.new_global_timer;
        cycles_used = es.cycles_used;
      }
    ```

    otherwise it is

```html

heartbeat = λ (sysenv) → λ wasm_state → Trap {cycles_used = 0;}

```

-   The function `global_timer` of the `CanisterModule` is defined if the WebAssembly program exports a function `func` named `canister_global_timer`, and has value
    ```
    global_timer = λ (sysenv) → λ wasm_state →
      let es = ref {empty_execution_state with
        wasm_state = wasm_state;
        params = empty_params with { arg = NoArg; caller = ic_principal; sysenv }
        balance = sysenv.balance
        context = T
      }
      try func<es>() with Trap then Trap {cycles_used = es.cycles_used;}
      discard_pending_call<es>()
      Return {
        new_state = es.wasm_state;
        new_calls = es.calls;
        new_certified_data = es.certified_data;
        new_global_timer = es.new_global_timer;
        cycles_used = es.cycles_used;
      }
    ```

    otherwise it is

```html

global_timer = λ (sysenv) → λ wasm_state → Trap {cycles_used = 0;}

```

-   The function `on_low_wasm_memory` of the `CanisterModule` is defined if the WebAssembly program exports a function `func` named `canister_on_low_wasm_memory`, and has value
    ```
    on_low_wasm_memory = λ (sysenv) → λ wasm_state →
      let es = ref {empty_execution_state with
        wasm_state = wasm_state;
        params = empty_params with { arg = NoArg; caller = ic_principal; sysenv }
        balance = sysenv.balance
        context = T
      }
      try func<es>() with Trap then Trap {cycles_used = es.cycles_used;}
      discard_pending_call<es>()
      Return {
        new_state = es.wasm_state;
        new_calls = es.calls;
        new_certified_data = es.certified_data;
        new_global_timer = es.new_global_timer;
        cycles_used = es.cycles_used;
      }
    ```

    otherwise it is

    ```html
    on_low_wasm_memory = λ (sysenv) → λ wasm_state → Trap {cycles_used = 0;}
    ```

-   The function `callbacks` of the `CanisterModule` is defined as follows
    ```
    I ∈ {i32, i64}
    callbacks = λ(callbacks, caller, caller_info_data, caller_info_signer, response, deadline, refunded_cycles, sysenv, available) → λ wasm_state →
      let params0 = empty_params with {
        caller = caller;
        caller_info_data = caller_info_data;
        caller_info_signer = caller_info_signer;
        sysenv;
        cycles_refunded = refund_cycles;
        deadline;
      }
      let (fun, env, params, context) = match response with
        Reply data ->
          (callbacks.on_reply.fun, callbacks.on_reply.env,
            { params0 with data}, Ry)
        Reject (reject_code, reject_message)->
          (callbacks.on_reject.fun, callbacks.on_reject.env,
            { params0 with reject_code; reject_message}, Rt)
      let es = ref {empty_execution_state with
        wasm_state = wasm_state;
        params = params;
        balance = sysenv.balance;
        cycles_available = available;
        context = context;
      }
      try
        if fun > |table| then Trap
        let func = table[fun]
        if typeof(func) ≠ func (I) -> () then Trap
        func<es>(env)
        discard_pending_call<es>()
        Return {
          new_state = es.wasm_state;
          new_calls = es.calls;
          new_certified_data = es.certified_data;
          new_global_timer = es.new_global_timer;
          response = es.response;
          cycles_accepted = es.cycles_accepted;
          cycles_used = es.cycles_used;
        }
      with Trap
        if callbacks.on_cleanup = NoClosure then Trap {cycles_used = es.cycles_used;}
        if callbacks.on_cleanup.fun > |table| then Trap {cycles_used = es.cycles_used;}
        let func = table[callbacks.on_cleanup.fun]
        if typeof(func) ≠ func (I) -> () then Trap {cycles_used = es.cycles_used;}

      let es' = ref { empty_execution_state with
        wasm_state = wasm_state;
        params = params;
        balance = sysenv.balance - es.cycles_used;
        context = C;
      }
      try func<es'>(callbacks.on_cleanup.env) with Trap then Trap {cycles_used = es.cycles_used + es'.cycles_used;}
      Return {
        new_state = es'.wasm_state;
        new_calls = [];
        new_certified_data = NoCertifiedData;
        new_global_timer = es'.new_global_timer;
        response = NoResponse;
        cycles_accepted = 0;
        cycles_used = es.cycles_used + es'.cycles_used;
      }
    ```

    Note that if the initial callback handler traps, the cleanup callback (if present) is executed, and the canister has the chance to update its state.

-   The function `composite_callbacks` of the `CanisterModule` is defined as follows
    ```
    I ∈ {i32, i64}
    composite_callbacks = λ(callbacks, caller, caller_info_data, caller_info_signer, response, sysenv) → λ wasm_state →
      let params0 = empty_params with {
        caller = caller;
        caller_info_data = caller_info_data;
        caller_info_signer = caller_info_signer;
        sysenv
      }
      let (fun, env, params, context) = match response with
        Reply data ->
          (callbacks.on_reply.fun, callbacks.on_reply.env,
            { params0 with data}, CRy)
        Reject (reject_code, reject_message)->
          (callbacks.on_reject.fun, callbacks.on_reject.env,
            { params0 with reject_code; reject_message}, CRt)
      let es = ref {empty_execution_state with
        wasm_state = wasm_state;
        params = params;
        balance = sysenv.balance;
        context = context;
      }
      try
        if fun > |table| then Trap
        let func = table[fun]
        if typeof(func) ≠ func (I) -> () then Trap
        func<es>(env)
        discard_pending_call<es>()
        Return {
          new_state = es.wasm_state;
          new_calls = es.calls;
          response = es.response;
          cycles_used = es.cycles_used;
        }
      with Trap
        if callbacks.on_cleanup = NoClosure then Trap {cycles_used = es.cycles_used;}
        if callbacks.on_cleanup.fun > |table| then Trap {cycles_used = es.cycles_used;}
        let func = table[callbacks.on_cleanup.fun]
        if typeof(func) ≠ func (I) -> () then Trap {cycles_used = es.cycles_used;}

      let es' = ref { empty_execution_state with
        wasm_state = wasm_state;
        params = params;
        balance = sysenv.balance - es.cycles_used;
        context = CC;
      }
      try func<es'>(callbacks.on_cleanup.env) with Trap then Trap {cycles_used = es.cycles_used + es'.cycles_used;}
      Return {
        new_state = es'.wasm_state;
        new_calls = [];
        response = NoResponse;
        cycles_used = es.cycles_used + es'.cycles_used;
      }
    ```

    Note that if the initial callback handler traps, the cleanup callback (if present) is executed.

-   The `inspect_message` field of the `CanisterModule` is defined as follows.

    If the WebAssembly module does not export a function called under the name `canister_inspect_message`, then access is always granted:
    ```
    inspect_message = λ (method_name, wasm_state, arg, caller, caller_info_data, caller_info_signer, sysenv) →
      Return {status = Accept;}
    ```

    Otherwise, if the WebAssembly module exports a function `func` under the name `canister_inspect_message`, it is
    ```
    inspect_message = λ (method_name, wasm_state, arg, caller, caller_info_data, caller_info_signer, sysenv) →
      let es = ref {empty_execution_state with
          wasm_state = wasm_state;
          params = empty_params with {
            arg = arg;
            caller = caller;
            caller_info_data = caller_info_data;
            caller_info_signer = caller_info_signer;
            method_name = method_name;
            sysenv
          }
          balance = sysenv.balance;
          cycles_available = 0; // ingress requests have no funds
          context = F;
        }
       try func<es>() with Trap then Trap
       Return {status = es.ingress_filter;};
    ```

#### Helper functions

In the following section, we use the these helper functions
```
I ∈ {i32, i64}
copy_to_canister<es>(dst : I, offset : I, size : I, data : blob) =
  if offset+size > |data| then Trap {cycles_used = es.cycles_used;}
  if dst+size > |es.wasm_state.wasm_memory| then Trap {cycles_used = es.cycles_used;}
  es.wasm_state.wasm_memory[dst..dst+size] := data[offset..offset+size]

I ∈ {i32, i64}
copy_from_canister<es>(src : I, size : I) blob =
  if src+size > |es.wasm_state.wasm_memory| then Trap {cycles_used = es.cycles_used;}
  return es.wasm_state.wasm_memory[src..src+size]
```

Cycles are represented by 128-bit values so they require 16 bytes of memory.
```
I ∈ {i32, i64}
copy_cycles_to_canister<es>(dst : I, data : blob) =
  let size = 16;
  if dst+size > |es.wasm_state.wasm_memory| then Trap {cycles_used = es.cycles_used;}
  es.wasm_state.wasm_memory[dst..dst+size] := data[0..size]
```

Helper function to get sorted keys from environment variables map.
```
get_sorted_env_keys<es>(env_vars : (text -> text)) =
  let keys = []
  for (key, _) in env_vars:
    keys := keys · [key]
  return sort_lexicographically(keys)
```

#### System imports

Upon *instantiation* of the WebAssembly module, we can provide the following functions as imports.

The pseudo-code below does *not* explicitly enforce the restrictions of which imports are available in which contexts; for that the table in [Overview of imports](./canister-interface.md#system-api-imports) is authoritative, and is assumed to be part of the implementation.
```
I ∈ {i32, i64}
ic0.msg_arg_data_size<es>() : I =
  if es.context ∉ {I, U, RQ, NRQ, TQ, CQ, Ry, CRy, F} then Trap {cycles_used = es.cycles_used;}
  return |es.params.arg|

I ∈ {i32, i64}
ic0.msg_arg_data_copy<es>(dst : I, offset : I, size : I) =
  if es.context ∉ {I, U, RQ, NRQ, TQ, CQ, Ry, CRy, F} then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.params.arg)

I ∈ {i32, i64}
ic0.msg_caller_size() : I =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  return |es.params.caller|

I ∈ {i32, i64}
ic0.msg_caller_copy(dst : I, offset : I, size : I) =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.params.caller)

I ∈ {i32, i64}
ic0.msg_caller_info_data_size<es>() : I =
  if es.context ∉ {U, RQ, NRQ, CQ, Ry, Rt, CRy, CRt, C, CC, F} then Trap {cycles_used = es.cycles_used;}
  return |es.params.caller_info_data|

I ∈ {i32, i64}
ic0.msg_caller_info_data_copy(dst : I, offset : I, size : I) =
  if es.context ∉ {U, RQ, NRQ, CQ, Ry, Rt, CRy, CRt, C, CC, F} then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.params.caller_info_data)

I ∈ {i32, i64}
ic0.msg_caller_info_signer_size<es>() : I =
  if es.context ∉ {U, RQ, NRQ, CQ, Ry, Rt, CRy, CRt, C, CC, F} then Trap {cycles_used = es.cycles_used;}
  return |es.params.caller_info_signer|

I ∈ {i32, i64}
ic0.msg_caller_info_signer_copy(dst : I, offset : I, size : I) =
  if es.context ∉ {U, RQ, NRQ, CQ, Ry, Rt, CRy, CRt, C, CC, F} then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.params.caller_info_signer)

ic0.msg_reject_code<es>() : i32 =
  if es.context ∉ {Ry, Rt, CRy, CRt, C} then Trap {cycles_used = es.cycles_used;}
  es.params.reject_code

I ∈ {i32, i64}
ic0.msg_reject_msg_size<es>() : I =
  if es.context ∉ {Rt, CRt} then Trap {cycles_used = es.cycles_used;}
  return |es.params.reject_msg|

I ∈ {i32, i64}
ic0.msg_reject_msg_copy<es>(dst : I, offset : I, size : I) =
  if es.context ∉ {Rt, CRt} then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.params.reject_msg)

ic0.msg_deadline<es>() : i64 =
    if es.context ∉ {U, Q, CQ, Ry, Rt, CRy, CRt} then Trap {cycles_used = es.cycles_used;}
    if es.params.deadline = Timestamp t
        then return t
        else return 0

I ∈ {i32, i64}
ic0.msg_reply_data_append<es>(src : I, size : I) =
  if es.context ∉ {U, RQ, NRQ, TQ, CQ, Ry, Rt, CRy, CRt} then Trap {cycles_used = es.cycles_used;}
  if es.response ≠ NoResponse then Trap {cycles_used = es.cycles_used;}
  es.reply_params.arg := es.reply_params.arg · copy_from_canister<es>(src, size)

ic0.msg_reply<es>() =
  if es.context ∉ {U, RQ, NRQ, TQ, CQ, Ry, Rt, CRy, CRt} then Trap {cycles_used = es.cycles_used;}
  if es.response ≠ NoResponse then Trap {cycles_used = es.cycles_used;}
  es.response := Reply (es.reply_params.arg)
  es.cycles_available := 0

I ∈ {i32, i64}
ic0.msg_reject<es>(src : I, size : I) =
  if es.context ∉ {U, RQ, NRQ, TQ, CQ, Ry, Rt, CRy, CRt} then Trap {cycles_used = es.cycles_used;}
  if es.response ≠ NoResponse then Trap {cycles_used = es.cycles_used;}
  es.response := Reject (CANISTER_REJECT, copy_from_canister<es>(src, size))
  es.cycles_available := 0

ic0.msg_cycles_available<es>() : i64 =
  if es.context ∉ {U, RQ, Rt, Ry} then Trap {cycles_used = es.cycles_used;}
  if es.cycles_available >= 2^64 then Trap {cycles_used = es.cycles_used;}
  return es.cycles_available

I ∈ {i32, i64}
ic0.msg_cycles_available128<es>(dst : I) =
  if es.context ∉ {U, RQ, Rt, Ry} then Trap {cycles_used = es.cycles_used;}
  let amount = es.cycles_available
  copy_cycles_to_canister<es>(dst, amount.to_little_endian_bytes())

ic0.msg_cycles_refunded<es>() : i64 =
  if es.context ∉ {Rt, Ry} then Trap {cycles_used = es.cycles_used;}
  if es.params.cycles_refunded >= 2^64 then Trap {cycles_used = es.cycles_used;}
  return es.params.cycles_refunded

I ∈ {i32, i64}
ic0.msg_cycles_refunded128<es>(dst : I) =
  if es.context ∉ {Rt, Ry} then Trap {cycles_used = es.cycles_used;}
  let amount = es.params.cycles_refunded
  copy_cycles_to_canister<es>(dst, amount.to_little_endian_bytes())

ic0.msg_cycles_accept<es>(max_amount : i64) : i64 =
  if es.context ∉ {U, RQ, Rt, Ry} then Trap {cycles_used = es.cycles_used;}
  let amount = min(max_amount, es.cycles_available)
  es.cycles_available := es.cycles_available - amount
  es.cycles_accepted := es.cycles_accepted + amount
  es.balance := es.balance + amount
  return amount

I ∈ {i32, i64}
ic0.msg_cycles_accept128<es>(max_amount_high : i64, max_amount_low : i64, dst : I) =
  if es.context ∉ {U, RQ, Rt, Ry} then Trap {cycles_used = es.cycles_used;}
  let max_amount = max_amount_high * 2^64 + max_amount_low
  let amount = min(max_amount, es.cycles_available)
  es.cycles_available := es.cycles_available - amount
  es.cycles_accepted := es.cycles_accepted + amount
  es.balance := es.balance + amount
  copy_cycles_to_canister<es>(dst, amount.to_little_endian_bytes())

I ∈ {i32, i64}
ic0.cycles_burn128<es>(amount_high : i64, amount_low : i64, dst : I) =
  if es.context ∉ {I, G, U, RQ, Ry, Rt, C, T} then Trap {cycles_used = es.cycles_used;}
  let amount = amount_high * 2^64 + amount_low
  let burned_amount = min(amount, liquid_balance(es))
  es.balance := es.balance - burned_amount
  copy_cycles_to_canister<es>(dst, burned_amount.to_little_endian_bytes())

I ∈ {i32, i64}
ic0.canister_self_size<es>() : I =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  return |es.wasm_state.self_id|

I ∈ {i32, i64}
ic0.canister_self_copy<es>(dst : I, offset : I, size : I) =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.wasm_state.self_id)

I ∈ {i32, i64}
ic0.subnet_self_size<es>() : I =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  return |es.params.sysenv.subnet_id|

I ∈ {i32, i64}
ic0.subnet_self_copy<es>(dst : I, offset : I, size : I) =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.params.sysenv.subnet_id)

ic0.canister_cycle_balance<es>() : i64 =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  if es.balance >= 2^64 then Trap {cycles_used = es.cycles_used;}
  return es.balance

I ∈ {i32, i64}
ic0.canister_cycle_balance128<es>(dst : I) =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  let amount = es.balance
  copy_cycles_to_canister<es>(dst, amount.to_little_endian_bytes())

I ∈ {i32, i64}
ic0.canister_liquid_cycle_balance128<es>(dst : I) =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  copy_cycles_to_canister<es>(dst, liquid_balance(es).to_little_endian_bytes())

ic0.canister_status<es>() : i32 =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  match es.params.sysenv.canister_status with
    Running  -> return 1
    Stopping -> return 2
    Stopped  -> return 3

ic0.canister_version<es>() : i64 =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  return es.params.sysenv.canister_version

I ∈ {i32, i64}
ic0.msg_method_name_size<es>() : I =
  if es.context ∉ {F} then Trap {cycles_used = es.cycles_used;}
  return |es.method_name|

I ∈ {i32, i64}
ic0.msg_method_name_copy<es>(dst : I, offset : I, size : I) =
  if es.context ∉ {F} then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.params.method_name)

ic0.accept_message<es>() =
  if es.context ∉ {F} then Trap {cycles_used = es.cycles_used;}
  if es.ingress_filter = Accept then Trap {cycles_used = es.cycles_used;}
  es.ingress_filter = Accept

I ∈ {i32, i64}
ic0.call_new<es>(
    callee_src  : I,
    callee_size : I,
    name_src    : I,
    name_size   : I,
    reply_fun   : I,
    reply_env   : I,
    reject_fun  : I,
    reject_env  : I,
  ) =
  if es.context ∉ {U, CQ, Ry, Rt, CRy, CRt, T} then Trap {cycles_used = es.cycles_used;}

  discard_pending_call<es>()

  callee := copy_from_canister<es>(callee_src, callee_size);
  method_name := copy_from_canister<es>(name_src, name_size);

  es.pending_call = MethodCall {
    callee = callee;
    method_name = callee;
    arg = "";
    transferred_cycles = 0;
    callback = Callback {
      on_reply = Closure { fun = reply_fun; env = reply_env }
      on_reject = Closure { fun = reject_fun; env = reject_env }
      on_cleanup = NoClosure
    };
  }

ic0.call_with_best_effort_response<es>(timeout_seconds : i32) =
  if
      es.context ∉ {U, CQ, Ry, Rt, CRy, CRt, T}
      or es.pending_call = NoPendingCall
      or es.pending_call.timeout_seconds ≠ NoTimeout
  then Trap {cycles_used = es.cycles_used;}
  es.pending_call.timeout_seconds := min(timeout_seconds, MAX_CALL_TIMEOUT)

I ∈ {i32, i64}
ic0.call_on_cleanup<es> (fun : I, env : I) =
  if es.context ∉ {U, CQ, Ry, Rt, CRy, CRt, T} then Trap {cycles_used = es.cycles_used;}
  if es.pending_call = NoPendingCall then Trap {cycles_used = es.cycles_used;}
  if es.pending_call.callback.on_cleanup ≠ NoClosure then Trap {cycles_used = es.cycles_used;}
  es.pending_call.callback.on_cleanup := Closure { fun = fun; env = env}

I ∈ {i32, i64}
ic0.call_data_append<es> (src : I, size : I) =
  if es.context ∉ {U, CQ, Ry, Rt, CRy, CRt, T} then Trap {cycles_used = es.cycles_used;}
  if es.pending_call = NoPendingCall then Trap {cycles_used = es.cycles_used;}
  es.pending_call.arg := es.pending_call.arg · copy_from_canister<es>(src, size)

ic0.call_cycles_add<es>(amount : i64) =
  if es.context ∉ {U, Ry, Rt, T} then Trap {cycles_used = es.cycles_used;}
  if es.pending_call = NoPendingCall then Trap {cycles_used = es.cycles_used;}
  if liquid_balance(es) < amount then Trap {cycles_used = es.cycles_used;}

  es.balance := es.balance - amount
  es.pending_call.transferred_cycles := es.pending_call.transferred_cycles + amount

ic0.call_cycles_add128<es>(amount_high : i64, amount_low : i64) =
  if es.context ∉ {U, Ry, Rt, T} then Trap {cycles_used = es.cycles_used;}
  if es.pending_call = NoPendingCall then Trap {cycles_used = es.cycles_used;}
  let amount = amount_high * 2^64 + amount_low
  if liquid_balance(es) < amount then Trap {cycles_used = es.cycles_used;}

  es.balance := es.balance - amount
  es.pending_call.transferred_cycles := es.pending_call.transferred_cycles + amount

ic0.call_peform<es>() : ( err_code : i32 ) =
  if es.context ∉ {U, CQ, Ry, Rt, CRy, CRt, T} then Trap {cycles_used = es.cycles_used;}
  if es.pending_call = NoPendingCall then Trap {cycles_used = es.cycles_used;}

  // `system_cannot_do_this_call_now` abstracts over resource issues preventing the call from being made
  if liquid_balance(es) < MAX_CYCLES_PER_RESPONSE or system_cannot_do_this_call_now()
  then
    discard_pending_call<es>()
    return <implementation-specific>
  or
    es.balance := es.balance - MAX_CYCLES_PER_RESPONSE
    es.calls := es.calls · es.pending_call
    es.pending_call := NoPendingCall
    return 0

// helper function
discard_pending_call<es>() =
  if es.pending_call ≠ NoPendingCall then
    es.balance := es.balance + es.pending_call.transferred_cycles
    es.pending_call := NoPendingCall

ic0.stable_size<es>() : (page_count : i32) =
  if |es.wasm_state.wasm_memory| > 2^32 then Trap {cycles_used = es.cycles_used;}
  page_count := |es.wasm_state.stable_memory| / 64k
  return page_count

ic0.stable_grow<es>(new_pages : i32) : (old_page_count : i32) =
  if |es.wasm_state.wasm_memory| > 2^32 then Trap {cycles_used = es.cycles_used;}
  if arbitrary() then return -1
  else
    old_size := |es.wasm_state.stable_memory| / 64k
    if old_size + new_pages > 2^16 then return -1
    es.wasm_state.stable_memory :=
      es.wasm_state.stable_memory · repeat(0x00, new_pages * 64k)
    return old_size

ic0.stable_write<es>(offset : i32, src : i32, size : i32)
  if |es.wasm_state.wasm_memory| > 2^32 then Trap {cycles_used = es.cycles_used;}
  if src+size > |es.wasm_state.wasm_memory| then Trap {cycles_used = es.cycles_used;}
  if offset+size > |es.wasm_state.stable_memory| then Trap {cycles_used = es.cycles_used;}

  es.wasm_state.stable_memory[offset..offset+size] := es.wasm_state.wasm_memory[src..src+size]

ic0.stable_read<es>(dst : i32, offset : i32, size : i32)
  if |es.wasm_state.wasm_memory| > 2^32 then Trap {cycles_used = es.cycles_used;}
  if offset+size > |es.wasm_state.stable_memory| then Trap {cycles_used = es.cycles_used;}
  if dst+size > |es.wasm_state.wasm_memory| then Trap {cycles_used = es.cycles_used;}

  es.wasm_state.wasm_memory[offset..offset+size] := es.wasm_state.stable_memory[src..src+size]

ic0.stable64_size<es>() : (page_count : i64) =
  return |es.wasm_state.stable_memory| / 64k

ic0.stable64_grow<es>(new_pages : i64) : (old_page_count : i64) =
  if arbitrary()
  then return -1
  else
    old_size := |es.wasm_state.stable_memory| / 64k
    es.wasm_state.stable_memory :=
      es.wasm_state.stable_memory · repeat(0x00, new_pages * 64k)
    return old_size

ic0.stable64_write<es>(offset : i64, src : i64, size : i64)
  if src+size > |es.wasm_state.wasm_memory| then Trap {cycles_used = es.cycles_used;}
  if offset+size > |es.wasm_state.stable_memory| then Trap {cycles_used = es.cycles_used;}

  es.wasm_state.stable_memory[offset..offset+size] := es.wasm_state.wasm_memory[src..src+size]

ic0.stable64_read<es>(dst : i64, offset : i64, size : i64)
  if offset+size > |es.wasm_state.stable_memory| then Trap {cycles_used = es.cycles_used;}
  if dst+size > |es.wasm_state.wasm_memory| then Trap {cycles_used = es.cycles_used;}

  es.wasm_state.wasm_memory[offset..offset+size] := es.wasm_state.stable_memory[src..src+size]

I ∈ {i32, i64}
ic0.root_key_size<es>() : I =
  if es.context ∉ {I, G, U, RQ, Ry, Rt, C, T} then Trap {cycles_used = es.cycles_used;}
  let root_key = <implementation-specific>
  return |root_key|

I ∈ {i32, i64}
ic0.root_key_copy<es>(dst : I, offset : I, size : I) =
  if es.context ∉ {I, G, U, RQ, Ry, Rt, C, T} then Trap {cycles_used = es.cycles_used;}
  let root_key = <implementation-specific>
  copy_to_canister<es>(dst, offset, size, root_key)

I ∈ {i32, i64}
ic0.certified_data_set<es>(src : I, size : I) =
  if es.context ∉ {I, G, U, Ry, Rt, T} then Trap {cycles_used = es.cycles_used;}
  es.new_certified_data := es.wasm_state[src..src+size]

ic0.data_certificate_present<es>() : i32 =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  if es.params.sysenv.certificate = NoCertificate
  then return 0
  else return 1

I ∈ {i32, i64}
ic0.data_certificate_size<es>() : I =
  if es.context ∉ {NRQ, CQ} then Trap {cycles_used = es.cycles_used;}
  if es.params.sysenv.certificate = NoCertificate then Trap {cycles_used = es.cycles_used;}
  return |es.params.sysenv.certificate|

I ∈ {i32, i64}
ic0.data_certificate_copy<es>(dst : I, offset : I, size : I) =
  if es.context ∉ {NRQ, CQ} then Trap {cycles_used = es.cycles_used;}
  if es.params.sysenv.certificate = NoCertificate then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, es.params.sysenv.certificate)

ic0.time<es>() : i64 =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  return es.params.sysenv.time

ic0.global_timer_set<es>(timestamp: i64) : i64 =
  if es.context ∉ {I, G, U, Ry, Rt, C, T} then Trap {cycles_used = es.cycles_used;}
  let prev_global_timer = es.new_global_timer
  es.new_global_timer := timestamp
  if prev_global_timer = NoGlobalTimer
  then return es.params.sysenv.global_timer
  else return prev_global_timer

ic0.performance_counter<es>(counter_type : i32) : i64 =
  arbitrary()

I ∈ {i32, i64}
ic0.is_controller<es>(src : I, size : I) : (result: i32) =
  bytes = copy_from_canister<es>(src, size)
  if bytes encode a principal then
    if bytes ∉ es.params.sysenv.controllers
    then return 0
    else return 1
  else
    Trap {cycles_used = es.cycles_used;}

ic0.in_replicated_execution<es>() : i32 =
  if es.context ∈ {I, G, U, RQ, Ry, Rt, C, T, s}
  then return 1
  else return 0

I ∈ {i32, i64}
ic0.cost_call<es>(method_name_size: i64, payload_size: i64, dst: I) : () = 
  copy_cycles_to_canister<es>(dst, arbitrary())

I ∈ {i32, i64}
ic0.cost_create_canister<es>(dst: I) : () = 
  copy_cycles_to_canister<es>(dst, arbitrary())

I ∈ {i32, i64}
ic0.cost_http_request<es>(request_size: i64, max_res_bytes: i64, dst: I) : () = 
  copy_cycles_to_canister<es>(dst, arbitrary())

I ∈ {i32, i64}
ic0.cost_sign_with_ecdsa<es>(src: I, size: I, ecdsa_curve: i32, dst: I) : i32 = 
  known_keys = arbitrary()
  known_curves = arbitrary()
  key_name = copy_from_canister<es>(src, size)
  if ecdsa_curve ∉ known_curves then
    return 1
  if key_name ∉ known_keys then
    return 2
  copy_cycles_to_canister<es>(dst, arbitrary())
  return 0

I ∈ {i32, i64}
ic0.cost_sign_with_schnorr<es>(src: I, size: I, algorithm: i32, dst: I) : i32 = 
  known_keys = arbitrary()
  known_algorithms = arbitrary()
  key_name = copy_from_canister<es>(src, size)
  if algorithm ∉ known_algorithms then
    return 1
  if key_name ∉ known_keys then
    return 2
  copy_cycles_to_canister<es>(dst, arbitrary())
  return 0

I ∈ {i32, i64}
ic0.cost_vetkd_derive_key<es>(src: I, size: I, vetkd_curve: i32, dst: I) : i32 = 
  known_keys = arbitrary()
  known_curves = arbitrary()
  key_name = copy_from_canister<es>(src, size)
  if vetkd_curve ∉ known_curves then
    return 1
  if key_name ∉ known_keys then
    return 2
  copy_cycles_to_canister<es>(dst, arbitrary())
  return 0

I ∈ {i32, i64}
ic0.env_var_count<es>() : I =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  return |es.params.sysenv.environment_variables|

I ∈ {i32, i64}
ic0.env_var_name_size<es>(index : I) : I =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  if index >= |es.params.sysenv.environment_variables| then Trap {cycles_used = es.cycles_used;}
  let sorted_keys = get_sorted_env_keys<es>(es.params.sysenv.environment_variables)
  return |sorted_keys[index]|

I ∈ {i32, i64}
ic0.env_var_name_copy<es>(index : I, dst : I, offset : I, size : I) =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  if index >= |es.params.sysenv.environment_variables| then Trap {cycles_used = es.cycles_used;}
  let sorted_keys = get_sorted_env_keys<es>(es.params.sysenv.environment_variables)
  let name_var = sorted_keys[index]
  copy_to_canister<es>(dst, offset, size, name_var)

I ∈ {i32, i64}
ic0.env_var_name_exists<es>(name_src : I, name_size : I) : i32 =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  if name_size > MAX_ENV_VAR_NAME_LENGTH then Trap {cycles_used = es.cycles_used;}
  let name_var = copy_from_canister<es>(name_src, name_size)
  if !is_valid_utf8(name_var) then Trap {cycles_used = es.cycles_used;}
  if value_var ∈ dom(es.params.sysenv.environment_variables) then
    return 1
  else 
    return 0

I ∈ {i32, i64}
ic0.env_var_value_size<es>(name_src : I, name_size : I) : I =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  if name_size > MAX_ENV_VAR_NAME_LENGTH then Trap {cycles_used = es.cycles_used;}
  let name_var = copy_from_canister<es>(name_src, name_size)
  if !is_valid_utf8(name_var) then Trap {cycles_used = es.cycles_used;}
  let value_var = es.params.sysenv.environment_variables[name_var]
  if value_var = null then Trap {cycles_used = es.cycles_used;}
  return |value_var|

I ∈ {i32, i64}
ic0.env_var_value_copy<es>(name_src : I, name_size : I, dst : I, offset : I, size : I) =
  if es.context = s then Trap {cycles_used = es.cycles_used;}
  if name_size > MAX_ENV_VAR_NAME_LENGTH then Trap {cycles_used = es.cycles_used;}
  let name_var = copy_from_canister<es>(name_src, name_size)
  if !is_valid_utf8(name_var) then Trap {cycles_used = es.cycles_used;}
  let value_var = es.params.sysenv.environment_variables[name_var]
  if value_var = null then Trap {cycles_used = es.cycles_used;}
  copy_to_canister<es>(dst, offset, size, value_var)

I ∈ {i32, i64}
ic0.debug_print<es>(src : I, size : I) =
  return

I ∈ {i32, i64}
ic0.trap<es>(src : I, size : I) =
  Trap {cycles_used = es.cycles_used;}
```

<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->
