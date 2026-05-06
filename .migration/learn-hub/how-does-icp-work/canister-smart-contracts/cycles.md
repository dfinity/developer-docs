---
learn_hub_id: 34573913497108
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34573913497108-Cycles"
learn_hub_title: "Cycles"
learn_hub_section: "Canister Smart Contracts"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Cycles

As they execute, canisters use resources in the form of memory, computation, and network bandwidth, and may also use certain special APIs. On the Internet Computer, all of these are paid for using a unit called _cycles_. Each canister maintains a local cycle account from which cycles are deducted as execution proceeds.

  * **Memory usage:** Charging for memory usage is straightforward. The protocol keeps track of the memory used by the canister and regularly charges the canister’s balance. This charging happens at regular intervals but not every round.
  * **Computation:** Charging for computation occurs at the time the computation is performed. The canisters are instrumented with code that allows the Internet Computer to count the number of instructions executed while processing a message. There is an upper bound on the number of instructions that can be executed during a round. If this limit is exceeded, execution is paused and continued in a subsequent round, but cycles for the computation performed during any round are charged at the end of that round.
  * **Bandwidth:** Charging for bandwidth occurs when a canister receives an ingress message from a user or sends a message to another canister. The protocol calculates the number of cycles required for the outgoing call, which includes a fixed cost and a variable cost based on the payload size. Additionally, the protocol deducts the cost of sending a maximum-size reply from the callee, as the caller pays for the reply. If the actual reply size is smaller, the difference in cycles is refunded to the canister when the reply arrives.
  * **API calls:** Calls for [reading data from the Bitcoin blockchain](https://learn.internetcomputer.org/hc/en-us/articles/34211154520084), [making HTTP calls](https://learn.internetcomputer.org/hc/en-us/articles/34211194553492) to web servers, or creating [chain-key signatures](https://learn.internetcomputer.org/hc/en-us/articles/34209497587732) require additional payment charged to the canister's cycles balance.



Canisters have a freezing threshold to prevent sudden deletion when they run out of cycles. When a canister’s balance falls below this threshold, it stops processing new requests but continues handling replies. If a canister runs out of cycles completely, it is uninstalled, deleting its code and state but retaining the canister id so it cannot be accidentally reused.

