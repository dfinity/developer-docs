---
title: "Bitcoin Integration"
description: "Send and receive BTC directly from ICP canisters using chain-key signatures"
sidebar:
  order: 1
---

TODO: Write content for this page.

<!-- Content Brief -->
Integrate Bitcoin with ICP canisters. Cover the full workflow: generating Bitcoin addresses using threshold ECDSA and Schnorr signatures, creating transactions, signing with chain-key, submitting to the Bitcoin network, and UTXO management. Include local regtest setup, the bitcoin-starter template, and multi-environment configuration (regtest/testnet/mainnet). Mention ckBTC as the tokenized alternative.

<!-- Source Material -->
- Portal: build-on-btc/ (14 files: index, btc-api, btc-dev-env, btc-dev-workflow, btc-transactions/*, read-state, using-regtest, brc-20, ordinals, runes)
- icskills: ckbtc
- Examples: basic_bitcoin (both), threshold-ecdsa (both), threshold-schnorr (both)
- Template: bitcoin-starter (multi-environment icp.yaml)
- Learn Hub: [Bitcoin Integration](https://learn.internetcomputer.org/hc/en-us/articles/34211154520084), [Chain-key Bitcoin](https://learn.internetcomputer.org/hc/en-us/articles/44598021228564), [Bitcoin Checker Canister](https://learn.internetcomputer.org/hc/en-us/articles/45033984570516)

<!-- Cross-Links -->
- concepts/chain-fusion -- chain fusion overview
- concepts/chain-key-cryptography -- how threshold signatures work
- guides/defi/chain-key-tokens -- ckBTC
- guides/chain-fusion/ethereum -- similar patterns for ETH
