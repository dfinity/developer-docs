---
title: "Canister Logs"
description: "Monitor and debug canisters using logging on the Internet Computer."
sidebar:
  order: 3
doc_type: how-to
level: intermediate
features: []
icskills: []
last_verified: 2026-03-10
---

Canister logging gives you insight into canister behavior and helps debug issues, including traps. Logs are persisted even when execution traps, making them valuable for diagnosing failures in production.

## Supported contexts

Log messages are captured during:

- Update calls
- Heartbeats and timers
- `canister_init`, `pre_upgrade`, and `post_upgrade`
- Queries (only in replicated mode)

Non-replicated query calls do not produce logs.

## Emitting logs

### Motoko

Use `Debug.print` to emit log messages:

```motoko
import Debug "mo:base/Debug";

actor {
  public func process() : async () {
    Debug.print("Processing started");
    // ... logic ...
    Debug.print("Processing complete");
  };
}
```

### Rust

Use `ic_cdk::println!` to write to the canister log:

```rust
use ic_cdk::println;

#[ic_cdk::update]
fn process() {
    println!("Processing started");
    // ... logic ...
    println!("Processing complete");
}
```

You can also use the `Debug` trait for structured formatting:

```rust
#[derive(Debug)]
struct Transfer {
    from: String,
    to: String,
    amount: u64,
}

#[ic_cdk::update]
fn transfer(from: String, to: String, amount: u64) {
    let t = Transfer { from, to, amount };
    println!("Executing transfer: {:?}", t);
}
```

## Retrieving logs

```bash
icp canister logs my_canister
```

Logs are returned with timestamps and sequential indices. Each canister stores a fixed-size log buffer; older entries are evicted as new ones arrive.

## Log visibility

By default, only controllers can read a canister's logs. You can make logs public:

```bash
icp canister update-settings my_canister --log-visibility public
```

### Log viewer allow lists

You can grant specific principals access to logs without making them fully public:

```bash
# Set a single log viewer
icp canister update-settings my_canister --set-log-viewer <principal-id>

# Add a viewer to the allow list
icp canister update-settings my_canister --add-log-viewer <principal-id>

# Remove a viewer
icp canister update-settings my_canister --remove-log-viewer <principal-id>
```

You can also set log viewers at canister creation time:

```bash
icp canister create my_canister --log-viewer <principal-id>
```

Or configure them in `icp.yaml`:

```yaml
canisters:
  - name: my_canister
    settings:
      log_visibility:
        allowed_viewers:
          - "<principal-id>"
```

## Debugging tips

- **Add context to log messages.** Include function names, relevant IDs, and variable values to make logs actionable.
- **Log at boundaries.** Emit logs at the start and end of important operations to trace execution flow.
- **Use logs to diagnose traps.** Logs emitted before a trap are preserved, so they can help pinpoint where execution failed.
- **Monitor cycle consumption.** Log instruction counts at key points using `ic_cdk::api::instruction_counter()` (Rust) to profile performance.

## Next steps

- [Canister settings](/guides/canisters/settings/) -- configure log visibility and other canister settings
- [Canister settings reference](https://dfinity.github.io/icp-cli/reference/canister-settings/) -- log visibility and other settings
