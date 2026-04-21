---
title: "Protocol Canisters"
description: "Bitcoin canister, ckBTC minter, ckETH minter, EVM RPC canister, exchange rate canister, and other protocol-level canisters with their canister IDs and interfaces"
sidebar:
  order: 7
---

Protocol canisters implement platform-level features on the Internet Computer. Unlike [system canisters](system-canisters.md), which govern the network itself, protocol canisters provide infrastructure that applications build on: Bitcoin integration, Ethereum integration, chain-key tokens, and exchange rates. They are controlled by the NNS and run on dedicated system subnets.

## Bitcoin canisters

The Bitcoin integration canisters connect ICP to the Bitcoin network. They track the Bitcoin UTXO set and expose an API that other canisters use to read Bitcoin state and submit transactions.

> Call the Bitcoin canisters directly using the canister IDs below for better performance and to avoid potential future changes to the management canister Bitcoin API.

### Bitcoin mainnet

| Field | Value |
|---|---|
| Canister ID | [`ghsi2-tqaaa-aaaan-aaaca-cai`](https://dashboard.internetcomputer.org/canister/ghsi2-tqaaa-aaaan-aaaca-cai) |
| Subnet | [`w4rem-dv5e3-widiz-wbpea-kbttk-mnzfm-tzrc7-svcj3-kbxyb-zamch-hqe`](https://dashboard.internetcomputer.org/subnet/w4rem-dv5e3-widiz-wbpea-kbttk-mnzfm-tzrc7-svcj3-kbxyb-zamch-hqe) |
| Specification | [Bitcoin canister interface spec](https://github.com/dfinity/bitcoin-canister/blob/master/INTERFACE_SPECIFICATION.md) |

### Bitcoin testnet (v4)

| Field | Value |
|---|---|
| Canister ID | [`g4xu7-jiaaa-aaaan-aaaaq-cai`](https://dashboard.internetcomputer.org/canister/g4xu7-jiaaa-aaaan-aaaaq-cai) |
| Subnet | [`w4rem-dv5e3-widiz-wbpea-kbttk-mnzfm-tzrc7-svcj3-kbxyb-zamch-hqe`](https://dashboard.internetcomputer.org/subnet/w4rem-dv5e3-widiz-wbpea-kbttk-mnzfm-tzrc7-svcj3-kbxyb-zamch-hqe) |
| Specification | [Bitcoin canister interface spec](https://github.com/dfinity/bitcoin-canister/blob/master/INTERFACE_SPECIFICATION.md) |

### Key endpoints

The Bitcoin canisters expose endpoints for reading UTXOs, balances, and block headers, and for submitting transactions. These mirror the management canister Bitcoin API:

- `bitcoin_get_utxos` — returns UTXOs for a Bitcoin address
- `bitcoin_get_balance` — returns the balance of a Bitcoin address in satoshi
- `bitcoin_send_transaction` — submits a signed Bitcoin transaction
- `bitcoin_get_current_fee_percentiles` — returns fee percentiles in millisatoshi/vbyte
- `bitcoin_get_block_headers` — returns block headers for a range of heights

For integration patterns, see the [Bitcoin guide](../guides/chain-fusion/bitcoin.md).

## ckBTC canisters

Chain-key Bitcoin (ckBTC) is a 1:1 BTC-backed ICRC-2 token native to ICP. The ckBTC minter holds real BTC and mints or burns ckBTC tokens. Transfers settle in seconds with a 10 satoshi fee.

### Mainnet canister IDs

| Canister | ID |
|---|---|
| ckBTC Ledger | [`mxzaz-hqaaa-aaaar-qaada-cai`](https://dashboard.internetcomputer.org/canister/mxzaz-hqaaa-aaaar-qaada-cai) |
| ckBTC Minter | [`mqygn-kiaaa-aaaar-qaadq-cai`](https://dashboard.internetcomputer.org/canister/mqygn-kiaaa-aaaar-qaadq-cai) |
| ckBTC Index | [`n5wcd-faaaa-aaaar-qaaea-cai`](https://dashboard.internetcomputer.org/canister/n5wcd-faaaa-aaaar-qaaea-cai) |

### Bitcoin Testnet4 canister IDs

| Canister | ID |
|---|---|
| ckBTC Ledger (testnet4) | [`mc6ru-gyaaa-aaaar-qaaaq-cai`](https://dashboard.internetcomputer.org/canister/mc6ru-gyaaa-aaaar-qaaaq-cai) |
| ckBTC Minter (testnet4) | [`ml52i-qqaaa-aaaar-qaaba-cai`](https://dashboard.internetcomputer.org/canister/ml52i-qqaaa-aaaar-qaaba-cai) |
| ckBTC Index (testnet4) | [`mm444-5iaaa-aaaar-qaabq-cai`](https://dashboard.internetcomputer.org/canister/mm444-5iaaa-aaaar-qaabq-cai) |

### ckBTC minter configuration

The ckBTC minter has the following key parameters:

| Parameter | Value | Description |
|---|---|---|
| `retrieve_btc_min_amount` | 50,000 satoshi (0.0005 BTC) | Minimum amount for BTC withdrawal |
| `max_time_in_queue_nanos` | 10 minutes | Maximum time a retrieval request can wait in the queue |
| `min_confirmations` | 6 | Bitcoin confirmations required before minting ckBTC |
| `kyt_fee` | 100 satoshi | Fee for know-your-token (KYT) checks |

### ckBTC minter endpoints

- `get_btc_address(owner, subaccount)` — returns a unique Bitcoin deposit address for the given principal and subaccount
- `get_known_utxos(owner, subaccount)` — returns UTXOs already processed by the minter for the given account
- `update_balance(owner, subaccount)` — checks for new UTXOs and mints ckBTC for any newly confirmed deposits
- `estimate_withdrawal_fee(amount)` — estimates the fee for retrieving a given BTC amount
- `get_deposit_fee` — returns the current fee charged when minting ckBTC (currently the KYT fee)
- `retrieve_btc_with_approval(address, amount, from_subaccount)` — burns ckBTC (using an ICRC-2 approval) and sends the equivalent BTC to the given Bitcoin address
- `retrieve_btc(address, amount)` — alternative withdrawal flow that requires transferring ckBTC to the minter's withdrawal account first; prefer `retrieve_btc_with_approval` for new integrations
- `get_withdrawal_account` — returns the caller's withdrawal account for use with `retrieve_btc`
- `retrieve_btc_status_v2(block_index)` — returns the status of a previous withdrawal request
- `retrieve_btc_status_v2_by_account(account)` — returns statuses for all recent withdrawal requests from the given account
- `get_minter_info` — returns current minter parameters
- `get_events(start, length)` — returns the minter's internal event log (for debugging)

### Deposit and withdrawal flows

**Deposit (BTC to ckBTC):**
1. Call `get_btc_address` with the user's principal and subaccount to get a unique Bitcoin deposit address.
2. The user sends BTC to that address.
3. After 6 confirmations, call `update_balance` to trigger minting. The minter credits the ICRC-1 account corresponding to the provided principal and subaccount.

**Withdrawal (ckBTC to BTC):**
1. Call `icrc2_approve` on the ckBTC ledger to grant the minter allowance.
2. Call `retrieve_btc_with_approval` with the destination Bitcoin address and amount.
3. The minter burns the ckBTC and submits a Bitcoin transaction. BTC arrives after Bitcoin confirmations.

For integration examples, see the [Bitcoin guide](../guides/chain-fusion/bitcoin.md).

## ckETH canisters

Chain-key Ethereum (ckETH) is an ICRC-2 token backed 1:1 by ETH. The ckETH minter bridges between ETH on Ethereum mainnet and ckETH on ICP using HTTPS outcalls and threshold ECDSA.

### Mainnet canister IDs

| Canister | ID |
|---|---|
| ckETH Ledger | [`ss2fx-dyaaa-aaaar-qacoq-cai`](https://dashboard.internetcomputer.org/canister/ss2fx-dyaaa-aaaar-qacoq-cai) |
| ckETH Minter | [`sv3dd-oaaaa-aaaar-qacoa-cai`](https://dashboard.internetcomputer.org/canister/sv3dd-oaaaa-aaaar-qacoa-cai) |
| ckETH Index | [`s3zol-vqaaa-aaaar-qacpa-cai`](https://dashboard.internetcomputer.org/canister/s3zol-vqaaa-aaaar-qacpa-cai) |

### How it works

**Deposit (ETH to ckETH):**
1. The user calls the `deposit` function on the ckETH helper contract on Ethereum, with ETH attached and the destination ICP principal as an argument.
2. The ckETH minter periodically fetches logs from the helper contract via multiple Ethereum JSON-RPC providers. For each `ReceivedEth` event, it mints the corresponding ckETH to the receiver's account on the ckETH ledger.

**Withdrawal (ckETH to ETH):**
1. The user calls `icrc2_approve` on the ckETH ledger to grant the minter allowance.
2. The user calls `withdraw_eth` on the ckETH minter with a destination Ethereum address.
3. The minter burns the ckETH, creates an Ethereum transaction, and submits it to the Ethereum network.

The ckETH ledger follows the ICRC-1/ICRC-2 standard. Interact with it using the same patterns as any ICRC-1 ledger.

For integration examples, see the [Ethereum guide](../guides/chain-fusion/ethereum.md).

## EVM RPC canister

The EVM RPC canister proxies JSON-RPC calls to Ethereum and EVM-compatible chains via HTTPS outcalls. Your canister sends a request to the EVM RPC canister, which fans the request out to multiple RPC providers, compares responses for consensus, and returns the result. No API keys are required for the default providers.

| Field | Value |
|---|---|
| Canister ID | [`7hfb6-caaaa-aaaar-qadga-cai`](https://dashboard.internetcomputer.org/canister/7hfb6-caaaa-aaaar-qadga-cai) |
| Subnet | 34-node fiduciary subnet |
| Candid interface | [evm_rpc.did](https://github.com/dfinity/evm-rpc-canister/releases/latest/download/evm_rpc.did) |

### Supported chains

| Chain | Chain ID |
|---|---|
| Ethereum Mainnet | 1 |
| Ethereum Sepolia | 11155111 |
| Arbitrum One | 42161 |
| Base Mainnet | 8453 |
| Optimism Mainnet | 10 |
| Custom EVM chain | any |

### Built-in RPC providers

The following providers are available without API keys:

| Provider | Ethereum | Sepolia | Arbitrum | Base | Optimism |
|---|---|---|---|---|---|
| Alchemy | yes | yes | yes | yes | yes |
| Ankr | yes | — | yes | yes | yes |
| BlockPi | yes | yes | yes | yes | yes |
| Cloudflare | yes | — | — | — | — |
| LlamaNodes | yes | — | yes | yes | yes |
| PublicNode | yes | yes | yes | yes | yes |

### Cycle costs

Each call requires cycles attached. The cost formula is:

```
(5_912_000 + 60_000 * nodes + 2400 * request_bytes + 800 * max_response_bytes) * nodes * rpc_count
```

Where `nodes` = 34 (fiduciary subnet) and `rpc_count` = number of providers queried. For a practical starting budget, attach 10B cycles per call — unused cycles are refunded. Use the `requestCost` method to get an exact estimate before calling.

### Consensus

By default, the canister requires all providers to agree (`Equality` consensus). For calls like `eth_getBlockByNumber("latest")` where providers may be 1-2 blocks apart, use threshold consensus instead: 2-of-3 agreement. Multi-provider results are returned as `MultiRpcResult::Consistent(result)` or `MultiRpcResult::Inconsistent(results)` — always handle both variants.

For integration examples, see the [Ethereum guide](../guides/chain-fusion/ethereum.md).

## Exchange rate canister (XRC)

The exchange rate canister (XRC) uses HTTPS outcalls to fetch cryptocurrency and foreign exchange rates from major exchanges. It runs on the `uzr34` system subnet and is used by the cycles minting canister (CMC) to convert ICP to cycles at a stable XDR-pegged price.

| Field | Value |
|---|---|
| Canister ID | [`uf6dk-hyaaa-aaaaq-qaaaq-cai`](https://dashboard.internetcomputer.org/canister/uf6dk-hyaaa-aaaaq-qaaaq-cai) |
| Subnet | [`uzr34-akd3s-xrdag-3ql62-ocgoh-ld2ao-tamcv-54e7j-krwgb-2gm4z-oqe`](https://dashboard.internetcomputer.org/subnet/uzr34-akd3s-xrdag-3ql62-ocgoh-ld2ao-tamcv-54e7j-krwgb-2gm4z-oqe) |
| Specification | [XRC interface spec](https://github.com/dfinity/exchange-rate-canister/blob/main/INTERFACE_SPECIFICATION.md) |

### Data sources

The XRC pulls from the following exchanges: Coinbase, Kucoin, OKX, Gate.io, MEXC, Poloniex, Crypto.com, Bitget, and DigiFinex.

For forex rates, it queries public APIs from foreign exchange data providers worldwide on a periodic basis.

### Rate aggregation

The XRC calculates rates using candlestick chart data for specific one-minute intervals across exchanges. Rather than time-weighted or volume-weighted averages, it collects, combines, and filters rates from all sources and returns the median. This approach minimizes manipulation risk. The XRC can also derive rates for pairs not directly traded (e.g., A/B from A/C and B/C rates).

### Interface

The XRC exposes a single endpoint:

```
get_exchange_rate : (GetExchangeRateRequest) -> (GetExchangeRateResult)
```

**Request:**

```candid
type GetExchangeRateRequest = record {
  base_asset  : Asset;
  quote_asset : Asset;
  timestamp   : opt nat64;
};
```

`Asset` is a record with a `symbol` (e.g., `"BTC"`) and `class` (`Cryptocurrency` or `FiatCurrency`). Any combination of crypto and fiat is supported (e.g., ICP/USD, BTC/ICP, USD/EUR). If `timestamp` is omitted, the current rate is returned.

**Response:**

```candid
type GetExchangeRateResult = variant {
  Ok  : ExchangeRate;
  Err : ExchangeRateError;
};
```

### Cycle costs

Each request requires 1B cycles attached. If insufficient cycles are provided, the canister returns `ExchangeRateError::NotEnoughCycles`. The actual cost depends on the asset types and cache state:

| Condition | Actual cost |
|---|---|
| Served from cache | 20M cycles |
| Both assets are fiat currencies | 20M cycles |
| One asset is fiat or USDT | 260M cycles |
| Both assets are cryptocurrencies | 500M cycles |

Unused cycles are refunded. At least 1M cycles are charged even on error, to prevent denial-of-service attacks.

### Example call

Calling the XRC requires attaching cycles, which is only possible from canister-to-canister calls. The CLI cannot attach cycles to direct calls. Call the XRC from a canister using the Candid interface — pass the required cycles in the `ic_cdk::api::call::call_with_payment128` call or equivalent.

To query the current rate without attaching cycles (for inspection only, expect a `NotEnoughCycles` error on mainnet):

```bash
icp canister call uf6dk-hyaaa-aaaaq-qaaaq-cai get_exchange_rate \
  '(record {
    base_asset  = record { symbol = "BTC"; class = variant { Cryptocurrency } };
    quote_asset = record { symbol = "USD"; class = variant { FiatCurrency } };
  })' \
  -e ic
```

## SNS-W canister

The SNS Wasm canister (SNS-W) manages the deployment and upgrade of Service Nervous System (SNS) instances. The NNS controls which SNS Wasm binaries are blessed for deployment.

| Field | Value |
|---|---|
| Canister ID | [`qaa6y-5yaaa-aaaaa-aaafa-cai`](https://dashboard.internetcomputer.org/canister/qaa6y-5yaaa-aaaaa-aaafa-cai) |
| Subnet | [`tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe`](https://dashboard.internetcomputer.org/subnet/tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe) (NNS subnet) |

The SNS-W canister stores blessed SNS Wasm binaries, creates new SNS instances, and coordinates SNS upgrades. When the NNS passes an SNS upgrade proposal, it installs the new Wasms on each SNS canister via SNS-W.

For governance context, see the [SNS documentation](https://learn.internetcomputer.org/hc/en-us/articles/34084394684564-SNS-Service-Nervous-System).

## Quick reference

| Canister | ID | Purpose |
|---|---|---|
| Bitcoin mainnet | `ghsi2-tqaaa-aaaan-aaaca-cai` | Bitcoin mainnet UTXO tracking |
| Bitcoin testnet (v4) | `g4xu7-jiaaa-aaaan-aaaaq-cai` | Bitcoin testnet UTXO tracking |
| ckBTC Ledger | `mxzaz-hqaaa-aaaar-qaada-cai` | ckBTC ICRC-1/ICRC-2 token ledger |
| ckBTC Minter | `mqygn-kiaaa-aaaar-qaadq-cai` | BTC ↔ ckBTC minting and burning |
| ckBTC Index | `n5wcd-faaaa-aaaar-qaaea-cai` | ckBTC transaction index |
| ckETH Ledger | `ss2fx-dyaaa-aaaar-qacoq-cai` | ckETH ICRC-1/ICRC-2 token ledger |
| ckETH Minter | `sv3dd-oaaaa-aaaar-qacoa-cai` | ETH ↔ ckETH minting and burning |
| ckETH Index | `s3zol-vqaaa-aaaar-qacpa-cai` | ckETH transaction index |
| EVM RPC | `7hfb6-caaaa-aaaar-qadga-cai` | Ethereum JSON-RPC proxy |
| Exchange Rate (XRC) | `uf6dk-hyaaa-aaaaq-qaaaq-cai` | Crypto and forex exchange rates |
| SNS-W | `qaa6y-5yaaa-aaaaa-aaafa-cai` | SNS deployment and upgrades |

## Next steps

- [Bitcoin guide](../guides/chain-fusion/bitcoin.md) — integrating Bitcoin in canisters using the Bitcoin canister and ckBTC
- [Ethereum guide](../guides/chain-fusion/ethereum.md) — integrating Ethereum in canisters using the EVM RPC canister and ckETH
- [System canisters](system-canisters.md) — NNS canisters, Internet Identity, ICP ledger, and other network-level canisters
- [Management canister](management-canister.md) — the virtual canister for canister lifecycle, signing, and platform APIs

<!-- Upstream: informed by dfinity/portal — docs/references/system-canisters/index.mdx, docs/references/system-canisters/xrc.mdx, docs/references/ckbtc-reference.mdx, docs/building-apps/chain-fusion/ethereum/evm-rpc/overview.mdx, docs/defi/chain-key-tokens/cketh/overview.mdx, docs/defi/chain-key-tokens/ckerc20/overview.mdx; dfinity/icskills — skills/ckbtc/SKILL.md, skills/evm-rpc/SKILL.md, skills/icrc-ledger/SKILL.md -->
