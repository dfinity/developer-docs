---
title: "Resource limits"
description: "Execution constraints for canisters: instruction limits, memory caps, message sizes, Wasm module limits, and thread counts"
sidebar:
  order: 9
---

ICP uses WebAssembly as the execution environment for canisters. Because WebAssembly is [Turing-complete](https://en.wikipedia.org/wiki/Turing_completeness), the IC enforces resource limits to prevent non-terminating computations and ensure fair scheduling across all canisters on a [subnet](../concepts/network-overview.md#subnets).

## Message limits

| Limit | Value |
|-------|-------|
| Message queue limit (between a canister pair) | 500 |
| Max ingress message payload | 2 MiB |
| Max cross-subnet inter-canister message payload | 2 MiB |
| Max same-subnet inter-canister request payload | 10 MiB |
| Max response size (replicated execution) | 2 MiB |
| Max response size (non-replicated execution, query calls) | 3 MiB |

## Instruction limits

| Limit | Value |
|-------|-------|
| Per update call, heartbeat, or timer | 40 billion |
| Per query call | 5 billion |
| Per canister install or upgrade | 300 billion |
| Per `inspect_message` | 200 million |
| Per round per execution thread | 7 billion |

## Memory limits

| Limit | Value |
|-------|-------|
| Wasm heap memory per canister | 4 GiB (wasm32), 6 GiB (wasm64) |
| Wasm stable memory per canister | 500 GiB |
| Stable memory read per replicated message | 2 GiB |
| Stable memory written per replicated message | 2 GiB |
| Stable memory read per upgrade message | 8 GiB |
| Stable memory written per upgrade message | 8 GiB |
| Stable memory read per replicated query | 1 GiB |
| Stable memory written per replicated query | 1 GiB |

## Wasm module limits

| Limit | Value |
|-------|-------|
| Wasm total size per canister | 100 MiB |
| Wasm code section per canister | 10 MiB |
| Custom sections per subnet | 2 GiB |
| Custom sections per canister | 1 MiB |
| Custom section count per canister | 16 |
| Function name length | 1 MiB |

## Subnet limits

| Limit | Value |
|-------|-------|
| Subnet capacity (total memory) | 2 TiB |
| Snapshots per canister | 10 |

## Execution thread limits

| Limit | Value |
|-------|-------|
| Query execution threads per replica node | 4 |
| Query execution threads per canister | 2 |
| Update execution threads per subnet | 4 |
| Update execution threads per canister | 1 |

## Canister environment variables

| Limit | Value |
|-------|-------|
| Environment variables per canister | 20 |
| Variable name length | 128 bytes |
| Variable value length | 128 bytes |

## Performance characteristics

Block production rate varies from 0.75 to 1.5 blocks per second depending on [subnet](../concepts/network-overview.md#subnets) load and node count. Up to 1,000 messages can be included in a block. Because ICP decouples message reception from message execution, messages included in a block are not guaranteed to execute in the same block. Messages for different canisters may execute in parallel across up to 4 execution threads, each capable of handling up to 1,000 messages. ICP targets a throughput of 2 billion Wasm instructions per thread per second.

## Additional notes

The expiration time of an ingress message is set by the agent making the request and can be up to 5 minutes.

The IC rejects Wasm modules that exceed these structural limits:

- More than 50,000 declared functions
- More than 1,000 declared globals
- A function body containing more than 1,000,000 Wasm instructions
- More than 16 exported custom sections (names prefixed with `icp:`)
- More than 1,000 exported `canister_update <name>` or `canister_query <name>` functions
- Combined `<name>` lengths across all exported update and query functions exceeding 20,000 characters
- Total exported custom sections size exceeding 1 MiB

For the full specification of these constraints, see [WebAssembly module requirements](ic-interface-spec/canister-interface.md#system-api-module).

## Related pages

- [Cycle costs](cycle-costs.md): Billing rates for instructions, storage, and messaging
- [Subnet types](subnet-types.md): Subnet-specific constraints and cost multipliers
- [Canister optimization](../guides/canister-management/optimization.md): Reducing instruction count and memory footprint

<!-- Upstream: informed by dfinity/portal docs/building-apps/canister-management/resource-limits.mdx -->
