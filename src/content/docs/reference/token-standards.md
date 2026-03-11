---
title: "Token Standards"
description: "ICRC-1, ICRC-2, ICRC-7, and ICRC-37 token standards on the Internet Computer"
sidebar:
  order: 1
doc_type: reference
level: intermediate
icskills: [icrc-ledger]
last_verified: 2026-03-10
---

Tokens on ICP follow the **ICRC** (Internet Computer Request for Comments) family of standards. ICRC standards are proposed by the community working group and adopted through NNS governance proposals.

The ICP network's native token has its own ledger standard. All other tokens typically implement one or more ICRC standards.

## How standards relate

| Standard | Type | Purpose |
|----------|------|---------|
| ICRC-1 | Fungible token (base) | Transfer, balance, metadata |
| ICRC-2 | Fungible token (extension) | Approve and transfer_from |
| ICRC-3 | Transaction log | Standardized block structure |
| ICRC-7 | Non-fungible token (base) | NFT transfer, ownership, metadata |
| ICRC-37 | Non-fungible token (extension) | NFT approve and transfer_from |

ICRC-2 extends ICRC-1. ICRC-37 extends ICRC-7. A ledger can support multiple standards simultaneously, and the `icrc1_supported_standards` endpoint returns the list of all supported extensions.

## ICRC-1: Fungible token standard

ICRC-1 is the base standard for fungible tokens. It defines the minimal interface a token ledger must implement.

### Key methods

- `icrc1_transfer` -- Transfer tokens between accounts.
- `icrc1_balance_of` -- Query the balance of an account.
- `icrc1_total_supply` -- Query the total token supply.
- `icrc1_metadata` -- Query token metadata (name, symbol, decimals, fee).
- `icrc1_supported_standards` -- List supported ICRC extensions.

### Metadata fields

- `icrc1:symbol` -- Currency code (e.g., `"XTKN"`).
- `icrc1:name` -- Token name (e.g., `"Test Token"`).
- `icrc1:decimals` -- Number of decimal places (e.g., `8`).
- `icrc1:fee` -- Default transfer fee (e.g., `10_000`).

### Accounts

All ICRC tokens use the `Account` type: a pair of `(principal, subaccount)`. A principal can have multiple accounts, each identified by a 32-byte subaccount. Omitting the subaccount defaults to the all-zeros subaccount.

[Full ICRC-1 specification](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-1)

## ICRC-2: Approve and transfer_from

ICRC-2 extends ICRC-1 with an approval workflow, similar to ERC-20's `approve`/`transferFrom` pattern on Ethereum. This enables canisters and third parties to spend tokens on behalf of an account owner.

### Workflow

1. The account owner calls `icrc2_approve` to allow a spender to transfer up to X tokens.
2. The spender calls `icrc2_transfer_from` to transfer tokens from the owner's account. Multiple transfers are allowed as long as the total does not exceed the approved amount.

### Key methods

- `icrc2_approve` -- Authorize a spender for a given amount.
- `icrc2_allowance` -- Query the current allowance for a spender.
- `icrc2_transfer_from` -- Transfer tokens on behalf of the owner.

ICRC-2 is required for DeFi operations like token swaps, escrow, and subscription payments where a canister needs to pull tokens from a user's account.

[Full ICRC-2 specification](https://github.com/dfinity/ICRC-1/tree/main/standards/ICRC-2)

## ICRC-7: Non-fungible token (NFT) standard

ICRC-7 defines the base standard for non-fungible tokens (NFT collections) on ICP. It is the NFT equivalent of ICRC-1.

### Key methods

- `icrc7_transfer` -- Transfer one or more NFTs.
- `icrc7_balance_of` -- Query how many NFTs an account owns.
- `icrc7_owner_of` -- Query the owner of a specific token.
- `icrc7_tokens_of` -- List tokens owned by an account.
- `icrc7_collection_metadata` -- Query collection-level metadata.

### Metadata fields

- `icrc7:symbol` -- Collection symbol.
- `icrc7:name` -- Collection name.
- `icrc7:description` -- Collection description.
- `icrc7:total_supply` -- Current number of tokens.
- `icrc7:supply_cap` -- Optional maximum supply.

ICRC-7 uses the same `Account` model as ICRC-1.

[Full ICRC-7 specification](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-7/ICRC-7.md)

## ICRC-37: NFT approve and transfer_from

ICRC-37 extends ICRC-7 with approval functionality, enabling delegated NFT transfers. It is the NFT equivalent of ICRC-2.

### Key methods

- `icrc37_approve_tokens` -- Approve a spender for specific tokens.
- `icrc37_approve_collection` -- Approve a spender for the entire collection.
- `icrc37_transfer_from` -- Transfer NFTs on behalf of the owner.
- `icrc37_revoke_token_approvals` -- Revoke approvals for specific tokens.
- `icrc37_revoke_collection_approvals` -- Revoke collection-level approvals.

### Metadata fields

- `icrc37:max_approvals_per_token_or_collection` -- Maximum active approvals per token or principal.
- `icrc37:max_revoke_approvals` -- Maximum approvals that can be revoked in one call.

Ledgers that implement ICRC-37 must also implement all of ICRC-7.

[Full ICRC-37 specification](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-37/ICRC-37.md)

## Examples

- [ICRC-1 token transfer example (Motoko)](https://github.com/dfinity/examples/tree/master/motoko/token_transfer)
- [ICRC-2 token swap example (Motoko)](https://github.com/dfinity/examples/tree/master/motoko/icrc2-swap)
- [ICRC-2 transfer_from example (Motoko)](https://github.com/dfinity/examples/tree/master/motoko/token_transfer_from)

## Further reading

- [ICRC working group on GitHub](https://github.com/dfinity/ICRC)
- [Token ledgers guide](/guides/defi/token-ledgers/) -- Deploying and interacting with ledger canisters.
