---
title: "Ethereum integration"
description: "How ICP connects to Ethereum and EVM chains via HTTPS outcalls, chain-key ECDSA, and the EVM RPC canister"
---

Canisters on ICP can interact with Ethereum and any EVM-compatible chain (Polygon, Avalanche, Arbitrum, Base, Optimism, and others) without bridges or trusted intermediaries. The integration combines two ICP capabilities: [HTTPS outcalls](../https-outcalls.md) to read chain state and [chain-key ECDSA signatures](../chain-key-cryptography.md) to authorize transactions.

## How it works

**Reading Ethereum state.** Canisters query Ethereum via JSON-RPC, the same API used by standard Ethereum clients. Because HTTPS outcalls involve all subnet replicas independently fetching the URL and reaching consensus on the response, the result has strong integrity guarantees. Rather than making raw HTTPS outcalls directly, most canisters use the EVM RPC canister, which provides a typed Candid interface and handles multi-provider redundancy automatically.

**Signing Ethereum transactions.** Each canister can derive an Ethereum address from its chain-key ECDSA public key. To authorize a transaction, the canister calls `sign_with_ecdsa` on the management canister, receives a threshold signature produced by the subnet nodes collectively, and includes the signature in the serialized transaction before submitting it.

**Submitting Ethereum transactions.** The signed transaction is submitted via the EVM RPC canister's `eth_sendRawTransaction` endpoint, which relays it to multiple JSON-RPC providers for broadcast.

This flow (query, sign, submit) lets canisters call any Ethereum smart contract, hold ETH or ERC-20 assets, and participate in DeFi protocols entirely from ICP canister code.

## EVM RPC canister

The EVM RPC canister (`7hfb6-caaaa-aaaar-qadga-cai`) is a system-level canister that acts as a gateway between ICP canisters and Ethereum JSON-RPC APIs. It is controlled by the NNS, so its behavior cannot be changed by any single party. For supported chains, built-in providers, and cycle costs, see [EVM RPC canister](../../references/protocol-canisters.md#evm-rpc-canister).

```plantuml
left to right direction

package "Internet Computer" {
  component "Your Canister" as UC
  component "EVM RPC Canister" as EVM
}

package "JSON-RPC Providers" {
  component "Provider 1" as P1
  component "Provider 2" as P2
  component "Provider N" as PN
}

package "Ethereum" {
  component "Smart contracts" as SC
}

UC <--> EVM
EVM --> P1
EVM --> P2
EVM --> PN
P1 --> SC
P2 --> SC
PN --> SC
```

### Multi-provider architecture

```plantuml
participant "Your Canister" as Canister
participant "EVM RPC Canister" as EVM
participant "Provider 1" as P1
participant "Provider 2" as P2
participant "Provider N" as PN

Canister -> EVM: eth_getBlockByNumber(chain, args) + cycles
EVM -> P1: JSON-RPC (HTTPS outcall)
EVM -> P2: JSON-RPC (HTTPS outcall)
EVM -> PN: JSON-RPC (HTTPS outcall)
P1 --> EVM: response
P2 --> EVM: response
PN --> EVM: response
note right of EVM: consensus check (≥2/3 nodes agree)
EVM --> Canister: Consistent(result) + refund excess cycles
```

For each Candid-RPC method (such as `eth_getTransactionReceipt` or `eth_getBlockByNumber`), the EVM RPC canister sends the request to at least three independent JSON-RPC providers by default and compares the results. Supported providers include [CloudFlare](https://www.cloudflare.com/), [Alchemy](https://www.alchemy.com/), [Ankr](https://www.ankr.com/), and [BlockPI](https://blockpi.io/).

Results are returned in one of two forms:

- **Consistent**: all queried providers returned the same result. This is the expected case for finalized data.
- **Inconsistent**: providers returned different results. The caller receives the full set of results and can decide how to handle the discrepancy (for example, by waiting for more confirmations or querying additional providers).

Callers can override the defaults: specifying a different number of providers, listing concrete providers to use, or setting a minimum agreement threshold.

### Available methods

The EVM RPC canister supports the standard JSON-RPC Ethereum API, including:

- `eth_getBlockByNumber`, `eth_getBlockByHash`: block data
- `eth_getTransactionCount`, `eth_getTransactionByHash`, `eth_getTransactionReceipt`: transaction data
- `eth_getLogs`: event logs (used to detect deposits for chain-key tokens)
- `eth_feeHistory`, `eth_gasPrice`: fee estimation
- `eth_sendRawTransaction`: broadcast a signed transaction
- `eth_call`: call a smart contract read function

Beyond Ethereum mainnet, the canister also has partial support for Polygon, Avalanche, and other popular EVM networks.

## Chain-key Ether and ERC-20 tokens

ckETH and ckERC20 tokens (such as ckUSDC and ckUSDT) are chain-key tokens backed 1:1 by assets on Ethereum. They follow the same architecture as ckBTC (a minter canister plus an ICRC-1/ICRC-2 ledger canister) but use a different deposit mechanism.

**Deposits.** Because ICP cannot observe Ethereum state directly (unlike Bitcoin, which uses a native adapter), ckETH uses a helper smart contract deployed on Ethereum. Users send ETH or ERC-20 assets to this helper contract, which emits an event. The ckETH minter periodically queries the event log via the EVM RPC canister to discover deposits and mints the corresponding chain-key tokens.

For full minting, redemption, and security model details, see [Chain-key tokens](chain-key-tokens.md).

## Next steps

- [Ethereum guide](../../guides/chain-fusion/ethereum.md): code examples for reading state and sending transactions
- [Chain Fusion overview](index.md): integration patterns and supported chains
- [HTTPS outcalls](../https-outcalls.md): how canisters reach external HTTP endpoints
- [Chain-key cryptography](../chain-key-cryptography.md): threshold ECDSA signing
- [Chain-key tokens](chain-key-tokens.md): ckETH and ckERC20 architecture
- [Chain-Key Token Canister IDs](../../references/chain-key-canister-ids.md#cketh): ckETH minter, ledger, and index IDs

<!-- Upstream: informed by Learn Hub articles "Ethereum Integration", "EVM RPC Canister" (migrated, source retired) -->
