---
title: "Chain-Key Token Canister IDs"
description: "Mainnet and testnet canister IDs for all chain-key tokens: ckBTC, ckETH, ckERC20, ckDOGE, and ckSOL"
sidebar:
  order: 7
---

Canister IDs for all chain-key tokens. For deposit and withdrawal flows, see [Chain-key tokens](../guides/digital-assets/chain-key-tokens.md).

- [Mainnet chain-key tokens](https://dashboard.internetcomputer.org/tokens?token_type=chain_key): live overview including market data
- [Testnet chain-key tokens](https://dashboard.internetcomputer.org/tokens?token_type=chain_key&network=testnet): testnet tokens deployed on ICP mainnet

> Always query `icrc1_fee` and `icrc1_decimals` at runtime. Fees and decimal precision are set per ledger and can change.

## ckBTC

### Mainnet

| Canister | ID |
|----------|----|
| Ledger | `mxzaz-hqaaa-aaaar-qaada-cai` |
| Minter | `mqygn-kiaaa-aaaar-qaadq-cai` |
| Index | `n5wcd-faaaa-aaaar-qaaea-cai` |
| Checker | `oltsj-fqaaa-aaaar-qal5q-cai` |

The checker canister monitors KYT (know your transaction) compliance and is called internally by the minter on deposit.

### Testnet (Bitcoin Testnet4)

| Canister | ID |
|----------|----|
| Ledger | `mc6ru-gyaaa-aaaar-qaaaq-cai` |
| Minter | `ml52i-qqaaa-aaaar-qaaba-cai` |
| Index | `mm444-5iaaa-aaaar-qaabq-cai` |

Use the Testnet4 canisters for integration testing. The ckBTC minter connects to the Bitcoin testnet4 network, so you need real testnet4 BTC (available from faucets).

## ckETH

### Mainnet

| Canister | ID |
|----------|----|
| Ledger | `ss2fx-dyaaa-aaaar-qacoq-cai` |
| Minter | `sv3dd-oaaaa-aaaar-qacoa-cai` |
| Index | `s3zol-vqaaa-aaaar-qacpa-cai` |

The ckETH minter also handles all ckERC20 tokens. To get the current Ethereum helper contract address, call `get_minter_info` on the minter and read `deposit_with_subaccount_helper_contract_address`. Always verify this before constructing an Ethereum deposit transaction.

### Testnet (Ethereum Sepolia)

| Canister | ID |
|----------|----|
| Ledger (ckTestETH) | `apia6-jaaaa-aaaar-qabma-cai` |
| Minter | `jzenf-aiaaa-aaaar-qaa7q-cai` |

The Sepolia testnet minter connects to Ethereum Sepolia. Use ckTestETH for integration testing without spending real ETH.

## ckERC20

ckERC20 tokens share the ckETH minter. Each token has its own ledger canister. For the authoritative current list, query the minter at runtime; new tokens are added via NNS governance and the table below may lag.

### Mainnet

Query the mainnet minter:

```bash
icp canister call sv3dd-oaaaa-aaaar-qacoa-cai get_minter_info '()' -n ic
```

ckERC20 ledger canister IDs on mainnet:

| Asset | Ledger | ERC-20 contract |
|-------|--------|-----------------|
| ckUSDC | `xevnm-gaaaa-aaaar-qafnq-cai` | `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48` |
| ckUSDT | `cngnf-vqaaa-aaaar-qag4q-cai` | `0xdAC17F958D2ee523a2206206994597C13D831ec7` |
| ckEURC | `pe5t5-diaaa-aaaar-qahwa-cai` | `0x1aBaEA1f7C830bD89Acc67eC4af516284b1bC33c` |
| ckWBTC | `bptq2-faaaa-aaaar-qagxq-cai` | `0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599` |
| ckWSTETH | `j2tuh-yqaaa-aaaar-qahcq-cai` | `0x7f39C581F595B53c5cb19bD0b3f8dA6c935E2Ca0` |
| ckLINK | `g4tto-rqaaa-aaaar-qageq-cai` | `0x514910771AF9Ca656af840dff83E8264EcF986CA` |
| ckUNI | `ilzky-ayaaa-aaaar-qahha-cai` | `0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984` |
| ckSHIB | `fxffn-xiaaa-aaaar-qagoa-cai` | `0x95aD61b0a150d79219dCF64E1E6Cc01f0B64C4cE` |
| ckPEPE | `etik7-oiaaa-aaaar-qagia-cai` | `0x6982508145454Ce325dDbE47a25d4ec3d2311933` |
| ckXAUT | `nza5v-qaaaa-aaaar-qahzq-cai` | `0x68749665FF8D2d112Fa859AA293F07A622782F38` |
| ckOCT | `ebo5g-cyaaa-aaaar-qagla-cai` | `0xF5cFBC74057C610c8EF151A439252680AC68c6DC` |

### Testnet (Ethereum Sepolia)

Query the Sepolia minter:

```bash
icp canister call jzenf-aiaaa-aaaar-qaa7q-cai get_minter_info '()' -n ic
```

| Asset | Ledger | Sepolia ERC-20 contract |
|-------|--------|------------------------|
| ckSepoliaUSDC | `yfumr-cyaaa-aaaar-qaela-cai` | `0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238` |
| ckSepoliaLINK | `r52mc-qaaaa-aaaar-qafzq-cai` | `0x779877A7B0D9E8603169DdbD7836e478b4624789` |
| ckSepoliaPEPE | `hw4ru-taaaa-aaaar-qagdq-cai` | `0x560eF9F39E4B08f9693987cad307f6FBfd97B2F6` |

## ckDOGE

### Mainnet

| Canister | ID |
|----------|----|
| Minter | `eqltq-xqaaa-aaaar-qb3vq-cai` |
| Ledger | `efmc5-wyaaa-aaaar-qb3wa-cai` |
| Index | `ecnej-3aaaa-aaaar-qb3wq-cai` |

The ckDOGE minter follows the same UTXO-based pattern as ckBTC. Source: [dfinity/ic rs/dogecoin/ckdoge](https://github.com/dfinity/ic/tree/master/rs/dogecoin/ckdoge).

## ckSOL

### Mainnet

| Canister | ID |
|----------|----|
| Minter | `lh22c-kyaaa-aaaar-qb5nq-cai` |
| Ledger | `ls5lp-lqaaa-aaaar-qb5oa-cai` |
| Index | `2ezyf-hqaaa-aaaar-qb6ga-cai` |

Source: [dfinity/cksol](https://github.com/dfinity/cksol).

<!-- Upstream: informed by dfinity/ic rs/ethereum/cketh/minter (ckETH/ckERC20 IDs via live get_minter_info on sv3dd-oaaaa-aaaar-qacoa-cai and jzenf-aiaaa-aaaar-qaa7q-cai); dfinity/ic rs/bitcoin/ckbtc (ckBTC IDs); dfinity/ic rs/dogecoin/ckdoge (ckDOGE IDs); dfinity/cksol (ckSOL IDs); dfinity/portal docs/defi/rosetta/icrc_rosetta/index.mdx (ckTestETH ledger ID) -->
