---
title: "Managing an SNS"
description: "Day-to-day management of a launched Service Nervous System"
sidebar:
  order: 4
doc_type: how-to
level: advanced
last_verified: 2026-03-10
---

After a successful decentralization swap, your SNS enters normal mode. All changes to the dapp and its governance parameters now happen through proposals voted on by the community.

## How proposals work

Every action in an SNS DAO is driven by proposals. A proposal specifies a method to call on a specific canister. When adopted, the method is executed automatically onchain.

Proposal types fall into two categories:

- **Native proposals** -- Built-in proposal types defined by the SNS framework (upgrades, parameter changes, treasury transfers).
- **Custom proposals** -- Application-specific proposal types that call methods on your dapp canisters.

### Submitting a proposal

Proposals are submitted by neurons. A neuron must have sufficient dissolve delay and stake to submit proposals (configurable in your SNS governance parameters).

```bash
# Example: submit a motion proposal using quill
quill sns make-proposal <NEURON_ID> \
  --canister-ids-file sns_canister_ids.json \
  --proposal '(record {
    title = "Motion: Update fee structure";
    url = "https://forum.dfinity.org/t/your-discussion";
    summary = "Proposal to update the fee structure...";
    action = opt variant { Motion = record { motion_text = "..." } };
  })'
```

### Voting

Token holders participate by staking tokens in neurons and voting on proposals. Neurons can follow other neurons for automatic voting on specific proposal topics.

## Upgrading dapp canisters

Canister upgrades are one of the most common SNS operations. The flow:

1. Build and test the new Wasm module.
2. Upload the Wasm to the SNS (or reference it by hash).
3. Submit an `UpgradeSnsControlledCanister` proposal.
4. Community votes.
5. If adopted, SNS root installs the new Wasm on the target canister.

```bash
quill sns make-upgrade-canister-proposal <NEURON_ID> \
  --canister-ids-file sns_canister_ids.json \
  --target-canister-id <DAPP_CANISTER_ID> \
  --wasm-path ./new_canister.wasm.gz
```

> Always publish reproducible builds so voters can verify the Wasm matches the claimed source code.

## Managing the treasury

The SNS treasury holds tokens in the governance canister's account on the SNS ledger. Treasury transfers require a `TransferSnsTreasuryFunds` proposal.

```bash
quill sns make-proposal <NEURON_ID> \
  --canister-ids-file sns_canister_ids.json \
  --proposal '(record {
    title = "Transfer 1000 tokens to dev fund";
    url = "https://forum.dfinity.org/t/dev-fund-proposal";
    summary = "Transfer tokens for development funding...";
    action = opt variant { TransferSnsTreasuryFunds = record {
      from_treasury = variant { SnsGovernanceCanister };
      to_principal = principal "RECIPIENT";
      to_subaccount = null;
      amount_e8s = 100_000_000_000;
      memo = null;
    }};
  })'
```

## Adjusting governance parameters

Governance parameters (voting period, proposal rejection fee, neuron parameters, etc.) can be modified through `ManageNervousSystemParameters` proposals.

Changes take effect immediately after the proposal is adopted.

## Adding or removing controlled canisters

To bring a new canister under SNS control:

1. Create the canister and set SNS root as its controller.
2. Submit a `RegisterDappCanisters` proposal to register it with the SNS.

To remove a canister from SNS control, submit a `DeregisterDappCanisters` proposal.

## Monitoring SNS health

Regularly monitor:

- **Cycles balances** of all SNS canisters and dapp canisters. Use tools like [CycleOps](https://cycleops.dev/) for automated top-ups.
- **Governance activity** -- Ensure proposals are being submitted and voted on. Low participation may indicate engagement issues.
- **Canister metrics** -- Memory usage, instruction counts, and error rates.

The [ICP Dashboard](https://dashboard.internetcomputer.org/) provides visibility into canister status and subnet health.

## Handling emergencies

If a critical bug is discovered:

1. Submit a high-priority upgrade proposal with a short voting period (if your governance parameters allow it).
2. Rally the community to vote quickly.
3. If the situation is dire and governance cannot respond fast enough, the NNS has the ability to intervene as a last resort (this is extremely rare and reserved for genuine emergencies).

## Community engagement best practices

- **Publish proposals on the forum first** -- Give the community time to discuss before formal voting.
- **Provide reproducible builds** -- Let voters verify that proposed Wasm upgrades match the source.
- **Maintain transparent communication** -- Regular updates build trust and encourage participation.
- **Use neuron following** -- Encourage community members to set up following relationships so proposals can reach quorum efficiently.

## Further reading

- [SNS overview](/concepts/governance/) -- Architecture and concepts.
- [Launching an SNS](/guides/governance/launching/) -- The launch process.
- [NNS dapp](https://nns.ic0.app/) -- View and participate in SNS governance.
