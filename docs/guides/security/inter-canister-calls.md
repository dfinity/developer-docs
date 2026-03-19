---
title: "Inter-Canister Call Safety"
description: "Handle reentrancy, callback traps, and async safety in inter-canister calls"
sidebar:
  order: 5
---

TODO: Write content for this page.

<!-- Content Brief -->
Handle the security pitfalls of async inter-canister calls. Cover reentrancy attacks (CallerGuard pattern), the saga pattern for multi-step operations, callback traps and how to handle them, bounded vs unbounded wait (the 2MB response limit), and state rollback on call failure. Explain why inter-canister calls are the #1 source of canister bugs.

<!-- Source Material -->
- icskills: canister-security, multi-canister

<!-- Cross-Links -->
- guides/canister-calls/onchain-calls -- basic inter-canister call patterns
- guides/canister-calls/parallel-calls -- parallel call safety
- concepts/security -- security model
