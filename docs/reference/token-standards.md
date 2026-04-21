---
title: "Token Standards"
description: "ICRC-1 fungible tokens, ICRC-2 approval, ICRC-3 transaction log, and ICRC-7 NFTs"
sidebar:
  order: 9
---

ICP uses the ICRC standard family for tokens and token-related operations. This page covers the token standards (ICRC-1 through ICRC-37) and wallet signer standards (ICRC-21 through ICRC-49) that developers need to build DeFi applications, wallets, and token integrations.

ICRC stands for Internet Computer Request for Comments. Standards are proposed by the [ICRC working group](https://github.com/dfinity/ICRC), refined through community consensus, and adopted or rejected through NNS governance proposals.

## Standards overview

| Standard | Purpose | Extends | Status |
|----------|---------|---------|--------|
| [ICRC-1](#icrc-1-fungible-tokens) | Fungible token base standard | -- | Adopted |
| [ICRC-2](#icrc-2-approve-and-transfer-from) | Approve and transfer-from for fungible tokens | ICRC-1 | Adopted |
| [ICRC-3](#icrc-3-transaction-log) | Transaction log and block archive | ICRC-1 | Adopted |
| [ICRC-7](#icrc-7-non-fungible-tokens) | Non-fungible token (NFT) base standard | -- | Adopted |
| [ICRC-37](#icrc-37-nft-approvals) | Approve and transfer-from for NFTs | ICRC-7 | Adopted |
| [ICRC-21](#wallet-signer-standards) | Canister call consent messages | -- | Adopted |
| [ICRC-25](#wallet-signer-standards) | Signer interaction (permissions) | -- | Adopted |
| [ICRC-27](#wallet-signer-standards) | Account discovery | -- | Adopted |
| [ICRC-29](#wallet-signer-standards) | Window PostMessage transport | -- | Adopted |
| [ICRC-49](#wallet-signer-standards) | Call canister via signer | -- | Adopted |

## ICRC-1: Fungible tokens

ICRC-1 is the base standard for fungible tokens on ICP. It defines transfer, balance, and metadata interfaces. The standard intentionally excludes certain features — transaction notifications, block structure, and pre-signed transactions — which are provided by extension standards (ICRC-2, ICRC-3).

A ledger can report which extensions it supports through the `icrc1_supported_standards` endpoint.

### Account model

An ICRC-1 account consists of two parts:

- **`owner`** — a `Principal` identifying the account holder
- **`subaccount`** — an optional 32-byte `Blob` that defaults to all zeros when omitted

This means a single principal can control up to 2^256 distinct accounts by varying the subaccount.

```candid
type Account = record {
  owner : principal;
  subaccount : opt blob;
};
```

### Core methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `icrc1_transfer` | `(TransferArg) -> (variant { Ok : nat; Err : TransferError })` | Transfer tokens between accounts |
| `icrc1_balance_of` | `(Account) -> (nat) query` | Return the balance of an account |
| `icrc1_total_supply` | `() -> (nat) query` | Return the total token supply |
| `icrc1_metadata` | `() -> (vec record { text; Value }) query` | Return token metadata entries |
| `icrc1_name` | `() -> (text) query` | Return the token name |
| `icrc1_symbol` | `() -> (text) query` | Return the token symbol |
| `icrc1_decimals` | `() -> (nat8) query` | Return the number of decimals |
| `icrc1_fee` | `() -> (nat) query` | Return the default transfer fee |
| `icrc1_minting_account` | `() -> (opt Account) query` | Return the minting account |
| `icrc1_supported_standards` | `() -> (vec record { name : text; url : text }) query` | Return supported standard extensions |

### Transfer arguments

```candid
type TransferArg = record {
  from_subaccount : opt blob;
  to : Account;
  amount : nat;
  fee : opt nat;
  memo : opt blob;
  created_at_time : opt nat64;
};
```

Setting `created_at_time` enables deduplication — the ledger rejects duplicate transfers submitted within a 24-hour window. Without it, identical transfers both execute.

### Transfer errors

```candid
type TransferError = variant {
  BadFee : record { expected_fee : nat };
  BadBurn : record { min_burn_amount : nat };
  InsufficientFunds : record { balance : nat };
  TooOld;
  CreatedInFuture : record { ledger_time : nat64 };
  Duplicate : record { duplicate_of : nat };
  TemporarilyUnavailable;
  GenericError : record { error_code : nat; message : text };
};
```

### Metadata entries

| Key | Type | Example |
|-----|------|---------|
| `icrc1:symbol` | `Text` | `"ICP"` |
| `icrc1:name` | `Text` | `"Internet Computer"` |
| `icrc1:decimals` | `Nat` | `8` |
| `icrc1:fee` | `Nat` | `10000` |

For a few well-known ledger canister IDs and index canisters, see [Token ledgers](../guides/defi/token-ledgers.md#well-known-token-ledgers). For a broader overview of tokens on ICP, see the [ICP Dashboard token list](https://dashboard.internetcomputer.org/tokens).

[Read the full ICRC-1 standard](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1)

## ICRC-2: Approve and transfer-from

ICRC-2 extends ICRC-1 with an approve/transfer-from workflow, similar to ERC-20 allowances on Ethereum. An account owner delegates spending authority to a third party, who can then transfer tokens on the owner's behalf.

The workflow has two steps:

1. The account owner calls `icrc2_approve` to authorize a spender for up to X tokens.
2. The spender calls `icrc2_transfer_from` to move tokens from the owner's account. Multiple transfers are allowed as long as the total does not exceed the approved amount.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `icrc2_approve` | `(ApproveArg) -> (variant { Ok : nat; Err : ApproveError })` | Authorize a spender for a token amount |
| `icrc2_transfer_from` | `(TransferFromArg) -> (variant { Ok : nat; Err : TransferFromError })` | Transfer tokens on behalf of the owner |
| `icrc2_allowance` | `(AllowanceArg) -> (Allowance) query` | Query the remaining allowance for a spender |

### Approve arguments

```candid
type ApproveArg = record {
  from_subaccount : opt blob;
  spender : Account;
  amount : nat;
  expected_allowance : opt nat;
  expires_at : opt nat64;
  fee : opt nat;
  memo : opt blob;
  created_at_time : opt nat64;
};
```

The `expected_allowance` field provides protection against race conditions — the call fails if the current allowance does not match the expected value. The `expires_at` field sets a deadline (in nanoseconds since the Unix epoch) after which the approval is no longer valid.

### Approve errors

```candid
type ApproveError = variant {
  BadFee : record { expected_fee : nat };
  InsufficientFunds : record { balance : nat };
  AllowanceChanged : record { current_allowance : nat };
  Expired : record { ledger_time : nat64 };
  TooOld;
  CreatedInFuture : record { ledger_time : nat64 };
  Duplicate : record { duplicate_of : nat };
  TemporarilyUnavailable;
  GenericError : record { error_code : nat; message : text };
};
```

### Transfer-from arguments

```candid
type TransferFromArg = record {
  spender_subaccount : opt blob;
  from : Account;
  to : Account;
  amount : nat;
  fee : opt nat;
  memo : opt blob;
  created_at_time : opt nat64;
};
```

### Transfer-from errors

```candid
type TransferFromError = variant {
  BadFee : record { expected_fee : nat };
  BadBurn : record { min_burn_amount : nat };
  InsufficientFunds : record { balance : nat };
  InsufficientAllowance : record { allowance : nat };
  TooOld;
  CreatedInFuture : record { ledger_time : nat64 };
  Duplicate : record { duplicate_of : nat };
  TemporarilyUnavailable;
  GenericError : record { error_code : nat; message : text };
};
```

### Allowance query

```candid
type AllowanceArg = record {
  account : Account;
  spender : Account;
};

type Allowance = record {
  allowance : nat;
  expires_at : opt nat64;
};
```

### Common use cases

- **DEX integrations** — a DEX canister is approved to pull tokens from a user's account during a swap.
- **Subscription payments** — a service canister is approved for recurring token withdrawals.
- **Escrow** — an intermediary canister holds approval to release tokens when conditions are met.

ICP, ckBTC, and ckETH all implement ICRC-2.

[Read the full ICRC-2 standard](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-2)

## ICRC-3: Transaction log

ICRC-3 extends ICRC-1 with a standardized transaction log interface. It defines how ledgers expose their block history, enabling clients and index canisters to retrieve and verify transaction records.

### Archive model

Ledgers store recent blocks directly and move older blocks to **archive canisters** to manage memory. When fetching blocks, `icrc3_get_blocks` returns blocks the ledger holds directly plus callbacks to fetch archived blocks from the appropriate archive canister. Use `icrc3_get_archives` to discover all archive canisters and the block ranges they hold.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `icrc3_get_blocks` | `(vec record { start : nat; length : nat }) -> (GetBlocksResult) query` | Retrieve blocks by index range; returns callbacks for archived blocks |
| `icrc3_get_archives` | `(GetArchivesArgs) -> (vec record { canister_id; start; end }) query` | List archive canisters and the block ranges they hold |
| `icrc3_get_tip_certificate` | `() -> (opt DataCertificate) query` | Return a certificate for the last block hash and index |
| `icrc3_supported_block_types` | `() -> (vec record { block_type : text; url : text }) query` | List the block types the ledger produces |

### Block schema

ICRC-3 blocks use a generic `Value` representation that preserves all data for verification. Each block contains:

- **`phash`** — hash of the previous block (absent for the genesis block)
- **`btype`** — block type string (e.g., `"1xfer"` for ICRC-1 transfers, `"2approve"` for ICRC-2 approvals)
- **`ts`** — timestamp in nanoseconds
- **Transaction-specific fields** — vary by block type (e.g., `from`, `to`, `amt` for transfers)

### Adopted block types

Block type identifiers follow the naming convention `<icrc-number><operation>` (e.g., `1xfer` for ICRC-1 transfer). Anyone can define new block types for custom standards following this convention.

| Block type | Standard | Description |
|------------|----------|-------------|
| `1xfer` | ICRC-1 | Transfer |
| `1burn` | ICRC-1 | Burn |
| `1mint` | ICRC-1 | Mint |
| `2approve` | ICRC-2 | Approval |
| `2xfer` | ICRC-2 | Transfer-from |

### Proposed block types

The following block types are currently in the ICRC proposal process and not yet adopted:

| Block type(s) | Proposal | Status |
|---------------|----------|--------|
| ICRC-122 | [Ledger notification blocks](https://github.com/dfinity/ICRC/pull/125) | Proposed |
| ICRC-123 | [Batch call blocks](https://github.com/dfinity/ICRC/pull/134) | Proposed |
| ICRC-124 | [Canister management blocks](https://github.com/dfinity/ICRC/pull/135) | Proposed |
| ICRC-152 | [RWA compliance blocks](https://github.com/dfinity/ICRC/pull/156) | Proposed |
| ICRC-153 | [RWA regulatory blocks](https://github.com/dfinity/ICRC/pull/157) | Proposed |
| ICRC-154 | [RWA lifecycle blocks](https://github.com/dfinity/ICRC/pull/158) | Proposed |

[Read the full ICRC-3 standard](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-3)

## ICRC-7: Non-fungible tokens

ICRC-7 defines the base standard for non-fungible tokens (NFTs) on ICP. It can be used to create and manage NFT collections. Like ICRC-1 for fungible tokens, ICRC-7 is intentionally minimal and excludes transaction notifications, block structure, and pre-signed transactions — these can be added through extensions.

ICRC-7 uses the same account model as ICRC-1 (principal + optional 32-byte subaccount).

### Core methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `icrc7_collection_metadata` | `() -> (vec record { text; Value }) query` | Return collection metadata |
| `icrc7_name` | `() -> (text) query` | Return collection name |
| `icrc7_symbol` | `() -> (text) query` | Return collection symbol |
| `icrc7_total_supply` | `() -> (nat) query` | Return total number of tokens |
| `icrc7_supply_cap` | `() -> (opt nat) query` | Return maximum supply (if set) |
| `icrc7_token_metadata` | `(vec nat) -> (vec opt vec record { text; Value }) query` | Return metadata for specific token IDs |
| `icrc7_owner_of` | `(vec nat) -> (vec opt Account) query` | Return the owner of specific token IDs |
| `icrc7_balance_of` | `(vec Account) -> (vec nat) query` | Return the number of tokens owned by each account |
| `icrc7_tokens` | `(opt nat, opt nat) -> (vec nat) query` | List token IDs with pagination |
| `icrc7_tokens_of` | `(Account, opt nat, opt nat) -> (vec nat) query` | List token IDs owned by an account |
| `icrc7_transfer` | `(vec TransferArg) -> (vec opt TransferResult)` | Batch transfer tokens |

### Collection metadata

| Key | Type | Description |
|-----|------|-------------|
| `icrc7:symbol` | `Text` | Token symbol |
| `icrc7:name` | `Text` | Token name |
| `icrc7:description` | `Text` | Collection description |
| `icrc7:logo` | `Text` | URL of the collection logo |
| `icrc7:total_supply` | `Nat` | Current number of tokens |
| `icrc7:supply_cap` | `Nat` | Maximum number of tokens (optional) |

[Read the full ICRC-7 standard](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-7/ICRC-7.md)

## ICRC-37: NFT approvals

ICRC-37 extends ICRC-7 with an approval workflow for NFTs, analogous to how ICRC-2 extends ICRC-1 for fungible tokens. It adds support for creating approvals, revoking approvals, querying approval state, and executing transfers based on approvals.

A ledger that implements ICRC-37 must also implement all ICRC-7 methods. Support for ICRC-37 is optional for ICRC-7 ledgers.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `icrc37_approve_tokens` | `(vec ApproveTokenArg) -> (vec opt ApproveTokenResult)` | Approve a spender for specific token IDs |
| `icrc37_approve_collection` | `(vec ApproveCollectionArg) -> (vec opt ApproveCollectionResult)` | Approve a spender for all tokens in the collection |
| `icrc37_revoke_token_approvals` | `(vec RevokeTokenApprovalArg) -> (vec opt RevokeTokenApprovalResult)` | Revoke approvals for specific tokens |
| `icrc37_revoke_collection_approvals` | `(vec RevokeCollectionApprovalArg) -> (vec opt RevokeCollectionApprovalResult)` | Revoke collection-level approvals |
| `icrc37_is_approved` | `(vec IsApprovedArg) -> (vec bool) query` | Check if a spender is approved for specific tokens |
| `icrc37_get_token_approvals` | `(nat, opt nat, opt nat) -> (vec TokenApproval) query` | List approvals for a token ID |
| `icrc37_get_collection_approvals` | `(Account, opt nat, opt nat) -> (vec CollectionApproval) query` | List collection-level approvals |
| `icrc37_transfer_from` | `(vec TransferFromArg) -> (vec opt TransferFromResult)` | Transfer tokens using an approval |

### Additional metadata

| Key | Type | Description |
|-----|------|-------------|
| `icrc37:max_approvals_per_token_or_collection` | `Nat` | Maximum active approvals allowed per principal or token |
| `icrc37:max_revoke_approvals` | `Nat` | Maximum approvals that can be revoked in one call (optional) |

[Read the full ICRC-37 standard](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-37/ICRC-37.md)

## Wallet signer standards

The ICRC signer standards define how wallets interact with dApps on ICP. They use a popup-based model where every action requires explicit user approval, communicated via JSON-RPC 2.0 over `window.postMessage`.

| Standard | Purpose |
|----------|---------|
| **ICRC-21** | Canister call consent messages — enables canisters to provide human-readable descriptions of what a call will do, displayed to the user before signing |
| **ICRC-25** | Signer interaction standard — defines the permission lifecycle (`granted`, `denied`, `ask_on_use`) for signer methods |
| **ICRC-27** | Account discovery — allows dApps to request the list of accounts available in the wallet |
| **ICRC-29** | Window PostMessage transport — defines the communication channel between dApp and signer using `window.postMessage` |
| **ICRC-49** | Call canister — allows dApps to request the signer to execute a canister call on behalf of the user |

These standards are distinct from delegation-based authentication (such as Internet Identity). The signer model requires per-action user approval and does not create sessions or delegated identities.

For implementation details and code examples, see the [wallet integration guide](../guides/defi/wallet-integration.md).

## Next steps

- [Token ledgers guide](../guides/defi/token-ledgers.md) — deploy and interact with ICRC-1/ICRC-2 ledgers
- [Chain-key tokens guide](../guides/defi/chain-key-tokens.md) — work with ckBTC, ckETH, and other chain-key tokens
- [Wallet integration guide](../guides/defi/wallet-integration.md) — integrate wallet signer standards into your dApp
- [ICRC-1 standard specification](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1) — full specification on GitHub
- [ICRC-7 standard specification](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-7/ICRC-7.md) — full NFT specification on GitHub

<!-- Upstream: informed by dfinity/portal — docs/defi/token-standards/index.mdx, icrc-1.mdx, icrc-2.mdx, icrc-7.mdx, icrc-37.mdx; dfinity/icskills — skills/icrc-ledger/SKILL.md, skills/wallet-integration/SKILL.md -->
