---
title: "Chain-Key Tokens"
description: "Working with ckBTC, ckETH, and ckERC20 tokens on ICP"
sidebar:
  order: 3
doc_type: how-to
level: intermediate
icskills: [ckbtc]
last_verified: 2026-03-10
---

Chain-key tokens are ICP-native tokens backed 1:1 by assets on other blockchains. Unlike traditional wrapped tokens that rely on trusted intermediaries, chain-key tokens use ICP's threshold signing protocols to hold the underlying assets entirely onchain in smart contracts. There are no centralized bridges.

All chain-key tokens implement the ICRC-1 and ICRC-2 standards, so they integrate with any wallet, DEX, or canister that supports those standards.

## How chain-key tokens work

Each chain-key token consists of two core canisters:

- **Minter canister** -- Handles conversions between the native token (e.g., BTC) and the chain-key token (e.g., ckBTC). Minting creates new chain-key tokens when native tokens are deposited; burning destroys chain-key tokens when native tokens are retrieved.
- **Ledger canister** -- An ICRC-1/ICRC-2 ledger that tracks balances and transfers of the chain-key token on ICP.

Additional canisters (archive, index, checker) support transaction history, account indexing, and compliance checks.

### Deposit (mint) flow

1. The user requests a deposit address from the minter canister.
2. The user sends native tokens (e.g., BTC) to that address.
3. After sufficient confirmations, the minter mints an equivalent amount of chain-key tokens to the user's ICP account.

### Withdrawal (retrieve) flow

1. The user calls the minter to initiate a retrieval, specifying a destination address on the native chain.
2. The minter burns the chain-key tokens.
3. The minter sends the equivalent native tokens (minus fees) to the specified address using a threshold-signed transaction.

## ckBTC

Chain-key Bitcoin is backed 1:1 by BTC. Transactions finalize in seconds with fees of approximately 10 satoshis (less than $0.01).

### Mainnet canister IDs

| Canister | ID |
|----------|----|
| Minter | `mqygn-kiaaa-aaaar-qaadq-cai` |
| Ledger | `mxzaz-hqaaa-aaaar-qaada-cai` |
| Index | `n5wcd-faaaa-aaaar-qaaea-cai` |

### Test environment (ckTESTBTC)

| Canister | ID |
|----------|----|
| Minter | `ml52i-qqaaa-aaaar-qaaba-cai` |
| Ledger | `mc6ru-gyaaa-aaaar-qaaaq-cai` |

### Dashboard

- [ckBTC on the ICP Dashboard](https://dashboard.internetcomputer.org/bitcoin)
- [ckBTC minter dashboard](https://mqygn-kiaaa-aaaar-qaadq-cai.raw.icp0.io/dashboard)

## ckETH

Chain-key Ether is backed 1:1 by ETH. It uses ICP's threshold ECDSA signatures to manage an Ethereum address that holds the deposited ETH.

### Mainnet canister IDs

| Canister | ID |
|----------|----|
| Minter | `sv3dd-oaaaa-aaaar-qacoa-cai` |
| Ledger | `ss2fx-dyaaa-aaaar-qacoq-cai` |
| Index | `s3zol-vqaaa-aaaar-qacpa-cai` |

## ckERC20

ckERC20 tokens are chain-key versions of ERC-20 tokens on Ethereum. The ckERC20 minter is shared across all ckERC20 tokens; each token has its own ICRC ledger.

Common ckERC20 tokens include **ckUSDC**, **ckUSDT**, **ckLINK**, and **ckPEPE**.

### Querying available ckERC20 tokens

Call the ckETH minter to get the list of supported ckERC20 tokens:

```bash
icp canister call sv3dd-oaaaa-aaaar-qacoa-cai get_minter_info '()' -n ic
```

## Integrating chain-key tokens in your canister

Since all chain-key tokens are ICRC-1/ICRC-2 compliant, integration is straightforward. Call the token's ledger canister using standard ICRC methods.

### Check a balance

```bash
icp canister call mxzaz-hqaaa-aaaar-qaada-cai icrc1_balance_of \
  '(record { owner = principal "YOUR_PRINCIPAL" })' -n ic
```

### Transfer tokens

```bash
icp canister call mxzaz-hqaaa-aaaar-qaada-cai icrc1_transfer \
  '(record {
    to = record { owner = principal "RECIPIENT" };
    amount = 100_000;
  })' -n ic
```

### Approve and transfer_from (ICRC-2)

```bash
# Approve a spender
icp canister call mxzaz-hqaaa-aaaar-qaada-cai icrc2_approve \
  '(record {
    spender = record { owner = principal "SPENDER_PRINCIPAL" };
    amount = 500_000;
  })' -n ic
```

## Libraries

**JavaScript:**
- [`@icp-sdk/canisters`](https://js.icp.build/canisters/) -- Pre-built clients for ICRC ledgers, ckBTC minter, and other system canisters.

**Rust:**
- [icrc-ledger-types](https://crates.io/crates/icrc-ledger-types) -- Type definitions for ICRC ledger interaction.
- [icrc-ledger-client-cdk](https://crates.io/crates/icrc-ledger-client-cdk) -- CDK-compatible ledger client.

**Motoko:**
- [icrc2-types](https://mops.one/icrc2-types) -- ICRC-1/ICRC-2 type definitions.

## Source code

- [ckBTC minter](https://github.com/dfinity/ic/tree/master/rs/bitcoin/ckbtc/minter)
- [ICRC-1 ledger](https://github.com/dfinity/ic/tree/master/rs/ledger_suite/icrc1/ledger)
- [ICRC-1 index](https://github.com/dfinity/ic/tree/master/rs/ledger_suite/icrc1/index-ng)

## Further reading

- [Token standards](/reference/token-standards/) -- ICRC-1, ICRC-2, ICRC-7, ICRC-37.
- [Token ledgers](/guides/defi/token-ledgers/) -- Deploying and querying ledger canisters.
