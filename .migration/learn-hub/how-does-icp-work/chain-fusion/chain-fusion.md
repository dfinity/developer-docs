---
learn_hub_id: 34329023770260
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34329023770260-Chain-Fusion"
learn_hub_title: "Chain Fusion"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Chain Fusion

Chain Fusion technology enables canisters to interact with multiple blockchain networks in a decentralized manner. This allows developers to build application using information from as well as holding and transferring assets on various blockchains, eliminating the need for trusted intermediaries like bridges.

To make this possible, canisters must be able to

  * sign transactions

  * bi-directionally communicate with other chains




without a single point of trust.

To achieve the former, [chain-key signatures](https://learn.internetcomputer.org/hc/en-us/articles/34209497587732) let canisters control addresses on several blockchain networks and sign transactions to transfer their assets to other addresses.

For the latter, ICP nodes either exchange information with nodes from other blockchain networks natively (see [Bitcoin integration](https://learn.internetcomputer.org/hc/en-us/articles/34211154520084) for more details) or they use HTTPs outcalls to interact with JSON RPC providers for other networks ([Ethereum Integration](https://learn.internetcomputer.org/hc/en-us/articles/34575019947668)).

Among other applications, these integrations have been used to bring digital token twins to ICP. These twin tokens, called [chain-key tokens](https://learn.internetcomputer.org/hc/en-us/articles/34211397080980), including ckBTC, ckETH, ckUSDC, and ckUSDT, are fully backed by their native tokens and controlled by a canister smart contract. This comes with high security guarantees and lets smart contracts on ICP to hold and transact these tokens at high speed and low cost.

