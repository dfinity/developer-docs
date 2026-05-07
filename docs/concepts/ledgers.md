---
title: "Ledgers"
description: "How ledgers work on ICP: the ICP ledger, ICRC ledgers, addresses, transactions, archives, and fees"
sidebar:
  order: 14
---

Every digital asset on ICP is managed by a **ledger canister**: a canister that records ownership and permanently logs every transfer and balance change. This page explains how ledgers are structured, how they scale, and what the different address formats mean.

## What a ledger canister does

A ledger canister is the authoritative source of truth for an asset. It:

- Records the current balance of every account.
- Logs every transfer, mint, and burn operation in an append-only transaction history.
- Validates and executes transfer requests.
- Enforces transaction fees.

Unlike a traditional bank, ledger canisters are publicly readable: anyone can query transaction history through explorers and verify balances independently.

There is no single global ledger on ICP. Each asset is managed by its own ledger canister, deployed and governed by whoever controls that canister. ICP has its own ledger. Every [ICRC](../references/icrc-standards.md)-standard asset has its own ledger. [Chain-key tokens](chain-fusion.md) such as ckBTC and ckETH each have their own ledger canisters.

## Two ledger designs

ICP has two ledger designs in common use, each with a different address format.

### ICP ledger

The ICP ledger manages the native ICP asset. It uses an address format called an **AccountIdentifier**: a 32-byte hash derived from a principal ID and an optional subaccount. AccountIdentifiers are displayed as 64-character hex strings.

### ICRC ledgers

Most fungible assets on ICP (including chain-key tokens like ckBTC and ckETH) use the ICRC standard. ICRC ledgers use a two-part account format:

- **Principal**: the identity of the holder (a user principal or canister principal).
- **Subaccount** (optional): a 32-byte value that lets a single principal manage many internal accounts.

This model gives wallets and services flexibility: a single canister can track individual user balances in separate subaccounts without deploying a separate canister per user.

The [ICRC](../references/icrc-standards.md) standard defines a family of interfaces. ICRC-1 covers basic transfers. ICRC-2 adds approval and transfer-from semantics (like ERC-20 allowances). ICRC-3 standardizes the transaction log format. All DFINITY-maintained asset ledgers implement at least ICRC-1 and ICRC-2. See [Digital assets guide](../guides/digital-assets/ledgers.md) for the API.

## How transactions are recorded

Ledgers maintain an append-only transaction log. Every transfer, mint, and burn creates a new block at the end of the log. Blocks are never removed or rewritten, making the history fully auditable.

Each block contains the operation type, the accounts involved, the amount, the timestamp, and an optional memo. This log is the basis for wallet balance displays and explorer history views.

## Scaling with archives and index canisters

As a ledger accumulates transactions, its storage grows. Two additional components manage this growth:

**Archive canisters.** Older transaction blocks are moved out of the main ledger canister into archive canisters. This lets the ledger scale well beyond a single canister's storage limit and across subnet boundaries. From a user's perspective, the history remains fully accessible through explorers and tooling; archiving is an internal implementation detail.

**Index canisters.** Most deployed ledgers have a companion index canister that organizes transaction data by account address. Wallets and explorers query the index to retrieve the transaction history for a specific account without scanning every block in the ledger. The index does not change any balances or create new transactions; it is purely a read-optimized view over the ledger's history.

Together: the ledger records the truth, archives extend storage capacity, and the index makes retrieval fast.

## Transaction fees

Most transfers incur a small fee. The sender pays the fee when initiating a transfer. Depending on how the ledger is configured, fees are either:
- **Burned**: removed from the total supply permanently, creating deflationary pressure.
- **Collected**: sent to a designated fee account (as the ICP ledger does for the NNS).

Fees are typically small and fixed (for example, the ICP transfer fee is 0.0001 ICP; the ckBTC transfer fee is 10 satoshi). Because cycle costs are stable in XDR terms, transaction fees in cycles-denominated contexts remain predictable even as ICP's market price changes.

## Next steps

- [Digital assets guide](../guides/digital-assets/ledgers.md): ICRC-1/2 API usage, transfer examples, balance queries
- [Network economics](network-economics.md): how ICP and SNS assets are economically designed
- [Cycles](cycles.md): cycles as the computational fuel that ledger canisters and other canisters consume
- [Chain-key tokens](chain-fusion.md): ckBTC, ckETH, and other 1:1 backed asset ledgers

<!-- Upstream: informed by Learn Hub article "How Token Ledgers Work on the Internet Computer" (migrated, source retired) -->
