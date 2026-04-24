---
title: "Cycles"
description: "How canisters pay for their own compute, storage, and bandwidth using cycles"
sidebar:
  order: 4
---

Every canister runs on real hardware — nodes operated by independent node providers distributed across the world. Unlike a traditional cloud, there is no single company to bill: no AWS account, no credit card, no monthly invoice. Instead, the network handles payment at the protocol level. **Canisters pay for their own compute, storage, and bandwidth using cycles** — a unit of compute loaded into a canister in advance. The network deducts cycles automatically as the canister runs. Anyone can top up a canister: the developer, another canister, a user, or an automated service. Users interact with apps for free, the same way they use any web service.

## What are cycles?

Cycles are the unit of payment for resources on ICP. Every canister operation that consumes resources burns cycles from the canister's balance:

- **Compute**: executing instructions (update calls, timers, heartbeats)
- **Storage**: Wasm heap memory and stable memory, charged per byte per second
- **Messaging**: ingress messages from users, inter-canister calls, responses
- **Special features**: HTTPS outcalls, threshold signatures, Bitcoin integration, EVM RPC

Query calls are free: they run on a single node, do not go through consensus, and are not charged.

## ICP tokens and cycles

Cycles are obtained by converting ICP tokens. The conversion happens through the **Cycles Minting Canister (CMC)** (`rkp4c-7iaaa-aaaaa-aaaca-cai`), a system canister that accepts ICP and mints the equivalent value in cycles at the current XDR exchange rate.

Once minted, cycles are held by principals via the **cycles ledger** (`um5iw-rqaaa-aaaaq-qaaba-cai`) and transferred to canisters to fund their operation. Cycles flow in one direction: they can only be burned (consumed by canisters), never converted back to ICP tokens.

### Cycles are pegged to XDR

Unlike ICP tokens, whose price fluctuates with markets, cycles are pegged to the [Special Drawing Right (XDR)](https://www.imf.org/external/np/fin/data/rms_sdrv.aspx): a basket of currencies maintained by the IMF. **1 trillion (T) cycles = 1 XDR** (approximately $1.30–$1.40 USD). This peg makes infrastructure costs predictable for developers regardless of ICP token price movements.

## What canisters pay for

### Compute

By default, canisters are scheduled for execution on a best-effort basis. The subnet schedules them when capacity is available. Canisters that need guaranteed execution can set a `compute_allocation` in their settings, expressed as a percentage of one execution core:

| Allocation | Guarantee |
|---|---|
| 1% | Scheduled at least every 100 rounds |
| 2% | Scheduled at least every 50 rounds |
| 100% | Scheduled every round |

Compute allocation costs 10M cycles per 1% per second. Best-effort scheduling (0% allocation) incurs no idle allocation cost, but execution is not guaranteed under high subnet load.

### Storage

Storage is charged per byte per second for both Wasm heap memory and stable memory. Storing 1 GiB for one year costs approximately 4T cycles (≈$5.40 USD, May 2025). The cost is the same whether the data is in heap or stable memory.

When a canister allocates new storage bytes on a subnet that is more than 750 GiB full, the system moves cycles from the canister's main balance into a **reserved cycles balance** to cover future storage payments for those bytes. This reservation is non-transferable and grows linearly as the subnet fills toward its 2 TiB capacity.

### Messaging

| Message type | Cost |
|---|---|
| Query call | Free |
| Ingress update (user → canister) | 1.2M base + 2K cycles/byte, paid by receiving canister |
| Inter-canister call | 260K base + 1K cycles/byte, paid by sending canister |
| Canister creation | 500B cycles (≈$0.68, May 2025) |

### Replication factor

Every canister is replicated across all nodes on its subnet. Costs scale with subnet size: a 34-node subnet charges `34/13` times the base rate compared to a 13-node subnet. Choosing a 13-node subnet minimizes cost; 34-node subnets offer higher replication and security for sensitive workloads.

## Developer responsibility

Canisters pay for their own resources, which comes with ongoing obligations:

**Topping up**: canisters burn cycles continuously for storage and on every update call. Developers must monitor balances and keep canisters funded. A canister that runs out of cycles freezes immediately and stops responding to all calls.

**Freezing threshold**: each canister has a configurable freezing threshold (default: 30 days of idle burn). If the cycle balance falls below this threshold, the canister is frozen before it can be deleted, giving developers time to top up. Increase this threshold for production canisters as a safety buffer.

**Deletion**: a frozen canister that is not topped up within the threshold window is eventually deleted by the network, along with all its data. Deletion is permanent and irreversible.

These responsibilities can be automated. Tools like [CycleOps](https://cycleops.dev/) monitor balances and top up canisters automatically.

## Cost predictability

The XDR peg and flat per-resource pricing make ICP costs predictable:

- **No fee auctions**: there is no bidding for block space. Cycle prices are set by the NNS and change infrequently.
- **No per-transaction fees for users**: apps absorb all costs, like SaaS businesses absorb server bills.
- **Stable unit economics**: because cycles are pegged to XDR (not ICP price), infrastructure costs remain consistent even when ICP token price swings.

The tradeoff is that developers must forecast and fund usage upfront rather than letting users pay as they go.

## Related

- [Cycles Management](../guides/canister-management/cycles-management.md): how to check balances, top up canisters, and set freezing thresholds
- [Cycles Costs Reference](../reference/cycles-costs.md): exact cost tables for all operations
- [Canisters](./canisters.md): canisters as the paying entity for compute and storage

<!-- Upstream: informed by dfinity/portal docs/building-apps/essentials/gas-cost.mdx, docs/building-apps/getting-started/tokens-and-cycles.mdx -->
