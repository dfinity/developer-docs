---
title: "Canister Logs"
description: "Debug and monitor canisters using the logging API, query statistics, and access log streaming"
sidebar:
  order: 3
---

Canister logs help you understand what your canister is doing at runtime, including during traps. The Internet Computer captures log output from update calls, timers, heartbeats, and lifecycle hooks: even when the canister traps mid-execution. Logs are retrievable by canister controllers and optionally by other principals.

## Writing log messages

Both Rust and Motoko support printing messages to the canister log.

**Rust**: use `ic_cdk::println!`:

```rust
use ic_cdk::{init, update};

#[init]
fn init() {
    ic_cdk::println!("Canister initialized");
}

#[update]
fn process(value: u64) -> u64 {
    ic_cdk::println!("Processing value: {}", value);
    value * 2
}
```

The `ic_cdk::println!` macro formats a string and writes it to the canister log on the IC. Outside of Wasm (for example in unit tests), it falls back to `std::println!`.

**Motoko**: use `Debug.print` from `mo:core/Debug`:

```motoko
import Debug "mo:core/Debug";

persistent actor {
  public func process(value : Nat) : async Nat {
    Debug.print("Processing value: " # debug_show(value));
    value * 2
  };
};
```

`Debug.print` writes to the canister log when running on the IC. In other environments such as the Motoko interpreter, it writes to standard output.

### What logging captures

Log messages are recorded for:

- Update calls
- Timer and heartbeat executions
- `canister_init`, `canister_pre_upgrade`, and `canister_post_upgrade` hooks
- Query calls executed in **replicated mode** (non-replicated queries are not logged)

