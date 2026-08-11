---
title: "Cycles"
description: "How canisters pay for their own compute, storage, and bandwidth using cycles"
sidebar:
  order: 4
---

Every canister runs on real hardware: nodes operated by independent node providers distributed across the world. Unlike a traditional cloud, there is no single company to bill: no AWS account, no credit card, no monthly invoice. Instead, the network handles payment at the protocol level. **Canisters pay for their own compute, storage, and bandwidth using cycles.** The network deducts cycles automatically as the canister runs. Anyone can top up a canister: the developer, another canister, a user, or an automated service. Users interact with apps for free, the same way they use any web service.

Cycles cover four resource categories:

- **Compute**: executing instructions (update calls, timers, heartbeats)
- **Storage**: Wasm heap memory and stable memory, charged per byte per second
- **Messaging**: ingress messages from users, inter-canister calls, responses
- **Threshold cryptography**: threshold ECDSA/Schnorr signing and VetKeys key derivation
- **External integrations**: HTTPS outcalls, EVM RPC, SOL RPC, Bitcoin, Dogecoin

Query calls are free: they run on a single node, do not go through consensus, and are not charged.

## Acquiring cycles

Cycles are obtained by converting ICP tokens. The conversion happens through the **Cycles Minting Canister (CMC)** (`rkp4c-7iaaa-aaaaa-aaaca-cai`), a system canister that accepts ICP and mints the equivalent value in cycles at the current XDR exchange rate.

Once minted, cycles are held by principals via the **cycles ledger** (`um5iw-rqaaa-aaaaq-qaaba-cai`) and transferred to canisters to fund their operation. Cycles flow in one direction: they can only be burned (consumed by canisters), never converted back to ICP tokens.

