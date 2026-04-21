---
title: "Subnet Types Reference"
description: "All subnet types with node counts, replication factors, and cycle cost multipliers"
sidebar:
  order: 11
---

The Internet Computer is composed of independent **subnets** — each an autonomous blockchain that hosts a set of canisters. Subnets differ in node count, replication factor, cycle costs, geographic distribution, and what canisters they accept. This page lists all subnet types and their properties.

For guidance on choosing a subnet for deployment, see [Subnet selection](../guides/canister-management/subnet-selection.md). For per-operation cycle costs, see [Cycles costs](cycles-costs.md).

## Subnet properties explained

| Property | What it means |
|----------|---------------|
| **Node count** | The number of replica nodes in the subnet. Higher node counts mean greater fault tolerance and Byzantine resistance. |
| **Cycle cost multiplier** | Costs scale linearly with node count relative to a 13-node baseline. A subnet with n nodes costs `n/13` more per operation than a standard 13-node subnet. |
| **Geographic distribution** | Where the nodes are located. Relevant for data sovereignty requirements. |
| **Canister creation** | Whether arbitrary user canisters can be created on the subnet. System subnets do not allow this. |

## Application subnets

Application subnets are the standard destination for user canisters. ICP has many application subnets running in parallel.

| Property | Value |
|----------|-------|
| Node count | 13 |
| Cycle cost multiplier | 1× (baseline) |
| Geographic distribution | Global (mixed node locations) |
| Canister creation | Open to all |

Each application subnet operates independently. Canisters on different application subnets can communicate via cross-subnet (Xnet) calls. By default, `icp deploy` places canisters on an application subnet automatically.

You may want to deploy to a specific application subnet for:

- **Colocation** — Keep related canisters on the same subnet to minimize Xnet call overhead
- **Resource availability** — Prefer subnets with lower utilization if storage is a concern (each application subnet has a 2 TiB storage capacity)
- **Specific features** — Some application subnets have features enabled or disabled by NNS governance

Browse available application subnets on the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets). Filter by type to find "Application" subnets and view their current load and node locations.

## System subnets

System subnets host ICP's core infrastructure canisters. They have special configurations — including no cycle charges for their canisters — to ensure continuous availability. **User canisters cannot be created on system subnets.**

System subnets also have more generous execution limits: a higher per-call instruction limit and a larger maximum Wasm module size.

There are currently three system subnets:

| Subnet | Principal prefix | Contents |
|--------|-----------------|----------|
| NNS | `tdb26` | 14 NNS canisters (governance, registry, ledger, CMC, etc.) |
| Internet Identity / infrastructure | `uzr34` | Internet Identity, cycles ledger, exchange rate canister, ICP dashboard; backup threshold signing keys |
| Bitcoin integration | `w4rem` | Bitcoin integration canisters |

Full principals for these subnets are available on the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets).

For a complete list of the canisters running on these subnets, see [System canisters](system-canisters.md).

## Fiduciary subnet

The fiduciary subnet is a single large application subnet with more nodes than the standard 13-node application subnet. The larger committee size provides a higher security threshold — useful for DeFi applications that require stronger guarantees. Cycle costs scale linearly with node count.

| Property | Value |
|----------|-------|
| Node count | See [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) for current count |
| Cycle cost multiplier | Proportional to node count (e.g., 34 nodes → ~2.6×; 31 nodes → ~2.4×) |
| Geographic distribution | Global |
| Canister creation | Open to all |
| Principal prefix | `pzp6e` |
| Notable tenants | EVM RPC canister; threshold ECDSA and Schnorr signing keys |

The fiduciary subnet hosts the active threshold signature keys used by all chain-key signing operations (tECDSA, tSchnorr). It also hosts the EVM RPC canister.

> **Note:** Check the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) for the authoritative current node count and full principal ID of the fiduciary subnet. The node count determines the exact cycle cost multiplier for operations on this subnet.

**Cost example (based on 34 nodes):** An update call that costs 5 million cycles on a 13-node subnet costs approximately 13 million cycles on the fiduciary subnet (`5M × 34/13 ≈ 13M`). See [Cycles costs](cycles-costs.md) for complete tables.

To deploy to the fiduciary subnet (verify the full principal ID on the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) before deploying):

```bash
icp deploy -e ic --subnet pzp6e-ekpqk-3c5x7-2h6so-njoeq-mt45d-h3h6c-q3mxf-vpeez-fez7a-iae
```

## European subnet

The European subnet is an application subnet whose nodes are located exclusively in the European geographic region. It is designed for applications with data residency or GDPR-alignment requirements.

| Property | Value |
|----------|-------|
| Node count | 13 |
| Cycle cost multiplier | 1× (same as standard application subnets) |
| Geographic distribution | Europe only |
| Canister creation | Open to all |
| Principal prefix | `bkfrj` |

> **Note:** The European subnet enables GDPR-aligned infrastructure, but developers and enterprises must take additional measures to ensure their applications meet all applicable GDPR requirements.

To deploy to the European subnet:

```bash
icp deploy -e ic --subnet bkfrj-6k62g-dycql-7h53p-atvkj-zg4to-gaogh-netha-ptybj-ntsgw-rqe
```

## Summary table

| Subnet type | Node count | Cost multiplier | Open to users | Geographic constraint |
|-------------|-----------|----------------|--------------|----------------------|
| Application | 13 | 1× | Yes | None (global) |
| System | Varies (NNS: varies; `uzr34`: 28; `w4rem`: varies) | N/A (no charges) | No | None |
| Fiduciary | See ICP Dashboard | Proportional to node count | Yes | None (global) |
| European | 13 | 1× | Yes | Europe only |

## Cycle costs by subnet type

Cycle costs scale linearly with node count. The baseline is a 13-node application subnet. For all operations:

```
cost_on_n_node_subnet = base_cost × n / 13
```

For a fiduciary subnet, the multiplier depends on the current node count — verify on the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets). For example, at 34 nodes: `34 / 13 ≈ 2.615`.

**Example: canister creation cost**

| Subnet | Node count | Cycles | ~USD (May 2025) |
|--------|-----------|--------|-----------------|
| Application | 13 | 500,000,000,000 | ~$0.68 |
| European | 13 | 500,000,000,000 | ~$0.68 |
| Fiduciary | verify on dashboard | base × n / 13 | varies with node count |

USD values are approximate and vary with the ICP/XDR exchange rate. See [Cycles costs](cycles-costs.md) for current figures and the full cost table including storage, execution, Xnet calls, and HTTPS outcalls.

## Finding subnet IDs

Use the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) to:

- Browse all subnets by type, node location, or current load
- Get the full principal ID for a subnet
- See which canisters are running on a subnet
- Check subnet utilization (relevant for storage-heavy deployments)

To find which subnet an existing canister is on, search for the canister ID on the dashboard — the canister detail page shows its subnet.

## Next steps

- [Subnet selection](../guides/canister-management/subnet-selection.md) — How to choose a subnet for your deployment
- [Cycles costs](cycles-costs.md) — Full cost tables and per-operation pricing

<!-- Upstream: informed by dfinity/portal docs/building-apps/developing-canisters/deploy-specific-subnet.mdx; dfinity/icp-cli docs/guides/deploying-to-specific-subnets.md -->
