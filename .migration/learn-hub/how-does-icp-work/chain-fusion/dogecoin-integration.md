---
learn_hub_id: 46782835018516
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/46782835018516-Dogecoin-Integration"
learn_hub_title: "Dogecoin Integration"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Dogecoin Integration

The [Dogecoin](https://dogecoin.com/) integration on the Internet Computer makes it possible to create Dogecoin smart contracts, that is, smart contracts in the form of canisters running on the Internet Computer that make use of real dogecoin.

This integration heavily reuses the [Bitcoin integration](https://learn.internetcomputer.org/hc/en-us/articles/34211154520084) since Dogecoin is a Bitcoin fork. Just like the Bitcoin integration, the Dogecoin integration consists of two main components. It also uses a dedicated process, called the _Dogecoin adapter_ , that interacts with the Dogecoin network directly. The current state of the Dogecoin blockchain is maintained in the [Dogecoin canister](https://github.com/dfinity/dogecoin-canister), which also manages all communication with the Dogecoin adapter. The high-level architecture is depicted in the following diagram.

![](https://learn.internetcomputer.org/hc/article_attachments/46782851378068)

More information including technical details can be found on the [Bitcoin integration](https://learn.internetcomputer.org/hc/en-us/articles/34211154520084) page. Information on how to get started with the Dogecoin integration can be found [here](https://dfinity.github.io/dogecoin-canister/).

