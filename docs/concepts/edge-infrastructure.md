---
title: "Edge infrastructure"
description: "How requests reach ICP canisters: API boundary nodes, HTTP gateways, the HTTP Gateway Protocol, and asset certification."
---

The Internet Computer extends the internet beyond connecting devices and networks: it runs applications in a tamperproof manner. For a browser or an API client to interact with a canister, requests must travel through the ICP edge infrastructure, which translates standard HTTP into ICP's canister call protocol, routes calls to the right subnet, and certifies responses before they reach the client.

The edge infrastructure has two main components:

- **API boundary nodes** handle IC API requests (query and update calls) and route them to the correct subnet.
- **HTTP gateways** translate standard HTTP requests from browsers and other clients into IC API calls and translate responses back into HTTP.

![ICP edge infrastructure: browsers connect through HTTP gateways and API boundary nodes to subnet replicas](/concepts/edge-infrastructure/edge-infrastructure.png)

## API boundary nodes

API boundary nodes are the globally distributed public interface of the Internet Computer. They receive IC API requests and route them to nodes on the appropriate subnet, providing seamless access to canisters without relying on centralized infrastructure.

Beyond routing, API boundary nodes perform several additional functions:

- **Dynamic routing.** They continuously monitor the network topology and adapt routing accordingly as subnets are added, removed, or reconfigured.
- **Load balancing.** Traffic is distributed across replica nodes to optimize performance.
- **Caching.** Some query responses are cached to reduce latency for frequently accessed data.
- **Security enforcement.** API boundary nodes implement safeguards that protect both themselves and the core protocol from abuse.

API boundary nodes are an integral part of the network, governed by the Network Nervous System (NNS). Any addition, removal, or upgrade of API boundary nodes requires an NNS proposal, ensuring transparency. They run on hardware owned by independent node providers, similar to replica nodes.

All API boundary nodes run a service called `ic-boundary`. The network uses a single VM image for both replica and API boundary nodes: the orchestrator component on each node determines its role by launching either `ic-replica` or `ic-boundary`.

Around 20 API boundary nodes are currently deployed worldwide. An up-to-date list is available on the [IC dashboard](https://dashboard.internetcomputer.org/nodes?s=100&type=ApiBoundary).

## HTTP gateways

HTTP gateways translate standard HTTP requests into IC API calls and forward them to API boundary nodes. Because of this translation layer, browsers and other HTTP clients can access canisters directly without installing any special software. For example, a website fully hosted on ICP is accessible in any browser through a normal HTTPS URL.

The HTTP Gateway Protocol (defined in the [HTTP Gateway Protocol Specification](../references/http-gateway-protocol-spec.md)) specifies exactly how this translation works. HTTP gateways are not part of ICP itself and can be operated by anyone. This open model encourages a diverse set of gateways, enhancing redundancy and availability.

## HTTP Gateway Protocol

When a browser opens a URL hosted by a canister, the following happens:

1. The browser makes a normal HTTPS request to the domain (for example, `https://<canister-id>.icp.net`). It has no awareness that the site runs on ICP.
2. The HTTP gateway receives the request and translates it into a query call to the canister's `http_request` method, placing the path, headers, and body into the call payload.
3. An API boundary node receives the IC API call and forwards it to a replica on the subnet that hosts the target canister.
4. The canister executes the `http_request` query, constructs an HTTP response (status, headers, body), and returns it.
5. The HTTP gateway receives the canister's response, verifies the certificate (see Asset certification below), and constructs a standard HTTP response.
6. The browser receives the HTTP response and renders the page.

Canisters that serve HTTP must implement the Canister HTTP Interface defined in the HTTP Gateway Protocol Specification. The main implementation of the protocol is the [ic-http-gateway library](https://github.com/dfinity/ic-http-gateway-protocol/tree/main/packages/ic-http-gateway-protocol).

## Asset certification

When a canister responds to a query call via the HTTP gateway, a single replica node handles the request. The client cannot rely solely on that node's response, since a compromised node could return tampered content.

ICP solves this through **asset certification**: a mechanism for canisters to prove in advance that a response is genuine. It works as follows:

- The ICP network maintains a public key at the network level. Each subnet also has its own public key, which is certified by the NNS using the network key.
- When a subnet responds to a message, the response includes a certificate chain: the subnet's signature on the response and the NNS certificate on the subnet's key. Any client can verify this chain using only the ICP network's public key.
- Because generating a subnet certificate requires agreement from at least two thirds of the subnet's nodes (using [chain-key cryptography](chain-key-cryptography.md#threshold-bls-signatures)), a certified response represents network-level consensus, not a single node's assertion.
- Query calls do not go through consensus and are not automatically certified. To serve certified query responses, canisters use **certified variables**: the canister stores a certificate for a piece of data in the replicated state during an update call. Any user can later retrieve both the data and its certificate via a query call and verify the certificate independently.
- For web assets (HTML, CSS, JavaScript, images), canisters can certify all assets upfront. The asset canister provided by DFINITY handles this automatically: developers specify a folder of assets and the asset canister manages and certifies them.

When the HTTP gateway receives a canister response that includes a certificate, it verifies the certificate before passing the response to the client. This is what makes ICP-hosted web content verifiable end-to-end without trusting any single node.

For practical guidance on certifying canister responses, see [Certified variables](../guides/backends/certified-variables.md).

## Further reading

- [HTTP Gateway Protocol Specification](../references/http-gateway-protocol-spec.md): detailed protocol definition
- [ic-http-gateway library](https://github.com/dfinity/ic-http-gateway-protocol/tree/main/packages/ic-http-gateway-protocol): the main implementation of the HTTP Gateway Protocol
- [response-verification](https://github.com/dfinity/response-verification): libraries for certifying canister responses to work with the HTTP gateway protocol
- [Certified variables guide](../guides/backends/certified-variables.md): how to certify canister responses
- [Chain-key cryptography](chain-key-cryptography.md): the signature mechanism underlying certification

<!-- Upstream: informed by Learn Hub articles "ICP and the Internet", "ICP Edge Infrastructure", "HTTP Gateway Protocol", "Asset Certification" (migrated, source retired) -->
