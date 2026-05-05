---
title: "HTTPS Interface"
description: "HTTP endpoints for submitting calls, reading state, and querying canisters on the Internet Computer"
sidebar:
  label: "HTTPS Interface"
  order: 1
---

## HTTPS Interface {#http-interface}

The concrete mechanism that users use to send requests to the Internet Computer is via an HTTPS API, which exposes four endpoints to handle interactions, plus one for diagnostics:

-   At `/api/v2/canister/<effective_canister_id>/call`, the user can submit update calls that are asynchronous and might change the IC state.

-   At `/api/v3/canister/<effective_canister_id>/call` (deprecated) and `/api/v4/canister/<effective_canister_id>/call`, the user can submit update calls and get a synchronous HTTPS response with a certificate for the call status. At `/api/v4/subnet/<effective_subnet_id>/call`, the user can only submit the restricted subnet-scoped update call described by the [effective subnet id](#http-effective-subnet-id) rules.

-   At `/api/v2/canister/<effective_canister_id>/read_state` (deprecated), `/api/v2/subnet/<effective_subnet_id>/read_state` (deprecated), `/api/v3/canister/<effective_canister_id>/read_state`, and `/api/v3/subnet/<effective_subnet_id>/read_state`, the user can read various information about the state of the Internet Computer. In particular, they can poll for the status of a call here.

-   At `/api/v2/canister/<effective_canister_id>/query` (deprecated) and `/api/v3/canister/<effective_canister_id>/query`, the user can perform (synchronous, non-state-changing) query calls. At `/api/v3/subnet/<effective_subnet_id>/query`, the user can only perform the restricted subnet-scoped query call described by the [effective subnet id](#http-effective-subnet-id) rules.

-   At `/api/v2/status` the user can retrieve status information about the Internet Computer.

In these paths, the `<effective_canister_id>` is the [textual representation](./index.md#textual-ids) of the [*effective* canister id](#http-effective-canister-id) and the `<effective_subnet_id>` is the [textual representation](./index.md#textual-ids) of the [*effective* subnet id](#http-effective-subnet-id).

Requests to `/api/.../call`, `/api/.../read_state`, and `/api/.../query` are POST requests with a CBOR-encoded request body, which consists of a authentication envelope (as per [Authentication](#authentication)) and request-specific content as described below.

:::note

This document does not yet explain how to find the location and port of the Internet Computer.

:::

### Overview of canister calling {#http-call-overview}

Users interact with the Internet Computer by calling canisters. By the very nature of a blockchain protocol, they cannot be acted upon immediately, but only with a delay. Moreover, the actual node that the user talks to may not be honest or, for other reasons, may fail to get the request on the way.

The Internet Computer has two HTTPS APIs for canister calling:
- [*Asynchronous*](#http-async-call-overview) canister calling, where the user must poll the Internet Computer for the status of the canister call by _separate_ HTTPS requests.
- [*Synchronous*](#http-sync-call-overview) canister calling, where the status of the canister call is in the response of the original HTTPS request.

#### Asynchronous canister calling {#http-async-call-overview}

1.  A user submits a call via the [HTTPS Interface](#http-interface) and the call is received by a replica (a node belonging to an IC subnet). The receiving replica decides whether it accepts the call. An honest replica does so by checking that the target canister is not frozen and

  - checking that the target canister is not empty, checking that the target canister is running, and performing [ingress message inspection](./canister-interface.md#system-api-inspect-message) for calls to a regular canister;

  - checking that the management canister method can be called via ingress messages and that the caller is a controller of the target canister for calls to the management canister
    (or that the call targets the [IC Provisional API](./management-canister.md#ic-provisional-api) on a development instance).

  Moreover, the signature must be valid and created with a correct key.

  Finally, the system time (of the replica receiving the HTTP request) must not have exceeded the `ingress_expiry` field of the HTTP request containing the call.

  From this point on the user may receive a response from the IC about the status of the call. Only valid IC certificates in responses should be trusted, since responses come from a single replica that can be either honest or malicious. Note that a lack of a valid IC certificate doesn't necessarily mean that the responding replica is malicious; examples of responses that are expected to come without a certificate (and thus aren't necessarily trustworthy) include responses signalling that the message hasn't been accepted, and responses saying that the request is accepted for further processing.

  So far the corresponding IC subnet (as a whole) still behaves as if it does not know about the call.

  At some point, the IC subnet (as a whole) receives the call and sets its (certified) status to `received`.

  The above steps are formalized in this [transition](./abstract-behavior.md#api-request-submission).

2.  Once the IC starts processing the call, its (certified) status is set to `processing`. This transition can only happen before the target canister's time (as visible in the [state tree](./index.md#state-tree-time)) exceeds the [`ingress_expiry`](#http-call) field of the HTTP request which contained the call. Now the user has the guarantee that the call will have some effect.

3.  The IC is processing the call. For some calls this may be atomic, for others this involves multiple steps.

4.  Eventually, a response is produced and available in the (certified) [state tree](./index.md#state-tree-request-status) from which it can be retrieved for a certain amount of time. The response is either a `reply`, indicating success, or a `reject`, indicating some form of error.

5.  In case of high load on the IC, even if the call has not expired yet, the IC can forget the response data and only remember the call as `done`, to prevent a replay attack.

6.  Once the call's expiry time has passed, the IC can remove the call and its response from the (certified) [state tree](./index.md#state-tree-request-status) and thus completely forget about it.

This yields the following interaction diagram:
```plantuml
    (*) --> "User creates call" #DDDDDD
       --> "Submitted to node\n(with 202 response)" as submit #DDDDDD
       --> "received"
       --> "processing"
    if "" as X then
      --> "replied"
      --> "done"
      else
      --> "rejected (canister)"
      --> "done"

      "X"        --> "rejected (system)"
      "received" --> "rejected (system)"
                 --> "done"

      "received" --> "pruned" #DDDDDD
      "submit" --> "dropped" #DDDDDD
      "done" --> "pruned" #DDDDDD

    endif
```
State transitions may be instantaneous and not always externally visible. For example, the state of a request may move from `received` via `processing` to `replied` in one go. Similarly, the IC may not implement the `done` state at all, and keep calls in state `replied`/`rejected` until they are pruned.

All gray states are *not* explicitly represented in the state of the IC, and are indistinguishable from "call does not exist".

The characteristic property of the `received` state is that the call has made it past the (potentially malicious) endpoint *into the state of the IC*. It is now pointless (but harmless) to submit the (identical) call again. Before reaching that state, submitting the identical call to further nodes might be a useful safeguard against a malicious or misbehaving node.

The characteristic property of the `processing` state is that *the initial effect of the call has happened or will happen*. This is best explained by an example: Consider a counter canister. It exports a method `inc` that increases the counter. Assume that the canister is bug free, and is not going to be forcibly removed. A user submits a call to call `inc`. If the user sees request status `processing`, the state change is guaranteed to happen. The user can stop monitoring the status and does not have to retry submitting.

A call may be rejected by the IC or the canister. In either case, there is no guarantee about how much processing of the call has happened.

To avoid replay attacks, the transition from `done` or `received` to `pruned` must happen no earlier than the call's `ingress_expiry` field.
If a subnet's time strictly exceeds the call's `ingress_expiry` field, the subnet's time exceeds the call's `ingress_expiry` field by at most 5 minutes, and the call's status is unknown to the IC (i.e., it was never in state `received`, `processing`, `replied`, `rejected`, or `done`), then the call will never be in one of these states.

Calls should stay in `replied` or `rejected` for 5 minutes so that polling users can catch the response under good networking conditions
and low load on the IC. However, in case of high load on the IC, the IC can transition the call to `done` at any time.

When asking the IC about the state or call of a request, the user uses the request id (see [Request ids](#request-id)) to read the request status (see [Request status](./index.md#state-tree-request-status)) from the state tree (see [Request: Read state](#http-read-state)).

#### Synchronous canister calling {#http-sync-call-overview}

A synchronous update call, also known as a "call and await", is a type of update call where the replica will attempt to respond to the HTTPS request with a certificate of the call status. 
On the replica, a synchronous call request goes through the same states (`received`, `processing`, `replied`, `rejected`, or `done`) as the ones depicted for the [asynchronous API](#http-async-call-overview).
If the returned certificate indicates that the update call is in a terminal state (`replied`, `rejected`, or `done`), then the user __does not need to poll__ (using [`read_state`](#http-read-state) requests) 
to determine the result of the call. A terminal state means the call has completed its execution.

The synchronous call endpoint is useful for users as it reduces the networking overhead of polling the IC to determine the status of their call. 

The replica will maintain the HTTPS connection for the request and will respond once the call status transitions to a terminal state. 

If an implementation specific timeout for the request is reached while the replica waits for the terminal state, then the replica will reply with an empty body and a 202 HTTP status code. In such cases, the user should use [`read_state`](#http-read-state) to determine the status of the call.

### Request: Call {#http-call}

In order to call a canister, the user makes a POST request to `/api/v3/canister/<effective_canister_id>/call` (deprecated) or `/api/v4/canister/<effective_canister_id>/call`. The `/api/v4/subnet/<effective_subnet_id>/call` form is not a general-purpose call endpoint; it is only supported for canister creation calls to the Management Canister (`aaaaa-aa`). The request body consists of an authentication envelope with a `content` map with the following fields:

-   `request_type` (`text`): Always `call`

-   `canister_id` (`blob`): The principal of the canister to call.

-   `method_name` (`text`): Name of the canister method to call.

-   `arg` (`blob`): Argument to pass to the canister method.

-   `sender`, `nonce`, `ingress_expiry`: See [Authentication](#authentication). The canister will not start processing a call past its `ingress_expiry`. 

-   `sender_info` (`map`, optional): Map with fields:

    -   `info` (`blob`, required): The sender information passed to the canister.

    -   `signer` (`blob`, required): The principal of the signing canister. This must be equal to the canister ID encoded in the `sender_pubkey`, i.e. the `signing_canister_id` component of the canister signature public key, as described in [canister signature](./index.md#canister-signatures).

    -   `sig` (`blob`, required): Signature to authenticate the `info` field. This signature *must* be a [canister signature](./index.md#canister-signatures), using the 15 bytes `\x0Eic-sender-info` as the domain separator for the payload, and  *must* verify using `sender_pubkey` as the canister signature public key.

The HTTP response to this request can have the following forms:

-   200 HTTP status with a non-empty body. This status is returned if the canister call completed within an implementation-specific timeout or was rejected within an implementation-specific timeout.
    
    -   If the update call completed, a certificate for the state of the update call is produced, and returned in a CBOR (see [CBOR](./index.md#cbor)) map with the fields specified below:

        -   `status` (`text`): `"replied"`

        -   `certificate` (`blob`):  A certificate (see [Certification](./certification.md#certification)) with subtrees at `/request_status/<request_id>` and `/time`, where `<request_id>` is the [request ID](#request-id) of the update call. See [Request status](./index.md#state-tree-request-status) for more details on the request status.

    -   If a non-replicated pre-processing error occurred (e.g., due to the [canister inspect message](./canister-interface.md#system-api-inspect-message)), then a body with information about the IC specific error encountered is returned. The body is a CBOR map with the following fields:

        -   `status` (`text`): `"non_replicated_rejection"`

        -   `reject_code` (`nat`): The reject code (see [Reject codes](#reject-codes)).

        -   `reject_message` (`text`): a textual diagnostic message.

        -   `error_code` (`text`): an optional implementation-specific textual error code (see [Error codes](#error-codes)).

-   202 HTTP status with an empty body. This status is returned if an implementation-specific timeout is reached before the canister call completes. Users should use [`read_state`](#http-read-state) to determine the status of the call.

-   4xx HTTP status for client errors (e.g. malformed request). Except for 429 HTTP status, retrying the request will likely have the same outcome.

-   5xx HTTP status when the server has encountered an error or is otherwise incapable of performing the request. The request might succeed if retried at a later time.

If the `certificate` includes a subnet delegation (see [Delegation](./certification.md#certification-delegation)), then

- for requests to `/api/v3/canister/<effective_canister_id>/call`, the `<effective_canister_id>` must be included in a canister id range of the delegation's subnet id in the delegation's certificate at the path of the form `/subnet/<subnet_id>/canister_ranges`,

- for requests to `/api/v4/canister/<effective_canister_id>/call`, the `<effective_canister_id>` must be included in a canister id range of the delegation's subnet id in the delegation's certificate at a path with prefix `/canister_ranges/<subnet_id>`,

- for requests to `/api/v4/subnet/<effective_subnet_id>/call`, the `<effective_subnet_id>` must match the delegation's subnet id.

This request type can *also* be used to call a query method (but not a composite query method). A user may choose to go this way, instead of via the faster and cheaper [Request: Query call](#http-query) below, if they want to get a *certified* response. Note that the canister state will not be changed by sending a call request type for a query method (except for transient state such as cycle balance, canister logs, and canister version).

### Request: Asynchronous Call {#http-async-call}

In order to call a canister, the user makes a POST request to `/api/v2/canister/<effective_canister_id>/call`. The request body consists of an authentication envelope with a `content` map with the following fields:

-   `request_type` (`text`): Always `call`

-   `canister_id` (`blob`): The principal of the canister to call.

-   `method_name` (`text`): Name of the canister method to call

-   `arg` (`blob`): Argument to pass to the canister method

-   `sender`, `nonce`, `ingress_expiry`: See [Authentication](#authentication). The canister will not start processing a call past its `ingress_expiry`.

-   `sender_info` (`map`, optional): Map with fields:

    -   `info` (`blob`, required): The sender information passed to the canister.

    -   `signer` (`blob`, required): The principal of the signing canister. This must be equal to the canister ID encoded in the `sender_pubkey`, i.e. the `signing_canister_id` component of the canister signature public key, as described in [canister signature](./index.md#canister-signatures).

    -   `sig` (`blob`, required): Signature to authenticate the `info` field. This signature *must* be a [canister signature](./index.md#canister-signatures), using the 15 bytes `\x0Eic-sender-info` as the domain separator for the payload, and  *must* verify using `sender_pubkey` as the canister signature public key.

The HTTP response to this request can have the following responses:

-   202 HTTP status with empty body. Implying the request was accepted by the IC for further processing. Users should use [`read_state`](#http-read-state) to determine the status of the call.

-   200 HTTP status with non-empty body. Implying an execution pre-processing error occurred. The body of the response contains more information about the IC specific error encountered. The body is a CBOR map with the following fields:

    -   `reject_code` (`nat`): The reject code (see [Reject codes](#reject-codes)).

    -   `reject_message` (`text`): a textual diagnostic message.

    -   `error_code` (`text`): an optional implementation-specific textual error code (see [Error codes](#error-codes)).

-   4xx HTTP status for client errors (e.g. malformed request). Except for 429 HTTP status, retrying the request will likely have the same outcome.

-   5xx HTTP status when the server has encountered an error or is otherwise incapable of performing the request. The request might succeed if retried at a later time.

This request type can *also* be used to call a query method (but not a composite query method). A user may choose to go this way, instead of via the faster and cheaper [Request: Query call](#http-query) below, if they want to get a *certified* response. Note that the canister state will not be changed by sending a call request type for a query method (except for transient state such as cycle balance, canister logs, and canister version).

:::note

The functionality exposed via the [The IC management canister](./management-canister.md#ic-management-canister) can be used this way.

:::

### Request: Read state {#http-read-state}

:::note

Requesting paths with the prefix `/canister_ranges` and `/subnet` at `/api/v3/canister/<effective_canister_id>/read_state` might be deprecated in the future. Hence, users might want to point their requests for paths with the prefix `/canister_ranges` and `/subnet` to `/api/v3/subnet/<effective_subnet_id>/read_state`.

On the IC mainnet, the root subnet ID `tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe` can be used to retrieve the list of all IC mainnet's subnets by requesting the prefix `/subnet` at `/api/v3/subnet/tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe/read_state`.

:::

In order to read parts of the [The system state tree](./index.md#state-tree), the user makes a POST request to `/api/v2/canister/<effective_canister_id>/read_state` (deprecated), `/api/v2/subnet/<effective_subnet_id>/read_state` (deprecated), `/api/v3/canister/<effective_canister_id>/read_state`, or `/api/v3/subnet/<effective_subnet_id>/read_state`. The subnet form should be used when the information to be retrieved is subnet specific, i.e., when requesting paths with the prefix `/time`, `/canister_ranges`, or `/subnet`, and the subnet form must be used when requesting paths of the form `/subnet/<subnet_id>/metrics`. The request body consists of an authentication envelope with a `content` map with the following fields:

-   `request_type` (`text`): Always `read_state`

-   `sender`, `nonce`, `ingress_expiry`: See [Authentication](#authentication). `ingress_expiry` refers to this request's expiry, not the expiry of any call request referenced in this read state request.

-   `paths` (sequence of paths): A list of at most 1000 paths, where a path is itself a sequence of at most 127 blobs.

The HTTP response to this request can have the following forms:

-   200 HTTP status with a non-empty body consisting of a CBOR (see [CBOR](./index.md#cbor)) map with the following fields:

    -   `certificate` (`blob`): A certificate (see [Certification](./certification.md#certification)).

-   4xx HTTP status for client errors (e.g. malformed request). Except for 429 HTTP status, retrying the request will likely have the same outcome.

-   5xx HTTP status when the server has encountered an error or is otherwise incapable of performing the request. The request might succeed if retried at a later time.

In the following, we list properties of the returned certificate and specify conditions on the requested paths.

If the `certificate` includes a subnet delegation (see [Delegation](./certification.md#certification-delegation)), then

- for requests to `/api/v2/canister/<effective_canister_id>/read_state`, the `<effective_canister_id>` must be included in a canister id range of the delegation's subnet id in the delegation's certificate at the path of the form `/subnet/<subnet_id>/canister_ranges`,

- for requests to `/api/v3/canister/<effective_canister_id>/read_state`, the `<effective_canister_id>` must be included in a canister id range of the delegation's subnet id in the delegation's certificate at a path with prefix `/canister_ranges/<subnet_id>`,

- for requests to `/api/v2/subnet/<effective_subnet_id>/read_state` and `/api/v3/subnet/<effective_subnet_id>/read_state`, the `<effective_subnet_id>` must match the delegation's subnet id.

The returned certificate reveals all values whose path has a requested path as a prefix except for

-   paths with prefix `/subnet/<subnet_id>/canister_ranges` which are only contained in the returned certificate

    - for requests to `/api/v2/canister/<effective_canister_id>/read_state` (deprecated) and `/api/v2/subnet/<effective_subnet_id>/read_state` (deprecated);

    - if `<subnet_id>` is the root subnet ID;

-   paths with prefix `/subnet/<subnet_id>/metrics` and `/subnet/<subnet_id>/node` which are only contained in the returned certificate if `<effective_canister_id>` belongs to the canister ranges of the subnet `<subnet_id>`, i.e., if `<effective_canister_id>` belongs to the value at a path with prefix `/canister_ranges/<subnet_id>` in the state tree, or if `<effective_subnet_id>` matches `<subnet_id>`.

The returned certificate also always reveals `/time`, even if not explicitly requested.

:::note

The returned certificate might also reveal the SHA-256 hashes of values whose paths have not been requested
and whose paths might not even be allowed to be requested by the sender of the HTTP request.
This means that unauthorized users might obtain the SHA-256 hashes of ingress message responses
and private custom sections of the canister's module.
Hence, users are advised to use cryptographically strong nonces in their HTTP requests and
canister developers that aim at keeping data confidential are advised to add a secret cryptographic salt to their canister's responses and private custom sections.

:::

All requested paths must have the following form:

-   `/time`. Can always be requested.

-   `/api_boundary_nodes`, `/api_boundary_nodes/<node_id>`, `/api_boundary_nodes/<node_id>/domain`,  `/api_boundary_nodes/<node_id>/ipv4_address`, `/api_boundary_nodes/<node_id>/ipv6_address`. Can always be requested.

-   `/canister_ranges/<subnet_id>`. Can only be requested at `/api/v2/subnet/<effective_subnet_id>/read_state` and `/api/v3/subnet/<effective_subnet_id>/read_state`. Cannot be requested at `/api/v2/canister/<effective_canister_id>/read_state` and `/api/v3/canister/<effective_canister_id>/read_state`.

-   `/subnet`, `/subnet/<subnet_id>`, `/subnet/<subnet_id>/public_key`, `/subnet/<subnet_id>/type`, `/subnet/<subnet_id>/node`, `/subnet/<subnet_id>/node/<node_id>`, `/subnet/<subnet_id>/node/<node_id>/public_key`. Can always be requested.

-   `/subnet/<subnet_id>/canister_ranges`, where `<subnet_id>` is the root subnet ID. Can always be requested.

-   `/subnet/<subnet_id>/canister_ranges`, where `<subnet_id>` is not the root subnet ID. Can be requested at `/api/v2/canister/<effective_canister_id>/read_state` and `/api/v2/subnet/<effective_subnet_id>/read_state`. Cannot be requested at `/api/v3/canister/<effective_canister_id>/read_state` and `/api/v3/subnet/<effective_subnet_id>/read_state`.

-   `/subnet/<subnet_id>/metrics`. Can only be requested at `/api/v2/subnet/<subnet_id>/read_state` and `/api/v3/subnet/<subnet_id>/read_state` (i.e., if `<effective_subnet_id>` matches `<subnet_id>`). In particular, cannot be requested at `/api/v2/canister/<effective_canister_id>/read_state` and `/api/v3/canister/<effective_canister_id>/read_state`.

-   `/request_status/<request_id>`, `/request_status/<request_id>/status`, `/request_status/<request_id>/reply`, `/request_status/<request_id>/reject_code`, `/request_status/<request_id>/reject_message`, `/request_status/<request_id>/error_code`. Can be requested if no path with such a prefix exists in the state tree or

    -   the sender of the original request referenced by `<request_id>` is the same as the sender of the read state request and

    -   the effective canister id of the original request referenced by `<request_id>` matches `<effective_canister_id>` (for requests to `/api/v2/canister/<effective_canister_id>/read_state` and `/api/v3/canister/<effective_canister_id>/read_state`), or the effective subnet id of the original request referenced by `<request_id>` matches `<effective_subnet_id>` (for requests to `/api/v2/subnet/<effective_subnet_id>/read_state` and `/api/v3/subnet/<effective_subnet_id>/read_state`).

-   `/canister/<canister_id>/module_hash`. Can be requested if `<canister_id>` matches `<effective_canister_id>`.

-   `/canister/<canister_id>/controllers`. Can be requested if `<canister_id>` matches `<effective_canister_id>`. The order of controllers in the value at this path may vary depending on the implementation.

-   `/canister/<canister_id>/metadata/<name>`. Can be requested if `<canister_id>` matches `<effective_canister_id>`, `<name>` is encoded in UTF-8, and

    -   canister with canister id `<canister_id>` does not exist or

    -   canister with canister id `<canister_id>` is empty or

    -   canister with canister id `<canister_id>` does not have `<name>` as its custom section or

    -   `<name>` is a public custom section or

    -   `<name>` is a private custom section and the sender of the read state request is a controller of the canister.

Moreover,

- all paths with prefix `/request_status/<request_id>` must refer to the same request ID `<request_id>`; and

- all paths with prefix `/canister_ranges/<subnet_id>` must refer to the same subnet ID `<subnet_id>`.

If a path cannot be requested, then the HTTP response to the read state request is undefined.

Note that the paths `/canister/<canister_id>/certified_data` are not accessible with this method; these paths are only exposed to the canisters themselves via the System API (see [Certified data](./canister-interface.md#system-api-certified-data)).

See [The system state tree](./index.md#state-tree) for details on the state tree.

### Request: Query call {#http-query}

A query call is a fast, but less secure way to call canister methods that do not change the canister state.
Only methods that are explicitly marked as "query methods" and "composite query methods" by the canister can be called this way.
In contrast to a query method, a composite query method can make further calls to query and composite query methods of canisters on the same subnet.

The following limits apply to the evaluation of a query call:

-   The amount of cycles that are used in total (across all calls to query and composite query methods and their callbacks) during evaluation of a query call is at most `MAX_CYCLES_PER_QUERY`.

-   The maximum nesting level of calls during evaluation of a query call is at most `MAX_CALL_DEPTH_COMPOSITE_QUERY`.

-   The wall clock time spent on evaluation of a query call is at most `MAX_WALL_CLOCK_TIME_COMPOSITE_QUERY`.

In order to make a query call to a canister, the user makes a POST request to `/api/v2/canister/<effective_canister_id>/query` (deprecated) or `/api/v3/canister/<effective_canister_id>/query`. The `/api/v3/subnet/<effective_subnet_id>/query` form is not a general-purpose query endpoint; it is only supported for calls to the `list_canisters` method of the Management Canister (`aaaaa-aa`). The request body consists of an authentication envelope with a `content` map with the following fields:

-   `request_type` (`text`): Always `"query"`.

-   `canister_id` (`blob`): The principal of the canister to call.

-   `method_name` (`text`): Name of the canister method to call.

-   `arg` (`blob`): Argument to pass to the canister method.

-   `sender`, `nonce`, `ingress_expiry`: See [Authentication](#authentication).

-   `sender_info` (`map`, optional): Map with fields:

    -   `info` (`blob`, required): The sender information passed to the canister.

    -   `signer` (`blob`, required): The principal of the signing canister. This must be equal to the canister ID encoded in the `sender_pubkey`, i.e. the `signing_canister_id` component of the canister signature public key, as described in [canister signature](./index.md#canister-signatures).

    -   `sig` (`blob`, required): Signature to authenticate the `info` field. This signature *must* be a [canister signature](./index.md#canister-signatures), using the 15 bytes `\x0Eic-sender-info` as the domain separator for the payload, and  *must* verify using `sender_pubkey` as the canister signature public key.

The HTTP response to this request can have the following forms:

-   200 HTTP status with a non-empty body consisting of a CBOR (see [CBOR](./index.md#cbor)) map with the following fields:

    -   `status` (`text`): `"replied"`

    -   `reply`: a CBOR map with the field `arg` (`blob`) which contains the reply data.

    -   `signatures` (`[+ node-signature]`): a list containing one node signature for the returned query response.

-   200 HTTP status with a non-empty body consisting of a CBOR (see [CBOR](./index.md#cbor)) map with the following fields:

    -   `status` (`text`): `"rejected"`

    -   `reject_code` (`nat`): The reject code (see [Reject codes](#reject-codes)).

    -   `reject_message` (`text`): a textual diagnostic message.

    -   `error_code` (`text`): an optional implementation-specific textual error code (see [Error codes](#error-codes)).

    -   `signatures` (`[+ node-signature]`): a list containing one node signature for the returned query response.

-   4xx HTTP status for client errors (e.g. malformed request). Except for 429 HTTP status, retrying the request will likely have the same outcome.

-   5xx HTTP status when the server has encountered an error or is otherwise incapable of performing the request. The request might succeed if retried at a later time.

:::note

Although `signatures` only contains one node signature, we still declare its type to be a list to prevent future breaking changes
if we include more signatures in a future version of the protocol specification.

:::

A successful response to a query call (200 HTTP status) contains a list with one signature for the returned response produced by the IC node that evaluated the query call. The signature (whose type is denoted as `node-signature`) is a CBOR (see [CBOR](./index.md#cbor)) map with the following fields:

-   `timestamp` (`nat`): the timestamp of the signature.

-   `signature` (`blob`): the actual signature.

-   `identity` (`principal`): the principal of the node producing the signature.

Given a query (the `content` map from the request body) `Q`, a response `R`, and a certificate `Cert` that is obtained by requesting the path `/subnet` in a **separate** read state request to `/api/v3/canister/<effective_canister_id>/read_state` (or `/api/v3/subnet/<effective_subnet_id>/read_state` for subnet queries), the following predicates describe when the returned response `R` is correctly signed.

The common node signature verification logic is captured in:

```
verify_node_signatures(Q, R, Cert, SubnetId)
  = ∀ {timestamp: T, signature: Sig, identity: NodeId} ∈ R.signatures.
      lookup(["subnet",SubnetId,"node",NodeId,"public_key"], Cert) = Found PK ∧
      if R.status = "replied" then
        verify_signature PK Sig ("\x0Bic-response" · hash_of_map({
          status: "replied",
          reply: R.reply,
          timestamp: T,
          request_id: hash_of_map(Q)}))
      else
        verify_signature PK Sig ("\x0Bic-response" · hash_of_map({
          status: "rejected",
          reject_code: R.reject_code,
          reject_message: R.reject_message,
          error_code: R.error_code,
          timestamp: T,
          request_id: hash_of_map(Q)}))
```

For canister queries to `/api/v3/canister/<effective_canister_id>/query`:

```
verify_response(Q, R, Cert)
  = verify_cert(Cert) ∧
    ((Cert.delegation = NoDelegation ∧ SubnetId = RootSubnetId ∧ lookup(["subnet",SubnetId,"canister_ranges"], Cert) = Found Ranges) ∨
     (Cert.delegation ≠ NoDelegation ∧ SubnetId = Cert.delegation.subnet_id ∧ lookup*(["canister_ranges",SubnetId], Cert.delegation.certificate) = Ranges)) ∧
    effective_canister_id ∈ Ranges ∧
    verify_node_signatures(Q, R, Cert, SubnetId)
```

For subnet queries to `/api/v3/subnet/<effective_subnet_id>/query`:

```
verify_subnet_response(Q, R, Cert, SubnetId)
  = verify_cert(Cert) ∧ SubnetId = effective_subnet_id ∧
    ((Cert.delegation = NoDelegation ∧ SubnetId = RootSubnetId) ∨
     (Cert.delegation ≠ NoDelegation ∧ SubnetId = Cert.delegation.subnet_id)) ∧
    verify_node_signatures(Q, R, Cert, SubnetId)
```

where `RootSubnetId` is the a priori known principal of the root subnet. Moreover, all timestamps in `R.signatures`, the certificate `Cert`, and its optional delegation must be "recent enough".

:::note

This specification leaves it up to the client to define expiry times for the timestamps in `R.signatures`, the certificate `Cert`, and its optional delegation. A reasonable expiry time for timestamps in `R.signatures` and the certificate `Cert` is 5 minutes (analogously to the maximum allowed ingress expiry enforced by the IC mainnet). Delegations require expiry times of at least a week since the IC mainnet refreshes the delegations only after replica upgrades which typically happen once a week.

:::

### Effective canister id {#http-effective-canister-id}

The `<effective_canister_id>` in the URL paths of requests is the *effective* destination of the request.
It must be contained in the canister ranges of a subnet, otherwise the corresponding HTTP request is rejected.

-   If the request is an update call to the Management Canister (`aaaaa-aa`), then:

    -   If the call is to the `create_canister` or `provisional_create_canister_with_cycles` method, then any principal can be used as the effective canister id for this call.

    -   If the call is to the `install_chunked_code` method and the `arg` is a Candid-encoded record with a `target_canister` field of type `principal`, then the effective canister id must be that principal.

    -   Otherwise, if the `arg` is a Candid-encoded record with a `canister_id` field of type `principal`, then the effective canister id must be that principal.

    -   Otherwise, the call is rejected by the system independently of the effective canister id.

-   If the request is a query call to the Management Canister (`aaaaa-aa`), then:

    -   If the call is to the `list_canisters` method, then any principal can be used as the effective canister id for this call.

    -   If the `arg` is a Candid-encoded record with a `canister_id` field of type `principal`, then the effective canister id must be that principal.

    -   Otherwise, the call is rejected by the system independently of the effective canister id.

-   If the request is an update or query call to a canister that is not the Management Canister (`aaaaa-aa`), then the effective canister id must be the `canister_id` in the request.

:::note

The expectation is that user-side agent code shields users and developers from the notion of effective canister id, in analogy to how the System API interface shields canister developers from worrying about routing.

The Internet Computer blockchain mainnet does not support `provisional_create_canister_with_cycles` and thus all calls to this method are rejected independently of the effective canister id.

In development instances of the Internet Computer Protocol (e.g. testnets), the effective canister id of a request submitted to a node must be a canister id from the canister ranges of the subnet to which the node belongs.

:::

### Effective subnet id {#http-effective-subnet-id}

The `<effective_subnet_id>` in the URL paths of update call requests is only supported for canister creation calls to the Management Canister (`aaaaa-aa`). In this case, the `<effective_subnet_id>` specifies the subnet on which the new canister will be created. The `<effective_subnet_id>` in the URL paths of query call requests is only supported for calls to the `list_canisters` method of the Management Canister (`aaaaa-aa`). In this case, the `<effective_subnet_id>` specifies the subnet whose canisters are listed.

### Authentication {#authentication}

All requests coming in via the HTTPS interface need to be either *anonymous* or *authenticated* using a cryptographic signature. To that end, the following fields are present in the `content` map in all cases:

-   `nonce` (`blob`, optional): Arbitrary user-provided data of length at most 32 bytes, typically randomly generated. This can be used to create distinct requests with otherwise identical fields.

-   `ingress_expiry` (`nat`, required): An upper limit on the validity of the request, expressed in nanoseconds since 1970-01-01 (like [ic0.time()](./canister-interface.md#system-api-time)). This avoids replay attacks: The IC will not accept requests, or transition call requests from status `received` to status `processing`, if their expiry date is in the past. The IC may refuse to accept requests with an ingress expiry date too far in the future. The acceptance rules for ingress expiry apply not only to update calls but all requests alike (and could have been called `request_expiry`), except for anonymous `query` and anonymous `read_state` requests for which the IC may accept any provided expiry timestamp. Note that the `ingress_expiry` of a `read_state` request is independent of the `ingress_expiry` of an earlier `call` request, they do *not* need to be the same.

-   `sender` (`Principal`, required): The user who issued the request.

The envelope, i.e. the overall request, has the following keys:

-   `content` (`record`): the actual request content

-   `sender_pubkey` (`blob`, optional): Public key used to authenticate this request. Since a user may in the future have more than one key, this field tells the IC which key is used.

-   `sender_delegation` (`array` of maps, optional): a chain of delegations, starting with the one signed by `sender_pubkey` and ending with the one delegating to the key relating to `sender_sig`. Every public key in the chain of delegations should appear exactly once: cycles (a public key delegates to another public key that already previously appeared in the chain) or self-signed delegations (a public key delegates to itself) are not allowed and such requests will be refused by the IC.

-   `sender_sig` (`blob`, optional): Signature to authenticate this request.

The public key must authenticate the `sender` principal:

-   A public key can authenticate a principal if the latter is a self-authenticating id derived from that public key (see [Special forms of Principals](./index.md#id-classes)).

-   The fields `sender_pubkey`, `sender_sig`, and `sender_delegation` must be omitted if the `sender` field is the anonymous principal. The fields `sender_pubkey` and `sender_sig` must be set if the `sender` field is not the anonymous principal.

The request id (see [Request ids](#request-id)) is calculated from the content record. This allows the signature to be based on the request id, and implies that signature and public key are not semantically relevant.

The field `sender_pubkey` contains a public key supported by one of the schemes described in [Signatures](./index.md#signatures).

Signing transactions can be delegated from one key to another one. If delegation is used, then the `sender_delegation` field contains an array of delegations, each of which is a map with the following fields:

-   `delegation` (`map`): Map with fields:

    -   `pubkey` (`blob`): Public key as described in [Signatures](./index.md#signatures).

    -   `expiration` (`nat`): Expiration of the delegation, in nanoseconds since 1970-01-01, analogously to the `ingress_expiry` field above.

    -   `targets` (`array` of `CanisterId`, optional): If this field is set, the delegation only applies for requests sent to the canisters in the list. The list must contain no more than 1000 elements; otherwise, the request will not be accepted by the IC.

-   `signature` (`blob`): Signature on the 32-byte [representation-independent hash](#hash-of-map) of the map contained in the `delegation` field as described in [Signatures](./index.md#signatures), using the 27 bytes `\x1Aic-request-auth-delegation` as the domain separator.

    For the first delegation in the array, this signature is created with the key corresponding to the public key from the `sender_pubkey` field, all subsequent delegations are signed with the key corresponding to the public key contained in the preceding delegation.

The `sender_sig` field is calculated by signing the concatenation of the 11 bytes `\x0Aic-request` (the domain separator) and the 32 byte [request id](#request-id) with the secret key that belongs to the key specified in the last delegation or, if no delegations are present, the public key specified in `sender_pubkey`.

The delegation field, if present, must not contain more than 20 delegations.

### Representation-independent hashing of structured data {#hash-of-map}

Structured data, such as (recursive) maps, are authenticated by signing a representation-independent hash of the data. This hash is computed as follows (using SHA256 in the steps below):

1.  For each field that is present in the map (i.e. omitted optional fields are indeed omitted):

    -   concatenate the hash of the field's name (in ascii-encoding, without terminal `\x00`) and the hash of the value (as specified below).

2.  Sort these concatenations from low to high.

3.  Concatenate the sorted elements, and hash the result.

The resulting hash of length 256 bits (32 bytes) is the representation-independent hash.

Field values are hashed as follows:

-   Binary blobs (`canister_id`, `arg`, `nonce`, `module`) are hashed as-is.

-   Strings (`request_type`, `method_name`) are hashed by hashing their binary encoding in UTF-8, without a terminal `\x00`.

-   Natural numbers (`compute_allocation`, `memory_allocation`, `ingress_expiry`) are hashed by hashing their binary encoding using the shortest form [Unsigned LEB128](https://en.wikipedia.org/wiki/LEB128#Unsigned_LEB128) encoding. For example, `0` should be encoded as a single zero byte `[0x00]` and `624485` should be encoded as byte sequence `[0xE5, 0x8E, 0x26]`.

-   Integers are hashed by hashing their encoding using the shortest form [Signed LEB128](https://en.wikipedia.org/wiki/LEB128#Signed_LEB128) encoding. For example, `0` should be encoded as a single zero byte `[0x00]` and `-123456` should be encoded as byte sequence `[0xC0, 0xBB, 0x78]`.

-   Arrays (`paths`) are hashed by hashing the concatenation of the hashes of the array elements.

-   Maps (`sender_delegation`) are hashed by recursively computing their representation-independent hash.

:::tip

Example calculation (where `H` denotes SHA-256 and `·` denotes blob concatenation) of a representation independent hash
for a map with a nested map in a field value:
```
hash_of_map({ "reply": { "arg": "DIDL\x00\x00" } })
  = H(concat (sort [ H("reply") · hash_of_map({ "arg": "DIDL\x00\x00" }) ]))
  = H(concat (sort [ H("reply") · H(concat (sort [ H("arg") · H("DIDL\x00\x00") ])) ]))
```

:::

### Request ids {#request-id}

When signing requests or querying the status of a request (see [Request status](./index.md#state-tree-request-status)) in the state tree, the user identifies the request using a *request id*, which is the [representation-independent hash](#hash-of-map) of the `content` map of the original request. A request id must have length of 32 bytes.

:::note

The request id is independent of the representation of the request (currently only CBOR, see [CBOR](./index.md#cbor)), and does not change if the specification adds further optional fields to a request type.

:::

:::note

The recommended textual representation of a request id is a hexadecimal string with lower-case letters prefixed with '0x'. E.g., request id consisting of bytes `[00, 01, 02, 03, 04, 05, 06, 07, 08, 09, 0A, 0B, 0C, 0D, 0E, 0F, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 1A, 1B, 1C, 1D, 1E, 1F]` should be displayed as `0x000102030405060708090a0b0c0d0e0f101112131415161718191a1b1c1d1e1f`.

:::

:::tip

Example calculation (where `H` denotes SHA-256 and `·` denotes blob concatenation) in which we assume that the optional nonce is not provided and thus omitted:
```
hash_of_map({ request_type: "call", sender: 0x04, ingress_expiry: 1685570400000000000, canister_id: 0x00000000000004D2, method_name: "hello", arg: "DIDL\x00\xFD*"})
 = H(concat (sort
   [ H("request_type") · H("call")
   , H("sender") · H("0x04")
   , H("ingress_expiry") · H(1685570400000000000)
   , H("canister_id") · H("\x00\x00\x00\x00\x00\x00\x04\xD2")
   , H("method_name") · H("hello")
   , H("arg") · H("DIDL\x00\xFD*")
   ]))
 = H(concat (sort
   [ 769e6f87bdda39c859642b74ce9763cdd37cb1cd672733e8c54efaa33ab78af9 · 7edb360f06acaef2cc80dba16cf563f199d347db4443da04da0c8173e3f9e4ed
   , 0a367b92cf0b037dfd89960ee832d56f7fc151681bb41e53690e776f5786998a · e52d9c508c502347344d8c07ad91cbd6068afc75ff6292f062a09ca381c89e71
   , 26cec6b6a9248a96ab24305b61b9d27e203af14a580a5b1ff2f67575cab4a868 · db8e57abc8cda1525d45fdd2637af091bc1f28b35819a40df71517d1501f2c76
   , 0a3eb2ba16702a387e6321066dd952db7a31f9b5cc92981e0a92dd56802d3df9 · 4d8c47c3c1c837964011441882d745f7e92d10a40cef0520447c63029eafe396
   , 293536232cf9231c86002f4ee293176a0179c002daa9fc24be9bb51acdd642b6 · 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
   , b25f03dedd69be07f356a06fe35c1b0ddc0de77dcd9066c4be0c6bbde14b23ff · 6c0b2ae49718f6995c02ac5700c9c789d7b7862a0d53e6d40a73f1fcd2f70189
   ]))
 = H(concat
   [ 0a367b92cf0b037dfd89960ee832d56f7fc151681bb41e53690e776f5786998a · e52d9c508c502347344d8c07ad91cbd6068afc75ff6292f062a09ca381c89e71
   , 0a3eb2ba16702a387e6321066dd952db7a31f9b5cc92981e0a92dd56802d3df9 · 4d8c47c3c1c837964011441882d745f7e92d10a40cef0520447c63029eafe396
   , 26cec6b6a9248a96ab24305b61b9d27e203af14a580a5b1ff2f67575cab4a868 · db8e57abc8cda1525d45fdd2637af091bc1f28b35819a40df71517d1501f2c76
   , 293536232cf9231c86002f4ee293176a0179c002daa9fc24be9bb51acdd642b6 · 2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824
   , 769e6f87bdda39c859642b74ce9763cdd37cb1cd672733e8c54efaa33ab78af9 · 7edb360f06acaef2cc80dba16cf563f199d347db4443da04da0c8173e3f9e4ed
   , b25f03dedd69be07f356a06fe35c1b0ddc0de77dcd9066c4be0c6bbde14b23ff · 6c0b2ae49718f6995c02ac5700c9c789d7b7862a0d53e6d40a73f1fcd2f70189
   ])
 = 1d1091364d6bb8a6c16b203ee75467d59ead468f523eb058880ae8ec80e2b101
```

:::

### Reject codes {#reject-codes}

An API request or inter-canister call that is pending in the IC will eventually result in either a *reply* (indicating success, and carrying data) or a *reject* (indicating an error of some sorts). A reject contains a *reject code* that classifies the error and a hopefully helpful *reject message* string.

Reject codes are member of the following enumeration:

-   `SYS_FATAL` (1): Fatal system error, retry unlikely to be useful.

-   `SYS_TRANSIENT` (2): Transient system error, retry might be possible.

-   `DESTINATION_INVALID` (3): Invalid destination (e.g. canister/account does not exist)

-   `CANISTER_REJECT` (4): Explicit reject by the canister.

-   `CANISTER_ERROR` (5): Canister error (e.g., trap, no response)

-   `SYS_UNKNOWN` (6): Response unknown; system stopped waiting for it (e.g., timed out, or system under high load). This code is only applicable to inter-canister calls that used `ic0.call_with_best_effort_response`.

The symbolic names of this enumeration are used throughout this specification, but on all interfaces (HTTPS API, System API), they are represented as positive numbers as given in the list above.

The error message is guaranteed to be a string, i.e. not arbitrary binary data.

When canisters explicitly reject a message (see [Public methods](./canister-interface.md#system-api-requests)), they can specify the reject message, but *not* the reject code; it is always `CANISTER_REJECT`. In this sense, the reject code is trustworthy: the reject code is always fixed by the protocol, i.e., the canister cannot freely specify the reject code.

### Error codes {#error-codes}

Implementations of the API can provide additional details for rejected messages in the form of a textual label identifying the error condition. API clients can use these labels to handle errors programmatically or suggest recovery paths to the user. The specification reserves error codes matching the regular expression `IC[0-9]+` (e.g., `IC502`) for the DFINITY implementation of the API.

### Status endpoint {#api-status}

Additionally, the Internet Computer provides an API endpoint to obtain various status fields at

    /api/v2/status

For this endpoint, the user performs a GET request, and receives a CBOR (see [CBOR](./index.md#cbor)) value with the following fields. The IC may include additional implementation-specific fields.

-   `root_key` (blob, optional): The public key (a DER-encoded BLS key) of the root key of this instance of the Internet Computer Protocol. This *must* be present in short-lived development instances, to allow the agent to fetch the public key. For the Internet Computer, agents must have an independent trustworthy source for this data (e.g., the system API `ic0.root_key_size` and `ic0.root_key_copy`), and must not be tempted to fetch it from this insecure location.

See [CBOR encoding of requests and responses](#api-cbor) for details on the precise CBOR encoding of this object.

:::note

Future additions may include local time, geographic location, and other useful implementation-specific information such as blockheight. This data may possibly be signed by the node.

:::

### CBOR encoding of requests and responses {#api-cbor}

Requests and responses are specified here as records with named fields and using suggestive human readable syntax. The actual format in the body of the HTTP request or response, however, is CBOR (see [CBOR](./index.md#cbor)).

Concretely, it consists of a data item with major type 6 ("Semantic tag") and tag value `55799`, followed by a record.

Requests consist of an envelope record with keys `sender_sig` (a blob), `sender_pubkey` (a blob) and `content` (a record). The first two are metadata that are used for request authentication, while the last one is the actual content of the request.

The following encodings are used:

-   Strings: Major type 3 ("Text string").

-   Blobs: Major type 2 ("Byte string").

-   Nats: Major type 0 ("Unsigned integer") if small enough to fit that type, else the [Bignum](https://www.rfc-editor.org/rfc/rfc8949#name-bignums) format is used.

-   Records: Major type 5 ("Map of pairs of data items"), followed by the fields, where keys are encoded with major type 3 ("Text string").

-   Arrays: Major type 4 ("Array of data items").

As advised by [section "Creating CBOR-Based Protocols"](https://www.rfc-editor.org/rfc/rfc8949#name-creating-cbor-based-protoco) of the CBOR spec, we clarify that:

-   Floating-point numbers may not be used to encode integers.

-   Duplicate keys are prohibited in CBOR maps.

:::tip

A typical request would be (written in [CBOR diagnostic notation](https://www.rfc-editor.org/rfc/rfc8949#name-diagnostic-notation), which can be checked and converted on [cbor.me](https://cbor.me/)):
```
55799({
  "content": {
    "request_type": "call",
    "canister_id": h'ABCD01',
    "method_name": "say_hello",
    "arg": h'0061736d01000000'
  },
  "sender_sig": h'DEADBEEF',
  "sender_pubkey": h'b7a3c12dc0c8c748ab07525b701122b88bd78f600c76342d27f25e5f92444cde'
})
```

:::

### CDDL description of requests and responses {#api-cddl}

This section summarizes the format of the CBOR data passed to and from the entry points described above. You can also [download the file](/references/_attachments/requests.cddl) and see [CDDL](./index.md#cddl) for more information.

### Ordering guarantees

The order in which the various messages between canisters are delivered and executed is not fully specified. The guarantee provided by the IC is that if a canister sends two messages to a canister and they both start being executed by the receiving canister, then they do so in the order in which the messages were sent.

More precisely:

-   Messages between any *two* canisters, if delivered to the canister, start executing in order. Note that message delivery can fail for arbitrary reasons (e.g., high system load).

-   If a WebAssembly function, within a single invocation, makes multiple calls to the same canister, they are queued in the order of invocations to `ic0.call_perform`.

-   Responses (including replies with `ic0.msg_reply`, explicit rejects with `ic0.msg_reject` and system-generated error responses) do *not* have any ordering guarantee relative to each other or to method calls.

-   There is no particular order guarantee for ingress messages submitted via the HTTPS interface.

### Synchronicity across nodes

This document describes the Internet Computer as having a single global state that can be modified and queried. In reality, it consists of many nodes, which may not be perfectly in sync.

As long as you talk to one (honest) node only, the observed behavior is nicely sequential. If you issue an update (i.e. state-mutating) call to a canister (e.g. bump a counter), and node A indicates that the call has been executed, and you then issue a query call to node A, then A's response is guaranteed to include the effect of the update call (and you will receive the updated counter value).

If you then (quickly) issue a read request to node B, it may be that B responds to your read query based on the old state of the canister (and you might receive the old counter value).

A related problem is that query calls are not certified, and nodes may be dishonest in their response. In that case, the user might want to get more assurance by querying multiple nodes and comparing the result. However, it is (currently) not possible to query a *specific* state.

:::note

Applications can work around these problems. For the first problem, the query result could be such that the user can tell if the update has been received or not. For the second problem, even if using [certified data](./canister-interface.md#system-api-certified-data) is not possible, if replies are monotonic in some sense the user can get assurance in their intersection (e.g. if the query returns a list of events that grows over time, then even if different nodes return different lists, the user can get assurance in those events that are reported by many nodes).

:::

<!-- Upstream: sync from dfinity/portal — docs/references/ic-interface-spec.md -->
