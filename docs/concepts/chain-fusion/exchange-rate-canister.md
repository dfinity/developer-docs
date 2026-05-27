---
title: "Exchange rate canister"
description: "Oracle for cryptocurrency and fiat exchange rates running as a system canister on ICP"
---

The exchange rate canister (XRC) is a system canister that provides exchange rates to other canisters. It runs on the [uzr34 system subnet](https://dashboard.internetcomputer.org/subnet/uzr34-akd3s-xrdag-3ql62-ocgoh-ld2ao-tamcv-54e7j-krwgb-2gm4z-oqe) and uses [HTTPS outcalls](../https-outcalls.md) to fetch real-time and historical price data from major exchanges and forex data providers.

The canister ID is `uf6dk-hyaaa-aaaaq-qaaaq-cai`.

The [Cycles Minting Canister (CMC)](../../references/system-canisters.md#cycles-minting-canister-cmc) is the XRC's primary consumer: it calls the XRC every 5 minutes for the current ICP/XDR rate to use when converting ICP tokens to cycles. Application canisters can also call the XRC directly to build financial features such as exchanges, payment systems, and portfolio tools.

## Supported rate types

The XRC handles three combinations of asset class:

- **Cryptocurrency / fiat**: for example, `ICP/USD`, `BTC/EUR`. The XRC fetches live crypto rates and combines them with its cached forex data.
- **Cryptocurrency / cryptocurrency**: for example, `BTC/ICP`. Each asset is independently quoted against USDT, and the cross rate is derived from those two results.
- **Fiat / fiat**: for example, `USD/EUR`. Served entirely from periodically cached forex data at minimal cycle cost.

## How rates are computed

![Exchange rate canister data flow: the XRC pulls daily forex rates from forex providers and real-time crypto rates from exchanges, then returns the median rate and metadata to the requesting canister](/concepts/chain-fusion/exchange-rate-canister-flow.png)

When a cryptocurrency rate is not in the cache, the XRC queries all supported exchanges via HTTPS outcalls to get the asset's price against USDT. It collects candlestick data for the requested one-minute interval across exchanges, then returns the **median** of all received rates. The median makes the result resistant to outliers from any single exchange and cannot be manipulated by a minority of data sources.

For cryptocurrency/cryptocurrency pairs such as BTC/ICP, the XRC derives the result from independent BTC/USDT and ICP/USDT rates using a cross-product approach before taking the median, rather than requiring BTC/ICP to be directly traded.

For fiat currencies, the XRC downloads daily forex rates from forex data providers on a fixed schedule. USD/USDT is derived by taking the median of rates for several stablecoins against USDT, based on the assumption that at least half of the included stablecoins maintain their USD peg at any given time.

If the XRC receives largely inconsistent rates across exchanges, it returns an `InconsistentRatesReceived` error rather than returning a potentially unreliable result.

## Cycle cost

Every request requires 1 billion cycles attached upfront. Unused cycles are refunded after the call. The actual cost depends on whether the result is served from cache and what asset classes are involved. For the full cost breakdown, see [Exchange rate canister (XRC)](../../references/protocol-canisters.md#exchange-rate-canister-xrc).

Because cycles must be attached to an inter-canister call, you can only call the XRC from canister code, not directly from the CLI. For how to do this in Rust and Motoko, see the [Fetch exchange rates guide](../../guides/chain-fusion/exchange-rates.md).

## Next steps

- [Fetch exchange rates](../../guides/chain-fusion/exchange-rates.md): how to call the XRC from your canister in Rust and Motoko
- [Exchange rate canister reference](../../references/protocol-canisters.md#exchange-rate-canister-xrc): canister ID, full Candid interface, cycle cost table, and data sources
- [HTTPS outcalls](../https-outcalls.md): how the XRC fetches external data
- [Chain Fusion overview](index.md): integration patterns and supported chains

<!-- Upstream: informed by Learn Hub articles "Exchange Rate Canister" (migrated, source retired); dfinity/exchange-rate-canister (src/xrc/xrc.did) -->
