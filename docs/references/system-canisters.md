---
title: "System canisters"
description: "NNS canisters, Internet Identity, ICP ledger, and other system-level canisters with canister IDs and interface references"
sidebar:
  order: 2
---

System canisters are canisters that provide necessary functions to the ICP network. They are controlled by the NNS (Network Nervous System) and upgraded via NNS proposals. Each system canister runs on a system subnet, which has special parameters (including no cycles costs) to guarantee uninterrupted operation. System canisters have static canister IDs that any project can call.

This page lists every system canister with its canister ID, hosting subnet, purpose, and interface reference.

For the management canister (`aaaaa-aa`), see [Management Canister](management-canister.md). For protocol-level canisters such as the Bitcoin canister, ckBTC minter, and EVM RPC canister, see [Protocol Canisters](protocol-canisters.md).

## Canister IDs at a glance

| Canister | Canister ID | Subnet |
|---|---|---|
| NNS registry | `rwlgt-iiaaa-aaaaa-aaaaa-cai` | NNS (`tdb26-…-eqe`) |
| NNS governance | `rrkah-fqaaa-aaaaa-aaaaq-cai` | NNS (`tdb26-…-eqe`) |
| ICP ledger | `ryjl3-tyaaa-aaaaa-aaaba-cai` | NNS (`tdb26-…-eqe`) |
| NNS root | `r7inp-6aaaa-aaaaa-aaabq-cai` | NNS (`tdb26-…-eqe`) |
| Cycles minting (CMC) | `rkp4c-7iaaa-aaaaa-aaaca-cai` | NNS (`tdb26-…-eqe`) |
| NNS lifeline | `rno2w-sqaaa-aaaaa-aaacq-cai` | NNS (`tdb26-…-eqe`) |
| Internet Identity | `rdmx6-jaaaa-aaaaa-aaadq-cai` | uzr34 (`uzr34-…-oqe`) |
| Genesis token | `renrk-eyaaa-aaaaa-aaada-cai` | NNS (`tdb26-…-eqe`) |
| NNS UI | `qoctq-giaaa-aaaaa-aaaea-cai` | NNS (`tdb26-…-eqe`) |
| ICP ledger archive (1) | `qjdve-lqaaa-aaaaa-aaaeq-cai` | NNS (`tdb26-…-eqe`) |
| ICP ledger archive (2) | `qsgjb-riaaa-aaaaa-aaaga-cai` | NNS (`tdb26-…-eqe`) |
| ICP index | `qhbym-qaaaa-aaaaa-aaafq-cai` | NNS (`tdb26-…-eqe`) |
| SNS-W (SNS Wasm) | `qaa6y-5yaaa-aaaaa-aaafa-cai` | NNS (`tdb26-…-eqe`) |
| Cycles ledger | `um5iw-rqaaa-aaaaq-qaaba-cai` | uzr34 (`uzr34-…-oqe`) |
| Cycles ledger index | `ul4oc-4iaaa-aaaaq-qaabq-cai` | uzr34 (`uzr34-…-oqe`) |

Full subnet IDs:

