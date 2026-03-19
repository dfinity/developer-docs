---
title: "Timers"
description: "How the IC schedules periodic and one-shot tasks via the global timer mechanism"
sidebar:
  order: 8
---

TODO: Write content for this page.

<!-- Content Brief -->
Explain the global timer mechanism on ICP. Cover how the IC scheduler invokes timer callbacks, the difference between one-shot and periodic timers, comparison with the deprecated heartbeat mechanism (timers are more efficient and flexible), and scheduling guarantees (best-effort, not real-time). Focus on what developers need to understand to use timers reliably.

<!-- Source Material -->
- Portal: building-apps/integrations/periodic-tasks.mdx (conceptual parts)
- Learn Hub: https://learn.internetcomputer.org (timer mechanism)

<!-- Cross-Links -->
- guides/backends/timers -- practical how-to
- concepts/canisters -- canister execution model
