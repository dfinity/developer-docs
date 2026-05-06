---
learn_hub_id: 34573932107796
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/34573932107796-Canister-Control"
learn_hub_title: "Canister Control"
learn_hub_section: "Canister Smart Contracts"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Canister Control

Canisters are managed by _controllers_ , which can be users or other canisters. Controllers are responsible for deploying, maintaining, and managing canisters. They can perform operations such as starting, stopping, and updating the canister, as well as adjusting canister parameters like the freezing threshold. The control structure can be centralized (e.g., when the controllers include a centralized entity), organizational (e.g. when the controller is a multi-signer wallet like [Orbit](https://orbitwallet.io/)), decentralized (e.g., when the controller is a DAO), or non-existent, resulting in an immutable smart contract.

Controllers can update the code that runs on canisters by submitting a new Wasm module to replace the older one. By default, updating the Wasm module of a canister wipes out the Wasm memory, but the content of the stable memory remains unchanged. The Internet Computer offers an upgrade mechanism where three actions are executed atomically: serializing the Wasm memory of the canister and writing it to stable memory, installing the new Wasm code, and then deserializing the content of the stable memory. This allows for the Wasm heap memory to be kept even if the Wasm module changes. Of course, a canister may ensure at all times that the data that needs to be persisted across upgrades is stored in the stable memory, in which case the upgrade process is significantly simpler.

## Additional Resources

[25min video on creating, installing, upgrading, and managing canisters](https://www.youtube.com/watch?v=c5nv6vIG3OQ)

