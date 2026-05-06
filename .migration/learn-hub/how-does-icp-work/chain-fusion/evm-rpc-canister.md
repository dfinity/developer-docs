---
learn_hub_id: 45550731488916
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/45550731488916-EVM-RPC-Canister"
learn_hub_title: "EVM RPC Canister"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# EVM RPC Canister

The [EVM RPC Canister](https://github.com/internet-computer-protocol/evm-rpc-canister) is a canister that enables the communication between canisters on the Internet Computer and smart contracts on Ethereum and other EVM (Ethereum Virtual Machine) blockchains.

Canisters can send requests to the EVM RPC Canister, which forwards the request to multiple JSON-RPC services using [HTTPS outcalls](https://learn.internetcomputer.org/hc/en-us/articles/34211194553492) and returns a response to the canister that sent the request. As such, the EVM RPC canister acts as a gateway for canisters to communicate with and query information from EVM-compatible chains. It provides endpoints that ICP developers can use to interact with Ethereum smart contracts and ensures that the responses received from the Ethereum network are secure and immediately useful within a canister.

## Architecture

The following figure depicts the involved components and their interactions at a high level.

![](https://learn.internetcomputer.org/hc/article_attachments/45550731486996)

The EVM RPC Canister accepts requests from canisters and interacts with JSON-RPC providers via HTTPS outcalls to obtain data from and submit data to Ethereum or other EVM-based blockchains. Multiple JSON-RPC providers are queried to ensure that the response does not come from a single centralized party: The HTTPs outcalls mechanism guarantees that at least 2/3 of the subnet's nodes agree on the response obtained from the server. Once the response is validated, it is sent to the canister that originated the request. 

For Candid-RPC methods such as `eth_getTransactionReceipt`, the EVM RPC canister sends the same request to at least three different RPC providers by default and compares the results. If there are discrepancies, the caller receives a set of inconsistent results to handle them in a way that makes sense for the use case. Instead of relying on the default, the caller can specify the total number of providers to be queried or even list the concrete providers of choice. Moreover, the caller can also set a minimum number of providers that must return the same (non-error) result. Currently, the following JSON-RPC providers are supported: [CloudFlare](https://www.cloudflare.com/), [Alchemy](https://www.alchemy.com/), [Ankr](https://www.ankr.com/), and [BlockPI](https://blockpi.io/).

Beyond the Ethereum blockchain, this canister also has partial support for [Polygon](https://polygon.technology/), [Avalanche](https://www.avax.network/), and other popular EVM networks.

The EVM RPC is controlled by the [Network Nervous System DAO](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236), i.e., its functionality cannot be changed by a single entity. Together, these mechanisms ensure that no trust in additional parties (bridges or oracles) are necessary for the caller canister to send transactions and to condition executions on Ethereum state.

Detailed information about the available endpoints and code samples can be found in the [developer docs](https://internetcomputer.org/docs/current/developer-docs/multi-chain/ethereum/evm-rpc/overview).

