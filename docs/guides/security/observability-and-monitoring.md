---
title: "Observability and Monitoring"
description: "Security best practices for monitoring canister cycles, logs, and health indicators."
sidebar:
  order: 9
---

## Monitor your canister

### Security concern

Without monitoring, it can be hard to detect attacks or vulnerabilities that are being actively exploited. For example, a sudden increase in cycles consumption could indicate a DoS attack, while unexpected changes in canister state could indicate a security breach.

### Recommendation

- Monitor your canister's cycles balance regularly, set up alerts for sudden changes in cycles consumption, and add an endpoint to expose health indicators. See the [DoS prevention best practices](./dos-prevention.md) for more context on cycles monitoring.

- Consider emitting logs for security-relevant events (e.g., access control failures, unexpected state transitions). Since logs are stored on-chain, they provide a tamper-resistant audit trail.

- See [effective Rust canisters](https://mmapped.blog/posts/01-effective-rust-canisters.html) for general patterns on canister observability.

<!-- Upstream: sync from dfinity/portal — building-apps/security/observability-and-monitoring.mdx -->
