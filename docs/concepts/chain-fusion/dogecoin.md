---
title: "Dogecoin integration"
description: "How ICP connects to Dogecoin using the same architecture as the Bitcoin integration"
---

ICP supports a native Dogecoin integration that works the same way as the [Bitcoin integration](bitcoin.md). Because Dogecoin is a Bitcoin fork, it reuses the same two-component architecture: a dedicated adapter that communicates with the Dogecoin network, and a Dogecoin canister that maintains the current chain state and exposes a query-and-send API to other canisters.

## Architecture

The _Dogecoin adapter_ is a process that runs alongside the ICP replica on each node. It speaks the Dogecoin peer-to-peer protocol, syncs blocks from the Dogecoin network, and relays transactions. The _Dogecoin canister_ ([source](https://github.com/dfinity/dogecoin-canister)) is a canister running on a system subnet that consumes blocks from the adapter, maintains the UTXO set, and exposes endpoints for balance queries, UTXO retrieval, fee estimation, and transaction submission.

Canister-controlled Dogecoin addresses are derived from chain-key ECDSA public keys, just as in the Bitcoin integration. Transactions are signed using the management canister's `sign_with_ecdsa` API and broadcast to the Dogecoin network through the adapter.

![Dogecoin integration architecture: a canister calls the Dogecoin canister through the ICP protocol stack, while the Dogecoin adapter connects to the Dogecoin peer-to-peer network](/concepts/chain-fusion/dogecoin-architecture.png)

## Chain-key DOGE (ckDOGE)

ckDOGE is the chain-key token representing Dogecoin on ICP, backed 1:1 by real DOGE held in a canister-controlled address. The minter-plus-ledger architecture is the same as [ckBTC](bitcoin.md#chain-key-bitcoin-ckbtc): users deposit DOGE to a minter-controlled address, the minter mints ckDOGE on the ledger, and withdrawals trigger a Dogecoin transaction signed by the network using threshold ECDSA.

### Depositing DOGE (DOGE to ckDOGE)

```plantuml
actor User
participant "ckDOGE Minter" as Minter
participant "Dogecoin Network" as DOGE

User -> Minter: get_doge_address(account)
Minter --> User: doge_address
User -> DOGE: send DOGE to doge_address
User -> Minter: update_balance(account)
Minter --> User: ckDOGE minted to ICRC-1 account
```

### Withdrawing DOGE (ckDOGE to DOGE)

```plantuml
actor User
participant "ckDOGE Ledger" as Ledger
participant "ckDOGE Minter" as Minter
participant "Dogecoin Network" as DOGE

User -> Ledger: icrc2_approve(spender=minter, amount)
User -> Minter: retrieve_doge_with_approval(doge_address, amount)
Minter -> Ledger: icrc2_transfer_from(user, minter, amount)
Minter -> DOGE: send DOGE to doge_address
```

## Next steps

- [Bitcoin integration](bitcoin.md): detailed description of the shared adapter and canister architecture
- [Dogecoin canister documentation](https://dfinity.github.io/dogecoin-canister/)
- [Dogecoin guide](../../guides/chain-fusion/dogecoin.md): code examples and canister API
- [Chain Fusion overview](index.md): integration patterns and supported chains
- [Dogecoin canister reference](../../references/protocol-canisters.md#dogecoin-canister): API endpoints
- [Chain-Key Token Canister IDs: ckDOGE](../../references/chain-key-canister-ids.md#ckdoge): ckDOGE minter and ledger IDs

<!-- Upstream: informed by Learn Hub articles "Dogecoin Integration" (migrated, source retired) -->