Log storage is capped at 4096 bytes by default. When the log buffer is full, the oldest entries are purged. You can increase this limit up to 2 MiB (see [Log memory limit](#log-memory-limit)).

## Viewing canister logs

To fetch and display the logs for a canister:

```bash
icp canister logs <canister-name> -e local
```

To follow logs in real time (polls every 2 seconds by default):

```bash
icp canister logs <canister-name> -e local --follow
```

To adjust the polling interval:

```bash
icp canister logs <canister-name> -e local --follow --interval 5
```

To fetch logs on mainnet, use `-e ic`:

```bash
icp canister logs <canister-name> -e ic
```

### Filtering by timestamp or index

You can scope log output to a specific time range or index range.

By timestamp (RFC3339 or nanoseconds since Unix epoch):

```bash
icp canister logs <canister-name> -e ic \
  --since 2024-01-01T00:00:00Z \
  --until 2024-01-02T00:00:00Z
```

By log entry index:

```bash
icp canister logs <canister-name> -e ic --since-index 100 --until-index 200
```

Timestamp and index filters cannot be combined with `--follow`.

To output logs as JSON for programmatic processing:

```bash
icp canister logs <canister-name> -e ic --json
```

## Log visibility

By default, only the canister's controllers can read its logs. You can make logs visible to everyone, or grant read access to specific principals.

### Making logs public

```bash
icp canister settings update <canister-name> -e ic --log-visibility public
```

To revert to controller-only visibility:

```bash
icp canister settings update <canister-name> -e ic --log-visibility controllers
```

### Granting specific principals access

To allow a principal to view logs without making them public:

```bash
icp canister settings update <canister-name> -e ic \
  --add-log-viewer <principal-id>
```

To replace the current set of allowed viewers with a single principal:

```bash
icp canister settings update <canister-name> -e ic \
  --set-log-viewer <principal-id>
```

To revoke access for a principal:

```bash
icp canister settings update <canister-name> -e ic \
  --remove-log-viewer <principal-id>
```

### Setting log visibility in icp.yaml

You can configure log visibility per canister in `icp.yaml` so it is applied on every `icp deploy`:

```yaml
canisters:
  - name: backend
    recipe:
      type: "@dfinity/rust@v3.2.0"
      configuration:
        package: backend
    settings:
      log_visibility: controllers   # "controllers" | "public" | allowed_viewers object
```

To grant access to specific principals in the config:

```yaml
    settings:
      log_visibility:
        allowed_viewers:
          - "aaaaa-aa"
          - "2vxsx-fae"
```

## Log memory limit

The default log buffer size is 4096 bytes. When the buffer fills up, older log entries are automatically purged to make room for new ones. You can increase the limit up to 2 MiB:

```bash
icp canister settings update <canister-name> -e ic --log-memory-limit 2mib
```

Supported suffixes: `kb` (1,000 bytes), `kib` (1,024 bytes), `mb` (1,000,000 bytes), `mib` (1,048,576 bytes). In `icp.yaml`:

```yaml
    settings:
      log_memory_limit: 2mib
```

## Backtrace debugging

When a canister traps, ICP records a **backtrace**: the function call stack at the point of the trap: and appends it to the canister logs. If the caller has [log access](#log-visibility), the backtrace also appears in the error response they receive.

For example, if a Rust canister performs an out-of-bounds stable memory write:

```rust
#[update]
fn outer() {
    inner();
}

fn inner() {
    inner_2();
}

fn inner_2() {
    // Note: `ic_cdk::api::stable` is deprecated since ic-cdk 0.18.0.
    // Use `ic_cdk::stable::stable_write` instead.
    ic_cdk::api::stable::stable_write(0xdeadbeef, b"foo");
}
```

The log will contain output similar to:

```text
Canister Backtrace:
ic0::ic0::stable64_write
_wasm_backtrace_canister::inner_2
_wasm_backtrace_canister::inner
_wasm_backtrace_canister::outer
```

This pinpoints that the trap occurred in `inner_2`, called via `outer` → `inner`.

### Verifying backtrace support

Backtraces require function names to be stored in the Wasm `name` custom section. Any canister built with the standard icp-cli recipes includes this section automatically.

If you post-process the Wasm with `ic-wasm` (for example to shrink or optimize it), pass `--keep-name-section` to preserve function names:

```bash
ic-wasm canister.wasm -o canister.wasm shrink --keep-name-section
ic-wasm canister.wasm -o canister.wasm optimize O2 --keep-name-section
```

This requires `ic-wasm` version 0.8.6 or later.

To verify the `name` section is present in a Wasm binary, use [`wasm-objdump`](https://github.com/WebAssembly/wabt) and look for a `Custom` section named `"name"`:

```bash
wasm-objdump -h canister.wasm
```

You should see a line like:

```text
Custom start=0x001e3467 end=0x001e60a6 (size=0x00002c3f) "name"
```

If the `"name"` section is absent, backtraces will not be available.

## Query statistics

Each canister exposes cumulative statistics about its query call traffic. These are available through the [management canister](../../references/management-canister.md)'s `canister_status` method.

The statistics are cumulative since the canister was created. They are updated approximately once per epoch rather than in real time.

<!-- TODO: verify whether query stats reset on reinstall/upgrade — per IC spec, query_stats is only initialized on canister creation; no reset occurs on reinstall or upgrade -->
<!-- TODO: verify epoch duration for query stats -->

**Rust**: read query stats from `canister_status`:

```rust
use ic_cdk::{management_canister, update};
use ic_cdk::management_canister::CanisterIdRecord;

#[update]
async fn print_query_stats() -> String {
    let status = management_canister::canister_status(
        &CanisterIdRecord { canister_id: ic_cdk::id() }
    )
    .await
    .expect("canister_status failed");

    let qs = &status.query_stats;
    format!(
        "calls: {} | instructions: {} | request bytes: {} | response bytes: {}",
        qs.num_calls_total,
        qs.num_instructions_total,
        qs.request_payload_bytes_total,
        qs.response_payload_bytes_total,
    )
}
```

**Motoko**: call `canister_status` on the management canister:

```motoko
import Principal "mo:core/Principal";

persistent actor QueryStats {

  transient let IC = actor "aaaaa-aa" : actor {
    canister_status : { canister_id : Principal } -> async {
      query_stats : {
        num_calls_total : Nat;
        num_instructions_total : Nat;
        request_payload_bytes_total : Nat;
        response_payload_bytes_total : Nat;
      };
    };
  };

  public func get_query_stats() : async Text {
    let stats = await IC.canister_status({
      canister_id = Principal.fromActor(QueryStats);
    });
    let qs = stats.query_stats;
    "calls: " # debug_show(qs.num_calls_total)
      # " | instructions: " # debug_show(qs.num_instructions_total)
      # " | request bytes: " # debug_show(qs.request_payload_bytes_total)
      # " | response bytes: " # debug_show(qs.response_payload_bytes_total)
  };
};
```

### Query statistics fields

| Field | Description |
|-------|-------------|
| `num_calls_total` | Total number of query calls made to the canister |
| `num_instructions_total` | Total instructions executed across all query calls |
| `request_payload_bytes_total` | Total bytes of query call request payloads |
| `response_payload_bytes_total` | Total bytes of query call response payloads |

These cumulative totals accumulate since the canister was created.

## Streaming access logs from API boundary nodes

API boundary nodes (API BNs) handle all incoming requests and log every request they process. You can stream these access logs in real time for a canister. This is especially useful for observing query call traffic, which is otherwise not visible in canister logs.

A complete working implementation in Rust is available at [dfinity/ic-bn-logs](https://github.com/dfinity/ic-bn-logs).

### Access log format

Each access log entry is a JSON object. Key fields:

| Field | Description |
|-------|-------------|
| `ic_canister_id` | Principal ID of the target canister |
| `ic_method` | Canister method that was called |
| `request_type` | `query`, `call`, `sync_call`, or `read_state` |
| `http_status` | HTTP response code |
| `duration` | Request processing time in seconds |
| `timestamp` | UTC timestamp (ISO 8601 with nanosecond precision) |
| `cache_status` | `HIT`, `MISS`, `BYPASS`, or `DISABLED` |
| `error_cause` | Error category if the request failed |
| `client_id` | Salted hash of client IP + sender principal |

Example entry:

```json
{
  "cache_status": "DISABLED",
  "client_id": "ab6e7b821eb97295e3d20cec94160288",
  "duration": 0.028693668,
  "http_status": 200,
  "ic_canister_id": "qoctq-giaaa-aaaaa-aaaea-cai",
  "ic_method": "http_request",
  "request_type": "query",
  "response_size": 2818,
  "timestamp": "2025-07-17T08:12:39.964131788Z"
}
```

### Connecting to the WebSocket endpoint

API BNs expose access logs over WebSocket. The URL format is:

```text
wss://{api_bn_domain}/logs/canister/{canister_id}
```

For full coverage, connect to **all** API BNs: each node only streams the requests it handles, and traffic is distributed across nodes.

To discover the current list of API BN domains, fetch them from the IC's certified state using `agent-rs`:

```rust
use candid::Principal;
use ic_agent::Agent;
use anyhow::Result;

#[tokio::main]
async fn main() -> Result<()> {
    let agent = Agent::builder()
        .with_url("https://icp-api.io")
        .build()?;

    let subnet_id = Principal::from_text(
        "tdb26-jop6k-aogll-7ltgs-eruif-6kk7m-qpktf-gdiqx-mxtrf-vb5e6-eqe"
    )?;
    let api_bns = agent
        .fetch_api_boundary_nodes_by_subnet_id(subnet_id)
        .await?;

    for node in &api_bns {
        println!("wss://{}/logs/canister/<canister_id>", node.domain);
    }

    Ok(())
}
```

## Next steps

- [Canister lifecycle](lifecycle.md): configure log visibility and memory limits when creating or deploying a canister
- [Testing strategies](../testing/strategies.md): use canister logs as part of your debugging workflow
- [CLI reference: `icp canister logs`](https://cli.internetcomputer.org/0.2/reference/cli#icp-canister-logs): full command flags and options
- [CLI reference: `icp canister settings update`](https://cli.internetcomputer.org/0.2/reference/cli#icp-canister-settings-update): full command flags and options

<!-- Upstream: informed by dfinity/portal — docs/building-apps/canister-management/logs.mdx, docs/building-apps/canister-management/backtraces.mdx, docs/building-apps/advanced/canister-access-logs.mdx; dfinity/examples — rust/canister_logs, motoko/canister_logs, rust/query_stats, motoko/query_stats; dfinity/cdk-rs — ic-cdk/src/api.rs, ic-cdk/src/management_canister.rs, ic-management-canister-types/src/lib.rs; dfinity/icp-cli — docs/reference/cli.md, docs/reference/canister-settings.md -->