- **NNS subnet:** [`tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe`](https://dashboard.internetcomputer.org/subnet/tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe)
- **uzr34 subnet:** [`uzr34-akd3s-xrdag-3ql62-ocgoh-ld2ao-tamcv-54e7j-krwgb-2gm4z-oqe`](https://dashboard.internetcomputer.org/subnet/uzr34-akd3s-xrdag-3ql62-ocgoh-ld2ao-tamcv-54e7j-krwgb-2gm4z-oqe)

## NNS canisters

The Network Nervous System is itself a set of canisters that collectively govern the ICP protocol. All NNS canisters run on the NNS subnet (`tdb26-…-eqe`).

### NNS registry

**Canister ID:** [`rwlgt-iiaaa-aaaaa-aaaaa-cai`](https://dashboard.internetcomputer.org/canister/rwlgt-iiaaa-aaaaa-aaaaa-cai)

The registry canister stores and manages the configuration of the entire IC network: subnet membership, node providers, replica versions, routing tables, and canister assignments. When the NNS passes a proposal to upgrade a subnet or add a node, the registry is updated and the change propagates to the network.

The registry is the source of truth for network topology and is consulted by every subnet when it needs to verify a routing decision or replica version.

### NNS governance

**Canister ID:** [`rrkah-fqaaa-aaaaa-aaaaq-cai`](https://dashboard.internetcomputer.org/canister/rrkah-fqaaa-aaaaa-aaaaq-cai)

The governance canister implements the NNS voting mechanism. ICP holders stake ICP in **neurons** to gain voting power, vote on **proposals**, and earn voting rewards. Proposals that pass are executed automatically: for example, a "Upgrade Subnet" proposal causes the governance canister to call the root canister, which upgrades the affected subnet canisters.

For a conceptual overview of how NNS governance works, see [Governance](../concepts/governance.md).

### NNS root

**Canister ID:** [`r7inp-6aaaa-aaaaa-aaabq-cai`](https://dashboard.internetcomputer.org/canister/r7inp-6aaaa-aaaaa-aaabq-cai)

The root canister is the controller of all other NNS canisters (except governance, which controls itself). When a passed NNS proposal requires upgrading an NNS canister, the governance canister instructs root to perform the upgrade. Root holds the authority to install, upgrade, and stop NNS canisters.

### NNS lifeline

**Canister ID:** [`rno2w-sqaaa-aaaaa-aaacq-cai`](https://dashboard.internetcomputer.org/canister/rno2w-sqaaa-aaaaa-aaacq-cai)

The lifeline canister is responsible for upgrading the NNS root canister itself. Because root controls the other NNS canisters, there must be a separate canister one level above root that can upgrade it. Lifeline fills that role, ensuring the upgrade path for root remains intact.

### NNS UI

**Canister ID:** [`qoctq-giaaa-aaaaa-aaaea-cai`](https://dashboard.internetcomputer.org/canister/qoctq-giaaa-aaaaa-aaaea-cai)

The NNS UI canister hosts the NNS app frontend at [nns.ic0.app](https://nns.ic0.app). It provides a browser-based interface for staking neurons, voting on proposals, managing ICP tokens, and participating in SNS launches.

## Cycles minting canister (CMC)

**Canister ID:** [`rkp4c-7iaaa-aaaaa-aaaca-cai`](https://dashboard.internetcomputer.org/canister/rkp4c-7iaaa-aaaaa-aaaca-cai)

**Subnet:** NNS (`tdb26-…-eqe`)

The cycles minting canister converts ICP tokens into cycles by burning ICP and minting cycles at the current ICP/XDR exchange rate. The CMC calls the [exchange rate canister (XRC)](protocol-canisters.md#exchange-rate-canister-xrc) every 5 minutes for the current ICP/XDR rate so that cycles maintain a roughly stable cost in real-world currency. The fixed conversion is: **1 trillion cycles = 1 XDR** (this ratio is a protocol constant set by NNS governance).

### How to mint cycles via the CMC

Minting cycles requires two steps: sending ICP to the CMC and then notifying the CMC of the transfer.

**Step 1: Send ICP to the CMC with a subaccount that encodes the recipient principal.**

The subaccount is constructed from the recipient principal as a 32-byte array:
- Byte 0: length of the principal blob (as a single byte)
- Bytes 1–N: the principal bytes
- Remaining bytes: `0x00`

**Step 2: Call `notify_mint_cycles` on the CMC with the block index returned by the transfer.**

```candid
notify_mint_cycles: (record { block_index: nat64 }) -> (Result)
```

The recipient principal's cycles balance increases by the minted amount. To check the balance, query the [cycles ledger](#cycles-ledger).

For full details on managing cycles in canisters, see [Cycles management](../guides/canister-management/cycles-management.md).

### Querying the current ICP/XDR rate

The CMC exposes `get_icp_xdr_conversion_rate`, which returns the current ICP/XDR exchange rate as used internally for minting:

```candid
get_icp_xdr_conversion_rate : () -> (record { data: record { xdr_permyriad_per_icp: nat64 } })
```

`xdr_permyriad_per_icp` is the amount of XDR per ICP expressed in units of 1/10000. For example, `19482` means 1 ICP = 1.9482 XDR. This is an ICP/XDR rate; the CMC does not track XDR/USD.

The CMC also exposes a Prometheus metrics endpoint at `https://rkp4c-7iaaa-aaaaa-aaaca-cai.raw.icp0.io/metrics` with the following relevant fields:

| Metric | Description |
|--------|-------------|
| `cmc_icp_xdr_conversion_rate` | Current ICP/XDR rate (floating point) |
| `cmc_avg_icp_xdr_conversion_rate` | 30-day moving average ICP/XDR (used for node provider reward payouts) |
| `cmc_cycles_per_xdr` | Always 1_000_000_000_000 (confirms 1T cycles = 1 XDR) |

Responses from this endpoint are not certified.

To derive the current XDR/USD rate from these values, see [Getting the current XDR/USD rate](cycle-costs.md#getting-the-current-xdrusd-rate) in the Cycle costs reference.

## Genesis token canister

**Canister ID:** [`renrk-eyaaa-aaaaa-aaada-cai`](https://dashboard.internetcomputer.org/canister/renrk-eyaaa-aaaaa-aaada-cai)

**Subnet:** NNS (`tdb26-…-eqe`)

The genesis token canister (GTC) holds account and balance information for ICP tokens distributed at the IC genesis event. It is used to claim genesis tokens and query historical balances for genesis participants. For most developers, this canister is not relevant to application development.

## ICP ledger

**Canister ID:** [`ryjl3-tyaaa-aaaaa-aaaba-cai`](https://dashboard.internetcomputer.org/canister/ryjl3-tyaaa-aaaaa-aaaba-cai)

**Subnet:** NNS (`tdb26-…-eqe`)

The ICP ledger canister tracks ICP token balances and processes ICP transfers. It implements both the legacy `transfer` interface and the ICRC-1/ICRC-2 token standard.

Key methods:

| Method | Description |
|---|---|
| `icrc1_transfer` | Transfer ICP between accounts (ICRC-1) |
| `icrc1_balance_of` | Query an account balance |
| `icrc1_total_supply` | Query total ICP supply |
| `icrc2_approve` | Approve a spender (ICRC-2) |
| `icrc2_transfer_from` | Transfer on behalf of an approver (ICRC-2) |
| `transfer` | Legacy transfer (uses account identifiers) |
| `account_balance` | Legacy balance query (uses account identifiers) |

The ICP ledger archives historical transactions across multiple archive canisters to keep its own state manageable. See [ICP ledger archives](#icp-ledger-archives) below.

For ICRC interface details, see [Digital Asset Standards](digital-asset-standards.md).

## ICP ledger archives

Archive canister IDs:
- [`qjdve-lqaaa-aaaaa-aaaeq-cai`](https://dashboard.internetcomputer.org/canister/qjdve-lqaaa-aaaaa-aaaeq-cai)
- [`qsgjb-riaaa-aaaaa-aaaga-cai`](https://dashboard.internetcomputer.org/canister/qsgjb-riaaa-aaaaa-aaaga-cai)

**Subnet:** NNS (`tdb26-…-eqe`)

The ICP ledger periodically moves older transaction blocks into archive canisters to limit the ledger's own heap size. When querying historical transactions, the ledger transparently redirects queries to the appropriate archive. Additional archive canisters are created automatically as the ledger grows.

## ICP index

**Canister ID:** [`qhbym-qaaaa-aaaaa-aaafq-cai`](https://dashboard.internetcomputer.org/canister/qhbym-qaaaa-aaaaa-aaafq-cai)

**Subnet:** NNS (`tdb26-…-eqe`)

The ICP index canister indexes ICP ledger transactions by account, making it efficient to fetch the transaction history for a given account without scanning all ledger blocks. It mirrors data from the ICP ledger and its archive canisters.

Key method:

| Method | Description |
|---|---|
| `get_account_transactions` | Fetch transactions for an account, paginated |

## Internet Identity

**Canister ID:** [`rdmx6-jaaaa-aaaaa-aaadq-cai`](https://dashboard.internetcomputer.org/canister/rdmx6-jaaaa-aaaaa-aaadq-cai)

**Subnet:** uzr34 (`uzr34-…-oqe`)

Internet Identity (II) is ICP's built-in authentication system. It allows users to authenticate to apps using device credentials (passkeys, security keys, biometrics) without exposing a persistent identity across applications. Each app receives a distinct principal for the same user, preventing cross-site tracking.

Internet Identity is the most commonly integrated system canister in app development. It is available in local development environments by setting `ii: true` in your network configuration (see [Using system canisters in local development](#using-system-canisters-in-local-development)).

For the full specification, see [Internet Identity Specification](internet-identity-spec.md).

For integration guides, see the guides under [Authentication](../guides/authentication/).

## SNS-W (SNS Wasm)

**Canister ID:** [`qaa6y-5yaaa-aaaaa-aaafa-cai`](https://dashboard.internetcomputer.org/canister/qaa6y-5yaaa-aaaaa-aaafa-cai)

**Subnet:** NNS (`tdb26-…-eqe`)

The SNS Wasm canister stores the canonical Wasm modules for SNS (Service Nervous System) canisters. When an SNS is launched, SNS-W deploys and initializes the SNS governance, ledger, swap, and root canisters. When an SNS upgrade proposal passes, SNS-W supplies the new Wasm module.

Developers launching an SNS interact with SNS-W indirectly. The SNS launch tooling calls it on their behalf. For SNS launch guides, see [Governance guides](../guides/governance/).

## Cycles ledger

**Canister ID:** [`um5iw-rqaaa-aaaaq-qaaba-cai`](https://dashboard.internetcomputer.org/canister/um5iw-rqaaa-aaaaq-qaaba-cai)

**Subnet:** uzr34 (`uzr34-…-oqe`)

The cycles ledger allows principals to hold cycles directly without requiring a separate cycles wallet canister. It implements ICRC-1/ICRC-2 for cycles, enabling principals to receive, hold, and spend cycles using the same interface as any other token ledger.

Key differences from cycles wallets:
- Cycles are held at the principal level, not in a dedicated canister
- Transfers and balance queries use ICRC-1/ICRC-2 methods
- Compatible with any ICRC-1 tooling

For the full interface, see the [cycles ledger Candid file](https://github.com/dfinity/cycles-ledger/blob/main/cycles-ledger/cycles-ledger.did).

## Cycles ledger index

**Canister ID:** [`ul4oc-4iaaa-aaaaq-qaabq-cai`](https://dashboard.internetcomputer.org/canister/ul4oc-4iaaa-aaaaq-qaabq-cai)

**Subnet:** uzr34 (`uzr34-…-oqe`)

The cycles ledger index canister indexes cycles ledger transactions by account, mirroring the same pattern as the ICP index canister for ICP transactions.

## Using system canisters in local development

The icp-cli local network automatically includes Internet Identity and NNS canisters. Enable them in your `icp.yaml` network configuration:

```yaml
# icp.yaml
networks:
  - name: local
    mode: managed
    ii: true    # enables Internet Identity at id.ai.localhost:<port>
    nns: true   # enables NNS and SNS canisters (implies ii)
```

Then start the local network:

```bash
icp network start -d
```

System canisters run at their mainnet canister IDs on the local network, so calls to `rdmx6-jaaaa-aaaaa-aaadq-cai` (Internet Identity) or `ryjl3-tyaaa-aaaaa-aaaba-cai` (ICP ledger) work without any additional configuration.

For how to call system canisters from your own canister, see [Inter-canister calls](../guides/canister-calls/inter-canister-calls.mdx).

## Querying system canister data via the Dashboard API

The IC Dashboard API provides REST endpoints for querying canister metadata, transaction history, and network metrics without making onchain calls. See [IC Dashboard APIs](ic-dashboard-api.md) for the full reference.

## Next steps

- [Management Canister](management-canister.md): the `aaaaa-aa` pseudo-canister for canister lifecycle and platform features
- [Protocol Canisters](protocol-canisters.md): Bitcoin canister, ckBTC minter, EVM RPC, and exchange rate canister
- [Governance](../concepts/governance.md): how the NNS and SNS governance models work
- [Authentication guides](../guides/authentication/): integrating Internet Identity into your app

<!-- Upstream: informed by dfinity/portal — docs/references/system-canisters/index.mdx; docs/references/system-canisters/xrc.mdx -->
