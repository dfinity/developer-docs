---
learn_hub_id: 45038506066452
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/45038506066452-Exchange-Rate-Canister"
learn_hub_title: "Exchange Rate Canister"
learn_hub_section: "Chain Fusion"
learn_hub_category: "How does ICP work?"
migrated: false
---

# Exchange Rate Canister

The exchange rate canister (XRC) is a canister running on the [uzr34 system subnet](https://dashboard.internetcomputer.org/subnet/uzr34-akd3s-xrdag-3ql62-ocgoh-ld2ao-tamcv-54e7j-krwgb-2gm4z-oqe) that provides exchange rates to requesting canisters. A request comprises a base asset, a quote asset, and an optional (UNIX epoch) timestamp. The base and quote asset can be any combination of cryptocurrency and fiat currency assets, for example, BTC/ICP, ICP/USD, or USD/EUR. The timestamp parameter makes it possible to request historic rates. If no timestamp is provided in the request, the rate for the current time is returned.

The XRC constitutes an on-chain oracle for exchange rates, which is particularly useful for DeFi applications but can further add value to any application that requires exchange rate information.

The cycle minting canister of the [NNS](https://learn.internetcomputer.org/hc/en-us/articles/33692645961236) makes use of the XRC to obtain up-to-date ICP/XDR rates, which it requires for the conversion of ICP to cycles.

## Usage

The canister ID of the XRC is `uf6dk-hyaaa-aaaaq-qaaaq-cai`. A request of the form
    
    
    type GetExchangeRateRequest = record {
       base_asset: Asset;
       quote_asset: Asset;
       timestamp: opt nat64;
    }; 
    

can be sent to the XRC, which replies with the following result:
    
    
    type GetExchangeRateResult = variant {
       Ok: ExchangeRate;
       Err: ExchangeRateError;
    };
    

An `Asset` is a record consisting of a symbol (for example, "ICP") and a class (either `Cryptocurrency` or `FiatCurrency`). The full candid file can be found [here](https://github.com/dfinity/exchange-rate-canister/blob/main/src/xrc/xrc.did). The optional timestamp in the request must be a UNIX timestamp in seconds when provided. If no timestamp is provided, the timestamp corresponding to the start of the current minute is used. Note that the granularity for requests is 1 minute, so seconds in a timestamp are ignored.

It is further worth nothing that some exchanges may not always have exchange rates available for the current minute. Depending on the use case, it may be advisable to use the start of the previous minute to increase the chance to get a response based on rates collected from all queried exchanges.

For every request, **1B cycles** need to be sent along, otherwise an `ExchangeRateError::NotEnoughCycles` error is returned. The actual cost of the call depends on two factors, the requested asset types and the state of the internal exchange rate cache, as follows:

  * If the request can be served from the cache, the actual cost is 20M cycles.
  * If both assets are fiat currencies, the cost is 20M cycles as well.
  * If one of the assets is a fiat currency or the cryptocurrency USDT, the cost is 260M cycles.
  * If both assets are cryptocurrencies, the cost is 500M cycles.



The remaining cycles are returned to the requesting canister. Note that at least 1M cycles are charged even in case of an error in order to mitigate the risk of a denial-of-service attack.

## Technical Details

The following figure depicts the work flow when receiving a request.

[![](https://learn.internetcomputer.org/hc/article_attachments/45038716591124)](https://wiki.internetcomputer.org/wiki/File:XRC_Flow_Diagram.png)

After receiving a request (step 1), the exchange rate for each cryptocurrency asset in the request with respect to the quote asset USDT is queried (for the timestamp in the request) from all supported exchanges using [HTTPS outcalls](https://learn.internetcomputer.org/hc/en-us/articles/34211194553492 "HTTPS outcalls") if this rate is not already cached (step 2). If a rate can be computed based on the query results received from the exchanges, it is inserted in the cache and returned to the requesting canister (step 3). The  _median rate_ of all received rates is returned as it is not susceptible to outliers (unlike, for example, the average rate).

If a cryptocurrency/cryptocurrency base-quote pair B/Q was requested, the B/Q rate is derived from the queried B/USDT and Q/USDT rates: First, the Q/USDT rates are inverted to get the USDT/Q rates. Second, the cross product of the B/USDT and USDT/Q rates is computed. Lastly, the median of these rates is returned as the B/Q rate. The motivation for using the cross product is that it contains every B/Q rate that can be derived from the given B/USDT and USDT/Q rates. The median rate is chosen as it is less susceptible to outliers than using, for example, the average.

The XRC queries daily foreign exchange (forex) rates from forex data providers automatically on a fixed schedule. Furthermore, the XRC queries multiple stablecoin rates automatically to derive the USD/USDT rate as follows. Given SC1/USDT, SC2/USDT, ... rates for a set of stablecoins SC1, SC2, ..., it uses the median of these rates as the USD/USDT rate. This rule is based on the assumption that at least half of the stablecoins in the set keep their peg to USD at any time, in which case the median rate is an adequate estimate for the USD/USDT rate. Given the USD/USDT rate and the forex rates for fiat currencies other than USD, the requested rate can be computed for the case when one or more assets in the request are fiat currencies.

Since more requests to exchanges are required for cryptocurrency/cryptocurrency pairs, more cycles are charged for such requests.

As indicated in the figure above, the response to a successful request contains metadata in addition to the rate. The metadata contains the following fields:

  * `decimals`: The rate is returned as a scaled 64-bit integer. The scaling factor is 10 to the power of `decimals`.
  * `base_asset_num_received_rates`: The number of received rates for the base asset from all queried exchanges.
  * `base_asset_num_queried_sources`: The number of queried exchanges for the base asset.
  * `quote_asset_num_received_rates`: The number of received rates for the quote asset from all queried exchanges.
  * `quote_asset_num_queried_sources`: The number of queried exchanges for the quote asset.
  * `standard_deviation`: The standard deviation of all received rates for this request. Note that the standard deviation is scaled by the same factor as the rate itself.
  * `forex_timestamp`: The timestamp of the beginning of the day for which the forex rates were retrieved, if any.



This additional information can be used to determine the trustworthiness of the received rate, for example by checking the number of rates that went into the computation of the rate and the standard deviation. If the XRC receives largely inconsistent rates from exchanges, it returns an `ExchangeRateError::InconsistentRatesReceived` itself.

