---
title: "HTTP Gateway Specification"
description: "How boundary nodes serve canister HTTP responses with certification verification"
sidebar:
  order: 10
---

The HTTP Gateway Protocol is an extension of the Internet Computer Protocol that allows conventional HTTP clients — including web browsers — to interact with the IC network. The HTTP Gateway translates between standard HTTP requests and API canister calls that the IC understands, enabling browsers to fetch and render frontend canister assets such as HTML, CSS, JavaScript, images, and videos.

An HTTP Gateway can be implemented as a stand-alone proxy, in a browser via a service worker, or natively. All implementations must conform to this protocol to be compatible.

## Overview

When a browser requests a URL served by a canister, the following sequence occurs:

1. An HTTP client makes a request.
2. The HTTP Gateway intercepts the request.
3. The HTTP Gateway resolves the canister ID from the hostname.
4. The HTTP Gateway Candid-encodes the HTTP request.
5. The HTTP Gateway invokes the canister via a query call to `http_request`.
6. The canister handles the request and returns a Candid-encoded HTTP response.
7. The HTTP Gateway Candid-decodes the response for inspection and further processing.
8. If the canister sets `upgrade = opt true`, the HTTP Gateway sends the request again via an update call to `http_request_update`.
9. If the canister sets a `streaming_strategy`, the HTTP Gateway fetches further response body chunks via streaming query calls.
10. If applicable, the HTTP Gateway validates the response certificate.
11. The HTTP Gateway returns the decoded response to the HTTP client.

## Canister ID resolution

The HTTP Gateway resolves the canister ID from the hostname using the following rules, in order:

1. If the hostname is in the following table, use the listed canister ID:

   | Hostname | Canister ID |
   |---|---|
   | `identity.ic0.app` | `rdmx6-jaaaa-aaaaa-aaadq-cai` |
   | `nns.ic0.app` | `qoctq-giaaa-aaaaa-aaaea-cai` |
   | `dscvr.one` | `h5aet-waaaa-aaaab-qaamq-cai` |
   | `dscvr.ic0.app` | `h5aet-waaaa-aaaab-qaamq-cai` |
   | `personhood.ic0.app` | `g3wsl-eqaaa-aaaan-aaaaa-cai` |

2. If the hostname is a _raw_ hostname (e.g., `<name>.raw.ic0.app`), fail and handle the request as a standard web request.

3. If a valid canister ID is embedded in the hostname (found by splitting from the right), use it.

4. If the canister is hosted on the IC using a custom domain, try:
   - A DNS TXT record at `_canister-id.<hostname>` containing the canister ID, or
   - A `HEAD` request to the hostname; if the response contains an `x-ic-canister-id` header, use its value.

5. Otherwise, fail and handle the request as a standard web request.

Hostnames of the form `<name>.ic0.app` are _safe_ hostnames. The same raw-domain logic applies to other domains used to access canisters, such as `icp0.io`.

## API Gateway resolution

An API Gateway forwards Candid-encoded HTTP requests to the relevant replica node. Any requests made by an HTTP Gateway to the IC are forwarded through API Gateways at `icp-api.io`.

## HTTP request encoding

HTTP requests are Candid-encoded using the following interface:

```candid
type HeaderField = record { text; text; };

type HttpRequest = record {
    method: text;
    url: text;
    headers: vec HeaderField;
    body: blob;
    certificate_version: opt nat16;
};
```

