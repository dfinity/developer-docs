---
learn_hub_id: 34250491785108
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34250491785108-What-is-a-Principal"
learn_hub_title: "What is a Principal?"
learn_hub_section: "Canister Smart Contracts"
learn_hub_category: "How does ICP work?"
migrated: false
---

# What is a Principal?

The concept of a principal appears at the level of canister smart contracts. In a nutshell, a principal identifies any entity that can call a canister. As both canisters and external users can call canisters, principals include both canister ids and self-authenticating identifiers derived from public keys of users. There are several classes of principals:

  1. The [Internet Computer Management Canister](https://internetcomputer.org/docs/current/references/ic-interface-spec#ic-management-canister), which is a specific system API that can be called like a canister, uses the fixed principal _aaaaa-aa_.
  2. Canister ids: each canister on ICP is identified by its canister id.
  3. Self-authenticating ids: derived from public keys to identify users.
  4. Derived ids: a class which has been reserved but never implemented.
  5. The anonymous id, _2vxsx-fae:_ used as the identity of the caller for messages that are not signed.



More details can be found in the [relevant section of the interface specification](https://internetcomputer.org/docs/current/references/ic-interface-spec#principal).

