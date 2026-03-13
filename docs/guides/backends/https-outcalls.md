---
title: "HTTPS Outcalls"
description: "Make HTTP GET and POST requests from canisters to external web APIs"
sidebar:
  order: 2
icskills: [https-outcalls]
---

Canisters can make HTTP requests to external web services using HTTPS outcalls. This lets your canister fetch off-chain data, call REST APIs, or send notifications — all from onchain code.

HTTPS outcalls are available through the [IC management canister](../../reference/management-canister.md) (`aaaaa-aa`) via the `http_request` method. Both `GET`, `HEAD`, and `POST` methods are supported. Only HTTPS (not plain HTTP) is supported.

For how the consensus mechanism works for outcalls, see [Concepts: HTTPS Outcalls](../../concepts/https-outcalls.md).

## How HTTPS outcalls work

Because a canister runs on a subnet of multiple replica nodes, every node independently makes the same HTTP request. All nodes must agree on the response before execution continues. To make responses deterministic across nodes:

1. Every HTTPS outcall **must include a transform function** — a query method exported by your canister that strips non-deterministic fields (timestamps, request IDs, dynamic headers) from the response.
2. Cycles to cover the request cost **must be attached** at call time. If you use the CDK wrappers shown below, this is handled automatically.

## GET request

A minimal example that fetches a JSON price feed:

**Motoko**

```motoko
import Blob "mo:core/Blob";
import Text "mo:core/Text";
import IC "ic:aaaaa-aa";
import Call "mo:ic/Call";

persistent actor {

  // Transform: strip headers so all replicas see the same response
  public query func transform({
    context : Blob;
    response : IC.http_request_result;
  }) : async IC.http_request_result {
    { response with headers = [] };
  };

  public func getIcpPrice() : async Text {
    let request : IC.http_request_args = {
      url = "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd";
      max_response_bytes = ?(10_000 : Nat64);
      headers = [{ name = "User-Agent"; value = "ic-canister" }];
      body = null;
      method = #get;
      transform = ?{ function = transform; context = Blob.fromArray([]) };
      is_replicated = null;
    };
    // Call.httpRequest auto-computes and attaches the required cycles
    let response = await Call.httpRequest(request);
    switch (Text.decodeUtf8(response.body)) {
      case (?text) text;
      case null "Response is not valid UTF-8";
    };
  };
};
```

**Rust**

```rust
use ic_cdk::api::canister_self;
use ic_cdk::management_canister::{
    http_request, HttpHeader, HttpMethod, HttpRequestArgs, HttpRequestResult,
    TransformArgs, TransformContext, TransformFunc,
};
use ic_cdk::{query, update};

// Transform: strip headers so all replicas agree
#[query(hidden = true)]
fn transform(args: TransformArgs) -> HttpRequestResult {
    HttpRequestResult { headers: vec![], ..args.response }
}

#[update]
async fn get_icp_price() -> String {
    let request = HttpRequestArgs {
        url: "https://api.coingecko.com/api/v3/simple/price?ids=internet-computer&vs_currencies=usd".to_string(),
        max_response_bytes: Some(10_000),
        method: HttpMethod::GET,
        headers: vec![HttpHeader { name: "User-Agent".to_string(), value: "ic-canister".to_string() }],
        body: None,
        transform: Some(TransformContext {
            function: TransformFunc::new(canister_self(), "transform".to_string()),
            context: vec![],
        }),
        is_replicated: None,
    };
    // http_request auto-attaches the required cycles
    match http_request(&request).await {
        Ok(response) => String::from_utf8(response.body).unwrap_or_default(),
        Err(err) => format!("Outcall failed: {:?}", err),
    }
}
```

Add the following dependencies to `Cargo.toml`:

```toml
[dependencies]
ic-cdk = "0.19"
candid = "0.10"
serde_json = "1"
```

For a complete working project, see the [send_http_get example](https://github.com/dfinity/examples/tree/master/rust/send_http_get) (Rust) or [Motoko version](https://github.com/dfinity/examples/tree/master/motoko/send_http_get).

## POST request

POST requests work the same way, with two additional considerations:

- **Idempotency:** Because all replicas independently send the same request, a non-idempotent endpoint (e.g., "create order") will be called once per replica — typically 13 times on a 13-node subnet. Use an idempotency key header so the server can deduplicate.
- **Transform:** The POST transform often needs to strip the response body too, since some servers include per-request fields (like the caller's IP) in the response body.

```motoko
public query func transformPost({
  context : Blob;
  response : IC.http_request_result;
}) : async IC.http_request_result {
  // Strip both headers and body — httpbin.org echoes sender IP in body
  { response with headers = []; body = Blob.fromArray([]) };
};

public func postData(payload : Text) : async Text {
  let request : IC.http_request_args = {
    url = "https://httpbin.org/post";
    max_response_bytes = ?(50_000 : Nat64);
    headers = [
      { name = "Content-Type"; value = "application/json" },
      { name = "Idempotency-Key"; value = "unique-request-id-12345" },
    ];
    body = ?Text.encodeUtf8(payload);
    method = #post;
    transform = ?{ function = transformPost; context = Blob.fromArray([]) };
    is_replicated = null;
  };
  let response = await Call.httpRequest(request);
  if (response.status == 200) "POST successful" else "POST failed";
};
```

For a complete example, see [send_http_post](https://github.com/dfinity/examples/tree/master/rust/send_http_post).

## Transform functions

The transform function is mandatory for any outcall where the external server may return non-deterministic data. It runs on each replica before consensus and must be a `query` method. At minimum, strip all headers:

- In Motoko: `{ response with headers = [] }`
- In Rust: `HttpRequestResult { headers: vec![], ..args.response }`

If the response body also contains dynamic fields (timestamps, per-request IDs), parse and re-serialize the body to extract only the deterministic fields you need.

**Debugging "no consensus" errors:** If you see `"No consensus could be reached"`, the transform is not making responses identical. Common culprits: response headers differ, JSON fields arrive in a different order, or the response body contains timestamps. Strip all headers first; if that doesn't resolve it, also normalize or strip the body.

## Cycle costs

HTTPS outcall costs are based on `max_response_bytes`, not the actual response size. If you omit `max_response_bytes`, the system assumes 2MB and charges approximately **21.5 billion cycles** — even for a 1KB response. Always set a tight upper bound.

The CDK wrappers (`Call.httpRequest` in Motoko, `ic_cdk::management_canister::http_request` in Rust) compute and attach the exact cost automatically using the `ic0.cost_http_request` system API. You do not need to hard-code cycle amounts.

For reference, on a 13-node subnet:
- Base cost: ~49 million cycles
- Per request byte: 5,200 cycles
- Per `max_response_bytes` byte: 10,400 cycles

Unused cycles are refunded. See [Cycles Costs](../../reference/cycles-costs.md) for the full pricing table.

## Testing locally

```bash
icp network start -d
icp deploy backend
icp canister call backend getIcpPrice
```

HTTPS outcalls work on the local replica — icp-cli proxies requests through the local HTTP gateway.

## What's next

- [Concepts: HTTPS Outcalls](../../concepts/https-outcalls.md) — how consensus works for outcalls
- [Chain Fusion: Ethereum](../chain-fusion/ethereum.md) — the EVM RPC canister uses HTTPS outcalls under the hood
- [Cycles Costs](../../reference/cycles-costs.md) — outcall pricing details

<!-- Upstream: informed by dfinity/portal docs/building-apps/network-features/using-http/https-outcalls/ -->
