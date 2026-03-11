---
title: "Timers"
description: "Schedule autonomous canister execution without user input"
sidebar:
  order: 6
doc_type: explanation
level: intermediate
features: [timers]
last_verified: 2026-03-10
---

Canisters on ICP can execute autonomously. Unlike other blockchains where smart contracts only run in response to transactions, ICP canisters can schedule their own execution using timers -- no external triggers, no keeper bots, no cron jobs.

## Timers vs heartbeats

ICP supports two mechanisms for periodic execution:

| | Timers | Heartbeats |
|---|---|---|
| Scheduling | Arbitrary delay or interval | Fixed ~1s interval |
| Multiple per canister | Yes, each with a unique ID | One handler only |
| Cost control | Fire only when needed | Runs every round regardless |
| Recommended | Yes | Legacy only |

**Use timers for all new development.** Heartbeats are supported for backward compatibility but are less efficient and less flexible.

## How timers work

At the protocol level, each canister has a single global timer (set via `ic0.global_timer_set()`). The CDK timer libraries build on this primitive to support multiple concurrent timers:

1. The library maintains a list of scheduled tasks in heap memory.
2. It sets the global timer to the next task's deadline.
3. When the timer fires, the handler executes each due task via a self-canister call (isolating tasks from each other).
4. Periodic tasks are rescheduled at the end of their execution.

## Single-expiration timer

A one-shot timer fires once after a delay and is then discarded.

**Motoko**

```motoko
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";

actor {
    let id = Timer.setTimer<system>(#seconds 10, func () : async () {
        Debug.print("Timer fired after 10 seconds");
    });
};
```

**Rust**

```rust
use ic_cdk_timers::set_timer;
use std::time::Duration;

fn setup() {
    set_timer(Duration::from_secs(10), || {
        ic_cdk::println!("Timer fired after 10 seconds");
    });
}
```

## Periodic timer

A recurring timer fires at a fixed interval.

**Motoko**

```motoko
import Timer "mo:base/Timer";
import Debug "mo:base/Debug";

actor {
    let id = Timer.recurringTimer<system>(#seconds 60, func () : async () {
        Debug.print("Periodic task running every 60 seconds");
    });

    // Cancel later if needed:
    // Timer.cancelTimer(id);
};
```

**Rust**

```rust
use ic_cdk_timers::set_timer_interval;
use std::time::Duration;

fn setup() {
    let id = set_timer_interval(Duration::from_secs(60), || {
        ic_cdk::println!("Periodic task running every 60 seconds");
    });

    // Cancel later if needed:
    // ic_cdk_timers::clear_timer(id);
}
```

## Handling upgrades

Timer state lives in heap memory and is **cleared on canister upgrade**. If your canister uses periodic timers, you must re-register them after an upgrade.

The simplest approach is to set up timers in the `canister_post_upgrade` hook (or the `init`/`post_upgrade` entry points in your CDK):

**Rust**

```rust
#[ic_cdk::post_upgrade]
fn post_upgrade() {
    // Re-register timers after upgrade
    set_timer_interval(Duration::from_secs(60), periodic_task);
}
```

**Motoko**

```motoko
system func postupgrade() {
    ignore Timer.recurringTimer<system>(#seconds 60, periodic_task);
};
```

Note: using `pre_upgrade` and `post_upgrade` hooks for complex state serialization is error-prone and discouraged. For timers specifically, re-registering in `post_upgrade` is straightforward and safe.

## Limitations

- **Upgrade handling**: Timers are lost on upgrade. You must re-register them.
- **Self-canister call costs**: Each timer task executes via a self-canister call, so normal inter-canister call fees apply. Timers are still more cost-effective than heartbeats.
- **Queue limits**: The canister output queue is limited to 500 messages, which limits how many tasks can be scheduled in a single round.
- **Relative scheduling**: CDK timer libraries use relative time. For absolute time scheduling, calculate the duration from now to the target time.
- **DTS support**: Timer handlers support deterministic time slicing, so long-running tasks are fine.

## Resources

- [Rust `ic-cdk-timers` crate](https://crates.io/crates/ic-cdk-timers)
- [Periodic tasks example (Rust)](https://github.com/dfinity/examples/tree/master/rust/periodic_tasks) -- includes cost comparison of timers vs heartbeats
- [IC Interface Specification](/reference/ic-interface-spec/) -- system API reference
