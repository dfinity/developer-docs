---
learn_hub_id: 34208985618836
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34208985618836-Execution-Layer"
learn_hub_title: "Execution Layer"
learn_hub_section: "Blockchain Protocol"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Execution Layer

The execution layer, the topmost layer of the Internet Computer (IC) core protocol stack, is responsible for executing canister smart contract code. Code execution is done by a [WebAssembly](https://webassembly.org/) (Wasm) virtual machine deployed on every node. WebAssembly bytecode can be executed deterministically, which is important for a blockchain system, and with near-native speed. Canister messages, i.e., ingress messages by users or messages by other canisters, have been inducted into the queues of the canisters on the subnet by message routing. Message routing then hands over control to the execution layer, which deterministically executes messages, either until all messages in the canisters’ queues are consumed or the cycles limit for the round has been reached, to ensure bounded round times.

The execution layer has many unique features, which set apart the IC from other blockchains:

  1. **Deterministic Time Slicing (DTS):** The execution of very large messages requiring billions of Wasm instructions to be executed can be split across multiple IC rounds. This capability of executing messages over multiple rounds is unique to ICP.
  2. **Concurrency:** Execution of canister Wasm bytecode is done concurrently on multiple CPU cores, which is possible due to each canister having its own isolated state.
  3. **Pseudorandom number generator:** The execution layer has access to an unpredictable and unbiasable pseudorandom number generator. Canisters can now execute algorithms that require randomness.



## Replicated message execution

Replicated execution proceeds in rounds. In each round, the message routing layer invokes the execution layer once for executing (a subset of) the messages in the canister input queues. Depending on how much effort (CPU cycles) the execution of the messages of a round requires, a round ends with all messages in the queues being executed or the cycles limit of the round being reached and parts of the messages left to future rounds for execution.

Each message execution can lead to memory pages of the canister’s state being modified (becoming “dirty” in operating systems terminology), new messages to other canisters on the same or different subnets being created, or a response to be generated in case of an ingress message. Changes to memory pages are tracked and corresponding pages flagged as “dirty” so that they can be processed when certifying the state.

When a message execution leads to the generation of a new canister message targeted at a canister in the local subnet, this message can be queued up directly by execution in the input queue of the target canister and scheduled in the same round or an upcoming round. This message does not need to go through consensus since the generation and enqueuing of the new message is completely deterministic and thus happens in exactly the same way on all the nodes of the subnet.

New messages targeted at other subnets are placed into the target cross-subnet queue (XNet queue) and are certified by the subnet at the end of the round as part of the per-round state certification. The receiving subnet can verify that the XNet messages are authenticated by the subnet by validating the signature with the originating subnet’s public key.

The execution layer is designed at its core to execute multiple canisters concurrently on different CPU cores. This is possible because each canister has its own isolated state and canister communication is asynchronous. This form of concurrent execution within a subnet together with the capability of all ICP subnets executing canisters concurrently makes ICP scalable like a public cloud: ICP scales out by adding more subnets.

## Deterministic time slicing

Each execution round progresses alongside the creation of blockchain blocks, which happens roughly once every second. This restricts how much computation can be performed in a single round, with the current limit being around 2 billion instructions given the existing node hardware.

However, the Internet Computer can handle longer tasks that need up to 20 billion instructions, and some special tasks, like code installation, can even go up to 200 billion instructions. This is achieved using _Deterministic Time Slicing_ (DTS). The idea is to pause a lengthy task at the end of one round and continue it in the next. As a result, a task can span multiple rounds without slowing down the block creation rate. DTS is automatic and transparent to smart contracts, so developers don’t need to write any special code to use it.

## Memory handling

Management of the canister bytecode and state (collectively memory) is one of the key responsibilities of the execution layer. The replicated state that can be held by a single subnet is not bounded by the available RAM in the node machines, but rather by the available SSD storage. Available RAM, however, impacts the performance of the subnet, particularly the access latency of memory pages. This depends a lot on the access patterns of the workload, however, much like in traditional computer systems.

The node machines that comprise the IC are equipped with tens of terabytes of high-end SSD storage and over half a terabyte of RAM to be able to hold large amounts of replicated canister state and Wasm code and achieve good performance when accessing memory. The states obtained while executing canisters are certified (i.e., digitally signed) by the state management component of message routing. Certification of some parts of the states, including the ingress history and the messages that are sent to other subnetworks, are certified every round. The entire state of a subnetwork, including the state of all canisters hosted by that subnetwork, is certified once every (much longer) checkpointing interval.

Memory pages representing canister state are persisted to SSD by the execution layer, without canister programmers needing to take care of this. This _orthogonal persistence_ frees the smart contract programmers from reading from and writing to storage explicitly as on other blockchains or as in traditional IT systems. This dramatically simplifies smart contract implementation and helps reduce the TCO of a dapp and go to market faster. Programmers can always have the full canister smart contract state on the heap or in stable memory. The difference between heap and stable memory is that the heap is cleared on updates of the canister code, while stable memory remains stable throughout updates, hence its name. Any state on the heap that is to be preserved through a canister update must be transferred to stable memory by a canister programmer before an update and restored from there after the update. Best practices are that large canister state be held directly in stable memory to avoid shuffling around large amounts of storage before and after each upgrade. This also avoids the risk of exceeding the cycles limit allowed in an upgrade operation.

## Random number generation

Many applications benefit from, or require, a secure random number generator. Yet, generating random numbers in the naïve way as part of execution trivially destroys determinism as every node would compute different randomness. ICP solves this problem by the execution layer having access to a decentralized pseudorandom number generator called the _random tape_. The random tape is built using chain-key cryptography. Every round, the subnetwork produces a fresh threshold BLS signature which, by its very nature, is unpredictable and uniformly distributed. This signature can then be used as seed in a cryptographic pseudorandom generator. This gives canister smart contracts access to a highly-efficient and secure random number source, which is another unique feature of ICP.

## Cycles accounting

The execution of a canister consumes resources of the Internet Computer, which are paid for with cycles. Each canister holds a local cycles account. Ensuring that the account holds sufficient cycles is the responsibility of its maintainer, which can be a developer, a group of developers or a decentralized autonomous organization (DAO) – users do never pay for sending messages to canisters on the IC. This resource charging model is known as the _reverse gas model_ and is a facilitator for mass adoption of the IC.

Technically, the Wasm code running in a canister gets instrumented, when the Wasm bytecode is installed or updated on the IC, with code that counts the executed instructions for smart contract messages. This allows for deterministically computing the exact amount of cycles to be charged for a given message being executed. Using Wasm as bytecode format for canisters has helped greatly to reach determinism as Wasm itself is a format that is largely deterministic in its execution. It is crucial that the cycles charging be completely deterministic so that every node charges exactly the same amount of cycles for a given operation and that the replicated state machine properties of the subnet are maintained.

The memory the canister uses in terms of both its Wasm code and canister state needs to be paid for with cycles as well. Much like in the public cloud, consumed storage is charged for per time unit. Compared to other blockchains, it is very inexpensive to store data on the IC. Furthermore, networking activities such as receiving ingress messages, sending XNet messages, and making HTTPS Outcalls to Web 2.0 servers are paid for in cycles by the canister. Prices for a given resource, e.g., executing Wasm instructions, scale with the replication factor of the subnet, i.e., the number of nodes that power the subnet.

## Non-replicated message execution

Non-replicated message execution, aka queries, are operations executed by a single node and return a response synchronously, much like a regular function invocation in an imperative programming language. The key difference to messages, which are also called update calls, is that queries cannot change the replicated state of the subnet, while update calls can. Queries are, as the name suggests, essentially read operations performed on one replica of the subnet, with the associated trust model of a compromised replica being able to return any arbitrary result of its choice.

Analogous to update calls, queries are executed concurrently by multiple threads on a node.

However, all the nodes of the subnet can concurrently execute different queries because queries are not executed in a replicated way. Query throughput of a subnet thus increases linearly with an increasing number of nodes in the subnet, while update call performance does not.

Queries by themselves are similar to read operations on a local or cloud Ethereum node on the Ethereum blockchain. The response of any individual node should not be trusted. Whenever an information item to be read is critical, e.g., financial data based on which decisions are made, applications can either use update calls to obtain such information (as the response of an update call is certified by the subnet) or [certified variables](https://learn.internetcomputer.org/hc/en-us/articles/34214090576404), as both are verifiable with the subnet’s public key.

## Additional Information

[Usenix ATC article on execution environment](https://www.usenix.org/system/files/atc23-arutyunyan.pdf)

[16 min video](https://www.youtube.com/watch?v=UHA7W-8My_I&list=PLuhDt1vhGcrfHG_rnRKsqZO1jL_Pd970h&index=16)

