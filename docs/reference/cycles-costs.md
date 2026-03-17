---
title: "Cycles Costs"
description: "Exact cycle costs for compute, storage, HTTPS outcalls, signing, and canister operations"
sidebar:
  order: 6
---

Canisters pay for the resources they consume and operations they perform using **cycles**. The price of cycles is pegged to [XDR](glossary.md) (Special Drawing Rights): **1 trillion cycles = 1 XDR**. As of May 22, 2025, 1 XDR ≈ $1.35 USD — this rate fluctuates; see the [IMF's XDR exchange data](https://www.imf.org/external/np/fin/data/rms_sdrv.aspx) for the current rate.

You can use the [pricing calculator](https://3d5wy-5aaaa-aaaag-qkhsq-cai.icp0.io/) to estimate the cost for your dapp.

## Cycles units

| Abbreviation | Name     | In numbers        | XDR value | Approx. USD value |
|--------------|----------|-------------------|-----------|-------------------|
| T            | Trillion | 1_000_000_000_000 | 1         | ~$1.35            |
| B            | Billion  | 1_000_000_000     | 0.001     | ~$0.00135         |
| M            | Million  | 1_000_000         | 0.000001  | ~$0.00000135      |
| k            | Thousand | 1_000             | 10⁻⁹      | ~$0.00000000135   |

## Subnet replication factors

Costs scale with the number of nodes in the subnet. The base cost tables below assume a **13-node application subnet**. For a 34-node (fiduciary) subnet, costs scale as `34 * (cost / 13)`:

- **13-node subnet**: Standard application subnets. No scaling needed — costs are as listed.
- **34-node subnet**: Fiduciary subnets (higher security for DeFi). Costs are approximately **2.6×** the 13-node cost.

See [Subnet types](subnet-types.md) for subnet-specific details.

## Cost table

USD values are approximate and based on the May 2025 XDR rate (1 XDR ≈ $1.35). The XDR rate fluctuates — use cycle counts for precise budgeting.

<!-- Needs human verification: cloud pricing comparison requested in content brief — no upstream source found in .sources/ for ICP vs. cloud provider cost comparison. -->

| Operation | Description | Who pays | 13-node cycles | ~USD (May 2025) | 34-node cycles | ~USD (May 2025) |
|-----------|-------------|----------|----------------|-------------|----------------|-------------|
| Query call | Query information from a canister | N/A | Free | Free | Free | Free |
| Canister creation | Create a new canister | Created canister | 500_000_000_000 | ~$0.677 | 1_307_692_307_692 | ~$1.772 |
| Compute allocation (per % per second) | Reserved compute per second | Canister with allocation | 10_000_000 | ~$0.0000135 | 26_153_846 | ~$0.0000354 |
| Update message execution | Per update message executed (base fee) | Target canister | 5_000_000 | ~$0.0000068 | 13_076_923 | ~$0.0000177 |
| 1B instructions executed | Per 1B Wasm instructions (on top of base fee) | Executing canister | 1_000_000_000 | ~$0.00135 | 2_615_384_615 | ~$0.00354 |
| Xnet call (request + response) | Inter-canister call overhead | Sending canister | 260_000 | ~$0.00000035 | 680_000 | ~$0.00000092 |
| Xnet byte transmission | Per byte in inter-canister call | Sending canister | 1_000 | ~$0.00000000135 | 2_615 | ~$0.00000000354 |
| Ingress message reception | Per ingress message received | Receiving canister | 1_200_000 | ~$0.0000016 | 3_138_461 | ~$0.0000043 |
| Ingress byte reception | Per byte in ingress message | Receiving canister | 2_000 | ~$0.0000000027 | 5_230 | ~$0.0000000071 |
| GiB storage per second | Storage cost per GiB per second | Canister with storage | 127_000 | ~$0.000000172 | 332_153 | ~$0.000000450 |

**Storage cost per GiB per month (30 days):**

| Subnet | Cycles | ~USD (May 2025) |
|--------|--------|-----------------|
| 13-node | ~329 billion | ~$0.45 |
| 34-node | ~861 billion | ~$1.70 |

## HTTPS outcalls

HTTPS outcall costs scale with subnet size (`n` = number of nodes):

```
total_fee  = base_fee + size_fee
base_fee   = (3_000_000 + 60_000 * n) * n
size_fee   = (400 * request_bytes + 800 * max_response_bytes) * n
```

`request_bytes` is the total serialized request size (URL + headers + body + transform name/context). `max_response_bytes` defaults to 2 MiB if not explicitly set by the canister.

| Component | 13-node cycles | ~USD (May 2025) | 34-node cycles | ~USD (May 2025) |
|-----------|----------------|-----------------|----------------|-----------------|
| Per call (base) | 49_140_000 | ~$0.0000666 | 171_360_000 | ~$0.000232 |
| Per request byte | 5_200 | ~$0.000000007 | 13_600 | ~$0.0000000184 |
| Per reserved response byte | 10_400 | ~$0.000000014 | 27_200 | ~$0.0000000369 |

## Execution cost formula

Each update message execution is charged as a base fee plus a per-instruction fee (the *Update message execution* and *1B instructions executed* rows in the Cost table above):

```
total = base_fee + per_instruction_fee * num_instructions
```

Current values (13-node subnet):
- `base_fee` = 5_000_000 cycles (~$0.0000068 USD, May 2025)
- `per_instruction_fee` = 1 cycle (so 1B instructions = 1B cycles ≈ $0.00135, May 2025)

## Compute allocation

By default canisters are scheduled best-effort. Setting `compute_allocation` guarantees execution slots:

- **1%** — Scheduled every 100 rounds
- **2%** — Scheduled every 50 rounds
- **100%** — Scheduled every round

Total allocatable compute capacity per subnet is 299%. The per-second cost is `10M cycles * allocation_percent` on a 13-node subnet — see the *Compute allocation* row in the Cost table above for exact figures.

## Storage reservation

When a canister grows its memory (via `memory.grow`, `ic0.stable_grow()`, or Wasm installation), the system moves cycles from the canister's main balance into a **reserved cycles balance** to cover future storage payments.

- If subnet usage is **below 750 GiB**: reservation per byte = 0 (no advance reservation).
- If subnet usage is **above 750 GiB**: reservation per byte scales linearly from 0 up to 10 years of payments at subnet capacity (2 TiB).

Reserved cycles are non-transferable. Controllers can disable reservation by setting `reserved_cycles_limit = 0`, but opted-out canisters cannot allocate new memory when subnet usage exceeds 750 GiB.

## Resource limits

| Limit | Value |
|-------|-------|
| Instructions per update call / heartbeat / timer | 40 billion |
| Instructions per query call | 5 billion |
| Instructions per canister install / upgrade | 300 billion |
| Instructions per `inspect_message` | 200 million |
| Max ingress message payload | 2 MiB |
| Max cross-subnet inter-canister message payload | 2 MiB |
| Max same-subnet inter-canister request payload | 10 MiB |
| Max response size (replicated execution) | 2 MiB |
| Max response size (query) | 3 MiB |
| Wasm heap memory per canister | 4 GiB (wasm32) / 6 GiB (wasm64) |
| Wasm stable memory per canister | 500 GiB |
| Subnet capacity (total memory) | 2 TiB |
| Wasm module total size | 100 MiB |
| Wasm code section size | 10 MiB |

<!-- Needs human verification: A dedicated canister resource limits page does not yet exist in this site. The table above is adapted from dfinity/portal docs/building-apps/canister-management/resource-limits.mdx. Add a link here once that page is created. -->

## Special features

Certain ICP features have additional cycle costs beyond the base execution and messaging fees:

- **HTTPS outcalls** — See the [HTTPS outcalls cost formula](#https-outcalls) above.
- **EVM RPC canister** — Costs depend on the underlying RPC call and the HTTPS outcall fees above.
- **Threshold ECDSA / Schnorr signing** — Charged per signing request. Exact cost tables are not yet included on this page.
- **Bitcoin integration API** — Per-call fees apply. Exact cost tables are not yet included on this page.

<!-- TODO: add cost tables for threshold signing and Bitcoin API once figures are verified against the IC interface spec or management canister docs. -->

## Related pages

- [Cycles management](../guides/canister-management/cycles-management.md) — Topping up and monitoring canister balances
- [Reverse gas model](../concepts/reverse-gas-model.md) — Why canisters (not users) pay for execution
- [Subnet types](subnet-types.md) — Cost multipliers per subnet type

<!-- Upstream: informed by dfinity/portal docs/building-apps/essentials/gas-cost.mdx, docs/references/cycles-cost-formulas.mdx, docs/building-apps/canister-management/resource-limits.mdx -->
