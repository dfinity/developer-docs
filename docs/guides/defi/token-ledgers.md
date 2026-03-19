---
title: "Token Ledgers"
description: "Transfer ICP and ICRC-1/ICRC-2 tokens from canisters and frontends"
sidebar:
  order: 1
icskills: [icrc-ledger, ckbtc]
---

Every token on ICP — ICP, ckBTC, ckETH, and custom tokens — is managed by a **ledger canister** that implements the ICRC token standards. Because all ledgers share the same interface, code that works with the ICP ledger also works with ckBTC, ckETH, or any ICRC-1 compliant token. You only need to swap the canister ID and fee.

This guide covers the most common token operations: transfers, approvals, subaccounts, and local test ledger setup. For the formal standard specifications, see [Token standards](../../reference/token-standards.md).

## Well-known token ledgers

The table below lists a few well-known ledgers used throughout this guide. Many more tokens exist on ICP — see the [ICP Dashboard token list](https://dashboard.internetcomputer.org/tokens) for a broader overview. Anyone can deploy an ICRC-1 compliant ledger.

| Token | Ledger canister ID | Decimals |
|-------|-------------------|----------|
| ICP | `ryjl3-tyaaa-aaaaa-aaaba-cai` | 8 |
| ckBTC | `mxzaz-hqaaa-aaaar-qaada-cai` | 8 |
| ckETH | `ss2fx-dyaaa-aaaar-qacoq-cai` | 18 |

> Fees can change at any time. Always call `icrc1_fee` to get the current fee rather than hardcoding values.

Index canisters (for transaction history):

| Token | Index canister ID |
|-------|------------------|
| ICP | `qhbym-qaaaa-aaaaa-aaafq-cai` |
| ckBTC | `n5wcd-faaaa-aaaar-qaaea-cai` |
| ckETH | `s3zol-vqaaa-aaaar-qacpa-cai` |

All of these ledgers are ICRC-1 and ICRC-2 compatible. For chain-key token specifics (minting, deposits, withdrawals), see [Chain-key tokens](chain-key-tokens.md).

## Transferring tokens (ICRC-1)

The `icrc1_transfer` function sends tokens from the calling canister's account to a destination account. Every ICRC-1 ledger uses the same `Account` type:

```candid
{ owner: Principal; subaccount: ?Blob }  // 32-byte subaccount, null = default
```

### Rust

Add these dependencies to `Cargo.toml`:

```toml
[dependencies]
ic-cdk = "0.19"
candid = "0.10"
icrc-ledger-types = "0.1"
```

```rust
use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc1::transfer::{TransferArg, TransferError};
use ic_cdk::update;
use ic_cdk::call::Call;

const ICP_LEDGER: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const ICP_FEE: u64 = 10_000;

fn ledger_id() -> Principal {
    Principal::from_text(ICP_LEDGER).unwrap()
}

/// Transfer tokens from this canister's default account.
/// WARNING: Add access control in production.
#[update]
async fn send_tokens(to: Principal, amount: Nat) -> Result<Nat, String> {
    let transfer_arg = TransferArg {
        from_subaccount: None,
        to: Account { owner: to, subaccount: None },
        amount,
        fee: Some(Nat::from(ICP_FEE)),
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let (result,): (Result<Nat, TransferError>,) =
        Call::unbounded_wait(ledger_id(), "icrc1_transfer")
            .with_arg(transfer_arg)
            .await
            .map_err(|e| format!("Call failed: {:?}", e))?
            .candid_tuple()
            .map_err(|e| format!("Decode failed: {:?}", e))?;

    match result {
        Ok(block_index) => Ok(block_index),
        Err(TransferError::InsufficientFunds { balance }) => {
            Err(format!("Insufficient funds. Balance: {}", balance))
        }
        Err(TransferError::BadFee { expected_fee }) => {
            Err(format!("Wrong fee. Expected: {}", expected_fee))
        }
        Err(e) => Err(format!("Transfer error: {:?}", e)),
    }
}
```

### Motoko

```motoko
import Principal "mo:core/Principal";
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

persistent actor {

  type Account = { owner : Principal; subaccount : ?Blob };

  type TransferArg = {
    from_subaccount : ?Blob;
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };

  type TransferError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  transient let icpLedger = actor ("ryjl3-tyaaa-aaaaa-aaaba-cai") : actor {
    icrc1_transfer : shared (TransferArg) -> async { #Ok : Nat; #Err : TransferError };
  };

  /// Transfer tokens from this canister's default account.
  /// WARNING: Add access control in production.
  public func sendTokens(to : Principal, amount : Nat) : async Nat {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let result = await icpLedger.icrc1_transfer({
      from_subaccount = null;
      to = { owner = to; subaccount = null };
      amount = amount;
      fee = ?10_000;
      memo = null;
      created_at_time = ?now;
    });
    switch (result) {
      case (#Ok(blockIndex)) { blockIndex };
      case (#Err(#InsufficientFunds({ balance }))) {
        Runtime.trap("Insufficient funds. Balance: " # Nat.toText(balance))
      };
      case (#Err(#BadFee({ expected_fee }))) {
        Runtime.trap("Wrong fee. Expected: " # Nat.toText(expected_fee))
      };
      case (#Err(_)) { Runtime.trap("Transfer failed") };
    }
  };
}
```

### JavaScript

For frontend token operations, use the `@icp-sdk/canisters` package. See the [JS SDK documentation](https://js.icp.build) for setup and usage.

### Fee handling

Always set the `fee` field explicitly. If you pass a fee that does not match the ledger's current fee, the call returns a `BadFee` error with the `expected_fee` value. You can query the current fee at runtime:

```bash
icp canister call ryjl3-tyaaa-aaaaa-aaaba-cai icrc1_fee '()' -e ic
```

Always set `created_at_time` to enable deduplication. Without it, two identical transfers submitted within 24 hours both execute.

### Checking balances

Query an account's balance with `icrc1_balance_of`. This is a query call — fast and free.

#### Rust

```rust
use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use ic_cdk::call::Call;

async fn get_balance(ledger: Principal, owner: Principal) -> Result<Nat, String> {
    let account = Account { owner, subaccount: None };

    let (balance,): (Nat,) =
        Call::unbounded_wait(ledger, "icrc1_balance_of")
            .with_arg(account)
            .await
            .map_err(|e| format!("Call failed: {:?}", e))?
            .candid_tuple()
            .map_err(|e| format!("Decode failed: {:?}", e))?;

    Ok(balance)
}
```

#### Motoko

```motoko
persistent actor {

  type Account = { owner : Principal; subaccount : ?Blob };

  transient let icpLedger = actor ("ryjl3-tyaaa-aaaaa-aaaba-cai") : actor {
    icrc1_balance_of : shared query (Account) -> async Nat;
  };

  public func getBalance(owner : Principal) : async Nat {
    await icpLedger.icrc1_balance_of({ owner = owner; subaccount = null })
  };
}
```

## Approve and transfer-from (ICRC-2)

ICRC-2 adds an approve/transferFrom pattern, similar to ERC-20 on Ethereum. The token owner first approves a spender for a certain amount, then the spender calls `icrc2_transfer_from` to move tokens. This is a two-step flow — calling `transfer_from` without a prior approval fails with `InsufficientAllowance`.

**When to use:** DEX swaps, payment processors, subscription services, or any case where a canister needs to pull tokens from a user's account.

### Rust

```rust
use candid::{Nat, Principal};
use icrc_ledger_types::icrc1::account::Account;
use icrc_ledger_types::icrc2::approve::{ApproveArgs, ApproveError};
use icrc_ledger_types::icrc2::transfer_from::{TransferFromArgs, TransferFromError};
use ic_cdk::update;
use ic_cdk::call::Call;

const ICP_LEDGER: &str = "ryjl3-tyaaa-aaaaa-aaaba-cai";
const ICP_FEE: u64 = 10_000;

fn ledger_id() -> Principal {
    Principal::from_text(ICP_LEDGER).unwrap()
}

#[update]
async fn approve_spender(spender: Principal, amount: Nat) -> Result<Nat, String> {
    let args = ApproveArgs {
        from_subaccount: None,
        spender: Account { owner: spender, subaccount: None },
        amount,
        expected_allowance: None,
        expires_at: None,
        fee: Some(Nat::from(ICP_FEE)),
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let (result,): (Result<Nat, ApproveError>,) =
        Call::unbounded_wait(ledger_id(), "icrc2_approve")
            .with_arg(args)
            .await
            .map_err(|e| format!("Call failed: {:?}", e))?
            .candid_tuple()
            .map_err(|e| format!("Decode failed: {:?}", e))?;

    result.map_err(|e| format!("Approve error: {:?}", e))
}

/// WARNING: Add access control in production.
#[update]
async fn transfer_from(
    from: Principal, to: Principal, amount: Nat,
) -> Result<Nat, String> {
    let args = TransferFromArgs {
        spender_subaccount: None,
        from: Account { owner: from, subaccount: None },
        to: Account { owner: to, subaccount: None },
        amount,
        fee: Some(Nat::from(ICP_FEE)),
        memo: None,
        created_at_time: Some(ic_cdk::api::time()),
    };

    let (result,): (Result<Nat, TransferFromError>,) =
        Call::unbounded_wait(ledger_id(), "icrc2_transfer_from")
            .with_arg(args)
            .await
            .map_err(|e| format!("Call failed: {:?}", e))?
            .candid_tuple()
            .map_err(|e| format!("Decode failed: {:?}", e))?;

    result.map_err(|e| format!("TransferFrom error: {:?}", e))
}
```

### Motoko

```motoko
import Nat "mo:core/Nat";
import Nat64 "mo:core/Nat64";
import Int "mo:core/Int";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";

persistent actor {

  type Account = { owner : Principal; subaccount : ?Blob };

  type ApproveArg = {
    from_subaccount : ?Blob;
    spender : Account;
    amount : Nat;
    expected_allowance : ?Nat;
    expires_at : ?Nat64;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };

  type ApproveError = {
    #BadFee : { expected_fee : Nat };
    #InsufficientFunds : { balance : Nat };
    #AllowanceChanged : { current_allowance : Nat };
    #Expired : { ledger_time : Nat64 };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  type TransferFromArg = {
    spender_subaccount : ?Blob;
    from : Account;
    to : Account;
    amount : Nat;
    fee : ?Nat;
    memo : ?Blob;
    created_at_time : ?Nat64;
  };

  type TransferFromError = {
    #BadFee : { expected_fee : Nat };
    #BadBurn : { min_burn_amount : Nat };
    #InsufficientFunds : { balance : Nat };
    #InsufficientAllowance : { allowance : Nat };
    #TooOld;
    #CreatedInFuture : { ledger_time : Nat64 };
    #Duplicate : { duplicate_of : Nat };
    #TemporarilyUnavailable;
    #GenericError : { error_code : Nat; message : Text };
  };

  transient let icpLedger = actor ("ryjl3-tyaaa-aaaaa-aaaba-cai") : actor {
    icrc2_approve : shared (ApproveArg) -> async { #Ok : Nat; #Err : ApproveError };
    icrc2_transfer_from : shared (TransferFromArg) -> async { #Ok : Nat; #Err : TransferFromError };
  };

  public func approveSpender(spender : Principal, amount : Nat) : async Nat {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let result = await icpLedger.icrc2_approve({
      from_subaccount = null;
      spender = { owner = spender; subaccount = null };
      amount = amount;
      expected_allowance = null;
      expires_at = null;
      fee = ?10_000;
      memo = null;
      created_at_time = ?now;
    });
    switch (result) {
      case (#Ok(blockIndex)) { blockIndex };
      case (#Err(_)) { Runtime.trap("Approve failed") };
    }
  };

  /// WARNING: Add access control in production.
  public func transferFrom(from : Principal, to : Principal, amount : Nat) : async Nat {
    let now = Nat64.fromNat(Int.abs(Time.now()));
    let result = await icpLedger.icrc2_transfer_from({
      spender_subaccount = null;
      from = { owner = from; subaccount = null };
      to = { owner = to; subaccount = null };
      amount = amount;
      fee = ?10_000;
      memo = null;
      created_at_time = ?now;
    });
    switch (result) {
      case (#Ok(blockIndex)) { blockIndex };
      case (#Err(#InsufficientAllowance({ allowance }))) {
        Runtime.trap("Insufficient allowance: " # Nat.toText(allowance))
      };
      case (#Err(_)) { Runtime.trap("TransferFrom failed") };
    }
  };
}
```

## Working with subaccounts

An ICRC-1 account is a principal plus an optional 32-byte subaccount. Subaccounts let a single canister manage many logical accounts — useful for deposit flows where each user gets a unique deposit address.

To derive a subaccount from a principal (a common pattern for deposit accounts):

### Rust

```rust
use candid::Principal;
use icrc_ledger_types::icrc1::account::Account;

/// Derive a deposit subaccount from a user's principal.
/// Pads the principal bytes into a 32-byte array.
fn deposit_account(canister: Principal, user: Principal) -> Account {
    let mut subaccount = [0u8; 32];
    let principal_bytes = user.as_slice();
    subaccount[0] = principal_bytes.len() as u8;
    subaccount[1..1 + principal_bytes.len()].copy_from_slice(principal_bytes);
    Account {
        owner: canister,
        subaccount: Some(subaccount),
    }
}
```

### Motoko

```motoko
import Principal "mo:core/Principal";
import Blob "mo:core/Blob";
import Array "mo:core/Array";
import Nat8 "mo:core/Nat8";

type Account = { owner : Principal; subaccount : ?Blob };

/// Derive a deposit subaccount from a user's principal.
func depositAccount(canister : Principal, user : Principal) : Account {
  let bytes = Blob.toArray(Principal.toBlob(user));
  let subaccount = Array.tabulate<Nat8>(32, func(i) {
    if (i == 0) { Nat8.fromNat(bytes.size()) }
    else if (i <= bytes.size()) { bytes[i - 1] }
    else { 0 }
  });
  { owner = canister; subaccount = ?Blob.fromArray(subaccount) }
};
```

A typical deposit flow:

1. Generate a unique deposit subaccount for each user (derived from their principal).
2. The user transfers tokens to your canister's subaccount address.
3. Your canister checks the subaccount balance and credits the user internally.
4. Your canister sweeps tokens from the subaccount to its default account.

## NFTs (ICRC-7 and ICRC-37)

ICRC-7 is the non-fungible token standard on ICP. It follows the same account model as ICRC-1 and defines operations for NFT collections: querying ownership, metadata, and transferring individual tokens by ID.

ICRC-37 extends ICRC-7 with an approval workflow (similar to how ICRC-2 extends ICRC-1). It adds `approve`, `revoke_approval`, and `transfer_from` for NFTs.

Key operations:

- **`icrc7_transfer`** — transfer one or more NFTs by token ID
- **`icrc7_balance_of`** — count how many NFTs an account owns
- **`icrc7_owner_of`** — look up the owner of specific token IDs
- **`icrc7_tokens_of`** — list token IDs owned by an account
- **`icrc37_approve_tokens`** — approve a spender for specific NFTs (ICRC-37)
- **`icrc37_transfer_from`** — transfer NFTs using a prior approval (ICRC-37)

For a complete working example with minting, transferring, and a frontend, see the [nft-creator example](https://github.com/dfinity/examples/tree/master/motoko/nft-creator). For the full standard specifications, see [ICRC-7](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-7/ICRC-7.md) and [ICRC-37](https://github.com/dfinity/ICRC/blob/main/ICRCs/ICRC-37/ICRC-37.md).

## Local test ledger

To test token operations locally, deploy an ICRC-1 ledger on your local replica. First, find the latest release tag from the [ledger-suite-icrc releases](https://github.com/dfinity/ic/releases?q=%22ledger-suite-icrc%22&expanded=false), then add the ledger to your `icp.yaml`:

```yaml
canisters:
  - name: icrc1_ledger
    build:
      steps:
        - type: pre-built
          url: "https://github.com/dfinity/ic/releases/download/<RELEASE_TAG>/ic-icrc1-ledger.wasm.gz"
    init_args:
      path: icrc1_ledger_init.args
```

Create `icrc1_ledger_init.args` with your principal. Replace `YOUR_PRINCIPAL` with the output of `icp identity principal`:

> Shell substitutions like `$(icp identity principal)` do **not** expand inside argument files. Paste the literal principal string.

```
(variant { Init = record {
  token_symbol = "TEST";
  token_name = "Test Token";
  minting_account = record { owner = principal "YOUR_PRINCIPAL" };
  transfer_fee = 10_000 : nat;
  metadata = vec {};
  initial_balances = vec {
    record {
      record { owner = principal "YOUR_PRINCIPAL" };
      100_000_000_000 : nat;
    };
  };
  archive_options = record {
    num_blocks_to_archive = 1000 : nat64;
    trigger_threshold = 2000 : nat64;
    controller_id = principal "YOUR_PRINCIPAL";
  };
  feature_flags = opt record { icrc2 = true };
}})
```

Deploy and verify:

```bash
icp network start -d
icp deploy icrc1_ledger
icp canister call icrc1_ledger icrc1_symbol '()'
# Expected: ("TEST")
```

Test a transfer:

```bash
icp identity new test-recipient --storage plaintext 2>/dev/null
RECIPIENT=$(icp identity principal --identity test-recipient)

icp canister call icrc1_ledger icrc1_transfer \
  "(record {
    to = record { owner = principal \"$RECIPIENT\"; subaccount = null };
    amount = 1_000_000 : nat;
    fee = opt (10_000 : nat);
    memo = null;
    from_subaccount = null;
    created_at_time = null;
  })"
# Expected: (variant { Ok = 0 : nat })
```

## Next steps

- [Token standards](../../reference/token-standards.md) — formal ICRC-1, ICRC-2, ICRC-7, and ICRC-37 specifications
- [Chain-key tokens](chain-key-tokens.md) — working with ckBTC and ckETH (minting, deposits, withdrawals)
- [Wallet integration](wallet-integration.md) — connecting wallets to your dapp
- [Onchain calls](../canister-calls/onchain-calls.md) — how inter-canister calls work (ledger calls are inter-canister calls)

<!-- Upstream: informed by dfinity/portal docs/defi/token-standards/, docs/defi/token-integrations/ — icrc-1.mdx, icrc-2.mdx, icrc-7.mdx, icrc-37.mdx; dfinity/icskills skills/icrc-ledger/SKILL.md; dfinity/examples motoko/nft-creator -->
