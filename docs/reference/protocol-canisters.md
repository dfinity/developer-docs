---
title: "Protocol Canisters"
description: "Bitcoin canister, ckBTC minter, ckETH minter, EVM RPC canister, exchange rate canister, and other protocol-level canisters with their APIs and Candid interfaces"
sidebar:
  order: 3
---

Protocol canisters implement platform-level features on the Internet Computer. Unlike [system canisters](system-canisters.md), which govern the network itself, protocol canisters provide infrastructure that applications build on: Bitcoin integration, Ethereum integration, chain-key tokens, and exchange rates. They are controlled by the NNS and run on dedicated system subnets.

For all chain-key token canister IDs (ledger, minter, index), see [Chain-Key Token Canister IDs](chain-key-canister-ids.md). For deposit, withdrawal, and transfer flows, see [Chain-key tokens](../guides/digital-assets/chain-key-tokens.md).

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

- `bitcoin_get_utxos`: returns UTXOs for a Bitcoin address
- `bitcoin_get_balance`: returns the balance of a Bitcoin address in satoshi
- `bitcoin_send_transaction`: submits a signed Bitcoin transaction
- `bitcoin_get_current_fee_percentiles`: returns fee percentiles in millisatoshi/vbyte
- `bitcoin_get_block_headers`: returns block headers for a range of heights

For integration patterns, see the [Bitcoin guide](../guides/chain-fusion/bitcoin.md).

## ckBTC minter

The ckBTC minter holds real BTC in a threshold ECDSA-controlled wallet and mints or burns ckBTC tokens. It issues a unique Bitcoin deposit address per `(owner, subaccount)` account and handles withdrawal requests by submitting signed Bitcoin transactions.

