---
learn_hub_id: 33152692358036
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/33152692358036-What-Has-Happened-So-Far"
learn_hub_title: "What Has Happened So Far?"
learn_hub_section: "Overview"
learn_hub_category: "What is ICP?"
migrated: false
---

# What Has Happened So Far?

## From Bitcoin to the World Computer

The first successful blockchain project, Bitcoin, revolutionized digital monetary transactions by eliminating the need for a central authority. This reduces trust, costs and latency, compared to traditional centralized banking systems. With the Bitcoin protocol, transactions are recorded in a public ledger and anyone can run a machine with the protocol, adding and verifying transactions in a secure and decentralized manner. Ethereum generalized the ledger concept from storing purely monetary transactions to generic interactions between mutually distrusting parties and made general smart contracts popular. Smart contracts are software programs that are automatically executed on agreement terms when predetermined conditions are met, without intermediaries. Due to Ethereum’s limitations and costs, only small and relatively simple programs are run on it.

Building upon these innovations, DFINITY Foundation founder Dominic Williams envisioned a decentralized, unstoppable, and tamper-proof "World Computer" capable of hosting humanity's systems, services, data, and computations. In other words, such a World Computer would bring the benefits from smart contracts to any application. As a consequence, a World Computer can revolutionize traditional IT infrastructure often hosted on centralized hyperscalers’ cloud solutions and transform various sectors, including social media, gaming, finance, and enterprise systems.  
  


## 2016-2020 Building ICP

