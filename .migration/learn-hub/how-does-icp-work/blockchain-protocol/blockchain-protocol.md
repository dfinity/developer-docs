---
learn_hub_id: 34206453538964
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34206453538964-Blockchain-Protocol"
learn_hub_title: "Blockchain Protocol"
learn_hub_section: "Blockchain Protocol"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Blockchain Protocol

The Internet Computer is created by the Internet Computer Protocol (ICP), from which its utility token, the ICP token, derives its name. The Internet Computer consists of multiple subnets, with each subnet created by its own instance of a blockchain protocol stack. Each subnet hosts canister smart contracts and executes messages sent to them either by users or other canister smart contracts (which may be hosted on the same or another subnet). Messages on the IC are analogous to transactions on other blockchains. Messages addressed to a canister smart contract are executed by the nodes on the corresponding subnet by running the code of the canister. Canister code execution updates the canister state. In order to keep the state on the subnet nodes on which a canister is hosted in sync, it must be ensured that every node executes the same messages in the same order, i.e., fully deterministically. This is the core of the blockchain-based replicated state machine functionality realizing the Internet Computer.

Each node on the Internet Computer runs a replica process. The replica process is structured in a layered architecture consisting of the following 4 layers:

  1. [Peer-to-peer](https://learn.internetcomputer.org/hc/en-us/articles/34207428453140)
  2. [Consensus](https://learn.internetcomputer.org/hc/en-us/articles/34207558615956)
  3. [Message routing](https://learn.internetcomputer.org/hc/en-us/articles/34208241927316)
  4. [Execution](https://learn.internetcomputer.org/hc/en-us/articles/34208985618836)



![4-layer architecture of the Internet Computer](https://csojb-wiaaa-aaaal-qjftq-cai.icp0.io/_astro/core_protocol_layers.Q9HZPKLE_Z1WJp60.webp)

_4-layer architecture of the Internet Computer_

The **peer-to-peer** layer is responsible for accepting messages from users and exchanging messages between nodes in a subnet. The **consensus** layer makes all the nodes on the subnet agree on the messages to be processed, as well as their ordering. The **message routing** layer picks up the finalized blocks from the consensus layer and routes the messages in the blocks to the appropriate canisters. The **execution** layer determinstically executes canister code on the messages received from the messaging layer.

The upper two layers realize deterministic execution of the block of messages for a round received from the lower two layers, on each node of the subnet. At the beginning of a round, all (honest) nodes hold the same state, representing the replicated state of the subnet, which includes the current state of all canisters hosted on that subnet. By executing the messages of the next block received from consensus in a completely deterministic manner, it is ensured that the state after executing the messages of the block is the same on each node.

Canister smart contracts can communicate with each other by sending messages, regardless of whether they are hosted on the same or different subnets. The IC core protocol handles both the inter-canister messages sent locally, i.e., on the same subnet, between canisters, as well as inter-canister messages sent across subnets, so called XNet (or _cross-net_) messages. Local inter-canister messages do not need to go through consensus, while XNet inter-canister messages do (making the former more efficient in terms of throughput and incurring less latency).

To allow nodes to efficiently join a subnet that is running already or to catch up with the current state in case they have been offline for some time, the protocol supports [state synchronization](https://learn.internetcomputer.org/hc/en-us/articles/34471579767572) without processing all messages that have ever been executed.

