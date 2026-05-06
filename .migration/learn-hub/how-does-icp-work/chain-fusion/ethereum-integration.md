---
learn_hub_id: 34575019947668
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34575019947668-Ethereum-Integration"
learn_hub_title: "Ethereum Integration"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Ethereum Integration

Canister smart contracts on ICP can directly interact with the Ethereum network and other networks that are using the Ethereum Virtual Machine (EVM), such as Polygon and Avalanche. This integration is possible thanks to ICP's HTTPS outcalls and chain-key signatures, which allow Ethereum state to be queried and Ethereum transactions to be signed and submitted by canisters.

  * [HTTPS outcalls:](https://learn.internetcomputer.org/hc/en-us/articles/34211194553492) To query information from Ethereum and other EVM networks, HTTPS outcalls are used. HTTPS outcalls can obtain information from external sources. In this integration, they're used to obtain data from JSON-RPC services by querying Ethereum's transactions, addresses, and block information. To facilitate JSON-RPC calls, the [EVM RPC canister](https://learn.internetcomputer.org/hc/en-us/articles/45550731488916) provides an API endpoint that canisters can use.  

  * [Chain-key signatures for ECDSA:](https://learn.internetcomputer.org/hc/en-us/articles/34209497587732) A canister can have an Ethereum address and sign transactions for that address in a secure and decentralized way using chain-key cryptography. This allows canisters to hold Ethereum natively. Messages sent by the smart contract can be signed in this way, enabling calling any smart contract on Ethereum from the canister.



The main components are depicted in the following figure.

### ![](https://learn.internetcomputer.org/hc/article_attachments/34575033443348)

This functionality also forms the basis for EVM-based [chain-key tokens](https://learn.internetcomputer.org/hc/en-us/articles/34211397080980), like ckETH, ckUSDC, and many more.

## Additional Resources

[Blog article](https://medium.com/dfinity/icp-ethereum-how-icps-evm-rpc-canister-connects-the-networks-b57909efecf6)

[Developer docs on EVM RPC canister](https://internetcomputer.org/docs/current/developer-docs/multi-chain/ethereum/evm-rpc/overview)

<https://github.com/dfinity/evm-rpc-canister>

