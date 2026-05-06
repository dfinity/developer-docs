---
learn_hub_id: 34209955782420
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34209955782420-Subnet-Creation"
learn_hub_title: "Subnet Creation"
learn_hub_section: "Evolution & Scaling"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Subnet Creation

Ever wondered about the meaning behind DFINITY? It’s Decentralized + Infinity. It’s named that way because the Internet Computer is designed to scale infinitely. It means that the Internet Computer can host an unlimited number of canisters (smart contracts), store an unlimited amount of memory, process an unlimited amount of transactions per second. In simple words, Internet Computer is designed to host even large scale applications like social media platforms in a fully decentralized way.

There are two types of widely-used approaches to improve the scalability of a system: (1) Vertical Scaling, and (2) Horizontal Scaling. Vertical scaling means adding more CPU, RAM and disk to a single computer. Horizontal scaling means adding more computers to the system. There is a limit to vertical scaling. But with horizontal scaling, one can achieve unlimited scalability. Internet Computer is one of the first blockchains to successfully use horizontal scaling.

The Internet Computer scales its capacity horizontally by creating new subnets that host additional canisters — just like traditional cloud infrastructure scales by adding new machines. More precisely, the nodes in the Internet Computer are divided into subnets, each containing a few dozen nodes. The set of nodes in a subnet together maintain one blockchain. Each subnet can host thousands of canisters and process messages received by those canisters. Each subnet has a limited capacity in terms of the number of canisters (around hundred thousand), amount of storage (hundreds of GBs), and bandwidth (a few hundred transactions per second). But as more subnets are added to the Internet Computer, its overall capacity increases proportionately. Once the IC’s Network Nervous System (NNS) decided to create a new subnet, it selects a group of spare nodes that have joined the IC but have not yet been allocated to any subnet and creates the initial configuration of the new subnet. The selected group of nodes then begins to form a new subnet blockchain.

![Internet Computer is divided into subnets](https://csojb-wiaaa-aaaal-qjftq-cai.icp0.io/_astro/add-new-subnet.34gYPhhU_ZY0r2F.webp)

Another crucial design aspect is the inter-subnet (Xnet) communication of canisters: A canister of a subnet can send asynchronous messages to any canister on any other subnet. XNet messages are ingested by the receiving subnet’s consensus layer and their integrity is validated based on the sending subnet’s threshold signature — another application of [chain-key cryptography](https://learn.internetcomputer.org/hc/en-us/articles/34209486239252). This architecture of XNet messaging leads to a “loose coupling” of the subnets that does not require a central component such as a shard chain as used in other blockchains with multiple “shards” that would create a bottleneck when scaling out. Therefore newly added subnets can immediately send and receive XNet messages to any other subnet and an increasing number of subnets does not hit a natural bottleneck as in other, more simplistic, architectures.

Creating a new subnet has two steps. (1) Adding new nodes to the Internet Computer, and (2) Creating a subnet with the available nodes. Anyone can purchase the node hardware and add it to the Internet Computer by following the [node provider onboarding process](https://wiki.internetcomputer.org/wiki/Node_Provider_Documentation).

We now describe how to create a new subnet with the available nodes. The Internet Computer has a decentralized governance system called [Network Nervous System (NNS)](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236). Essentially, the NNS consists of a group of canisters that manage the Internet Computer. In the NNS, there is a component called “registry”, which stores the full configuration of the Internet Computer. The registry has a record for each subnet which includes a protocol version, the list of nodes in the subnet, protocol configuration parameters, etc.

![Proposal to create a new subnet.](https://csojb-wiaaa-aaaal-qjftq-cai.icp0.io/_astro/new-subnet-proposal.DhFWWB9r_1YulmL.webp)

To add a new subnet, one has to submit a proposal to the NNS to add a record for a new subnet to the registry. The proposal consists of the list of nodes to be included in the new subnet. .The status of all proposals can be viewed on the [IC Dashboard](https://www.dashboard.internetcomputer.org). The proposal can be voted on by anyone who staked their ICP tokens. If a majority of voters accept the proposal, then the registry canister instructs the NNS subnet to generate — in a fully decentralized way using [chain-key cryptography](https://learn.internetcomputer.org/hc/en-us/articles/34209486239252) — the cryptographic key material to be used by the new subnet and a catch up package containing the genesis block. The registry canister then adds a record containing the configuration of the subnet.

We now describe how a new subnet is created after a record is added to the registry. Each node runs 2 main processes, the (1) Replica and the (2) Orchestrator. The replica consists of the 4-layer software stack that maintains the blockchain and executes the canister messages. The orchestrator downloads and manages the replica software. When a new node is onboarded, the node provider has to install IC OS on the node, which contains the orchestrator software. The orchestrator regularly queries the NNS registry for any updates. If the orchestrator sees in a registry record that the node is included in a newly created subnet, then the orchestrator downloads the corresponding replica software, and runs the replica with the Catch Up Package included in the registry as input. The replica then starts accepting messages and the consensus protocol extends the genesis block present in the catch up package.

