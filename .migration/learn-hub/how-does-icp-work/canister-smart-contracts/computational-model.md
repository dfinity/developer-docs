---
learn_hub_id: 34573860369172
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34573860369172-Computational-Model"
learn_hub_title: "Computational Model"
learn_hub_section: "Canister Smart Contracts"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Computational Model

Canisters behave much like actors from the [actor-based concurrency model](https://en.wikipedia.org/wiki/Actor_model). Their code is single-threaded and executed in complete isolation from other canisters. Canisters communicate with one another via asynchronous messaging. When processing a message, a canister can make changes to its state, send messages to other canisters, or even create other canisters. Unlike in the traditional actor model, communication is bidirectional. Canister messages are either requests or replies. For each request sent, the Internet Computer records a callback to be invoked when the callee sends back a response. If the Internet Computer determines that there is no way for the callee to respond, then it will produce a response instead, thereby ensuring that every request receives a reply.

An important aspect of the canister-based model is how canisters handle errors during message processing. When a canister processes a request, it might send out other requests and wait for some of these replies before completing the original request. If an error occurs (the canister “traps”), the canister’s state reverts to what it was right after its last outgoing message.

