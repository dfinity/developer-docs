---
title: "Onchain Randomness"
description: "Generate unpredictable random numbers using the IC management canister"
sidebar:
  order: 4
---

TODO: Write content for this page.

<!-- Content Brief -->
Generate cryptographically secure random numbers in canisters using the management canister's raw_rand API. Explain why randomness is hard on blockchains and how ICP solves it with VRF. Use cases: games, lotteries, fair selection. Security considerations: never use randomness in query calls, always use in update calls.

<!-- Source Material -->
- Portal: building-apps/integrations/randomness.mdx
- Examples: random_maze (Motoko)
- Management canister: raw_rand method

<!-- Cross-Links -->
- concepts/onchain-randomness -- VRF-based randomness explained
- guides/security/data-integrity -- randomness and security
- reference/management-canister -- raw_rand API
