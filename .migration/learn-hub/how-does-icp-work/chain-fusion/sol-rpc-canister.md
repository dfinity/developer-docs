---
learn_hub_id: 46782465439764
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/46782465439764-SOL-RPC-Canister"
learn_hub_title: "SOL RPC Canister"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# SOL RPC Canister

The [SOL RPC canister](https://github.com/dfinity/sol-rpc-canister) is a canister that enables the communication between canisters on the Internet Computer and smart contracts on the [Solana](https://solana.com/) blockchains.

Canisters can send requests to the SOL RPC Canister, which forwards the request to multiple JSON-RPC services using [HTTPS outcalls](https://learn.internetcomputer.org/hc/en-us/articles/34211194553492) and returns a response to the canister that sent the request.

# Architecture

The following figure depicts the involved components and their interactions at a high level.

![](https://learn.internetcomputer.org/hc/article_attachments/46782497345940)

The SOL RPC Canister accepts requests from canisters and interacts with JSON-RPC providers via HTTPS outcalls to obtain data from and submit data to Solana. Multiple JSON-RPC providers are queried to ensure that the response does not come from a single centralized party. At the same time, this mechanism guarantees that there is no single point of failure. Currently, the following JSON-RPC providers are supported: [Alchemy](https://www.alchemy.com/), [Ankr](https://www.ankr.com/), [Chainstack](https://chainstack.com/), [dRPC](https://drpc.org/), [Helius](https://www.helius.dev/), and [PublicNode](https://publicnode.com/).

The SOL RPC is controlled by the [Network Nervous System DAO](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236), i.e., its functionality cannot be changed by a single entity. Together, these mechanisms ensure that no trust in additional parties (bridges or oracles) are necessary for the caller canister to send transactions and to condition executions on Solana state.

A [code sample](https://github.com/dfinity/sol-rpc-canister/tree/main/examples/basic_solana) showing how to use the SOL RPC canister can be found in the [SOL RPC canister repository](https://github.com/dfinity/sol-rpc-canister/).