To realize this vision, Dominic Williams started to conceptualize a scalable blockchain protocol capable of processing hundreds of thousands of transactions per second, drawing from his experience in developing a massive multiplayer online (MMO) game with millions of users. After establishing the non-profit foundation DFINITY, he attracted world-class experts like Ben Lynn (the L from BLS, a cryptographic signature scheme used in many blockchain protocols), Timo Hanke (developer of AsicBoost and CTO of CoinTerra), Andreas Rossberg (co-inventor of [WebAssembly](https://en.wikipedia.org/wiki/WebAssembly), enabling high-performance code execution in web browsers) and Jan Camenisch (renowned cryptographer from IBM research), to name but a few.

With over $100 million in funding, DFINITY built a world-class R&D composed of computer science research and engineering talents from industry giants like Google, Meta, and IBM. From 2016 to 2021, the DFINITY team designed and implemented the Internet Computer Protocol (ICP). To meet the ambitious performance and security goals, experts in languages, cryptography, distributed system, and software architecture collaborated. For example, ICP required the design and development of advanced cryptographic protocols to establish key material on nodes in a decentralized setting without assumptions on networking conditions. This was achieved through a groundbreaking non-interactive distributed key generation (niDKG) protocol and a key re-sharing protocol, both devised by cryptographer Jens Groth, who worked at DFINITY.

ICP utilizes a unique architecture, designed towards realizing the World Computer vision. To be able to build powerful applications easily, the Motoko programming language was created. The applications running on ICP are organized into [canisters](https://learn.internetcomputer.org/hc/en-us/articles/34210839162004), processing and sending messages to each other following the [actor model](https://en.wikipedia.org/wiki/Actor_model)[.](https://en.wikipedia.org/wiki/Actor_model) For canister execution, DFINITY built a [WebAssembly](https://en.wikipedia.org/wiki/WebAssembly)-based smart contract execution environment, when WebAssembly was still almost exclusively used in browsers, helping WebAssembly to gain a wider field of applicability. For scalability and energy-efficiency, ICP offers true sharding by partioning nodes into [subnets](https://learn.internetcomputer.org/hc/en-us/articles/34206453538964). Each subnet hosts a set of canisters which can make progress independently from other subnets, yet messages between canisters residing on different subnets are exchanged seamlessly.

## 2021 Mainnet launch

In May 2021, the Internet Computer underwent its genesis event, marking its transition to a decentralized production network. The protocol was launched on a sovereign network of 389 specialized node machines, owned and operated by independent node providers, distributed across 16 data centers worldwide.

The genesis event also marked the kick-off of a novel governance system called the [Network Nervous System (NNS)](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236). The NNSs consists of a set of canisters responsible for the token economics and a voting system which allows token holders to decide on the network’s future behavior. More precisely, token holders can vote on configuration changes and trigger autonomous updates of the NNS’s canister code as well as the code for the whole network protocol.

Remembering passwords to log into applications is painful and error-prone. To avoid this problem, ICP offered [Internet Identity (II)](https://learn.internetcomputer.org/hc/en-us/articles/33152205747348) based on WebAuthn and Passkeys already at launch, years before these technologies became widely adopted.

To make trying out canister development as easy as possible, Motoko Playground was launched in the months following mainnet launch. It allows developers to create and deploy canister smart contracts from a standard browser, without any extensions or downloading any software. And of course, the Motoko Playground is actually an application running on the IC as well.

By the end of the first year, 451 nodes were part of the network, located in 24 data centers, together producing 30 blocks per second, more than 15k canister smart contracts were deployed on ICP and almost 2 million Internet Identities were created. Furthermore, concepts and first prototypes for the interaction with the outside world were being designed and developed.

## 2022 - 2025 Network Evolution

In the years since launch, the Internet Computer Protocol has been extended with powerful capabilities to come closer to the World Computer vision. To achieve this, improvements in the following four categories are crucial:

  1. _Giving More Control and Privacy to Users:_ A World Computer should empower users to safeguard their data and digital assets and decide themselves who can access their data and digital assets.
  2. _Performance and Security:_ A World Computer must be able to handle a massive scale of computations and data, while ensuring the security and reliability of the network. High performance and robust security measures are essential for building trust and attracting users to the platform.
  3. _Interoperability with Traditional IT and Blockchains:_ To benefit from the strengths provided by existing systems, a seamless transfer of data and value between different systems is needed.
  4. _Developer and User Experience:_ A World Computer should be accessible to a wide range of developers and users. This requires intuitive development tools, user-friendly interfaces, and seamless interaction between applications.



### Giving more control and privacy to users

In most wide-spread applications today, users surrender control over their personal data and assets to centralized entities, e.g., when interacting with an AI chatbot offered by Big Tech. This paragraph describes features developed in the years since launch to offer a solution enabling user-controlled applications, including the decision power over where they run, when and how software gets upgraded and who has access to what data.

Inspired by the NNS governance approach, a set of canisters forming a [Service Nervous System (SNS)](https://learn.internetcomputer.org/hc/en-us/articles/34084394684564) was developed. They allow a community of token holders to control and update the code of an application. An SNS can be used to raise the initial funding for an application, which can then be used to remunerate teams working on an application’s evolution and adoption based on community decisions. Similarly, the code of an SNS dapp can only be upgraded to a new version when enough community members vote for adoption. The first Test SNS was launched in 2022, one year later, already 11 SNSs had been created and in the meantime there are almost 30 SNSs holding funds in the order of several millions of USD. 

Verifiably Encrypted Threshold Keys, or [vetKeys](hc/en-us/articles/01JJC57VBB7W1W5BCQFZGYTEPS) for short, have been available in production since 2025. vetKeys facilitate key management, data privacy, and security. It allows canisters to obtain an encrypted value that can be used for symmetric, public-key, or identity-based encryption. With vetKeys users can benefit from end-to-end encryption, without having to remember decryption keys or passwords, as the key management is provided by ICP.

Moreover, Internet Identity has been extended to offer [Verifiable Credentials (VCs)](https://internetcomputer.org/docs/current/developer-docs/identity/verifiable-credentials/overview) in 2024. With the VC protocol, canisters can determine if a user has a certain credential in a tamper-evident and privacy-preserving manner. For example, a user can prove to be over 18 without having to share all details from their ID card to a dapp. The first dapps using this protocol have been implemented, e.g., users can prove to OpenChat that they are unique human based with DecideAI’s face recognition.

### Performance and Security

To extend the range of applications which can be run on ICP, its performance and security were improved in the years after launch. Now, each canister can address up to 500 GB of memory (compared to 8GB at launch) and many more subnets have been added to increase the compute capacity of the network.

Today, each subnet can host up to 100k canisters and the scheduling and memory management mechanisms have been tweaked to meet the growing loads’ usage patterns. On the security side, the original set of nodes from launch has been complemented with better machines featuring the ability to run encrypted VMs in the future. Moreover, the subnets hosting critical assets have been strengthened with more nodes to reduce the trust placed in individual nodes. Additional security mechanisms, e.g., canister sandboxing, key rotation and transport protocol changes have been introduced, to keep the users’ assets safe.

### Interoperability with traditional IT infrastructure and blockchains

Traditionally, smart contracts can only operate on inputs and state stored on their blockchain, i.e., they are not able to use information from the outside without additional trust assumptions. Yet, many applications require access to information stored on traditional servers. The [HTTPs outcalls](https://internetcomputer.org/docs/current/developer-docs/smart-contracts/advanced-features/https-outcalls/https-outcalls-overview) feature developed in 2022 enables canister smart contracts to gather such data in a trustworthy manner. Using this feature, stock prices, football scores or IoT data can be fetched directly from web servers publishing such data and then processed by canister smart contracts, without relying on trusted third party services. 

Moreover, ICP was extended to interact with other blockchains. In 2022, ICP brought programmability to Bitcoin. This was achieved by two innovations, network-level interaction between ICP and Bitcoin and chain-key signatures, which together form [Bitcoin integration](https://learn.internetcomputer.org/hc/en-us/articles/34209531762324). Network-level interaction lets canisters read the Bitcoin blockchain and send messages to the Bitcoin nodes directly, without any intermediaries. [Chain-key signatures](https://learn.internetcomputer.org/hc/en-us/articles/34209497587732) enable canisters to control a Bitcoin address and sign Bitcoin transactions. In 2024 support for additional signature schemes was added, which enables canisters to build applications for Ordinals and token standards like BRC-20 and Runes.

To interact with Ethereum, as well as other chains using the Ethereum Virtual Machine (EVM), canisters can now send transactions to EVM chains nodes and get EVM chain data from several EVM chains via the [EVM RPC canister](https://internetcomputer.org/docs/current/developer-docs/multi-chain/ethereum/evm-rpc/overview/). This canister relies on the chain-key signature and HTTPs outcalls features mentioned above.

Among other applications, Bitcoin and Ethereum integration has been used to bring digital token twins to ICP. These twin tokens, called [chain-key tokens](https://learn.internetcomputer.org/hc/en-us/articles/34211397080980), including ckBTC, ckETH, ckUSDC, and ckUSDT, are fully backed by their native tokens and controlled by a canister smart contract. This comes with high security guarantees and lets smart contracts on ICP to hold and transact these tokens at high speed and low cost.

### Developer and User Experience

The ideal world computer will be easy to program for and a pleasure to use, providing an experience superior to today’s web applications. To approach the former, canister developers can benefit not just from more documentation and examples, but improved tooling simplifying testing, deployment, benchmarking and operations. For example, canisters can now use [timers](https://internetcomputer.org/docs/current/motoko/main/base/Timer/) and thus execute code automatically after a specified delay without external triggers. Debugging and optimizing canisters is now simpler thanks to [canister logs](https://internetcomputer.org/docs/current/developer-docs/smart-contracts/maintain/logs/), [performance counters](https://internetcomputer.org/docs/current/references/samples/rust/performance_counters/) and [metrics](https://internetcomputer.org/docs/current/developer-docs/security/security-best-practices/observability-and-monitoring/) accessible to developers. [Motoko memory persistence](https://internetcomputer.org/docs/current/motoko/main/canister-maintenance/orthogonal-persistence/enhanced) was enhanced to make it easier to upgrade canisters to new versions. To simplify the interaction of applications developed by separate teams, [standards](https://github.com/dfinity/ICRC) for ledgers, wallet integration and verifiable credentials were developed.

To improve user experience, caching and latency-aware request routing have been implemented. This, combined with network and consensus protocol optimizations, has reduced the average end-to-end latency for state-changing calls by over 40%. This brings ICP closer to the performance levels expected from traditional infrastructures, with an average latency of around 1.5 seconds, depending on load and subnet size. Additionally, the user experience for Internet Identity and governance applications has been improved through design changes and streamlined workflows

In summary, the advancements in the four categories described above enabled the ICP developers to deploy more than 700k canister smart contracts, which occupy more than 6 TB of state and process more than 6000 messages per second. Thousands of NNS proposals have been voted on, among other things, they led to the upgrade of the whole protocol more than 200 times. Several tens of thousands users log into dapps with Internet Identity per day. Decentralization and capacity have been increased, so today the network is kept up and running by more than 1200 nodes located in 105 datacenters geographically distributed across 22 countries. In other words, the IC more than tripled in size.

## A thriving community

The Internet Computer community is fast-growing and strong. There are now thousands of developers building on the Internet Computer network, and thousands of applications running on it. Indeed, the developer community regularly clocks more GitHub commits than any other in the blockchain industry.

Projects running on the Internet Computer are unique in the industry because they run entirely on a decentralized protocol, without reliance on traditional cloud computing. This was already the case for the very first applications, released in 2021. Among them are social networks, messaging services, NFT marketplaces, and wallets. They showcase how an application which is capable of more than ledger transactions can run on decentralized infrastructure at webspeed, including full frontends, forming a fully decentralized application. See [link to ICP ecosystem page](https://internetcomputer.org/ecosystem) for an overview of the applications running on ICP.

The fast-growing Internet Computer community is focused on building out a new Web3 ecosystem, and eventually moving the vast majority of online systems and services onto the Internet Computer, in a replacement of traditional IT.

