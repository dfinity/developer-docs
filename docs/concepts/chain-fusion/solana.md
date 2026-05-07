---
title: "Solana Integration"
description: "How canisters interact with Solana via the SOL RPC canister"
---

Canisters on ICP can query and interact with the Solana network through the SOL RPC canister. The architecture mirrors the [Ethereum integration](ethereum.md): [HTTPS outcalls](../https-outcalls.md) are used to query Solana's JSON-RPC API, and [chain-key Schnorr signatures (Ed25519)](../chain-key-cryptography.md) enable canisters to sign Solana transactions.

## SOL RPC canister

The [SOL RPC canister](https://github.com/dfinity/sol-rpc-canister) is a system-level canister that acts as a gateway between ICP canisters and Solana's JSON-RPC API. Like the EVM RPC canister, it is controlled by the NNS and uses multiple independent JSON-RPC providers to ensure responses are not sourced from a single centralized party.

Supported providers include [Alchemy](https://www.alchemy.com/), [Ankr](https://www.ankr.com/), [Chainstack](https://chainstack.com/), [dRPC](https://drpc.org/), [Helius](https://www.helius.dev/), and [PublicNode](https://publicnode.com/).

Each request is forwarded to multiple providers. If providers return consistent results, that response is passed back to the calling canister. The NNS controls which providers are registered and how the canister behaves, so no single entity can alter its operation.

## Signing Solana transactions

Solana uses Ed25519 signatures. Canisters can derive Ed25519 public keys and request threshold Schnorr signatures via the management canister's `schnorr_public_key` and `sign_with_schnorr` API (using the `ed25519` algorithm variant). This gives each canister its own Solana wallet address, with signing performed collectively by subnet nodes without reconstructing the private key.

## Chain-key SOL (ckSOL)

ckSOL is the chain-key token representing SOL on ICP. Like ckETH, it is backed 1:1 by SOL held in a canister-controlled Solana address. The minter canister monitors Solana deposits via the SOL RPC canister and mints ICRC-1/ICRC-2 compliant ckSOL tokens on ICP. Withdrawals follow the same pattern: burn ckSOL, sign a Solana transfer using chain-key Ed25519, and broadcast via the SOL RPC canister.

## Next steps

- [Solana guide](../../guides/chain-fusion/solana.md): code examples for interacting with Solana
- [Chain Fusion overview](index.md): integration patterns and supported chains
- [Ethereum integration](ethereum.md): the EVM RPC canister for comparison
- [Chain-key cryptography](../chain-key-cryptography.md): Ed25519 threshold Schnorr signing

<!-- Upstream: informed by Learn Hub articles "SOL RPC Canister" (migrated, source retired) -->
