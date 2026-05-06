---
learn_hub_id: 39320190051348
learn_hub_url: "https://learn.internetcomputer.org/hc/en-us/articles/39320190051348-Performance"
learn_hub_title: "Performance"
learn_hub_section: "Performance"
learn_hub_category: "What is ICP?"
migrated: false
---

# Performance

The Internet Computer Protocol (ICP) is designed to provide sovereign compute capabilities at **web-speed**. This article explains key performance metrics and reports on mainnet measurements and synthetic experiments.

## Key Performance Metrics

The most important metrics for measuring the performance of the Internet Computer are:

  * **MIEPS (Millions of Instructions Executed Per Second):**  
Number of instructions executed per second across, providing a direct indicator of useful work done.
  * **Throughput (requests per second, RPS):**  
How many messages the network can process per second.
  * **Latency:**  
The time it takes for a message to be processed and finalized.



These metrics heavily depend on the number of instructions executed per message (see also [Not all transactions are equal](https://learn.internetcomputer.org/hc/en-us/articles/39158902116884/)).

Real-time system performance can be monitored via the [Internet Computer Dashboard](https://dashboard.internetcomputer.org/), reporting a plethora of other statistics. 

## How ICP Achieves High Performance

The Internet Computer works very differently from other blockchains, and is powered by advanced new cryptography. The IC achieves scalability by sharding the network into [subnet blockchains](https://learn.internetcomputer.org/hc/en-us/articles/34209955782420). Each subnet limits replication to improve performance while maintaining strong security guarantees (see [Blockchain Protocol ](https://learn.internetcomputer.org/hc/en-us/articles/34206453538964)for an introduction). Currently, the IC operates 42 subnets of varying size, with the possibility to scale out to more subnets when more capacity is needed.

Every subnet blockchain can process [update calls](https://learn.internetcomputer.org/hc/en-us/articles/34208985618836#h_01JJC2Y0A1SF9RHGA77HP7RSJB) (replicated execution of potentially state changing canister operations) independently from other subnets.

[Query calls](https://learn.internetcomputer.org/hc/en-us/articles/34208985618836#h_01JJC30QJ1AR9F6K3VQ9485D31) (no canister state change possible), on the other hand, are processed locally by a single node in a subnet. The response to a query call can therefore have low latency since the query just needs a response by a single node and does not require inter-node communication or agreement. The more nodes a subnet has, the more query calls it can handle (in contrast to update calls, which are replicated and require agreement by all the nodes in the subnet).

## Real-World Performance and Benchmarks

ICP’s performance has been measured both on the public network as well as under controlled conditions with different parameters. To separate execution performance from the rest of system operation, many experiments report metrics for the _counter_ canister (which simply increases a counter variable whenever processing a message).

### Mainnet

| Values | Comments  
---|---|---  
MIEPS |  Average: [64,625.15](https://ic-api.internetcomputer.org/api/v3/metrics/instruction-rate?step=7200&start=1751328000&end=1751328000&format=json) (July 1, 2025)  
  
Highest value measured: [249,524.31](https://ic-api.internetcomputer.org/api/v3/metrics/instruction-rate?step=7200&start=1736985600&end=1736985600&format=json) (January 16, 2025) Each subnet can execute up to 8 Billion instructions per second. Extrapolated to 42 subnets, this amounts to a maximum capacity of **336,000 MIEPS**.  |  Replicated execution only, execution of (read-only) query calls is ignored. See [dashboard](https://dashboard.internetcomputer.org/network/subnets).  
Throughput |  Average over 24h: 

  * Update calls:[ 1075.99/s ](https://ic-api.internetcomputer.org/api/v3/daily-stats?format=json&start=1751328000&end=1751328000)(July 1, 2025)
  * Query calls: [4022.86/s](https://ic-api.internetcomputer.org/api/v3/daily-stats?format=json&start=1751328000&end=1751328000) (July 1, 2025)

Highest values recorded over 1 minute:

  * Update calls: [25,621.47/s ](https://ic-api.internetcomputer.org/api/v3/daily-stats/max-update-transactions-per-sec-till-date?format=json&end=1751328000)(November 8, 2025)
  * Query calls: [19,598.03/s](https://ic-api.internetcomputer.org/api/v3/daily-stats/max-query-transactions-per-sec-till-date?format=json&end=1751328000) (July 9, 2024)

|   
Latency |  Median:

  * Update calls: 1.75s
  * Query calls: 0.167s

![](https://learn.internetcomputer.org/hc/article_attachments/39320216499860) |  Observed by HTTP gateways. The measured [RTT](https://en.wikipedia.org/wiki/Round-trip_delay) between nodes in different data centers varies from 10ms to 280ms. For simple and cached queries, the latency is dominated by network latencies from the client to ICP nodes.  
Median for selected update calls:

  * Calls to counter canister on application subnets (13 nodes): 1.35s
  * ICP ledger transfers on the NNS subnet (40 nodes): 2.23s

| See [blog post](https://medium.com/dfinity/tokamak-accelerating-the-internet-computer-update-call-lifecycle-f82517472709).  
  
### Synthetic Experiments

Throughput |  **Update calls** A single test subnet is currently able to handle around 1,200 rps for update calls as sustained load using default production consensus parameters. With optimized parameters, it is possible to reach 2,000 rps in the same test network (experiments from June 2025). Scaled up to the 42 subnets the IC currently operates, this amounts to **84,000 rps.** **Query calls** A single node is able to sustain 7,025 queries per second (experiments from November 2023). Scaled up to the 636 nodes currently assigned to subnets, this amounts to **4,467,900 rps.** |  Experiments performed with counter canister. The throughput capacity has been growing in the past and is expected to grow with further future protocol and implementation enhancements and optimizations.   
  
Alternative throughput measurements in MB/s are discussed in this [blog post](https://medium.com/dfinity/a-journey-into-stellarator-part-3-6f88881ae4bf). Currently, a throughput of 7 MB/s can be sustained per subnet.  
---|---|---  
Latency |  **Update calls** The observed latency depends on the network conditions and the load targeted at the same and other canisters on the subnet. The median latency at throughput saturation is 2.27s for 1200 rps with mainnet parameters, while 1.08s at 2000rps can be achieved with tuned parameters. ![](https://learn.internetcomputer.org/hc/article_attachments/39320216501396) Under low load (1 rps), the median latency for the tuned parameters is 0.52s (experiments from June 2025). **Query calls** Caching reduces compute-intensive queries numbers (see this [blog post](https://medium.com/dfinity/improving-query-latencies-f5bb2bc019dd%20)). |  Experiments performed with counter canister. For repeatability, the machines of an app subnet with 13 nodes in this experiment were all in the same data center, with simulated network latencies of 30ms RTT (nodes in Europe experience <25ms RTT on average).  
The tuned parameters include the notary delay (how long nodes wait before they notarize a block), certification timer (how often the certification process is triggered), whether the hashes-in-blocks throughput optimization is enabled and how long and how many user-facing responses are kept in memory.  
  
A [paper published at Usenix ATC 2023](https://www.usenix.org/system/files/atc23-arutyunyan.pdf) describes the design and measures the performance of the internal components necessary for the ICP execution layer.

### ICP Network Latency

All nodes are connected over the public IPv6 Internet, without any dedicated links. The following table depicts the round trip times observed in September 2023.

| Brussels | Chicago | Dallas | Fremont | Geneva | Ljubljana | Munich | Orlando | Singapore | Stockholm | Tokyo | Zurich  
---|---|---|---|---|---|---|---|---|---|---|---|---  
Brussels |  | 102 | 121 | 143 | 17.65 | 27.4 | 18.35 | 106 | 167 | 36.6 | 223 | 16.07  
Chicago | 102 |  | 24.6 | 59.05 | 118 | 130 | 110 | 49.4 | 249.5 | 117.5 | 152 | 121.5  
Dallas | 121 | 24.6 |  | 53.8 | 132 | 137 | 127 | 37.05 | 276 | 131 | 139 | 129.5  
Fremont | 143 | 59.05 | 53.8 |  | 145 | 156 | 145 | 67.7 | 191 | 161 | 109 | 147  
Geneva | 17.65 | 118 | 132 | 145 |  | 26.95 | 17.9 | 112 | 257.5 | 38.3 | 248 | 16.05  
Ljubljana | 27.4 | 130 | 137 | 156 | 26.95 |  | 17.55 | 123 | 258 | 42 | 235 | 22.1  
Munich | 18.35 | 110 | 127 | 145 | 17.9 | 17.55 |  | 118 | 251 | 37.5 | 246 | 12.35  
Orlando | 106 | 49.4 | 37.05 | 67.7 | 112 | 123 | 118 |  | 250 | 131 | 166 | 111  
Singapore | 167 | 249.5 | 276 | 191 | 257.5 | 258 | 251 | 250 |  | 195.5 | 177 | 200.25  
Stockholm | 36.6 | 117.5 | 131 | 161 | 38.3 | 42 | 37.5 | 131 | 195.5 |  | 260 | 36.9  
Tokyo | 223 | 152 | 139 | 109 | 248 | 235 | 246 | 166 | 177 | 260 |  | 230  
Zurich | 16.07 | 121.5 | 129.5 | 147 | 16.05 | 22.1 | 12.35 | 111 | 200.25 | 36.9 | 230 |   
  
RTT measurements between a subset of datacenters contributing to the IC mainnet network (in milliseconds). Min / median / max values are 12 / 125 / 276ms for the whole table. Considering European nodes only, the values are 12 / 22 / 42ms.