For step-by-step instructions, see [Acquiring cycles](../guides/canister-management/cycles-management.md#acquiring-cycles).

### Cycles are pegged to XDR

Unlike ICP tokens, whose price fluctuates with markets, cycles are pegged to the [Special Drawing Right (XDR)](https://www.imf.org/external/np/fin/data/rms_sdrv.aspx): a basket of currencies maintained by the IMF. **1 trillion (T) cycles = 1 XDR** (approximately $1.30–$1.40 USD). This peg makes infrastructure costs predictable for developers regardless of ICP token price movements.

The [CMC](../references/system-canisters.md#cycles-minting-canister-cmc) samples the current ICP/XDR rate from the [exchange rate canister](../references/protocol-canisters.md#exchange-rate-canister-xrc) every 5 minutes. For how to look up the current XDR/USD rate programmatically or from a canister, see [Getting the current XDR/USD rate](../references/cycle-costs.md#getting-the-current-xdrusd-rate).

## Pricing

### Compute

By default, canisters are scheduled for execution on a best-effort basis. The subnet schedules them when capacity is available. Canisters that need guaranteed execution can set a `compute_allocation` in their settings, expressed as a percentage of one execution core:

| Allocation | Guarantee |
|---|---|
| 1% | Scheduled at least every 100 rounds |
| 2% | Scheduled at least every 50 rounds |
| 100% | Scheduled every round |

Compute allocation costs 10M cycles per 1% per second. Best-effort scheduling (0% allocation) incurs no idle allocation cost, but execution is not guaranteed under high subnet load.

### Storage

Storage is charged per byte per second for both Wasm heap memory and stable memory. Storing 1 GiB for one year costs approximately 4T cycles. The cost is the same whether the data is in heap or stable memory.

When a canister allocates new storage bytes on a subnet that is more than 750 GiB full, the system moves cycles from the canister's main balance into a **reserved cycles balance** to cover future storage payments for those bytes. This reservation is non-transferable and grows linearly as the subnet fills toward its 2 TiB capacity.

### Messaging

Query calls are free. Update messages carry a base fee plus a per-byte variable cost; ingress messages (user to canister) are charged to the receiving canister, while inter-canister calls are charged to the sending canister. Canister creation carries a one-time fee. For exact cycle counts and USD equivalents, see [Cycle costs](../references/cycle-costs.md#cost-table).

### Replication factor

Every canister is replicated across all nodes on its subnet. Costs scale with subnet size: a 34-node subnet charges `34/13` times the base rate compared to a 13-node subnet. Choosing a 13-node subnet minimizes cost; 34-node subnets offer higher replication and security for sensitive workloads.

## How charging works

Each resource category is metered and charged differently:

**Memory** is charged at regular intervals (not every consensus round). The protocol tracks total memory in use and deducts from the canister's cycle balance periodically.

**Computation** is charged at the time the instructions execute. ICP counts the number of WebAssembly instructions processed while handling a message. There is an upper bound on instructions per consensus round. If a message exceeds this limit, execution is paused and resumes in the next round; the cycles consumed each round are charged at round end. This is the mechanism behind deterministic time slicing.

**Messaging** costs are charged to the sending canister. Ingress messages (user to canister) are charged to the receiving canister. Each inter-canister call has a fixed base cost plus a per-byte variable cost. The calling canister also prepays the maximum-size reply cost upfront; if the actual reply is smaller, the difference is refunded.

**Threshold cryptography** (threshold ECDSA/Schnorr signing, VetKeys key derivation) charges the calling canister an additional amount on top of standard messaging costs. The extra cost reflects the computationally intensive threshold cryptographic operations and cross-subnet coordination required to produce the result. For exact amounts, see [Threshold cryptography costs](../references/cycle-costs.md#threshold-cryptography).

**External integrations** (HTTPS outcalls, EVM RPC, SOL RPC, Bitcoin, Dogecoin) charge an additional amount because every node on the relevant subnet must participate in each outbound call to an external network. For exact amounts, see [External integration costs](../references/cycle-costs.md#external-integrations).

## Cycles ledger

The **cycles ledger** (`um5iw-rqaaa-aaaaq-qaaba-cai`) is an NNS-controlled canister on the uzr34 system subnet that provides a shared cycles balance for principals. It complies with the ICRC-1, ICRC-2, and ICRC-3 standards, so cycles can be transferred, approved, and spent using the same interfaces as any other token. An accompanying index canister (`ul4oc-4iaaa-aaaaq-qaabq-cai`) runs on the same subnet.

The cycles ledger replaces the old cycles wallet model: instead of each developer deploying and managing their own cycles wallet canister, everyone shares the same ledger. Cycles are credited to a principal ID and subaccount just like any ICRC token.

![Cycles ledger architecture: the ledger interacts with the CMC and user canisters to provide deposit, withdraw, and canister creation](/concepts/cycles/cycles-ledger-architecture.png)

Key operations:

- **`deposit`**: credits attached cycles to a given account (principal + optional subaccount). Minimum 100M cycles must be attached; the 100M cycle fee is deducted.
- **`withdraw`**: sends cycles to a canister. The cycles are removed from the sender's ledger balance.
- **`withdraw_from`**: same as `withdraw`, but uses an ICRC-2 approval to draw from a different account.
- **`create_canister`**: creates a new canister funded from the caller's cycles ledger balance. Delegates to the CMC, which handles subnet placement.
- **`create_canister_from`**: same as `create_canister`, but uses an ICRC-2 approval to draw funds from a different account.

Every state-changing operation (each block created) costs 100M cycles as a fee. The full interface specification is available in the [cycles ledger reference](../references/system-canisters.md#cycles-ledger).

The cycles ledger does not support calling arbitrary canisters with cycles attached, because open call contexts can cause the ledger to become stuck. Two patterns address this:

- **Top up the target canister first**: if you control the canister, transfer cycles to it using `withdraw` or `icp canister top-up`, then let the canister attach cycles internally from its own balance. This is the preferred pattern for canisters you deploy and control.
- **Proxy canister**: if you need to call a canister method with cycles attached from the CLI or an external agent, deploy a proxy canister using the [`proxy` template](https://github.com/dfinity/icp-cli-templates/tree/main/proxy) and route the call through it. See [Calls with attached cycles](../guides/canister-calls/inter-canister-calls.md#calls-with-attached-cycles) for the how-to.

## Developer responsibility

**Topping up**: canisters burn cycles continuously for storage and on every update call. Developers must monitor balances and keep canisters funded. A canister that runs out of cycles freezes immediately and stops responding to all calls.

**Freezing threshold**: each canister has a configurable freezing threshold (default: 30 days of idle burn). If the cycle balance falls below this threshold, the canister is frozen before it can be deleted, giving developers time to top up. Increase this threshold for production canisters as a safety buffer.

**Deletion**: a frozen canister that is not topped up within the threshold window is eventually deleted by the network, along with all its data. Deletion is permanent and irreversible.

These responsibilities can be automated. Tools like [CycleOps](https://cycleops.dev/) monitor balances and top up canisters automatically.

## Cost predictability

The XDR peg and flat per-resource pricing make ICP costs predictable:

- **No surge pricing**: cycle prices are set by the [NNS](../concepts/governance.md) (ICP's governance system) and change infrequently. There are no congestion fees.
- **No per-transaction fees for users**: apps absorb all costs, like SaaS businesses absorb server bills.

The tradeoff is that developers must forecast and fund usage upfront rather than letting users pay as they go.

## Related

- [Cycles Management](../guides/canister-management/cycles-management.md): how to check balances, top up canisters, and set freezing thresholds
- [Calls with attached cycles](../guides/canister-calls/inter-canister-calls.md#calls-with-attached-cycles): attach cycles to an inter-canister call and use the proxy canister pattern for the CLI
- [Cycles ledger reference](../references/system-canisters.md#cycles-ledger): canister IDs, interface specification, and CMC integration
- [Cycle costs](../references/cycle-costs.md): exact cost tables for all operations
- [Canisters](./canisters.md): canisters as the paying entity for compute and storage

<!-- Upstream: informed by dfinity/portal docs/building-apps/essentials/gas-cost.mdx, docs/building-apps/getting-started/tokens-and-cycles.mdx; learn hub staging: canister-smart-contracts/cycles.md, canister-smart-contracts/cycles-ledger.md -->
