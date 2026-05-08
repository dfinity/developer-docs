---
title: "Performance"
description: "Throughput, latency, and benchmark figures for ICP subnets: update calls, query calls, MIEPS, and mainnet measurements."
sidebar:
  order: 6
---

ICP is designed to run applications at web speed. This page explains the key performance metrics, how the protocol architecture determines them, and the figures measured on mainnet and in synthetic experiments.

Performance numbers are point-in-time snapshots. Engineers maintaining this page should refresh mainnet figures by querying the [IC metrics API](https://ic-api.internetcomputer.org/api/v3/metrics/) and verifying synthetic results against current hardware and protocol parameters. Live network statistics are always available on the [IC dashboard](https://dashboard.internetcomputer.org).

## Metrics

Three metrics characterize ICP performance.

**MIEPS (Millions of Instructions Executed Per Second)** measures raw compute throughput: how many Wasm instructions the network executes per second across all subnets, counting only replicated (update) execution. It is the primary indicator of useful work done by the protocol. A single subnet can execute up to 8 billion instructions per second; with 42 subnets, the theoretical network capacity is approximately 336,000 MIEPS.

**Throughput** measures how many messages the network processes per second. It is reported separately for update calls (replicated, state-changing) and query calls (non-replicated, read-only), because the two execution modes have fundamentally different scalability properties.

**Latency** is the time between submitting a call and receiving a response. For update calls this includes the consensus round; for query calls it is dominated by network round-trip time to a single node.

## Update calls vs query calls

The most important architectural performance distinction is between the two call types:

**Update calls** go through consensus. Every node in the subnet executes the call, and the response is certified by the subnet's threshold signature. This guarantees correctness but means latency is bounded by consensus finality: roughly one to two seconds under normal conditions, longer on larger subnets. Update throughput is limited by the subnet's consensus capacity and scales by adding more subnets, not more nodes per subnet.

**Query calls** bypass consensus. A single node executes the query and returns a result immediately. Latency is dominated by network round-trip time: typically 100–200ms. Because every node can serve queries concurrently and independently, query throughput scales linearly with subnet size. The tradeoff is trust: a single node produces the response, so query results are not subnet-certified unless the canister uses [certified variables](../../guides/backends/certified-variables.md).

## Mainnet measurements

The following figures were last measured on **July 1, 2025**. Refresh by querying the [IC daily stats API](https://ic-api.internetcomputer.org/api/v3/daily-stats?format=json) and [instruction rate API](https://ic-api.internetcomputer.org/api/v3/metrics/instruction-rate).

| Metric | Value | Notes |
|--------|-------|-------|
| MIEPS (average) | 64,625 | Replicated execution only; query calls excluded |
| MIEPS (all-time peak) | 249,524 | Recorded January 16, 2025 |
| Update call throughput (daily average) | 1,076/s | |
| Query call throughput (daily average) | 4,023/s | |
| Update call throughput (all-time peak, 1 min) | 25,621/s | |
| Query call throughput (all-time peak, 1 min) | 19,598/s | Recorded July 9, 2024 |
| Update call latency (median, via HTTP gateway) | 1.75s | |
| Query call latency (median, via HTTP gateway) | 0.167s | |

Latency varies by subnet size and load:

| Call type | Subnet | Median latency |
|-----------|--------|----------------|
| Update (counter canister) | Application subnet (13 nodes) | 1.35s |
| Update (ICP ledger transfer) | NNS subnet (40 nodes) | 2.23s |

Larger subnets have higher latency because consensus requires agreement among more nodes.

## Synthetic benchmarks

Controlled experiments isolate execution performance from real-world network variability. These experiments use the counter canister (a minimal canister that increments a counter on every message) to measure raw protocol throughput without application overhead. Results from experiments run in **June 2025**:

| Scenario | Throughput | Notes |
|----------|-----------|-------|
| Update calls, mainnet parameters | 1,200/s (sustained) | Single 13-node test subnet |
| Update calls, tuned parameters | 2,000/s (sustained) | Reduced notary delay, optimized certification timer |
| Update calls (network-wide extrapolation) | 84,000/s | 42 subnets × 2,000/s |
| Query calls per node | 7,025/s | November 2023 experiment |
| Query calls (network-wide extrapolation) | 4,467,900/s | 636 nodes × 7,025/s |

Tuned parameters include the notary delay, certification timer interval, the hashes-in-blocks optimization, and the in-memory response cache size. Mainnet uses conservative parameters to prioritize stability.

Throughput is also measured in data volume: a single subnet can sustain approximately **7 MB/s**. See [Stellarator part 3](https://medium.com/dfinity/a-journey-into-stellarator-part-3-6f88881ae4bf) for the detailed analysis.

## Node network latency

ICP nodes communicate over the public IPv6 internet without dedicated links. Round-trip times between nodes in different data centers range from **10ms to 280ms**, with a median of approximately 125ms across the full network. European nodes communicate at 12–42ms RTT.

Network latency is a floor for consensus latency: a consensus round requires multiple message exchanges between all nodes in the subnet. The Tokamak protocol optimizations ([blog post](https://medium.com/dfinity/tokamak-accelerating-the-internet-computer-update-call-lifecycle-f82517472709)) reduced median update call latency significantly by restructuring the consensus message exchange pattern.

## Further reading

- [Execution layer](execution.md): WebAssembly execution, DTS, and cycles accounting
- [Consensus](consensus.md): how blocks are proposed, notarized, and finalized
- [IC dashboard](https://dashboard.internetcomputer.org): live network statistics including per-subnet MIEPS and latency
- [Usenix ATC 2023 paper](https://www.usenix.org/system/files/atc23-arutyunyan.pdf): design and performance measurements of the ICP execution layer

<!-- Upstream: informed by Learn Hub article "Performance" (out-of-scope/what-is-icp/performance.md, migrated, source retired) -->
