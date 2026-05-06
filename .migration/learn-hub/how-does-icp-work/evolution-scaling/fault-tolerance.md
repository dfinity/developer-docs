---
learn_hub_id: 34210647901460
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34210647901460-Fault-Tolerance"
learn_hub_title: "Fault Tolerance"
learn_hub_section: "Evolution & Scaling"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Fault Tolerance

In any large-scale distributed system, it is inevitable that individual nodes fail at any time due to hardware outages, network connectivity issues, or even attacks. ICP is fault tolerant, which means that the protocol will make progress even if some nodes fail or misbehave. When failures are detected, the [Network Nervous System (NNS](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236)) selects a spare node that replaces the failed node in its subnet. The new node then joins the subnet and performs state synchronization with the subnet’s existing nodes and begins contributing to the subnet blockchain’s consensus protocol.

## Node failures

In each round, a block is produced by the [consensus layer](https://learn.internetcomputer.org/hc/en-us/articles/34207558615956), and the messages in the block are processed subsequently by the [execution layer](https://learn.internetcomputer.org/hc/en-us/articles/34208985618836). The proposed block and the resulting state need to be agreed upon by more than 2/3rd of the nodes in the subnet in order for the subnet to make progress. As long as less than 1/3rd of the nodes in a subnet fail or misbehave, even in an arbitrary, Byzantine manner, the subnet will continue making progress.

If less than 1/3rd of the nodes in a subnet fail while the remaining nodes of the subnet continue to make progress, a failed node can recover automatically and catch up with the operational nodes. A newly joined node also uses the same process to catch up with the existing nodes in the subnet.

Here’s one natural solution. A failed or newly joined node could download all the consensus blocks it missed from its peers, and process each block, one by one. Unfortunately, new nodes will take a long time to catch up if they have to process all the blocks from subnet genesis. Another solution is to let the failed or newly joined node directly copy the latest state from its peers. However, as the peers are continuously updating their state as they process new blocks, copying the latest state while the peers are updating it may lead to inconsistencies.

ICP uses a mix of both the approaches. The consensus protocol is divided into epochs. Each epoch comprises a few hundred consensus rounds. At the beginning of each epoch, all the nodes create a checkpoint of their blockchain state and a catch-up package (CUP). The CUP at height h contains all relevant information required for consensus to resume from height h. This includes the hash of the blockchain state after processing the block at height h. The CUP is then signed by at least 2/3rd of the nodes in the subnet. Each normally-operating node then broadcasts the CUP.

All the nodes in the subnet listen to the CUP messages broadcast by their peers. Suppose a node observes that a received CUP has a valid signature (signed by at least 2/3 of the nodes in the subnet) and has a different blockchain state hash than the locally available state hash for that height. Then the node initiates the[ state sync protocol](https://learn.internetcomputer.org/hc/en-us/articles/34471579767572) to sync the blockchain state at that height (the height at which the CUP is published).

Note that while the failed/newly joined nodes are syncing the blockchain state, the well-functioning nodes continue to process new blocks and make progress. The well-functioning nodes use their backup copy of the blockchain state (created at the same time as the CUP) to supply the state to syncing nodes. After the syncing node finishes syncing the blockchain state, it will request the consensus blocks generated since the CUP and process the blocks one by one. Once fully synced, the node can then process messages regularly like the other nodes.

If a failed node does not recover, or if a node keeps lagging behind or fail often, then a proposal to replace this node with another one may be submitted to the NNS.

## Recovery of regular subnets

In rare cases, an entire subnet can get stuck and fail to make progress. A subnet can fail due to many reasons such as software bugs that lead to non-deterministic execution. This can also happen when more than 1/3rd of the nodes in the subnet fail at the same time. In this case, the well-functioning nodes fail to create and sign a catch-up package (CUP), and thereby the failed nodes cannot recover automatically.

When a subnet fails, manual intervention is needed for recovery. In a nutshell, as the subnet nodes fail to create and sign a CUP automatically, someone needs to manually create a CUP. The CUP needs to be created at the maximum blockchain height where the state is certified by at least 2/3rd of the nodes in the subnet. The subnet nodes naturally cannot trust a manually created CUP. Community consensus that the CUP is valid is required. Subnet recovery proceeds via a proposal to theNNS to use the created CUP for the subnet. Anyone who staked their ICP can vote on the proposal. If a majority of the voters accept the proposal, the CUP is stored in the NNS registry.

Each node runs 2 processes — (1) Replica and (2) Orchestrator. The replica consists of the 4-layer software stack that maintains the blockchain. The orchestrator downloads and manages the replica software. The orchestrator regularly queries the NNS registry for any updates. If the orchestrator observes a new CUP in the registry, then the orchestrator restarts the replica process with the newly created CUP as input. As described earlier, the CUP at height h has information relevant to resume the consensus from height h. Once the replica starts, it will initiate a state sync protocol if it observes that the blockchain state hash in the CUP differs from the local state hash. Once the state is synced, it will resume processing consensus blocks.

Note that this recovery process requires submitting a proposal to the NNS, and therefore works only for recovering regular subnets (not the NNS subnet). This process of recovering a subnet is often termed as disaster recovery in many Internet Computer docs.

## Handling NNS canister failures

The Internet Computer's NNS comprises the canisters that govern the entire Internet Computer. This includes the root canister, governance canister, ledger canister, registry canister, etc.

Suppose a canister in the NNS fails while the NNS subnet continues to make progress. This could be due to a software bug in the canister’s code. In this case, the canister needs to be “upgraded”, i.e., restarted canister with a new Web Assembly code. Generally speaking, each canister in the Internet Computer has a (possibly empty) list of “controllers”. The controller has the right to upgrade the canister’s WASM code. The lifeline canister is assigned as a controller for the root canister. The root canister is assigned as a controller for all the other NNS canisters. The root canister has a method to upgrade other NNS canisters. Similarly, the lifeline canister has a method to upgrade the root canister.

Suppose the governance canister is working. Then one can manually submit an NNS proposal to call the root/lifeline canister’s method to upgrade the failed canister. Anyone who staked ICP can vote on the proposal. If a majority of the voters accept, then the failed canister will be upgraded.

## Handling NNS subnet failures

In the worst case, the subnet which hosts the NNS canisters could get stuck and fail to make progress. In such a case, all the node providers who contributed a node to the NNS subnet need to manually intervene, create a CUP and restart their node with the new CUP.

## Additional resources

[12min video on resumption](https://www.youtube.com/watch?v=H7HCqonSMFU)

[20min video on state synchronization](https://www.youtube.com/watch?v=WaNJINjGleg)

