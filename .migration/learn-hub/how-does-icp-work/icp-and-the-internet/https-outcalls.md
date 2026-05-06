---
learn_hub_id: 34211194553492
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34211194553492-HTTPS-Outcalls"
learn_hub_title: "HTTPS Outcalls"
learn_hub_section: "ICP and the Internet"
learn_hub_category: "How does ICP work?"
migrated: false
---

# HTTPS Outcalls

In today's Internet, most data and functionality is accessible through Web 2.0 APIs. This includes data such as stock prices, football scores, IoT-related data, or crypto exchange prices. It includes functionality like sending notifications or text messages. This data or functionality would often be useful to smart contracts. Most blockchains have no direct way of providing access to these APIs and resort to (often centralized) oracle services, which are in the hands of intermediaries, vulnerable to hacking, and subject to service fees.

Canister HTTPS outcalls on ICP allow direct interaction with Web 2.0 and other blockchains without oracles. Canister smart contracts can make HTTPS outcalls to specified URLs to directly obtain off-chain data, or to interact with off-chain systems, such as Web 2.0 services or enterprise IT infrastructure.

## Architecture

The HTTPS outcalls feature allows canisters to make outgoing HTTP calls to conventional Web 2.0 HTTP servers. The response of the request can be safely used in computations of the canister, without the risk of state divergence between the replicas of the subnet.

### How an HTTPS outcall is processed by ICP

The canister HTTPS outcalls functionality involves several components on different layers. Let us follow different processing steps when a canister submits an outcalls request.

  1. A canister makes an outgoing HTTP request by calling the management canister API using the `http_request` method.
  2. The request is stored temporarily in the replicated state of the subnet.
  3. Periodically (in each round) an adapter at the networking layer in each replica fetches the pending HTTPS outcalls from the replicated state.  
(In fact, a ‘shim’ layer of the adapter that is inside the replica process does so as the adapter itself is sandboxed into a separate OS-level process for security reasons.)
  4. The adapter on each replica executes the HTTP request by sending it to the target server.
  5. The corresponding HTTP response from the server is received by the adapter on each replica of the subnet and provided to a component in the replica process.  
The adapter limits the network response size.
  6. An optional transformation function implemented as part of the canister is invoked on the respective response on each replica to transform the response.
  7. The transformed response is handed over to consensus on each replica.
  8. ICP consensus agrees on a response if more than 2/3rd of the nodes in the subnet have the same response for the request as input.  
In this case, consensus provides this response back to the management canister API, or an error if no consensus can be reached or in case of other problems.
  9. The management canister API provides the response or error back to the calling canister.



![HTTPS outcalls high-level architecture](https://internetcomputer.org/assets/images/HTTPS_outcalls_HL_architecture-f6a0eb54aef1aae1bd0989456f5d2aee.jpg)

The above figure shows a high-level view of how a canister interacts with the feature and the communication patterns of the subnet replicas with external servers.

To summarize, to perform an HTTP request, each replica pushes an (optionally-transformed) instance of the received HTTP response from the external web server through the Internet Computer's consensus layer, so that the replicas of the subnet can agree on the response provided to the canister, based on all server responses received by the replicas. The optional transformation ensures that, if responses received on different replicas from the server are different in some parts, those differences are eliminated and the same transformed response is provided to consensus on every (honest) replica. This guarantees that on every replica the exact same response (or none at all) is used for canister execution, thereby ensuring that divergence does not happen when using this feature and the replicated state machine properties of the subnet are preserved.

As you can see, the transformation function and the Internet Computer Protocol's consensus play a crucial role for this feature: The transformation function ensures that differences in the responses received by the replicas are removed and transformed responses on different replicas will be exactly the same, thus enabling consensus to provide the agreed-upon response to the calling canister. By running the responses received by the replicas through consensus, the Internet Computer ensures that every replica provides the same response to the smart contract Wasm execution environment.

