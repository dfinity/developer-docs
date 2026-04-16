---
title: "Subnet Selection"
description: "Choose the right subnet for your canister deployment based on geographic, security, and colocation requirements"
sidebar:
  order: 8
---

The Internet Computer is composed of independent subnets — each a blockchain that hosts canisters and runs its own consensus. By default, icp-cli selects a subnet automatically when you deploy. This guide explains when and how to target a specific subnet.

## When to choose a subnet

Default subnet selection works for most projects. Consider targeting a specific subnet when you have:

- **Data residency requirements** — The European subnet ensures all nodes are located within Europe, which can support GDPR-aligned infrastructure for applications with regional data sovereignty requirements.
- **Higher security needs** — The fiduciary subnet has 34 nodes instead of 13, providing stronger fault tolerance and Byzantine fault resistance for DeFi and high-value applications.
- **Colocation goals** — Placing canisters on the same subnet eliminates cross-subnet message overhead and reduces inter-canister call latency.
- **Storage constraints** — Subnets share a storage budget across all their canisters. A subnet near capacity imposes extra reservation costs. Storage-heavy canisters benefit from deploying to subnets with more available headroom.

## Subnet types

### Application subnets

Application subnets are the standard deployment target for most canisters. Each application subnet has 13 nodes distributed across geographically diverse data centers. Application subnets can be individually configured to enable or disable specific features.

The [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) shows current load, node count, and block rate for each subnet, which is useful when comparing available application subnets.

### Fiduciary subnet

The fiduciary subnet (`pzp6e`) has 34 nodes instead of 13, providing higher security through a larger replication factor. Canisters on this subnet pay approximately 2.6× the cycle costs of a 13-node subnet — costs scale linearly with node count. The fiduciary subnet is designed for DeFi applications that require stronger guarantees than a standard application subnet provides.

The fiduciary subnet also hosts the threshold signature signing keys (t-ECDSA and t-Schnorr) and the EVM RPC canister.

### European subnet

The European subnet (`bkfrj`) restricts all node machines to the European geographic region. This allows developers and enterprises to build applications that combine blockchain decentralization with regional data residency. The European subnet is one option for applications targeting GDPR-aligned infrastructure.

Note that deploying to the European subnet is a necessary but not sufficient condition for GDPR compliance — developers must evaluate their full application architecture against applicable requirements.

### System subnets

System subnets host canisters that provide core ICP functionality (NNS, Internet Identity, the cycles ledger, etc.). You cannot deploy arbitrary canisters to system subnets. System subnets have special configurations, including no cycle charges for their hosted canisters.

The three system subnets are:

- `tdb26` — NNS canisters
- `uzr34` — Internet Identity, cycles ledger, exchange rate canister, ICP dashboard, and threshold signature key backup
- `w4rem` — Bitcoin integration canisters

## Default subnet behavior

When you run `icp deploy` without specifying a subnet, icp-cli uses the following logic:

1. If canisters in this environment already exist on mainnet, new canisters are created on the same subnet — keeping your project colocated automatically.
2. If no canisters exist yet, icp-cli selects a random application subnet.

This default keeps related canisters together and works correctly for most projects.

## Finding a subnet ID

Use the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) to browse available subnets:

1. Browse the subnet list or filter by type (Application, Fiduciary, etc.) or node location.
2. Click on a subnet to view details — node count, geographic distribution, current canister load, and block rate.
3. Copy the subnet principal (a text ID like `pzp6e-ekpqk-3c5x7-2h6so-njoeq-mt45d-h3h6c-q3mxf-vpeez-fez7a-iae`).

To find which subnet an existing canister is on, search for the canister ID on the [ICP Dashboard](https://dashboard.internetcomputer.org) — the canister detail page shows its subnet.

## Deploying to a specific subnet

Use the `--subnet` flag with `icp deploy` or `icp canister create`. The `--subnet` flag accepts the subnet's principal ID.

```bash
# Deploy all canisters in the project to a specific subnet
icp deploy -e ic --subnet pzp6e-ekpqk-3c5x7-2h6so-njoeq-mt45d-h3h6c-q3mxf-vpeez-fez7a-iae

# Deploy a single canister to a specific subnet
icp deploy my_canister -e ic --subnet pzp6e-ekpqk-3c5x7-2h6so-njoeq-mt45d-h3h6c-q3mxf-vpeez-fez7a-iae

# Create a canister on a specific subnet without deploying code
icp canister create my_canister -e ic --subnet pzp6e-ekpqk-3c5x7-2h6so-njoeq-mt45d-h3h6c-q3mxf-vpeez-fez7a-iae
```

The `--subnet` flag only affects canister creation. If a canister already exists, it stays on its current subnet — the flag has no effect on existing canisters.

> **Tip:** Subnet principal IDs can change over time. Always verify the current ID for a named subnet on the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) before using it in production scripts.

## Colocation with an existing canister

To create a new canister on the same subnet as an existing canister, use the `--proxy` flag with `icp canister create`. This routes the creation call through the existing canister and places the new canister on the same subnet:

```bash
icp canister create my_new_canister -e ic --proxy <EXISTING_CANISTER_ID>
```

This is useful when you already have a deployed canister and want new canisters to live on the same subnet. The proxy canister must implement a `proxy` method that forwards management canister calls.

## Storage capacity considerations

Subnets enforce a storage reservation policy above 750 GiB of total utilization. When a subnet's total storage usage exceeds that threshold, reservation costs scale linearly — canisters must reserve cycles for future storage payments up to 10 years of projected costs at full subnet capacity.

If you expect your canister to use significant storage, check the current utilization of candidate subnets on the [ICP Dashboard](https://dashboard.internetcomputer.org/subnets) before deploying. Choosing a subnet with available headroom avoids unexpected reservation costs as your canister grows.

For details on storage costs and the reservation formula, see [Cycles costs](../../reference/cycles-costs.md).

## Troubleshooting

### "Subnet not found" or canister creation fails

Verify the subnet ID is correct. Some subnets — including all system subnets — do not accept arbitrary canister creation. Confirm the subnet accepts new canisters on the ICP Dashboard before deploying.

### Canister is on the wrong subnet

Canisters cannot be moved between subnets while keeping the same canister ID by default. Your options depend on whether you can accept a new ID:

- **New canister ID is acceptable** — Transfer state via [canister snapshots](snapshots.md) to a new canister on the correct subnet.
- **Canister ID must be preserved** — Transfer state via snapshots, copy settings, then use `icp canister migrate-id` to move the ID to the new canister.

Note that any canister ID change means losing access to any threshold signature keys (tECDSA, tSchnorr) and vetKeys derived by the original canister — these are cryptographically bound to the canister ID. Any assets or encrypted data tied to those keys become permanently inaccessible under the new ID.

## Next steps

- [Cycles costs](../../reference/cycles-costs.md) — Cost tables and the subnet multiplier formula
- [Subnet types reference](../../reference/subnet-types.md) — Full reference for all subnet types with node counts and properties
- [Canister snapshots](snapshots.md) — Transfer state between canisters when migrating subnets
- [Network overview](../../concepts/network-overview.md) — How subnets fit into the ICP architecture

<!-- Upstream: informed by dfinity/portal docs/building-apps/developing-canisters/deploy-specific-subnet.mdx; dfinity/icp-cli docs/guides/deploying-to-specific-subnets.md -->
