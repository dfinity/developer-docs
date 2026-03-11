---
title: "System Canisters"
description: "ICP ledger, cycles ledger, NNS governance, CMC, and other system canisters with their canister IDs"
sidebar:
  order: 3
doc_type: reference
level: intermediate
last_verified: 2026-03-10
---

System canisters provide essential infrastructure for the ICP network. They run on the NNS system subnet, pay no cycles, and are upgraded exclusively through NNS governance proposals. Their canister IDs are fixed and well-known.

## Quick reference

| Canister | Canister ID | Subnet |
|----------|-------------|--------|
| NNS Registry | `rwlgt-iiaaa-aaaaa-aaaaa-cai` | NNS |
| NNS Governance | `rrkah-fqaaa-aaaaa-aaaaq-cai` | NNS |
| ICP Ledger | `ryjl3-tyaaa-aaaaa-aaaba-cai` | NNS |
| ICP Index | `qhbym-qaaaa-aaaaa-aaafq-cai` | NNS |
| NNS Root | `r7inp-6aaaa-aaaaa-aaabq-cai` | NNS |
| NNS Lifeline | `rno2w-sqaaa-aaaaa-aaacq-cai` | NNS |
| Cycles Minting (CMC) | `rkp4c-7iaaa-aaaaa-aaaca-cai` | NNS |
| Genesis Token (GTC) | `renrk-eyaaa-aaaaa-aaada-cai` | NNS |
| SNS Wasm | `qaa6y-5yaaa-aaaaa-aaafa-cai` | NNS |

