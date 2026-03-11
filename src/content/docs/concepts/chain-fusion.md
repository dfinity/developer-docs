---
title: "Chain Fusion Overview"
description: "Integrate with Bitcoin, Ethereum, Solana, and Dogecoin without bridges"
sidebar:
  order: 1
doc_type: explanation
level: intermediate
features: [chain-fusion, chain-key]
last_verified: 2026-03-10
---

# What is Chain Fusion?

Chain Fusion enables ICP canisters to interact with multiple blockchains through **decentralized bi-directional communication**, eliminating the need for trusted intermediaries such as bridges. Canisters can read the state of other chains, sign transactions with chain-key cryptography, and submit those transactions directly.

## How it works

Chain Fusion relies on three protocol-level building blocks:

- **Chain-key signatures** -- ICP implements threshold ECDSA and threshold Schnorr signing protocols. Private keys are split into shares distributed across subnet nodes. No single node ever holds a complete key. Canisters request signatures through the management canister API, and the subnet nodes run a threshold signing protocol to produce a valid signature.

- **HTTPS outcalls** -- Canisters can make replicated HTTP requests to external services. Multiple replicas independently call the same endpoint and reach consensus on the response. This is used to query JSON-RPC providers for chains like Ethereum and Solana.

- **Direct protocol integrations** -- For Bitcoin and Dogecoin, ICP nodes run adapter processes that connect directly to the target chain's peer-to-peer network. The chain's state (such as UTXOs) is maintained in ICP's replicated state, removing the need for any external RPC provider.

## Supported chains

| Chain | Signing | Integration method | Chain-key tokens |
|---|---|---|---|
| Bitcoin | ECDSA, Schnorr | Direct (Bitcoin canister) | ckBTC |
| Ethereum | ECDSA | EVM RPC canister | ckETH, ckERC20 |
| Solana | Ed25519 (Schnorr) | SOL RPC canister | -- |
| Dogecoin | ECDSA | Direct (Dogecoin canister) | ckDOGE (upcoming) |

Any EVM-compatible chain (Arbitrum, Base, Optimism, Polygon, Avalanche, and others) is supported through the EVM RPC canister. Any chain whose authentication uses ECDSA, Ed25519, or Schnorr can be integrated via HTTPS outcalls to that chain's RPC endpoints.

For a complete list, see the [supported chains table](https://internetcomputer.org/docs/building-apps/chain-fusion/supported-chains).

## Use cases

- **Multichain wallets** -- A single browser-based wallet that manages assets across Bitcoin, Ethereum, Solana, and other chains, all served from ICP with no wallet extension required.
- **Cross-chain DEX** -- A decentralized exchange that trades native assets from different blockchains through a unified interface.
- **DeFi protocols** -- Borrowing and lending protocols that use BTC as collateral and issue stablecoins, all running as canisters.
- **On-chain frontends** -- Host an immutable or DAO-governed frontend for a smart contract on another blockchain.
- **Trustless automation** -- Canisters can use timers to periodically check conditions on other chains and trigger actions (for example, liquidating a loan when collateral drops below a threshold).
- **Decentralized oracles** -- Fetch Web2 data via HTTPS outcalls and relay it to smart contracts on other chains.

## Trust model

For **direct integrations** (Bitcoin, Dogecoin), the only trust assumption is that a supermajority of the subnet's nodes are honest. ICP nodes run their own adapter connecting to the target chain's P2P network.

For **RPC-based integrations** (Ethereum, Solana, other EVM chains), canisters contact multiple independent RPC providers and compare results. Users additionally trust that at least one of the queried providers returns correct data.

## Next steps

- [Bitcoin integration](/guides/chain-fusion/bitcoin)
- [Ethereum integration](/guides/chain-fusion/ethereum)
- [Solana integration](/guides/chain-fusion/solana)
- [Dogecoin integration](/guides/chain-fusion/dogecoin)
