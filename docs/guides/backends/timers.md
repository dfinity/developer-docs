---
title: "Timers"
description: "Schedule one-shot and periodic tasks in your canister"
sidebar:
  order: 3
icskills: []
---

Canisters can schedule code to run automatically after a delay or on a repeating interval — no external cron job required. This guide covers the timer APIs for Rust and Motoko, how system time works, upgrade handling, and when to use heartbeats instead.

## System time

The IC exposes system time as nanoseconds since `1970-01-01` (Unix timestamp). The value is monotonically increasing, even across canister upgrades.

**Rust:**

```rust
let now_ns: u64 = ic_cdk::api::time();
```

**Motoko:**

```motoko
import Time "mo:core/Time";

let now_ns : Int = Time.now();
```

System time is the same for all messages in the same round. It does not advance within a single message execution.

## One-shot timers

Schedule a function to run once after a delay.

**Rust** — add `ic-cdk-timers` to `Cargo.toml`:

```rust
use ic_cdk_timers::TimerId;
use std::time::Duration;

let timer_id: TimerId = ic_cdk_timers::set_timer(
    Duration::from_secs(60),
    || ic_cdk::println!("60 seconds have passed"),
);
```

To drive an async function from a timer, use `ic_cdk::spawn`:

```rust
ic_cdk_timers::set_timer(Duration::from_secs(60), || {
    ic_cdk::spawn(async {
        // async work here
    })
});
```

**Motoko:**

```motoko
import Timer "mo:core/Timer";

func sendReminder() : async () {
    // ...
};

let timerId : Timer.TimerId = Timer.setTimer<system>(#seconds 60, sendReminder);
```

## Recurring timers

Schedule a function to run repeatedly at a fixed interval.

**Rust:**

```rust
use ic_cdk_timers::TimerId;
use std::time::Duration;

let timer_id: TimerId = ic_cdk_timers::set_timer_interval(
    Duration::from_secs(3600),
    || ic_cdk::println!("Hourly task running"),
);
```

**Motoko:**

```motoko
import Timer "mo:core/Timer";

func cleanup() : async () {
    // periodic cleanup logic
};

let timerId : Timer.TimerId = Timer.recurringTimer<system>(#seconds 3600, cleanup);
```

A duration of `0` in Motoko will only fire once, not repeatedly.

## Canceling a timer

Both one-shot and recurring timers can be canceled before they fire. Canceling an already-expired or unrecognized ID is a no-op.

**Rust:**

```rust
ic_cdk_timers::clear_timer(timer_id);
```

**Motoko:**

```motoko
Timer.cancelTimer(timerId);
```

## Starting timers on canister init

A common pattern is to start a recurring timer when the canister is first installed:

**Rust:**

```rust
#[ic_cdk_macros::init]
fn init() {
    ic_cdk_timers::set_timer_interval(
        std::time::Duration::from_secs(3600),
        || ic_cdk::println!("Hourly task"),
    );
}
```

See [Canister lifecycle](../canister-management/lifecycle.md) for init and upgrade hook details.

## Timers after upgrades

**Timers do not survive canister upgrades.** When a canister is upgraded, its Wasm state is replaced and all pending timers are cleared.

To resume timers after an upgrade, re-register them in `post_upgrade`:

**Rust:**

```rust
#[ic_cdk_macros::post_upgrade]
fn post_upgrade() {
    // Re-register the same timers as in init
    ic_cdk_timers::set_timer_interval(
        std::time::Duration::from_secs(3600),
        || ic_cdk::println!("Hourly task"),
    );
}
```

**Motoko:**

Motoko's `Timer` module handles the scheduling mechanism. If you need state from before the upgrade to configure timers (such as a stored interval), read it from stable variables in `postupgrade`:

```motoko
import Timer "mo:core/Timer";

persistent actor {
    var intervalSecs : Nat = 3600;

    system func postupgrade() {
        ignore Timer.recurringTimer<system>(#seconds intervalSecs, periodicTask);
    };
};
```

> Pre- and post-upgrade hooks are error-prone. Avoid them when possible. If your timer interval is fixed, simply re-register it unconditionally in `postupgrade` rather than saving timer IDs to stable memory.

## Cycle cost implications

Each timer execution is implemented as a self-canister call. Normal inter-canister call costs apply to each invocation. The [periodic_tasks example](https://github.com/dfinity/examples/tree/master/rust/periodic_tasks) benchmarks timers vs heartbeats and shows timers are more cost-effective than heartbeats for infrequent tasks.

Timer tasks are added to the canister's input queue. If the canister or subnet is under load, actual execution may be delayed beyond the requested interval. The timer interval is a minimum, not a guarantee.

The canister output queue is limited to 500 messages. This caps how many timers can fire in a single round.

See [Cycles and costs](../../reference/cycles-costs.md) for current pricing.

## Heartbeats (legacy)

Heartbeats call `canister_heartbeat` on every subnet block (~1 second). They predate timers and have significant drawbacks:

- Fixed ~1s interval — cannot be adjusted
- Run every block regardless of whether work is needed — burns cycles continuously
- Cannot be disabled without upgrading to remove the export

**Prefer timers for all new code.** Heartbeats are only appropriate when you need sub-second execution or must respond to every block unconditionally.

To migrate from heartbeats to timers:
1. Remove the `canister_heartbeat` export (or `system func heartbeat` in Motoko)
2. Register a recurring timer with your desired interval in `init` and `postupgrade`
3. Move the heartbeat logic into the timer callback

## How the timer mechanism works

The IC protocol supports one global timer per canister via the `ic0.global_timer_set()` system API and a `canister_global_timer` handler.

The CDK timers library (`ic-cdk-timers` for Rust, `mo:core/Timer` for Motoko) builds multiple and periodic timers on top of this single protocol timer:

1. Keeps a global list of all scheduled tasks in the canister heap
2. Calls `ic0.global_timer_set()` to schedule the next upcoming task
3. In `canister_global_timer`, runs each expired task as a self-canister call to isolate tasks from each other and from the library code
4. Reschedules recurring tasks at the end of their execution

For protocol internals, see [Timers](../../concepts/timers.md) and the [IC specification](https://learn.internetcomputer.org).

## Full example

For a complete working example with cycle tracking and multiple timers:

- [Rust periodic tasks example](https://github.com/dfinity/examples/tree/master/rust/periodic_tasks)

<!-- Upstream: informed by dfinity/portal docs/building-apps/network-features/periodic-tasks-timers.mdx and docs/building-apps/network-features/time-and-timestamps.mdx -->
