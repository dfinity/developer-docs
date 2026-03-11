---
title: "Cycles Pricing"
description: "Reference for cycles costs of compute, storage, and network operations on ICP"
sidebar:
  order: 6
doc_type: reference
level: beginner
last_verified: 2026-03-10
---

Canisters on ICP pay for resources using **cycles**. Cycles are fixed in price against the IMF's XDR currency basket:

**1 trillion cycles = 1 XDR ~ $1.33 USD**

(The USD/XDR exchange rate fluctuates. Check the [current rate](https://www.imf.org/external/np/fin/data/rms_sdrv.aspx).)

Developers obtain cycles by converting ICP tokens. Use the [pricing calculator](https://3d5wy-5aaaa-aaaag-qkhsq-cai.icp0.io/) to estimate project costs.

## Reverse gas model

On ICP, developers pay for their application's compute and storage -- not end users. This is the **reverse gas model**. Users interact with dapps without needing tokens, wallets, or transaction approvals.

Canisters must maintain a cycles balance. A canister that runs out of cycles is frozen and eventually deleted.

## Cost summary

All costs below are for a **13-node subnet** (the standard size). For larger subnets, multiply by `(subnet_size / 13)`.

### Canister creation

| Operation | Cost |
|-----------|------|
| Create canister | 500B cycles (~$0.65) |

### Messaging

| Operation | Cost |
|-----------|------|
| Query call | Free |
| Ingress message (user to canister) | 1.2M base + 2K per byte |
| Inter-canister call | 260K base + 1K per byte |

Ingress fees are paid by the receiving canister. Inter-canister call fees are paid by the sending canister.

### Compute

| Operation | Cost |
|-----------|------|
| Update message execution | 0.4 cycles per instruction |
| Compute allocation (1% per second) | 10M cycles |

Compute allocation guarantees scheduling priority. 1% allocation ensures execution every 100 rounds.

### Storage

| Operation | Cost |
|-----------|------|
| 1 GiB for 1 second | 127K cycles |
| 1 GiB for 1 year | ~4T cycles (~$5.35) |

Storage costs apply to both Wasm heap memory and stable memory.

### Special features

| Feature | Cost |
|---------|------|
| HTTPS outcall (per call) | 49.14M base + 5.2K per request byte + 10.4K per response byte |
| Threshold ECDSA signing | 26B cycles per signature |
| Threshold Schnorr signing | 26B cycles per signature |
| Bitcoin API: `get_utxos` | 20B base + 4M per 10 instructions |
| Bitcoin API: `get_balance` | 20B base + 4M per 10 instructions |
| Bitcoin API: `send_transaction` | 5B base + 20M per transaction byte |

## Subnet replication

Costs scale with subnet size:

- **13-node subnet**: Base cost (shown above).
- **34-node subnet**: Cost = `34/13` * base cost (~2.6x).

## Storage reservation

When a subnet's memory usage exceeds 750 GiB, allocating additional memory requires reserving cycles upfront. The reservation amount increases linearly as the subnet fills toward its 2 TiB capacity.

Set `reserved_cycles_limit=0` in canister settings to opt out (but the canister will not be able to allocate memory on subnets above 750 GiB usage).

## Freezing threshold

The freezing threshold pauses a canister's execution when its cycles balance is projected to fall below a configurable amount. This prevents unexpected deletion.

The system calculates how long the canister can sustain its current resource usage and freezes it before the balance reaches zero.

## Monitoring cycles

```bash
icp canister status YOUR_CANISTER_ID
```

Automate top-ups using [CycleOps](https://cycleops.dev/) or similar services.

## Further reading

- [Execution errors](/reference/execution-errors/) -- Common errors including cycles-related failures.
- [Cycles cost calculation formulas](https://internetcomputer.org/docs/references/cycles-cost-formulas)