- `method`: the HTTP method in uppercase, e.g. `"GET"`.
- `url`: the URL from the HTTP request line, without protocol or hostname, including query parameters.
- `headers`: the HTTP request headers.
- `body`: the HTTP request body, without any content encodings applied by the gateway.
- `certificate_version`: the maximum supported version of [response verification](#response-verification). A value of `2` requests the current standard; a missing value or `1` requests the [legacy standard](#legacy-response-verification). Current HTTP Gateway implementations always request version 2.

## Query calls

The encoded HTTP request is sent as a query call per the [HTTP interface spec](ic-interface-spec.md) via the resolved API Gateway.

## HTTP response decoding

An HTTP response is Candid-decoded from the query call result using the following interface:

```candid
type HttpResponse = record {
  status_code: nat16;
  headers: vec HeaderField;
  body: blob;
  upgrade : opt bool;
  streaming_strategy: opt StreamingStrategy;
};
```

- The HTTP status code comes from `status_code`.
- The HTTP headers come from `headers`.
- The HTTP body is initialized from `body` and extended per the [streaming protocol](#response-body-streaming).

Notes:

- Not all HTTP Gateway implementations can pass all header types. Service Workers, for example, cannot pass [forbidden headers](https://fetch.spec.whatwg.org/#forbidden-header-name).
- HTTP Gateways may add additional headers. In particular, the following headers may be set:
  - `access-control-allow-origin: *`
  - `access-control-allow-methods: GET, POST, HEAD, OPTIONS`
  - `access-control-allow-headers: DNT,User-Agent,X-Requested-With,If-Modified-Since,Cache-Control,Content-Type,Range,Cookie`
  - `access-control-expose-headers: Content-Length,Content-Range`
  - `x-cache-status: MISS`

## Response verification

Query calls are fast but do not carry consensus-level security (responses come from a single node without consensus verification). Response verification closes this gap: it is a versioned subprotocol that allows an HTTP Gateway to verify a certified response returned by a query call.

Two versions are supported:

- **Version 2 (current)**: can optionally cover request URL query params, request method, request headers, response status code, and response headers.
- **Version 1 (legacy)**: covers only a mapping from the request URL to the response body. See [Legacy response verification](#legacy-response-verification).

### Response verification outline

1. Case-insensitive search for the `IC-Certificate` response header.
   - Missing header: verification fails.
   - Header not in the [certificate header format](#the-certificate-header): verification fails.
2. Parse the `certificate` and `tree` fields from `IC-Certificate`.
3. Perform [certificate validation](#certificate-validation).
4. Parse the `version` field from `IC-Certificate`:
   - Missing or `1`: proceed with [legacy response verification](#legacy-response-verification).
   - `2`: continue.
   - Other values: verification fails.
5. Parse the `expr_path` field from `IC-Certificate`.
6. Validate `expr_path` per [Expression path](#expression-path). Invalid: verification fails.
7. Case-insensitive search for the `IC-CertificateExpression` header.
   - Missing: verification fails.
   - Not in the [certificate expression header format](#the-certificate-expression-header): verification fails.
8. Let `expr_hash` be the label of the node in the tree at `expr_path`:
   - No such label: verification fails.
   - `expr_hash` does not match the SHA-256 of the `IC-CertificateExpression` value: verification fails.
   - `no_certification` is set: verification succeeds.
   - Let `response_hash` be the [response hash](#response-hash-calculation).
   - If `no_request_certification` is set:
     - Empty leaf at subpath `["", response_hash]`: verification succeeds. Otherwise: verification fails.
   - Let `request_hash` be the [request hash](#request-hash-calculation).
     - No empty leaf at subpath `[request_hash, response_hash]`: verification fails.

### The certificate header

The `IC-Certificate` header is a structured header per [RFC 8941](https://www.rfc-editor.org/rfc/rfc8941.html) with the following fields:

**Mandatory (all versions):**
- `certificate`: Base64-encoded, self-describing, CBOR-encoded bytes decoding to a valid certificate per [the IC Interface Specification](ic-interface-spec.md).
- `tree`: Base64-encoded, self-describing, CBOR-encoded bytes decoding to a valid hash tree per the certification encoding specification.

**Mandatory for version 2 and above:**
- `version`: string representation of an integer indicating the response verification version used to build the tree.
- `expr_path`: Base64-encoded, self-describing, CBOR-encoded bytes decoding to an array of strings.

### Expression path

The decoded `expr_path` is an array of strings corresponding to a path in the `tree` field:

- The first segment is always `http_expr`.
- The last segment is always `<$>` (exact match) or `<*>` (wildcard/partial match).
- No intermediate segment is `<$>` or `<*>`.
- Segments between `http_expr` and the terminal are [percent-encoded](https://www.rfc-editor.org/rfc/rfc3986#section-2) URL segments.
- The path must be the most specific matching path in the tree; a lookup of more specific paths must return `Absent`.

### Certificate validation

Certificate validation is performed as part of response verification:

1. Case-insensitive search for `IC-Certificate` in the response headers.
2. The header value must match [the certificate header format](#the-certificate-header).
3. The decoded `certificate` must pass:
   - Signed by the root key of the NNS subnet or by a valid subnet delegation from that root key.
   - If a subnet delegation is present, it must be valid for the given canister.
   - The timestamp at the `/time` path must be recent (e.g., within 5 minutes).
   - The subnet state tree in the certificate must reveal the canister's certified data.
4. The root hash of the decoded `tree` must match the canister's certified data.

### The certificate expression header

The `IC-CertificateExpression` header carries additional information instructing the HTTP Gateway how to reconstruct the certification. It can instruct the gateway to:

- Exclude the complete request/response pair or the request only.
- Include specific request headers.
- Include specific request URL query parameters.
- Include or exclude specific response headers.

Format:

```http
IC-CertificateExpression: default_certification(ValidationArgs{<literal field values>})
```

The value must have valid [CEL syntax](https://github.com/google/cel-spec), where `default_certification` is a function implemented by the HTTP Gateway to validate the certification.

Properties supplied to this function:

| Property | Description |
|---|---|
| `certified_request_headers` | List of request header names to include. Mutually exclusive with `no_request_certification`. |
| `certified_query_parameters` | List of request URL query parameter names to include. Mutually exclusive with `no_request_certification`. |
| `certified_response_headers` | List of response header names to include (must not include `IC-Certificate` or `IC-CertificateExpression`). Mutually exclusive with `response_header_exclusions`. |
| `response_header_exclusions` | List of response header names to exclude (all others included). Must not include `IC-Certificate` or `IC-CertificateExpression`. Mutually exclusive with `certified_response_headers`. |
| `no_request_certification` | Disables certification of the request. **Security note:** if used on a path that serves dynamic content with the upgrade feature, a malicious node can always return the certified response instead of setting the upgrade flag. |
| `no_certification` | Disables certification entirely for this request/response pair. **Security note:** use only for dynamic content where update-call latency is too high and a malicious response has a benign impact. Dynamic content can be returned securely by using the [upgrade to update calls](#upgrade-to-update-calls) feature instead. |

The `ValidationArgs` [Protocol Buffer 3](https://protobuf.dev/reference/protobuf/proto3-spec/) definition:

```protobuf
message ResponseHeaderList {
    repeated string headers = 1;
}

message RequestCertification {
    repeated string certified_request_headers = 1;
    repeated string certified_query_parameters = 2;
}

message ResponseCertification {
    oneof response_headers {
        ResponseHeaderList certified_response_headers = 1;
        ResponseHeaderList response_header_exclusions = 2;
    }
}

message Certification {
    oneof request {
        RequestCertification request_certification = 1;
        Empty no_request_certification = 2;
    }
    ResponseCertification response_certification = 3;
}

message ValidationArgs {
    oneof certification {
        Certification certification = 1;
        Empty no_certification = 2;
    }
}
```

The header syntax in [EBNF](https://en.wikipedia.org/wiki/Extended_Backus%E2%80%93Naur_form):

```ebnf
CHAR = /[^\0\n"]/
STRING = '"', { CHAR }, '"'
STRING-LIST = '[', { STRING }, ']'

RESPONSE-HEADER-LIST = 'ResponseHeaderList{headers:',  STRING-LIST, '}'

REQUEST-CERTIFICATION = 'RequestCertification{certified_request_headers:', STRING-LIST, ',certified_query_parameters:', STRING-LIST, '}'

RESPONSE-CERTIFICATION = 'ResponseCertification{', ('response_header_exclusions:' | 'certified_response_headers:'), RESPONSE-HEADER-LIST, '}'

CERTIFICATION = 'Certification{', ('no_request_certification:Empty{}' | 'request_certification:', REQUEST-CERTIFICATION), ',response_certification:', RESPONSE-CERTIFICATION, '}'

VALIDATION-ARGS = 'ValidationArgs{', ('no_certification:Empty{}' | 'certification:', CERTIFICATION), '}'

HEADER-VALUE = 'default_certification(', VALIDATION-ARGS, ')'

HEADER = 'IC-CertificateExpression:', HEADER-VALUE
```

The EBNF specification does not allow whitespace within the header value — this is intentional. Implementations may optionally add whitespace tolerance.

### Request hash calculation

The request hash is calculated as follows:

1. Let `request_headers_hash` be the representation-independent hash of the request headers:
   - Header names are lower-cased.
   - Only headers listed in `certified_request_headers` of [the certificate expression header](#the-certificate-expression-header) are included. If the field is empty or absent, no headers are included. Repeated headers are each included.
   - Add a synthetic `:ic-cert-method` header containing the HTTP method.
   - Add a synthetic `:ic-cert-query` header computed as follows:
     - Parse the query string into an ordered list of `(name, value)` tuples.
     - Exclude tuples whose name is not in `certified_query_parameters`. If `certified_query_parameters` is empty, the list is empty.
     - Concatenate each `name`+`value`, then concatenate all of these using the original separators and order.
     - Take the SHA-256 hash of the UTF-8 string.
2. Let `request_body_hash` be the SHA-256 of the request body.
3. Concatenate `request_headers_hash` and `request_body_hash`, then take the SHA-256 of that concatenation.

### Response hash calculation

The response hash is calculated as follows:

1. Let `response_headers_hash` be the representation-independent hash of the response headers:
   - Header names are lower-cased.
   - `IC-Certificate` is always excluded.
   - `IC-CertificateExpression` is always included.
   - If `no_certification` is present in [the certificate expression header](#the-certificate-expression-header), the response hash calculation can be skipped entirely.
   - If `certified_response_headers` is present: include only those headers (except `IC-Certificate`); all others excluded (except `IC-CertificateExpression`).
   - If `response_header_exclusions` is present: exclude those headers (except `IC-CertificateExpression`); all others included (except `IC-Certificate`).
   - Repeated headers are each included.
   - Add a synthetic `:ic-cert-status` header containing the numerical HTTP status code.
2. Let `response_body_hash` be the SHA-256 of the response body.
3. Concatenate `response_headers_hash` and `response_body_hash`, then take the SHA-256 of that concatenation.

### Multiple CEL expression hashes per expression path

Adding one CEL expression hash per expression path is the default and most secure approach. It is possible to add multiple CEL expression hashes per expression path for additional flexibility, but this is dangerous: a malicious replica node gains the freedom to choose between the hashes. Only use this when the difference between CEL expressions is provably benign or there is insufficient overlap to allow a harmful choice.

### Multiple response hashes per request hash

Similarly, adding multiple response hashes for a single request hash is possible but dangerous: a malicious replica can freely choose between them. Only use this when the difference between responses is provably benign.

## Response body streaming

The HTTP Gateway protocol supports multi-chunk body transfer to work around the IC message size limit. This streaming protocol is independent of any HTTP-level streaming between the gateway and the client. The gateway may assemble the full response before passing it on, or stream it directly. When certifying the response, the gateway must not pass on uncertified chunks.

If the `streaming_strategy` field of `HttpResponse` is set, the gateway fetches additional chunks using query calls:

1. If the callback reference in `streaming_strategy` is not a method of the given canister, the gateway fails the request.
2. The gateway calls the method with the token value from `streaming_strategy`.
3. The method returns a `StreamingCallbackHttpResponse`. The `body` is appended to the response body.
4. If the method returns a token in its `token` field, the gateway repeats from step 2.
5. When `token` is null, streaming is complete.

The token type is chosen by the canister. The gateway obtains the Candid type from the canister and uses it when passing the token back. Because this is a generic use of Candid not covered by the Candid specification, canister authors should use simple types for the token.

## Upgrade to update calls

If a canister sets `upgrade = opt true` in its `http_request` response, the gateway:

1. Ignores all other fields of the `http_request` response.
2. Performs an update call to `http_request_update`, passing an `HttpUpdateRequest` record (identical to `HttpRequest` but without `certificate_version`).
3. Uses the response from `http_request_update` as the final response.

The `upgrade` field in the `http_request_update` response is ignored.

## Legacy response verification

Version 1 response verification supports only a mapping from the request URL to the response body — one response per path. It cannot verify status codes, headers, or redirects, which creates several limitations:

- dApps cannot load the service worker when embedded in iFrames.
- Redirects and cookies are unsafe since malicious nodes can modify them.
- Security headers (e.g., Content Security Policy) can be omitted or altered by malicious nodes.

Version 2 response verification eliminates these issues.

The verification steps for version 1 follow the [response verification outline](#response-verification-outline), with the following additions:

- Assert that the canister does not support response verification v2 via [response verification version assertion](#response-verification-version-assertion). If the canister reports v2 support, verification fails.
- The path `["http_assets", <url>]` must exist in the tree as a leaf, where `<url>` is the UTF-8 encoded URL from the `HttpRequest`.
- If that path is absent, the path `["http_assets", "/index.html"]` must exist as a leaf.
- The leaf must contain the SHA-256 hash of the decoded response body.
  - If `streaming_strategy` is set, all chunks are streamed and concatenated before decoding.
  - Decoding respects the `Content-Encoding` header (supported values: `gzip`, `deflate`).

## Response verification version assertion

Canisters can advertise the response verification versions they support using a public metadata section in the system state tree. The metadata section must be a public custom section named `supported_certificate_versions` containing a comma-delimited list of versions, e.g., `1,2`.

The HTTP Gateway only requests this metadata when there is a downgrade: if the gateway requests v2 but the canister responds with v1, the gateway reads the metadata. If the metadata lookup succeeds and the canister supports a higher version, the gateway rejects responses below the highest mutually supported version.

If the `read_state` request succeeds and the lookup returns `Absent`, the metadata was intentionally not set and the gateway allows whatever version the canister responded with. However, if the metadata section is private or the `read_state` is rejected for any other reason, the gateway must also reject the canister's response — it cannot assume the metadata is absent.

## Canister HTTP interface

The full Candid interface a canister is expected to implement:

```candid
type HeaderField = record { text; text; };

type HttpRequest = record {
    method: text;
    url: text;
    headers: vec HeaderField;
    body: blob;
    certificate_version: opt nat16;
};

type HttpUpdateRequest = record {
    method: text;
    url: text;
    headers: vec HeaderField;
    body: blob;
};

type HttpResponse = record {
    status_code: nat16;
    headers: vec HeaderField;
    body: blob;
    upgrade : opt bool;
    streaming_strategy: opt StreamingStrategy;
};

// Each canister that uses the streaming feature gets to choose their concrete
// type; the HTTP Gateway will treat it as an opaque value that is only fed to
// the callback method

type StreamingToken = /* application-specific type */

type StreamingCallbackHttpResponse = record {
    body: blob;
    token: opt StreamingToken;
};

type StreamingStrategy = variant {
    Callback: record {
        callback: func (StreamingToken) -> (opt StreamingCallbackHttpResponse) query;
        token: StreamingToken;
    };
};

service : {
    http_request: (request: HttpRequest) -> (HttpResponse) query;
    http_request_update: (request: HttpUpdateRequest) -> (HttpResponse);
}
```

Composite query methods can be used instead of query methods to allow calling composite queries of other canisters on the same subnet:

```candid
http_request: (request: HttpRequest) -> (HttpResponse) composite_query;
```

Not all of this interface is required. The sections below describe which parts can be omitted.

### Response verification interface

The `certificate_version` field is optional for canisters that do not implement response verification v2 or later:

```candid
type HttpRequest = record {
    // ...
    certificate_version: opt nat16;
};
```

### Upgrade to update calls interface

The `http_request_update` method and the `upgrade` field are optional if the canister does not use the upgrade feature. Note that `HttpUpdateRequest` is the same as `HttpRequest` but excludes `certificate_version`:

```candid
type HttpUpdateRequest = record {
    method: text;
    url: text;
    headers: vec HeaderField;
    body: blob;
};

type HttpResponse = record {
    // ...
    upgrade : opt bool;
    // ...
};

service : {
    // ...
    http_request_update: (request: HttpUpdateRequest) -> (HttpResponse);
}
```

### Response body streaming interface

The `StreamingToken`, `StreamingCallbackHttpResponse`, and `StreamingStrategy` types and the `streaming_strategy` field are optional if the canister does not use streaming:

```candid
type HttpResponse = record {
    // ...
    streaming_strategy: opt StreamingStrategy;
};

type StreamingToken = /* application-specific type */

type StreamingCallbackHttpResponse = record {
    body: blob;
    token: opt StreamingToken;
};

type StreamingStrategy = variant {
    Callback: record {
        callback: func (StreamingToken) -> (opt StreamingCallbackHttpResponse) query;
        token: StreamingToken;
    };
};
```

### Minimum canister interface

If no optional features are needed, the minimum interface is:

```candid
type HeaderField = record { text; text; };

type HttpRequest = record {
    method: text;
    url: text;
    headers: vec HeaderField;
    body: blob;
};

type HttpResponse = record {
    status_code: nat16;
    headers: vec HeaderField;
    body: blob;
};

service : {
    http_request: (request: HttpRequest) -> (HttpResponse) query;
}
```

## Next steps

- [IC Interface Specification](ic-interface-spec.md) — the parent specification covering the full IC protocol
- [Frontend certification guide](../guides/frontends/certification.md) — how to implement certified asset serving in your canister

<!-- Upstream: informed by dfinity/portal docs/references/http-gateway-protocol-spec.md -->
