---
title: "Timers"
description: "Schedule one-shot and periodic tasks in your canister"
sidebar:
  order: 3
icskills: []
---

TODO: Write content for this page.

<!-- Content Brief -->
Set up one-shot and periodic timers in canisters. Cover the timer API for both Rust (ic_cdk_timers) and Motoko (Timer module). Explain migration from heartbeats to timers. Common patterns: periodic cleanup, scheduled data aggregation, timed state transitions. Include cycle cost implications.

<!-- Source Material -->
- Portal: building-apps/integrations/periodic-tasks.mdx
- Examples: periodic_tasks (Rust)
- Rust CDK: https://docs.rs/ic-cdk/latest/ic_cdk/ (timers module)

<!-- Writing Note -->
Also cover ic0.time() behavior and timestamps (portal: time-and-timestamps.mdx) — developers looking for "how does time work on ICP" will land here.

<!-- Cross-Links -->
- concepts/timers -- how the global timer mechanism works
- guides/canister-management/lifecycle -- timer setup during canister init
- reference/cycles-costs -- timer execution costs
