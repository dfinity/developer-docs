---
title: "Timers"
description: "How the IC schedules periodic and one-shot tasks via the global timer mechanism"
sidebar:
  order: 8
---

Canisters on the Internet Computer can schedule work to run automatically — after a delay or on a repeating interval — without any external trigger. This capability is built into the protocol itself, not bolted on with an offchain scheduler.

## The global timer

At the protocol level, each canister has a single **global timer**: a nanosecond timestamp stored alongside the canister's state. When the IC's execution environment reaches that timestamp, it delivers a `canister_global_timer` message to the canister. The canister handles this message the same way it handles any update call — the message is queued, subject to instruction limits, and executed on a single thread.

Setting the timer is done through the `ic0.global_timer_set()` system API call, which takes an absolute timestamp in nanoseconds since the Unix epoch. This is the only mechanism the protocol provides directly. It is intentionally minimal: one timer, one callback, absolute time only.

The IC interface specification defines this behavior in the [timer section](../reference/ic-interface-spec.md).

## CDK timers libraries

Most developers do not use the raw system API. Instead, they use the CDK timers libraries:

- **Rust:** [`ic-cdk-timers`](https://docs.rs/ic-cdk-timers/latest/ic_cdk_timers/) — provides `set_timer`, `set_timer_interval`, `set_timer_interval_serial`, and `clear_timer`
- **Motoko:** [`mo:core/Timer`](https://mops.one/core/docs/Timer) — provides `Timer.setTimer`, `Timer.recurringTimer`, and `Timer.cancelTimer`

These libraries build **multiple and periodic timers** on top of the single protocol global timer by:

1. Maintaining a priority queue of all scheduled tasks in the canister heap
2. Calling `ic0.global_timer_set()` to set the global timer to the earliest task in the queue
3. Implementing `canister_global_timer` to run each expired task and reschedule recurring tasks
4. Resetting the global timer to the next upcoming task after each execution

Each task fires as a **self-canister call** — the library invokes the canister itself to execute the task. This isolates tasks from each other and from the scheduling logic. Normal inter-canister call costs apply to each invocation.

## One-shot vs. recurring timers

There are two timer variants:

**One-shot timers** fire once after a specified delay. The timer is deactivated after it fires. To repeat the work, you register another one-shot timer, or use a recurring timer instead.

**Recurring timers** fire repeatedly at a fixed interval. The library reschedules them automatically at the end of each execution. A recurring timer keeps running until you explicitly cancel it or the canister is upgraded.

Both variants return a `TimerId` that you can pass to the cancel function to stop the timer before it fires.

## Scheduling guarantees

Timers are **best-effort**, not real-time. The requested delay is a minimum, not a guarantee:

- Timer execution depends on the canister's input queue. If the canister or its subnet is under load, delivery may be delayed beyond the requested interval.
- The timer callback executes as an update call and is subject to the same instruction limits as any other message. Long-running callbacks can be interrupted.
- Under heavy network load, timer self-calls may time out and be rescheduled for the next global timer tick, which can slow execution significantly.
- The canister output queue is bounded (500 messages), which limits how many timers can fire in a single consensus round.

For recurring interval tasks, treat the interval as an approximate target, not an exact cadence. Make interval timer callbacks idempotent with respect to canister state to handle occasional duplicate or delayed executions safely.

## Timers and upgrades

**Timers are not persisted across canister upgrades.** The CDK timers libraries store the task queue in the canister's heap memory. When a canister is upgraded, the Wasm state is replaced and the timer queue is cleared. All pending timers are silently dropped.

If your canister needs timers to resume after an upgrade, you must re-register them explicitly — typically in the `postupgrade` hook (Motoko) or the `#[post_upgrade]` function (Rust). Read any needed configuration from stable memory or stable variables, then call the same registration logic as on initial install.

This means timer-dependent workflows must be designed with upgrade events in mind. A canister that runs an auction with a deadline stored in a timer must persist that deadline in stable storage and restore the timer on upgrade, or the deadline will be lost.

## Timers vs. heartbeats

Before timers, canisters could use **heartbeats** for periodic execution. A canister that exports `canister_heartbeat` receives a callback at approximately every subnet finalization round — roughly once per second. Heartbeats are still supported for backward compatibility, but have significant drawbacks compared to timers:

| | Timers | Heartbeats |
|---|---|---|
| Interval | Configurable, any duration | Fixed (~1s block rate) |
| Multiple tasks | Yes — a single canister can have many timers | No — one heartbeat per round |
| Cost when idle | Zero — timers only fire when needed | Always burns cycles, even if no work is done |
| Disabling | Cancel the timer ID | Must upgrade the canister to remove the export |

**Use timers for all new canisters.** Heartbeats are only appropriate in rare cases where you need to respond to every single consensus round unconditionally, or where you need sub-second granularity beyond what timer resolution allows.

Timer resolution is similar to the block rate (~1 second), so intervals well above 1 second work most reliably. For sub-second precision, heartbeats provide finer granularity at the cost of the limitations above.

## Security considerations

Timers introduce two security-relevant properties developers should understand:

**Vanishing on upgrades.** Any access control or security invariant implemented using timers will disappear silently during an upgrade. Do not rely on a timer to enforce time-bounded access, revoke permissions, or expire secrets. Use stable storage for security-critical state.

**Reentrancy.** Because each timer task executes as an inter-canister call, the canister can be re-entered at any await point — a new message, another timer callback, or a heartbeat can begin before the current timer handler finishes. If a timer handler awaits an inter-canister call and then reads or writes shared state, that state may have changed by the time execution resumes. Use `set_timer_interval_serial` (Rust) to prevent concurrent invocations of the same recurring timer, and audit any state mutations that straddle await points.

## Next steps

- [Timers guide](../guides/backends/timers.md) — practical API usage for Rust and Motoko
- [Canisters](canisters.md) — the canister execution model
- [IC interface specification](../reference/ic-interface-spec.md) — the protocol-level timer definition

<!-- Upstream: informed by dfinity/portal docs/building-apps/network-features/periodic-tasks-timers.mdx, dfinity/cdk-rs ic-cdk-timers/src/lib.rs, caffeinelabs/motoko doc/md/core/Timer.md -->