For canister IDs, see [Chain-Key Token Canister IDs: ckBTC](chain-key-canister-ids.md#ckbtc).

### Minter parameters

| Parameter | Value | Description |
|---|---|---|
| `retrieve_btc_min_amount` | 50,000 satoshi | Minimum amount for BTC withdrawal |
| `max_time_in_queue_nanos` | 10 minutes | Maximum time a retrieval request waits |
| `min_confirmations` | 4 | Bitcoin confirmations required before minting |
| `kyt_fee` | 100 satoshi | Fee for know-your-transaction (KYT) check |

### Minter endpoints

- `get_btc_address(owner, subaccount)`: returns a unique Bitcoin deposit address for the given principal and subaccount
- `update_balance(owner, subaccount)`: checks for newly confirmed UTXOs and mints ckBTC
- `get_known_utxos(owner, subaccount)`: returns UTXOs already processed for the given account
- `estimate_withdrawal_fee(amount)`: estimates the fee for retrieving a given BTC amount
- `get_deposit_fee`: returns the current fee charged when minting ckBTC (the KYT fee)
- `retrieve_btc_with_approval(address, amount, from_subaccount)`: burns ckBTC via ICRC-2 approval and sends BTC to the given Bitcoin address
- `retrieve_btc_status_v2(block_index)`: returns the status of a previous withdrawal request
- `retrieve_btc_status_v2_by_account(account)`: returns statuses for all recent withdrawal requests from the given account
- `get_minter_info`: returns current minter parameters
- `get_events(start, length)`: returns the minter's internal event log

### KYT checker

The ckBTC checker canister (`oltsj-fqaaa-aaaar-qal5q-cai`) performs know-your-transaction compliance checks on incoming Bitcoin UTXOs. It is called internally by the minter on deposit and is not part of the developer-facing API.

## ckETH minter

The ckETH minter bridges ETH and all ERC-20 tokens between Ethereum and ICP. It monitors the ckETH helper contract on Ethereum via HTTPS outcalls to detect deposits, and submits signed Ethereum transactions for withdrawals using threshold ECDSA.

For canister IDs, see [Chain-Key Token Canister IDs: ckETH](chain-key-canister-ids.md#cketh).

### Helper contract

The minter uses a helper smart contract on Ethereum to receive deposits for both ETH and ERC-20 tokens. Always verify the current address before constructing a deposit transaction:

```bash
icp canister call sv3dd-oaaaa-aaaar-qacoa-cai get_minter_info '()' -n ic
```

Check `deposit_with_subaccount_helper_contract_address` in the response.

### Minter endpoints

- `get_minter_info`: returns current minter info including the helper contract address and `supported_ckerc20_tokens`
- `withdraw_eth(address, amount)`: burns ckETH or ckERC20 and submits an Ethereum withdrawal transaction; used for both ETH and all ERC-20 withdrawals
- `get_canister_status`: returns the minter's current status

## ckERC20 ledgers

ckERC20 tokens share the ckETH minter. Each ERC-20 token has its own ICRC-1 ledger canister. New tokens are added via NNS governance proposals.

To get the authoritative current list of supported tokens and their ledger canister IDs at runtime:

```bash
icp canister call sv3dd-oaaaa-aaaar-qacoa-cai get_minter_info '()' -n ic
```

Check `supported_ckerc20_tokens` in the response. For a static reference table, see [Chain-Key Token Canister IDs: ckERC20](chain-key-canister-ids.md#ckerc20).

## ckDOGE minter

The ckDOGE minter follows the same UTXO-based model as ckBTC. It holds real DOGE in a threshold ECDSA-controlled wallet and issues a unique Dogecoin deposit address per `(owner, subaccount)` account.

For canister IDs, see [Chain-Key Token Canister IDs: ckDOGE](chain-key-canister-ids.md#ckdoge).

### Minter endpoints

- `get_deposit_address(owner, subaccount)`: returns a unique Dogecoin deposit address for the given principal and subaccount
- `update_balance(owner, subaccount)`: checks for newly confirmed UTXOs and mints ckDOGE
- `retrieve_doge_with_approval(address, amount, from_subaccount)`: burns ckDOGE via ICRC-2 approval and sends DOGE to the given Dogecoin address
- `get_minter_info`: returns current minter parameters

Amounts are denominated in koinu (1 DOGE = 100,000,000 koinu).

Source: [dfinity/ic rs/dogecoin/ckdoge](https://github.com/dfinity/ic/tree/master/rs/dogecoin/ckdoge)

## ckSOL minter

The ckSOL minter bridges SOL between Solana and ICP. It issues a unique Solana deposit address per `(owner, subaccount)` account and verifies deposits via the SOL RPC canister using threshold signatures (Ed25519).

For canister IDs, see [Chain-Key Token Canister IDs: ckSOL](chain-key-canister-ids.md#cksol).

### Minter endpoints

- `get_deposit_address(owner, subaccount)`: returns a unique Solana deposit address for the given principal and subaccount
- `process_deposit(tx_signature, owner, subaccount)`: verifies a Solana deposit transaction and mints ckSOL; requires cycles to cover RPC verification
- `withdraw(address, amount)`: burns ckSOL via ICRC-2 approval and signs a Solana transaction using threshold Ed25519
- `withdrawal_status(burn_block_index)`: returns the status of a pending withdrawal

Amounts are denominated in lamports (1 SOL = 1,000,000,000 lamports).

Source: [dfinity/cksol](https://github.com/dfinity/cksol)

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
| Ankr | yes | - | yes | yes | yes |
| BlockPi | yes | yes | yes | yes | yes |
| Cloudflare | yes | - | - | - | - |
| LlamaNodes | yes | - | yes | yes | yes |
| PublicNode | yes | yes | yes | yes | yes |

### Cycle costs

Each call requires cycles attached. The cost formula is:

```
(5_912_000 + 60_000 * nodes + 2400 * request_bytes + 800 * max_response_bytes) * nodes * rpc_count
```

Where `nodes` = 34 (fiduciary subnet) and `rpc_count` = number of providers queried. For a practical starting budget, attach 10B cycles per call: unused cycles are refunded. Use the `requestCost` method to get an exact estimate before calling.

### Consensus

By default, the canister requires all providers to agree (`Equality` consensus). For calls like `eth_getBlockByNumber("latest")` where providers may be 1-2 blocks apart, use threshold consensus instead: 2-of-3 agreement. Multi-provider results are returned as `MultiRpcResult::Consistent(result)` or `MultiRpcResult::Inconsistent(results)`: always handle both variants.

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

`Asset` is a record with a `symbol` (e.g., `"BTC"`) and `class` (`Cryptocurrency` or `FiatCurrency`). Any combination of digital asset and fiat is supported (e.g., ICP/USD, BTC/ICP, USD/EUR). If `timestamp` is omitted, the current rate is returned.

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

Calling the XRC requires attaching cycles, which is only possible from canister-to-canister calls. The CLI cannot attach cycles to direct calls. Call the XRC from a canister using the Candid interface: pass the required cycles in the `ic_cdk::api::call::call_with_payment128` call or equivalent.

To query the current rate without attaching cycles (for inspection only, expect a `NotEnoughCycles` error on mainnet):

```bash
icp canister call uf6dk-hyaaa-aaaaq-qaaaq-cai get_exchange_rate \
  '(record {
    base_asset  = record { symbol = "BTC"; class = variant { Cryptocurrency } };
    quote_asset = record { symbol = "USD"; class = variant { FiatCurrency } };
  })' \
  -n ic
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
| ckBTC Minter | `mqygn-kiaaa-aaaar-qaadq-cai` | BTC ↔ ckBTC minting and burning |
| ckBTC KYT Checker | `oltsj-fqaaa-aaaar-qal5q-cai` | Know-your-transaction compliance |
| ckETH Minter | `sv3dd-oaaaa-aaaar-qacoa-cai` | ETH and ERC-20 ↔ ckETH/ckERC20 minting and burning |
| ckDOGE Minter | `eqltq-xqaaa-aaaar-qb3vq-cai` | DOGE ↔ ckDOGE minting and burning |
| ckSOL Minter | `lh22c-kyaaa-aaaar-qb5nq-cai` | SOL ↔ ckSOL minting and burning |
| EVM RPC | `7hfb6-caaaa-aaaar-qadga-cai` | Ethereum JSON-RPC proxy |
| Exchange Rate (XRC) | `uf6dk-hyaaa-aaaaq-qaaaq-cai` | Crypto and forex exchange rates |
| SNS-W | `qaa6y-5yaaa-aaaaa-aaafa-cai` | SNS deployment and upgrades |

For ledger, index, and testnet canister IDs for all chain-key tokens, see [Chain-Key Token Canister IDs](chain-key-canister-ids.md).

## Next steps

- [Chain-Key Token Canister IDs](chain-key-canister-ids.md): ledger, minter, and index IDs for all chain-key tokens
- [Chain-key tokens](../guides/digital-assets/chain-key-tokens.md): deposit, withdrawal, and transfer flows for all chain-key tokens
- [Bitcoin guide](../guides/chain-fusion/bitcoin.md): integrating Bitcoin in canisters using the Bitcoin canister and ckBTC
- [Ethereum guide](../guides/chain-fusion/ethereum.md): integrating Ethereum in canisters using the EVM RPC canister and ckETH
- [System canisters](system-canisters.md): NNS canisters, Internet Identity, ICP ledger, and other network-level canisters
- [Management canister](management-canister.md): the virtual canister for canister lifecycle, signing, and platform APIs

<!-- Upstream: informed by dfinity/portal — docs/references/system-canisters/index.mdx, docs/references/system-canisters/xrc.mdx, docs/references/ckbtc-reference.mdx, docs/building-apps/chain-fusion/ethereum/evm-rpc/overview.mdx, docs/defi/chain-key-tokens/cketh/overview.mdx, docs/defi/chain-key-tokens/ckerc20/overview.mdx; dfinity/ic rs/bitcoin/ckbtc, rs/dogecoin/ckdoge, rs/ethereum/cketh; dfinity/cksol; dfinity/icskills — skills/ckbtc/SKILL.md, skills/evm-rpc/SKILL.md, skills/icrc-ledger/SKILL.md -->
