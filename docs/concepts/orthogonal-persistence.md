---
title: "Orthogonal Persistence"
description: "How canister memory survives across executions and upgrades without databases"
sidebar:
  order: 5
icskills: []
---

TODO: Write content for this page.

<!-- Content Brief -->
Explain orthogonal persistence on ICP. Cover how canister memory (heap) persists between calls, stable memory as the upgrade-safe storage layer, heap persistence in Motoko (automatic with enhanced orthogonal persistence), stable structures in Rust (StableBTreeMap, etc.), and the trade-offs between heap and stable memory. Compare with traditional database-backed backends.

<!-- Source Material -->
- Portal: persistence sections (scattered)
- Learn Hub: https://learn.internetcomputer.org (orthogonal persistence)

<!-- Cross-Links -->
- guides/backends/data-persistence -- practical implementation
- languages/rust/stable-structures -- Rust-specific patterns
- guides/canisters/lifecycle -- persistence across upgrades
