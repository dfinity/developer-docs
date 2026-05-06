---
learn_hub_id: 34210839162004
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34210839162004-Canister-Smart-Contracts"
learn_hub_title: "Canister Smart Contracts"
learn_hub_section: "Canister Smart Contracts"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Canister Smart Contracts

Smart contracts on the Internet Computer come in the form of canisters: computational units that bundle code and state. Canisters expose endpoints that can be called by other canisters and parties external to the IC, such as browsers or mobile apps.

There are two types of endpoints in canisters: **updates** and **queries**. Updates modify the state of the canister, while queries read from the state without making changes. The code of a canister is a [WebAssembly (Wasm)](https://webassembly.org/) module. The state includes the usual Wasm memory heap, a special type of memory called stable memory and metainformation about the canister.

The articles in this section describe

  * [Computation model:](https://learn.internetcomputer.org/hc/en-us/articles/34573860369172) how canister code is executed
  * [Cycles](https://learn.internetcomputer.org/hc/en-us/articles/34573913497108): how resources consumed by canisters are charged
  * [Canister control:](https://learn.internetcomputer.org/hc/en-us/articles/34573932107796) who can deploy and manage canisters 
  * [Principals](https://learn.internetcomputer.org/hc/en-us/articles/34250491785108): who can call canisters



## Additional Resources

[Canister Developer Docs](https://internetcomputer.org/docs/current/home)

