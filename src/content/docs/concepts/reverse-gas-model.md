---
title: "Reverse Gas Model"
description: "Canisters pay for computation — users never see gas fees"
sidebar:
  order: 7
doc_type: explanation
level: beginner
features: [reverse-gas]
last_verified: 2026-03-10
---

On most blockchains, users pay gas fees for every interaction. On ICP, the model is reversed: **canisters pay for their own computation and storage**, and users interact for free. This is the reverse gas model, and it is the reason ICP dapps can deliver a Web2-like user experience.

End users never need to buy tokens, configure wallets, or approve transactions just to use an application. They simply use it.

## How cycles work

Computation and storage on ICP are paid for with **cycles**. Cycles are the unit of compute on ICP, analogous to gas on Ethereum -- except they are paid by the developer, not the user.

**Pricing**: 1 trillion cycles = 1 XDR (the IMF's Special Drawing Rights basket). This peg to XDR rather than a volatile token means costs are predictable and stable.

At current exchange rates, 1 trillion cycles is approximately $1.35 USD.

## Acquiring cycles

Developers convert ICP tokens into cycles:

```bash
# Check your cycles balance
icp cycles balance

# Convert ICP to cycles and deposit into a canister
icp cycles top-up <canister-id> --amount 1T
```

Cycles can also be acquired through the Cycles Minting Canister (CMC) programmatically or via third-party services like [CycleOps](https://cycleops.dev/).

## Cost breakdown

Here are the key cost categories for canisters on a 13-node subnet:

| Resource | Cost |
|---|---|
| Canister creation | 500B cycles (~$0.65) |
| Ingress message (base) | 1.2M cycles + 2K/byte |
| Inter-canister call (base) | 260K cycles + 1K/byte |
| Query call | Free |
| Instruction execution | 0.4 cycles/instruction |
| 1 GiB storage per second | 127K cycles |
| 1 GiB storage per year | ~4T cycles (~$5.35) |
| 1% compute allocation per second | 10M cycles |

Canisters on 34-node subnets pay proportionally more: `cost_34 = cost_13 * 34 / 13`.

Use the [pricing calculator](https://3d5wy-5aaaa-aaaag-qkhsq-cai.icp0.io/) to estimate costs for your project.

## Freezing threshold

To prevent a canister from running out of cycles and being deleted, you can set a **freezing threshold**. When the canister's remaining cycles would only cover the threshold duration of idle storage costs, execution is paused -- the canister stops accepting update calls but retains all its data.

```bash
# Set a 90-day freezing threshold (in seconds)
icp canister update-settings <canister-id> --freezing-threshold 7776000
```

This gives you a window to top up the canister before any data is lost.

## Automatic top-up

For production deployments, automate cycle management:

- **[CycleOps](https://cycleops.dev/)** -- monitors your canisters and tops them up automatically
- **Programmatic top-up** -- canisters can top up other canisters using the `deposit_cycles` management canister method

## Why this matters

The reverse gas model removes the single biggest barrier to blockchain adoption: the requirement that every user hold tokens and pay transaction fees. It lets developers build applications that feel indistinguishable from traditional web apps while running entirely on-chain.

The trade-off is that developers must maintain their canisters' cycle balances. A canister that runs out of cycles will eventually be removed from the network. But with freezing thresholds and automated top-up tools, this is straightforward to manage.

## Resources

- [Cycles costs reference](/reference/cycles-costs/)
- [Monitoring canister cycles — icp-cli guide](https://dfinity.github.io/icp-cli/guides/tokens-and-cycles/#monitoring-canister-cycles)
- [Pricing calculator](https://3d5wy-5aaaa-aaaag-qkhsq-cai.icp0.io/)
