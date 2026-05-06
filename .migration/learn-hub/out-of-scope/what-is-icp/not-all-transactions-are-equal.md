---
learn_hub_id: 39158902116884
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/39158902116884-Not-All-Transactions-Are-Equal"
learn_hub_title: "Not All Transactions Are Equal"
learn_hub_section: "Performance"
learn_hub_category: "What is ICP?"
migrated: false
---

# Not All Transactions Are Equal

Whilst it is typical for blockchains to flaunt metrics around transactions per second (TX/s) or transactions per day (TX/d), comparisons between blockchains only make sense when those transactions are roughly equivalent, i.e., TX/s comparisons only make sense to compare within a single problem domain.

The Internet Computer is a blockchain-based platform designed to function as a decentralized World Computer. As a consequence, the IC typically performs more demanding computations in a single step than most other blockchain networks. 

This page aims to explain the differences between the work performed on ICP vs Ethereum.

## ETH vs. ICP execution throughput

Both ETH and ICP are able to run (general-purpose) smart contracts. At the execution layer, contracts are translated to a lower-level virtual-machine-interpretable language. These are EVM in the case of ETH and a Wasm-compatible runtime in the case of ICP (see [ICP Execution Layer article](https://learn.internetcomputer.org/hc/en-us/articles/34208985618836) for an introduction). Both EVM and Wasm instructions include arithmetic instructions (e.g., add, mul, div), but also more smart-contract specific instructions (e.g., reading and writing memory). The latter are in general more expensive operations in terms of consumed resources, which is then translated into the amount of gas used for each opcode of ETH and [cycles](https://learn.internetcomputer.org/hc/en-us/articles/34573913497108) for ICP.

To compare the overall throughput of the two blockchains (i.e., how many operations per second can be handled), one needs to make several assumptions. The first is that simpler EVM instructions (e.g., add, mul, div, etc.) are roughly equivalent to the Wasm instructions of the same type, both kinds being translated to a similar x86 instruction executed by the hardware. The comparison is much more complex and not apples-to-apples for the more complex operations. For a proper comparison here one would need to either (1) thoroughly understand the design of both execution layers, or (2) run a similar program/benchmark on both systems and compare their overall performance. These two options are time-consuming and would lead to longer-term research efforts. For a quicker comparison, one can instead assume that all EVM instructions are equal in terms of gas cost (and also assume no fees are involved). Since ETH is currently burning approximately **108.3B gas units per day** (<https://ycharts.com/indicators/ethereum_gas_used_per_day>, as of Sept 16, 2024), and assuming each instruction costs 1 gas unit (which vastly  _underestimates_ the costs of memory access operations), it is clear that the ETH blockchain is running less than 109B instructions per day.

In sharp contrast, the IC executed more than 110B replicated Wasm instructions per **second** on Sept 16, 2024. Under the simplifying assumption that all instructions are comparable, this means the IC runs the daily load of ETH instructions in less than 1 second.

Ethereum executed about 1.102M transactions on September 16, 2024 ([https://ycharts.com/indicators/ethereum_transactions_per_day](https://ycharts.com/indicators/ethereum_transactions_per_day#:~:text=Ethereum%20Transactions%20Per%20Day%20is,completed%20on%20the%20Ethereum%20network.)), which means that there were on average 0.098M = 98000 instructions per transaction that day. For the same day, the dashboard of the IC shows that 110B instructions/s were executed for about 8500 replicated calls/s, amounting to an average of more than 12.9M instructions per call. To compare the work intensity of the two blockchains, we take the number of instructions executed per replicated call on ICP and divide it by the number of instructions per transaction on Ethereum. By this measure, ICP performs roughly 130× more computational work per transaction. It's important to note that the multiplier is calculated only considering replicated calls as these are the interactions that carry out ETH equivalent work.

To compare the two networks in terms of efficiency, one also needs to consider the replication factor. In ICP the typical replication factor for a subnet is 13 versus approximately 1.5M for Ethereum (a number that is steadily increasing <https://beaconscan.com/stat/validator>). While not a direct apples-to-apples comparison (since Ethereum validators do not all execute every transaction, whereas ICP subnet nodes do), this highlights how the ICP can achieve consensus with significantly less replicated execution overhead whilst retaining a high level of security, setting it apart from traditional blockchain architectures.

## ETH vs ICP EdDSA verification

To get a view on the validity of the above calculations in a real-world setting, comparisons can be made by running a given function. A realistic function that is used often in the blockchain setting is signature verification.

Previous work from the Ethereum Foundation estimates that validating an EdDSA signature costs around 500K in Gas ([source](https://ethresear.ch/t/verify-ed25519-signatures-cheaply-on-eth-using-zk-snarks/13139)). One way to get a comparison on the IC is to create a canister, import the [Rust ed25519 library](https://docs.rs/ed25519/latest/ed25519/) and test verification by creating a signature on a hash of an arbitrary message and using that for verification. Counting [cycles](https://learn.internetcomputer.org/hc/en-us/articles/34573913497108) burned before and after this call, discounting the base cost (i.e., cycles charged for ingress and for running an update call) results in a cycle cost of 4,211,120.

Putting a dollar cost on this comparison, with a conservative assumption that 1 Gas costs 40 GWEI and 1 ETH being priced around $1,800, an EdDSA verification on Ethereum currently costs around $36. Considering the cycle cost (4,211,120) on the IC with 1 XDR exchanging for $1.3476 yields a cost of $0.00000567490 to run an EdDSA verification on the IC. Overall, this suggests that the IC is 6,343,718 times less costly for a standard computation.

