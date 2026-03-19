---
title: "Ethereum Integration"
description: "Interact with Ethereum and EVM chains from ICP canisters via the EVM RPC canister"
sidebar:
  order: 2
---

TODO: Write content for this page.

<!-- Content Brief -->
Interact with Ethereum and other EVM chains from ICP canisters. Cover the EVM RPC canister (7hfb6-caaaa-aaaar-qadga-cai), JSON-RPC calls to Ethereum nodes, multi-provider consensus, generating Ethereum addresses with threshold ECDSA, signing and submitting transactions, reading ERC-20 balances, and cycle costs for RPC calls. Compare direct RPC vs HTTPS outcalls approach.

<!-- Source Material -->
- Portal: building-apps/chain-fusion/ethereum/ (10 files: overview, eth-comparison, eth-dev-workflow, generating-addresses, signing-transactions, submit-transactions, evm-rpc/overview, evm-rpc-canister, how-it-works, costs)
- icskills: evm-rpc
- Examples: basic_ethereum (Rust), evm_block_explorer (both), threshold-ecdsa (both)
- Learn Hub: [Ethereum Integration](https://learn.internetcomputer.org/hc/en-us/articles/34575019947668), [EVM RPC Canister](https://learn.internetcomputer.org/hc/en-us/articles/45550731488916)

<!-- Cross-Links -->
- concepts/chain-fusion -- chain fusion overview
- guides/backends/https-outcalls -- outcalls used by EVM RPC
- guides/defi/chain-key-tokens -- ckETH
- guides/chain-fusion/bitcoin -- similar patterns for BTC
