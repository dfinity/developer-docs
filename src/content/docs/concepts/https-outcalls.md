---
title: "HTTPS Outcalls"
description: "Call any Web2 API directly from a canister"
sidebar:
  order: 4
doc_type: explanation
level: intermediate
features: [https-outcalls]
icskills: [https-outcalls]
last_verified: 2026-03-10
---

HTTPS outcalls let canisters make HTTP requests to any server on the internet. No oracles, no external bridges -- your canister calls Web2 APIs directly and the response goes through consensus so every replica agrees on the result.

## How it works

1. Your canister calls the management canister's `http_request` method.
2. Each replica in the subnet independently sends the HTTP request to the target server.
3. An optional **transform function** normalizes each response (removing timestamps, request IDs, and other non-deterministic fields).
4. The transformed responses go through consensus. If at least 2/3 of replicas agree, the response is delivered to your canister.

This architecture means no single replica can fabricate a response, and the canister receives a result that the subnet collectively verified.

## Supported methods

- **GET** -- fetch data from APIs, web pages, or any URL
- **HEAD** -- retrieve headers without a response body
- **POST** -- send data to APIs (use idempotency keys since the request is sent by every replica)

## Request parameters

| Parameter | Description |
|---|---|
| `url` | Target URL (max 8,192 characters, must be valid per RFC-3986) |
| `method` | `GET`, `HEAD`, or `POST` |
| `headers` | List of HTTP headers |
| `body` | Optional request body (for POST) |
| `max_response_bytes` | Optional limit (default and max: 2 MB). Set this as low as possible -- you are charged based on this value, not actual response size |
| `transform` | Optional reference to a transform function exported by your canister |

## Transform functions

Responses from the target server may differ slightly across replicas (timestamps, cookies, request IDs). If the raw responses are not identical, consensus will fail with "No consensus could be reached."

A transform function runs on each replica before consensus and strips out non-deterministic fields. Your canister must export this function as a query method.

## Cycle costs

HTTPS outcalls require cycles to be attached to the call. The cost scales with `max_response_bytes` and the subnet size. For a 13-node subnet, a typical GET request costs approximately 49M cycles plus per-byte fees. Setting `max_response_bytes` to the smallest reasonable value reduces cost.

In Rust, the `ic_cdk::api::management_canister::http_request` function automatically attaches the right amount of cycles for a 13-node subnet. Use `http_request_with_cycles` if you need to specify a custom amount.

## Code examples

### GET request

**Motoko**

```motoko
import IC "ic:aaaaa-aa";
import Cycles "mo:base/ExperimentalCycles";
import Debug "mo:base/Debug";

actor {
    public func fetch_price() : async Text {
        let url = "https://api.coinbase.com/v2/prices/ICP-USD/spot";

        let request : IC.http_request_args = {
            url = url;
            max_response_bytes = ?2048;
            headers = [{ name = "User-Agent"; value = "icp-canister" }];
            body = null;
            method = #get;
            transform = ?{
                function = transform;
                context = [];
            };
        };

        Cycles.add<system>(20_949_972_000);
        let response = await IC.http_request(request);
        Text.decodeUtf8(response.body)
        |> (func (t : ?Text) : Text { switch t { case (?v) v; case null "decode error" } })(_)
    };

    public query func transform({
        response : IC.http_request_result;
        context : Blob;
    }) : async IC.http_request_result {
        {
            status = response.status;
            headers = [];
            body = response.body;
        }
    };
};
```

**Rust**

```rust
use ic_cdk::api::management_canister::http_request::{
    http_request, CanisterHttpRequestArgument, HttpHeader, HttpMethod,
    HttpResponse, TransformArgs, TransformContext,
};

#[ic_cdk::update]
async fn fetch_price() -> String {
    let request = CanisterHttpRequestArgument {
        url: "https://api.coinbase.com/v2/prices/ICP-USD/spot".to_string(),
        max_response_bytes: Some(2048),
        method: HttpMethod::GET,
        headers: vec![HttpHeader {
            name: "User-Agent".to_string(),
            value: "icp-canister".to_string(),
        }],
        body: None,
        transform: Some(TransformContext::from_name(
            "transform".to_string(),
            vec![],
        )),
    };

    let (response,) = http_request(request, 20_949_972_000).await.unwrap();
    String::from_utf8(response.body).unwrap()
}

#[ic_cdk::query]
fn transform(args: TransformArgs) -> HttpResponse {
    HttpResponse {
        status: args.response.status,
        headers: vec![],
        body: args.response.body,
    }
}
```

### POST request

For POST requests, include idempotency keys in the headers since every replica sends the request independently:

```rust
let request = CanisterHttpRequestArgument {
    url: "https://api.example.com/data".to_string(),
    method: HttpMethod::POST,
    headers: vec![
        HttpHeader { name: "Content-Type".to_string(), value: "application/json".to_string() },
        HttpHeader { name: "Idempotency-Key".to_string(), value: unique_id.to_string() },
    ],
    body: Some(br#"{"key": "value"}"#.to_vec()),
    max_response_bytes: Some(2048),
    transform: Some(TransformContext::from_name("transform".to_string(), vec![])),
};
```

## Limits and constraints

- Maximum response size: **2 MB**
- Maximum URL length: **8,192 characters**
- The target server must support **IPv6** (IPv4-only servers are reached via a SOCKS proxy, which may add latency)
- All HTTPS outcall methods must be **update calls** (they go through consensus)
- POST requests will be sent by every replica -- design for idempotency

## Security considerations

- The trust model relies on both the HTTP server being honest and the standard ICP assumption that at least 2/3 of replicas are honest.
- A dishonest server can provide wrong data. Use multiple data sources for critical information.
- Always use a transform function to strip non-deterministic response fields.
- For POST requests, verify that the destination server supports and uses idempotency keys.

## Resources

- [GET request example -- Motoko](https://github.com/dfinity/examples/tree/master/motoko/send_http_get)
- [GET request example -- Rust](https://github.com/dfinity/examples/tree/master/rust/send_http_get)
- [POST request example -- Motoko](https://github.com/dfinity/examples/tree/master/motoko/send_http_post)
- [POST request example -- Rust](https://github.com/dfinity/examples/tree/master/rust/send_http_post)
- [Exchange rate canister](https://github.com/dfinity/exchange-rate-canister) (real-world HTTPS outcalls usage)
- icskills: [https-outcalls](https://github.com/dfinity/icskills/blob/main/skills/https-outcalls/SKILL.md)
