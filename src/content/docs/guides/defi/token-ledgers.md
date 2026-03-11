---
title: "Token Ledgers"
description: "Setting up and using ICP and ICRC ledger canisters"
sidebar:
  order: 2
doc_type: how-to
level: intermediate
icskills: [icrc-ledger]
last_verified: 2026-03-10
---

Every token on ICP has a dedicated **ledger canister** that records balances and transactions. This guide covers deploying ledger canisters for local development and interacting with them.

## The ICP ledger

The ICP ledger is the system canister that manages the network's native ICP token.

**Mainnet canister ID:** `ryjl3-tyaaa-aaaaa-aaaba-cai`

You can query it directly:

```bash
icp canister call ryjl3-tyaaa-aaaaa-aaaba-cai icrc1_balance_of \
  '(record { owner = principal "YOUR_PRINCIPAL" })' -n ic
```

The ICP ledger supports both its legacy interface and the ICRC-1/ICRC-2 standards.

## ICRC ledger canisters

Custom fungible tokens use the ICRC ledger reference implementation. Deploying a new token is synonymous with deploying a new ledger canister.

Each ICRC ledger holds **blocks**, where each block contains a single transaction: a mint, transfer, burn, or approval.

### Accounts

All ICRC tokens use the `Account` type: a `(principal, subaccount)` pair. A principal can own multiple accounts, each identified by a 32-byte subaccount. Omitting the subaccount defaults to all zeros.

## Deploying a local ICRC ledger

For local development, you need a locally deployed ledger since you cannot interact with mainnet ledgers from a local replica.

### Step 1: Get the ledger Wasm and Candid files

Find the latest release at [ledger-suite-icrc releases](https://github.com/dfinity/ic/releases?q=%22ledger-suite-icrc%22).

Download the files:

```bash
curl -o download_latest_icrc1_ledger.sh \
  "https://raw.githubusercontent.com/dfinity/ic/69988ae40e4cc0db7ef758da7dd5c0606075e926/rs/rosetta-api/scripts/download_latest_icrc1_ledger.sh"
chmod +x download_latest_icrc1_ledger.sh
./download_latest_icrc1_ledger.sh
```

### Step 2: Configure your project

Add the ledger canister to your `icp.yaml`:

```yaml
canisters:
  - name: icrc1_ledger
    build:
      steps:
        - type: pre-built
          url: icrc1_ledger.wasm.gz
    init_args: "(...)"  # see Step 3 below
```

### Step 3: Set init arguments

Configure the ledger's initial state. Key parameters:

- **TOKEN_NAME** -- Display name of the token.
- **TOKEN_SYMBOL** -- Ticker symbol.
- **TRANSFER_FEE** -- Fee charged per transfer.
- **MINTER** -- Principal that can mint and burn tokens.
- **PRE_MINTED_TOKENS** -- Initial token supply for a specific account.
- **FEATURE_FLAGS** -- Set `icrc2 = true` to enable ICRC-2 support.

Example init argument:

```candid
(variant { Init = record {
  token_symbol = "MYTKN";
  token_name = "My Token";
  minting_account = record { owner = principal "YOUR_PRINCIPAL" };
  transfer_fee = 10_000;
  metadata = vec {};
  feature_flags = opt record { icrc2 = true };
  initial_balances = vec {
    record { record { owner = principal "YOUR_PRINCIPAL" }; 1_000_000_000 }
  };
  archive_options = record {
    num_blocks_to_archive = 2000;
    trigger_threshold = 1000;
    controller_id = principal "YOUR_PRINCIPAL";
    cycles_for_archive_creation = opt 10_000_000_000_000;
  };
}})
```

### Step 4: Deploy

```bash
icp network start -d
icp deploy icrc1_ledger
```

## Querying balances

Using the CLI:

```bash
icp canister call icrc1_ledger icrc1_balance_of \
  '(record { owner = principal "TARGET_PRINCIPAL" })'
```

Using Motoko:

```motoko
import Ledger "canister:icrc1_ledger";

let balance = await Ledger.icrc1_balance_of({
  owner = targetPrincipal;
  subaccount = null;
});
```

Using Rust:

```rust
use icrc_ledger_types::icrc1::account::Account;

let balance = ic_cdk::call::<(Account,), (candid::Nat,)>(
    ledger_id,
    "icrc1_balance_of",
    (Account { owner: target, subaccount: None },),
).await.unwrap().0;
```

## Transferring tokens

Using the CLI:

```bash
icp canister call icrc1_ledger icrc1_transfer \
  '(record {
    to = record { owner = principal "RECIPIENT_PRINCIPAL" };
    amount = 1_000_000;
  })'
```

Using Motoko:

```motoko
let result = await Ledger.icrc1_transfer({
  to = { owner = recipient; subaccount = null };
  fee = null;
  memo = null;
  from_subaccount = null;
  created_at_time = null;
  amount = 1_000_000;
});
```

## Index canisters

Index canisters sync ledger transactions and index them by account, making it efficient to query transaction history for a specific account. Deploy an index canister alongside your ledger for any production token.

The index canister Wasm is available from the same [ledger-suite-icrc releases](https://github.com/dfinity/ic/releases?q=%22ledger-suite-icrc%22).

## ICRC ledger test suite

If you are building a custom ICRC-1 ledger, the [ICRC-1 test suite](https://github.com/dfinity/ICRC-1/tree/main/test) can validate your implementation against the specification.

## Further reading

- [Token standards](/reference/token-standards/) -- ICRC-1, ICRC-2, ICRC-7, ICRC-37.
- [Chain-key tokens](/guides/defi/chain-key-tokens/) -- ckBTC, ckETH, ckERC20.