All NNS canisters are hosted on the NNS subnet [`tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe`](https://dashboard.internetcomputer.org/subnet/tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe).

---

## NNS Registry

**Canister ID:** [`rwlgt-iiaaa-aaaaa-aaaaa-cai`](https://dashboard.internetcomputer.org/canister/rwlgt-iiaaa-aaaaa-aaaaa-cai)

The NNS Registry stores the network topology: subnet membership, node assignments, routing tables, and protocol version information. It is the source of truth for the structure of the IC network.

**Common operations:**

- Query subnet membership and node information
- Read routing table entries
- Look up protocol version for a subnet

**Further reading:** [NNS documentation](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236-NNS-Network-Nervous-System)

---

## NNS Governance

**Canister ID:** [`rrkah-fqaaa-aaaaa-aaaaq-cai`](https://dashboard.internetcomputer.org/canister/rrkah-fqaaa-aaaaa-aaaaq-cai)

The NNS Governance canister manages proposals, neuron staking, and voting for the Network Nervous System. All protocol changes, canister upgrades, and subnet operations are executed through proposals voted on here.

**Common operations:**

- Submit and vote on proposals
- Create, manage, and dissolve neurons
- Query proposal status and voting results

**Candid interface:** Available via the [NNS Governance repository](https://github.com/dfinity/ic/tree/master/rs/nns/governance)

---

## ICP Ledger

**Canister ID:** [`ryjl3-tyaaa-aaaaa-aaaba-cai`](https://dashboard.internetcomputer.org/canister/ryjl3-tyaaa-aaaaa-aaaba-cai)

The ICP Ledger handles all ICP token transfers and balance queries. It implements the ICRC-1 and ICRC-2 token standards.

**Common operations:**

- Transfer ICP between accounts (`icrc1_transfer`)
- Query account balances (`icrc1_balance_of`)
- Approve spending allowances (`icrc2_approve`)

**Example — query balance:**

```bash
icp canister call ryjl3-tyaaa-aaaaa-aaaba-cai icrc1_balance_of \
  '(record { owner = principal "YOUR_PRINCIPAL" })' -n ic
```

**Candid interface:** [ICP Ledger specification](https://github.com/dfinity/ic/tree/master/rs/ledger_suite/icp)

---

## ICP Index

**Canister ID:** [`qhbym-qaaaa-aaaaa-aaafq-cai`](https://dashboard.internetcomputer.org/canister/qhbym-qaaaa-aaaaa-aaafq-cai)

The ICP Index canister indexes transactions from the ICP Ledger, enabling efficient queries for transaction history by account.

**Common operations:**

- Query transaction history for an account
- Look up a specific transaction by index

---

## NNS Root

**Canister ID:** [`r7inp-6aaaa-aaaaa-aaabq-cai`](https://dashboard.internetcomputer.org/canister/r7inp-6aaaa-aaaaa-aaabq-cai)

The NNS Root canister manages upgrades of other NNS canisters. When the governance canister approves an upgrade proposal, the root canister executes the upgrade.

**Common operations:**

- Upgrade NNS canisters (triggered by governance proposals)
- Query canister status for NNS canisters

---

## NNS Lifeline

**Canister ID:** [`rno2w-sqaaa-aaaaa-aaacq-cai`](https://dashboard.internetcomputer.org/canister/rno2w-sqaaa-aaaaa-aaacq-cai)

The NNS Lifeline canister serves as a fallback mechanism for upgrading the NNS Root and Governance canisters. It exists to prevent a deadlock where the root canister cannot upgrade itself.

---

## Cycles Minting Canister (CMC)

**Canister ID:** [`rkp4c-7iaaa-aaaaa-aaaca-cai`](https://dashboard.internetcomputer.org/canister/rkp4c-7iaaa-aaaaa-aaaca-cai)

The CMC converts ICP tokens into cycles by burning ICP. The exchange rate is determined by the current ICP/XDR rate, keeping the cost of cycles stable in fiat terms.

**Common operations:**

1. Transfer ICP to the CMC on the ICP Ledger with the recipient's principal encoded in the subaccount.
2. Call `notify_mint_cycles` on the CMC with the block index from the transfer.
3. The recipient's cycles balance on the Cycles Ledger increases.

**Example:**

```bash
# Step 1: Transfer ICP to CMC
icp canister call ryjl3-tyaaa-aaaaa-aaaba-cai icrc1_transfer \
  '(record { to = record { owner = principal "rkp4c-7iaaa-aaaaa-aaaca-cai"; subaccount = opt blob "..." }; amount = 100_000_000 : nat; fee = opt (10_000 : nat) })' \
  -n ic

# Step 2: Notify CMC
icp canister call rkp4c-7iaaa-aaaaa-aaaca-cai notify_mint_cycles \
  '(record { block_index = 123_456_789 : nat64 })' -n ic
```

---

## Genesis Token Canister (GTC)

**Canister ID:** [`renrk-eyaaa-aaaaa-aaada-cai`](https://dashboard.internetcomputer.org/canister/renrk-eyaaa-aaaaa-aaada-cai)

The Genesis Token Canister manages information about genesis token allocations and balances from the IC launch.

**Common operations:**

- Query genesis token balances and account information

---

## SNS Wasm

**Canister ID:** [`qaa6y-5yaaa-aaaaa-aaafa-cai`](https://dashboard.internetcomputer.org/canister/qaa6y-5yaaa-aaaaa-aaafa-cai)

The SNS Wasm canister stores the Wasm modules for all SNS canister types (governance, ledger, root, swap, index, archive). It is used to deploy new SNS instances and to manage upgrades of existing SNS canisters.

**Common operations:**

- Deploy a new SNS for a dapp
- Get the latest SNS Wasm versions
- Propose SNS canister upgrades

**Further reading:** [SNS documentation](https://learn.internetcomputer.org/hc/en-us/articles/34084394684564-SNS-Service-Nervous-System)

---

## Using system canisters in your project

You can call any system canister from your own canister using standard inter-canister calls. Use the canister IDs listed above as the target principal.

To use a system canister in your project, add it as a dependency in your `icp.yaml` configuration file with its well-known canister ID. The local replica will route calls to the canister as configured.

This lets you test integrations with system canisters locally before deploying to mainnet.
