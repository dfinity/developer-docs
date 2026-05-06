---
learn_hub_id: 39314351721492
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/39314351721492-Performance-Comparison"
learn_hub_title: "Performance Comparison"
learn_hub_section: "Performance"
learn_hub_category: "What is ICP?"
migrated: false
---

# Performance Comparison

Given the rapid pace of innovation, periodic assessments are crucial to gauge the progress of the Internet Computer towards the [World Computer vision](https://learn.internetcomputer.org/hc/en-us/articles/33624077003668). 

In this article, we evaluate ICP alongside other blockchain projects using metrics that reflect what constitutes a good Web3 experience, categorized into core protocol, developer experience, and user experience.

Unless otherwise stated, metric data corresponds to July 13, 2025.

## Core Protocol 

This section compares standard metrics used to assess the core protocol performance of popular blockchain projects. Note that these metrics cannot always be taken at face value. While references to where the figures can be found are given below, it is not always clear how these figures were obtained. Additionally, parts of different projects may have the same name, but are often constructed differently (most notably, transactions), and so should not be compared blindly like-for-like. The[ a16z blog](https://a16zcrypto.com/why-blockchain-performance-is-hard-to-measure/) has a nice article describing how the industry should think about metrics.

| Average MIEPS | Average TPS | Average finality | Average block time | Average TX cost | Average energy consumption | Network size | Onchain storage cost  
---|---|---|---|---|---|---|---|---  
ICP | 75,000 | 1,176 | 0.64 s |  [0.50 s](https://ic-api.internetcomputer.org/api/v3/daily-stats?start=1746662500&end=1746662500&format=json) | $3.3E-8 = $0.000000033 | 0.003 Wh/tx |  [571](https://ic-api.internetcomputer.org/api/v3/daily-stats?start=1746662500&end=1746662500&format=json) |  [$5.35](https://internetcomputer.org/docs/building-apps/essentials/gas-cost)  
Avalanche |  [5.42](https://stats.avax.network/dashboard/overview/) | 3.99 |  [0.8 s](https://build.avax.network/academy/avalanche-fundamentals/02-avalanche-consensus-intro/04-tps-vs-ttf) |  [1.48 s](https://chainspect.app/chain/avalanche?range-cm=month) | $0.006 | 0.395 Wh/tx |  [1,367](https://snowtrace.io/validators) |   
Cardano | 2 | 0.37 |  [120 s](https://chainspect.app/chain/cardano?range-cm=month) |  [20.13 s](https://chainspect.app/chain/cardano?range-cm=month) | $0.193 | 1.27 Wh/tx |  [2,998](https://cardanoscan.io/pools) (stake pools)  | $2,174  
Ethereum |  [1.5](https://ycharts.com/indicators/ethereum_gas_used_per_day) | 14.37 |  [12 min](https://chainspect.app/chain/ethereum?range-cm=month) |  [12.09 s](https://chainspect.app/chain/ethereum?range-cm=month) | $0.659 | 0.956 Wh/tx |  [9,509](https://etherscan.io/nodetracker) | $2,993,082  
Near |  [948](https://nearblocks.io/) | 67.91 |  [1.8 s](https://chainspect.app/chain/near?range-cm=month) |  [1.1 s](https://chainspect.app/chain/near?range-cm=month) | $0.002 | 0.602 Wh/tx |  [253](https://nearblocks.io/node-explorer) |  $1,296   
Solana |  [1,250](https://solanacompass.com/statistics) | 1,199 |  [12.8 s](https://chainspect.app/chain/solana?range-cm=month) |  [0.4 s](https://chainspect.app/chain/solana?range-cm=month) | $0.010 | 0.517 Wh/tx |  [5,846](https://solanacompass.com/statistics/decentralization) |  $57,440   
  
  * Average MIEPS measures millions of instructions executed per second, which is an approximation of useful work performed. For ICP, Avalanche and Solana, the calculation follows from the reported cycles / gas / compute units used in execution. For Near, we approximate it by assuming 1 Tgas corresponds to 1 ms of CPU time at 2B instructions / 1s of CPU time. For Cardano, we give the maximum capacity corresponding to 20ms of CPU time per block at 2B instructions / 1s of CPU time. For Ethereum, we go by the block gas limit (the EVM is a 32-byte stack machine; we count 1 gas as 4 CPU instructions to be generous, see [link](https://learn.internetcomputer.org/hc/en-us/articles/39158902116884) for more details).
  * Average TPS measures the transactions processed per second over 30 days as reported on [Chainspect](https://chainspect.app/chain/icp?range-cm=month) on May 12, 2025. For ICP, only update calls are considered.
  * Average finality refers to the amount of time that passes between the proposal of a new valid block containing transactions until the block has been finalized and its content is guaranteed to not be reversed or modified (for some blockchains, e.g., Bitcoin, this guarantee can only be probabilistic). For ICP, the reported value is the average over all subnets of their nodes' average time between starting a round until a valid finalization for this round is available.
  * Average block time refers to the amount of time between blocks (per subnet on the IC)
  * Average TX cost measures the cost of a transaction as reported on [Artemis Analytics](https://app.artemisanalytics.com/chains?selectedChains=avalanche%2Cethereum%2Cnear%2Csolana%2Calgorand%2Ccardano%2Cinternet-computer) on Jul 10, 2025.
  * Average energy consumption measures the energy consumption to process a transaction (measured in Watt hours). Figures true as of December 2023. Source: [Carbon Crowd Sustainability Report 2023](https://assets.carboncrowd.io/reports/ICF2023.pdf).
  * Size of network (nodes) notes the number of nodes currently validating the blockchain.
  * On-chain storage cost gives the dollar cost of storing 1 GiB of data per year on chain. For Near and Solana, to store data one needs to maintain a specified token balance. We convert this balance to USD and annualise by multiplying by 5%. For Cardano and Ethereum, the user pays to store the data "forever", and again we annualise by multiplying this cost by 5%.



## Developer Experience

Developers always face hardware limitations, whether writing games, operating systems, or text editors. Historically, applications were restricted to limited memory, instruction sets, and demanded high power consumption. This mirrors the majority of today's blockchain landscape. Application developers contend with small stack sizes, expensive and limited persistent storage, cumbersome APIs with hidden assumptions, and inefficient chains that consume excessive power per transaction. This not only restricts deployable applications but also increases development and testing time and cost.  
In contrast, ICP brings modern programming to on-chain developers. The IC programming model offers orthogonal persistence, large stack and heap spaces (6 GiB), stable storage of 500 GiB in bespoke (Motoko) and mainstream languages, such as Rust, TypeScript, or Python.

| **Stable TX cost** | **HTTPs outcalls** | **Smart contract language support** | **Max stack size** | **Max persisted memory (per smart-contract)** | **Active developers (full-time / monthly)** | **Active repositories**  
---|---|---|---|---|---|---|---  
ICP | ✅ | ✅ | Motoko (native), Rust, TypeScript, Python, C++, ... | 6 GiB | 500 GiB | 1217 / 625 | 15 K  
Avalanche | ❌ | ❌ | Solidity |  |  | 4173 / 538 | 7.1 K  
Cardano | ❌ | ❌ | Plutus (native), Haskell |  |  | 231 / 577 | 3.9 K  
Ethereum | ❌ | ❌ | Solidity (native), Vyper, Yul, FE | 32 KiB | 2^261 B | 2500 / 7700 | 27.7 K  
Near | ❌ | ❌ | Rust, Javascript | 256 KiB | 32 KiB | 240 / 777 | 14 K  
Solana | ❌ | ❌ | Rust C, C++ |  |  | 1K / 4.2K | 67 K  
  
  * Stable TX cost provides the ability to have predictable costs for computation.
  * HTTPs outcalls is the ability to communicate directly with Web2 services (outside of the network).
  * Max stack size is the maximum size the stack can grow for smart contracts and serves as a measure for the complexity of code that is supported by each platform.
  * Max persisted memory is the maximum amount of persisted memory supported by each platform. Persisted memory is preserved across individual function calls.
  * Active developers refers to the number of developers who made commits on more than 10 days in a month (full-time) or original code authors who made commits in a given month ([Electric Capital](https://www.developerreport.com/), July 10, 2025).
  * Active repositories are sourced from the [Electric Capital crypto ecosystems list](https://github.com/electric-capital/crypto-ecosystems) (July 10, 2025).



## User Experience

Key usability criteria include privacy, identity management, and authentication. The ability to trace and monitor every user interaction in many projects is seen as a major barrier to adoption, despite the benefits of transparency. Financial privacy and freedom of interaction are paramount.   
The accessibility and openness of onboarding are also measured by the tools required for user interaction. The percentage of native tokens staked is a measure of user confidence and project participation. Similarly, the number of addresses used for transactions indicates the adoption level.

| **Privacy-preserving authentication** | **Prerequisites to use** | **Staking ratio** | **Daily active addresses**  
---|---|---|---|---  
ICP | ✅ | Browser | 43.4% | 10.41 K  
Avalanche | ❌ | Browser, browser extension, tokens | 51.34% | 22.78 K  
Cardano | ❌ | Browser, browser extension, tokens | 60.32% | 41.37 K  
Ethereum | ❌ | Browser, browser extension, tokens | 29.67 % | 37.89 K  
Near | ❌ | Browser, browser extension, tokens | 45.46% | 456.45 K  
Solana | ❌ | Browser, browser extension, tokens | 66.43% | 2.85 M  
  
  * Privacy-preserving authentication notes whether a project allows privacy-preserving interactions with the blockchain.
  * Prerequisites to use lists what is needed to interact with the project
  * Staking ratio gives the percentage of native tokens that are staked in the protocol. The staking ratio metrics are taken from [Staking Rewards](https://www.stakingrewards.com/cryptoassets/) on July 13, 2025.
  * Daily active addresses counts addresses that sent or received native currency on a given day, taken from [Artemis](https://app.artemisanalytics.com/chains?selectedChains=avalanche%2Cethereum%2Cnear%2Csolana%2Calgorand%2Ccardano%2Cinternet-computer) on July 10, 2025.



## A note on decentralization

Decentralization is key to make web3 dapps run in a trustless manner. However, decentralization has many dimensions and cannot be understood and quantified using a single number or coefficient. One can distinguish between a) the decentralization of the node providers running the machines on top of which a protocol runs, b) the decentralization of the consensus and sharding mechanism, c) the governance system, the owners of liquid tokens, etc. The whole is greater than the sum of its parts and one cannot understand the decentralization of a system without a discussion of each of these topics.

## References

  * ICP : [IC Dashboard](https://dashboard.internetcomputer.org/)
  * ADA : [Cardano explorer](https://explorer.cardano.org/en) and [cexplorer](https://cexplorer.io/)
  * AVAX : [Snowtrace](https://snowtrace.io/) and [Avalanche explorer](https://subnets.avax.network/)
  * ETH : [Etherscan](https://etherscan.io/)
  * NEAR : [Near explorer](https://explorer.near.org/) and [Near docs](https://docs.near.org/)
  * SOL : [Solana website](https://solana.com/) and [Solana beach](https://solanabeach.io/)  




