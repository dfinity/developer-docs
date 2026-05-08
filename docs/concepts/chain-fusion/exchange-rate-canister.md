---
title: "Exchange Rate Canister"
description: "On-chain oracle for cryptocurrency and fiat exchange rates"
---

The exchange rate canister (XRC) is a system canister running on the [uzr34 system subnet](https://dashboard.internetcomputer.org/subnet/uzr34-akd3s-xrdag-3ql62-ocgoh-ld2ao-tamcv-54e7j-krwgb-2gm4z-oqe) that provides exchange rates to other canisters. It serves as an onchain oracle for asset prices, querying external exchanges via [HTTPS outcalls](../https-outcalls.md) and returning the median rate across all responses.

The canister ID is `uf6dk-hyaaa-aaaaq-qaaaq-cai`.

The NNS cycle minting canister uses the XRC to obtain up-to-date ICP/XDR rates, which it needs to convert ICP to cycles.

## Requesting a rate

A request takes the form:

```candid
type GetExchangeRateRequest = record {
  base_asset: Asset;
  quote_asset: Asset;
  timestamp: opt nat64;
};
```

An `Asset` is a record with a symbol (for example, `"ICP"` or `"USD"`) and a class (`Cryptocurrency` or `FiatCurrency`). The base and quote assets can be any combination of cryptocurrency and fiat currency, for example `BTC/ICP`, `ICP/USD`, or `USD/EUR`.

The optional `timestamp` is a Unix timestamp in seconds with 1-minute granularity (seconds are ignored). If omitted, the rate for the current minute is returned. To improve reliability, using the start of the previous minute is advisable, since some exchanges may not yet have data for the current minute.

The response is a `GetExchangeRateResult` variant (`Ok: ExchangeRate` or `Err: ExchangeRateError`). A successful response includes the rate as a scaled 64-bit integer, plus metadata: the `decimals` field (divide the rate by 10^`decimals` to get the human-readable price), the number of sources queried and rates received for each asset, the standard deviation, and the forex timestamp if applicable.

## Cycle cost

Every request must include **1 billion cycles**. The actual cost depends on the request type:

| Request type | Actual cost |
|---|---|
| Served from cache, or both assets are fiat | 20M cycles |
| One asset is fiat or USDT | 260M cycles |
| Both assets are cryptocurrencies | 500M cycles |

Unused cycles are refunded. At least 1M cycles are charged even on error, to prevent denial-of-service attacks.

## How rates are computed

When a cryptocurrency rate is not cached, the XRC queries all supported exchanges using HTTPS outcalls to get the asset's price against USDT. It then takes the **median** of all received rates, making the result resistant to outliers. For a cryptocurrency/cryptocurrency pair like BTC/ICP, the XRC derives the rate from independent BTC/USDT and ICP/USDT rates using a cross-product approach before taking the median.

For fiat currencies, the XRC downloads daily forex rates from forex data providers on a fixed schedule. USD/USDT is derived by taking the median of rates for several stablecoins against USDT, based on the assumption that at least half of the included stablecoins maintain their USD peg at any given time.

If the XRC receives largely inconsistent rates from exchanges, it returns an `ExchangeRateError::InconsistentRatesReceived` error.

## Next steps

- [Chain Fusion overview](index.md): integration patterns and supported chains
- [HTTPS outcalls](../https-outcalls.md): how the XRC fetches external data
- [XRC reference](../../references/protocol-canisters.md#exchange-rate-canister-xrc): canister ID, interface, and cycle costs
- [XRC Candid interface](https://github.com/dfinity/exchange-rate-canister/blob/main/src/xrc/xrc.did)

<!-- Upstream: informed by Learn Hub articles "Exchange Rate Canister" (migrated, source retired) -->
