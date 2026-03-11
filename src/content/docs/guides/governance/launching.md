---
title: "Launching an SNS"
description: "Step-by-step guide to launching a Service Nervous System for your dapp"
sidebar:
  order: 2
doc_type: how-to
level: advanced
icskills: [sns-launch]
last_verified: 2026-03-10
---

Launching an SNS transfers control of your dapp to a decentralized community. This is a multi-stage process that involves configuration, an NNS community vote, and a decentralization swap. Once launched, an SNS cannot be undone -- thorough preparation is essential.

## Prerequisites

Before starting the launch process:

- Your dapp canisters are deployed and operational on mainnet.
- You have tested the full SNS launch process locally. See [Testing SNS launch](/guides/governance/testing/).
- Your team has engaged with the community and prepared tokenomics documentation.
- You understand the [SNS architecture](/concepts/governance/).

## Stage 1: Define SNS init parameters

Create an SNS configuration file that defines:

**Token settings:**
- Token name and symbol.
- Ledger transaction fee.
- Initial token distribution (treasury, developer neurons, swap allocation).

**Governance settings:**
- Proposal types and voting thresholds.
- Neuron dissolve delays and voting power.
- Reward parameters.

**Swap conditions:**
- Minimum and maximum ICP to collect.
- Minimum number of participants.
- Swap start time and duration.
- SNS token price (derived from total tokens offered and ICP target).

These parameters are encoded in a `sns_init.yaml` file. Use the SNS CLI to validate them:

```bash
sns-cli validate --init-config-file sns_init.yaml
```

### Initial neurons

The init parameters define initial neurons that control the SNS during the launch process (before the swap completes). These neurons must be set up so that proposals can be submitted and adopted during launch -- for example, to upgrade dapp canisters or register custom proposal types.

> Some frontends (like the NNS dapp) do not display neurons for SNS DAOs that are not yet fully launched. Ensure your initial neurons can be operated through other means during the launch window.

## Stage 2: Add NNS root as co-controller

Shortly before submitting the NNS proposal, add the NNS root canister as a co-controller of your dapp canisters:

```bash
icp canister update-settings YOUR_CANISTER_ID \
  --add-controller r7inp-6aaaa-aaaaa-aaabq-cai
```

This step is required so that the NNS can transfer control of your dapp to the SNS automatically. You should also remove yourself from any asset canister allowlists at this point.

## Stage 3: Submit the NNS proposal

Submit a `CreateServiceNervousSystem` proposal to the NNS:

```bash
icp canister call rrkah-fqaaa-aaaaa-aaaaq-cai manage_neuron '(record {
  id = opt record { id = YOUR_NEURON_ID };
  command = opt variant { MakeProposal = record {
    title = opt "Create SNS for MyDapp";
    url = "https://forum.dfinity.org/t/your-proposal-discussion";
    summary = "Proposal to create an SNS DAO for MyDapp...";
    action = opt variant { CreateServiceNervousSystem = <YOUR_SNS_INIT_PARAMS> };
  }};
})'
```

Only one `CreateServiceNervousSystem` proposal can be active at a time.

## Stage 4: NNS vote

The NNS community votes on your proposal. If adopted, the remaining stages execute automatically.

If rejected or if preconditions are not met (e.g., NNS root is not a co-controller), the dapp's control returns to the original developers.

## Stages 5-7: Automatic SNS creation

These stages run without manual intervention:

1. **SNS-W deploys SNS canisters** (governance, ledger, root, swap, index) on the SNS subnet.
2. **SNS root becomes the sole controller** of your dapp canisters, removing the original developers and NNS root.
3. **SNS canisters are initialized** with your parameters in pre-decentralization-swap mode.

At this point, your dapp is under SNS DAO control, but the governance is not yet fully active.

## Stage 8-9: Decentralization swap

The swap opens according to the configured start time (at least 24 hours after proposal execution). Participants send ICP to the swap canister in exchange for SNS tokens.

The swap ends when:
- The maximum ICP target is reached, or
- The configured end time passes.

## Stage 10-11: Finalization

If the swap meets the minimum participation threshold:
- The exchange rate is determined.
- SNS tokens are distributed to participants as neurons.
- The SNS governance enters normal mode.

If the swap fails:
- The dapp's control returns to the original developers.
- Contributed ICP is refunded to all participants.

## Common pitfalls

- **Insufficient community engagement** -- SNS proposals are more likely to pass when the community understands and supports the project.
- **Misconfigured init parameters** -- Validate thoroughly. Wrong dissolve delays or voting thresholds can make governance difficult post-launch.
- **Not testing end-to-end** -- Always test the full flow locally before proposing on mainnet.
- **Forgetting to add NNS root** -- The proposal execution will fail if NNS root is not a co-controller.

## Further reading

- [Testing SNS launch](/guides/governance/testing/) -- Pre-launch validation.
- [Managing an SNS](/guides/governance/managing/) -- Post-launch operations.
- [SNS tokenomics checklist](https://wiki.internetcomputer.org/wiki/How-To:_SNS_Tokenomics_Configuration)
