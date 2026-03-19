---
title: "Parallel Calls"
description: "Execute multiple inter-canister calls concurrently for better performance"
sidebar:
  order: 5
---

TODO: Write content for this page.

<!-- Content Brief -->
Execute multiple inter-canister calls concurrently instead of sequentially. Cover futures::join_all in Rust, async/await patterns in Motoko, composite queries for read-only parallel calls. Handle partial failures when some calls succeed and others fail. Explain performance benefits and when parallel calls are appropriate.

<!-- Source Material -->
- Portal: building-apps/integrations/advanced-calls.mdx (composite queries section)
- icskills: multi-canister
- Examples: parallel_calls (both), composite_query (both)

<!-- Cross-Links -->
- guides/canister-calls/onchain-calls -- basic inter-canister calls
- guides/canister-management/optimization -- performance improvements
- guides/security/inter-canister-calls -- safety of async calls
