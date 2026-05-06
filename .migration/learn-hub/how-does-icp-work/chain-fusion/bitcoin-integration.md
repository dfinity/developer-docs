---
learn_hub_id: 34211154520084
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34211154520084-Bitcoin-Integration"
learn_hub_title: "Bitcoin Integration"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Bitcoin Integration

The Bitcoin integration on the Internet Computer makes it possible to create Bitcoin smart contracts, that is, smart contracts in the form of canisters running on the Internet Computer that make use of real bitcoin. This integration is made possible through two key components.

The first component is [chain-key signatures](https://learn.internetcomputer.org/hc/en-us/articles/34209497587732), which enables every canister to obtain [ECDSA](https://en.wikipedia.org/wiki/Elliptic_Curve_Digital_Signature_Algorithm) and [Schnorr](https://en.wikipedia.org/wiki/Schnorr_signature) public keys and get signatures with respect to these keys in a secure manner. Since Bitcoin addresses are tied to ECDSA/Schnorr public keys, having ECDSA/Schnorr public keys on a canister means that the canister can derive its own Bitcoin addresses. Given that the canister can request signatures for any of its public keys using the [IC ECDSA](https://internetcomputer.org/docs/current/references/ic-interface-spec#ic-sign_with_ecdsa) and [IC Schnorr](https://internetcomputer.org/docs/references/ic-interface-spec#ic-sign_with_schnorr) interface, a canister can create Bitcoin transactions with valid signatures that move bitcoins from any of its Bitcoin addresses to any other address.

The second component is the integration with Bitcoin at the network level. The Internet Computer replicas have the capability to instantiate a so-called _Bitcoin adapter_ , a process external to the replica process. The Bitcoin adapter uses the standard Bitcoin peer-to-peer protocol to get information about the Bitcoin blockchain. At the same time, the Bitcoin adapter communicates with the replica process to learn about the current Bitcoin state inside the replica. If the Bitcoin adapter learns that a Bitcoin block has not been made available to the replica yet, the Bitcoin adapter requests the next missing block from the connected Bitcoin nodes and forwards it to the replica upon receipt.

Inside the replica, Bitcoin blocks are made available to the _Bitcoin canister_. The Bitcoin canister is a canister running on a system subnet whose purpose is to provide Bitcoin-related functionality to other canisters. In particular, it keeps information about the Bitcoin blockchain state and makes this information accessible to other canisters, such as the balance and unspent transaction outputs (UTXOs) of any Bitcoin address. Additionally, the fees of the most recent Bitcoin transactions that were put into blocks can be requested from the Bitcoin canister as well. The Bitcoin canister also offers the last piece of crucial functionality: It provides an endpoint for canisters to send Bitcoin transactions, which are forwarded to the Bitcoin adapter. The Bitcoin adapter in turn advertises the transactions to its connected Bitcoin peers and transfers the transaction upon request.

The architecture of the Bitcoin integration is summarized in the following figure:

![](https://learn.internetcomputer.org/hc/article_attachments/41161561347348)

The figure depicts the main components: The Bitcoin adapter, which acts as a light-weight Bitcoin client that relays Bitcoin-related information between the replica process (on the left) and the Bitcoin network (on the right), and the Bitcoin canister, which interacts with the Bitcoin adapter to maintain the Bitcoin blockchain state and transfer Bitcoin transactions to the Bitcoin network.

As mentioned before, the Bitcoin canister offers a low-level API to read from and write to the Bitcoin blockchain. Usage of the Bitcoin integration API is illustrated in the following sample flow:

![](https://learn.internetcomputer.org/hc/article_attachments/43174436435476)

In this figure, a canister first requests the balance of some Bitcoin address. This may be an address of the canister itself or any other address. Subsequently, the canister fetches the UTXOs of a Bitcoin address with the goal of crafting a Bitcoin transaction, in which case the Bitcoin address must be associated with a public key for which the canister can request signatures. Next, the canister calls the fee endpoint to get recent fees before building a Bitcoin transaction using some of the UTXOs as inputs. For each input, the IC ECDSA API is called to obtain the required signatures. Note that, if a [Taproot address](https://en.wikipedia.org/wiki/List_of_bitcoin_forks#Taproot) is used, the IC Schnorr API is used instead. In the last step, the transaction is submitted.

## Additional information

There are many sources providing additional information about the Bitcoin integration on the Internet Computer:

  * The [developer docs](https://internetcomputer.org/docs/build-on-btc/) are the right starting point for developers who wish to implement Bitcoin smart contracts on the Internet Computer.
  * The [Bitcoin canister source code](https://github.com/dfinity/bitcoin-canister) can be found on GitHub, including its [interface specification](https://github.com/dfinity/bitcoin-canister/blob/master/INTERFACE_SPECIFICATION.md).
  * A more detailed description of the integration, including the cycles cost of each endpoint, can be found [here](https://internetcomputer.org/docs/references/bitcoin-how-it-works).
  * The [scientific paper](https://arxiv.org/pdf/2506.21327) on the Bitcoin integration is the right source for those who wish to learn about the technical details.



