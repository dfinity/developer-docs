---
title: "Data Persistence"
description: "Store and retrieve data in canisters using stable structures, persistent actors, and upgrade hooks"
sidebar:
  order: 1
icskills: [stable-memory]
---

TODO: Write content for this page.

<!-- Content Brief -->
Guide developers through storing data in canisters. This is the how-to companion to concepts/orthogonal-persistence (which explains what and why; this page shows how). Cover: Motoko persistent actors (persistent actor, transient var, let/var persistence, schema evolution rules), Rust stable structures (StableBTreeMap, StableCell, StableLog, MemoryManager, MemoryId partitioning, Storable trait implementations for custom types, #[init]/#[post_upgrade] hook patterns), and the dangerous pre_upgrade heap serialization anti-pattern. Include idempotency patterns for safe data mutation. Show complete code examples for both Rust and Motoko.

<!-- Source Material -->
- Portal: building-apps/canister-management/storage.mdx, best-practices/storage.mdx, best-practices/idempotency.mdx
- icskills: stable-memory
- Examples: daily_planner (both), superheroes (Motoko), photo_gallery (Rust)
- Rust CDK: https://docs.rs/ic-cdk/latest/ic_cdk/

<!-- Cross-Links -->
- concepts/orthogonal-persistence -- conceptual background
- guides/canister-management/lifecycle -- upgrade hooks
- languages/rust/stable-structures -- Rust-specific deep dive
- languages/motoko/ -- Motoko persistence patterns
