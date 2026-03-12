---
title: "HTTPS Outcalls"
description: "How canisters make HTTP requests to external services with consensus on responses"
sidebar:
  order: 6
icskills: [https-outcalls]
---

TODO: Write content for this page.

<!-- Content Brief -->
Explain how HTTPS outcalls work at the protocol level. Cover why HTTP from a blockchain is hard (all replicas must agree on the response), the transform function mechanism for achieving consensus, cycle pricing for outcalls, response size limits, and limitations (no WebSocket, no streaming). Focus on what developers need to know to use outcalls correctly, not protocol implementation details.

<!-- Source Material -->
- Portal: building-apps/integrations/https-outcalls/ (overview/conceptual files)
- Learn Hub: [HTTPS Outcalls](https://learn.internetcomputer.org/hc/en-us/articles/34211194553492)

<!-- Cross-Links -->
- guides/backends/https-outcalls -- practical how-to
- guides/chain-fusion/ethereum -- EVM RPC uses outcalls
- reference/cycles-costs -- outcall pricing
